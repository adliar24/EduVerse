import { getSupabaseClient, supabase } from './supabase';
import { getFullState, initDB, saveTeacherProfile, setSkipSync } from './dbAttendance';
import { TeacherProfile } from '../types';

// Tables to sync
const TABLES = ['classes', 'students', 'sessions', 'records', 'schedules', 'events', 'cancellations', 'materials', 'assignments'];

// Helper to map local table names to cloud table names
const getCloudTableName = (tableName: string): string => {
  if (tableName === 'sessions') return 'attendance_sessions';
  if (tableName === 'records') return 'attendance_records';
  return tableName;
};

// Helper to map local IndexedDB objects to Supabase snake_case schema format
const mapToCloud = (tableName: string, item: any, userId: string): any => {
  const activeSchoolId = typeof window !== 'undefined' ? localStorage.getItem('active_school_id') : null;
  // Force activeSchoolId if it exists to prevent foreign key errors with legacy/backup school IDs
  const schoolId = (activeSchoolId && activeSchoolId !== 'legacy') ? activeSchoolId : (item.school_id || item.schoolId || null);
  
  let syncItem: any = { ...item, teacher_id: userId };
  
  if (schoolId) {
    syncItem.school_id = schoolId;
  }

  if (tableName === 'classes') {
    syncItem.school_id = schoolId || null;
    syncItem.name = item.name || item.namaKelas;
    syncItem.subject = item.subject || item.mapel;
    syncItem.created_at = item.created_at || item.createdAt;
    
    delete syncItem.namaKelas;
    delete syncItem.mapel;
    delete syncItem.createdAt;
    delete syncItem.schoolId;
    delete syncItem.schoolIndex;
  }
  
  if (tableName === 'students') {
    syncItem.school_id = schoolId || null;
    syncItem.class_id = item.class_id || item.classId || item.idKelas || null;
    syncItem.name = item.name || item.nama;
    syncItem.created_at = item.created_at || item.createdAt;
    if (item.face_embedding) {
      syncItem.face_vector = item.face_embedding;
      syncItem.face_embedding = item.face_embedding;
    }
    
    delete syncItem.classId;
    delete syncItem.idKelas;
    delete syncItem.nama;
    delete syncItem.createdAt;
    delete syncItem.schoolId;
    delete syncItem.idSiswa;
  }
  
  if (tableName === 'sessions') {
    syncItem.school_id = schoolId || null;
    syncItem.class_id = item.classId || item.class_id;
    syncItem.school_year = item.schoolYear;
    syncItem.date_iso = item.dateISO;
    syncItem.day_name = item.dayName;
    syncItem.date_label = item.dateLabel;
    syncItem.meeting_number = item.meetingNumber;
    syncItem.topic = item.topic;
    syncItem.schedule_id = item.scheduleId || item.schedule_id || null;
    syncItem.created_at = item.created_at || item.createdAt;
    
    syncItem.is_closed = item.isClosed || false;
    
    delete syncItem.classId;
    delete syncItem.schoolYear;
    delete syncItem.dateISO;
    delete syncItem.dayName;
    delete syncItem.dateLabel;
    delete syncItem.meetingNumber;
    delete syncItem.scheduleId;
    delete syncItem.createdAt;
    delete syncItem.schoolId;
    delete syncItem.isClosed;
  }
  
  if (tableName === 'records') {
    syncItem.school_id = schoolId || null;
    syncItem.session_id = item.sessionId || item.session_id;
    syncItem.student_id = item.studentId || item.student_id;
    syncItem.time_iso = item.timeISO;
    syncItem.time_hhmmss = item.timeHHMMSS;
    syncItem.created_at = item.created_at || item.createdAt;
    
    delete syncItem.sessionId;
    delete syncItem.studentId;
    delete syncItem.timeISO;
    delete syncItem.timeHHMMSS;
    delete syncItem.createdAt;
    delete syncItem.schoolId;
  }
  
  if (tableName === 'schedules') {
    syncItem.school_id = schoolId || null;
    syncItem.day_name = item.dayName;
    syncItem.class_id = item.classId || item.class_id;
    syncItem.start_time = item.startTime;
    syncItem.end_time = item.endTime;
    
    delete syncItem.dayName;
    delete syncItem.classId;
    delete syncItem.startTime;
    delete syncItem.endTime;
    delete syncItem.schoolId;
  }
  
  if (tableName === 'events') {
    syncItem.school_id = schoolId || null;
    syncItem.date_iso = item.dateISO;
    syncItem.is_full_day = item.isFullDay;
    syncItem.start_time = item.startTime;
    syncItem.end_time = item.endTime;
    syncItem.created_at = item.created_at || item.createdAt;
    
    delete syncItem.dateISO;
    delete syncItem.isFullDay;
    delete syncItem.startTime;
    delete syncItem.endTime;
    delete syncItem.createdAt;
    delete syncItem.schoolId;
  }
  
  if (tableName === 'cancellations') {
    syncItem.school_id = schoolId || null;
    syncItem.date_iso = item.dateISO;
    syncItem.class_id = item.classId || item.class_id;
    syncItem.schedule_id = item.scheduleId || item.schedule_id || null;
    
    delete syncItem.dateISO;
    delete syncItem.classId;
    delete syncItem.scheduleId;
    delete syncItem.schoolId;
  }

  if (tableName === 'materials') {
    syncItem.school_id = schoolId || null;
    syncItem.class_id = item.classId || item.class_id || null;
    syncItem.title = item.title;
    syncItem.description = item.description;
    syncItem.link = item.link || null;
    syncItem.target_type = item.targetType || item.target_type || 'class';
    syncItem.student_ids = item.studentIds || item.student_ids || [];
    syncItem.created_at = item.created_at || item.createdAt;

    delete syncItem.classId;
    delete syncItem.targetType;
    delete syncItem.studentIds;
    delete syncItem.createdAt;
    delete syncItem.schoolId;
  }

  if (tableName === 'assignments') {
    syncItem.school_id = schoolId || null;
    syncItem.class_id = item.classId || item.class_id || null;
    syncItem.title = item.title;
    syncItem.description = item.description;
    syncItem.link = item.link || null;
    syncItem.deadline = item.deadline || null;
    syncItem.target_type = item.targetType || item.target_type || 'class';
    syncItem.student_ids = item.studentIds || item.student_ids || [];
    syncItem.created_at = item.created_at || item.createdAt;

    delete syncItem.classId;
    delete syncItem.targetType;
    delete syncItem.studentIds;
    delete syncItem.createdAt;
    delete syncItem.schoolId;
  }
  
  return syncItem;
};

