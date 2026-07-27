import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Highly optimized Indonesian name gender predictor
function predictGender(name: string): 'M' | 'F' | null {
  const n = name.toUpperCase();
  const words = n.split(/\s+/);

  // Female indicator prefixes, suffixes, or words
  const femaleKeywords = [
    'SITI', 'SRI', 'AYU', 'DEWI', 'PUTRI', 'INDAH', 'FITRI', 'AULIA', 'ANISA', 'ANNISA',
    'DIAH', 'KARTIKA', 'LARAS', 'WULANDARI', 'RINA', 'SARI', 'NUR', 'NOVI', 'SALMA', 'AMALIA',
    'ZAHRA', 'ZAHRAH', 'NABILA', 'LESTARI', 'RAHMA', 'RAHMAWATI', 'MUTIA', 'AISYAH', 'AMIRA',
    'FATIMAH', 'SANIA', 'SYIFA', 'AIDA', 'CANTIKA', 'ALYA', 'KEISHA', 'NAYLA', 'NAURA', 'SABRINA',
    'NIKEN', 'ADELIA', 'DHEA', 'VANIA', 'SHIFA', 'KAYLA', 'SAFIRA', 'NISA', 'FEBI', 'TRIANA',
    'MARISKA', 'MEILANI', 'MAWAR', 'INTAN', 'TIARA', 'GITA', 'MELATI', 'DIAN', 'RARA', 'AMELIA',
    'KAYYISA', 'ANJANI', 'SILVIA', 'TITANIA', 'FADIYYA', 'MARSHAKAYLA', 'KHALISA', 'TSABITA',
    'DIVA', 'RISKA', 'WIDYA', 'KARTINI', 'NURUL', 'ANGGRAENI', 'CHELSEA', 'NINDY', 'HANA', 'SARAH',
    'NURHALIZA', 'KHAIRUNNISA', 'AQILA', 'AZZAHRA', 'EKA', 'DWI', 'SHAFIRA', 'SALSABILA', 'BELLA',
    'ALICIA', 'AUDREY', 'AURELIA', 'CLARA', 'ELISA', 'FIONA', 'GRACE', 'JESSICA', 'NICOLE', 'OLIVIA',
    'RACHEL', 'REBECCA', 'SHERLY', 'VALERIE', 'AMANDA', 'FATHIA', 'LUNA', 'PUTRINA', 'CALLYSTA',
    'CARISSA', 'CHERYL', 'FELICIA', 'GLADYS', 'IVANA', 'KEZIA', 'MICHELLE', 'PATRICIA', 'STEFANI',
    'WINDA', 'YASMINE', 'ZEFANYA', 'ZARA', 'QUEEN', 'AURORA', 'TALITHA'
  ];

  // Male indicator prefixes, suffixes, or words
  const maleKeywords = [
    'AHMAD', 'MUHAMMAD', 'MUHAMAD', 'MOHAMMAD', 'MOHAMAD', 'BUDI', 'AGUS', 'RIAN', 'RUDI', 'JOKO',
    'ADI', 'ADITYA', 'FAUZI', 'FAJAR', 'RIZAL', 'HENDRA', 'YUDI', 'EKO', 'PRATAMA', 'PUTRA', 'REZA',
    'FARIS', 'ZAKI', 'RAFI', 'BINTANG', 'ALIF', 'ARIF', 'DAFFA', 'DIMAS', 'FIKRI', 'GIBRAN', 'ILHAM',
    'IRFAN', 'KEVIN', 'ALDO', 'FAUZAN', 'FARHAN', 'RANGGA', 'RIZKY', 'RIZQI', 'RIKY', 'HENDRI',
    'TAUFIK', 'WAHYU', 'WAWAN', 'YUSUF', 'SANGJALU', 'ARRIZA', 'ADZIZD', 'HAQIM', 'ANTHONY', 'ABRAHAM',
    'ARMAN', 'GERY', 'LESMANA', 'DEDE', 'IWAN', 'TEGUH', 'BAGUS', 'HARI', 'HENDRO', 'SLAMET', 'DENI',
    'SUGENG', 'TOTO', 'HERI', 'BAMBANG', 'ASEP', 'UJANG', 'CECEP', 'DEDI', 'GILANG', 'HAFIDZ',
    'FAKHRI', 'ALDRICH', 'BRAMASTA', 'DANIEL', 'EDWARD', 'FELIX', 'GAVIN', 'HARRY', 'IAN', 'JASON',
    'KENNETH', 'LEO', 'MARIO', 'NATHAN', 'OSCAR', 'PETER', 'RICHARD', 'STEVEN', 'VICTOR', 'WILLIAM',
    'ZACKY', 'ARYA', 'RAYHAN', 'RADITYA', 'ANDIKA', 'BAMBANG', 'BAGAS', 'KURNIAWAN', 'WIBOWO'
  ];

  // 1. Check exact match in words
  for (const w of words) {
    if (femaleKeywords.includes(w)) return 'F';
    if (maleKeywords.includes(w)) return 'M';
  }

  // 2. Check suffix patterns commonly used in Indonesia
  // Names ending in "wati", "tuti", "stri", "ni", "tya", "ita", "ina", "ra" are mostly Female
  if (n.endsWith('WATI') || n.endsWith('TUTI') || n.endsWith('STRI') || n.endsWith('ITA') || n.endsWith('INA')) {
    return 'F';
  }
  // Names ending in "wan", "to", "do", "us", "ur" are mostly Male
  if (n.endsWith('WAN') || n.endsWith('TO') || n.endsWith('DO') || n.endsWith('US') || n.endsWith('UR')) {
    return 'M';
  }

  // 3. Fallback predictions based on vowel endings
  if (n.endsWith('A') || n.endsWith('I') || n.endsWith('U')) {
    // In Indonesia, names ending in A, I, U are slightly more likely to be Female
    return 'F';
  }
  
  // Default to Male for consonant endings
  return 'M';
}

async function main() {
  if (!fs.existsSync('.env')) return;
  const envContent = fs.readFileSync('.env', 'utf-8');
  const supabaseUrl = envContent.match(/VITE_SUPABASE_URL="([^"]+)"/)?.[1] || '';
  const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)?.[1] || '';

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: dbStudents, error } = await supabase.from('students').select('id, name, gender');
  if (error) return;

  const withoutGender = dbStudents.filter(s => s.gender === null || s.gender === '');
  console.log(`Unmatched students remaining: ${withoutGender.length}`);

  let mCount = 0;
  let fCount = 0;
  
  for (const s of withoutGender) {
    const pred = predictGender(s.name);
    if (pred === 'M') mCount++;
    if (pred === 'F') fCount++;
    console.log(`Name: "${s.name}" -> Predicted: ${pred}`);
  }

  console.log(`\nPredictions: M: ${mCount}, F: ${fCount}`);
}

main().catch(console.error);
