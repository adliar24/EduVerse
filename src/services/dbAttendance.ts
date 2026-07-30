import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { TeacherProfile, ClassEntity, Student, AttendanceSession, AttendanceRecord, AppState, ScheduleItem, CalendarEvent, ClassCancellation, Material, Assignment } from '../types';
import { getSupabaseClientOrNull, supabase } from './supabase';

interface EduTrackDB extends DBSchema {
  teacher: {
    key: string;
    value: TeacherProfile;
  };
  classes: {
    key: string;
    value: ClassEntity;
    indexes: { 'by-name': string };
  };
  students: {
    key: string;
    value: Student;
    indexes: { 'by-class': string };
  };
  sessions: {
    key: string;
    value: AttendanceSession;
    indexes: { 'by-class-year': [string, string]; 'by-class-date': [string, string] };
  };
  records: {
    key: string;
    value: AttendanceRecord;
    indexes: { 'by-session': string; 'by-student': string };
  };
  schedules: {
    key: string;
    value: ScheduleItem;
    indexes: { 'by-day': string };
  };
  events: {
    key: string;
    value: CalendarEvent;
    indexes: { 'by-date': string };
  };
  cancellations: {
    key: string;
    value: ClassCancellation;
    indexes: { 'by-date': string; 'by-class': string };
  };
  materials: {
    key: string;
    value: Material;
  };
  assignments: {
    key: string;
    value: Assignment;
  };
}

const DB_NAME = 'educheck-db';
const DB_VERSION = 6; // Bump version to 6 for materials and assignments

let dbPromise: Promise<IDBPDatabase<EduTrackDB>>;
let currentDbName: string | null = null;

const AUTH_SCOPE_KEY = 'educheck_auth_user_id';
const ACTIVE_CLASS_KEY = 'activeClassId';

let stateCache: { data: AppState | null; timestamp: number } = { data: null, timestamp: 0 };
const STATE_CACHE_TTL = 3000;

const getScopedUserId = () => {
  if (typeof window === 'undefined') return 'guest';
  return localStorage.getItem(AUTH_SCOPE_KEY) || 'guest';
};

const getScopedDbName = () => `${DB_NAME}-${getScopedUserId()}`;

const getScopedStorageKey = (key: string) => `${getScopedUserId()}:${key}`;

export const setAuthScope = async (userId: string | null) => {
  if (typeof window !== 'undefined') {
    if (userId) localStorage.setItem(AUTH_SCOPE_KEY, userId);
    else localStorage.removeItem(AUTH_SCOPE_KEY);
  }

  if (dbPromise) {
    const db = await dbPromise;
    db.close();
  }

  dbPromise = undefined as any;
  currentDbName = null;
};

export const initDB = () => {
  const scopedDbName = getScopedDbName();
  if (!dbPromise || currentDbName !== scopedDbName) {
    currentDbName = scopedDbName;
    dbPromise = openDB<EduTrackDB>(scopedDbName, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        try {
          if (oldVersion < 1) {
            db.createObjectStore('teacher', { keyPath: 'id' });
            const classStore = db.createObjectStore('classes', { keyPath: 'id' });
            classStore.createIndex('by-name', 'name');

            const studentStore = db.createObjectStore('students', { keyPath: 'id' });
            studentStore.createIndex('by-class', 'classId');

            const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
            sessionStore.createIndex('by-class-year', ['classId', 'schoolYear']);
            sessionStore.createIndex('by-class-date', ['classId', 'dateISO']);

            const recordStore = db.createObjectStore('records', { keyPath: 'id' });
            recordStore.createIndex('by-session', 'sessionId');
            recordStore.createIndex('by-student', 'studentId');
          }
          if (oldVersion < 2) {
            const scheduleStore = db.createObjectStore('schedules', { keyPath: 'id' });
            scheduleStore.createIndex('by-day', 'dayName');
          }
          if (oldVersion < 3) {
            const eventStore = db.createObjectStore('events', { keyPath: 'id' });
            eventStore.createIndex('by-date', 'dateISO');
          }
          if (oldVersion < 4) {
            const cancelStore = db.createObjectStore('cancellations', { keyPath: 'id' });
            cancelStore.createIndex('by-date', 'dateISO');
            cancelStore.createIndex('by-class', 'classId');
          }
          if (oldVersion < 6) {
            if (!db.objectStoreNames.contains('materials')) {
              db.createObjectStore('materials', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('assignments')) {
              db.createObjectStore('assignments', { keyPath: 'id' });
            }
          }
        } catch (e) {
          console.error('Error in IndexedDB upgrade:', e);
        }
      },
    }).catch((error) => {
      console.error('Failed to open database:', error);
      throw error;
    });
  }
  return dbPromise;
};

