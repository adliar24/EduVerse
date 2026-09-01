import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  ArrowUpRight,
  Plus,
  TrendingUp,
  Zap,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Activity,
  Loader2,
  Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { slideUp } from '../lib/animations';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSchool } from '../context/SchoolContext';
import { getFullState } from '../services/dbAttendance';
import { getAllScores } from '../services/dbGrading';
import { SEED_CLASSES, SEED_STUDENTS } from '../services/excelDataSeed';
import DomainTileIcon from '../components/DomainTileIcon';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 border border-slate-100 p-4 shadow-xl rounded-2xl text-[11px] font-semibold backdrop-blur-md">
        <p className="text-slate-800 font-extrabold mb-1.5">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }} />
            <span className="text-slate-400 font-medium">{entry.name}:</span>
            <span className="text-indigo-950 font-black">{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  useDocumentTitle('Beranda');
  const { activeSchool } = useSchool();
  const [userName, setUserName] = useState('Guru');
  const [stats, setStats] = useState({
    totalExams: 0,
    totalQuestions: 0,
    totalClasses: 0,
    totalStudents: 0,
    totalAttendance: 0,
    totalScores: 0,
  });
  const [overallAttendance, setOverallAttendance] = useState<number | string>(0);
  const [overallGradeAvg, setOverallGradeAvg] = useState<number | string>(0);
  const [overallExamAvg, setOverallExamAvg] = useState<number | string>(0);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([
    { name: 'Senin', Kehadiran: 0, Nilai: 0 },
    { name: 'Selasa', Kehadiran: 0, Nilai: 0 },
    { name: 'Rabu', Kehadiran: 0, Nilai: 0 },
    { name: 'Kamis', Kehadiran: 0, Nilai: 0 },
    { name: 'Jumat', Kehadiran: 0, Nilai: 0 },
  ]);
  const [isSampleData, setIsSampleData] = useState(false);
  const [todaySchedules, setTodaySchedules] = useState<any[]>([]);

  const getScheduleStatus = (startTime: string, endTime: string) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      return 'ongoing';
    } else if (currentMinutes > endMinutes) {
      return 'completed';
    } else {
      return 'upcoming';
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeSchool?.id]);

  const getDeletedClassIds = (): string[] => {
    try {
      if (typeof window !== 'undefined') {
        return JSON.parse(localStorage.getItem('deleted_class_ids') || '[]');
      }
      return [];
    } catch { return []; }
  };

  const getDeletedStudentIds = (): string[] => {
    try {
      if (typeof window !== 'undefined') {
        return JSON.parse(localStorage.getItem('deleted_student_ids') || '[]');
      }
      return [];
    } catch { return []; }
  };

  const fetchDashboardData = async () => {
    console.log('Fetching dashboard data for school:', activeSchool?.id || 'No school selected');
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Guru');
      }

      const targetSchoolId = activeSchool?.id && activeSchool.id !== 'legacy' ? activeSchool.id : 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7';
      const validUid = (user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) ? user.id : null;

      // 1. Read local state from IndexedDB (EduTrackDB)
      const localState = await getFullState(true);

      // 2. Compute local classes count (Seed + IndexedDB - deleted)
      const deletedClassIds = new Set(getDeletedClassIds());
      const classMap = new Map<string, any>();
      if (SEED_CLASSES && SEED_CLASSES.length > 0) {
        SEED_CLASSES.forEach(sc => {
          const id = String(sc.id || sc.idKelas);
          const className = sc.name || sc.namaKelas;
          const key = className ? className.trim().toUpperCase() : id;
          if (!deletedClassIds.has(id)) classMap.set(key, sc);
        });
      }
      (localState.classes || []).forEach((lc: any) => {
        const id = String(lc.id || lc.idKelas || lc.id_kelas || '');
        const className = lc.name || lc.namaKelas;
        const key = className ? className.trim().toUpperCase() : id;
        if (id && !deletedClassIds.has(id)) {
          const existing = classMap.get(key) || classMap.get(id) || {};
          classMap.set(key, { ...existing, ...lc });
        }
      });
      const computedLocalClassesCount = classMap.size;

      // 3. Compute local students count (Seed + IndexedDB - deleted)
      const deletedStudentIds = new Set(getDeletedStudentIds());
      const studentMap = new Map<string, any>();
      if (SEED_STUDENTS && SEED_STUDENTS.length > 0) {
        SEED_STUDENTS.forEach(ss => {
          const id = String(ss.id || ss.idSiswa);
          if (!deletedStudentIds.has(id)) studentMap.set(id, ss);
        });
      }
      (localState.students || []).forEach((ls: any) => {
        const id = String(ls.id || ls.idSiswa || ls.id_siswa || '');
        if (id && !deletedStudentIds.has(id)) {
          studentMap.set(id, { ...(studentMap.get(id) || {}), ...ls });
        }
      });
      const computedLocalStudentsCount = studentMap.size;

      // 4. Supabase cloud queries
      let examCount = 0;
      let questionCount = 0;
      let classCount = 0;
      let studentCount = 0;
      let attendanceTotal = 0;
      let calculatedAttendance = 0;
      let scoreTotal = 0;
      let calculatedGrade = 0;

      try {
        let examQuery = supabase.from('exams').select('id', { count: 'exact' });
        let questionQuery = supabase.from('questions').select('id', { count: 'exact' });
        let classQuery = supabase.from('classes').select('id', { count: 'exact' });
        let studentQuery = supabase.from('students').select('id', { count: 'exact' });
        let attendanceQuery = supabase.from('attendance_records').select('id, status');
        let scoreQuery = supabase.from('meeting_scores').select('nilai_angka');

        const [
          examRes,
          questionRes,
          classRes,
          studentRes,
          attRes,
          scoreRes
        ] = await Promise.all([
          examQuery,
          questionQuery,
          classQuery,
          studentQuery,
          attendanceQuery,
          scoreQuery
        ]);

        examCount = examRes.count ?? (examRes.data?.length || 0);
        questionCount = questionRes.count ?? (questionRes.data?.length || 0);
        classCount = classRes.count ?? (classRes.data?.length || 0);
        studentCount = studentRes.count ?? (studentRes.data?.length || 0);

        const attRecords = attRes.data || [];
        attendanceTotal = attRecords.length;
        const attendancePresent = attRecords.filter((r: any) => r.status === 'Hadir' || r.status === 'Terlambat').length;
        calculatedAttendance = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;

        const scoresList = (scoreRes.data || []).map((s: any) => Number(s.nilai_angka)).filter((v: number) => !isNaN(v) && v > 0);
        scoreTotal = scoresList.length;
        const scoreSum = scoresList.reduce((acc: number, v: number) => acc + v, 0);
        calculatedGrade = scoreTotal > 0 ? Math.round((scoreSum / scoreTotal) * 10) / 10 : 0;
      } catch (err) {
        console.warn('Supabase query error in dashboard, using local fallback:', err);
      }

      // 5. Merge local attendance records if Supabase has 0
      const localRecords = localState.records || [];
      const localAttendanceTotal = localRecords.length;
      const localAttendancePresent = localRecords.filter((r: any) => r.status === 'Hadir' || r.status === 'Terlambat').length;
      const localCalculatedAttendance = localAttendanceTotal > 0 ? Math.round((localAttendancePresent / localAttendanceTotal) * 100) : 0;

      const finalAttendanceTotal = attendanceTotal > 0 ? attendanceTotal : localAttendanceTotal;
      const finalCalculatedAttendance = attendanceTotal > 0 ? calculatedAttendance : localCalculatedAttendance;

      // 6. Merge local meeting scores if Supabase has 0
      let localScores: any[] = [];
      try {
        localScores = await getAllScores(targetSchoolId);
        if (!localScores || localScores.length === 0) {
          localScores = await getAllScores();
        }
      } catch (e) {
        console.warn('Failed to fetch local scores:', e);
      }

      const localScoreTotal = localScores.length;
      const validLocalScores = localScores.map(s => Number(s.nilaiAngka)).filter(v => !isNaN(v) && v > 0);
      const localScoreAvg = validLocalScores.length > 0
        ? Math.round((validLocalScores.reduce((acc, v) => acc + v, 0) / validLocalScores.length) * 10) / 10
        : 0;

      const finalScoreTotal = scoreTotal > 0 ? scoreTotal : localScoreTotal;
      const finalGradeAvg = scoreTotal > 0 ? calculatedGrade : localScoreAvg;

      // 7. Determine final class and student counts (max of cloud or computed local)
      const finalClassCount = Math.max(classCount, computedLocalClassesCount);
      const finalStudentCount = Math.max(studentCount, computedLocalStudentsCount);

      setStats({
        totalExams: examCount,
        totalQuestions: questionCount,
        totalClasses: finalClassCount,
        totalStudents: finalStudentCount,
        totalAttendance: finalAttendanceTotal,
        totalScores: finalScoreTotal
      });

      setOverallAttendance(finalCalculatedAttendance);
      setOverallGradeAvg(finalGradeAvg);

      // 8. Calculate Exam Average
      let calculatedExam = 0;
      if (user?.id) {
        try {
          const { data: teacherExams } = await supabase.from('exams').select('id').eq('teacher_id', user.id);
          if (teacherExams && teacherExams.length > 0) {
            const examIds = teacherExams.map(e => e.id);
            const { data: partAgg } = await supabase.from('participants').select('avg(score)').in('exam_id', examIds);
            const avg = Number((partAgg || [])[0]?.avg);
            if (!isNaN(avg)) {
              calculatedExam = Math.round(avg * 10) / 10;
            }
          }
        } catch (e) {
          console.warn('Failed to calculate exam average:', e);
        }
      }
      setOverallExamAvg(calculatedExam);

      // 9. Trend Chart Data
      if (finalAttendanceTotal > 0 || finalScoreTotal > 0) {
        const clampTrend = (v: number) => Math.max(0, Math.min(100, Math.round(v)));
        setChartData([
          { name: 'Senin', Kehadiran: clampTrend(finalCalculatedAttendance - 4), Nilai: clampTrend(finalGradeAvg - 6) },
          { name: 'Selasa', Kehadiran: clampTrend(finalCalculatedAttendance - 2), Nilai: clampTrend(finalGradeAvg - 3) },
          { name: 'Rabu', Kehadiran: clampTrend(finalCalculatedAttendance), Nilai: clampTrend(finalGradeAvg) },
          { name: 'Kamis', Kehadiran: clampTrend(finalCalculatedAttendance + 2), Nilai: clampTrend(finalGradeAvg + 3) },
          { name: 'Jumat', Kehadiran: clampTrend(finalCalculatedAttendance + 4), Nilai: clampTrend(finalGradeAvg + 6) },
        ]);
      } else {
        setChartData([
          { name: 'Senin', Kehadiran: 0, Nilai: 0 },
          { name: 'Selasa', Kehadiran: 0, Nilai: 0 },
          { name: 'Rabu', Kehadiran: 0, Nilai: 0 },
          { name: 'Kamis', Kehadiran: 0, Nilai: 0 },
          { name: 'Jumat', Kehadiran: 0, Nilai: 0 },
        ]);
      }
      setIsSampleData(false);

      // 10. Teaching schedules
      try {
        const { SEED_SCHEDULES } = await import('../services/excelDataSeed');
        const allSchedules = (localState.schedules && localState.schedules.length > 0)
          ? localState.schedules
          : SEED_SCHEDULES;
        const allClasses = Array.from(classMap.values());
        
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayName = days[new Date().getDay()];
        
        const filteredSchedules = allSchedules
          .filter((s: any) => s.dayName === todayName)
          .map((s: any) => {
            const cls = allClasses.find((c: any) => (c.id || c.idKelas) === s.classId) as any;
            return {
              ...s,
              className: cls ? (cls.name || cls.namaKelas) : 'Kelas',
              subject: cls ? (cls.subject || cls.mapel) : 'Mata Pelajaran'
            };
          })
          .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
          
        setTodaySchedules(filteredSchedules);
      } catch (err) {
        console.warn('Failed to fetch schedules for dashboard board:', err);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Ujian Digital', 
      value: stats.totalExams, 
      icon: FileText, 
      color: 'indigo',
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100/80',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      borderHover: 'hover:border-indigo-400 hover:shadow-indigo-500/10',
      accentBg: 'from-indigo-500/5 to-transparent',
      desc: `${stats.totalQuestions} Soal aktif`
    },
    { 
      label: 'Jumlah Kelas', 
      value: stats.totalClasses, 
      icon: BookOpen, 
      color: 'blue',
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100/80',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
      borderHover: 'hover:border-blue-400 hover:shadow-blue-500/10',
      accentBg: 'from-blue-500/5 to-transparent',
      desc: 'Kelas terdaftar'
    },
    { 
      label: 'Total Murid', 
      value: stats.totalStudents, 
      icon: Users, 
      color: 'sky',
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-100/80',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
      borderHover: 'hover:border-sky-400 hover:shadow-sky-500/10',
      accentBg: 'from-sky-500/5 to-transparent',
      desc: 'Siswa aktif'
    },
    { 
      label: 'Presensi', 
      value: `${overallAttendance}%`, 
      icon: CheckCircle, 
      color: 'emerald',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100/80',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      borderHover: 'hover:border-emerald-400 hover:shadow-emerald-500/10',
      accentBg: 'from-emerald-500/5 to-transparent',
      desc: 'Rata-rata hadir'
    },
    { 
      label: 'Rerata Nilai', 
      value: overallGradeAvg, 
      icon: TrendingUp, 
      color: 'violet',
      iconBg: 'bg-violet-50 text-violet-600 border border-violet-100/80',
      badgeClass: 'bg-violet-50 text-violet-700 border-violet-200/80',
      borderHover: 'hover:border-violet-400 hover:shadow-violet-500/10',
      accentBg: 'from-violet-500/5 to-transparent',
      desc: 'Formatif & sumatif'
    },
    { 
      label: 'Rerata Ujian', 
      value: overallExamAvg, 
      icon: Activity, 
      color: 'amber',
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100/80',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
      borderHover: 'hover:border-amber-400 hover:shadow-amber-500/10',
      accentBg: 'from-amber-500/5 to-transparent',
      desc: 'Evaluasi digital'
    }
  ];

  if (loading) return (
    <div className="animate-pulse space-y-8">
      {/* Banner Skeleton */}
      <div className="h-44 bg-slate-100 rounded-3xl w-full"></div>
      
      {/* Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-32 bg-slate-100 rounded-3xl"></div>
        ))}
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-slate-100 rounded-3xl"></div>
        <div className="h-80 bg-slate-100 rounded-3xl"></div>
      </div>
    </div>
  );

  return (
    <motion.div 
      variants={slideUp}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-4 pb-2"
    >
      {/* Modern Colorful Banner Sambutan Guru */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-[2.25rem] p-6 sm:p-8 relative overflow-hidden shadow-xl border border-white/10">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 top-0 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wide text-indigo-200 mb-2.5 backdrop-blur-md border border-white/15">
              Tahun Ajaran {activeSchool?.academic_year || '2026/2027'} • Semester {activeSchool?.semester || 'Ganjil'}
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Selamat Datang, {userName}!
            </h2>
            <p className="text-slate-200 text-xs sm:text-sm font-medium mt-1">
              Portal terpadu pembelajaran, presensi & evaluasi murid.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Launcher - Vibrant & Clean */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Aksi Cepat</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            to="/attendance/scan"
            className="flex items-center gap-3.5 p-4 bg-white border border-slate-200/90 text-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-400 hover:bg-emerald-50/30 transition-all group cursor-pointer"
          >
            <div className="bg-emerald-500 text-white p-2.5 rounded-xl group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/20">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-tight group-hover:text-emerald-700 transition-colors">Presensi Kelas</h4>
              <p className="text-[11px] text-slate-500 font-medium">Buka kamera scan kehadiran</p>
            </div>
          </Link>

          <Link
            to="/grading"
            className="flex items-center gap-3.5 p-4 bg-white border border-slate-200/90 text-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 hover:bg-blue-50/30 transition-all group cursor-pointer"
          >
            <div className="bg-blue-600 text-white p-2.5 rounded-xl group-hover:scale-105 transition-transform shadow-md shadow-blue-600/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-tight group-hover:text-blue-700 transition-colors">Input Nilai</h4>
              <p className="text-[11px] text-slate-500 font-medium">Rekap formatif & sumatif</p>
            </div>
          </Link>

          <Link
            to="/buat-ujian"
            className="flex items-center gap-3.5 p-4 bg-white border border-slate-200/90 text-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group cursor-pointer"
          >
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl group-hover:scale-105 transition-transform shadow-md shadow-indigo-600/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-tight group-hover:text-indigo-700 transition-colors">Ujian Baru</h4>
              <p className="text-[11px] text-slate-500 font-medium">Susun naskah ujian online</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Stats Grid - Vibrant Thematic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            className={`rounded-2xl p-4 bg-white border border-slate-200/90 shadow-sm hover:shadow-md ${stat.borderHover} transition-all flex flex-col justify-between group relative overflow-hidden`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.accentBg} rounded-bl-full pointer-events-none`}></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className={`p-2 rounded-xl transition-transform group-hover:scale-105 ${stat.iconBg}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${stat.badgeClass}`}>
                Aktif
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider leading-none">{stat.label}</p>
              <h3 className="text-2xl font-black mt-1 tracking-tight leading-none text-slate-900">{stat.value}</h3>
              <p className="text-slate-500 text-[10px] font-medium mt-1 truncate">{stat.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 shadow-sm rounded-2xl p-4.5 hover:shadow-md transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-sm shadow-indigo-600/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Tren Aktivitas Kelas</h3>
                <p className="text-slate-400 text-[10px] font-semibold">Kehadiran & Rerata Nilai</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="text-slate-600 font-semibold">Kehadiran (%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-slate-600 font-semibold">Rerata Nilai</span>
                </div>
              </div>
              {isSampleData && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Ilustrasi
                </span>
              )}
            </div>
          </div>
          
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradientKehadiran" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.15}/>
                  </linearGradient>
                  <linearGradient id="gradientNilai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.15}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} style={{ fontWeight: 600 }} />
                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} style={{ fontWeight: 600 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" name="Kehadiran (%)" dataKey="Kehadiran" fill="url(#gradientKehadiran)" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar yAxisId="left" name="Rerata Nilai" dataKey="Nilai" fill="url(#gradientNilai)" radius={[4, 4, 0, 0]} barSize={24} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Teaching Schedule Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white border border-slate-200/90 shadow-sm rounded-2xl p-4.5 hover:shadow-md transition-all duration-300 flex flex-col h-full min-h-[300px]"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-sm shadow-blue-600/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Jadwal Hari Ini</h3>
              <p className="text-slate-400 text-[10px] font-semibold">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[220px] scrollbar-thin">
            {todaySchedules.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-slate-500 text-xs font-bold">Tidak ada jadwal hari ini</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Waktu istirahat Anda</p>
              </div>
            ) : (
              todaySchedules.map((sch) => {
                const status = getScheduleStatus(sch.startTime, sch.endTime);
                return (
                  <div 
                    key={sch.id} 
                    className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                      status === 'ongoing' 
                        ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                        : status === 'completed'
                          ? 'bg-slate-50/70 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{sch.className}</span>
                        <span className="text-[9px] text-slate-500 font-semibold">• {sch.startTime} - {sch.endTime}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 font-medium leading-tight">{sch.subject}</p>
                    </div>
                    
                    <div>
                      {status === 'ongoing' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Aktif
                        </span>
                      ) : status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200">
                          Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200">
                          Mendatang
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
