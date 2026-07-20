const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

// 1. Load configuration from .env file
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('Error: File .env tidak ditemukan di direktori ini.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan di .env.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to generate unique student code
function generateStudentCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('==================================================');
  console.log('      EduCheck Legacy Backup Data Converter       ');
  console.log('==================================================\n');

  const legacyFilePath = path.join(__dirname, 'EduCheck_FullBackup_2026-04-17.json');
  if (!fs.existsSync(legacyFilePath)) {
    console.error(`Error: File backup lama '${legacyFilePath}' tidak ditemukan.`);
    rl.close();
    process.exit(1);
  }

  console.log('Menghubungkan ke Supabase...');
  
  // Login to Supabase to fetch current profile & school UUIDs
  const email = await askQuestion('Masukkan Email Akun Guru: ');
  const password = await askQuestion('Masukkan Password: ');
  console.log('\nSedang memverifikasi akun...');

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError || !authData.user) {
    console.error('Gagal Login:', authError ? authError.message : 'User tidak ditemukan');
    rl.close();
    process.exit(1);
  }

  const teacherId = authData.user.id;
  const teacherName = authData.user.user_metadata?.name || email.split('@')[0];
  console.log(`Login berhasil sebagai: ${teacherName} (${teacherId})`);

  // Fetch teacher schools
  console.log('Mengambil daftar sekolah dari database...');
  const { data: schoolsRes, error: schoolsErr } = await supabase
    .from('teacher_schools')
    .select('school_id, schools(id, name)')
    .eq('teacher_id', teacherId);

  if (schoolsErr) {
    console.error('Gagal memuat sekolah:', schoolsErr.message);
    rl.close();
    process.exit(1);
  }

  const userSchools = (schoolsRes || [])
    .map(s => s.schools)
    .filter(Boolean);

  if (userSchools.length === 0) {
    console.error('Error: Akun Anda belum memiliki sekolah terdaftar di Supabase. Silakan tambahkan sekolah terlebih dahulu di halaman Profil.');
    rl.close();
    process.exit(1);
  }

  console.log('\nPilih Sekolah Tujuan Impor:');
  userSchools.forEach((s, idx) => {
    console.log(`  [${idx + 1}] ${s.name} (${s.id})`);
  });

  let selectedIdx = 0;
  if (userSchools.length > 1) {
    const choice = await askQuestion(`\nPilih nomor sekolah (1-${userSchools.length}): `);
    const parsed = parseInt(choice, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= userSchools.length) {
      selectedIdx = parsed - 1;
    }
  }

  const activeSchool = userSchools[selectedIdx];
  console.log(`Sekolah terpilih: ${activeSchool.name} (${activeSchool.id})\n`);

  console.log('Membaca file backup legacy...');
  const rawData = fs.readFileSync(legacyFilePath, 'utf8');
  let legacyData;
  try {
    legacyData = JSON.parse(rawData);
  } catch (err) {
    console.error('Gagal membaca file JSON. Pastikan file valid.');
    rl.close();
    process.exit(1);
  }

  console.log('Mulai mengonversi data...');

  const classes = legacyData.classes || [];
  const students = legacyData.students || [];
  const schedules = legacyData.schedules || [];

  console.log(`- Jumlah kelas yang ditemukan: ${classes.length}`);
  console.log(`- Jumlah siswa yang ditemukan: ${students.length}`);
  console.log(`- Jumlah jadwal yang ditemukan: ${schedules.length}`);

  // Build converted structures
  const convertedAttendance = {
    teacher: {
      id: teacherId,
      user_id: teacherId,
      teacherName: teacherName,
      schools: [activeSchool.name],
      currentSchoolIndex: 0,
      schoolYear: legacyData.teacher?.schoolYear || '2025/2026',
      subjects: legacyData.teacher?.subjects || ['UMUM'],
      customSubjects: legacyData.teacher?.customSubjects || [],
      lateSetting: legacyData.teacher?.lateSetting || { isEnabled: true, bufferMinutes: 15 },
      notificationMinutes: legacyData.teacher?.notificationMinutes || 5,
      createdAt: legacyData.teacher?.createdAt || new Date().toISOString()
    },
    classes: classes.map(c => ({
      id: c.id,
      teacher_id: teacherId,
      school_id: activeSchool.id,
      name: c.name,
      subject: c.subject,
      created_at: c.createdAt
    })),
    students: students.map(s => {
      const code = generateStudentCode();
      return {
        id: s.id,
        teacher_id: teacherId,
        classId: s.classId,
        name: s.name,
        student_code: code,
        password: 'murid19',
        createdAt: s.createdAt
      };
    }),
    schedules: schedules.map(sch => ({
      id: sch.id,
      teacher_id: teacherId,
      dayName: sch.dayName,
      classId: sch.classId,
      startTime: sch.startTime,
      endTime: sch.endTime
    })),
    events: [],
    cancellations: [],
    activeClassId: null
  };

  const convertedGrading = {
    teacherProfile: [{
      id: teacherId,
      name: teacherName,
      schoolName: activeSchool.name,
      activeSchoolId: activeSchool.id
    }],
    schools: [{
      id: activeSchool.id,
      name: activeSchool.name
    }],
    classes: classes.map(c => ({
      idKelas: c.id,
      teacherId: teacherId,
      schoolId: activeSchool.id,
      namaKelas: c.name,
      mapel: c.subject
    })),
    students: convertedAttendance.students.map(s => ({
      idSiswa: s.id,
      teacherId: teacherId,
      schoolId: activeSchool.id,
      idKelas: s.classId,
      nama: s.name,
      student_code: s.student_code,
      password: 'murid19'
    })),
    meetings: [],
    meetingScores: [],
    finalGrades: [],
    learningObjectives: [],
    studentPoints: [],
    pointTemplates: []
  };

  const convertedBackup = {
    app: 'EduVerse',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    attendance: convertedAttendance,
    grading: convertedGrading
  };

  const outputPath = path.join(__dirname, 'EduVerse_Converted_Backup.json');
  fs.writeFileSync(outputPath, JSON.stringify(convertedBackup, null, 2), 'utf8');

  console.log('\n==================================================');
  console.log('             KONVERSI SELESAI SUKSES              ');
  console.log('==================================================');
  console.log(`File hasil konversi ditulis ke:\n-> ${outputPath}\n`);
  console.log('Langkah selanjutnya:');
  console.log('1. Buka portal EduVerse di browser.');
  console.log('2. Buka menu Pengaturan -> Sinkronisasi & Backup.');
  console.log('3. Klik tombol "Pulihkan dari File (.json)".');
  console.log('4. Pilih file "EduVerse_Converted_Backup.json" ini.');
  console.log('5. Setelah restore berhasil, klik "Sinkronkan Sekarang" untuk mengunggah data ke Cloud Supabase.');
  console.log('==================================================\n');

  rl.close();
}

main().catch(err => {
  console.error('Terjadi error saat menjalankan script:', err);
  rl.close();
});
