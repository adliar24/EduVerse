import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  Zap,
  BookOpen,
  Calendar,
  Link2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../lib/utils';

const CARD_STYLES = [
  // 1. Midnight Royal Indigo (Top layer of palette image)
  {
    bg: 'bg-gradient-to-br from-[#312783] via-[#2A226F] to-[#1E1756] text-white border-transparent hover:scale-[1.01] transition-all shadow-xl shadow-[#312783]/25',
    selectedBg: 'bg-gradient-to-br from-[#3B309A] via-[#312783] to-[#241B6B] text-white border-white/40 shadow-[0_15px_35px_rgba(49,39,131,0.4)] scale-[1.02]',
    text: 'text-white',
    textMuted: 'text-indigo-200/80',
    badge: 'bg-white/20 text-white border-white/10 rounded-full backdrop-blur-md',
    divider: 'border-white/10',
    btnEdit: 'text-white/80 hover:text-white hover:bg-white/15 rounded-full',
    btnDelete: 'text-white/80 hover:text-red-200 hover:bg-red-500/30 rounded-full',
    checkbox: 'border-white/30 text-indigo-400 focus:ring-offset-indigo-950'
  },
  // 2. Ocean Sapphire Blue (Wave layer of palette image)
  {
    bg: 'bg-gradient-to-br from-[#2B5292] via-[#254780] to-[#1F3C6E] text-white border-transparent hover:scale-[1.01] transition-all shadow-xl shadow-[#2B5292]/25',
    selectedBg: 'bg-gradient-to-br from-[#3561AA] via-[#2B5292] to-[#204076] text-white border-white/40 shadow-[0_15px_35px_rgba(43,82,146,0.4)] scale-[1.02]',
    text: 'text-white',
    textMuted: 'text-blue-100/80',
    badge: 'bg-white/20 text-white border-white/10 rounded-full backdrop-blur-md',
    divider: 'border-white/10',
    btnEdit: 'text-white/80 hover:text-white hover:bg-white/15 rounded-full',
    btnDelete: 'text-white/80 hover:text-red-200 hover:bg-red-500/30 rounded-full',
    checkbox: 'border-white/30 text-blue-400 focus:ring-offset-blue-900'
  },
  // 3. Vibrant Indigo Violet (Middle wave of palette image)
  {
    bg: 'bg-gradient-to-br from-[#5649C0] via-[#4A3EB2] to-[#3F33A3] text-white border-transparent hover:scale-[1.01] transition-all shadow-xl shadow-[#5649C0]/25',
    selectedBg: 'bg-gradient-to-br from-[#6456D7] via-[#5649C0] to-[#4538B5] text-white border-white/40 shadow-[0_15px_35px_rgba(86,73,192,0.4)] scale-[1.02]',
    text: 'text-white',
    textMuted: 'text-purple-100/80',
    badge: 'bg-white/20 text-white border-white/10 rounded-full backdrop-blur-md',
    divider: 'border-white/10',
    btnEdit: 'text-white/80 hover:text-white hover:bg-white/15 rounded-full',
    btnDelete: 'text-white/80 hover:text-red-200 hover:bg-red-500/30 rounded-full',
    checkbox: 'border-white/30 text-purple-400 focus:ring-offset-purple-900'
  },
  // 4. Royal Lavender Violet (Bottom layer of palette image)
  {
    bg: 'bg-gradient-to-br from-[#6C62D0] via-[#5F55C3] to-[#5147B5] text-white border-transparent hover:scale-[1.01] transition-all shadow-xl shadow-[#6C62D0]/25',
    selectedBg: 'bg-gradient-to-br from-[#7B71E4] via-[#6C62D0] to-[#5B50C5] text-white border-white/40 shadow-[0_15px_35px_rgba(108,98,208,0.4)] scale-[1.02]',
    text: 'text-white',
    textMuted: 'text-purple-100/80',
    badge: 'bg-white/20 text-white border-white/10 rounded-full backdrop-blur-md',
    divider: 'border-white/10',
    btnEdit: 'text-white/80 hover:text-white hover:bg-white/15 rounded-full',
    btnDelete: 'text-white/80 hover:text-red-200 hover:bg-red-500/30 rounded-full',
    checkbox: 'border-white/30 text-indigo-300 focus:ring-offset-indigo-800'
  },
  // 5. Electric Sapphire Indigo
  {
    bg: 'bg-gradient-to-br from-[#3651A3] via-[#2D4590] to-[#24387E] text-white border-transparent hover:scale-[1.01] transition-all shadow-xl shadow-[#3651A3]/25',
    selectedBg: 'bg-gradient-to-br from-[#4260BB] via-[#3651A3] to-[#2B428C] text-white border-white/40 shadow-[0_15px_35px_rgba(54,81,163,0.4)] scale-[1.02]',
    text: 'text-white',
    textMuted: 'text-indigo-100/80',
    badge: 'bg-white/20 text-white border-white/10 rounded-full backdrop-blur-md',
    divider: 'border-white/10',
    btnEdit: 'text-white/80 hover:text-white hover:bg-white/15 rounded-full',
    btnDelete: 'text-white/80 hover:text-red-200 hover:bg-red-500/30 rounded-full',
    checkbox: 'border-white/30 text-indigo-400 focus:ring-offset-indigo-900'
  }
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    examsTaken: 0,
    avgScore: 0,
    ongoingExams: 0
  });
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [latestMaterials, setLatestMaterials] = useState<any[]>([]);
  const [latestAssignments, setLatestAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentSessionStr = localStorage.getItem('student_session');
    if (!studentSessionStr) {
      navigate('/login');
      return;
    }
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const studentSessionStr = localStorage.getItem('student_session');
      if (!studentSessionStr) {
        setLoading(false);
        return;
      }
      const studentObj = JSON.parse(studentSessionStr);

      // Fetch fresh student info from database securely using ID (prevents name tampering)
      const { data: studentDb, error: studentDbErr } = await supabase
        .from('students')
        .select('name, class_id, classes!students_class_id_fkey(name)')
        .eq('id', studentObj.id)
        .maybeSingle();

      if (studentDbErr || !studentDb) {
        setLoading(false);
        return;
      }

      const className = studentDb.classes 
        ? (Array.isArray(studentDb.classes) ? studentDb.classes[0]?.name : (studentDb.classes as any).name)
        : '';

      const classId = studentDb.class_id;

      // Parallel fetch participant results, latest materials, and assignments
      const [resultsRes, materialsRes, assignmentsRes] = await Promise.all([
        supabase
          .from('participants')
          .select(`
            *,
            exams (
              title,
              exam_code,
              duration
            )
          `)
          .eq('name', studentDb.name)
          .eq('class', className || '')
          .order('created_at', { ascending: false }),
        classId ? supabase.from('materials').select('*').eq('class_id', classId).order('created_at', { ascending: false }).limit(6) : Promise.resolve({ data: [] }),
        classId ? supabase.from('assignments').select('*').eq('class_id', classId).order('created_at', { ascending: false }).limit(6) : Promise.resolve({ data: [] })
      ]);

      const results = resultsRes.data || [];

      if (materialsRes.data) {
        const filteredM = (materialsRes.data as any[]).filter(m => 
          m.target_type === 'class' || 
          (m.target_type === 'students' && (m.student_ids || []).includes(studentObj.id))
        ).slice(0, 3);
        setLatestMaterials(filteredM);
      }

      if (assignmentsRes.data) {
        const filteredA = (assignmentsRes.data as any[]).filter(a => 
          a.target_type === 'class' || 
          (a.target_type === 'students' && (a.student_ids || []).includes(studentObj.id))
        ).slice(0, 3);
        setLatestAssignments(filteredA);
      }

      const completedResults = results?.filter(r => r.status === 'completed') || [];
      const totalTaken = completedResults.length;
      const avgScore = totalTaken > 0 
        ? completedResults.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalTaken 
        : 0;

      setStats({
        examsTaken: totalTaken,
        avgScore: Math.round(avgScore),
        ongoingExams: results?.filter(r => r.status === 'ongoing').length || 0
      });
      setRecentResults(results || []);
    } catch (error) {
      console.error('Error fetching student dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Ujian Diikuti', 
      value: stats.examsTaken, 
      icon: FileText, 
      cardClass: 'bg-blue-600 text-white border-transparent shadow-lg shadow-blue-600/15 hover:shadow-[0_12px_25px_rgba(59,130,246,0.3)]',
      iconBg: 'bg-white/20 text-white',
      textColor: 'text-white',
      mutedColor: 'text-blue-100/70'
    },
    { 
      label: 'Rata-rata Nilai', 
      value: `${stats.avgScore}%`, 
      icon: TrendingUp, 
      cardClass: 'bg-emerald-600 text-white border-transparent shadow-lg shadow-emerald-600/15 hover:shadow-[0_12px_25px_rgba(16,185,129,0.3)]',
      iconBg: 'bg-white/20 text-white',
      textColor: 'text-white',
      mutedColor: 'text-emerald-100/70'
    },
    { 
      label: 'Ujian Berlangsung', 
      value: stats.ongoingExams, 
      icon: Clock, 
      cardClass: 'bg-amber-600 text-white border-transparent shadow-lg shadow-amber-600/15 hover:shadow-[0_12px_25px_rgba(245,158,11,0.3)]',
      iconBg: 'bg-white/20 text-white',
      textColor: 'text-white',
      mutedColor: 'text-amber-100/70'
    },
  ];

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-3xl"></div>)}
      </div>
      <div className="h-96 bg-slate-100 rounded-3xl"></div>
    </div>
  );

  return (
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-indigo-950 tracking-tight">Halo, Selamat Belajar!</h2>
          <p className="text-slate-500 mt-1 font-medium">Pantau progres ujian dan hasil belajar Anda di sini.</p>
        </div>
        <Link 
          to="/daftar-ujian-siswa"
          className="bg-gradient-loading text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:scale-[1.02] transition-all shadow-glow-loading"
        >
          <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
          Ikuti Ujian Baru
        </Link>
      </div>

      {/* Ongoing Exams Banner */}
      {recentResults.filter(r => r.status === 'ongoing').length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Ujian Sedang Berlangsung</h3>
                <p className="text-white/80 text-sm">Jangan lupa untuk menyelesaikan ujian Anda!</p>
              </div>
            </div>
            <Link 
              to="/daftar-ujian-siswa"
              className="bg-white text-amber-600 px-6 py-3 rounded-xl font-bold hover:bg-amber-50 transition-all flex items-center gap-2"
            >
              Lanjutkan
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={stat.label}
            className={`p-6 rounded-3xl border hover:scale-[1.01] transition-all duration-300 group ${stat.cardClass}`}
          >
            <div className="flex items-center justify-between mb-5">
              <div className={`${stat.iconBg} p-3.5 rounded-2xl transition-transform group-hover:scale-110 duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className={`${stat.mutedColor} text-xs font-bold uppercase tracking-widest`}>{stat.label}</p>
              <h3 className={`text-3xl font-bold mt-1 tracking-tight ${stat.textColor}`}>{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Results */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-indigo-950">Riwayat Ujian</h3>
            <p className="text-sm text-slate-400 font-medium">Daftar ujian yang telah Anda kerjakan</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {recentResults.length > 0 ? recentResults.map((result) => (
            <div key={result.id} className={cn(
              "flex items-center justify-between p-5 rounded-3xl border transition-all group",
              result.status === 'ongoing' 
                ? "border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50"
                : "border-slate-50 hover:border-slate-200 hover:bg-slate-50/50"
            )}>
              <div className="flex items-center gap-5">
                <div className={cn(
                  "p-4 rounded-2xl transition-all",
                  result.status === 'ongoing' 
                    ? "bg-amber-100 text-amber-600" 
                    : "bg-slate-100 text-slate-600 group-hover:bg-white group-hover:shadow-md"
                )}>
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      "font-bold text-lg",
                      result.status === 'ongoing' 
                        ? "text-amber-700" 
                        : "text-indigo-950 group-hover:text-blue-600 transition-colors"
                    )}>{result.exams?.title}</h4>
                    {result.status === 'ongoing' && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        BERLANGSUNG
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-tighter">Code: {result.exams?.exam_code}</span>
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-500" />
                      {result.exams?.duration} Menit
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {result.status === 'ongoing' ? (
                  <Link 
                    to="/daftar-ujian-siswa"
                    className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center gap-2"
                  >
                    Lanjutkan
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-black",
                        (result.score || 0) >= 75 ? "text-emerald-600" : "text-amber-600"
                      )}>{result.score || 0}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Skor</p>
                    </div>
                    <div className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-indigo-950 group-hover:border-indigo-950 transition-all">
                      <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-all" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold">Belum ada riwayat ujian.</p>
              <Link to="/daftar-ujian-siswa" className="text-blue-600 text-sm font-bold mt-2 inline-block hover:underline">Ikuti ujian pertama Anda →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Materials and Assignments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Materials */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-indigo-950 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Materi Terbaru
                </h3>
                <p className="text-xs text-slate-400 font-medium">Bahan ajar pelajaran yang dibagikan guru</p>
              </div>
              <Link to="/materi-tugas-siswa" className="text-xs font-bold text-blue-600 hover:underline">Lihat Semua →</Link>
            </div>

            <div className="space-y-4">
              {latestMaterials.length > 0 ? latestMaterials.map((m, index) => {
                const cardStyle = CARD_STYLES[index % CARD_STYLES.length];
                return (
                  <div key={m.id} className={`p-4 rounded-2xl border transition-all space-y-1 ${cardStyle.bg}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm truncate">{m.title}</h4>
                      {m.link && <Link2 className="w-3.5 h-3.5 text-white shrink-0" />}
                    </div>
                    <p className={`text-xs line-clamp-2 leading-relaxed ${cardStyle.textMuted}`}>{m.description}</p>
                  </div>
                );
              }) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold">Belum ada materi pelajaran.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-indigo-950 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Tugas Aktif
                </h3>
                <p className="text-xs text-slate-400 font-medium">Daftar lembar tugas sekolah Anda</p>
              </div>
              <Link to="/materi-tugas-siswa" className="text-xs font-bold text-purple-600 hover:underline">Lihat Semua →</Link>
            </div>

            <div className="space-y-4">
              {latestAssignments.length > 0 ? latestAssignments.map((a, index) => {
                const cardStyle = CARD_STYLES[(index + 2) % CARD_STYLES.length];
                const deadlineDate = a.deadline ? new Date(a.deadline) : null;
                const isOverdue = deadlineDate ? deadlineDate.getTime() < Date.now() : false;
                return (
                  <div key={a.id} className={`p-4 rounded-2xl border transition-all space-y-2 ${cardStyle.bg}`}>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-sm truncate">{a.title}</h4>
                      {a.deadline ? (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${
                          isOverdue ? 'bg-rose-500/25 text-rose-100 border-rose-400/20' : 'bg-white/20 text-white border-white/10'
                        }`}>
                          {isOverdue ? 'Selesai' : 'Aktif'}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-white/20 text-white border border-white/10">
                          Tanpa Tenggat
                        </span>
                      )}
                    </div>
                    {a.deadline ? (
                      <p className={`text-[10px] flex items-center gap-1 font-bold ${cardStyle.textMuted}`}>
                        <Calendar className="w-3.5 h-3.5 text-white" />
                        Tenggat: {new Date(a.deadline).toLocaleDateString('id-ID', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    ) : (
                      <p className={`text-[10px] flex items-center gap-1 font-bold ${cardStyle.textMuted}`}>
                        <Calendar className="w-3.5 h-3.5 text-white" />
                        Tenggat: <span>Tanpa Tenggat</span>
                      </p>
                    )}
                  </div>
                );
              }) : (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-bold">Belum ada tugas sekolah.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