// Helper to map cloud snake_case schema format back to local IndexedDB objects (with both EduCheck and EduScore compatibility keys)
const mapToLocal = (tableName: string, cloudItem: any): any => {
  let item: any = { ...cloudItem };
  
  if (tableName === 'classes') {
    item.schoolId = cloudItem.school_id;
    item.school_id = cloudItem.school_id;
    item.createdAt = cloudItem.created_at;
    item.idKelas = cloudItem.id;
    item.namaKelas = cloudItem.name;
    item.mapel = cloudItem.subject;
  }
  
  if (tableName === 'students') {
    item.classId = cloudItem.class_id;
    item.class_id = cloudItem.class_id;
    item.schoolId = cloudItem.school_id;
    item.school_id = cloudItem.school_id;
    item.createdAt = cloudItem.created_at;
    item.idKelas = cloudItem.class_id;
    item.idSiswa = cloudItem.id;
    item.nama = cloudItem.name;
    
    if (cloudItem.face_vector && !cloudItem.face_embedding) {
      item.face_embedding = cloudItem.face_vector;
    }
  }
  
  if (tableName === 'sessions') {
    item.classId = cloudItem.class_id;
    item.schoolYear = cloudItem.school_year;
    item.dateISO = cloudItem.date_iso;
    item.dayName = cloudItem.day_name;
    item.dateLabel = cloudItem.date_label;
    item.meetingNumber = cloudItem.meeting_number;
    item.scheduleId = cloudItem.schedule_id;
    item.createdAt = cloudItem.created_at;
    item.schoolId = cloudItem.school_id;
    item.school_id = cloudItem.school_id;
    item.isClosed = !!cloudItem.is_closed;
  }
  
  if (tableName === 'records') {
    item.sessionId = cloudItem.session_id;
    item.studentId = cloudItem.student_id;
    item.timeISO = cloudItem.time_iso;
    item.timeHHMMSS = cloudItem.time_hhmmss;
    item.schoolId = cloudItem.school_id;
    item.school_id = cloudItem.school_id;
  }
  
  if (tableName === 'schedules') {
    item.dayName = cloudItem.day_name;
    item.classId = cloudItem.class_id;
    item.startTime = cloudItem.start_time;
    item.endTime = cloudItem.end_time;
    item.schoolId = cloudItem.school_id;
    item.school_id = cloudItem.school_id;
  }
  
  if (tableName === 'events') {
    item.dateISO = cloudItem.date_iso;
    item.isFullDay = cloudItem.is_full_day;
    item.startTime = cloudItem.start_time;
    item.endTime = cloudItem.end_time;
    item.createdAt = cloudItem.created_at;
    item.schoolId = cloudItem.school_id;
    item.school_id = cloudItem.school_id;
  }
  
  if (tableName === 'cancellations') {
    item.dateISO = cloudItem.date_iso;
    item.classId = cloudItem.class_id;
    item.scheduleId = cloudItem.schedule_id;
    item.schoolId = cloudItem.school_id;
    item.school_id = cloudItem.school_id;
  }

  if (tableName === 'materials') {
    item.classId = cloudItem.class_id;
    item.class_id = cloudItem.class_id;
    item.schoolId = cloudItem.school_id;
    item.school_id = cloudItem.school_id;
    item.targetType = cloudItem.target_type;
    item.target_type = cloudItem.target_type;
    item.studentIds = cloudItem.student_ids;
    item.student_ids = cloudItem.student_ids;
    item.createdAt = cloudItem.created_at;
  }

  if (tableName === 'assignments') {
    item.classId = cloudItem.class_id;
    item.class_id = cloudItem.class_id;
    item.schoolId = cloudItem.school_id;
    item.school_id = cloudItem.school_id;
    item.targetType = cloudItem.target_type;
    item.target_type = cloudItem.target_type;
    item.studentIds = cloudItem.student_ids;
    item.student_ids = cloudItem.student_ids;
    item.createdAt = cloudItem.created_at;
  }
  
  return item;
};

