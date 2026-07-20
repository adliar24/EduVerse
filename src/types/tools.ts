export interface Student {
  id: string;
  name: string;
  gender?: 'M' | 'F'; // M = Male, F = Female
  proficiency?: number; // 4: Mahir, 3: Cakap, 2: Berkembang, 1: Intervensi
  proficiencyLabel?: string; // Original label for display
  classId?: string; // Link to attendance DB class
}

export enum GroupingMode {
  BY_COUNT = 'BY_COUNT',
  BY_SIZE = 'BY_SIZE',
}

export enum DistributionStrategy {
  RANDOM = 'RANDOM',
  GENDER_BALANCE = 'GENDER_BALANCE',
  ABILITY_HETEROGENEOUS = 'ABILITY_HETEROGENEOUS', // Campur (Mahir + Intervensi)
  GENDER_AND_ABILITY_HETEROGENEOUS = 'GENDER_AND_ABILITY_HETEROGENEOUS', // Seimbang Gender + Campur Kemampuan
}

export type NamingType = 'auto' | 'custom';

export interface GroupConfig {
  mode: GroupingMode;
  value: number; // Represents either total groups or size per group
  strategy: DistributionStrategy;
  namingPattern: string; // e.g., "Kelompok", "Tim"
  namingType: NamingType;
  customNames: string[];
}

export interface GroupResult {
  id: string;
  name: string;
  members: Student[];
}

export type FileType = 'txt' | 'csv' | 'xlsx';

// Certificate Types
export type CertificateGrade = 'B' | 'A' | 'S';
export type CertificateThemeColor = 'emerald' | 'blue' | 'yellow' | 'purple' | 'pink' | 'red' | 'orange' | 'cyan' | 'slate';

export interface CertificateData {
  grade: CertificateGrade;
  themeColor: CertificateThemeColor;
  gradeDisplay: string; // Teks yang ditampilkan sebagai huruf besar (misal: "A", "1", "S+")
  studentName: string;
  studentClass: string;
  awardArea: string;
  specificQuote: string;
  teacherName: string;
  date: string;
  generatedMessage: string;
}

export interface BulkCertificateData {
  id?: string;
  studentName: string;
  studentClass: string;
  grade: CertificateGrade;
  themeColor?: CertificateThemeColor;
  gradeDisplay?: string;
  awardArea: string;
  specificQuote: string;
  teacherName?: string;
  date?: string;
  generatedMessage?: string;
}
