
import { 
  DBState,
  TeacherProfile, 
  ClassData, 
  Student, 
  Meeting, 
  MeetingScore,
  FinalGradeRecord,
  StudentPoint,
  LearningObjective,
  PointTemplate,
  School,
  DEFAULT_WEIGHTS
} from '../types';
import { supabase } from './supabase';

const DB_NAME = 'EduScoreDB';
const DB_VERSION = 4; 
const LOCAL_STORAGE_KEY = 'edu_point_db'; 

// --- SYNC STATUS TRACKING ---
let isSyncInProgress = false;
const syncListeners: ((status: boolean) => void)[] = [];

const updateSyncStatus = (status: boolean) => {
  isSyncInProgress = status;
  syncListeners.forEach(listener => listener(status));
};

export const subscribeToSyncStatus = (cb: (status: boolean) => void) => {
  syncListeners.push(cb);
  cb(isSyncInProgress);
  return () => {
    const idx = syncListeners.indexOf(cb);
    if (idx > -1) syncListeners.splice(idx, 1);
  };
};

// --- CORE DB CONNECTION ---

let _dbInstance: IDBDatabase | null = null;

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (_dbInstance) {
      return resolve(_dbInstance);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('teacherProfile')) {
        db.createObjectStore('teacherProfile', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('schools')) {
        db.createObjectStore('schools', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('classes')) {
        db.createObjectStore('classes', { keyPath: 'idKelas' });
      }
      if (!db.objectStoreNames.contains('students')) {
        db.createObjectStore('students', { keyPath: 'idSiswa' });
      }
      if (!db.objectStoreNames.contains('meetings')) {
        db.createObjectStore('meetings', { keyPath: 'idPertemuan' });
      }
      if (!db.objectStoreNames.contains('meetingScores')) {
        db.createObjectStore('meetingScores', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('finalGrades')) {
        db.createObjectStore('finalGrades', { keyPath: ['idKelas', 'idSiswa'] });
      }
      if (!db.objectStoreNames.contains('studentPoints')) {
        db.createObjectStore('studentPoints', { keyPath: 'id' });
      }
      // NEW STORE: Learning Objectives (TP)
      if (!db.objectStoreNames.contains('learningObjectives')) {
        db.createObjectStore('learningObjectives', { keyPath: 'id' });
      }
      // NEW STORE: Point Templates
      if (!db.objectStoreNames.contains('pointTemplates')) {
        db.createObjectStore('pointTemplates', { keyPath: 'id' });
      }
    };

    request.onsuccess = async (event) => {
      _dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(_dbInstance);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };
  });
};

// --- GENERIC HELPERS ---

const getAll = async <T>(storeName: string): Promise<T[]> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
};

const getOne = async <T>(storeName: string, key: any): Promise<T | undefined> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
};

const putOne = async (storeName: string, value: any): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

// --- PROFILE ---

export const getTeacherProfile = async (): Promise<TeacherProfile | null> => {
  try {
    const local = await getOne<TeacherProfile>('teacherProfile', 'profile');
    if (local) {
      if (!local.schools || !Array.isArray(local.schools)) {
        const defaultSchool: School = {
          id: local.activeSchoolId || crypto.randomUUID(),
          nama: (local as any).sekolah || local.tahunAjaran || '',
          tahunAjaran: local.tahunAjaran || '',
          semester: local.semester || '1',
          kkmDefault: local.kkmDefault || 75,
          createdAt: new Date().toISOString()
        };
        local.schools = [defaultSchool];
        local.activeSchoolId = local.activeSchoolId || defaultSchool.id;
        await putOne('teacherProfile', local);
      }
      
      // Validate activeSchoolId in local profile
      if (local.schools && local.schools.length > 0 && local.schools[0]?.id) {
        const activeExists = local.schools.find(s => s.id === local.activeSchoolId);
        if (!activeExists) {
          local.activeSchoolId = local.schools[0].id;
          await putOne('teacherProfile', local);
        }
      }
      return local;
    }
  } catch (err) {
    console.error("Error loading local profile:", err);
  }

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (data && !error) {
          const schools = await getSchools();
          // Prefer local activeSchoolId if available and valid
          const existingLocal = await getOne<TeacherProfile>('teacherProfile', 'profile');
          const cloudActiveId = data.active_school_id;
          
          // Selection logic: Cloud > Local > First School
          let finalActiveId = cloudActiveId;
          if (!finalActiveId && existingLocal?.activeSchoolId) {
             // Check if the local ID still exists in the fetched schools
             if (schools.find(s => s.id === existingLocal.activeSchoolId)) {
                finalActiveId = existingLocal.activeSchoolId;
             }
          }
          
          // CRITICAL FIX: If still no active school but we have schools, pick the first one
          if (!finalActiveId && schools.length > 0 && schools[0]?.id) {
            finalActiveId = schools[0].id;
          }

          const profile: TeacherProfile = {
            id: 'profile',
            namaGuru: data.nama_guru || '',
            schools: schools,
            tahunAjaran: data.tahun_ajaran || '',
            semester: data.semester || '1',
            fotoUrl: data.foto_url || '',
            nip: data.nip || '',
            kkmDefault: data.kkm_default || 75,
            modeCepatDefault: data.mode_cepat_default ?? true,
            bintangAktif: data.bintang_aktif ?? true,
            konversiBintangAktif: data.konversi_bintang_aktif ?? false,
            konversiBintangRate: data.konversi_bintang_rate ?? 10,
            konversiBintangMaxBonus: data.konversi_bintang_max_bonus ?? 5,
            subjects: data.subjects || [],
            weights: data.weights || DEFAULT_WEIGHTS,
            activeSchoolId: finalActiveId,
            lastUpdatedAt: data.updated_at // Store cloud timestamp locally
          };
          
          await putOne('teacherProfile', profile);
          
          // Background sync
          syncCloudToLocal(profile).catch(err => console.warn("Background sync error:", err));
          
          return profile;
        } else {
          const schools = await getSchools();
          const fallbackProfile: TeacherProfile = {
            id: 'profile',
            namaGuru: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Guru',
            schools: schools,
            tahunAjaran: '2026/2027',
            semester: '1',
            nip: '',
            kkmDefault: 75,
            modeCepatDefault: true,
            bintangAktif: true,
            konversiBintangAktif: false,
            konversiBintangRate: 10,
            konversiBintangMaxBonus: 5,
            subjects: ['Matematika', 'Informatika', 'Bahasa Indonesia'],
            weights: DEFAULT_WEIGHTS,
            activeSchoolId: schools[0]?.id || '',
            lastUpdatedAt: new Date().toISOString()
          };
          await putOne('teacherProfile', fallbackProfile);
          return fallbackProfile;
        }
      }
    } catch (err) {
      console.error("Error fetching remote profile:", err);
    }
  }
  return null;
};

