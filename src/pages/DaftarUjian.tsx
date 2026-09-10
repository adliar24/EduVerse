import { useState, useEffect } from 'react';
import { supabase, supabaseAnon } from '../lib/supabase';
import { 
  FileText, 
  Copy, 
  Trash2, 
  ExternalLink,
  Users,
  Clock,
  MoreHorizontal,
  Search,
  Calendar,
  ChevronRight,
  Plus,
  BarChart3,
  Eye,
  EyeOff,
  Activity,
  Play,
  X,
  Shuffle,
  Shield,
  ShieldOff,
  Wifi,
  WifiOff,
  Key,
  QrCode,
  Check,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAlert } from '../context/AlertContext';
import { useSchool } from '../context/SchoolContext';
import DomainTileIcon from '../components/DomainTileIcon';

export default function DaftarUjian() {
  const navigate = useNavigate();
  const { activeSchool } = useSchool();
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [activating, setActivating] = useState(false);
  const { showAlert } = useAlert();
  const [activeTooltip, setActiveTooltip] = useState<{examId: string, type: string} | null>(null);

  useEffect(() => {
    fetchClasses();
  }, [activeSchool]);

  const fetchClasses = async () => {    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase.from('classes')
        .select('id, name, subject, teacher_id, created_at');
      
      if (activeSchool?.id) {
        if (activeSchool.id === 'legacy') {
          query = query.is('school_id', null).eq('teacher_id', user.id);
        } else {
          query = query.eq('school_id', activeSchool.id);
        }
      } else {
        query = query.eq('teacher_id', user.id);
      }

      const { data: classesData } = await query.order('name');
      
      const classesWithCount = await Promise.all(
        (classesData || []).map(async (cls) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);
          return { ...cls, student_count: count || 0 };
        })
      );
      
      setClasses(classesWithCount);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [activeSchool]);

  // Realtime subscription to refresh participant counts whenever students submit or join
  useEffect(() => {
    const channel = supabase
      .channel('participants_realtime_daftar_ujian')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          fetchExams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSchool]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase.from('exams')
        .select('id, teacher_id, title, exam_code, duration, total_questions, random_question, random_answer, start_time, end_time, is_active, show_score, strict_mode, offline_mode, qr_submission, bypass_code, is_archived, created_at, participants(count), exam_sessions(id, class_id, class_name, is_active)')
        .eq('teacher_id', user.id);
      
      if (activeSchool?.id && activeSchool.id !== 'legacy') {
        query = query.or(`school_id.eq.${activeSchool.id},school_id.is.null`);
      } else if (activeSchool?.id === 'legacy') {
        query = query.is('school_id', null);
      }

      let { data, error } = await query.order('created_at', { ascending: false });
      
      // Fallback if qr_submission column does not exist in the database yet
      if (error && error.message.includes('qr_submission')) {
        console.warn('qr_submission column not found, falling back to query without it.');
        let fallbackQuery = supabase.from('exams')
          .select('id, teacher_id, title, exam_code, duration, total_questions, random_question, random_answer, start_time, end_time, is_active, show_score, strict_mode, offline_mode, bypass_code, is_archived, created_at, participants(count), exam_sessions(id, class_id, class_name, is_active)')
          .eq('teacher_id', user.id);
        
        if (activeSchool?.id && activeSchool.id !== 'legacy') {
          fallbackQuery = fallbackQuery.or(`school_id.eq.${activeSchool.id},school_id.is.null`);
        } else if (activeSchool?.id === 'legacy') {
          fallbackQuery = fallbackQuery.is('school_id', null);
        }
        const { data: fallbackData, error: fallbackError } = await fallbackQuery.order('created_at', { ascending: false });
        if (fallbackError) throw fallbackError;
        data = (fallbackData || []).map(e => ({
          ...e,
          qr_submission: false
        }));
      } else if (error) {
        throw error;
      }

      // If no exams found under school filter, fallback to all exams for this teacher
      if (!data || data.length === 0) {
        const { data: allTeacherExams } = await supabase
          .from('exams')
          .select('id, teacher_id, title, exam_code, duration, total_questions, random_question, random_answer, start_time, end_time, is_active, show_score, strict_mode, offline_mode, bypass_code, is_archived, created_at, participants(count), exam_sessions(id, class_id, class_name, is_active)')
          .eq('teacher_id', user.id)
          .order('created_at', { ascending: false });
        data = allTeacherExams || [];
      }

      const rawExams = data || [];
      const examIds = rawExams.map((e: any) => e.id);

      if (examIds.length > 0) {
        // Query participants using supabaseAnon with dual fallback to bypass auth RLS restrictions
        let participantsList: any[] = [];
        try {
          const { data: anonParts, error: pErr } = await supabaseAnon
            .from('participants')
            .select('id, exam_id, name, class, status, score, end_time')
            .in('exam_id', examIds);

          if (!pErr && anonParts) {
            participantsList = anonParts;
          } else {
            const { data: authParts } = await supabase
              .from('participants')
              .select('id, exam_id, name, class, status, score, end_time')
              .in('exam_id', examIds);
            if (authParts) participantsList = authParts;
          }
        } catch (pError) {
          console.warn('Error fetching participants count for exams:', pError);
        }

        // Aggregate counts: submitted participants vs total
        const submittedMap = new Map<string, { count: number; names: string[]; total: number }>();
        for (const p of participantsList) {
          const isSubmitted = p.status === 'completed' || p.status === 'selesai' || !!p.end_time;
          const current = submittedMap.get(p.exam_id) || { count: 0, names: [], total: 0 };
          current.total += 1;
          if (isSubmitted) {
            current.count += 1;
            if (p.name && current.names.length < 5) {
              current.names.push(p.name);
            }
          }
          submittedMap.set(p.exam_id, current);
        }

        data = rawExams.map((e: any) => {
          const sub = submittedMap.get(e.id);
          const fallbackCount = e.participants?.[0]?.count || 0;
          return {
            ...e,
            submitted_count: sub ? sub.count : fallbackCount,
            total_participants: sub ? sub.total : fallbackCount,
            submitted_names: sub?.names || []
          };
        });
      }

      setExams(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleShowScore = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ show_score: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      fetchExams();
    } catch (error: any) {
      showAlert({ title: 'Gagal', message: 'Gagal mengubah status nilai: ' + error.message, type: 'error' });
    }
  };

  const toggleRandomAnswer = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ random_answer: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      fetchExams();
    } catch (error: any) {
      showAlert({ title: 'Gagal', message: 'Gagal mengubah pengaturan acak jawaban: ' + error.message, type: 'error' });
    }
  };

  const toggleStrictMode = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('exams')
        .update({ strict_mode: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      fetchExams();
    } catch (error: any) {
      showAlert({ title: 'Gagal', message: 'Gagal mengubah pengaturan proteksi ketat. (Pastikan kolom strict_mode sudah dibuat di database)', type: 'error' });
    }
  };

  const toggleOfflineMode = async (id: string, currentStatus: boolean) => {
    try {
      const updates: any = { offline_mode: !currentStatus };
      if (currentStatus) { // turning OFF offline mode (current is true, target is false)
        updates.qr_submission = false;
      }
      const { error } = await supabase
        .from('exams')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      fetchExams();
    } catch (error: any) {
      showAlert({ title: 'Gagal', message: 'Gagal mengubah pengaturan mode offline: ' + error.message, type: 'error' });
    }
  };

  const toggleQrSubmission = async (id: string, currentStatus: boolean) => {
    try {
      const updates: any = { qr_submission: !currentStatus };
      if (!currentStatus) { // turning ON QR mode (current is false, target is true)
        updates.offline_mode = true;
      }
      const { error } = await supabase
        .from('exams')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        if (error.message?.includes('qr_submission') || error.code === '42703') {
          showAlert({
            title: 'Kolom Database Belum Ada',
            message: 'Fitur ini membutuhkan kolom baru di database Supabase Anda.\n\nSilakan masuk ke Dashboard Supabase -> SQL Editor, lalu jalankan perintah berikut:\n\nALTER TABLE public.exams ADD COLUMN IF NOT EXISTS qr_submission BOOLEAN DEFAULT FALSE;',
            type: 'error'
          });
          return;
        }
        throw error;
      }
      fetchExams();
    } catch (error: any) {
      showAlert({
        title: 'Gagal',
        message: 'Gagal mengubah pengaturan mode pengumpulan QR: ' + error.message,
        type: 'error'
      });
    }
  };

  const openTargetClassesModal = (exam: any) => {
    setSelectedExam(exam);
    const activeClassIds = (exam.exam_sessions || [])
      .filter((s: any) => s.is_active !== false)
      .map((s: any) => s.class_id)
      .filter(Boolean);
    setSelectedClasses(activeClassIds);
    setShowActivateModal(true);
  };

  const handleActivateExam = async () => {
    if (!selectedExam) return;
    
    setActivating(true);
    try {
      // Get existing sessions for this exam
      const { data: existingSessions, error: sessErr } = await supabase
        .from('exam_sessions')
        .select('id, class_id, is_active')
        .eq('exam_id', selectedExam.id);
      
      if (sessErr) throw sessErr;

      const existingMap = new Map((existingSessions || []).map((s: any) => [s.class_id, s]));

      // Deactivate unselected sessions
      for (const [classId, s] of existingMap.entries()) {
        if (!selectedClasses.includes(classId) && s.is_active) {
          await supabase
            .from('exam_sessions')
            .update({ is_active: false, ended_at: new Date().toISOString() })
            .eq('id', s.id);
        }
      }

      // Activate or insert selected classes
      const sessionsToInsert: any[] = [];
      for (const classId of selectedClasses) {
        const existing = existingMap.get(classId);
        if (existing) {
          if (!existing.is_active) {
            await supabase
              .from('exam_sessions')
              .update({ is_active: true, started_at: new Date().toISOString() })
              .eq('id', existing.id);
          }
        } else {
          const classData = classes.find(c => c.id === classId);
          sessionsToInsert.push({
            exam_id: selectedExam.id,
            class_id: classId,
            class_name: classData?.name || '',
            is_active: true,
            started_at: new Date().toISOString(),
            expected_students: classData?.student_count || 0
          });
        }
      }

      if (sessionsToInsert.length > 0) {
        const { error: insError } = await supabase
          .from('exam_sessions')
          .insert(sessionsToInsert);
        if (insError) throw insError;
      }

      const hasActive = selectedClasses.length > 0;
      await supabase
        .from('exams')
        .update({ is_active: hasActive })
        .eq('id', selectedExam.id);

      setShowActivateModal(false);
      setSelectedExam(null);
      setSelectedClasses([]);
      fetchExams();
      showAlert({ 
        title: 'Berhasil', 
        message: hasActive 
          ? `Ujian berhasil diaktifkan untuk ${selectedClasses.length} kelas terpilih.`
          : 'Ujian dinonaktifkan (tidak ada kelas terpilih).', 
        type: 'success' 
      });
    } catch (error: any) {
      console.error(error);
      showAlert({ title: 'Gagal', message: 'Gagal menyimpan target kelas: ' + (error?.message || ''), type: 'error' });
    } finally {
      setActivating(false);
    }
  };

  const toggleIsActive = async (id: string, currentStatus: boolean) => {
    if (currentStatus) {
      try {
        const { data: sessions } = await supabase
          .from('exam_sessions')
          .select('id')
          .eq('exam_id', id)
          .eq('is_active', true);

        if (sessions && sessions.length > 0) {
          for (const session of sessions) {
            const { data: participants } = await supabase
              .from('participants')
              .select('id, name, class, score, status')
              .eq('session_id', session.id)
              .eq('status', 'completed');

            const totalSiswa = participants?.length || 0;
            const totalNilai = participants?.reduce((acc, p) => acc + (p.score || 0), 0) || 0;
            const avgScore = totalSiswa > 0 ? totalNilai / totalSiswa : 0;
            const highestScore = participants?.length > 0 ? Math.max(...participants.map(p => p.score || 0)) : 0;
            const lowestScore = participants?.length > 0 ? Math.min(...participants.map(p => p.score || 0)) : 0;
            const passedCount = participants?.filter(p => (p.score || 0) >= 75).length || 0;
            const remedialCount = participants?.filter(p => (p.score || 0) >= 50 && (p.score || 0) < 75).length || 0;
            const failedCount = participants?.filter(p => (p.score || 0) < 50).length || 0;

            const { error: statsError } = await supabase
              .from('exam_session_stats')
              .upsert({
                session_id: session.id,
                exam_id: id,
                total_students: totalSiswa,
                participants_count: totalSiswa,
                avg_score: Math.round(avgScore * 100) / 100,
                highest_score: highestScore,
                lowest_score: lowestScore,
                passed_count: passedCount,
                failed_count: failedCount,
                remedial_count: remedialCount,
                generated_at: new Date().toISOString()
              }, { onConflict: 'session_id' });

            if (statsError) {
              console.error('Error creating session stats:', statsError);
            }

            if (participants && participants.length > 0) {
              for (const participant of participants) {
                const { data: answers } = await supabase
                  .from('answers')
                  .select('id, question_id, is_correct')
                  .eq('participant_id', participant.id);

                const correctCount = answers?.filter(a => a.is_correct === true).length || 0;
                const incorrectCount = answers?.filter(a => a.is_correct === false).length || 0;
                const unansweredCount = answers?.filter(a => a.is_correct === null).length || 0;

                await supabase
                  .from('exam_session_participant_stats')
                  .upsert({
                    session_id: session.id,
                    exam_id: id,
                    participant_id: participant.id,
                    participant_name: participant.name,
                    participant_class: participant.class,
                    score: participant.score,
                    correct_count: correctCount,
                    incorrect_count: incorrectCount,
                    unanswered_count: unansweredCount,
                    generated_at: new Date().toISOString()
                  }, { onConflict: 'session_id,participant_id' });
              }
            }
          }
        }
        
        await supabase
          .from('exam_sessions')
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq('exam_id', id)
          .eq('is_active', true);
        
        await supabase
          .from('exams')
          .update({ is_active: false })
          .eq('id', id);
        
        fetchExams();
        showAlert({ title: 'Berhasil', message: 'Ujian dinonaktifkan dan rekap sesi telah dibuat', type: 'success' });
      } catch (error) {
        showAlert({ title: 'Gagal', message: 'Gagal menonaktifkan ujian', type: 'error' });
      }
    } else {
      const exam = exams.find(e => e.id === id);
      if (exam) {
        openTargetClassesModal(exam);
      }
    }
  };


  const deleteExam = async (id: string) => {
    showAlert({
      title: 'Hapus Ujian?',
      message: 'Apakah Anda yakin ingin menghapus ujian ini? Semua data peserta juga akan terhapus.',
      type: 'confirm',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          await supabase.from('exams').delete().eq('id', id);
          fetchExams();
          showAlert({
            title: 'Terhapus',
            message: 'Ujian berhasil dihapus.',
            type: 'success'
          });
        } catch (error) {
          showAlert({
            title: 'Gagal',
            message: 'Gagal menghapus ujian.',
            type: 'error'
          });
        }
      }
    });
  };

  const filteredExams = exams.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#1D4ED8] tracking-tight">Daftar Ujian</h2>
          <p className="text-slate-500 font-medium mt-1">Pantau dan kelola semua ujian yang telah Anda terbitkan.</p>
        </div>
        <button 
          onClick={() => navigate('/buat-ujian')}
          className="bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-slate-200 border border-white/10"
        >
          <Plus className="w-4 h-4" />
          Buat Ujian Baru
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-[#3B66F5] transition-colors" />
        <input 
          type="text" 
          placeholder="Cari berdasarkan judul ujian..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-[2rem]"></div>)
        ) : filteredExams.length > 0 ? (
          filteredExams.map((exam, index) => {
            const activeSessionsForExam = (exam.exam_sessions || []).filter((s: any) => s.is_active !== false);
            return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={exam.id}
              className="bg-white text-slate-800 rounded-[2rem] border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col overflow-hidden group"
            >
              <div className="pt-6 px-6 pb-4 flex-1">
                {/* Card Top Header: Token & Delete Action */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-2 rounded-xl text-[#1D4ED8] border border-slate-200/80">
                      <FileText className="w-4 h-4" />
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(exam.exam_code);
                        showAlert({ title: 'Salin Kode', message: `Token / Kode Bypass "${exam.exam_code}" berhasil disalin!`, type: 'success' });
                      }}
                      title="Klik untuk salin token & kode bypass"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F172A] border border-slate-800 rounded-xl text-white hover:bg-slate-800 font-bold transition-all text-[11px] group/token cursor-pointer shadow-sm"
                    >
                      <span className="font-mono text-white tracking-wider">Token: {exam.exam_code}</span>
                      <Copy className="w-3 h-3 text-slate-300 group-hover/token:scale-110 transition-all" />
                    </button>
                  </div>

                  {/* Card Top Right: Toggle ON/OFF & Delete Action */}
                  <div className="flex items-center gap-2">
                    {/* Toggle Switch On/Off */}
                    <button
                      type="button"
                      onClick={() => toggleIsActive(exam.id, exam.is_active)}
                      title={exam.is_active ? "Ujian Aktif (Klik untuk nonaktifkan)" : "Ujian Nonaktif (Klik untuk aktifkan)"}
                      className={cn(
                        "relative inline-flex items-center h-7 rounded-full p-0.5 transition-all duration-300 cursor-pointer border shadow-xs select-none",
                        exam.is_active 
                          ? "w-16 bg-emerald-500 border-emerald-600 shadow-emerald-500/25" 
                          : "w-16 bg-slate-200 border-slate-300 hover:bg-slate-300"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300",
                          exam.is_active ? "translate-x-9" : "translate-x-0"
                        )}
                      >
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full transition-colors", 
                          exam.is_active ? "bg-emerald-500" : "bg-slate-400"
                        )} />
                      </span>
                      <span className={cn(
                        "absolute text-[9px] font-black tracking-wider select-none pointer-events-none transition-all",
                        exam.is_active ? "left-2 text-white" : "right-2 text-slate-600"
                      )}>
                        {exam.is_active ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <button 
                      onClick={() => deleteExam(exam.id)}
                      title="Hapus Ujian"
                      className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title & Duration/Questions */}
                <h3 className="text-xl font-black text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-[#1D4ED8] transition-colors">{exam.title}</h3>
                
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-600 mb-4">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                    <Clock className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    <span>{exam.duration} Menit</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{exam.total_questions} Soal</span>
                  </div>
                </div>

                {/* Target Kelas Section */}
                <div className="mb-4 p-3 rounded-2xl bg-blue-50/50 border border-blue-100/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <Users className="w-3.5 h-3.5 text-[#1D4ED8]" />
                      <span>Target Kelas</span>
                    </div>
                    <button
                      onClick={() => openTargetClassesModal(exam)}
                      className="text-[11px] font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                    >
                      Kelola Kelas
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeSessionsForExam.length > 0 ? (
                      activeSessionsForExam.map((s: any) => (
                        <span key={s.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-200 text-[#1D4ED8] rounded-lg text-xs font-bold shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {s.class_name || 'Kelas'}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">
                        Belum ada kelas aktif (Klik "Kelola Kelas")
                      </span>
                    )}
                  </div>
                </div>

                {/* Exam Settings Toggles (Icon + Tooltip) */}
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 mb-4">
                  {/* Strict Mode (Anti-Curang) */}
                  <div className="relative flex-1 flex justify-center">
                    <button 
                      onMouseEnter={() => setActiveTooltip({ examId: exam.id, type: 'strict' })}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => toggleStrictMode(exam.id, exam.strict_mode ?? true)}
                      className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer",
                        exam.strict_mode !== false 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100" 
                          : "bg-white border-slate-200 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {exam.strict_mode !== false ? (
                        <Shield className="w-4.5 h-4.5 shrink-0" />
                      ) : (
                        <ShieldOff className="w-4.5 h-4.5 shrink-0" />
                      )}
                    </button>
                    <div className={cn(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0F172A] text-white text-[10px] font-bold rounded-xl transition-all duration-200 shadow-xl whitespace-nowrap z-50 pointer-events-none",
                      activeTooltip?.examId === exam.id && activeTooltip?.type === 'strict'
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-1 scale-95"
                    )}>
                      {exam.strict_mode !== false ? "Proteksi Ketat: Aktif" : "Proteksi: Standar"}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F172A]" />
                    </div>
                  </div>

                  {/* Random Answer (Acak Soal) */}
                  <div className="relative flex-1 flex justify-center">
                    <button 
                      onMouseEnter={() => setActiveTooltip({ examId: exam.id, type: 'random' })}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => toggleRandomAnswer(exam.id, exam.random_answer)}
                      className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer",
                        exam.random_answer 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100" 
                          : "bg-white border-slate-200 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      <Shuffle className={cn("w-4.5 h-4.5 shrink-0 transition-transform", exam.random_answer && "rotate-180")} />
                    </button>
                    <div className={cn(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0F172A] text-white text-[10px] font-bold rounded-xl transition-all duration-200 shadow-xl whitespace-nowrap z-50 pointer-events-none",
                      activeTooltip?.examId === exam.id && activeTooltip?.type === 'random'
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-1 scale-95"
                    )}>
                      {exam.random_answer ? "Acak Jawaban: Aktif" : "Urutan Tetap"}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F172A]" />
                    </div>
                  </div>

                  {/* Show Score (Bagi Nilai) */}
                  <div className="relative flex-1 flex justify-center">
                    <button 
                      onMouseEnter={() => setActiveTooltip({ examId: exam.id, type: 'score' })}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => toggleShowScore(exam.id, exam.show_score)}
                      className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer",
                        exam.show_score 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100" 
                          : "bg-white border-slate-200 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {exam.show_score ? (
                        <Eye className="w-4.5 h-4.5 shrink-0" />
                      ) : (
                        <EyeOff className="w-4.5 h-4.5 shrink-0" />
                      )}
                    </button>
                    <div className={cn(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0F172A] text-white text-[10px] font-bold rounded-xl transition-all duration-200 shadow-xl whitespace-nowrap z-50 pointer-events-none",
                      activeTooltip?.examId === exam.id && activeTooltip?.type === 'score'
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-1 scale-95"
                    )}>
                      {exam.show_score ? "Tampilkan Nilai: Aktif" : "Sembunyikan Nilai"}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F172A]" />
                    </div>
                  </div>

                  {/* Offline Mode */}
                  <div className="relative flex-1 flex justify-center">
                    <button 
                      onMouseEnter={() => setActiveTooltip({ examId: exam.id, type: 'offline' })}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => toggleOfflineMode(exam.id, exam.offline_mode ?? false)}
                      className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer",
                        exam.offline_mode 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100" 
                          : "bg-white border-slate-200 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {exam.offline_mode ? (
                        <WifiOff className="w-4.5 h-4.5 shrink-0" />
                      ) : (
                        <Wifi className="w-4.5 h-4.5 shrink-0" />
                      )}
                    </button>
                    <div className={cn(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0F172A] text-white text-[10px] font-bold rounded-xl transition-all duration-200 shadow-xl whitespace-nowrap z-50 pointer-events-none",
                      activeTooltip?.examId === exam.id && activeTooltip?.type === 'offline'
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-1 scale-95"
                    )}>
                      {exam.offline_mode ? "Mode Offline: Aktif" : "Mode Online (Realtime)"}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F172A]" />
                    </div>
                  </div>

                  {/* QR Mode */}
                  <div className="relative flex-1 flex justify-center">
                    <button 
                      onMouseEnter={() => setActiveTooltip({ examId: exam.id, type: 'qr' })}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => toggleQrSubmission(exam.id, exam.qr_submission ?? false)}
                      className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer",
                        exam.qr_submission 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100" 
                          : "bg-white border-slate-200 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      <QrCode className="w-4.5 h-4.5 shrink-0" />
                    </button>
                    <div className={cn(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0F172A] text-white text-[10px] font-bold rounded-xl transition-all duration-200 shadow-xl whitespace-nowrap z-50 pointer-events-none",
                      activeTooltip?.examId === exam.id && activeTooltip?.type === 'qr'
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-1 scale-95"
                    )}>
                      {exam.qr_submission ? "Mode QR Code: Aktif" : "Mode Biasa"}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F172A]" />
                    </div>
                  </div>
                </div>

                {/* Status & Participants */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex flex-col gap-1 items-start">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Sesi</p>
                    <button 
                      onClick={() => toggleIsActive(exam.id, exam.is_active)} 
                      title={exam.is_active ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer shadow-xs", 
                        exam.is_active 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full", exam.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                      {exam.is_active ? 'Sedang Aktif' : 'Nonaktif'}
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peserta Mengirim</p>
                    <div className="flex items-center gap-2 h-[32px]">
                      {exam.submitted_names && exam.submitted_names.length > 0 ? (
                        <div className="flex -space-x-1.5">
                          {exam.submitted_names.slice(0, 3).map((name: string, i: number) => {
                            const colors = [
                              'from-blue-600 to-indigo-600',
                              'from-emerald-600 to-teal-600',
                              'from-violet-600 to-purple-600',
                              'from-amber-500 to-orange-600'
                            ];
                            return (
                              <div 
                                key={i} 
                                title={name}
                                className={cn(
                                  "w-6 h-6 rounded-full border-2 border-white text-white font-black text-[9px] flex items-center justify-center shadow-xs bg-gradient-to-tr",
                                  colors[i % colors.length]
                                )}
                              >
                                {name.charAt(0).toUpperCase()}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex -space-x-1.5">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-5.5 h-5.5 rounded-full border-2 border-white bg-slate-200 shadow-xs" />
                          ))}
                        </div>
                      )}
                      <span 
                        className={cn(
                          "font-bold text-xs px-2 py-0.5 rounded-md",
                          (exam.submitted_count || 0) > 0 
                            ? "text-blue-700 bg-blue-50 border border-blue-100" 
                            : "text-slate-500 bg-slate-100"
                        )}
                        title={`${exam.submitted_count || 0} murid sudah mengirim ujian`}
                      >
                        +{exam.submitted_count ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions: Monitor & Analisis */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 mt-auto flex flex-col gap-2 rounded-b-[2rem]">
                {exam.qr_submission ? (
                  <button 
                    onClick={() => navigate(`/scan-ujian/${exam.id}`)}
                    className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 shrink-0" />
                    <span>Pindai QR</span>
                  </button>
                ) : (
                  !exam.offline_mode && (
                    <button 
                      onClick={() => navigate(`/monitor-ujian/${exam.id}`)}
                      className="w-full bg-blue-50 border border-blue-200/80 text-[#1D4ED8] py-2.5 rounded-xl font-bold text-xs hover:bg-blue-100/70 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Activity className="w-4 h-4 shrink-0" />
                      <span>Live Monitor</span>
                    </button>
                  )
                )}
                <button 
                  onClick={() => navigate('/hasil-ujian', { state: { examId: exam.id } })}
                  className="w-full bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] text-white py-2.5 rounded-xl font-bold text-xs hover:brightness-110 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 group/btn cursor-pointer border border-white/10"
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>Analisis & Nilai</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform shrink-0" />
                </button>
              </div>
            </motion.div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
              <Calendar className="w-12 h-12 text-slate-200" />
            </div>
            <h3 className="text-2xl font-bold text-[#1D4ED8] mb-3">Belum ada ujian</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto">Anda belum menerbitkan ujian apapun. Mulai buat ujian pertama Anda sekarang.</p>
            <button 
              onClick={() => navigate('/buat-ujian')}
              className="mt-8 bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 mx-auto border border-white/10"
            >
              <Plus className="w-4 h-4" />
              Buat Ujian Sekarang
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showActivateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70"
              onClick={() => setShowActivateModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-md w-full relative z-10 shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">Kelola Target Kelas</h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {selectedExam?.title}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowActivateModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 my-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pilih Kelas Peserta</label>
                    {classes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedClasses.length === classes.length) {
                            setSelectedClasses([]);
                          } else {
                            setSelectedClasses(classes.map(c => c.id));
                          }
                        }}
                        className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        {selectedClasses.length === classes.length ? 'Batal Semua' : 'Pilih Semua'}
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                    {classes.map(cls => {
                      const isSelected = selectedClasses.includes(cls.id);
                      return (
                        <label 
                          key={cls.id} 
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border",
                            isSelected 
                              ? "bg-white border-blue-300 shadow-xs ring-1 ring-blue-500/20" 
                              : "hover:bg-white border-transparent text-slate-600"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedClasses([...selectedClasses, cls.id]);
                                } else {
                                  setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={cn("text-sm font-semibold truncate", isSelected ? "text-blue-900" : "text-slate-700")}>
                              {cls.name}
                            </span>
                          </div>
                          {cls.student_count !== undefined && (
                            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                              {cls.student_count} Siswa
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  {selectedClasses.length > 0 && (
                    <p className="text-xs text-blue-600 mt-2 font-semibold">
                      ✓ {selectedClasses.length} dari {classes.length} kelas dipilih
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowActivateModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={handleActivateExam}
                  disabled={activating}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {activating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{selectedClasses.length > 0 ? 'Terapkan' : 'Nonaktifkan Sesi'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
