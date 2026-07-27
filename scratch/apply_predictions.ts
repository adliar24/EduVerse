import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

function predictGender(name: string): 'M' | 'F' {
  const n = name.toUpperCase();
  const words = n.split(/\s+/);

  const strongMale = [
    'MUHAMMAD', 'MUHAMAD', 'MOHAMMAD', 'MOHAMAD', 'MOCHAMMAD', 'MOCHAMAD', 'AHMAD', 'AHMED',
    'PUTRA', 'PRATAMA', 'AGUS', 'BUDI', 'WIBOWO', 'KURNIAWAN', 'ADITYA', 'HARI', 'HENDRA',
    'RIZAL', 'YUDI', 'EKO', 'REZA', 'FARIS', 'ZAKI', 'RAFI', 'BINTANG', 'ALIF', 'ARIF',
    'DAFFA', 'DIMAS', 'FIKRI', 'GIBRAN', 'ILHAM', 'IRFAN', 'KEVIN', 'ALDO', 'FAUZAN',
    'FARHAN', 'RANGGA', 'RIZKY', 'RIZQI', 'RIKY', 'HENDRI', 'TAUFIK', 'WAHYU', 'WAWAN',
    'YUSUF', 'SANGJALU', 'ARRIZA', 'ADZIZD', 'HAQIM', 'ANTHONY', 'ABRAHAM', 'ARMAN',
    'GERY', 'LESMANA', 'DEDE', 'IWAN', 'TEGUH', 'BAGUS', 'DENI', 'SUGENG', 'BAMBANG',
    'ASEP', 'UJANG', 'CECEP', 'DEDI', 'GILANG', 'HAFIDZ', 'FAKHRI', 'ALDRICH', 'BRAMASTA',
    'DANIEL', 'EDWARD', 'FELIX', 'GAVIN', 'HARRY', 'IAN', 'JASON', 'KENNETH', 'LEO',
    'MARIO', 'NATHAN', 'OSCAR', 'PETER', 'RICHARD', 'STEVEN', 'VICTOR', 'WILLIAM',
    'ZACKY', 'ARYA', 'RAYHAN', 'RADITYA', 'ANDIKA', 'BAGAS', 'FASHA', 'KEMAL', 'RIFQI',
    'FADHLI', 'FADHIL', 'FATHIR', 'ALVARO', 'ALVINO', 'AZKA', 'AZZAM', 'ZAFIR', 'REKSA',
    'HABIB', 'RAMDAN', 'TAUFIK', 'ANUGRAH', 'AZIS', 'FAZRI', 'RADIKHA', 'CAESAR', 'OZIL',
    'ISMAIL', 'JABBAR', 'ALANO', 'DAMAR', 'YANUAR', 'HALID', 'FATHAN', 'BAIHAQI', 'TSABIT',
    'LYONEL', 'DAWLAH', 'NASHIR', 'HERMAWAN', 'FAZZA', 'Raffa', 'RAFFI', 'RAFA', 'RAFI',
    'ALLAN', 'ALDI', 'ALFIAN', 'ARDIAN', 'ARDIANSYAH', 'ARFIN', 'ARIFIN', 'BAGUS', 'DEWA',
    'DEWANTARA', 'ELANG', 'FACHRI', 'FAHRI', 'FAISAL', 'FAJAR', 'FAREL', 'FARREL', 'GALANG',
    'GALIH', 'HAFIS', 'HAFID', 'HAMZAH', 'IQBAL', 'MAULANA', 'NUGRAHA', 'PRADITYA', 'RAKA',
    'RAMA', 'RAMADHAN', 'RAMDHANI', 'RENDY', 'RENO', 'REYHAN', 'RIDHO', 'RIDWAN', 'RIFKY',
    'RIO', 'RIVALDI', 'ROY', 'SANDY', 'SATRIA', 'SEPTIAN', 'SURYADI', 'SYAHPUTRA', 'TEDDY',
    'TETEN', 'TOMMY', 'WILDAN', 'YAHYA', 'ZAKARIA'
  ];

  const strongFemale = [
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
    'WINDA', 'YASMINE', 'ZEFANYA', 'ZARA', 'QUEEN', 'AURORA', 'TALITHA', 'MEISYA', 'PUAN', 'HAFEEZA',
    'NOVITA', 'RAYYA', 'RANI', 'KIREINA', 'SHOFIA', 'SHOFA', 'FARANNISA', 'SALIMAH', 'NURAINI',
    'JULIANTI', 'ARYANI', 'RHEA', 'SINTA', 'NADIN', 'NAFILA', 'KEYSHA', 'OKTAVIA', 'ASHADIYA',
    'NAZLA', 'ARKANA', 'BEBI', 'MAHARANI', 'DIANDRA', 'LARASSATY', 'SINDI', 'HALWA', 'NATASYA',
    'SALWA', 'ALFAIRA', 'SYAFARA', 'IVANA', 'RANITA', 'RIZKIA', 'NADHIRA', 'QINANTI', 'ZHIFARA',
    'NURAULIA', 'FARISYA', 'MAISHARA', 'JUWITA', 'APRILIA', 'AIRA', 'KEISYA', 'AURANAZ', 'NIRA',
    'GUMULYA', 'SENYA', 'ROSELLA', 'QALESYA', 'SHAKILA', 'ANGELIA', 'ANIRA', 'RINDISTA', 'SYELLA',
    'BALQIES', 'FRISHYLA', 'AFRILIA', 'KALIA', 'LETA', 'LAKEISHA', 'SADINA', 'RAKHEL', 'SYAUMI',
    'NAZIRA', 'TESSA', 'SELFIANI', 'TANISHA'
  ];

  for (const w of words) {
    if (strongMale.includes(w)) return 'M';
    if (strongFemale.includes(w)) return 'F';
  }

  if (n.endsWith('WATI') || n.endsWith('TUTI') || n.endsWith('STRI') || n.endsWith('ITA') || n.endsWith('INA') || n.endsWith('NIA') || n.endsWith('LIA') || n.endsWith('RIA') || n.endsWith('AH')) {
    return 'F';
  }
  if (n.endsWith('WAN') || n.endsWith('TO') || n.endsWith('DO') || n.endsWith('US') || n.endsWith('UR') || n.endsWith('AL') || n.endsWith('AN') || n.endsWith('AD')) {
    return 'M';
  }

  if (n.endsWith('A') || n.endsWith('I') || n.endsWith('U')) {
    return 'F';
  }
  
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
  console.log(`Updating ${withoutGender.length} students in Supabase...`);

  let updateCount = 0;
  for (const s of withoutGender) {
    const pred = predictGender(s.name);
    const { error: updateErr } = await supabase
      .from('students')
      .update({ gender: pred })
      .eq('id', s.id);
    
    if (updateErr) {
      console.error(`Failed to update ${s.name}:`, updateErr);
    } else {
      updateCount++;
    }
  }

  console.log(`Successfully predicted and updated ${updateCount} student genders!`);
}

main().catch(console.error);