export const saveTeacherProfile = async (profile: TeacherProfile): Promise<void> => {
  await putOne('teacherProfile', { ...profile, id: 'profile' });

  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const activeSchool = profile.schools.find(s => s.id === profile.activeSchoolId);
      const now = new Date().toISOString();
      try {
        const { error } = await supabase.from('teacher_profiles').upsert({
          user_id: session.user.id,
          nama_guru: profile.namaGuru,
          sekolah: activeSchool?.nama || '',
          tahun_ajaran: profile.tahunAjaran,
          semester: profile.semester || '1',
          subjects: profile.subjects,
          foto_url: profile.fotoUrl,
          nip: profile.nip,
          kkm_default: profile.kkmDefault,
          mode_cepat_default: profile.modeCepatDefault,
          bintang_aktif: profile.bintangAktif,
          konversi_bintang_aktif: profile.konversiBintangAktif,
          konversi_bintang_rate: profile.konversiBintangRate,
          konversi_bintang_max_bonus: profile.konversiBintangMaxBonus,
          weights: profile.weights,
          active_school_id: profile.activeSchoolId,
          updated_at: now
        });
        
        if (error) {
          console.warn("Gagal sinkronisasi profil ke Cloud:", error.message);
        } else {
          // Update local with the same timestamp if cloud save succeeded
          await putOne('teacherProfile', { ...profile, id: 'profile', lastUpdatedAt: now });
        }
      } catch (e) {
        console.warn("Kesalahan koneksi cloud:", e);
      }
    }
  }
};

// --- SCHOOLS ---

export const getSchools = async (): Promise<School[]> => {
  return getAll<School>('schools');
};

export const getSchoolById = async (id: string): Promise<School | undefined> => {
  return getOne<School>('schools', id);
};

export const saveSchool = async (school: School): Promise<void> => {
  await putOne('schools', school);
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      supabase.from('schools').upsert({
        id: school.id, user_id: session.user.id, nama: school.nama,
        tahun_ajaran: school.tahunAjaran, semester: school.semester,
        kkm_default: school.kkmDefault, created_at: school.createdAt
      }).then(({ error }) => { if (error) console.warn("Background sync failed:", error); });
    }
  }
};

export const deleteSchool = async (id: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['schools', 'classes', 'students', 'meetings', 'meetingScores', 'finalGrades', 'studentPoints'], 'readwrite');
  tx.objectStore('schools').delete(id);
  
  if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) supabase.from('schools').delete().eq('id', id).then(({ error }) => { if (error) console.warn(error); });
    });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const setActiveSchool = async (schoolId: string): Promise<void> => {
  const profile = await getTeacherProfile();
  if (profile) {
    profile.activeSchoolId = schoolId;
    await saveTeacherProfile(profile);
  }
};

export const getActiveSchool = async (): Promise<School | null> => {
  const profile = await getTeacherProfile();
  if (profile && profile.activeSchoolId) {
    return await getSchoolById(profile.activeSchoolId) || null;
  }
  return null;
};

export const getActiveSchoolId = async (): Promise<string | null> => {
  const profile = await getTeacherProfile();
  return profile?.activeSchoolId || null;
};

// --- CLASSES ---

export const getClasses = async (schoolId?: string): Promise<ClassData[]> => {
  let all = await getAll<ClassData>('classes');
  if (all.length === 0) {
    try {
      const { SEED_CLASSES } = await import('./excelDataSeed');
      if (SEED_CLASSES && SEED_CLASSES.length > 0) {
        for (const sc of SEED_CLASSES) {
          await putOne('classes', {
            id: sc.id,
            idKelas: sc.id,
            name: sc.name,
            namaKelas: sc.name,
            subject: sc.subject,
            mapel: sc.subject,
            schoolId: sc.school_id || 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7',
            school_id: sc.school_id || 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7'
          });
        }
        all = await getAll<ClassData>('classes');
      }
    } catch (e) {
      console.warn('Seed fallback for getClasses error:', e);
    }
  }
  if (schoolId) {
    return all.filter(c => {
      const sId = c.schoolId || (c as any).school_id;
      return !sId || sId === schoolId || sId === 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7' || schoolId === 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7';
    });
  }
  return all;
};

export const getClassById = async (id: string): Promise<ClassData | undefined> => {
  return getOne<ClassData>('classes', id);
};

export const saveClass = async (cls: ClassData): Promise<void> => {
  await putOne('classes', cls);
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      supabase.from('classes').upsert({
        id: cls.idKelas,
        id_kelas: cls.idKelas,
        teacher_id: session.user.id,
        school_id: cls.schoolId || 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7',
        name: cls.namaKelas,
        nama_kelas: cls.namaKelas,
        subject: cls.mapel,
        mapel: cls.mapel
      }).then(({ error }) => { if (error) console.warn("Background sync failed:", error); });
    }
  }
};

