import { openDB } from 'idb';

export interface BackupPayload {
  app: string;
  version: string;
  timestamp: string;
  teacher?: any;
  summary: {
    classesCount: number;
    studentsCount: number;
    attendanceRecordsCount: number;
    gradesCount: number;
  };
  educheck: {
    classes: any[];
    students: any[];
    sessions: any[];
    records: any[];
    schedules: any[];
    events: any[];
    materials: any[];
    assignments: any[];
  };
  eduscore: {
    meetings: any[];
    meetingScores: any[];
    finalGrades: any[];
    studentPoints: any[];
    learningObjectives: any[];
  };
}

/**
 * Reads all objects from an IndexedDB database safely
 */
async function readAllFromDB(dbName: string, storeNames: string[]): Promise<Record<string, any[]>> {
  const result: Record<string, any[]> = {};
  try {
    const db = await openDB(dbName);
    for (const store of storeNames) {
      if (db.objectStoreNames.contains(store)) {
        result[store] = await db.getAll(store);
      } else {
        result[store] = [];
      }
    }
    db.close();
  } catch (err) {
    console.warn(`[Vault] Could not read from ${dbName}:`, err);
    for (const store of storeNames) {
      result[store] = [];
    }
  }
  return result;
}

/**
 * Creates and triggers a download of a complete local backup snapshot (.json)
 */
export async function exportEmergencyBackup(): Promise<{ filename: string; sizeBytes: number }> {
  const educheckStores = ['classes', 'students', 'sessions', 'records', 'schedules', 'events', 'materials', 'assignments'];
  const eduscoreStores = ['meetings', 'meetingScores', 'finalGrades', 'studentPoints', 'learningObjectives'];

  const educheckData = await readAllFromDB('educheck-db', educheckStores);
  const eduscoreData = await readAllFromDB('EduScoreDB', eduscoreStores);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `EduVerse_Cadangan_${dateStr}_${timeStr}.json`;

  const payload: BackupPayload = {
    app: 'EduVerse',
    version: '2.0',
    timestamp: now.toISOString(),
    summary: {
      classesCount: Math.max(educheckData.classes?.length || 0, 0),
      studentsCount: Math.max(educheckData.students?.length || 0, 0),
      attendanceRecordsCount: Math.max(educheckData.records?.length || 0, 0),
      gradesCount: Math.max(eduscoreData.meetingScores?.length || 0, 0),
    },
    educheck: {
      classes: educheckData.classes || [],
      students: educheckData.students || [],
      sessions: educheckData.sessions || [],
      records: educheckData.records || [],
      schedules: educheckData.schedules || [],
      events: educheckData.events || [],
      materials: educheckData.materials || [],
      assignments: educheckData.assignments || [],
    },
    eduscore: {
      meetings: eduscoreData.meetings || [],
      meetingScores: eduscoreData.meetingScores || [],
      finalGrades: eduscoreData.finalGrades || [],
      studentPoints: eduscoreData.studentPoints || [],
      learningObjectives: eduscoreData.learningObjectives || [],
    },
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return {
    filename,
    sizeBytes: blob.size,
  };
}

/**
 * Restores data from a backup JSON file back into IndexedDB
 */
export async function restoreEmergencyBackup(file: File): Promise<{
  success: boolean;
  message: string;
  summary?: any;
}> {
  try {
    const text = await file.text();
    const data: BackupPayload = JSON.parse(text);

    if (!data.app || data.app !== 'EduVerse' || !data.educheck) {
      throw new Error('Format berkas cadangan tidak valid atau bukan berkas EduVerse resmi.');
    }

    // Restore to educheck-db
    try {
      const dbCheck = await openDB('educheck-db');
      for (const [storeName, items] of Object.entries(data.educheck)) {
        if (dbCheck.objectStoreNames.contains(storeName) && Array.isArray(items)) {
          const tx = dbCheck.transaction(storeName, 'readwrite');
          for (const item of items) {
            await tx.store.put(item);
          }
          await tx.done;
        }
      }
      dbCheck.close();
    } catch (checkErr) {
      console.warn('[Vault] Failed restoring some educheck stores:', checkErr);
    }

    // Restore to EduScoreDB
    if (data.eduscore) {
      try {
        const dbScore = await openDB('EduScoreDB');
        for (const [storeName, items] of Object.entries(data.eduscore)) {
          if (dbScore.objectStoreNames.contains(storeName) && Array.isArray(items)) {
            const tx = dbScore.transaction(storeName, 'readwrite');
            for (const item of items) {
              await tx.store.put(item);
            }
            await tx.done;
          }
        }
        dbScore.close();
      } catch (scoreErr) {
        console.warn('[Vault] Failed restoring some eduscore stores:', scoreErr);
      }
    }

    return {
      success: true,
      message: `Data berhasil dipulihkan! (${data.summary?.classesCount || 0} Kelas, ${data.summary?.studentsCount || 0} Siswa, ${data.summary?.attendanceRecordsCount || 0} Presensi)`,
      summary: data.summary,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal memulihkan berkas cadangan.',
    };
  }
}
