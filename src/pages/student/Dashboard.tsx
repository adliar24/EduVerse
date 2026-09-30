import { useState, useEffect } from 'react';
import { supabase, supabaseAnon } from '../../lib/supabase';
import { 
  FileText, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  Zap,
  BookOpen,
  RotateCw,
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import React from 'react';
import { cn, capitalizeEachWord } from '../../lib/utils';
import { getStudentVerse, getStudentPointsHistory } from '../../services/verseService';
import { calculateLevelAndProgress, getStageInfo, CHEST_ASSET } from '../../utils/verseEngine';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    examsTaken: 0,
    avgScore: 0,
    ongoingExams: 0
  });
  const [materialsStat, setMaterialsStat] = useState({ total: 0, newCount: 0 });
  const [assignmentsStat, setAssignmentsStat] = useState({ total: 0, pendingCount: 0 });
  const [allMaterialsList, setAllMaterialsList] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);
  const [activeExamSessions, setActiveExamSessions] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [startingExamId, setStartingExamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentVerse, setStudentVerse] = useState<any>(null);
  const [versePoints, setVersePoints] = useState(0);

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
        .select('id, name, student_code, class_id, classes!students_class_id_fkey(name)')
        .eq('id', studentObj.id)
        .maybeSingle();

      if (studentDbErr || !studentDb) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const className = studentDb.classes 
        ? (Array.isArray(studentDb.classes) ? studentDb.classes[0]?.name : (studentDb.classes as any).name)
        : '';

      const classId = studentDb.class_id;
      const formattedName = capitalizeEachWord(studentDb.name);

      // Synchronize latest student profile back to local session
      localStorage.setItem('student_session', JSON.stringify({
        ...studentObj,
        name: formattedName,
        class_id: studentDb.class_id
      }));

      setStudentProfile({
        id: studentDb.id,
        name: formattedName,
        class_id: studentDb.class_id,
        className: className
      });

      const [resultsRes, materialsRes, assignmentsRes, activeSessionsRes, submissionsRes] = await Promise.all([
        supabase
          .from('participants')
          .select(`
            *,
            exams (
              title,
              exam_code,
              duration,
              total_questions,
              strict_limit
            )
          `)
          .eq('name', studentDb.name)
          .eq('class', className || '')
          .order('created_at', { ascending: false }),
        classId ? supabase.from('materials').select('*').eq('class_id', classId).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
        classId ? supabase.from('assignments').select('*').eq('class_id', classId).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
        classId ? supabase.from('exam_sessions')
          .select(`
            id,
            exam_id,
            class_id,
            class_name,
            is_active,
            started_at,
            exams (
              id,
              title,
              exam_code,
              duration,
              total_questions,
              strict_mode,
              offline_mode,
              strict_limit
            )
          `)
          .eq('class_id', classId)
          .eq('is_active', true)
          : Promise.resolve({ data: [] }),
        supabase.from('assignment_submissions').select('id, assignment_id, status').eq('student_id', studentObj.id)
      ]);

      const results = resultsRes.data || [];

      // Filter out exams that student has already completed
      const completedExamIds = new Set(
        results.filter(r => r.status === 'completed' || r.end_time).map(r => r.exam_id)
      );

      const availableSessions = (activeSessionsRes.data || []).filter((s: any) => {
        if (!s.exams) return false;
        if (completedExamIds.has(s.exam_id)) return false;
        return true;
      });

      setActiveExamSessions(availableSessions);

      const filteredM = (materialsRes.data as any[] || []).filter(m => 
        m.target_type === 'class' || 
        (m.target_type === 'students' && (m.student_ids || []).includes(studentObj.id))
      );
      setAllMaterialsList(filteredM);

      // Track unread/new materials
      let openedMaterials: string[] = [];
      try {
        const raw = localStorage.getItem(`eduverse_opened_materials_${studentObj.id}`);
        if (raw) openedMaterials = JSON.parse(raw);
      } catch (e) {}
      const openedSet = new Set(openedMaterials);
      const newMaterialsCount = filteredM.filter((m: any) => !openedSet.has(m.id)).length;
      setMaterialsStat({ total: filteredM.length, newCount: newMaterialsCount });

      const filteredA = (assignmentsRes.data as any[] || []).filter(a => 
        a.target_type === 'class' || 
        (a.target_type === 'students' && (a.student_ids || []).includes(studentObj.id))
      );
      const submittedIds = new Set((submissionsRes.data || []).map((s: any) => s.assignment_id));
      const pendingAssignmentsCount = filteredA.filter((a: any) => !submittedIds.has(a.id)).length;
      setAssignmentsStat({ total: filteredA.length, pendingCount: pendingAssignmentsCount });

      const completedResults = results?.filter(r => r.status === 'completed') || [];
      const totalTaken = completedResults.length;
      const avgScore = totalTaken > 0 
        ? completedResults.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalTaken 
        : 0;

      setStats({
        examsTaken: totalTaken,
        avgScore: Math.round(avgScore),
        ongoingExams: availableSessions.length
      });
      setRecentResults(results || []);

      // Fetch student verse and lifetime points
      try {
        const [vData, pData] = await Promise.all([
          getStudentVerse(studentObj.id),
          getStudentPointsHistory(studentObj.id, formattedName, className)
        ]);
        setStudentVerse(vData);
        setVersePoints(pData.totalPoints);
      } catch (verseErr) {
        console.debug('[Dashboard] Verse loading skipped:', verseErr);
      }
    } catch (error) {
      console.error('Error fetching student dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStartExamFromDashboard = async (session: any) => {
    if (!studentProfile) return;
    setStartingExamId(session.id);
    try {
      const examId = session.exam_id;
      const examCode = session.exams?.exam_code;
      if (!examCode) throw new Error('Kode ujian tidak ditemukan');

      // Check existing participants
      let existingParticipants: any[] | null = null;
      try {
        const { data } = await supabaseAnon
          .from('participants')
          .select('id, status, name, is_locked, violations, end_time')
          .eq('session_id', session.id);
        existingParticipants = data;
      } catch (e) {}

      if (!existingParticipants) {
        const { data: authParticipants } = await supabase
          .from('participants')
          .select('id, status, name, is_locked, violations, end_time')
          .eq('session_id', session.id);
        existingParticipants = authParticipants;
      }

      const existingParticipant = existingParticipants?.find(
        (p: any) => p.name?.trim().toLowerCase() === studentProfile.name?.trim().toLowerCase()
      );

      let participantId: string;

      if (existingParticipant) {
        if (existingParticipant.status === 'completed' || existingParticipant.end_time) {
          alert('Akses ditolak. Anda sudah menyelesaikan ujian ini.');
          setStartingExamId(null);
          return;
        }
        if (existingParticipant.is_locked || existingParticipant.status === 'blocked') {
          alert('Akun Anda terkunci karena pelanggaran atau kendala teknis. Silakan hubungi guru.');
          setStartingExamId(null);
          return;
        }
        participantId = existingParticipant.id;
      } else {
        const participantPayload = [{
          exam_id: examId,
          session_id: session.id,
          name: studentProfile.name,
          class: session.class_name || studentProfile.className || '',
          start_time: new Date().toISOString(),
          status: 'ongoing',
          is_locked: false,
          violations: 0,
          last_position: 0
        }];

        let newParticipant = null;
        let insertErr = null;

        const { data: anonPart, error: anonErr } = await supabaseAnon
          .from('participants')
          .insert(participantPayload)
          .select()
          .single();

        if (!anonErr && anonPart) {
          newParticipant = anonPart;
        } else {
          const { data: authPart, error: authErr } = await supabase
            .from('participants')
            .insert(participantPayload)
            .select()
            .single();
          newParticipant = authPart;
          insertErr = authErr;
        }

        if (insertErr && !newParticipant) throw insertErr;
        participantId = newParticipant?.id;
      }

      try {
        localStorage.setItem(`exam_session_${examCode}`, participantId);
      } catch (e) {}

      navigate(`/exam/start/${examCode}?p=${participantId}`, { replace: true });
    } catch (err: any) {
      console.error('Error starting exam from dashboard:', err);
      alert('Gagal memulai ujian: ' + (err?.message || 'Terjadi kesalahan sistem.'));
    } finally {
      setStartingExamId(null);
    }
  };

  const handleOpenMaterials = () => {
    if (studentProfile?.id) {
      try {
        const allIds = allMaterialsList.map((m: any) => m.id);
        localStorage.setItem(`eduverse_opened_materials_${studentProfile.id}`, JSON.stringify(allIds));
        setMaterialsStat(prev => ({ ...prev, newCount: 0 }));
      } catch (e) {}
    }
    navigate('/materi-siswa');
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E40AF] p-6 sm:p-8 rounded-[2.25rem] text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="flex items-center gap-4 relative z-10 min-w-0 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-white/15 text-white flex items-center justify-center font-bold text-xl shadow-lg border border-white/20 shrink-0">
            <Zap className="w-7 h-7 text-amber-300 fill-amber-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug break-words">
              Selamat Belajar{studentProfile?.name ? `, ${studentProfile.name}` : ''}!
            </h2>
            <p className="text-slate-200 text-xs sm:text-sm font-medium mt-0.5">
              Pantau materi pelajaran, tugas murid, ujian, & sahabat Verse-mu.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={() => fetchStudentData(true)}
            disabled={loading || refreshing}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 cursor-pointer disabled:opacity-50"
            title="Sinkronkan data terbaru"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-300' : 'text-white'}`} />
            <span>{refreshing ? 'Sinkron...' : 'Segarkan'}</span>
          </button>
        </div>
      </div>

      {/* Verse Pet Companion Widget */}
      {studentVerse ? (
        (() => {
          const vStats = calculateLevelAndProgress(versePoints);
          const stageInfo = getStageInfo(studentVerse.species, studentVerse.stage);
          return (
            <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center p-1 shrink-0 relative bg-slate-50/70 rounded-2xl border border-slate-100">
                  <img
                    src={stageInfo.image}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = stageInfo.pngImage; }}
                    alt={studentVerse.nickname}
                    className="w-full h-full object-contain filter drop-shadow-md relative z-10 transition-transform hover:scale-105 select-none"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                      {studentVerse.nickname}
                    </h3>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-[#3B66F5] border border-blue-200/60 uppercase">
                      Lv. {vStats.currentLevel} • {stageInfo.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-32 sm:w-48 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className="h-full bg-[#3B66F5] rounded-full" 
                        style={{ width: `${vStats.progressPercent}%` }} 
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {vStats.currentLevelProgress}/{vStats.pointsNeededForNext} XP ({vStats.progressPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/my-verse"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3B66F5] to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
              >
                <span>Buka My Verse</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })()
      ) : (
        <div className="relative overflow-hidden bg-gradient-to-r from-yellow-300/25 via-amber-300/20 to-yellow-100/35 rounded-3xl border border-yellow-300/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-1 shrink-0 relative">
              <div 
                className="absolute inset-1 rounded-full blur-xl opacity-35 pointer-events-none"
                style={{ backgroundColor: '#FACC15' }}
              />
              <img
                src={CHEST_ASSET.webp}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = CHEST_ASSET.png; }}
                alt="Peti Verse"
                className="w-full h-full object-contain filter drop-shadow-md relative z-10"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
                  Peti Misterius Verse Siap Dibuka!
                </h3>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-yellow-200 text-yellow-900 border border-yellow-300 uppercase">
                  Spesial
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Buka sekarang untuk memilih 1 dari 5 telur elemen pendamping belajarmu.
              </p>
            </div>
          </div>

          <Link
            to="/my-verse"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-300 to-yellow-400 hover:from-amber-400 hover:to-yellow-500 text-slate-950 text-xs font-black shadow-md shadow-yellow-400/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
          >
            <span>Buka Peti Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Active Exam Sessions Ready to Take */}
      {activeExamSessions.length > 0 && (
        <div className="bg-white rounded-[2rem] border-2 border-blue-500/20 shadow-lg p-6 sm:p-7 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Ujian Siap Dikerjakan</h3>
                  <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-extrabold px-3 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Sesi ujian resmi yang telah diaktifkan guru untuk kelas Anda.</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#1D4ED8] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 self-start sm:self-auto">
              {activeExamSessions.length} Ujian Tersedia
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeExamSessions.map((session) => {
              const exam = session.exams;
              const isOngoing = recentResults.some(r => r.session_id === session.id && r.status === 'ongoing');
              return (
                <div
                  key={session.id}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-blue-50/20 hover:border-blue-400/80 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-[#0F172A] text-white tracking-wider">
                        Token: {exam?.exam_code}
                      </span>
                      {exam?.strict_mode && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          Proteksi Ketat
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {exam?.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs font-bold text-slate-600">
                      <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        {exam?.duration} Menit
                      </span>
                      <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        {exam?.total_questions} Soal
                      </span>
                      {session.class_name && (
                        <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                          {session.class_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartExamFromDashboard(session)}
                    disabled={startingExamId === session.id}
                    className="w-full bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] hover:brightness-110 active:scale-[0.98] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {startingExamId === session.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                        <span>{isOngoing ? 'Lanjutkan Ujian' : 'Mulai Ujian Sekarang'}</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ongoing Exams Banner (Fallback Alert Strip if no sessions directly loaded) */}
      {activeExamSessions.length === 0 && recentResults.filter(r => r.status === 'ongoing').length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-4 px-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-3 border border-white/20">
          <div className="flex items-center gap-3.5">
            <div className="bg-white/20 p-2.5 rounded-xl shrink-0">
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

      {/* 3 Colorful Interactive Stat Cards */}
      {/* 3 Colorful Interactive Stat Cards - Sleek & Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Rata-rata Nilai */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white shadow-md shadow-emerald-950/15 border border-emerald-400/30 flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:shadow-lg"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-100/90">
              Rata-rata Nilai
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-xs shadow-inner">
              <TrendingUp className="w-4 h-4 text-emerald-100" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
              {stats.avgScore}%
            </h3>
            <span className="text-[11px] text-emerald-100/80 font-medium truncate">
              {stats.examsTaken} Ujian CBT
            </span>
          </div>
        </motion.div>

        {/* Card 2: Materi Pelajaran */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={handleOpenMaterials}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#1E3A8A] via-[#1D4ED8] to-[#3B66F5] text-white shadow-md shadow-blue-950/15 border border-blue-400/30 flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-blue-100/90">
                Materi Pelajaran
              </span>
              {materialsStat.newCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-xs animate-pulse">
                  +{materialsStat.newCount} Baru
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-xs shadow-inner group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4 text-blue-100" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
              {materialsStat.total} Materi
            </h3>
            <span className="text-[11px] text-blue-100/85 font-semibold flex items-center gap-1 group-hover:text-white transition-colors shrink-0">
              Buka materi <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </motion.div>

        {/* Card 3: Tugas Murid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => navigate('/tugas-siswa')}
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-700 via-indigo-700 to-violet-800 text-white shadow-md shadow-purple-950/15 border border-purple-400/30 flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:scale-[1.01] hover:shadow-lg cursor-pointer group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-purple-100/90">
                Tugas Murid
              </span>
              {assignmentsStat.pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-400 text-slate-950 shadow-xs animate-pulse">
                  {assignmentsStat.pendingCount} Perlu Dikerjakan
                </span>
              )}
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-xs shadow-inner group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4 text-purple-100" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
              {assignmentsStat.total} Tugas
            </h3>
            <span className="text-[11px] text-purple-100/85 font-semibold flex items-center gap-1 group-hover:text-white transition-colors shrink-0">
              Buka tugas <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </motion.div>
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
    </div>
  );
}
