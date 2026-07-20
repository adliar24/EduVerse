// ============================================
// UNIFIED TYPES FOR EDUVERSE PORTAL
// ============================================

export interface LateSetting {
  isEnabled: boolean;
  bufferMinutes: number;
}

export interface GradingWeights {
  formatif: number;
  sumatif: number;
  pts: number;
  pas: number;
}

export interface School {
  id: string;
  nama: string;
  tahunAjaran: string;
  semester: string; // "1" atau "2"
  kkmDefault: number;
  createdAt: string;
}

// Unified TeacherProfile supporting both EduCheck and EduScore schemas
export interface TeacherProfile {
  id: string;
  
  // EduCheck fields
  teacherName?: string;
  schools?: any; // string[] (EduCheck) atau School[] (EduScore)
  currentSchoolIndex?: number;
  schoolYear?: string;
  subjects?: string[];
  customSubjects?: string[];
  lateSetting?: LateSetting;
  notificationMinutes?: number;
  lastSyncTimestamp?: string;
  createdAt?: string;

  // EduScore fields
  namaGuru?: string;
  activeSchoolId?: string | null;
  sekolah?: string; // Legacy
  tahunAjaran?: string;
  semester?: string;
  kkmDefault?: number;
  modeCepatDefault?: boolean;
  bintangAktif?: boolean;
  konversiBintangAktif?: boolean;
  konversiBintangRate?: number;
  konversiBintangMaxBonus?: number;
  fotoUrl?: string;
  nip?: string;
  weights?: GradingWeights;
  lastUpdatedAt?: string;
}

// Helper to get current school name
export const getCurrentSchoolName = (profile: TeacherProfile | null | undefined): string => {
  if (!profile) return 'SEKOLAH';
  
  // EduCheck style (string array)
  if (profile.schools && Array.isArray(profile.schools) && typeof profile.schools[0] === 'string') {
    const cleanSchools = (profile.schools as string[]).filter(s => s && s.trim().length > 0);
    if (cleanSchools.length === 0) return 'SEKOLAH';
    const idx = profile.currentSchoolIndex ?? 0;
    return cleanSchools[idx] || cleanSchools[0] || 'SEKOLAH';
  }
  
  // EduScore style (School array)
  if (profile.schools && Array.isArray(profile.schools) && typeof profile.schools[0] === 'object') {
    const activeId = profile.activeSchoolId;
    const activeSchool = (profile.schools as School[]).find(s => s.id === activeId);
    return activeSchool ? activeSchool.nama : (profile.schools[0] as School).nama || 'SEKOLAH';
  }
  
  return 'SEKOLAH';
};

// --- EDUCHECK MODELS ---

export interface ClassEntity {
  id: string;
  name: string;
  subject: string;
  schoolIndex: number;
  createdAt: string;
}

// Unified Student supporting both EduCheck, EduScore, and EduTest schemas
export interface Student {
  // Common
  id?: string; // mapped to idSiswa or studentId
  name?: string; // mapped to nama
  createdAt?: string;

  // EduCheck
  classId?: string;
  class_id?: string;
  school_id?: string | null;
  face_embedding?: string | null;
  face_id?: string | null;
  face_vector?: string | null;

  // EduScore
  idSiswa?: string;
  schoolId?: string | null;
  idKelas?: string;
  nama?: string;
  nisn?: string;
  bintang?: number;
  student_code?: string;
  password?: string;
}

export interface StudentWithFace extends Student {
  face_embedding: string;
}

export interface FaceMatchResult {
  studentId: string;
  studentName: string;
  distance: number;
  isMatch: boolean;
}

export type FaceEnrollmentStatus = 'idle' | 'loading' | 'enrolling' | 'success' | 'error';
export type FaceScanStatus = 'idle' | 'loading' | 'scanning' | 'matched' | 'not_found' | 'error';

export interface AttendanceSession {
  id: string;
  classId: string;
  schoolYear: string;
  dateISO: string; // YYYY-MM-DD
  dayName: string;
  dateLabel: string;
  meetingNumber: number;
  topic: string;
  scheduleId?: string;
  createdAt: string;
  isClosed?: boolean;
}

export type AttendanceStatus = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | 'Terlambat';

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  timeISO: string;
  timeHHMMSS: string;
  note?: string;
}

export interface ScheduleItem {
  id: string;
  dayName: string; // 'Senin', 'Selasa', dll.
  classId: string;
  startTime: string; // "07:00"
  endTime: string; // "08:30"
}

export type EventType = 'Libur' | 'Sakit' | 'Dinas' | 'Lainnya';