// --- CRUD Operations ---

export const getFullState = async (forceRefresh = false): Promise<AppState> => {
  if (!forceRefresh && stateCache.data && Date.now() - stateCache.timestamp < STATE_CACHE_TTL) {
    return stateCache.data;
  }

  try {
    const db = await initDB();
    const tx = db.transaction(['teacher', 'classes', 'students', 'sessions', 'records', 'schedules', 'events', 'cancellations', 'materials', 'assignments'], 'readonly');
    
    const teachers = await tx.objectStore('teacher').getAll();
    const classes = await tx.objectStore('classes').getAll();
    const students = await tx.objectStore('students').getAll();
    const sessions = await tx.objectStore('sessions').getAll();
    const records = await tx.objectStore('records').getAll();
    const schedules = await tx.objectStore('schedules').getAll();
    const events = await tx.objectStore('events').getAll();
    const cancellations = await tx.objectStore('cancellations').getAll();
    const materials = await tx.objectStore('materials').getAll();
    const assignments = await tx.objectStore('assignments').getAll();
    
    await tx.done;

    const result: AppState = {
      teacher: teachers[0] || null,
      classes: classes || [],
      students: students || [],
      sessions: sessions || [],
      records: records || [],
      schedules: schedules || [],
      events: events || [],
      cancellations: cancellations || [],
      materials: materials || [],
      assignments: assignments || [],
      activeClassId: typeof window !== 'undefined' ? localStorage.getItem(getScopedStorageKey(ACTIVE_CLASS_KEY)) : null,
    };

    stateCache = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.error('Error in getFullState:', error);
    const emptyState: AppState = {
      teacher: null,
      classes: [],
      students: [],
      sessions: [],
      records: [],
      schedules: [],
      events: [],
      cancellations: [],
      materials: [],
      assignments: [],
      activeClassId: null,
    };
    stateCache = { data: emptyState, timestamp: Date.now() };
    return emptyState;
  }
};

export const saveTeacherProfile = async (profile: TeacherProfile, skipCloudPush = false) => {
  const db = await initDB();
  const tx = db.transaction('teacher', 'readwrite');
  await tx.objectStore('teacher').clear();
  await tx.objectStore('teacher').put(profile);
  await tx.done;
  stateCache.data = null;
  
  if (!skipCloudPush) {
    autoSyncToCloud();
  }
};

export const addClass = async (cls: ClassEntity) => {
  const db = await initDB();
  await db.put('classes', cls);
  autoSyncToCloud();
};

export const addClassesBulk = async (classesList: ClassEntity[]) => {
  if (!classesList || classesList.length === 0) return;
  const db = await initDB();
  const tx = db.transaction('classes', 'readwrite');
  const store = tx.objectStore('classes');
  for (const c of classesList) {
    await store.put(c);
  }
  await tx.done;
  stateCache.data = null;
};

