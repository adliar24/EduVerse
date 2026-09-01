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
  GraduationCap,
  Camera,
  RotateCw
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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const studentSessionStr = localStorage.getItem('student_session');
    if (!studentSessionStr) {
      navigate('/login');
      return;
    }
    fetchStudentData();
  }, []);

  const fetchStudentData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const studentSessionStr = localStorage.getItem('student_session');
      if (!studentSessionStr) {
        setLoading(false);
        setRefreshing(false);
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
        setRefreshing(false);
        return;
      }

      // Synchronize latest student profile back to local session
      localStorage.setItem('student_session', JSON.stringify({
        ...studentObj,
        name: studentDb.name,
        class_id: studentDb.class_id
      }));

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
      setRefreshing(false);
    }
  };

  const statCards = [
    { 
      label: 'Ujian Diikuti', 
      value: `${stats.examsTaken} Selesai`, 
      icon: FileText, 
      color: 'blue',
      iconBg: 'bg-blue-500 text-white shadow-md shadow-blue-500/20',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
      borderHover: 'hover:border-blue-400 hover:shadow-blue-500/10',
      accentBg: 'from-blue-500/10 to-transparent',
      desc: 'Riwayat ujian dikerjakan'
    },
    { 
      label: 'Rata-rata Nilai', 
      value: `${stats.avgScore}%`, 
      icon: TrendingUp, 
      color: 'emerald',
      iconBg: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      borderHover: 'hover:border-emerald-400 hover:shadow-emerald-500/10',
      accentBg: 'from-emerald-500/10 to-transparent',
      desc: 'Pencapaian skor'
    },
    { 
      label: 'Ujian Berlangsung', 
      value: `${stats.ongoingExams} Aktif`, 
      icon: Clock, 
      color: 'amber',
      iconBg: 'bg-amber-500 text-white shadow-md shadow-amber-500/20',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
      borderHover: 'hover:border-amber-400 hover:shadow-amber-500/10',
      accentBg: 'from-amber-500/10 to-transparent',
      desc: 'Sesi perlu dikerjakan'
    },
  ];

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-24 bg-slate-100 rounded-3xl"></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-100 rounded-3xl"></div>)}
      </div>
      <div className="h-64 bg-slate-100 rounded-3xl"></div>
    </div>
  );

  return (
    <div className="space-y-5 pb-10">
      {/* Colorful Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-[2.25rem] text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 top-0 w-48 h-48 bg-purple-500/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center font-bold text-xl shadow-lg border border-white/20 shrink-0">
            <Zap className="w-7 h-7 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight leading-snug">Selamat Belajar!</h2>
            <p className="text-slate-200 text-xs sm:text-sm font-medium">Pantau ujian, tugas & presensi harian.</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={() => fetchStudentData(true)}
            disabled={loading || refreshing}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/20 backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer disabled:opacity-50"
            title="Sinkronkan data terbaru"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-300' : 'text-white'}`} />
            <span>{refreshing ? 'Sinkron...' : 'Segarkan'}</span>
          </button>

          <Link 
            to="/scan-presensi-siswa"
            className="bg-amber-400 hover:bg-amber-300 text-amber-950 px-4.5 py-3 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shrink-0 cursor-pointer border border-amber-300"
          >
            <Camera className="w-4 h-4 text-amber-950" />
            <span>Scan Presensi</span>
          </Link>

          <Link 
            to="/daftar-ujian-siswa"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4.5 py-3 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30 shrink-0 cursor-pointer border border-blue-400/40"
          >
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Ikuti Ujian</span>
          </Link>
        </div>
      </div>

      {/* Ongoing Exams Banner (Compact Alert Strip) */}
      {recentResults.filter(r => r.status === 'ongoing').length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 px-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-3 border border-white/20">
          <div className="flex items-center gap-3.5">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-black text-xs sm:text-sm leading-tight">Ujian Berlangsung</h4>
              <p className="text-white/90 text-[11px] font-medium">Selesaikan sebelum batas waktu berakhir</p>
            </div>
          </div>
          <Link 
            to="/daftar-ujian-siswa"
            className="bg-white text-amber-800 px-4.5 py-2 rounded-full text-xs font-black hover:bg-amber-50 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shrink-0"
          >
            <span>Lanjutkan</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Colorful Rounded Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            key={stat.label}
            className={`p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-4 transition-all duration-300 group hover:scale-[1.02] hover:shadow-md ${stat.borderHover} relative overflow-hidden`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.accentBg} rounded-bl-full pointer-events-none`}></div>
            <div className={`p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-105 ${stat.iconBg}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="relative z-10 min-w-0">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 mt-0.5">{stat.value}</h3>
              <p className="text-slate-500 text-[10px] font-medium mt-0.5 truncate">{stat.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Results (Riwayat Ujian) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Riwayat Ujian</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Daftar ujian yang telah dikerjakan</p>
          </div>
        </div>
        
        <div className="space-y-2.5">
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
                    ? "bg-amber-100 text-amber-700" 
                    : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                )}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={cn(
                      "font-bold text-xs sm:text-sm truncate",
                      result.status === 'ongoing' 
                        ? "text-amber-800" 
                        : "text-slate-900 group-hover:text-blue-600 transition-colors"
                    )}>{result.exams?.title}</h4>
                    {result.status === 'ongoing' && (
                      <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        BERLANGSUNG
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tight">Kode: {result.exams?.exam_code}</span>
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-500" />
                      {result.exams?.duration} Menit
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {result.status === 'ongoing' ? (
                  <Link 
                    to="/daftar-ujian-siswa"
                    className="bg-amber-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-amber-600 transition-all flex items-center gap-1 shadow-sm"
                  >
                    Lanjutkan
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <>
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-black leading-none",
                        (result.score || 0) >= 75 ? "text-emerald-600" : "text-amber-600"
                      )}>{result.score || 0}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Skor</p>
                    </div>
                    <div className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all">
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-all" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <div className="bg-white w-10 h-10 rounded-xl shadow-sm flex items-center justify-center mx-auto mb-2 border border-slate-100">
                <FileText className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-slate-500 text-xs font-bold">Belum ada riwayat ujian</p>
              <Link to="/daftar-ujian-siswa" className="text-blue-600 text-xs font-bold mt-1 inline-block hover:underline">Ikuti ujian sekarang →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Materials and Assignments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Latest Materials */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Materi Pelajaran
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Bahan ajar aktif dari guru</p>
              </div>
              <Link to="/materi-tugas-siswa" className="text-xs font-bold text-blue-600 hover:underline">Lihat Semua →</Link>
            </div>

            <div className="space-y-2.5">
              {latestMaterials.length > 0 ? latestMaterials.map((m) => {
                return (
                  <div key={m.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all space-y-1 group">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs truncate text-slate-900 group-hover:text-blue-600 transition-colors">{m.title}</h4>
                      {m.link && <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{m.description}</p>
                  </div>
                );
              }) : (
                <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <BookOpen className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                  <p className="text-xs text-slate-400 font-bold">Belum ada materi aktif</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Tugas Kelas
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Lembar tugas yang perlu dikerjakan</p>
              </div>
              <Link to="/materi-tugas-siswa" className="text-xs font-bold text-indigo-600 hover:underline">Lihat Semua →</Link>
            </div>

            <div className="space-y-2.5">
              {latestAssignments.length > 0 ? latestAssignments.map((a) => {
                const deadlineDate = a.deadline ? new Date(a.deadline) : null;
                const isOverdue = deadlineDate ? deadlineDate.getTime() < Date.now() : false;
                return (
                  <div key={a.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all space-y-1.5 group">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs truncate text-slate-900 group-hover:text-indigo-600 transition-colors">{a.title}</h4>
                      {a.deadline ? (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isOverdue ? 'Selesai' : 'Aktif'}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Tanpa Tenggat
                        </span>
                      )}
                    </div>
                    {a.deadline ? (
                      <p className="text-[10px] flex items-center gap-1 font-semibold text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        Tenggat: <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800 font-bold'}>{new Date(a.deadline).toLocaleDateString('id-ID', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}</span>
                      </p>
                    ) : (
                      <p className="text-[10px] flex items-center gap-1 font-semibold text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        Tenggat: <span className="font-bold text-emerald-700">Tanpa Tenggat</span>
                      </p>
                    )}
                  </div>
                );
              }) : (
                <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <FileText className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                  <p className="text-xs text-slate-400 font-bold">Belum ada tugas aktif</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
