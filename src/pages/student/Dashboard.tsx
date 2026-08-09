import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileText, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  Zap,
  BookOpen,
  Calendar,
  Link2,
  GraduationCap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../../lib/utils';

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
      cardClass: 'bg-blue-600 text-white border-transparent shadow-md shadow-blue-600/10 hover:shadow-lg hover:shadow-blue-600/20',
      iconBg: 'bg-white/20 text-white',
      textColor: 'text-white',
      mutedColor: 'text-blue-100/80'
    },
    { 
      label: 'Rata-rata Nilai', 
      value: `${stats.avgScore}%`, 
      icon: TrendingUp, 
      cardClass: 'bg-emerald-600 text-white border-transparent shadow-md shadow-emerald-600/10 hover:shadow-lg hover:shadow-emerald-600/20',
      iconBg: 'bg-white/20 text-white',
      textColor: 'text-white',
      mutedColor: 'text-emerald-100/80'
    },
    { 
      label: 'Ujian Berlangsung', 
      value: stats.ongoingExams, 
      icon: Clock, 
      cardClass: 'bg-amber-600 text-white border-transparent shadow-md shadow-amber-600/10 hover:shadow-lg hover:shadow-amber-600/20',
      iconBg: 'bg-white/20 text-white',
      textColor: 'text-white',
      mutedColor: 'text-amber-100/80'
    },
  ];

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-20 bg-slate-100 rounded-2xl"></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>)}
      </div>
      <div className="h-64 bg-slate-100 rounded-2xl"></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Quizzo-Style Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-gradient-to-r from-[#4C1D95] via-[#6D28D9] to-[#7C3AED] p-6 sm:p-8 rounded-[2.5rem] text-white shadow-purple-glow relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-3xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center font-bold text-xl shadow-lg border border-white/20 shrink-0">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight leading-snug">Halo, Selamat Belajar!</h2>
            <p className="text-purple-200/90 text-xs sm:text-sm font-medium">Pantau progres ujian dan hasil belajar Anda secara real-time.</p>
          </div>
        </div>
        <Link 
          to="/daftar-ujian-siswa"
          className="bg-white text-[#6D28D9] hover:bg-purple-50 px-6 py-3.5 rounded-full font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 shrink-0 cursor-pointer relative z-10"
        >
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
          <span>Ikuti Ujian Baru</span>
        </Link>
      </div>

      {/* Ongoing Exams Banner (Compact Alert Strip) */}
      {recentResults.filter(r => r.status === 'ongoing').length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-4 px-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-3 border border-white/20">
          <div className="flex items-center gap-3.5">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm leading-tight">Ujian Sedang Berlangsung</h4>
              <p className="text-white/90 text-[11px] font-medium">Selesaikan ujian Anda sebelum tenggat waktu berakhir</p>
            </div>
          </div>
          <Link 
            to="/daftar-ujian-siswa"
            className="bg-white text-amber-700 px-5 py-2 rounded-full text-xs font-extrabold hover:bg-amber-50 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shrink-0"
          >
            <span>Lanjutkan</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Quizzo Rounded Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {statCards.map((stat, index) => (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            key={stat.label}
            className="p-5 rounded-[2rem] bg-white border border-purple-100/80 shadow-tactile flex items-center gap-4.5 transition-all duration-300 group hover:scale-[1.02] hover:shadow-purple-sm"
          >
            <div className="bg-purple-100/80 text-[#6D28D9] p-3.5 rounded-2xl shrink-0 transition-transform group-hover:scale-105">
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-black tracking-tight text-slate-900 mt-0.5">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Results (Riwayat Ujian) */}
      <div className="bg-white rounded-[2.5rem] border border-purple-100/80 shadow-tactile p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Riwayat Ujian</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Daftar ujian yang telah Anda kerjakan</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {recentResults.length > 0 ? recentResults.map((result) => (
            <div key={result.id} className={cn(
              "flex items-center justify-between p-4 rounded-xl border transition-all group",
              result.status === 'ongoing' 
                ? "border-amber-200 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50"
                : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/60"
            )}>
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={cn(
                  "p-3 rounded-xl shrink-0 transition-all",
                  result.status === 'ongoing' 
                    ? "bg-amber-100 text-amber-600" 
                    : "bg-slate-100 text-slate-600 group-hover:bg-white group-hover:shadow-sm"
                )}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={cn(
                      "font-bold text-sm truncate",
                      result.status === 'ongoing' 
                        ? "text-amber-700" 
                        : "text-slate-900 group-hover:text-[#3B66F5] transition-colors"
                    )}>{result.exams?.title}</h4>
                    {result.status === 'ongoing' && (
                      <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        BERLANGSUNG
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tight">Code: {result.exams?.exam_code}</span>
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#3B66F5]" />
                      {result.exams?.duration} Menit
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {result.status === 'ongoing' ? (
                  <Link 
                    to="/daftar-ujian-siswa"
                    className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-600 transition-all flex items-center gap-1 shadow-sm"
                  >
                    Lanjutkan
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <>
                    <div className="text-right">
                      <p className={cn(
                        "text-base font-black leading-none",
                        (result.score || 0) >= 75 ? "text-emerald-600" : "text-amber-600"
                      )}>{result.score || 0}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Skor</p>
                    </div>
                    <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-[#3B66F5] group-hover:border-[#3B66F5] transition-all">
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-all" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="bg-white w-12 h-12 rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <FileText className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-400 text-xs font-bold">Belum ada riwayat ujian.</p>
              <Link to="/daftar-ujian-siswa" className="text-[#3B66F5] text-xs font-bold mt-1.5 inline-block hover:underline">Ikuti ujian pertama Anda →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Materials and Assignments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Materials */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#3B66F5]" />
                  Materi Terbaru
                </h3>
                <p className="text-xs text-slate-400 font-medium">Bahan ajar pelajaran yang dibagikan guru</p>
              </div>
              <Link to="/materi-tugas-siswa" className="text-xs font-bold text-[#3B66F5] hover:underline">Lihat Semua →</Link>
            </div>

            <div className="space-y-3">
              {latestMaterials.length > 0 ? latestMaterials.map((m) => {
                return (
                  <div key={m.id} className="p-4 rounded-xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 text-white border border-white/20 shadow-md hover:scale-[1.01] transition-all space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs truncate text-white">{m.title}</h4>
                      {m.link && <Link2 className="w-3.5 h-3.5 text-white shrink-0" />}
                    </div>
                    <p className="text-[11px] text-white/90 line-clamp-2 leading-relaxed">{m.description}</p>
                  </div>
                );
              }) : (
                <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <BookOpen className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-400 font-bold">Belum ada materi pelajaran.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Tugas Aktif
                </h3>
                <p className="text-xs text-slate-400 font-medium">Daftar lembar tugas sekolah Anda</p>
              </div>
              <Link to="/materi-tugas-siswa" className="text-xs font-bold text-purple-600 hover:underline">Lihat Semua →</Link>
            </div>

            <div className="space-y-3">
              {latestAssignments.length > 0 ? latestAssignments.map((a) => {
                const deadlineDate = a.deadline ? new Date(a.deadline) : null;
                const isOverdue = deadlineDate ? deadlineDate.getTime() < Date.now() : false;
                return (
                  <div key={a.id} className="p-4 rounded-xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white border border-white/20 shadow-md hover:scale-[1.01] transition-all space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs truncate text-white">{a.title}</h4>
                      {a.deadline ? (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border backdrop-blur-md ${
                          isOverdue ? 'bg-rose-500/30 text-rose-100 border-rose-400/30' : 'bg-white/20 text-white border-white/20'
                        }`}>
                          {isOverdue ? 'Selesai' : 'Aktif'}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20 backdrop-blur-md">
                          Tanpa Tenggat
                        </span>
                      )}
                    </div>
                    {a.deadline ? (
                      <p className="text-[10px] flex items-center gap-1 font-bold text-white/90">
                        <Calendar className="w-3.5 h-3.5 text-white" />
                        Tenggat: {new Date(a.deadline).toLocaleDateString('id-ID', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    ) : (
                      <p className="text-[10px] flex items-center gap-1 font-bold text-white/80">
                        <Calendar className="w-3.5 h-3.5 text-white/70" />
                        Tenggat: <span>Tanpa Tenggat</span>
                      </p>
                    )}
                  </div>
                );
              }) : (
                <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
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
