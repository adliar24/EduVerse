import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight, AlertCircle, Loader2, Key, ChevronLeft, BookOpen, Clock, ShieldCheck, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { cn } from '../../lib/utils';

export default function StudentJoin({ isDashboardView = false }: { isDashboardView?: boolean }) {
  const navigate = useNavigate();
  const [studentCode, setStudentCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  React.useEffect(() => {
    const sessionStr = localStorage.getItem('student_session');
    if (sessionStr) {
      const sess = JSON.parse(sessionStr);
      if (sess.student_code) {
        setStudentCode(sess.student_code);
        autoCheckStudentCode(sess.student_code);
      }
    }
  }, []);

  const autoCheckStudentCode = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*, classes!students_class_id_fkey(name)')
        .ilike('student_code', code.trim())
        .maybeSingle();

      if (studentError || !student) {
        setLoading(false);
        return;
      }
      setStudentInfo(student);

      const { data: sessions, error: sessionsError } = await supabase
        .from('exam_sessions')
        .select('*, exams(title, exam_code, duration, total_questions, strict_limit), classes(name)')
        .eq('is_active', true)
        .eq('class_id', student.class_id);

      if (sessionsError) {
        setLoading(false);
        return;
      }

      const processedSessions = (sessions || []).map((s: any) => ({
        ...s,
        class_name: s.classes?.name || 'Unknown'
      }));
      setActiveSessions(processedSessions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStudentCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentCode.length < 6) {
      setError('Kode unik minimal 6 karakter.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Fetch student data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*, classes!students_class_id_fkey(name)')
        .ilike('student_code', studentCode.trim())
        .maybeSingle();

      if (studentError) {
        console.error('Student fetch error:', studentError);
        setError('Terjadi kesalahan sistem. Silakan coba lagi nanti.');
        setStudentInfo(null);
        setLoading(false);
        return;
      }

      if (!student) {
        setError('Kode unik tidak ditemukan. Pastikan kode yang Anda masukkan benar.');
        setStudentInfo(null);
        setLoading(false);
        return;
      }

      setStudentInfo(student);

      // Fetch active exam sessions for this student's class
      const { data: sessions, error: sessionsError } = await supabase
        .from('exam_sessions')
        .select('*, exams(title, exam_code, duration, total_questions, strict_limit), classes(name)')
        .eq('is_active', true)
        .eq('class_id', student.class_id);

      if (sessionsError) {
        console.error('Sessions fetch error:', sessionsError);
        setError('Terjadi kesalahan saat memuat sesi ujian. Silakan coba lagi.');
        setLoading(false);
        return;
      }

      // Add class name from the session
      const processedSessions = (sessions || []).map((s: any) => ({
        ...s,
        class_name: s.classes?.name || 'Unknown'
      }));

      setActiveSessions(processedSessions);
    } catch (err) {
      console.error('General error:', err);
      setError('Terjadi kesalahan sistem. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async (session: any) => {
    if (!studentInfo) return;

    setLoading(true);
    try {
      let participantId;

      const examId = session.exam_id;
      let examCode = session.exams?.exam_code;
      
      if (!examCode) {
        const { data: examData } = await supabase
          .from('exams')
          .select('exam_code')
          .eq('id', examId)
          .single();
        examCode = examData?.exam_code;
      }
      
      if (!examCode) {
        throw new Error('Kode ujian tidak ditemukan');
      }

      // Try to find existing participant for this session
      const { data: existingParticipants, error: fetchError } = await supabase
        .from('participants')
        .select('id, status, name, is_locked, violations, end_time')
        .eq('session_id', session.id);

      if (fetchError) throw fetchError;

      // Check for existing participant by name (case-insensitive, trimmed)
      const existingParticipant = existingParticipants?.find(
        (p: any) => p.name?.trim().toLowerCase() === studentInfo.name?.trim().toLowerCase()
      );

      // SECURITY GATEKEEPER: Check if participant is blocked or already submitted
      if (existingParticipant) {
        if (existingParticipant.status === 'completed' || existingParticipant.end_time) {
          setError('Akses ditolak. Anda sudah menyelesaikan ujian ini. Silakan hubungi Admin untuk reset akun.');
          setLoading(false);
          return;
        }
        if (existingParticipant.is_locked === true || existingParticipant.status === 'blocked' || existingParticipant.status === 'blocked_violation') {
          setError('Akses ditolak. Akun Anda terkunci karena pelanggaran atau gangguan teknis. Silakan hubungi Admin untuk reset akun.');
          setLoading(false);
          return;
        }
        const limit = session.exams?.strict_limit !== undefined ? session.exams.strict_limit : 3;
        if (limit > 0 && existingParticipant.violations >= limit) {
          setError(`Akses ditolak. Anda telah melanggar aturan ujian (membuka tab lain) ${limit} kali. Nilai Anda sudah 0. Silakan hubungi Admin.`);
          setLoading(false);
          return;
        }
        // Resume from last position (technical issue recovery)
        participantId = existingParticipant.id;
      } else {
        // Create new participant
        const { data: newParticipant, error: insertError } = await supabase
          .from('participants')
          .insert([{
            exam_id: examId,
            session_id: session.id,
            name: studentInfo.name,
            class: session.class_name,
            start_time: new Date().toISOString(),
            status: 'ongoing',
            is_locked: false,
            violations: 0,
            last_position: 0
          }])
          .select()
          .single();

        if (insertError) {
          throw new Error(`Gagal membuat peserta: ${insertError.message}`);
        }
        
        participantId = newParticipant?.id;
      }

      if (!participantId) {
        throw new Error('Gagal mendapatkan ID peserta ujian');
      }

      // Try to store in localStorage, also add URL fallback
      try {
        localStorage.setItem(`exam_session_${examCode}`, participantId);
      } catch (storageErr) {
        console.warn('LocalStorage unavailable, using URL fallback');
      }
      
      // Also pass participant ID via URL as backup
      navigate(`/exam/start/${examCode}?p=${participantId}`, { replace: true });
    } catch (err: any) {
      console.error('Error starting exam:', err);
      setError(err.message || 'Gagal mendaftarkan diri ke ujian. Silakan periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  if (isDashboardView) {
    if (loading) {
      return (
        <div className="space-y-8 pb-10 font-sans">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Ujian Aktif Saya</h2>
            <p className="text-slate-500 mt-1 font-medium">Lihat dan kerjakan ujian yang sedang aktif untuk kelas Anda.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-12 text-center max-w-4xl">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-slate-500 mt-2 font-medium">Memuat data sesi ujian Anda...</p>
          </div>
        </div>
      );
    }

    if (!studentInfo) {
      return (
        <div className="space-y-8 pb-10 font-sans">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Ujian Aktif Saya</h2>
            <p className="text-slate-500 mt-1 font-medium">Lihat dan kerjakan ujian yang sedang aktif untuk kelas Anda.</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-12 text-center max-w-4xl">
            <p className="text-rose-600 font-bold text-sm">Identitas siswa tidak ditemukan atau sesi telah berakhir.</p>
            <p className="text-xs text-slate-400 mt-1">Silakan lakukan login ulang untuk menyegarkan sesi Anda.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 pb-10 font-sans">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Ujian Aktif Saya</h2>
          <p className="text-slate-500 mt-1 font-medium">Lihat dan kerjakan ujian yang sedang aktif untuk kelas Anda.</p>
        </div>

        {/* Student Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 max-w-4xl">
          <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Identitas Siswa</p>
              <h3 className="text-2xl font-black text-slate-900 leading-tight">{studentInfo.name}</h3>
              <div className="flex items-center gap-2 mt-2 text-sm font-bold text-slate-600">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Kelas: {studentInfo.classes?.name || 'Tidak diketahui'}
              </div>
            </div>
            <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm">
              Kode: {studentInfo.student_code}
            </div>
          </div>

          <h4 className="text-base font-bold text-slate-900 mb-4 ml-1 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse" />
            Sesi Ujian Tersedia ({activeSessions.length})
          </h4>

          {activeSessions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-6 rounded-2xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">{session.exams?.title}</h4>
                    <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-500">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-600" /> {session.exams?.duration} Menit</span>
                      <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-emerald-600" /> {session.exams?.total_questions} Soal</span>
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-violet-600" /> {session.class_name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSession(session)}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 self-start sm:self-center cursor-pointer"
                  >
                    Kerjakan Ujian
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="bg-white w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <BookOpen className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-slate-600 font-bold text-sm">Tidak ada sesi ujian aktif saat ini.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Ujian akan muncul di sini secara otomatis ketika guru mengaktifkan sesi ujian untuk kelas Anda.</p>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {selectedSession && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setSelectedSession(null)}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-2xl overflow-hidden"
              >
                <div className="w-16 h-16 bg-[#3B66F5]/5 text-[#3B66F5] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#1D4ED8] text-center mb-2 tracking-tight">Konfirmasi Ujian</h3>
                <p className="text-center text-slate-500 font-medium mb-8">
                  Apakah Anda yakin ingin memulai ujian <span className="font-bold text-[#1D4ED8]">{selectedSession.exams?.title}</span> untuk kelas <span className="font-bold text-[#1D4ED8]">{selectedSession.class_name}</span> sekarang?
                </p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedSession(null)}
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-full font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Tidak
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        if (document.documentElement.requestFullscreen) {
                          await document.documentElement.requestFullscreen();
                        } else if ((document.documentElement as any).webkitRequestFullscreen) {
                          await (document.documentElement as any).webkitRequestFullscreen();
                        }
                      } catch (err) {
                        console.warn('Failed to enter fullscreen:', err);
                      }
                      handleStartExam(selectedSession);
                    }}
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-full font-bold text-white bg-gradient-to-r from-[#685ECC] via-[#5C53D4] to-[#4F46E5] shadow-lg shadow-[#5C53D4]/25 hover:scale-[1.02] border border-white/10 transition-all flex items-center justify-center"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ya, Mulai'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-[#3B66F5]/50/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-[#1D4ED8]/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-10 relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="bg-[#1D4ED8] w-20 h-20 rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-2xl shadow-indigo-900/20 border border-white/10"
          >
            <GraduationCap className="w-10 h-10" />
          </motion.div>
          <h1 className="text-4xl font-black text-[#1D4ED8] tracking-tight leading-none">Edu<span className="text-[#3B66F5]">Test</span></h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-3">Portal Siswa • Pemanasan Ujian</p>
        </div>

        <AnimatePresence mode="wait">
          {!studentInfo ? (
            <motion.form 
              key="join-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleCheckStudentCode}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Kode Unik Siswa</label>
                <div className="relative group">
                  <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-[#3B66F5] transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Contoh: A1B2C3"
                    className="w-full pl-12 pr-5 py-4 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 text-xl font-black tracking-widest uppercase transition-all placeholder:text-slate-300 placeholder:font-bold placeholder:text-sm placeholder:tracking-normal"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-start gap-3 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold leading-relaxed">{error}</p>
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={loading || !studentCode}
                className="w-full bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white py-4 rounded-full font-black text-lg hover:brightness-110 active:scale-[0.98] transition-all border border-white/10 shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-3 group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    Cek Kode Unik
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="exam-list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="p-5 bg-[#3B66F5]/5 rounded-xl border border-[#3B66F5]/20 relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-xs font-bold text-[#3B66F5] uppercase tracking-widest mb-1">Identitas Siswa</p>
                  <h3 className="text-xl font-black text-[#1D4ED8] leading-tight">{studentInfo.name}</h3>
                  <div className="flex items-center gap-2 mt-2 text-sm font-bold text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-[#3B66F5]" />
                    Kelas: {studentInfo.classes?.name || 'Tidak diketahui'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-700 ml-1">Sesi Ujian Tersedia</h4>
                
                {activeSessions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {activeSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        disabled={loading}
                        className="text-left w-full p-4 rounded-full border-2 border-slate-100 bg-white hover:border-blue-500 hover:bg-[#3B66F5]/5/50 transition-all flex flex-col group disabled:opacity-50"
                      >
                        <span className="font-bold text-lg text-[#1D4ED8] group-hover:text-blue-700 transition-colors">{session.exams?.title}</span>
                        <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-500">
                          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {session.exams?.duration} Min</span>
                          <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {session.exams?.total_questions} Soal</span>
                          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {session.class_name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Saat ini tidak ada sesi ujian yang terbuka untuk kelas Anda.</p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button 
                  type="button"
                  onClick={() => setStudentInfo(null)}
                  className="w-full px-6 py-4 rounded-full font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Ganti Kode Unik
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!studentInfo && (
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Anda seorang guru?{' '}
              <button 
                onClick={() => navigate('/login')}
                className="text-[#1D4ED8] font-black hover:underline ml-1"
              >
                Masuk ke Dashboard
              </button>
            </p>
          </div>
        )}
      </motion.div>
      
      {/* Confirmation Modal */}
      <AnimatePresence>
        {selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedSession(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="w-16 h-16 bg-[#3B66F5]/5 text-[#3B66F5] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#1D4ED8] text-center mb-2 tracking-tight">Konfirmasi Ujian</h3>
              <p className="text-center text-slate-500 font-medium mb-8">
                Apakah Anda yakin ingin memulai ujian <span className="font-bold text-[#1D4ED8]">{selectedSession.exams?.title}</span> untuk kelas <span className="font-bold text-[#1D4ED8]">{selectedSession.class_name}</span> sekarang?
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedSession(null)}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-full font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Tidak
                </button>
                <button 
                  onClick={async () => {
                    try {
                      if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen();
                      } else if ((document.documentElement as any).webkitRequestFullscreen) {
                        await (document.documentElement as any).webkitRequestFullscreen();
                      }
                    } catch (err) {
                      console.warn('Failed to enter fullscreen:', err);
                    }
                    handleStartExam(selectedSession);
                  }}
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-full font-bold text-white bg-gradient-to-r from-[#685ECC] via-[#5C53D4] to-[#4F46E5] shadow-lg shadow-[#5C53D4]/25 hover:scale-[1.02] border border-white/10 transition-all flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ya, Mulai'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <p className="mt-10 text-slate-400 text-xs font-bold uppercase tracking-widest opacity-50 relative z-0">
        EduTest &copy; 2026 • Professional Online Examination System
      </p>
    </div>
  );
}
