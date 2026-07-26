import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  GraduationCap,
  Clock,
  Calendar,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  PartyPopper,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import ModernLoader from '../../components/ModernLoader';

export default function StudentResult() {
  const { participantId } = useParams();
  const [participant, setParticipant] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    fetchResult();
  }, [participantId]);

  const isQRMode = participant?.is_qr || exam?.qr_submission;

  const fetchResult = async () => {
    try {
      // 1. Try to load from localStorage cache first (especially for QR mode / offline fallback)
      const offlineCached = localStorage.getItem(`offline_result_${participantId}`);
      if (offlineCached) {
        try {
          const parsed = JSON.parse(offlineCached);
          setParticipant(parsed.participant);
          setExam(parsed.exam);
          if (parsed.qrDataUrl) {
            setQrDataUrl(parsed.qrDataUrl);
          }
          setLoading(false);
          return;
        } catch (e) {
          console.warn('Failed parsing cached offline result, checking db:', e);
        }
      }

      // 2. Fallback to Supabase database (normal online mode)
      const { data: pData } = await supabase
        .from('participants')
        .select('*, exams(*)')
        .eq('id', participantId)
        .maybeSingle();

      if (pData) {
        // Security check: If student session exists, ensure the participant name matches the logged-in student name
        const studentSessionStr = localStorage.getItem('student_session');
        if (studentSessionStr) {
          const student = JSON.parse(studentSessionStr);
          if (student.name && pData.name && student.name.trim().toLowerCase() !== pData.name.trim().toLowerCase()) {
            setParticipant(null);
            setLoading(false);
            return;
          }
        }
        setParticipant(pData);
        setExam(pData.exams);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ModernLoader />;

  if (!participant) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100 mb-8">
        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
      </div>
      <h1 className="text-3xl font-black text-[#1D4ED8] tracking-tight">Hasil Tidak Ditemukan</h1>
      <p className="text-slate-500 font-medium mt-2 max-w-xs mx-auto">Maaf, kami tidak dapat menemukan data hasil ujian untuk ID ini.</p>
      <Link to="/exam" className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white px-10 py-4 rounded-full font-black hover:brightness-110 transition-all border border-white/10 shadow-xl shadow-[#3B66F5]/25">
        Kembali ke Beranda
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );

  const isPassed = participant.score >= 75;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 py-16 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-[#1D4ED8]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] bg-[#3B66F5]/50/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-3xl bg-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative z-10"
      >
        <div className={cn(
          "h-3 sm:h-4 bg-gradient-to-r",
          isPassed ? "from-emerald-400 via-blue-500 to-indigo-600" : "from-amber-400 via-orange-500 to-red-600"
        )} />
        
        <div className="p-8 sm:p-20 text-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className={cn(
              "w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-[2.5rem] mx-auto mb-6 sm:mb-10 flex items-center justify-center shadow-2xl relative",
              isPassed ? "bg-emerald-50 text-emerald-500 shadow-emerald-100" : "bg-amber-50 text-amber-500 shadow-amber-100"
            )}
          >
            {isPassed ? <PartyPopper className="w-10 h-10 sm:w-16 sm:h-16" /> : <AlertTriangle className="w-10 h-10 sm:w-16 sm:h-16" />}
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#3B66F5] animate-pulse" />
            </div>
          </motion.div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#1D4ED8] tracking-tight mb-2 sm:mb-3">Ujian Selesai!</h1>
          <p className="text-slate-500 text-xs sm:text-base font-medium mb-8 sm:mb-12 max-w-md mx-auto px-4">
            {isQRMode 
              ? "Tunjukkan QR Code di bawah ini ke guru/pengawas Anda untuk memindai dan merekap hasil pengerjaan Anda."
              : "Terima kasih telah berpartisipasi. Hasil pengerjaan Anda telah terekam secara permanen di sistem kami."}
          </p>

          <div className="bg-slate-50 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 mb-8 sm:mb-12 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 border border-slate-100 text-left sm:text-center">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Peserta Ujian</p>
              <p className="text-xl sm:text-2xl font-black text-[#1D4ED8] truncate">{participant.name}</p>
              <div className="flex items-center gap-2 text-slate-500 font-bold text-xs sm:text-base">
                <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {participant.class}
              </div>
            </div>
            <div className="sm:text-right space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mata Pelajaran</p>
              <p className="text-xl sm:text-2xl font-black text-[#1D4ED8] truncate">{exam.title}</p>
              <div className="flex items-center sm:justify-end gap-2 text-slate-500 font-bold text-xs sm:text-base">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Kode: {exam.exam_code}
              </div>
            </div>
          </div>

          {isQRMode ? (
            <div className="bg-[#3B66F5]/5 p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border border-[#3B66F5]/20/70 mb-8 sm:mb-12 flex flex-col items-center">
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-[#3B66F5]/20/50 mb-6 flex items-center justify-center">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code Hasil Ujian" className="w-56 h-56 sm:w-72 sm:h-72 object-contain" />
                ) : (
                  <div className="w-56 h-56 sm:w-72 sm:h-72 flex flex-col items-center justify-center gap-3">
                    <QrCode className="w-12 h-12 text-[#3B66F5]/70" />
                    <p className="text-xs text-slate-400 font-medium">QR Code tidak tersedia</p>
                  </div>
                )}
              </div>
              
              {exam.show_score ? (
                <div className="text-center">
                  <p className="text-[10px] font-black text-[#3B66F5] uppercase tracking-[0.2em] mb-1">Skor Sementara Anda</p>
                  <p className="text-4xl sm:text-5xl font-black text-[#1D4ED8]">{Math.round(participant.score)} <span className="text-slate-300 text-xl font-black">/ 100</span></p>
                  <div className="mt-3 flex justify-center">
                    <span className={cn(
                      "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm",
                      isPassed ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                    )}>
                      {isPassed ? 'LULUS' : 'BELUM LULUS'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-xs font-bold text-[#3B66F5] uppercase tracking-widest flex items-center gap-1.5 justify-center">
                    <QrCode className="w-4 h-4 text-[#3B66F5]" />
                    Mode Pengumpulan QR Code Aktif
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="relative mb-8 sm:mb-16">
              <div className="relative z-10">
                {exam.show_score ? (
                  <>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 sm:mb-4">Skor Akhir Anda</p>
                    <div className="flex items-center justify-center gap-4 sm:gap-6">
                      <motion.span 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
                        className="text-7xl sm:text-[10rem] font-black leading-none tracking-tighter text-[#1D4ED8]"
                      >
                        {Math.round(participant.score)}
                      </motion.span>
                      <div className="text-left flex flex-col justify-center">
                        <p className="text-2xl sm:text-4xl font-black text-slate-200">/ 100</p>
                        <motion.div 
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4, duration: 0.3, ease: 'easeOut' }}
                          className={cn(
                            "mt-1 sm:mt-2 px-3 sm:px-5 py-1 sm:py-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] shadow-xl",
                            isPassed ? "bg-emerald-500 text-white shadow-emerald-200" : "bg-amber-500 text-white shadow-amber-200"
                          )}
                        >
                          {isPassed ? 'LULUS' : 'BELUM LULUS'}
                        </motion.div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-[#3B66F5]/10 p-8 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border border-[#3B66F5]/20 mt-6 sm:mt-10">
                    <ShieldCheck className="w-12 h-12 sm:w-16 sm:h-16 text-[#3B66F5] mx-auto mb-4 sm:mb-6" />
                    <h3 className="text-xl sm:text-2xl font-black text-[#1D4ED8] mb-2">Skor Disembunyikan</h3>
                    <p className="text-slate-500 font-medium text-sm sm:text-base">Sesuai kebijakan pengawas, skor untuk ujian ini tidak ditampilkan secara langsung.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-50 border border-slate-100 group hover:bg-white transition-all">
              <div className="bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-sm group-hover:shadow-md transition-all">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#3B66F5]" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</p>
                <p className="text-xs sm:text-sm font-black text-slate-700">{new Date(participant.end_time).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-slate-50 border border-slate-100 group hover:bg-white transition-all">
              <div className="bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-sm group-hover:shadow-md transition-all">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#3B66F5]" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Selesai</p>
                <p className="text-xs sm:text-sm font-black text-slate-700">{new Date(participant.end_time).toLocaleTimeString('id-ID', { timeStyle: 'short' })}</p>
              </div>
            </div>
          </div>

          <Link 
            to="/exam"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white px-10 sm:px-16 py-4 sm:py-6 rounded-full font-black text-base sm:text-lg hover:brightness-110 active:scale-[0.98] transition-all border border-white/10 shadow-2xl shadow-[#3B66F5]/25 group"
          >
            Keluar Halaman
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.div>
      
      <div className="mt-12 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 px-6 py-2 bg-white rounded-full shadow-sm border border-slate-100">
          {isQRMode ? (
            <>
              <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Menunggu Pemindaian Guru</p>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Tersimpan di Cloud</p>
            </>
          )}
        </div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] opacity-50">
          EduTest &copy; 2026 • Professional Online Examination System
        </p>
      </div>
    </div>
  );
}
