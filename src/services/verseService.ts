import { supabase, supabaseAnon } from '../lib/supabase';
import { StudentVerse, VerseElement, VerseSpecies } from '../types';
import { calculateLevelAndProgress, getStageForLevel, normalizeSpecies, getElementForSpecies } from '../utils/verseEngine';
import * as dbGrading from './dbGrading';

export interface PointHistoryItem {
  id: string;
  source: 'presensi' | 'tugas' | 'ujian' | 'guru' | 'bonus';
  title: string;
  date: string;
  points: number;
  type: 'positive' | 'negative';
}

const LOCAL_STORAGE_PREFIX = 'eduverse_verse_';

/**
 * Fetch Student Verse by Student ID
 */
export async function getStudentVerse(studentId: string): Promise<StudentVerse | null> {
  if (!studentId) return null;

  let localVerse: StudentVerse | null = null;
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${studentId}`);
    if (raw) localVerse = JSON.parse(raw);
  } catch (err) {
    console.warn('[verseService] Error reading local verse:', err);
  }

  // Try fetching from Supabase
  try {
    const client = supabaseAnon || supabase;
    const { data, error } = await client
      .from('student_verses')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    if (!error && data) {
      const cloudVerse: StudentVerse = {
        id: data.id,
        studentId: data.student_id,
        schoolId: data.school_id,
        species: data.species as VerseSpecies,
        element: data.element as VerseElement,
        nickname: data.nickname,
        lifetimePoints: data.lifetime_points || 0,
        level: data.level || 1,
        stage: data.stage || 1,
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
      };

      // Save to local cache
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${studentId}`, JSON.stringify(cloudVerse));
      return cloudVerse;
    }
  } catch (err) {
    // Cloud fetch failure (e.g. offline or table not yet migrated), fallback gracefully
    console.debug('[verseService] Supabase student_verses fetch skipped or failed:', err);
  }

  return localVerse;
}

/**
 * Save / Adopt a new or updated Student Verse
 */
export async function saveStudentVerse(verse: StudentVerse): Promise<StudentVerse> {
  const updatedVerse: StudentVerse = {
    ...verse,
    updatedAt: new Date().toISOString()
  };

  // Always save to localStorage immediately for instant offline reactivity
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${verse.studentId}`, JSON.stringify(updatedVerse));
  } catch (err) {
    console.warn('[verseService] Error saving local verse:', err);
  }

  // Try saving to Supabase
  try {
    const client = supabaseAnon || supabase;
    const payload = {
      id: updatedVerse.id,
      student_id: updatedVerse.studentId,
      school_id: updatedVerse.schoolId || null,
      species: updatedVerse.species,
      element: updatedVerse.element,
      nickname: updatedVerse.nickname,
      lifetime_points: updatedVerse.lifetimePoints,
      level: updatedVerse.level,
      stage: updatedVerse.stage,
      updated_at: updatedVerse.updatedAt,
    };

    const { data, error } = await client
      .from('student_verses')
      .upsert(payload, { onConflict: 'student_id' })
      .select()
      .maybeSingle();

    if (!error && data) {
      updatedVerse.id = data.id;
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${verse.studentId}`, JSON.stringify(updatedVerse));
    }
  } catch (err) {
    console.debug('[verseService] Supabase student_verses upsert fallback to local:', err);
  }

  return updatedVerse;
}

/**
 * Create and persist a new Student Verse upon initial egg hatching
 */