export const syncService = {
  // --- AUTH ---
  async signUp(email: string, pass: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, pass: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  },

  async getUser() {
    if (!supabase) return null;
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    } catch {
      return null;
    }
  },

  isConfigured(): boolean {
    return supabase !== null;
  },

  // --- SYNC CORE ---
  
  /**
   * PUSH: Menyalin data IndexedDB lokal ke Supabase Cloud
   */
  async pushToCloud(): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping push');
      return { success: false, message: 'Supabase belum dikonfigurasi' };
    }
    
    const client = getSupabaseClient();
    const user = await this.getUser();
    console.log('[pushToCloud] User:', user?.id);
    
    if (!user) {
      return { success: false, message: 'Silakan login untuk sinkronisasi' };
    }

    setSkipSync(true);

    try {
      const state = await getFullState();
      console.log('[pushToCloud] State to push:', {
        teacher: state.teacher?.teacherName,
        classes: state.classes.length,
        students: state.students.length
      });
      
      // 1. Sync Teacher Profile
      if (state.teacher) {
        console.log('[pushToCloud] Syncing to ACTUAL schema (Strict Mode):', state.teacher);
        
        const teacherToPush = {
          id: String(state.teacher.id || user.id),
          user_id: user.id,
          teacherName: state.teacher.teacherName || 'Guru',
          schoolName: (state.teacher.schools && state.teacher.schools[state.teacher.currentSchoolIndex]) || 'Sekolah Belum Diatur',
          schoolYear: state.teacher.schoolYear || '2024/2025',
          subjects: Array.isArray(state.teacher.subjects) ? state.teacher.subjects : [],
          customSubjects: Array.isArray(state.teacher.customSubjects) ? state.teacher.customSubjects : [],
          notificationMinutes: Number(state.teacher.notificationMinutes) || 0,
          lateSetting: state.teacher.lateSetting || { isEnabled: true, bufferMinutes: 15 },
          createdAt: state.teacher.createdAt || new Date().toISOString()
        };

        const { error } = await client.from('teacher_profiles').upsert(teacherToPush, {
          onConflict: 'user_id'
        });

        if (error) {
          console.error('[pushToCloud] GAGAL unggah profil:', error.message);
        } else {
          console.log('[pushToCloud] BERHASIL unggah profil ke Supabase.');
        }
      }

      // 2. Sync all other tables (non-destructive sync)
      for (const tableName of TABLES) {
        const data = (state as any)[tableName] || [];
        console.log(`[pushToCloud] ${tableName}:`, data.length, 'items');
        
        const dataToSync = data.map((item: any) => {
          return mapToCloud(tableName, item, user.id);
        });

        const cloudTableName = getCloudTableName(tableName);

        // Step A: Upsert current local data
        if (dataToSync.length > 0) {
          // Break into chunks of 100 to avoid request size limits
          const chunks = [];
          for (let i = 0; i < dataToSync.length; i += 100) {
            chunks.push(dataToSync.slice(i, i + 100));
          }

          for (const chunk of chunks) {
            const { error: upsertError } = await client.from(cloudTableName).upsert(chunk);
            if (upsertError) console.error(`Error upserting ${cloudTableName} chunk:`, upsertError);
          }
        }

        // Step B: Remove data from cloud that no longer exists locally
        const localIds = data.map((item: any) => item.id);
        if (localIds.length > 0) {
          const { error: cleanupError } = await client
            .from(cloudTableName)
            .delete()
            .eq('teacher_id', user.id)
            .not('id', 'in', `(${localIds.join(',')})`);
          
          if (cleanupError) console.error(`Error cleaning up ${cloudTableName}:`, cleanupError);
        } else {
          // If local is empty, delete everything for this user
          const { error: deleteError } = await client.from(cloudTableName).delete().eq('teacher_id', user.id);
          if (deleteError) {
            console.warn(`[pushToCloud] Error cleaning up empty ${cloudTableName}:`, deleteError.message);
          }
        }
      }
      
      console.log('[pushToCloud] Complete');
      
      // Update last sync timestamp
      const nowISO = new Date().toISOString();
      if (state.teacher) {
        const updatedProfile = { ...state.teacher, lastSyncTimestamp: nowISO };
        await saveTeacherProfile(updatedProfile, true);
      }

      return { success: true, message: 'Data berhasil disinkronisasi ke cloud' };
    } catch (e: any) {
      console.error('[pushToCloud] Error during push:', e);
      return { success: false, message: e.message || 'Gagal sinkronisasi' };
    } finally {
      setSkipSync(false);
    }
  },

  /**
   * PULL: Mengambil data dari Cloud dan memperbarui database lokal
   */
  async pullFromCloud(): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      console.warn('Supabase not configured, skipping pull');
      return { success: false, message: 'Supabase belum dikonfigurasi' };
    }
    
    const client = getSupabaseClient();
    const user = await this.getUser();
    console.log('[pullFromCloud] User:', user?.id);
    
    if (!user) {
      return { success: false, message: 'Silakan login untuk sinkronisasi' };
    }

    setSkipSync(true);

    try {
      // Clear state cache before pulling to ensure fresh data
      const { clearStateCache } = await import('./dbAttendance');
      clearStateCache();
      
      const db = await initDB();
      console.log('[pullFromCloud] Starting pull for user:', user.id);

      // 1. Pull Teacher Profile (Dual-Search Strategy)
      console.log('[pullFromCloud] Fetching profile for user_id:', user.id);
      let { data: rawTeacher, error: teacherError } = await client.from('teacher_profiles').select('*').eq('user_id', user.id).maybeSingle();
      
      // Fallback: If not found by user_id, try by id (sometimes they are the same)
      if (!rawTeacher && !teacherError) {
        console.log('[pullFromCloud] Profile not found by user_id, trying by id...');
        const { data: fallbackTeacher, error: fallbackError } = await client.from('teacher_profiles').select('*').eq('id', user.id).maybeSingle();
        if (fallbackTeacher) {
          rawTeacher = fallbackTeacher;
          console.log('[pullFromCloud] Profile found using fallback id!');
        }
      }
      
      if (rawTeacher) {
        console.log('[pullFromCloud] Processing based on ACTUAL schema:', rawTeacher);
        
        const normalizedTeacher: any = { 
          id: rawTeacher.id || user.id,
          teacherName: rawTeacher.teacherName || rawTeacher.teacher_name || 'Guru',
          schoolYear: rawTeacher.schoolYear || rawTeacher.school_year || '2024/2025',
          currentSchoolIndex: rawTeacher.current_school_index || 0,
          subjects: Array.isArray(rawTeacher.subjects) ? rawTeacher.subjects : [],
          customSubjects: Array.isArray(rawTeacher.customSubjects) ? rawTeacher.customSubjects : [],
          notificationMinutes: rawTeacher.notificationMinutes || 0,
          lateSetting: rawTeacher.lateSetting || { isEnabled: true, bufferMinutes: 15 }
        };
        
        // Schools mapping
        let schools = rawTeacher.schools || [];
        if (rawTeacher.schoolName && !schools.includes(rawTeacher.schoolName)) {
          schools = [rawTeacher.schoolName, ...schools];
        }
        normalizedTeacher.schools = schools.length > 0 ? schools : ['Sekolah Belum Diatur'];

        await saveTeacherProfile(normalizedTeacher as TeacherProfile, true);
        console.log('[pullFromCloud] Final Match with Schema:', normalizedTeacher);
      }
      else {
        console.warn('[pullFromCloud] WARNING: No teacher profile found in Supabase for this user ID.');
      }

      // 2. Pull all other tables
      for (const tableName of TABLES) {
        const cloudTableName = getCloudTableName(tableName);
        const { data, error } = await client.from(cloudTableName).select('*').eq('teacher_id', user.id);
        console.log(`[pullFromCloud] ${tableName}:`, { count: data?.length, error });
        
        if (error) {
          console.error(`Error pulling ${cloudTableName}:`, error);
          continue;
        }

        if (data && data.length > 0) {
          // Bulk put in local IDB
          const tx = db.transaction(tableName as any, 'readwrite');
          const store = tx.objectStore(tableName as any);
          for (const item of data) {
            const localItem = mapToLocal(tableName, item);
            await store.put(localItem);
          }
          await tx.done;
        }
      }
      
      console.log('[pullFromCloud] Complete');
      return { success: true, message: 'Data berhasil diambil dari cloud' };
    } catch (e: any) {
      console.error('[pullFromCloud] Error during pull:', e);
      return { success: false, message: e.message || 'Gagal sinkronisasi' };
    } finally {
      setSkipSync(false);
    }
  },

  /**
   * FULL SYNC: Pull followed by Push
   */
  async syncDrive() {
    try {
      console.log("Starting Sync Pull...");
      await this.pullFromCloud();
      console.log("Starting Sync Push...");
      await this.pushToCloud();
      return { success: true };
    } catch (e: any) {
      console.error("Sync Error:", e);
      throw e;
    }
  }
};
