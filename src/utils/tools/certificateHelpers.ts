import { CertificateGrade } from '../../types/tools';

export const AWARD_AREAS = [
  "Prestasi Akademik",
  "Matematika Terbaik",
  "Sains & Inovasi",
  "Seni & Kreativitas",
  "Olahraga",
  "Kepemimpinan",
  "Partisipasi Aktif",
  "Peningkatan Nilai",
  "Kedisiplinan",
  "Budi Pekerti",
  "Lainnya"
];

export const generateCertificateMessage = (
  grade: CertificateGrade,
  studentName: string,
  area: string,
  quote: string
): string => {
  const cleanQuote = quote ? quote.trim() : '';
  const hasQuote = cleanQuote.length > 0;
  const suffix = hasQuote 
    ? (cleanQuote.endsWith('.') || cleanQuote.endsWith('!') ? cleanQuote : `${cleanQuote}.`) 
    : '';

  switch (grade) {
    case 'B':
      return hasQuote 
        ? `Atas partisipasi aktif. ${suffix}` 
        : `Atas partisipasi aktif dan usaha yang konsisten.`;
    
    case 'A':
      return hasQuote
        ? `Kualitas kerja terbaik dalam ${area}. ${suffix}`
        : `Menunjukkan dedikasi dan kualitas kerja terbaik dalam ${area}.`;
    
    case 'S':
      return hasQuote
        ? `Pencapaian level tertinggi di ${area}. ${suffix}`
        : `Pencapaian level tertinggi yang luar biasa di ${area}.`;
    
    default:
      return suffix;
  }
};