export const deleteClass = async (idKelas: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['classes', 'students', 'meetings', 'meetingScores', 'finalGrades', 'studentPoints'], 'readwrite');
  tx.objectStore('classes').delete(idKelas);
  
  if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) supabase.from('classes').delete().or(`id.eq.${idKelas},id_kelas.eq.${idKelas}`).then(({ error }) => { if (error) console.warn(error); });
    });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- STUDENTS ---

export const getStudents = async (idKelas?: string, schoolId?: string): Promise<Student[]> => {
  let all = await getAll<Student>('students');
  if (all.length === 0) {
    try {
      const { SEED_STUDENTS } = await import('./excelDataSeed');
      if (SEED_STUDENTS && SEED_STUDENTS.length > 0) {
        for (const ss of SEED_STUDENTS) {
          await putOne('students', {
            id: ss.id,
            idSiswa: ss.id,
            name: ss.name,
            nama: ss.name,
            student_code: ss.student_code,
            nisn: ss.nisn,
            gender: ss.gender,
            idKelas: ss.classId || ss.class_id,
            classId: ss.classId || ss.class_id,
            class_id: ss.classId || ss.class_id,
            schoolId: ss.school_id || 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7',
            school_id: ss.school_id || 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7',
            password: ss.password || 'murid19'
          });
        }
        all = await getAll<Student>('students');
      }
    } catch (e) {
      console.warn('Seed fallback for getStudents error:', e);
    }
  }
  let filtered = all;
  if (schoolId) {
    filtered = filtered.filter(s => {
      const sId = s.schoolId || (s as any).school_id;
      return !sId || sId === schoolId || sId === 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7' || schoolId === 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7';
    });
  }
  if (idKelas) {
    filtered = filtered.filter(s => {
      const cId = s.idKelas || (s as any).classId || (s as any).class_id;
      return cId && String(cId) === String(idKelas);
    });
  }
  return filtered;
};

export const getStudentById = async (id: string): Promise<Student | undefined> => {
  return getOne<Student>('students', id);
};

export const saveStudent = async (student: Student): Promise<void> => {
  await putOne('students', student);
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      supabase.from('students').upsert({
        id: student.idSiswa,
        id_siswa: student.idSiswa,
        teacher_id: session.user.id,
        school_id: student.schoolId,
        class_id: student.idKelas,
        id_kelas: student.idKelas,
        name: student.nama,
        nama: student.nama,
        nisn: student.nisn
      }).then(({ error }) => { if (error) console.warn("Background sync failed:", error); });
    }
  }
};

export const deleteStudent = async (idSiswa: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['students'], 'readwrite');
  tx.objectStore('students').delete(idSiswa);
  
  if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) supabase.from('students').delete().or(`id.eq.${idSiswa},id_siswa.eq.${idSiswa}`).then(({ error }) => { if (error) console.warn(error); });
    });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- LEARNING OBJECTIVES (NEW) ---

export const getLearningObjectives = async (mapel?: string, schoolId?: string): Promise<LearningObjective[]> => {
  const all = await getAll<LearningObjective>('learningObjectives');
  let filtered = all;
  if (schoolId) filtered = filtered.filter(lo => lo.schoolId === schoolId);
  if (mapel) filtered = filtered.filter(lo => lo.mapel === mapel);
  return filtered;
};

export const saveLearningObjective = async (lo: LearningObjective): Promise<void> => {
  await putOne('learningObjectives', lo);
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      supabase.from('learning_objectives').upsert({
        id: lo.id, user_id: session.user.id, school_id: lo.schoolId, mapel: lo.mapel, kode: lo.kode, deskripsi: lo.deskripsi
      }).then(({ error }) => { if (error) console.warn("Background sync failed:", error); });
    }
  }
};

export const deleteLearningObjective = async (id: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['learningObjectives'], 'readwrite');
  tx.objectStore('learningObjectives').delete(id);
  
  if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) supabase.from('learning_objectives').delete().eq('id', id).then(({ error }) => { if (error) console.warn(error); });
    });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- MEETINGS ---

export const getMeetings = async (idKelas?: string, schoolId?: string): Promise<Meeting[]> => {
  const all = await getAll<Meeting>('meetings');
  let filtered = all;
  if (schoolId) filtered = filtered.filter(m => m.schoolId === schoolId);
  if (idKelas) filtered = filtered.filter(m => m.idKelas === idKelas);
  return filtered;
};

export const getMeetingById = async (id: string): Promise<Meeting | undefined> => {
  return getOne<Meeting>('meetings', id);
};

export const saveMeeting = async (meeting: Meeting): Promise<void> => {
  await putOne('meetings', meeting);
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      supabase.from('meetings').upsert({
        id_pertemuan: meeting.idPertemuan, user_id: session.user.id, school_id: meeting.schoolId, id_kelas: meeting.idKelas, 
        mapel: meeting.mapel, semester: meeting.semester, urutan_ke: meeting.urutanKe, tanggal: meeting.tanggal,
        materi: meeting.materi, jenis: meeting.jenis, activity_type: meeting.activityType, 
        activity_name: meeting.activityName, assessment_category: meeting.assessmentCategory, 
        aspek_penilaian: meeting.aspekPenilaian, id_tp: meeting.idTP
      }).then(({ error }) => { if (error) console.warn("Background sync failed:", error); });
    }
  }
};

export const deleteMeeting = async (idPertemuan: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['meetings'], 'readwrite');
  tx.objectStore('meetings').delete(idPertemuan);
  
  if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) supabase.from('meetings').delete().eq('id_pertemuan', idPertemuan).then(({ error }) => { if (error) console.warn(error); });
    });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- SCORES ---

