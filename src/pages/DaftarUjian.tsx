import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAlert } from '../context/AlertContext';

import { useSchool } from '../context/SchoolContext';

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
        .select('id, name, subject, teacher_id, created_at')
        .eq('teacher_id', user.id);
      
      if (activeSchool?.id) {
        if (activeSchool.id === 'legacy') {
          query = query.is('school_id', null);
        } else {
          query = query.eq('school_id', activeSchool.id);
        }
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

  const fetchExams = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase.from('exams')
        .select('id, teacher_id, title, exam_code, duration, total_questions, random_question, random_answer, start_time, end_time, is_active, show_score, strict_mode, offline_mode, qr_submission, bypass_code, is_archived, created_at, participants(count)')
        .eq('teacher_id', user.id);
      
      if (activeSchool?.id) {
        if (activeSchool.id === 'legacy') {
          query = query.is('school_id', null);
        } else {
          query = query.eq('school_id', activeSchool.id);
        }
      }

      let { data, error } = await query.order('created_at', { ascending: false });
      
      // Fallback if qr_submission column does not exist in the database yet
      if (error && error.message.includes('qr_submission')) {
        console.warn('qr_submission column not found, falling back to query without it.');
        let fallbackQuery = supabase.from('exams')
          .select('id, teacher_id, title, exam_code, duration, total_questions, random_question, random_answer, start_time, end_time, is_active, show_score, strict_mode, offline_mode, bypass_code, is_archived, created_at, participants(count)')
          .eq('teacher_id', user.id);
        
        if (activeSchool?.id) {
          if (activeSchool.id === 'legacy') {
            fallbackQuery = fallbackQuery.is('school_id', null);
          } else {
            fallbackQuery = fallbackQuery.eq('school_id', activeSchool.id);
          }
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

  const handleActivateExam = async () => {
    if (!selectedExam || selectedClasses.length === 0) return;
    
    setActivating(true);
    try {
      const sessionsToInsert = selectedClasses.map(classId => {
        const classData = classes.find(c => c.id === classId);
        return {
          exam_id: selectedExam.id,
          class_id: classId,
          class_name: classData?.name || '',
          is_active: true,
          started_at: new Date().toISOString(),
          expected_students: classData?.student_count || 0
        };
      });
      
      const { error } = await supabase
        .from('exam_sessions')
        .insert(sessionsToInsert);
      
      if (error) throw error;
      
      await supabase
        .from('exams')
        .update({ is_active: true })
        .eq('id', selectedExam.id);
      
      setShowActivateModal(false);
      setSelectedExam(null);
      setSelectedClasses([]);
      fetchExams();
      showAlert({ title: 'Berhasil', message: 'Ujian berhasil diaktifkan untuk kelas yang dipilih', type: 'success' });
    } catch (error) {
      console.error(error);
      showAlert({ title: 'Gagal', message: 'Gagal mengaktifkan ujian', type: 'error' });
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
      setSelectedExam(exam);
      setShowActivateModal(true);
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
          filteredExams.map((exam, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={exam.id}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-2xl hover:shadow-slate-200/50 hover:border-[#3B66F5]/30 transition-all duration-500 flex flex-col"
            >
              <div className="pt-8 px-8 pb-5 flex-1">
                {/* Card Top Header: Token & Action Dropdown */}
                <div className="flex justify-between items-center mb-6">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(exam.exam_code);
                      showAlert({ title: 'Salin Kode', message: `Token / Kode Bypass "${exam.exam_code}" berhasil disalin!`, type: 'success' });
                    }}
                    title="Klik untuk salin token & kode bypass"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-500 hover:text-[#1D4ED8] hover:bg-slate-100 hover:border-slate-300 font-bold transition-all text-[11px] group/token cursor-pointer"
                  >
                    <span className="font-mono text-[#1D4ED8] tracking-wider">Token / Bypass: {exam.exam_code}</span>
                    <Copy className="w-3 h-3 text-slate-400 group-hover/token:text-[#1D4ED8] group-hover/token:scale-105 transition-all" />
                  </button>
                  
                  <button 
                    onClick={() => deleteExam(exam.id)}
                    title="Hapus Ujian"
                    className="p-2 rounded-full border border-red-100 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 hover:border-red-200 transition-all cursor-pointer flex items-center justify-center button-hover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Title & Duration/Questions */}
                <h3 className="text-xl font-bold text-[#1D4ED8] mb-2 group-hover:text-blue-900 transition-colors line-clamp-2 leading-tight min-h-[3.5rem] flex items-center">{exam.title}</h3>
                
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-6">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-150">
                    <Clock className="w-3.5 h-3.5 text-[#1D4ED8]/60" />
                    <span>{exam.duration} Menit</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-150">
                    <FileText className="w-3.5 h-3.5 text-[#1D4ED8]/60" />
                    <span>{exam.total_questions} Soal</span>
                  </div>
                </div>

                {/* Exam Settings Toggles (Icon + Premium Tooltip) */}
                <div className="flex items-center justify-between bg-slate-50/70 border border-slate-100 rounded-2xl p-2.5 mb-6">
                  {/* Strict Mode (Anti-Curang) */}
                  <div className="relative flex-1 flex justify-center">
                    <button 
                      onMouseEnter={() => setActiveTooltip({ examId: exam.id, type: 'strict' })}
                      onMouseLeave={() => setActiveTooltip(null)}
                      onClick={() => toggleStrictMode(exam.id, exam.strict_mode ?? true)}
                      className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer",
                        exam.strict_mode !== false 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100" 
                          : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      {exam.strict_mode !== false ? (
                        <Shield className="w-4.5 h-4.5 shrink-0" />
                      ) : (
                        <ShieldOff className="w-4.5 h-4.5 shrink-0" />
                      )}
                    </button>
                    <div className={cn(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#3B66F5] text-white text-[10px] font-bold rounded-xl transition-all duration-200 shadow-xl whitespace-nowrap z-50 pointer-events-none",
                      activeTooltip?.examId === exam.id && activeTooltip?.type === 'strict'
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-1 scale-95"
                    )}>
                      {exam.strict_mode !== false ? "Proteksi Ketat: Aktif" : "Proteksi: Standar"}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-indigo-950" />
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
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100" 
                          : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      <Shuffle className={cn("w-4.5 h-4.5 shrink-0 transition-transform", exam.random_answer && "rotate-180")} />
                    </button>
                    <div className={cn(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#3B66F5] text-white text-[10px] font-bold rounded-xl transition-all duration-200 shadow-xl whitespace-nowrap z-50 pointer-events-none",
                      activeTooltip?.examId === exam.id && activeTooltip?.type === 'random'
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-1 scale-95"
                    )}>
                      {exam.random_answer ? "Acak Jawaban: Aktif" : "Urutan Tetap"}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-indigo-950" />
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
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100" 
                          : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      {exam.show_score ? (
                        <Eye className="w-4.5 h-4.5 shrink-0" />
                      ) : (
                        <EyeOff className="w-4.5 h-4.5 shrink-0" />
                      )}
                    </button>
                    <div className={cn(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#3B66F5] text-white text-[10px] font-bold rounded-xl transition-all duration-200 shadow-xl whitespace-nowrap z-50 pointer-events-none",
                      activeTooltip?.examId === exam.id && activeTooltip?.type === 'score'
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-1 scale-95"
                    )}>
                      {exam.show_score ? "Tampilkan Nilai: Aktif" : "Sembunyikan Nilai"}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-indigo-950" />
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
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100" 
                          : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      {exam.offline_mode ? (
                        <WifiOff className="w-4.5 h-4.5 shrink-0" />
                      ) : (
                        <Wifi className="w-4.5 h-4.5 shrink-0" />
                      )}
                    </button>
                    <div className={cn(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#3B66F5] text-white text-[10px] font-bold rounded-xl transition-all duration-200 shadow-xl whitespace-nowrap z-50 pointer-events-none",
                      activeTooltip?.examId === exam.id && activeTooltip?.type === 'offline'
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-1 scale-95"
                    )}>
                      {exam.offline_mode ? "Mode Offline: Aktif" : "Mode Online (Realtime)"}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-indigo-950" />
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
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100" 
                          : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                      )}
                    >
                      <QrCode className="w-4.5 h-4.5 shrink-0" />
                    </button>
                    <div className={cn(
                      "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#3B66F5] text-white text-[10px] font-bold rounded-xl transition-all duration-200 shadow-xl whitespace-nowrap z-50 pointer-events-none",
                      activeTooltip?.examId === exam.id && activeTooltip?.type === 'qr'
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-1 scale-95"
                    )}>
                      {exam.qr_submission ? "Mode QR Code: Aktif" : "Mode Biasa"}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-indigo-950" />
                    </div>
                  </div>
                </div>

                {/* Status & Participants */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col gap-1.5 items-start">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Status Sesi</p>
                    <button 
                      onClick={() => toggleIsActive(exam.id, exam.is_active)} 
                      title={exam.is_active ? "Klik untuk menonaktifkan" : "Klik untuk mengaktifkan"}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer bg-white shadow-sm hover:shadow", 
                        exam.is_active 
                          ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50" 
                          : "text-slate-500 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full", exam.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                      {exam.is_active ? 'Sedang Aktif' : 'Nonaktif'}
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-0.5">Peserta</p>
                    <div className="flex items-center gap-2 h-[34px]">
                      <div className="flex -space-x-1.5">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-5.5 h-5.5 rounded-full border border-white bg-slate-200 shadow-sm" />
                        ))}
                      </div>
                      <span className="font-bold text-slate-700 text-xs">+{exam.participants?.[0]?.count || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions: Monitor & Analisis */}
              <div className="p-5 bg-slate-50/50 border-t border-slate-100 mt-auto flex flex-col gap-2.5 rounded-b-[2.5rem]">
                {exam.qr_submission ? (
                  <button 
                    onClick={() => navigate(`/scan-ujian/${exam.id}`)}
                    className="w-full bg-emerald-50/70 border border-emerald-100 text-emerald-600 py-3 rounded-full font-bold text-xs hover:bg-emerald-100 hover:text-emerald-700 transition-all shadow-sm flex items-center justify-center gap-2 button-hover cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 shrink-0" />
                    <span>Pindai QR</span>
                  </button>
                ) : (
                  !exam.offline_mode && (
                    <button 
                      onClick={() => navigate(`/monitor-ujian/${exam.id}`)}
                      className="w-full bg-[#3B66F5]/5/70 border border-[#3B66F5]/20 text-[#3B66F5] py-3 rounded-full font-bold text-xs hover:bg-[#3B66F5]/10 hover:text-blue-700 transition-all shadow-sm flex items-center justify-center gap-2 button-hover cursor-pointer"
                    >
                      <Activity className="w-4 h-4 shrink-0" />
                      <span>Live Monitor</span>
                    </button>
                  )
                )}
                <button 
                  onClick={() => navigate('/hasil-ujian', { state: { examId: exam.id } })}
                  className="w-full bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white py-3 rounded-full font-bold text-xs hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2 group/btn button-hover cursor-pointer border border-white/10"
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>Analisis & Nilai</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform shrink-0" />
                </button>
              </div>
            </motion.div>
          ))
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowActivateModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#1D4ED8]">Aktifkan Ujian</h3>
                <button 
                  onClick={() => setShowActivateModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              
              <p className="text-slate-500 font-medium mb-6">
                {selectedExam?.title}
              </p>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-3 block">Pilih Kelas (bisa pilih banyak)</label>
                  <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <label className="flex items-center gap-3 p-3 rounded-full bg-[#3B66F5]/5 cursor-pointer border border-[#3B66F5]/30">
                      <input 
                        type="checkbox"
                        checked={selectedClasses.length === classes.length && classes.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClasses(classes.map(c => c.id));
                          } else {
                            setSelectedClasses([]);
                          }
                        }}
                        className="w-5 h-5 rounded border-slate-300 text-[#3B66F5] focus:ring-blue-500"
                      />
                      <span className="font-bold text-blue-700">Pilih Semua Kelas</span>
                    </label>
                    {classes.map(cls => (
                      <label 
                        key={cls.id} 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white cursor-pointer transition-colors"
                      >
                        <input 
                          type="checkbox"
                          checked={selectedClasses.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClasses([...selectedClasses, cls.id]);
                            } else {
                              setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                            }
                          }}
                          className="w-5 h-5 rounded border-slate-300 text-[#3B66F5] focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-700">{cls.name}</span>
                      </label>
                    ))}
                  </div>
                  {selectedClasses.length > 0 && (
                    <p className="text-xs text-[#3B66F5] mt-2 font-medium">
                      {selectedClasses.length} kelas dipilih
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowActivateModal(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleActivateExam}
                  disabled={selectedClasses.length === 0 || activating}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#685ECC] via-[#5C53D4] to-[#4F46E5] shadow-lg shadow-[#5C53D4]/25 hover:scale-[1.02] border border-white/10 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {activating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Aktifkan
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