export interface CalendarEvent {
  id: string;
  dateISO: string; // YYYY-MM-DD
  endDateISO?: string;
  type: EventType;
  description: string;
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

export interface ClassCancellation {
  id: string;
  dateISO: string; // YYYY-MM-DD
  classId: string;
  scheduleId?: string;
  reason: string;
}

export interface AppState {
  teacher: TeacherProfile | null;
  classes: ClassEntity[];
  students: Student[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  schedules: ScheduleItem[];
  events: CalendarEvent[];
  cancellations: ClassCancellation[];
  materials?: Material[];
  assignments?: Assignment[];
  activeClassId: string | null;
}

// --- EDUSCORE MODELS ---

export interface LearningObjective {
  id: string;
  schoolId: string;
  mapel: string;
  kode: string; // TP1, TP2
  deskripsi: string;
}

export interface ClassData {
  idKelas: string;
  schoolId: string;
  namaKelas: string;
  mapel: string;
}

export interface StudentPoint {
  id: string;
  schoolId: string;
  idSiswa: string;
  idKelas: string;
  tanggal: string; // ISO String
  poin: number;
  keterangan: string;
  tipe: 'manual' | 'qr';
}

export interface PointTemplate {
  id: string;
  schoolId: string;
  title: string;
  amount: number;
  type: 'positive' | 'negative';
}

export type AssessmentCategory = "Formatif" | "Sumatif" | "PTS" | "PAS";

export interface Meeting {
  idPertemuan: string;
  schoolId: string;
  idKelas: string;
  mapel: string;
  semester: string;
  urutanKe: number;
  tanggal: string; // ISO Date string
  materi: string;
  jenis?: string;
  activityType: string;
  activityName: string;
  assessmentCategory: AssessmentCategory;
  aspekPenilaian: 'Pengetahuan' | 'Keterampilan' | 'Sikap';
  idTP?: string;
}

export interface MeetingScore {
  id: string; // format: idPertemuan_idSiswa
  schoolId?: string;
  idPertemuan: string;
  idSiswa: string;
  nilaiAngka: number | null;
  bintang?: number;
  catatan?: string;
  lastUpdated?: number; // Timestamp
}

export interface FinalGradeRecord {
  idSiswa: string;
  schoolId?: string;
  idKelas: string;
  nilaiSmtLalu?: number | null;
  nilaiManual?: number | null;
}

export interface DBState {
  schemaVersion?: number;
  teacherProfile: TeacherProfile | null;
  schools: School[];
  classes: ClassData[];
  students: Student[];
  meetings: Meeting[];
  meetingScores: MeetingScore[];
  finalGrades: FinalGradeRecord[];
  studentPoints: StudentPoint[];
  learningObjectives: LearningObjective[];
  pointTemplates: PointTemplate[];
  updatedAt?: string;
}

export const PRESET_MAPEL = [
  "Matematika",
  "Bahasa Indonesia",
  "IPA",
  "IPS",
  "PPKn",
  "PJOK",
  "Bahasa Inggris",
  "Informatika",
  "PAI & BP",
  "Seni Rupa",
  "Seni Musik",
  "Seni Tari",
  "Seni Teater",
  "Seni Budaya",
  "Bahasa Daerah",
  "Sejarah",
  "PKWU",
  "SBdP"
];

export const PRESET_ACTIVITIES = [
  { name: "Tugas", category: "Formatif" },
  { name: "Diskusi", category: "Formatif" },
  { name: "Presentasi", category: "Formatif" },
  { name: "Praktik", category: "Formatif" },
  { name: "Kuis", category: "Formatif" },
  { name: "Ulangan", category: "Sumatif" },
  { name: "Ujian", category: "Sumatif" },
  { name: "PTS", category: "PTS" },
  { name: "PAS", category: "PAS" },
];

export const DEFAULT_WEIGHTS: GradingWeights = {
  formatif: 40,
  sumatif: 30,
  pts: 15,
  pas: 15
};

export interface Material {
  id: string;
  teacher_id?: string;
  teacherId?: string;
  school_id?: string | null;
  schoolId?: string | null;
  class_id?: string | null;
  classId?: string | null;
  title: string;
  description: string;
  link?: string;
  target_type: 'class' | 'students';
  targetType?: 'class' | 'students';
  student_ids?: string[];
  studentIds?: string[];
  created_at?: string;
  createdAt?: string;
}

export interface Assignment {
  id: string;
  teacher_id?: string;
  teacherId?: string;
  school_id?: string | null;
  schoolId?: string | null;
  class_id?: string | null;
  classId?: string | null;
  title: string;
  description: string;
  link?: string;
  deadline?: string;
  target_type: 'class' | 'students';
  targetType?: 'class' | 'students';
  student_ids?: string[];
  studentIds?: string[];
  created_at?: string;
  createdAt?: string;
}
