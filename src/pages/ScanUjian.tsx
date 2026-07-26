import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  ChevronLeft, 
  Clock, 
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  QrCode,
  UserCheck,
  UserX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Html5Qrcode } from 'html5-qrcode';

export default function ScanUjian() {
  useDocumentTitle('Pindai Hasil Ujian');
  const { examId } = useParams();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  
  // Scanner States
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [scanSuccessInfo, setScanSuccessInfo] = useState<any>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  
  const isProcessingRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Fetch initial sessions
  useEffect(() => {
    if (!examId) return;
    fetchSessions();
  }, [examId]);

  // Fetch details when selectedSession changes
  useEffect(() => {
    if (!selectedSession || !examId) return;
    fetchExamAndParticipants();
  }, [selectedSession, examId]);

  const fetchSessions = async () => {
    if (!examId) return;
    const { data } = await supabase
      .from('exam_sessions')
      .select('id, class_name, class_id, started_at, is_active, expected_students')
      .eq('exam_id', examId)
      .order('started_at', { ascending: false });
    
    setSessions(data || []);
    
    if (data && data.length > 0 && !selectedSession) {
      setSelectedSession(data[0].id);
    }
  };

  const fetchClassStudents = async (classId: string) => {
    if (!classId) return;
    const { data } = await supabase
      .from('students')
      .select('id, name, class_id')
      .eq('class_id', classId)
      .order('name', { ascending: true });
    setClassStudents(data || []);
  };

  const fetchExamAndParticipants = async (showLoading = true) => {
    if (!examId || !selectedSession) return;
    
    if (showLoading) setLoading(true);
    try {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*, exam_questions(questions(*, question_options(*)))')
        .eq('id', examId)
        .maybeSingle();
        
      if (examError || !examData) {
        navigate('/daftar-ujian');
        return;
      }
      setExam(examData);

      if (examData.exam_questions) {
        const flatQuestions = examData.exam_questions
          .map((eq: any) => eq.questions)
          .filter(Boolean);
        setExamQuestions(flatQuestions);
      }

      // Fetch class students
      const currentSession = sessions.find(s => s.id === selectedSession);
      if (currentSession?.class_id) {
        await fetchClassStudents(currentSession.class_id);
      }

      // Fetch participants who already have entries in the database for this session and have status = completed (scanned)
      const { data: participantsData } = await supabase
        .from('participants')
        .select('*, exam_sessions(class_name)')
        .eq('exam_id', examId)
        .eq('session_id', selectedSession)
        .eq('status', 'completed')
        .order('name', { ascending: true });
        
      setAllParticipants(participantsData || []);
    } catch (err) {
      console.error('Error fetching scanner data:', err);
    } finally {
      setLoading(false);
    }
  };

  const processScannedData = useCallback(async (scannedText: string, questionsList: any[]) => {
    const parts = scannedText.split('#');
    if (parts.length < 4 || parts[0] !== 'EDUTEST') {
      throw new Error('Format QR Code tidak valid atau bukan dari EduTest.');
    }

    const pId = parts[1];
    const score = parseFloat(parts[2]);
    const answersStr = parts[3];

    // Check if participant already exists in the database
    let { data: dbPart, error: pError } = await supabase
      .from('participants')
      .select('id, name, session_id')
      .eq('id', pId)
      .maybeSingle();

    if (pError) {
      throw new Error('Gagal memeriksa data peserta di database.');
    }

    // If participant does not exist in DB (because they started offline and never registered on the cloud)
    // we will look up their name from the class students list or create one.
    if (!dbPart) {
      // Decode student information from cache/cookie if possible or check students table
      // In EduTest, the student code yields a name. Let's try to search the cached class students list.
      const localResult = localStorage.getItem(`offline_result_${pId}`);
      let participantName = 'Siswa Offline';
      
      if (localResult) {
        try {
          const parsed = JSON.parse(localResult);
          participantName = parsed.participant?.name || participantName;
        } catch (e) {
          console.warn('Failed parsing offline result details:', e);
        }
      }

      // Insert new participant record
      const { data: newPart, error: createError } = await supabase
        .from('participants')
        .insert([{
          id: pId,
          exam_id: examId,
          session_id: selectedSession,
          name: participantName,
          class: sessions.find(s => s.id === selectedSession)?.class_name || '',
          start_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // fallback: 30 minutes ago
          status: 'completed',
          is_locked: false,
          violations: 0,
          score: Math.round(score * 100) / 100,
          end_time: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        throw new Error('Gagal meregistrasi peserta offline: ' + createError.message);
      }
      dbPart = newPart;
    }

    // Sort questions alphabetically by ID (matching student side encoding)
    const sortedQuestions = [...questionsList].sort((a, b) => a.id.localeCompare(b.id));
    const answerTokens = answersStr.split(',');

    if (answerTokens.length !== sortedQuestions.length) {
      throw new Error(`Kesesuaian data gagal: Jumlah soal dalam QR (${answerTokens.length}) tidak cocok dengan jumlah soal ujian (${sortedQuestions.length}).`);
    }

    const answersToInsert: any[] = [];

    for (let i = 0; i < sortedQuestions.length; i++) {
      const q = sortedQuestions[i];
      const token = answerTokens[i];

      if (token === '_') {
        continue; // Unanswered
      }

      if (q.question_type === 'pilihan_ganda') {
        const sortedOptions = [...(q.question_options || [])].sort((a, b) => a.id.localeCompare(b.id));
        const optIndex = parseInt(token, 10);
        
        if (isNaN(optIndex) || optIndex < 0 || optIndex >= sortedOptions.length) {
          continue;
        }
        
        const selectedOption = sortedOptions[optIndex];
        const correctAnswerText = q._original_correct_answer_text || q.correct_answer;
        const isCorrect = (selectedOption.option_text || '').trim().toLowerCase() === (correctAnswerText || '').trim().toLowerCase();

        answersToInsert.push({
          participant_id: pId,
          question_id: q.id,
          option_id: selectedOption.id,
          answer_text: null,
          is_correct: isCorrect
        });
      } else {
        try {
          const rawBase64 = token.replace(/%2C/g, ',').replace(/%23/g, '#');
          const decodedText = decodeURIComponent(escape(atob(rawBase64)));
          const correctAnswerText = q._original_correct_answer_text || q.correct_answer;
          const isCorrect = (decodedText || '').trim().toLowerCase() === (correctAnswerText || '').trim().toLowerCase();
          
          answersToInsert.push({
            participant_id: pId,
            question_id: q.id,
            option_id: null,
            answer_text: decodedText,
            is_correct: isCorrect
          });
        } catch (e) {
          console.warn('Failed to decode essay answer:', token, e);
        }
      }
    }

    // Remove old answers for this student
    const { error: deleteError } = await supabase
      .from('answers')
      .delete()
      .eq('participant_id', pId);

    if (deleteError) {
      throw new Error('Gagal menghapus jawaban lama: ' + deleteError.message);
    }

    // Insert new answers
    if (answersToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('answers')
        .insert(answersToInsert);
        
      if (insertError) {
        throw new Error('Gagal menyimpan rincian jawaban baru: ' + insertError.message);
      }
    }

    // Update participant status & score
    const { error: participantError } = await supabase
      .from('participants')
      .update({
        score: Math.round(score * 100) / 100,
        status: 'completed',
        end_time: new Date().toISOString(),
        is_locked: false
      })
      .eq('id', pId);

    if (participantError) {
      throw new Error('Gagal memperbarui status kelulusan peserta: ' + participantError.message);
    }

    return dbPart.name;
  }, [examId, selectedSession, sessions]);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessingScan(true);
    setScannerError(null);
    setScanSuccessInfo(null);
    
    try {
      console.log('Successfully scanned QR content:', decodedText);
      const studentName = await processScannedData(decodedText, examQuestions);
      const parts = decodedText.split('#');
      const scoreValue = parts[2];
      
      setScanSuccessInfo({
        name: studentName,
        score: scoreValue
      });
      setScannedCount(prev => prev + 1);
      
      setTimeout(() => {
        setScanSuccessInfo(null);
      }, 3000);
      
      // Refresh list silently
      await fetchExamAndParticipants(false);
    } catch (err: any) {
      console.error('Scan success handler error:', err);
      setScannerError(err.message || 'Gagal memproses QR Code hasil ujian.');
    } finally {
      setIsProcessingScan(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 2500);
    }
  }, [examQuestions, processScannedData]);

  // Start Camera
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    
    if (isCameraActive && !loading) {
      const timer = setTimeout(() => {
        const element = document.getElementById("reader-main");
        if (!element) return;
        
        html5QrCode = new Html5Qrcode("reader-main");
        scannerRef.current = html5QrCode;
        
        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // normal frame error
          }
        ).catch(err => {
          console.error("Scanner failed to start camera:", err);
          setScannerError("Gagal mengakses kamera belakang. Silakan berikan izin akses kamera.");
        });
      }, 500);
      
      return () => {
        clearTimeout(timer);
        if (html5QrCode) {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
              html5QrCode = null;
            }).catch(e => console.error("Error stopping scanner on unmount:", e));
          } else {
            html5QrCode = null;
          }
        }
      };
    }
  }, [isCameraActive, loading, handleScanSuccess]);

  // Memoize filtered students
  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const participantNames = new Set(allParticipants.map(p => p.name.toLowerCase()));
    
    // Combine students who scanned with class list
    const list: any[] = [
      ...allParticipants.map(p => ({
        ...p,
        hasScanned: true
      })),
      ...classStudents
        .filter(cs => !participantNames.has(cs.name.toLowerCase()))
        .map(cs => ({
          id: cs.id,
          name: cs.name,
          hasScanned: false,
          score: null,
          end_time: null
        }))
    ];
    
    return list.filter(s => (s.name || '').toLowerCase().includes(term));
  }, [allParticipants, classStudents, searchTerm]);

  // Scan status stats
  const { totalClassCount, scannedClassCount, pendingClassCount } = useMemo(() => {
    const total = classStudents.length;
    const scanned = allParticipants.length;
    return {
      totalClassCount: Math.max(total, scanned),
      scannedClassCount: scanned,
      pendingClassCount: Math.max(0, Math.max(total, scanned) - scanned)
    };
  }, [classStudents, allParticipants]);

  if (loading) return (
    <div className="min-h-screen pt-20 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-[#3B66F5]" />
      <p className="text-slate-500 font-medium">Memuat data pemindaian...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/daftar-ujian')}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-[#1D4ED8] hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-[#1D4ED8] tracking-tight flex items-center gap-3">
              Pindai Hasil QR
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </h2>
            <p className="text-slate-500 text-sm font-medium">{exam?.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {sessions.length > 0 && (
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[#1D4ED8] text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.class_name}</option>
              ))}
            </select>
          )}
          <button 
            onClick={() => fetchExamAndParticipants(true)}
            className="bg-white text-[#1D4ED8] border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Camera Scanner */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex flex-col items-center">
          <div className="text-center mb-6">
            <h3 className="text-xl font-black text-[#1D4ED8] tracking-tight flex items-center justify-center gap-2">
              <QrCode className="w-6 h-6 text-[#3B66F5] animate-pulse" />
              Kamera Pemindai
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Arahkan kamera ke QR Code di layar penyelesaian ujian siswa.
            </p>
          </div>

          {/* Camera View Area */}
          <div className="relative aspect-square w-full max-w-[340px] mx-auto rounded-[2rem] overflow-hidden bg-slate-900 border-4 border-indigo-50 shadow-inner mb-6 flex items-center justify-center">
            {isCameraActive ? (
              <div id="reader-main" className="w-full h-full object-cover"></div>
            ) : (
              <div className="text-slate-400 text-sm font-bold flex flex-col items-center gap-2">
                <QrCode className="w-12 h-12 text-slate-500" />
                <span>Kamera Dinonaktifkan</span>
              </div>
            )}
            
            {/* Visual Guide Box */}
            {isCameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-[#3B66F5]/20 rounded-2xl relative">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-500 rounded-tl-md"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-500 rounded-tr-md"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-500 rounded-bl-md"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-md"></div>
                  {/* Laser Beam */}
                   <style>{`
                    #reader-main {
                      width: 100% !important;
                      height: 100% !important;
                      border-radius: 1.75rem !important;
                      overflow: hidden !important;
                    }
                    #reader-main video {
                      width: 100% !important;
                      height: 100% !important;
                      object-fit: cover !important;
                      border-radius: 1.75rem !important;
                    }
                    @keyframes laser-sweep {
                      0% { top: 0%; }
                      50% { top: 100%; }
                      100% { top: 0%; }
                    }
                    .animate-laser {
                      animation: laser-sweep 2.5s infinite linear;
                    }
                  `}</style>
                  <div className="w-full h-0.5 bg-[#3B66F5]/100 absolute top-0 animate-laser shadow-md shadow-indigo-500/50"></div>
                </div>
              </div>
            )}

            {/* Loading/Processing Overlay */}
            {isProcessingScan && (
              <div className="absolute inset-0 bg-[#1D4ED8]/70 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#3B66F5]" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Merekam Hasil...</span>
              </div>
            )}
          </div>

          {/* Toggle Camera Button */}
          <button
            onClick={() => setIsCameraActive(!isCameraActive)}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm",
              isCameraActive 
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                : "bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white hover:brightness-110 border border-white/10"
            )}
          >
            {isCameraActive ? 'Matikan Kamera' : 'Aktifkan Kamera'}
          </button>

          {/* Success Scan Overlay Notification inside column */}
          <AnimatePresence>
            {scanSuccessInfo && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mt-6 flex items-center gap-3 text-left"
              >
                <div className="bg-emerald-500 text-white p-2 rounded-xl shrink-0">
                  <CheckCircle2 className="w-5 h-5 animate-bounce" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Berhasil Disimpan</p>
                  <h4 className="font-bold text-slate-800 text-sm truncate leading-tight">{scanSuccessInfo.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Nilai: <span className="font-black text-slate-800">{scanSuccessInfo.score}</span> / 100</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scanner Error */}
          {scannerError && (
            <div className="w-full bg-rose-50 border border-rose-100 rounded-2xl p-4 mt-6 text-left flex items-start gap-2.5 text-xs font-bold text-rose-600">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{scannerError}</span>
            </div>
          )}
        </div>

        {/* Right Column: Scan Stats and Student List */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6 flex flex-col">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50 text-center">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Siswa</p>
              <p className="text-2xl font-black text-[#1D4ED8] mt-1">{totalClassCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Telah Dipindai</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{scannedClassCount}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Belum Dipindai</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{pendingClassCount}</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-[#3B66F5] transition-colors" />
            <input 
              type="text" 
              placeholder="Cari nama siswa..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Student Grid / List */}
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            <AnimatePresence>
              {filteredStudents.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border transition-all shadow-sm",
                    s.hasScanned 
                      ? "bg-emerald-50/30 border-emerald-100" 
                      : "bg-white border-slate-100 hover:border-slate-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-xl text-white shadow-sm",
                      s.hasScanned ? "bg-emerald-500" : "bg-slate-100 text-slate-400"
                    )}>
                      {s.hasScanned ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {s.hasScanned ? `Selesai: ${new Date(s.end_time).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}` : 'Belum mengumpulkan'}
                      </p>
                    </div>
                  </div>

                  {s.hasScanned ? (
                    <span className="bg-emerald-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-sm">
                      {Math.round(s.score)}
                    </span>
                  ) : (
                    <span className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-xl border border-slate-200/40">
                      Belum Pindai
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Siswa tidak ditemukan</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