export async function createStudentVerse({
  studentId,
  schoolId,
  species,
  nickname
}: {
  studentId: string;
  schoolId?: string | null;
  species: VerseSpecies;
  nickname: string;
}): Promise<StudentVerse> {
  const normSpecies = normalizeSpecies(species);
  const element = getElementForSpecies(normSpecies);
  const newVerse: StudentVerse = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `verse_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    studentId,
    schoolId: schoolId || undefined,
    species: normSpecies,
    element,
    nickname: nickname.trim() || normSpecies,
    lifetimePoints: 0,
    level: 1,
    stage: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  return await saveStudentVerse(newVerse);
}

/**
 * Calculate complete lifetime points and collect history from:
 * 1. Guru manual & QR points (student_points)
 * 2. Completed CBT exams (participants)
 * 3. Submitted assignments / LKPD (assignment_submissions)
 */
export async function getStudentPointsHistory(
  studentId: string,
  studentName?: string,
  studentClass?: string
): Promise<{
  totalPoints: number;
  items: PointHistoryItem[];
}> {
  const items: PointHistoryItem[] = [];

  // 1. Fetch teacher-granted points from Supabase & IndexedDB
  try {
    const client = supabaseAnon || supabase;
    const { data: dbPoints } = await client
      .from('student_points')
      .select('*')
      .eq('id_siswa', studentId);

    if (dbPoints && dbPoints.length > 0) {
      dbPoints.forEach((p: any) => {
        const pts = Number(p.poin) || 0;
        items.push({
          id: `sp_${p.id}`,
          source: 'guru',
          title: p.keterangan || 'Poin Apresiasi Guru',
          date: p.tanggal || p.created_at || new Date().toISOString(),
          points: pts,
          type: pts >= 0 ? 'positive' : 'negative'
        });
      });
    } else {
      // Local IndexedDB fallback
      const localPts = await dbGrading.getStudentPoints();
      const filtered = localPts.filter(p => p.idSiswa === studentId);
      filtered.forEach(p => {
        const pts = Number(p.poin) || 0;
        items.push({
          id: `local_sp_${p.id}`,
          source: 'guru',
          title: p.keterangan || 'Poin Apresiasi Guru',
          date: p.tanggal || new Date().toISOString(),
          points: pts,
          type: pts >= 0 ? 'positive' : 'negative'
        });
      });
    }
  } catch (err) {
    console.warn('[verseService] Error fetching student_points:', err);
  }

  // 2. Fetch completed CBT exams for this student
  if (studentName) {
    try {
      let query = supabase
        .from('participants')
        .select('id, exam_id, score, status, end_time, created_at, exams(title)')
        .eq('name', studentName);

      if (studentClass) {
        query = query.eq('class', studentClass);
      }

      const { data: examsData } = await query;
      if (examsData) {
        examsData.forEach((part: any) => {
          if (part.status === 'completed' || part.end_time) {
            const scoreVal = Number(part.score) || 0;
            const examTitle = part.exams?.title || 'Ujian Digital';
            
            // Base exam point: +25
            items.push({
              id: `exam_${part.id}`,
              source: 'ujian',
              title: `Selesai CBT: ${examTitle}`,
              date: part.end_time || part.created_at || new Date().toISOString(),
              points: 25,
              type: 'positive'
            });

            // High score bonus: +15 if score >= 85
            if (scoreVal >= 85) {
              items.push({
                id: `exam_bonus_${part.id}`,
                source: 'bonus',
                title: `Bonus Nilai Tinggi (Nilai ${scoreVal}): ${examTitle}`,
                date: part.end_time || part.created_at || new Date().toISOString(),
                points: 15,
                type: 'positive'
              });
            }
          }
        });
      }
    } catch (err) {
      console.warn('[verseService] Error fetching exam completions:', err);
    }
  }

  // 3. Fetch submitted assignments / LKPD
  try {
    const { data: subsData } = await supabase
      .from('assignment_submissions')
      .select('id, assignment_id, status, submitted_at, created_at')
      .eq('student_id', studentId);

    if (subsData && subsData.length > 0) {
      subsData.forEach((sub: any) => {
        const isLate = sub.status === 'late';
        items.push({
          id: `assign_${sub.id}`,
          source: 'tugas',
          title: isLate ? 'Pengumpulan Tugas (Terlambat)' : 'Pengumpulan Tugas / LKPD Tepat Waktu',
          date: sub.submitted_at || sub.created_at || new Date().toISOString(),
          points: isLate ? 10 : 20,
          type: 'positive'
        });
      });
    }
  } catch (err) {
    // If assignment_submissions is missing or offline, skip gracefully
    console.debug('[verseService] Submissions fetch skipped:', err);
  }

  // Sort history descending by date
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate lifetime cumulative points
  const totalPoints = items.reduce((sum, item) => sum + item.points, 0);

  return {
    totalPoints: Math.max(0, totalPoints),
    items
  };
}

/**
 * Sync Verse level and lifetime points with latest activity
 */
export async function syncVerseWithPoints(
  currentVerse: StudentVerse,
  totalPoints: number
): Promise<{ verse: StudentVerse; hasEvolved: boolean }> {
  const { currentLevel, currentStage } = calculateLevelAndProgress(totalPoints);
  const oldStage = currentVerse.stage;
  const hasEvolved = currentStage > oldStage;

  const updated: StudentVerse = {
    ...currentVerse,
    lifetimePoints: totalPoints,
    level: currentLevel,
    stage: currentStage
  };

  const saved = await saveStudentVerse(updated);
  return { verse: saved, hasEvolved };
}