export const deleteClassCascade = async (classId: string) => {
  const db = await initDB();
  const tx = db.transaction(['classes', 'students', 'sessions', 'records', 'schedules', 'cancellations'], 'readwrite');
  
  // 1. Delete Class
  await tx.objectStore('classes').delete(classId);

  // 2. Delete Students
  const students = await tx.objectStore('students').index('by-class').getAll(classId);
  for (const s of students) {
    await tx.objectStore('students').delete(s.id);
    const studentRecords = await tx.objectStore('records').index('by-student').getAll(s.id);
    for (const r of studentRecords) {
      await tx.objectStore('records').delete(r.id);
    }
  }

  // 3. Delete Sessions
  let allSessions = await tx.objectStore('sessions').getAll();
  const classSessions = allSessions.filter(s => s.classId === classId);
  
  for (const sess of classSessions) {
    await tx.objectStore('sessions').delete(sess.id);
    const sessionRecords = await tx.objectStore('records').index('by-session').getAll(sess.id);
    for (const r of sessionRecords) {
      await tx.objectStore('records').delete(r.id);
    }
  }

  // 4. Delete Schedules linked to this class
  let allSchedules = await tx.objectStore('schedules').getAll();
  const classSchedules = allSchedules.filter(s => s.classId === classId);
  for (const sch of classSchedules) {
    await tx.objectStore('schedules').delete(sch.id);
  }
  
  // 5. Delete Cancellations
  let allCancels = await tx.objectStore('cancellations').getAll();
  const classCancels = allCancels.filter(c => c.classId === classId);
  for(const c of classCancels) {
    await tx.objectStore('cancellations').delete(c.id);
  }

  await tx.done;
  
  if (typeof window !== 'undefined' && localStorage.getItem(getScopedStorageKey(ACTIVE_CLASS_KEY)) === classId) {
    localStorage.removeItem(getScopedStorageKey(ACTIVE_CLASS_KEY));
  }
  
  autoSyncToCloud();
};

export const addStudent = async (student: Student) => {
  const db = await initDB();
  await db.put('students', student);
  autoSyncToCloud();
};

export const addStudentsBulk = async (studentsList: Student[]) => {
  if (!studentsList || studentsList.length === 0) return;
  const db = await initDB();
  const tx = db.transaction('students', 'readwrite');
  const store = tx.objectStore('students');
  for (const s of studentsList) {
    await store.put(s);
  }
  await tx.done;
  stateCache.data = null;
};

export const deleteStudent = async (studentId: string) => {
  const db = await initDB();
  const tx = db.transaction(['students', 'records'], 'readwrite');
  await tx.objectStore('students').delete(studentId);
  const records = await tx.objectStore('records').index('by-student').getAll(studentId);
  for (const r of records) {
    await tx.objectStore('records').delete(r.id);
  }
  await tx.done;
  autoSyncToCloud();
};

export const addMaterial = async (material: Material) => {
  const db = await initDB();
  await db.put('materials', material);
  autoSyncToCloud();
};

export const deleteMaterial = async (materialId: string) => {
  const db = await initDB();
  await db.delete('materials', materialId);
  autoSyncToCloud();
};

export const addAssignment = async (assignment: Assignment) => {
  const db = await initDB();
  await db.put('assignments', assignment);
  autoSyncToCloud();
};

export const deleteAssignment = async (assignmentId: string) => {
  const db = await initDB();
  await db.delete('assignments', assignmentId);
  autoSyncToCloud();
};

export const upsertSession = async (session: AttendanceSession) => {
  const db = await initDB();
  await db.put('sessions', session);
  autoSyncToCloud();
};

export const deleteSession = async (sessionId: string) => {
  const db = await initDB();
  const tx = db.transaction(['sessions', 'records'], 'readwrite');
  
  await tx.objectStore('sessions').delete(sessionId);
  
  const records = await tx.objectStore('records').index('by-session').getAll(sessionId);
  for(const r of records) {
      await tx.objectStore('records').delete(r.id);
  }
  
  await tx.done;
  autoSyncToCloud();
};

export const upsertRecord = async (record: AttendanceRecord) => {
  const db = await initDB();
  await db.put('records', record);
  autoSyncToCloud();
};

export const deleteRecord = async (recordId: string) => {
  const db = await initDB();
  await db.delete('records', recordId);
  autoSyncToCloud();
};

export const addSchedule = async (schedule: ScheduleItem) => {
  const db = await initDB();
  await db.put('schedules', schedule);
  autoSyncToCloud();
}

