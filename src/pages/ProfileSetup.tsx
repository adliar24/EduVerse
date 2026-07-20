import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
  User,
  School,
  BookOpen,
  Loader2,
  Plus,
  X,
  Calendar,
  Check,
  Building2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { useSchool } from '../context/SchoolContext';
import { useAlert } from '../context/AlertContext';

interface Subject {
  id: string;
  name: string;
  level: string;
}

interface School {
  id: string;
  name: string;
  address?: string;
}

const SUBJECT_LEVELS = ['SEMUA', 'SD', 'SMP', 'SMA', 'SMK', 'UMUM'];

const DEFAULT_SUBJECTS = [
  { id: '1', name: 'Bahasa Indonesia', level: 'UMUM' },
  { id: '2', name: 'Bahasa Inggris', level: 'UMUM' },
  { id: '3', name: 'Bahasa Arab', level: 'UMUM' },
  { id: '4', name: 'Bahasa Jepang', level: 'UMUM' },
  { id: '5', name: 'Bahasa Mandarin', level: 'UMUM' },
  { id: '6', name: 'Bahasa Korea', level: 'UMUM' },
  { id: '7', name: 'Bahasa Jerman', level: 'UMUM' },
  { id: '8', name: 'Bahasa Prancis', level: 'UMUM' },
  { id: '9', name: 'Bahasa Spanyol', level: 'UMUM' },
  { id: '10', name: 'Bahasa Daerah', level: 'UMUM' },
  { id: '11', name: 'Matematika', level: 'UMUM' },
  { id: '12', name: 'Biologi', level: 'UMUM' },
  { id: '13', name: 'Fisika', level: 'UMUM' },
  { id: '14', name: 'Kimia', level: 'UMUM' },
  { id: '15', name: 'Astronomi', level: 'UMUM' },
  { id: '16', name: 'Geologi', level: 'UMUM' },
  { id: '17', name: 'Sejarah', level: 'UMUM' },
  { id: '18', name: 'Geografi', level: 'UMUM' },
  { id: '19', name: 'Ekonomi', level: 'UMUM' },
  { id: '20', name: 'Sosiologi', level: 'UMUM' },
  { id: '21', name: 'Antropologi', level: 'UMUM' },
  { id: '22', name: 'Arkeologi', level: 'UMUM' },
  { id: '23', name: 'Pendidikan Agama Islam', level: 'UMUM' },
  { id: '24', name: 'Pendidikan Agama Kristen', level: 'UMUM' },
  { id: '25', name: 'Pendidikan Agama Katolik', level: 'UMUM' },
  { id: '26', name: 'Pendidikan Agama Hindu', level: 'UMUM' },
  { id: '27', name: 'Pendidikan Agama Buddha', level: 'UMUM' },
  { id: '28', name: 'Pendidikan Pancasila (PPKn)', level: 'UMUM' },
  { id: '29', name: 'Bimbingan Konseling (BK)', level: 'UMUM' },
  { id: '30', name: 'Informatika', level: 'UMUM' },
  { id: '31', name: 'Pemrograman', level: 'UMUM' },
  { id: '32', name: 'Desain Grafis', level: 'UMUM' },
  { id: '33', name: 'Sistem Jaringan', level: 'UMUM' },
  { id: '34', name: 'Robotik', level: 'UMUM' },
  { id: '35', name: 'Multimedia', level: 'UMUM' },
  { id: '36', name: 'Animasi', level: 'UMUM' },
  { id: '37', name: 'Seni Rupa', level: 'UMUM' },
  { id: '38', name: 'Seni Musik', level: 'UMUM' },
  { id: '39', name: 'Seni Tari', level: 'UMUM' },
  { id: '40', name: 'Seni Teater', level: 'UMUM' },
  { id: '41', name: 'Olahraga (PJOK)', level: 'UMUM' },
  { id: '42', name: 'Prakarya', level: 'UMUM' },
  { id: '43', name: 'Kewirausahaan', level: 'UMUM' },
  { id: '44', name: 'Tata Boga', level: 'UMUM' },
  { id: '45', name: 'Tata Busana', level: 'UMUM' },
  { id: '46', name: 'Akuntansi', level: 'UMUM' },
  { id: '47', name: 'Administrasi', level: 'UMUM' },
  { id: '48', name: 'Pemasaran', level: 'UMUM' },
  { id: '49', name: 'Perhotelan', level: 'UMUM' },
  { id: '50', name: 'Otomotif', level: 'UMUM' },
  { id: '51', name: 'Teknik Sipil', level: 'UMUM' },
  { id: '52', name: 'Elektronika', level: 'UMUM' },
  { id: '53', name: 'Farmasi', level: 'UMUM' },
  { id: '54', name: 'Keperawatan', level: 'UMUM' },
  { id: '55', name: 'Jurnalistik', level: 'UMUM' },
];