export const getScores = async (idPertemuan?: string, schoolId?: string): Promise<MeetingScore[]> => {
  const all = await getAll<MeetingScore>('meetingScores');
  let filtered = all;
  if (schoolId) filtered = filtered.filter(s => s.schoolId === schoolId);
  if (idPertemuan) filtered = filtered.filter(s => s.idPertemuan === idPertemuan);
  return filtered;
};

export const getAllScores = async (schoolId?: string): Promise<MeetingScore[]> => {
  const all = await getAll<MeetingScore>('meetingScores');
  if (schoolId) return all.filter(s => s.schoolId === schoolId);
  return all;
};

export const saveScore = async (score: MeetingScore): Promise<void> => {
  await putOne('meetingScores', score);
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      supabase.from('meeting_scores').upsert({
        id: score.id, user_id: session.user.id, school_id: score.schoolId, id_pertemuan: score.idPertemuan, id_siswa: score.idSiswa,
        nilai_angka: score.nilaiAngka, bintang: score.bintang, catatan: score.catatan, last_updated: new Date(score.lastUpdated).toISOString()
      }).then(({ error }) => { if (error) console.warn("Background sync failed:", error); });
    }
  }
};

// --- FINAL GRADES & RECAP ---

export const getFinalGrades = async (idKelas: string, schoolId?: string): Promise<FinalGradeRecord[]> => {
  const all = await getAll<FinalGradeRecord>('finalGrades');
  let filtered = all;
  if (schoolId) filtered = filtered.filter(f => f.schoolId === schoolId);
  return filtered.filter(f => f.idKelas === idKelas);
};

export const saveFinalGrade = async (record: FinalGradeRecord): Promise<void> => {
  await putOne('finalGrades', record);
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      supabase.from('final_grades').upsert({
        id_siswa: record.idSiswa, user_id: session.user.id, school_id: record.schoolId, id_kelas: record.idKelas,
        nilai_smt_lalu: record.nilaiSmtLalu, nilai_manual: record.nilaiManual
      }).then(({ error }) => { if (error) console.warn("Background sync failed:", error); });
    }
  }
};

// --- STUDENT POINTS ---

export const getStudentPoints = async (idKelas?: string, schoolId?: string): Promise<StudentPoint[]> => {
  const all = await getAll<StudentPoint>('studentPoints');
  let filtered = all;
  if (schoolId) filtered = filtered.filter(p => p.schoolId === schoolId);
  if (idKelas) filtered = filtered.filter(p => p.idKelas === idKelas);
  return filtered;
};

export const saveStudentPoint = async (point: StudentPoint): Promise<void> => {
  await putOne('studentPoints', point);
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      supabase.from('student_points').upsert({
        id: point.id, user_id: session.user.id, school_id: point.schoolId, id_siswa: point.idSiswa, id_kelas: point.idKelas,
        tanggal: point.tanggal, poin: point.poin, keterangan: point.keterangan, tipe: point.tipe
      }).then(({ error }) => { if (error) console.warn("Background sync failed:", error); });
    }
  }
};

export const deleteStudentPoint = async (id: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['studentPoints'], 'readwrite');
  tx.objectStore('studentPoints').delete(id);
  
  if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) supabase.from('student_points').delete().eq('id', id).then(({ error }) => { if (error) console.warn(error); });
    });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// --- POINT TEMPLATES (NEW) ---

export const getPointTemplates = async (schoolId?: string): Promise<PointTemplate[]> => {
  const all = await getAll<PointTemplate>('pointTemplates');
  if (schoolId) return all.filter(t => t.schoolId === schoolId);
  return all;
};

export const savePointTemplate = async (template: PointTemplate): Promise<void> => {
  await putOne('pointTemplates', template);
  if (supabase) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      supabase.from('point_templates').upsert({
        id: template.id, user_id: session.user.id, school_id: template.schoolId, 
        title: template.title, amount: template.amount, type: template.type
      }).then(({ error }) => { if (error) console.warn("Background sync failed:", error); });
    }
  }
};

export const deletePointTemplate = async (id: string): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['pointTemplates'], 'readwrite');
  tx.objectStore('pointTemplates').delete(id);
  
  if (supabase) {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) supabase.from('point_templates').delete().eq('id', id).then(({ error }) => { if (error) console.warn(error); });
    });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};


// --- BACKUP & RESTORE ---

export const createBackup = async (mode: 'full' | 'master' = 'full'): Promise<DBState> => {
  const teacherProfile = await getTeacherProfile();
  const schools = await getSchools();
  const classes = await getAll<ClassData>('classes');
  const students = await getAll<Student>('students');
  const learningObjectives = await getAll<LearningObjective>('learningObjectives');
  const pointTemplates = await getAll<PointTemplate>('pointTemplates');

  let meetings: Meeting[] = [];
  let meetingScores: MeetingScore[] = [];
  let finalGrades: FinalGradeRecord[] = [];
  let studentPoints: StudentPoint[] = [];

  if (mode === 'full') {
    meetings = await getAll<Meeting>('meetings');
    meetingScores = await getAll<MeetingScore>('meetingScores');
    finalGrades = await getAll<FinalGradeRecord>('finalGrades');
    studentPoints = await getAll<StudentPoint>('studentPoints');
  }

  return {
    schemaVersion: 3,
    teacherProfile,
    schools,
    classes,
    students,
    meetings,
    meetingScores,
    finalGrades,
    studentPoints,
    learningObjectives,
    pointTemplates,
    updatedAt: new Date().toISOString()
  };
};

