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

const isValidUUID = (str: any): boolean => {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

// Helper to map local IndexedDB objects to Supabase snake_case schema format
const mapToCloud = (tableName: string, item: any, userId: string): any => {
  const activeSchoolId = typeof window !== 'undefined' ? localStorage.getItem('active_school_id') : null;
  // Force activeSchoolId if it exists to prevent foreign key errors with legacy/backup school IDs
  const rawSchoolId = (activeSchoolId && activeSchoolId !== 'legacy') ? activeSchoolId : (item.school_id || item.schoolId || 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7');
  const schoolId = isValidUUID(rawSchoolId) ? rawSchoolId : 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7';
  
  let syncItem: any = { ...item, teacher_id: userId };
  
  syncItem.school_id = schoolId;

  if (tableName === 'classes') {
    syncItem.school_id = schoolId || null;
    syncItem.name = item.name || item.namaKelas;
    syncItem.subject = item.subject || item.mapel;
    syncItem.created_at = item.created_at || item.createdAt;
    
    // Add dual-schema fields for EduScore / EduCheck compatibility
    syncItem.id_kelas = item.id || item.idKelas;
    syncItem.nama_kelas = item.name || item.namaKelas;
    syncItem.mapel = item.subject || item.mapel;
    
    delete syncItem.namaKelas;
    delete syncItem.createdAt;
    delete syncItem.schoolId;
    delete syncItem.schoolIndex;
  }
  
  if (tableName === 'students') {
    syncItem.school_id = schoolId || null;
    syncItem.class_id = item.class_id || item.classId || item.idKelas || null;
    syncItem.name = item.name || item.nama;
    syncItem.created_at = item.created_at || item.createdAt;

    // Add dual-schema fields for EduScore / EduCheck compatibility
    syncItem.id_siswa = item.id || item.idSiswa;
    syncItem.id_kelas = syncItem.class_id;
    syncItem.nama = syncItem.name;

    if (item.face_embedding) {
      syncItem.face_vector = item.face_embedding;
      syncItem.face_embedding = item.face_embedding;
    }
    
    delete syncItem.classId;
    delete syncItem.idKelas;
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
    const rawSchedSchoolId = item.schoolId || item.school_id || schoolId || null;
    syncItem.school_id = isValidUUID(rawSchedSchoolId) ? rawSchedSchoolId : null;
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
    syncItem.is_graded = item.isGraded !== false && item.is_graded !== false;
    syncItem.created_at = item.created_at || item.createdAt;

    delete syncItem.classId;
    delete syncItem.targetType;
    delete syncItem.studentIds;
    delete syncItem.isGraded;
    delete syncItem.createdAt;
    delete syncItem.schoolId;
  }
  
  return syncItem;
};

// Helper to map cloud snake_case schema format back to local IndexedDB objects (with both EduCheck and EduScore compatibility keys)
const mapToLocal = (tableName: string, cloudItem: any): any => {
  let item: any = { ...cloudItem };
  
  if (tableName === 'classes') {
    // Preserve primary key and fill compatibility key aliases (ensure non-null id for IndexedDB keyPath)
    const rawClassId = cloudItem.id || cloudItem.id_kelas;
    const classId = rawClassId ? String(rawClassId) : (cloudItem.name ? `class_${String(cloudItem.name).replace(/\s+/g, '_')}` : `class_${Math.random().toString(36).substring(2, 9)}`);
    const className = cloudItem.name || cloudItem.nama_kelas || 'Kelas';
    const classSubject = cloudItem.subject || cloudItem.mapel || '';
    
    item.id = classId;
    item.idKelas = classId;
    item.name = className;
    item.namaKelas = className;
    item.subject = classSubject;
    item.mapel = classSubject;
    item.schoolId = cloudItem.school_id;
    item.school_id = cloudItem.school_id;
    item.createdAt = cloudItem.created_at || new Date().toISOString();
  }
  
  if (tableName === 'students') {
    const rawStudentId = cloudItem.id || cloudItem.id_siswa;
    const studentId = rawStudentId ? String(rawStudentId) : (cloudItem.name ? `student_${String(cloudItem.name).replace(/\s+/g, '_')}` : `student_${Math.random().toString(36).substring(2, 9)}`);
    const studentClassId = cloudItem.class_id || cloudItem.id_kelas || cloudItem.classId || null;
    const studentName = cloudItem.name || cloudItem.nama || 'Siswa';
    
    const CLASS_ID_MAP: Record<string, string> = {
      "00000000-0000-4000-8000-000009ad812f": "X-A",
      "00000000-0000-4000-8000-00002da5570c": "X-D",
      "00000000-0000-4000-8000-000071080c55": "X-E",
      "00000000-0000-4000-8000-00000fb56fb6": "X-F",
      "00000000-0000-4000-8000-0000519d2ce9": "X-G",
      "00000000-0000-4000-8000-00004d103678": "X-H",
      "00000000-0000-4000-8000-000014426627": "X-I",
      "00000000-0000-4000-8000-0000759502c6": "X-J",
      "00000000-0000-4000-8000-00002918609b": "X-K",
      "00000000-0000-4000-8000-000018e27fd9": "XI-B",
      "00000000-0000-4000-8000-000048701cc6": "XI-C",
      "00000000-0000-4000-8000-0000563d469b": "XI-D",
      "00000000-0000-4000-8000-00000b155604": "XI-E",
      "00000000-0000-4000-8000-00006c67f2a3": "XI-F",
      "00000000-0000-4000-8000-0000324570be": "XI-G"
    };

    const fallbackClassName = studentClassId ? CLASS_ID_MAP[studentClassId] : null;
    const studentClassName = cloudItem.class_name || cloudItem.className || cloudItem.nama_kelas || cloudItem.namaKelas || (cloudItem.classes ? (cloudItem.classes.name || cloudItem.classes.nama_kelas) : null) || fallbackClassName;

    item.id = studentId;
    item.idSiswa = studentId;
    item.classId = studentClassId;
    item.class_id = studentClassId;
    item.idKelas = studentClassId;
    item.className = studentClassName;
    item.namaKelas = studentClassName;
    item.class_name = studentClassName;
    item.name = studentName;
    item.nama = studentName;
    item.schoolId = cloudItem.school_id;
    item.school_id = cloudItem.school_id;
    item.createdAt = cloudItem.created_at || new Date().toISOString();
    
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
    item.isGraded = cloudItem.is_graded !== false;
    item.is_graded = cloudItem.is_graded !== false;
    item.createdAt = cloudItem.created_at;
  }
  
  return item;
};

const deviceId = Math.random().toString(36).substring(2, 15);
let syncSubscription: any = null;

export const syncService = {
  subscribeToRealtimeSync(userId: string, callback: () => void) {
    if (syncSubscription) {
      syncSubscription.unsubscribe();
    }
    
    if (!supabase) return;
    const client = getSupabaseClient();
    
    console.log('[Realtime Sync] Subscribing to sync channel for user:', userId);
    
    syncSubscription = client
      .channel('eduverse-sync-channel')
      .on('broadcast', { event: 'sync-event' }, (payload: any) => {
        console.log('[Realtime Sync] Received broadcast payload:', payload);
        if (payload.payload?.userId === userId && payload.payload?.senderId !== deviceId) {
          console.log('[Realtime Sync] Broadcast trigger: new updates on another device!');
          this.pullFromCloud().then(() => {
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('cloud_data_synced'));
            callback();
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_sessions' }, () => {
        console.log('[Realtime Sync] Postgres changes on attendance_sessions table');
        this.pullFromCloud().then(() => {
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('cloud_data_synced'));
          callback();
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
        console.log('[Realtime Sync] Postgres changes on attendance_records table');
        this.pullFromCloud().then(() => {
          if (typeof window !== 'undefined') window.dispatchEvent(new Event('cloud_data_synced'));
          callback();
        });
      })
      .subscribe((status) => {
        console.log('[Realtime Sync] Subscription status:', status);
      });
  },

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
        students: state.students.length,
        sessions: state.sessions.length,
        records: state.records.length
      });
      
      // SAFETY: Always check cloud state BEFORE any delete.
      // If cloud has data but local has LESS or EQUAL, pull instead (never overwrite cloud with less data).
      const localClassCount = state.classes?.length || 0;
      const localStudentCount = state.students?.length || 0;
      const localTotal = localClassCount + localStudentCount;
      
      let cloudClassesCount = 0;
      let cloudStudentsCount = 0;
      try {
        const cc = await client.from('classes').select('*', { count: 'exact', head: true }).eq('teacher_id', user.id);
        cloudClassesCount = cc.count || 0;
        const sc = await client.from('students').select('*', { count: 'exact', head: true }).eq('teacher_id', user.id);
        cloudStudentsCount = sc.count || 0;
      } catch (e) {
        console.error('[pushToCloud] Failed to check cloud state:', e);
      }
      const cloudTotal = cloudClassesCount + cloudStudentsCount;
      
      console.log(`[pushToCloud] Cloud: ${cloudClassesCount}C/${cloudStudentsCount}S (${cloudTotal}) | Local: ${localClassCount}C/${localStudentCount}S (${localTotal})`);
      
      // Non-destructive push: Always push local records to cloud (upsert safely merges records)
      if (localTotal === 0 && cloudTotal > 0) {
        console.log(`[pushToCloud] Local empty but Cloud has ${cloudTotal} records. Pulling to populate local state.`);
        setSkipSync(false);
        return await this.pullFromCloud();
      }
      
      // 1. Sync Teacher Profile (upsert, keep existing)
      if (state.teacher) {
        console.log('[pushToCloud] Syncing teacher profile...');
        
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
          console.log('[pushToCloud] BERHASIL unggah profil.');
        }
      }

      // 2. Non-destructive sync: Use upsert instead of deleting cloud tables
      // This prevents data loss when logging in from new devices or when network interruptions occur.
      let allInsertsOk = true;
      for (const tableName of TABLES) {
        const data = (state as any)[tableName] || [];
        if (data.length === 0) continue;
        
        const dataToSync = data.map((item: any) => {
          return mapToCloud(tableName, item, user.id);
        });

        const cloudTableName = getCloudTableName(tableName);
        console.log(`[pushToCloud] Upserting ${dataToSync.length} items into ${cloudTableName}...`);

        // Break into chunks of 100 to avoid request size limits
        const chunks = [];
        for (let i = 0; i < dataToSync.length; i += 100) {
          chunks.push(dataToSync.slice(i, i + 100));
        }

        for (const chunk of chunks) {
          const { error: upsertError } = await client.from(cloudTableName).upsert(chunk, { onConflict: 'id' });
          if (upsertError) {
            console.error(`[pushToCloud] Error upserting ${cloudTableName}:`, upsertError.message, upsertError.details, upsertError.hint);
            if (chunk.length > 0) {
              console.error(`[pushToCloud] Sample item:`, JSON.stringify(chunk[0]).substring(0, 300));
            }
            allInsertsOk = false;
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

      // Broadcast sync event to other devices
      try {
        await client.channel('eduverse-sync-channel').send({
          type: 'broadcast',
          event: 'sync-event',
          payload: { userId: user.id, senderId: deviceId }
        });
        console.log('[pushToCloud] Successfully broadcasted sync-event to other devices.');
      } catch (broadcastErr) {
        console.warn('[pushToCloud] Failed to send broadcast sync-event:', broadcastErr);
      }

      return { success: allInsertsOk, message: allInsertsOk ? 'Data berhasil disinkronisasi ke cloud' : 'Sebagian data gagal disinkronisasi' };
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

      // 2. Pull all other tables (clear local first to avoid duplicates from different device IDs)
      const activeSchoolId = typeof window !== 'undefined' ? localStorage.getItem('active_school_id') : null;
      const targetSchoolId = (activeSchoolId && isValidUUID(activeSchoolId)) ? activeSchoolId : 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7';

      for (const tableName of TABLES) {
        const cloudTableName = getCloudTableName(tableName);
        let query = client.from(cloudTableName).select('*');
        const validUserId = (user?.id && isValidUUID(user.id)) ? user.id : null;
        const validSchoolId = (targetSchoolId && isValidUUID(targetSchoolId)) ? targetSchoolId : 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7';

        if (tableName === 'classes' || tableName === 'students') {
          if (validUserId && validSchoolId) {
            query = query.or(`teacher_id.eq.${validUserId},school_id.eq.${validSchoolId}`);
          } else if (validSchoolId) {
            query = query.eq('school_id', validSchoolId);
          } else if (validUserId) {
            query = query.eq('teacher_id', validUserId);
          }
        } else if (validSchoolId) {
          if (validUserId) {
            query = query.or(`teacher_id.eq.${validUserId},school_id.eq.${validSchoolId}`);
          } else {
            query = query.eq('school_id', validSchoolId);
          }
        } else if (validUserId) {
          query = query.eq('teacher_id', validUserId);
        }

        const { data, error } = await query;
        console.log(`[pullFromCloud] ${tableName}:`, { count: data?.length, error });
        
        if (error) {
          console.error(`Error pulling ${cloudTableName}:`, error);
          continue;
        }

        // Merge cloud data into IndexedDB without wiping local master data
        if (data && data.length > 0) {
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
   * FULL SYNC: Push first (save local), then Pull (get latest from all devices)
   */
  async syncDrive() {
    try {
      console.log("Starting Sync Push...");
      await this.pushToCloud();
      console.log("Starting Sync Pull...");
      await this.pullFromCloud();
      return { success: true };
    } catch (e: any) {
      console.error("Sync Error:", e);
      throw e;
    }
  }
};