const ACADEMIC_YEARS = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    years.push(`${i}/${i + 1}`);
  }
  return years;
};

const SEMESTERS = ['Ganjil', 'Genap'];

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);
  const { refreshSchools, setActiveSchool } = useSchool();
  const { showToast } = useAlert();

  const [name, setName] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');

  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [availableSchools, setAvailableSchools] = useState<School[]>([]);

  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [newCustomSubject, setNewCustomSubject] = useState('');
  const [newCustomSubjectLevel, setNewCustomSubjectLevel] = useState('UMUM');
  const [subjectSearch, setSubjectSearch] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      setName(session.user.user_metadata?.name || '');

      const [subjectsRes, schoolsRes, profileRes] = await Promise.all([
        supabase.from('subjects').select('*').order('level, name'),
        supabase.from('schools').select('*').order('name'),
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      ]);

      // Get existing subjects from DB
      let existingSubjects = subjectsRes.data || [];
      
      // Check if we need to reset (if duplicates or mismatch)
      const existingNames = existingSubjects.map(s => s.name);
      const hasDuplicates = existingSubjects.length !== new Set(existingNames).size;
      const hasAllDefaults = DEFAULT_SUBJECTS.every(ds => existingNames.includes(ds.name));
      
      // If duplicates or missing subjects, reset
      if (hasDuplicates || !hasAllDefaults || existingSubjects.length < DEFAULT_SUBJECTS.length) {
        // Delete all subjects
        await supabase.from('subjects').delete();
        
        // Insert default subjects
        const { data: insertedSubjects, error: insertError } = await supabase
          .from('subjects')
          .insert(DEFAULT_SUBJECTS.map(s => ({ name: s.name, level: s.level })))
          .select();
        
        if (!insertError && insertedSubjects) {
          setAllSubjects(insertedSubjects);
        } else {
          setAllSubjects(DEFAULT_SUBJECTS);
        }
      } else {
        setAllSubjects(existingSubjects);
      }
      
      setAvailableSchools(schoolsRes.data || []);

      if (profileRes.data?.is_profile_completed) {
        navigate('/dashboard');
        return;
      }

      const [teacherSchoolsRes, teacherSubjectsRes] = await Promise.all([
        supabase.from('teacher_schools').select('school_id, academic_year, semester').eq('teacher_id', session.user.id),
        supabase.from('teacher_subjects').select('subject_id').eq('teacher_id', session.user.id)
      ]);

      if (teacherSchoolsRes.data && teacherSchoolsRes.data.length > 0) {
        const schoolIds = teacherSchoolsRes.data.map(s => s.school_id);
        setSelectedSchoolIds(schoolIds);
        setSchools((schoolsRes.data || []).filter(s => schoolIds.includes(s.id)));

        if (teacherSchoolsRes.data[0].academic_year) {
          setAcademicYear(teacherSchoolsRes.data[0].academic_year);
        }
        if (teacherSchoolsRes.data[0].semester) {
          setSemester(teacherSchoolsRes.data[0].semester);
        }
      }

      if (teacherSubjectsRes.data) {
        const subjectIds = teacherSubjectsRes.data.map(s => s.subject_id);
        setSelectedSubjectIds(subjectIds);
        setSubjects((subjectsRes.data || []).filter(s => subjectIds.includes(s.id)));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleAddSchool = async (e?: MouseEvent) => {
    e?.stopPropagation();
    if (!newSchoolName.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data: newSchool, error: schoolError } = await supabase
        .from('schools')
        .insert({ name: newSchoolName.trim(), address: newSchoolAddress.trim() || null })
        .select()
        .single();

      if (schoolError) throw schoolError;

      if (newSchool) {
        setAvailableSchools(prev => [...prev, newSchool]);
        setSelectedSchoolIds(prev => [...prev, newSchool.id]);
        setSchools(prev => [...prev, newSchool]);

        await supabase
          .from('teacher_schools')
          .insert({
            teacher_id: session?.user.id,
            school_id: newSchool.id,
            academic_year: academicYear || null,
            semester: semester || null
          });
          
        // Update global school context
        await refreshSchools();
        await setActiveSchool(newSchool);
      }

      setNewSchoolName('');
      setNewSchoolAddress('');
    } catch (error: any) {
      console.error('Error adding school:', error.message || error);
      showToast(error.message || 'Gagal menambahkan sekolah', 'error');
    }
  };

  const handleRemoveSchool = async (schoolId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      await supabase
        .from('teacher_schools')
        .delete()
        .eq('teacher_id', session?.user.id)
        .eq('school_id', schoolId);

      setSelectedSchoolIds(selectedSchoolIds.filter(id => id !== schoolId));
      setSchools(schools.filter(s => s.id !== schoolId));
    } catch (error) {
      console.error('Error removing school:', error);
    }
  };

  const handleAddCustomSubject = async (e?: MouseEvent) => {
    e?.stopPropagation();
    if (!newCustomSubject.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data: newSubject, error } = await supabase
        .from('subjects')
        .insert({
          name: newCustomSubject.trim(),
          level: newCustomSubjectLevel,
          is_custom: true
        })
        .select()
        .single();

      if (error) throw error;

      if (newSubject) {
        setAllSubjects(prev => [...prev, newSubject]);
        setSelectedSubjectIds(prev => [...prev, newSubject.id]);
        setSubjects(prev => [...prev, newSubject]);

        await supabase
          .from('teacher_subjects')
          .insert({ teacher_id: session?.user.id, subject_id: newSubject.id });
      }

      setNewCustomSubject('');
    } catch (error: any) {
      console.error('Error adding custom subject:', error.message || error);
      showToast(error.message || 'Gagal menambahkan mata pelajaran', 'error');
    }
  };

  const handleToggleSubject = async (subject: Subject) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (selectedSubjectIds.includes(subject.id)) {
        await supabase
          .from('teacher_subjects')
          .delete()
          .eq('teacher_id', session?.user.id)
          .eq('subject_id', subject.id);

        setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== subject.id));
        setSubjects(subjects.filter(s => s.id !== subject.id));
      } else {
        await supabase
          .from('teacher_subjects')
          .insert({ teacher_id: session?.user.id, subject_id: subject.id });

        setSelectedSubjectIds([...selectedSubjectIds, subject.id]);
        setSubjects([...subjects, subject]);
      }
    } catch (error) {
      console.error('Error toggling subject:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || selectedSchoolIds.length === 0 || selectedSubjectIds.length === 0 || !academicYear || !semester) {
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      for (const schoolId of selectedSchoolIds) {
        const existing = await supabase
          .from('teacher_schools')
          .select('id')
          .eq('teacher_id', session.user.id)
          .eq('school_id', schoolId)
          .maybeSingle();

        if (existing.data) {
          await supabase
            .from('teacher_schools')
            .update({ academic_year: academicYear, semester: semester })
            .eq('id', existing.data.id);
        } else {
          await supabase
            .from('teacher_schools')
            .insert({
              teacher_id: session.user.id,
              school_id: schoolId,
              academic_year: academicYear,
              semester: semester
            });
        }
      }

      // Check if profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({
            name: name.trim(),
            is_profile_completed: true
          })
          .eq('id', session.user.id);
      } else {
        await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            name: name.trim(),
            is_profile_completed: true
          });
      }

      await supabase.auth.updateUser({
        data: {
          name: name.trim(),
          is_profile_completed: true,
          academic_year: academicYear,
          semester: semester
        }
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-950 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-y-auto">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="bg-indigo-950 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-950/20">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-indigo-950 mb-3">Pengaturan Profil</h1>
          <p className="text-slate-500">Lengkapi data diri dan preferensi mengajar Anda</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-white/50 p-6 sm:p-8 space-y-8"
        >
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
              placeholder="Nama lengkap Anda"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Tahun Ajaran & Semester
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium appearance-none"
                >
                  <option value="">Pilih Tahun Ajaran</option>
                  {ACADEMIC_YEARS().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium appearance-none"
                >
                  <option value="">Pilih Semester</option>
                  {SEMESTERS.map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <School className="w-4 h-4" />
              Sekolah {selectedSchoolIds.length > 0 && (
                <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {selectedSchoolIds.length} dipilih
                </span>
              )}
            </label>

            {schools.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {schools.map(school => (
                  <span
                    key={school.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {school.name}
                    <button onClick={() => handleRemoveSchool(school.id)} className="hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm"
                placeholder="Nama sekolah baru..."
              />
              <input
                type="text"
                value={newSchoolAddress}
                onChange={(e) => setNewSchoolAddress(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm"
                placeholder="Alamat (opsional)..."
              />
              <button
                onClick={(e) => handleAddSchool(e)}
                disabled={!newSchoolName.trim()}
                className="px-4 py-2.5 bg-indigo-950 text-white rounded-xl font-medium hover:bg-indigo-900 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Mata Pelajaran {selectedSubjectIds.length > 0 && (
                <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {selectedSubjectIds.length} dipilih
                </span>
              )}
            </label>

            <input
              type="text"
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm"
              placeholder="Cari mata pelajaran..."
            />

            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-slate-100 p-3 rounded-2xl bg-slate-50/30">
              {allSubjects
                .filter(subject => 
                  subject.name.toLowerCase().includes(subjectSearch.toLowerCase())
                )
                .map(subject => (
                  <button
                    key={subject.id}
                    onClick={() => handleToggleSubject(subject)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                      selectedSubjectIds.includes(subject.id)
                        ? "bg-green-50 text-green-700 ring-1 ring-green-500"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {selectedSubjectIds.includes(subject.id) && <Check className="w-3.5 h-3.5" />}
                    {subject.name}
                  </button>
                ))
              }
              {allSubjects.filter(subject => 
                subject.name.toLowerCase().includes(subjectSearch.toLowerCase())
              ).length === 0 && (
                <p className="text-sm text-slate-400 w-full text-center py-2">
                  {allSubjects.length === 0 ? "Belum ada mata pelajaran. Tambah di bawah." : "Mata pelajaran tidak ditemukan."}
                </p>
              )}
            </div>

            <div className="flex gap-2 items-center">
              <select
                value={newCustomSubjectLevel}
                onChange={(e) => setNewCustomSubjectLevel(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white outline-none text-sm"
              >
                {SUBJECT_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <input
                type="text"
                value={newCustomSubject}
                onChange={(e) => setNewCustomSubject(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm"
                placeholder="Tambah mata pelajaran manual..."
              />
              <button
                onClick={(e) => handleAddCustomSubject(e)}
                disabled={!newCustomSubject.trim()}
                className="px-4 py-2.5 bg-indigo-950 text-white rounded-xl font-medium hover:bg-indigo-900 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={loading || !name.trim() || selectedSchoolIds.length === 0 || selectedSubjectIds.length === 0 || !academicYear || !semester}
            className="w-full bg-indigo-950 text-white py-4 rounded-2xl font-bold hover:bg-indigo-900 active:scale-[0.98] transition-all shadow-xl shadow-indigo-950/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Simpan & Lanjutkan
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}