export const restoreBackup = async (data: any, mode: 'full' | 'master' = 'full'): Promise<boolean> => {
  if (!data || typeof data !== 'object') return false;
  
  const dbInstance = await getDB();
  const stores = ['teacherProfile', 'schools', 'classes', 'students', 'meetings', 'meetingScores', 'finalGrades', 'studentPoints', 'learningObjectives', 'pointTemplates'];
  const tx = dbInstance.transaction(stores, 'readwrite');
  
  tx.objectStore('teacherProfile').clear();
  tx.objectStore('schools').clear();
  tx.objectStore('classes').clear();
  tx.objectStore('students').clear();
  tx.objectStore('meetings').clear();
  tx.objectStore('meetingScores').clear();
  tx.objectStore('finalGrades').clear();
  tx.objectStore('learningObjectives').clear();
  tx.objectStore('studentPoints').clear();
  tx.objectStore('pointTemplates').clear();

  if (data.teacherProfile) tx.objectStore('teacherProfile').put(data.teacherProfile);
  if (data.schools) data.schools.forEach((x: any) => tx.objectStore('schools').put(x));
  if (data.classes) data.classes.forEach((x: any) => tx.objectStore('classes').put(x));
  if (data.students) data.students.forEach((x: any) => tx.objectStore('students').put(x));
  if (data.meetings) data.meetings.forEach((x: any) => tx.objectStore('meetings').put(x));
  if (data.meetingScores) data.meetingScores.forEach((x: any) => tx.objectStore('meetingScores').put(x));
  if (data.finalGrades) data.finalGrades.forEach((x: any) => tx.objectStore('finalGrades').put(x));
  if (data.learningObjectives) data.learningObjectives.forEach((x: any) => tx.objectStore('learningObjectives').put(x));
  if (data.studentPoints) data.studentPoints.forEach((x: any) => tx.objectStore('studentPoints').put(x));
  if (data.pointTemplates) data.pointTemplates.forEach((x: any) => tx.objectStore('pointTemplates').put(x));
  
  if (mode === 'full') {
      if (Array.isArray(data.meetings)) data.meetings.forEach((x: any) => tx.objectStore('meetings').put(x));
      if (Array.isArray(data.meetingScores)) data.meetingScores.forEach((x: any) => tx.objectStore('meetingScores').put(x));
      if (Array.isArray(data.finalGrades)) data.finalGrades.forEach((x: any) => tx.objectStore('finalGrades').put(x));
      if (Array.isArray(data.studentPoints)) data.studentPoints.forEach((x: any) => tx.objectStore('studentPoints').put(x));
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(false);
  });
};

// --- SYNC ENGINE ---

export const syncLocalToCloud = async (): Promise<boolean> => {
  if (!supabase) return false;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  updateSyncStatus(true);
  try {
    const backup = await createBackup('full');
    const uid = session.user.id;
    
    if (backup.teacherProfile) {
      const p = backup.teacherProfile;
      const activeSchool = p.schools.find(s => s.id === p.activeSchoolId);
      const now = new Date().toISOString();
      const { error } = await supabase.from('teacher_profiles').upsert({
         user_id: uid, nama_guru: p.namaGuru, sekolah: activeSchool?.nama || '',
         tahun_ajaran: p.tahunAjaran, semester: p.semester || '1',
         subjects: p.subjects, foto_url: p.fotoUrl, nip: p.nip,
         kkm_default: p.kkmDefault, mode_cepat_default: p.modeCepatDefault,
         bintang_aktif: p.bintangAktif, konversi_bintang_aktif: p.konversiBintangAktif,
         konversi_bintang_rate: p.konversiBintangRate, konversi_bintang_max_bonus: p.konversiBintangMaxBonus,
         weights: p.weights, active_school_id: p.activeSchoolId, updated_at: now
      });
      if (error) {
        console.error("Sync error profile:", error);
      } else {
        // Success: also update local timestamp to match cloud
        await putOne('teacherProfile', { ...p, id: 'profile', lastUpdatedAt: now });
      }
    }

    if (backup.schools.length > 0) {
      await supabase.from('schools').upsert(backup.schools.map(s => ({
        id: s.id, name: s.nama, created_at: s.createdAt
      })));
      await supabase.from('teacher_schools').upsert(backup.schools.map(s => ({
        teacher_id: uid, school_id: s.id, academic_year: s.tahunAjaran, semester: s.semester
      })));
    }

    if (backup.classes.length > 0) {
      await supabase.from('classes').upsert(backup.classes.map(c => ({
        id: c.idKelas, id_kelas: c.idKelas, teacher_id: uid, school_id: c.schoolId, name: c.namaKelas, nama_kelas: c.namaKelas, subject: c.mapel, mapel: c.mapel
      })));
    }
    
    if (backup.students.length > 0) {
      await supabase.from('students').upsert(backup.students.map(s => ({
        id: s.idSiswa, id_siswa: s.idSiswa, teacher_id: uid, school_id: s.schoolId, class_id: s.idKelas, id_kelas: s.idKelas, name: s.nama, nama: s.nama, nisn: s.nisn
      })));
    }

    if (backup.learningObjectives.length > 0) {
      await supabase.from('learning_objectives').upsert(backup.learningObjectives.map(lo => ({
        id: lo.id, user_id: uid, school_id: lo.schoolId, mapel: lo.mapel, kode: lo.kode, deskripsi: lo.deskripsi
      })));
    }

    if (backup.meetings.length > 0) {
      await supabase.from('meetings').upsert(backup.meetings.map(m => ({
        id_pertemuan: m.idPertemuan, user_id: uid, school_id: m.schoolId, id_kelas: m.idKelas, 
        mapel: m.mapel, semester: m.semester, urutan_ke: m.urutanKe, tanggal: m.tanggal,
        materi: m.materi, jenis: m.jenis, activity_type: m.activityType, 
        activity_name: m.activityName, assessment_category: m.assessmentCategory,
        aspek_penilaian: m.aspekPenilaian
      })));
    }

    if (backup.meetingScores.length > 0) {
      await supabase.from('meeting_scores').upsert(backup.meetingScores.map(sc => ({
        id: sc.id, user_id: uid, school_id: sc.schoolId, id_pertemuan: sc.idPertemuan, id_siswa: sc.idSiswa,
        nilai_angka: sc.nilaiAngka, bintang: sc.bintang, catatan: sc.catatan, last_updated: new Date(sc.lastUpdated).toISOString()
      })));
    }

    if (backup.studentPoints.length > 0) {
      await supabase.from('student_points').upsert(backup.studentPoints.map(p => ({
        id: p.id, id_siswa: p.idSiswa, id_kelas: p.idKelas, user_id: uid,
        tanggal: p.tanggal, poin: p.poin, keterangan: p.keterangan, tipe: p.tipe
      })));
    }

    if (backup.finalGrades.length > 0) {
      await supabase.from('final_grades').upsert(backup.finalGrades.map(fg => ({
        id_siswa: fg.idSiswa, id_kelas: fg.idKelas, user_id: uid,
        nilai_smt_lalu: fg.nilaiSmtLalu, nilai_manual: fg.nilaiManual
      })));
    }

    if (backup.pointTemplates.length > 0) {
      await supabase.from('point_templates').upsert(backup.pointTemplates.map(pt => ({
        id: pt.id, user_id: uid, school_id: pt.schoolId, 
        title: pt.title, amount: pt.amount, type: pt.type
      })));
    }

    return true;
  } catch (err) {
    console.error("Sync to cloud error:", err);
    return false;
  } finally {
    updateSyncStatus(false);
  }
};