export const deleteSchedule = async (id: string) => {
  const db = await initDB();
  await db.delete('schedules', id);
  autoSyncToCloud();
}

export const addEvent = async (event: CalendarEvent) => {
  const db = await initDB();
  await db.put('events', event);
  autoSyncToCloud();
}

export const deleteEvent = async (id: string) => {
  const db = await initDB();
  await db.delete('events', id);
  autoSyncToCloud();
}

export const addCancellation = async (cancel: ClassCancellation) => {
  const db = await initDB();
  await db.put('cancellations', cancel);
  autoSyncToCloud();
}

export const deleteCancellation = async (id: string) => {
  const db = await initDB();
  await db.delete('cancellations', id);
  autoSyncToCloud();
}

export const importStudents = async (students: Student[]) => {
  const db = await initDB();
  const tx = db.transaction('students', 'readwrite');
  for (const s of students) {
    await tx.store.put(s);
  }
  await tx.done;
  autoSyncToCloud();
};

// Utils
export const setActiveClassId = (id: string | null) => {
  if (typeof window === 'undefined') return;

  const storageKey = getScopedStorageKey(ACTIVE_CLASS_KEY);
  if (id) {
    localStorage.setItem(storageKey, id);
  } else {
    localStorage.removeItem(storageKey);
  }
};

export const resetAllData = async () => {
  skipSync = true;
  const db = await initDB();
  const tx = db.transaction(['teacher', 'classes', 'students', 'sessions', 'records', 'schedules', 'events', 'cancellations', 'materials', 'assignments'], 'readwrite');
  
  await tx.objectStore('teacher').clear();
  await tx.objectStore('classes').clear();
  await tx.objectStore('students').clear();
  await tx.objectStore('sessions').clear();
  await tx.objectStore('records').clear();
  await tx.objectStore('schedules').clear();
  await tx.objectStore('events').clear();
  await tx.objectStore('cancellations').clear();
  await tx.objectStore('materials').clear();
  await tx.objectStore('assignments').clear();
  await tx.done;

  if (typeof window !== 'undefined') {
    localStorage.removeItem(getScopedStorageKey(ACTIVE_CLASS_KEY));
  }
  
  // Delete all data from cloud
  try {
    const supabaseClient = getSupabaseClientOrNull();
    if (supabaseClient) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        const tables = ['teacher_profiles', 'classes', 'students', 'sessions', 'records', 'schedules', 'events', 'cancellations', 'materials', 'assignments'];
        for (const table of tables) {
          await supabaseClient.from(table).delete().eq('teacher_id', user.id);
        }
        console.log('[resetAllData] All cloud data deleted');
      }
    }
  } catch (e) {
    console.error('[resetAllData] Failed to delete cloud data:', e);
  }
  
  skipSync = false;
};

// Auto-sync to cloud after data changes
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let retryTimeout: ReturnType<typeof setTimeout> | null = null;
let skipSync = false;
let pendingSync = false; // Records added during active sync
let lastSyncAttempt = 0;
const SYNC_COOLDOWN = 1000; // 1 second between actual syncs
const MAX_RETRIES = 3;

export const setSkipSync = (value: boolean) => {
  skipSync = value;
};

export const clearStateCache = () => {
  stateCache = { data: null, timestamp: 0 };
};

const executeSync = async (retryCount = 0): Promise<boolean> => {
  try {
    const supabase = getSupabaseClientOrNull();
    if (!supabase) return false;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // AUTO-SYNC: Push local changes first, then pull latest from cloud
    lastSyncAttempt = Date.now();
    const { syncService } = await import('./sync');
    await syncService.pushToCloud();
    const result = await syncService.pullFromCloud();
    console.log('[Auto-sync push & pull] Result:', result);
    if (result.success && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cloud_data_synced'));
    }
    return result.success;
  } catch (e) {
    console.error('[Auto-sync] Failed:', e);
    return false;
  } finally {
    // If records were added during this sync, trigger a follow-up sync
    if (pendingSync) {
      pendingSync = false;
      console.log('[Auto-sync] Retrying for records added during sync...');
      setTimeout(() => autoSyncToCloud(), 500);
    }
  }
};

export const autoSyncToCloud = async () => {
  stateCache = { data: null, timestamp: 0 };
  
  if (skipSync) {
    console.log('[Auto-sync] Skipped (sync in progress), marking pending sync');
    pendingSync = true;
    return;
  }
  
  if (syncTimeout) clearTimeout(syncTimeout);
  if (retryTimeout) clearTimeout(retryTimeout);
  
  syncTimeout = setTimeout(async () => {
    const now = Date.now();
    if (now - lastSyncAttempt < SYNC_COOLDOWN) {
        // Reschedule instead of silently dropping
        const waitMs = SYNC_COOLDOWN - (now - lastSyncAttempt);
        console.log(`[Auto-sync] Cooldown active, rescheduling in ${waitMs}ms`);
        retryTimeout = setTimeout(async () => {
          const success = await executeSync(0);
          if (!success) {
            // Retry up to MAX_RETRIES with increasing delay
            for (let i = 1; i <= MAX_RETRIES; i++) {
              console.log(`[Auto-sync] Retry ${i}/${MAX_RETRIES}...`);
              await new Promise(r => setTimeout(r, 2000 * i));
              const retrySuccess = await executeSync(i);
              if (retrySuccess) break;
            }
          }
        }, waitMs);
        return;
    }

    const success = await executeSync(0);
    if (!success) {
      // Retry with increasing delay
      for (let i = 1; i <= MAX_RETRIES; i++) {
        console.log(`[Auto-sync] Retry ${i}/${MAX_RETRIES}...`);
        await new Promise(r => setTimeout(r, 2000 * i));
        const retrySuccess = await executeSync(i);
        if (retrySuccess) break;
      }
    }
  }, 1000); // Wait 1 second of inactivity before syncing
};

// Force sync immediately (for use on app resume / network reconnect)
export const forceSyncToCloud = async () => {
  if (skipSync) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  if (retryTimeout) clearTimeout(retryTimeout);
  
  const success = await executeSync(0);
  if (!success) {
    for (let i = 1; i <= MAX_RETRIES; i++) {
      console.log(`[Force-sync] Retry ${i}/${MAX_RETRIES}...`);
      await new Promise(r => setTimeout(r, 2000 * i));
      const retrySuccess = await executeSync(i);
      if (retrySuccess) break;
    }
  }
};

// Register global sync triggers (call once on app init)
let syncListenersRegistered = false;
let periodicSyncInterval: ReturnType<typeof setInterval> | null = null;
export const registerSyncListeners = () => {
  if (syncListenersRegistered || typeof window === 'undefined') return;
  syncListenersRegistered = true;

  // Sync when app comes back to foreground
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('[Sync] App resumed, triggering sync pull and push...');
      (async () => {
        try {
          const { syncService } = await import('./sync');
          await syncService.pullFromCloud();
          window.dispatchEvent(new Event('cloud_data_synced'));
        } catch (e) {
          console.warn('[Sync] Auto-pull on app resume failed:', e);
        }
        forceSyncToCloud();
      })();
    }
  });

  // Sync when network reconnects
  window.addEventListener('online', () => {
    console.log('[Sync] Network online, triggering sync...');
    setTimeout(async () => {
      try {
        const { syncService } = await import('./sync');
        await syncService.pullFromCloud();
        window.dispatchEvent(new Event('cloud_data_synced'));
      } catch (e) {
        console.warn('[Sync] Auto-pull on network online failed:', e);
      }
      forceSyncToCloud();
    }, 1000);
  });

  // Periodic background sync every 30s as safety net for missed syncs
  periodicSyncInterval = setInterval(() => {
    if (!skipSync && !pendingSync) {
      console.log('[Sync] Periodic background sync check...');
      forceSyncToCloud();
    }
  }, 30000);
};

export const clearSyncTimeout = () => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
};