export const syncCloudToLocal = async (existingProfile?: TeacherProfile | null): Promise<boolean> => {
  if (!supabase) return false;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  updateSyncStatus(true);
  try {
    const uid = session.user.id;
    // Get the latest local profile to ensure we have the most recent activeSchoolId
    const profile = existingProfile || await getTeacherProfile();

    const validUid = (uid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) ? uid : null;
    const classQuery = validUid 
      ? supabase.from('classes').select('*').or(`teacher_id.eq.${validUid},school_id.eq.fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7`)
      : supabase.from('classes').select('*').eq('school_id', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7');

    const studentQuery = validUid
      ? supabase.from('students').select('*').or(`teacher_id.eq.${validUid},school_id.eq.fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7`)
      : supabase.from('students').select('*').eq('school_id', 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7');

    const [schRes, cRes, sRes, mRes, msRes, spRes, fgRes, loRes, tpRes, ptRes] = await Promise.all([
      supabase.from('teacher_schools').select('school_id, academic_year, semester, schools(id, name, created_at)').eq('teacher_id', uid),
      classQuery,
      studentQuery,
      supabase.from('meetings').select('*').eq('user_id', uid),
      supabase.from('meeting_scores').select('*').eq('user_id', uid),
      supabase.from('student_points').select('*').eq('user_id', uid),
      supabase.from('final_grades').select('*').eq('user_id', uid),
      supabase.from('learning_objectives').select('*').eq('user_id', uid),
      supabase.from('teacher_profiles').select('*').eq('user_id', uid).maybeSingle(),
      supabase.from('point_templates').select('*').eq('user_id', uid)
    ]);

    if (!schRes.data || !cRes.data || !sRes.data) {
        console.warn("Cloud sync returned incomplete data, skipping local update to prevent data loss.");
        return false;
    }

    const cloudUpdatedAt = (tpRes as any).data?.updated_at;
    const activeSchoolIdFromCloud = (tpRes as any).data?.active_school_id;
    // VERY IMPORTANT: Keep current local activeSchoolId if it exists to allow switching, otherwise use cloud value
    if (profile) {
        if (!profile.activeSchoolId && activeSchoolIdFromCloud) {
            profile.activeSchoolId = activeSchoolIdFromCloud;
        }
        if (cloudUpdatedAt) {
            profile.lastUpdatedAt = cloudUpdatedAt;
        }
    }

    // Instead of clear & restore, we do additive/upsert sync
    const db = await getDB();
    const tx = db.transaction(['teacherProfile', 'schools', 'classes', 'students', 'meetings', 'meetingScores', 'finalGrades', 'studentPoints', 'learningObjectives', 'pointTemplates'], 'readwrite');
    
        if (profile) tx.objectStore('teacherProfile').put({ ...profile, id: 'profile' });
        
        const schools = (schRes.data || []).map((row: any) => {
            const s = Array.isArray(row.schools) ? row.schools[0] : row.schools;
            return {
                id: row.school_id,
                nama: s?.name || '',
                tahunAjaran: row.academic_year || '',
                semester: row.semester || '',
                kkmDefault: 75,
                createdAt: s?.created_at || new Date().toISOString()
            };
        });
        
        const firstSchoolId = schools.length > 0 && schools[0]?.id ? schools[0].id : (profile?.schools && profile.schools.length > 0 && profile.schools[0]?.id ? profile.schools[0].id : '');
        const targetSchoolId = profile?.activeSchoolId || firstSchoolId;

        schools.forEach(s => tx.objectStore('schools').put(s));

        // CRITICAL: Update the schools list in the profile with the freshly synced schools
        if (profile) {
            profile.schools = schools;
            tx.objectStore('teacherProfile').put({ ...profile, id: 'profile' });
        }

        const classes = (cRes.data || []).map((row: any) => ({
            id: row.id || row.id_kelas,
            idKelas: row.id_kelas || row.id,
            schoolId: row.school_id || targetSchoolId,
            school_id: row.school_id || targetSchoolId,
            name: row.name || row.nama_kelas || 'Kelas',
            namaKelas: row.nama_kelas || row.name || 'Kelas',
            subject: row.subject || row.mapel || '',
            mapel: row.mapel || row.subject || ''
        }));
        if (classes.length > 0) {
          const classStore = tx.objectStore('classes');
          classes.forEach(c => classStore.put(c));
        }

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

        const students = (sRes.data || []).map((row: any) => {
          const cId = row.class_id || row.id_kelas || row.classId || null;
          const fallbackName = cId ? CLASS_ID_MAP[cId] : null;
          const cName = row.class_name || row.className || row.nama_kelas || row.namaKelas || (row.classes ? (row.classes.name || row.classes.nama_kelas) : null) || fallbackName;

          return {
            id: row.id || row.id_siswa,
            idSiswa: row.id_siswa || row.id,
            schoolId: row.school_id || targetSchoolId,
            school_id: row.school_id || targetSchoolId,
            classId: cId,
            class_id: cId,
            idKelas: cId,
            className: cName,
            namaKelas: cName,
            class_name: cName,
            name: row.name || row.nama || 'Siswa',
            nama: row.nama || row.name || 'Siswa',
            studentCode: row.student_code,
            student_code: row.student_code,
            nisn: row.nisn || '',
            gender: row.gender || 'L',
            password: row.password || 'murid19'
          };
        });
        if (students.length > 0) {
          const studentStore = tx.objectStore('students');
          await studentStore.clear();
          students.forEach(s => studentStore.put(s));
        }

        const learningObjectives = (loRes.data || []).map((row: any) => ({
            id: row.id, schoolId: row.school_id || targetSchoolId, mapel: row.mapel, kode: row.kode, deskripsi: row.deskripsi
        }));
        learningObjectives.forEach(lo => tx.objectStore('learningObjectives').put(lo));

        const meetings = (mRes.data || []).map((row: any) => ({
            idPertemuan: row.id_pertemuan, schoolId: row.school_id || targetSchoolId, idKelas: row.id_kelas, mapel: row.mapel, semester: row.semester,
            urutanKe: row.urutan_ke, tanggal: row.tanggal, materi: row.materi, jenis: row.jenis,
            activityType: row.activity_type, activityName: row.activity_name, assessmentCategory: row.assessment_category, 
            aspekPenilaian: row.aspek_penilaian || 'Pengetahuan', idTP: row.id_tp
        }));
        meetings.forEach(m => tx.objectStore('meetings').put(m));

        const scores = (msRes.data || []).map((row: any) => ({
            id: row.id, schoolId: row.school_id || targetSchoolId, idPertemuan: row.id_pertemuan, idSiswa: row.id_siswa,
            nilaiAngka: row.nilai_angka, bintang: row.bintang, catatan: row.catatan, lastUpdated: new Date(row.last_updated).getTime()
        }));
        scores.forEach(s => tx.objectStore('meetingScores').put(s));

        const points = (spRes.data || []).map((row: any) => ({
            id: row.id, schoolId: row.school_id || targetSchoolId, idSiswa: row.id_siswa, idKelas: row.id_kelas,
            tanggal: row.tanggal, poin: row.poin, keterangan: row.keterangan, tipe: row.tipe
        }));
        points.forEach(p => tx.objectStore('studentPoints').put(p));

        const finals = (fgRes.data || []).map((row: any) => ({
            idSiswa: row.id_siswa, schoolId: row.school_id || targetSchoolId, idKelas: row.id_kelas, nilaiSmtLalu: row.nilai_smt_lalu, nilai_manual: row.nilai_manual
        }));
        finals.forEach(f => tx.objectStore('finalGrades').put(f));

        const templates = (ptRes.data || []).map((row: any) => ({
            id: row.id, schoolId: row.school_id || targetSchoolId, title: row.title, amount: row.amount, type: row.type
        }));
        templates.forEach(t => tx.objectStore('pointTemplates').put(t));

        return new Promise<boolean>((resolve) => {
            tx.oncomplete = () => {
                console.log("Cloud to Local sync completed (Upsert Mode)");
                updateSyncStatus(false);
                resolve(true);
            };
            tx.onerror = () => {
                console.error("Sync transaction failed:", tx.error);
                updateSyncStatus(false);
                resolve(false);
            };
        });
    } catch (err) {
        console.error("Sync mapping error:", err);
        updateSyncStatus(false);
        return false;
    }
};

const ensureUUIDCompliance = async (): Promise<boolean> => {
   const backup = await createBackup('full');
   let needsUpdate = false;
   
   const isInvalid = (id: string | undefined) => {
       if (!id) return false;
       return !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
   };
   
   const idMap: Record<string, string> = {};
   const mapId = (oldId: string | undefined) => {
       if (!oldId || !isInvalid(oldId)) return oldId || '';
       if (!idMap[oldId]) idMap[oldId] = crypto.randomUUID();
       needsUpdate = true;
       return idMap[oldId];
   };

   backup.classes.forEach(c => { c.idKelas = mapId(c.idKelas); });
   backup.students.forEach(s => { s.idSiswa = mapId(s.idSiswa); s.idKelas = mapId(s.idKelas); });
   backup.learningObjectives.forEach(lo => { lo.id = mapId(lo.id); });
   backup.meetings.forEach(m => { 
       m.idPertemuan = mapId(m.idPertemuan); 
       m.idKelas = mapId(m.idKelas); 
       if (m.idTP) m.idTP = mapId(m.idTP);
   });
   backup.meetingScores.forEach(ms => { 
       ms.idPertemuan = mapId(ms.idPertemuan); 
       ms.idSiswa = mapId(ms.idSiswa); 
       ms.id = `${ms.idPertemuan}_${ms.idSiswa}`; 
   });
   backup.studentPoints.forEach(sp => { sp.id = mapId(sp.id); sp.idSiswa = mapId(sp.idSiswa); sp.idKelas = mapId(sp.idKelas); });
   backup.finalGrades.forEach(fg => { fg.idSiswa = mapId(fg.idSiswa); fg.idKelas = mapId(fg.idKelas); });

   if (needsUpdate) {
       await restoreBackup(backup, 'full');
       return true;
   }
   return false;
};

const migrateLegacyData = async (schoolId: string): Promise<void> => {
   const backup = await createBackup('full');
   let needsUpdate = false;
   
   // Safety checks for backup data
   const checkAndTag = (list: any[]) => {
       if (!list || !Array.isArray(list)) return;
       list.forEach(item => {
           if (!item.schoolId) {
               item.schoolId = schoolId;
               needsUpdate = true;
           }
       });
   };

   checkAndTag(backup.classes);
   checkAndTag(backup.students);
   checkAndTag(backup.meetings);
   checkAndTag(backup.meetingScores);
   checkAndTag(backup.studentPoints);
   checkAndTag(backup.finalGrades);
   checkAndTag(backup.learningObjectives);

   if (needsUpdate) {
       // Using putOne loop instead of clear-all restoreBackup to be safer
       const db = await getDB();
       const stores = ['classes', 'students', 'meetings', 'meetingScores', 'studentPoints', 'finalGrades', 'learningObjectives'];
       const tx = db.transaction(stores, 'readwrite');
       
       backup.classes.forEach(x => tx.objectStore('classes').put(x));
       backup.students.forEach(x => tx.objectStore('students').put(x));
       backup.meetings.forEach(x => tx.objectStore('meetings').put(x));
       backup.meetingScores.forEach(x => tx.objectStore('meetingScores').put(x));
       backup.studentPoints.forEach(x => tx.objectStore('studentPoints').put(x));
       backup.finalGrades.forEach(x => tx.objectStore('finalGrades').put(x));
       backup.learningObjectives.forEach(x => tx.objectStore('learningObjectives').put(x));

       return new Promise<void>((resolve) => {
           tx.oncomplete = () => {
               console.log("Migration completed: Untagged data tagged with school", schoolId);
               resolve();
           };
       });
   }
};

export const performAutoSync = async (): Promise<void> => {
    if (!supabase || !navigator.onLine) return;
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const profile = await getTeacherProfile();
        if (!profile) return;

        if (profile.schools && profile.schools.length > 0 && profile.schools[0]?.id) {
            await migrateLegacyData(profile.schools[0].id);
        }
        await ensureUUIDCompliance();

        // --- SMART SYNC LOGIC ---
        // SMART PROTECTION FOR EDU-SCORE: If local DB has 0 classes, check if Cloud has data and pull first!
        const localClasses = await getClasses();
        if (!localClasses || localClasses.length === 0) {
            const { count: cloudClassCount } = await supabase
                .from('classes')
                .or(`teacher_id.eq.${session.user.id},school_id.eq.fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7,teacher_id.is.null,school_id.is.null`);

            if (cloudClassCount && cloudClassCount > 0) {
                console.log(`[dbGrading] Local DB is empty, but Cloud has ${cloudClassCount} classes. Auto-restoring from Cloud...`);
                await syncCloudToLocal(profile);
                return;
            }
        }

        const { data: cloudProfile, error: cloudError } = await supabase
            .from('teacher_profiles')
            .select('updated_at')
            .eq('user_id', session.user.id)
            .single();

        if (cloudError || !cloudProfile) {
            // First time or error, push local to be safe ONLY if local is not empty
            if (localClasses && localClasses.length > 0) {
                await syncLocalToCloud();
            }
            return;
        }

        const cloudTime = new Date(cloudProfile.updated_at).getTime();
        const localTime = profile.lastUpdatedAt ? new Date(profile.lastUpdatedAt).getTime() : 0;

        console.log(`Smart Sync Check: Cloud(${cloudTime}) vs Local(${localTime})`);

        // If local is missing timestamp or cloud is newer, pull!
        if (!profile.lastUpdatedAt || cloudTime > localTime) {
            console.log("Cloud is newer (or local empty), pulling data...");
            await syncCloudToLocal(profile);
        } else if (localTime > cloudTime && localClasses && localClasses.length > 0) {
            console.log("Local is newer and non-empty, pushing data...");
            await syncLocalToCloud();
        } else {
            console.log("Everything is in sync, skipping.");
        }
    } catch (e) {
       console.warn("Auto background DB sync paused:", e);
    }
};

export const transferDataBetweenSchools = async (fromId: string, toId: string): Promise<void> => {
    const db = await getDB();
    const stores = ['classes', 'students', 'meetings', 'meetingScores', 'studentPoints', 'finalGrades', 'learningObjectives'];
    const tx = db.transaction(stores, 'readwrite');
    
    for (const storeName of stores) {
        const store = tx.objectStore(storeName);
        const all = await new Promise<any[]>((resolve) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
        });
        
        all.forEach(item => {
            if (item.schoolId === fromId) {
                item.schoolId = toId;
                store.put(item);
            }
        });
    }
    
    return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
    });
};

export const resetGradingDB = async (): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction([
    'teacherProfile', 'schools', 'classes', 'students', 
    'meetings', 'meetingScores', 'finalGrades', 
    'learningObjectives', 'studentPoints', 'pointTemplates'
  ], 'readwrite');
  
  tx.objectStore('teacherProfile').clear();
  tx.objectStore('schools').clear();
  tx.objectStore('classes').clear();
  tx.objectStore('students').clear();
  tx.objectStore('meetings').clear();
  tx.objectStore('meetingScores').clear();
  tx.objectStore('finalGrades').clear();
  tx.objectStore('learningObjectives').clear();
  tx.objectStore('studentPoints').clear();
  tx.objectStore('pointTemplates').clear();
  
  await new Promise<void>((resolve) => {
    tx.oncomplete = () => resolve();
  });
  localStorage.removeItem(LOCAL_STORAGE_KEY);
};
