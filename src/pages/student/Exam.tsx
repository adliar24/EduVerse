import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, supabaseAnon } from '../../lib/supabase';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  LayoutGrid,
  Zap,
  WifiOff,
  Lock,
  Unlock,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import React from 'react';

// Timer Component Isolated to prevent parent re-renders every 1 second
const ExamTimer = React.memo(({ endTime, onTimeUp }: { endTime: number, onTimeUp: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, Math.floor((endTime - Date.now()) / 1000)));

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime, onTimeUp]); // eslint-disable-line react-hooks/exhaustive-deps

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  const formatted = `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <p className={cn(
      "text-2xl font-black font-mono tracking-tight",
      timeLeft < 300 ? "text-red-400 animate-pulse" : "text-white"
    )}>
      {formatted}
    </p>
  );
});

const isIOSDevice = typeof navigator !== 'undefined' && (
  /iPad|iPhone|iPod/.test(navigator.userAgent) || 
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
);

const isFullscreenSupported = typeof document !== 'undefined' && !!(
  document.documentElement.requestFullscreen ||
  (document.documentElement as any).webkitRequestFullscreen ||
  (document.documentElement as any).mozRequestFullScreen ||
  (document.documentElement as any).msRequestFullscreen
);

export default function StudentExam() {
  const { examCode } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lastSavedAnswers, setLastSavedAnswers] = useState<Record<string, string>>({});
  const [examEndTime, setExamEndTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPermanentlyBlocked, setIsPermanentlyBlocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [selectedMatchLeft, setSelectedMatchLeft] = useState<string | null>(null);
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [lastPosition, setLastPosition] = useState(0);
  const roomRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const lastSavedAnswersRef = useRef<Record<string, string>>({});

  // Exit fullscreen on component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      try {
        const doc = document as any;
        if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) {
          if (doc.exitFullscreen) {
            doc.exitFullscreen();
          } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen();
          } else if (doc.mozCancelFullScreen) {
            doc.mozCancelFullScreen();
          } else if (doc.msExitFullscreen) {
            doc.msExitFullscreen();
          }
        }
      } catch (err) {
        console.warn('Failed to exit fullscreen on unmount:', err);
      }
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    
    const initExam = async () => {
      let pId: string | null = null;
      
      // Try to get from localStorage first
      try {
        pId = localStorage.getItem(`exam_session_${examCode}`);
      } catch (storageErr) {
        console.warn('[Exam] localStorage unavailable:', storageErr);
      }
      
      // Fallback: try URL query parameter
      if (!pId) {
        const urlParams = new URLSearchParams(window.location.search);
        pId = urlParams.get('p');
      }
      
      console.log('[Exam] Initializing with examCode:', examCode, 'participantId:', pId);
      
      if (!pId) {
        console.log('[Exam] No participant ID found in localStorage, redirecting');
        if (isMountedRef.current) navigate('/exam', { replace: true });
        return;
      }
      
      if (!isMountedRef.current) return;
      
      setLoading(true);
      setInitError(null);
      setParticipantId(pId);
      
      try {
        await fetchExamData(pId);
      } catch (err) {
        console.error('[Exam] Initialization error:', err);
        if (isMountedRef.current) {
          setInitError('Gagal memuat ujian. Silakan coba lagi. Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
          setLoading(false);
        }
      }
    };
    
    initExam();
  }, [examCode]);

  // Helper function to process questions - ensures A,B,C,D,E order and randomize options
  const processQuestions = (questions: any[], randomAnswer: boolean) => {
    return questions
      .map((q: any) => {
        // Sort options to ensure A,B,C,D,E order first
        if (q.question_options) {
          const sortedOptions = [...q.question_options]
            .sort((a: any, b: any) => {
              const order = ['A', 'B', 'C', 'D', 'E'];
              const aIdx = order.indexOf(a.option_label?.toUpperCase());
              const bIdx = order.indexOf(b.option_label?.toUpperCase());
              return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
            })
            .slice(0, 5);
          
          // Store original correct answer text for grading if not already stored
          if (!q._original_correct_answer_text) {
            const originalCorrectOption = sortedOptions.find((opt: any) => 
              opt.option_label?.toUpperCase() === q.correct_answer?.toUpperCase()
            );
            q._original_correct_answer_text = originalCorrectOption?.option_text || '';
          }
          
          // If random answer is enabled, shuffle text, image, and ID but keep labels in A,B,C,D,E order
          if (randomAnswer && !q._is_randomized) {
            // Extract items and shuffle them
            const items = sortedOptions.map((opt: any) => ({ 
              text: opt.option_text, 
              id: opt.id,
              image_url: opt.image_url
            }));
            for (let i = items.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [items[i], items[j]] = [items[j], items[i]];
            }
            
            // Assign shuffled items to sorted options (keeping labels in order)
            sortedOptions.forEach((opt: any, idx: number) => {
              opt.option_text = items[idx].text;
              opt.id = items[idx].id;
              opt.image_url = items[idx].image_url;
            });
            
            q._is_randomized = true;
          }
        }
        
        return q;
      });
  };

  const fetchExamData = async (pId: string) => {
    if (!isMountedRef.current) return;
    
    try {
      console.log('[Exam] Fetching participant data...');
      
      let participant = null;
      try {
        const { data } = await supabaseAnon
          .from('participants')
          .select('*')
          .eq('id', pId)
          .maybeSingle();
        participant = data;
      } catch (err) {
        console.warn('[Exam] supabaseAnon fetch for participant failed, trying supabase:', err);
      }

      if (!participant) {
        try {
          const { data } = await supabase
            .from('participants')
            .select('*')
            .eq('id', pId)
            .maybeSingle();
          participant = data;
        } catch (err) {
          console.warn('[Exam] Database fetch for participant failed, checking cache:', err);
        }
      }

      if (!participant) {
        const cachedPart = localStorage.getItem(`participant_info_${pId}`);
        if (cachedPart) {
          participant = JSON.parse(cachedPart);
          console.log('[Exam] Loaded participant from cache:', participant);
        }
      } else {
        localStorage.setItem(`participant_info_${pId}`, JSON.stringify(participant));
      }

      if (!participant) {
        console.log('[Exam] Participant not found, redirecting');
        navigate('/exam', { replace: true });
        return;
      }

      if (participant.status === 'completed' || participant.end_time) {
        localStorage.removeItem(`exam_info_${pId}`);
        localStorage.removeItem(`exam_questions_${pId}`);
        // Conditionally clean up if strictly online
        if (!exam?.offline_mode) {
          localStorage.removeItem(`exam_answers_${pId}`);
        }
        navigate(`/exam/result/${pId}`, { replace: true });
        return;
      }

      // Check cache for questions
      const cachedQuestions = localStorage.getItem(`exam_questions_${pId}`);
      const cachedExam = localStorage.getItem(`exam_info_${pId}`);

      let examData;
      let qs;

      if (cachedQuestions && cachedExam) {
        examData = JSON.parse(cachedExam);
        qs = JSON.parse(cachedQuestions);
        // Always process cached questions to ensure A,B,C,D,E order
        qs = processQuestions(qs, examData.random_answer || false);
      } else {
        if (!isMountedRef.current) return;
        console.log('[Exam] No cache, fetching from database...');
        // Fetch Exam
        const { data: fetchedExamData, error: examError } = await supabase
          .from('exams')
          .select('*, exam_questions(questions(*, question_options(*)))')
          .eq('exam_code', examCode)
          .maybeSingle();
        
        if (!isMountedRef.current) return;
        
        if (examError) {
          console.error('[Exam] Exam fetch error:', examError);
          throw new Error('Gagal mengambil data ujian: ' + examError.message);
        }

        if (!fetchedExamData) throw new Error('Exam not found');
        examData = fetchedExamData;

        // Process Questions
        if (!examData.exam_questions || examData.exam_questions.length === 0) {
          throw new Error('Tidak ada soal dalam ujian ini. Hubungi guru Anda.');
        }

        qs = examData.exam_questions
          .filter((eq: any) => eq.questions)
          .map((eq: any) => eq.questions);
        
        qs = processQuestions(qs, examData.random_answer || false);
        
        // Deduplicate questions by ID to fix double options issue
        const seenQuestionIds = new Set<string>();
        qs = qs.filter((q: any) => {
          if (seenQuestionIds.has(q.id)) {
            console.warn('Duplicate question found:', q.id);
            return false;
          }
          seenQuestionIds.add(q.id);
          return true;
        });

        if (qs.length === 0) {
          throw new Error('Tidak ada soal valid dalam ujian ini. Hubungi guru Anda.');
        }

        if (examData.random_question) {
          qs = qs.sort(() => Math.random() - 0.5);
        }

        // Deep clone examData and update with processed questions for cache
        const examDataForCache = JSON.parse(JSON.stringify(examData));
        examDataForCache.exam_questions = qs.map((q: any) => ({ questions: q }));

        // Save processed data to cache
        localStorage.setItem(`exam_info_${pId}`, JSON.stringify(examDataForCache));
        localStorage.setItem(`exam_questions_${pId}`, JSON.stringify(qs));
      }

      if (!isMountedRef.current) return;
      
      setExam(examData);
      setQuestions(qs);
      
      // Load violations (offline-first check local storage)
      const localViolations = localStorage.getItem(`violations_${pId}`);
      const initialViolations = Math.max(participant.violations || 0, localViolations ? parseInt(localViolations) : 0);
      setViolations(initialViolations);

      // Load last position (offline-first check local storage)
      const localPosition = localStorage.getItem(`last_position_${pId}`);
      const initialPosition = localPosition ? parseInt(localPosition) : (participant.last_position || 0);
      setLastPosition(initialPosition);
      setCurrentIndex(initialPosition);

      // Check if participant is blocked or has too many violations
      const limit = examData?.strict_limit !== undefined ? examData.strict_limit : 3;
      const isLockedLocal = localStorage.getItem(`is_locked_${pId}`);
      const isPermanentLocal = localStorage.getItem(`is_locked_permanent_${pId}`) === 'true';

      const isPermanent = (limit > 0 && initialViolations >= limit) || 
                          participant.status === 'blocked_violation' || 
                          isPermanentLocal;

      const isTempLocked = participant.is_locked === true || 
                           participant.status === 'blocked' || 
                           isLockedLocal === 'true' || 
                           isLockedLocal === 'temporary';

      if (isPermanent) {
        setIsBlocked(true);
        setIsPermanentlyBlocked(true);
      } else if (isTempLocked) {
        setIsBlocked(true);
        setIsPermanentlyBlocked(false);
      }

      // Timer Setup
      const startTime = new Date(participant.start_time).getTime();
      const endTimeValue = startTime + (examData.duration * 60 * 1000);
      setExamEndTime(endTimeValue);

      // Load existing answers if any
      console.log('[Exam] Loading existing answers...');
      const { data: existingAnswers } = await supabase
        .from('answers')
        .select('*')
        .eq('participant_id', pId);
      
      if (!isMountedRef.current) return;
      console.log('[Exam] Existing answers loaded:', existingAnswers?.length || 0, existingAnswers);
      
      const dbAnswers: Record<string, string> = {};
      existingAnswers?.forEach(a => {
        // Use option_id for MCQ, answer_text for Essay
        dbAnswers[a.question_id] = a.option_id || a.answer_text || '';
      });

      const localAnswersStr = localStorage.getItem(`exam_answers_${pId}`);
      const localAnswers = localAnswersStr ? JSON.parse(localAnswersStr) : {};

      const mergedAnswers = { ...dbAnswers, ...localAnswers };
      setAnswers(mergedAnswers);
      setLastSavedAnswers(dbAnswers);
      lastSavedAnswersRef.current = dbAnswers;

      // Initialize Presence (only if not in offline-first mode)
      if (!isMountedRef.current) return;
      if (!examData.offline_mode) {
        console.log('[Exam] Initializing presence channel...');
        const room = supabase.channel(`exam_room_${examData.id}`);
        roomRef.current = room;

        room.on('presence', { event: 'sync' }, () => {
        });

        room.subscribe(async (status, err) => {
          if (!isMountedRef.current) return;
          console.log('[Exam] Channel status:', status, err);
          if (status === 'SUBSCRIBED') {
            console.log('[Exam] Channel subscribed, tracking presence...');
            const trackPayload = {
              participantId: pId,
              participant_id: pId,
              name: participant.name,
              student_name: participant.name,
              class: participant.class,
              student_class: participant.class,
              status: 'online',
              violations: participant.violations || 0,
              examId: examData.id,
              updatedAt: new Date().toISOString()
            };
            await room.track(trackPayload);
            console.log('[Exam] Presence tracked successfully');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[Exam] Channel error:', err);
          }
        });
      }

      console.log('[Exam] Exam data loaded successfully');

    } catch (err) {
      console.error('[Exam] Error in fetchExamData:', err);
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat ujian';
        setInitError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Cleanup Presence on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (roomRef.current) {
        try {
          roomRef.current.unsubscribe();
          supabase.removeChannel(roomRef.current);
        } catch (e) {
          console.log('[Exam] Channel cleanup skipped (already cleaned)');
        }
      }
    };
  }, []);

  // Auto-save is handled in handleAnswer with debounced save

  // Update last_position when currentIndex changes
  useEffect(() => {
    if (!participantId || loading) return;
    
    // Save to localStorage immediately
    try {
      localStorage.setItem(`last_position_${participantId}`, String(currentIndex));
    } catch (e) {
      console.warn('[Local] Failed to save position:', e);
    }
    
    if (exam?.offline_mode || exam?.qr_submission) return;
    
    const savePosition = async () => {
      await supabase
        .from('participants')
        .update({ last_position: currentIndex })
        .eq('id', participantId);
    };

    // Debounce position save
    const timeout = setTimeout(savePosition, 2000);
    return () => clearTimeout(timeout);
  }, [currentIndex, participantId, loading, exam?.offline_mode]);

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    console.log('>>>>>> HANDLE ANSWER CALL <<<<<<');
    console.log('Question ID:', questionId);
    console.log('Answer (this is option_id):', answer);
    console.log('Participant ID:', participantId);
    console.log('Questions loaded:', questions.length);
    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: answer };
      try {
        localStorage.setItem(`exam_answers_${participantId}`, JSON.stringify(newAnswers));
      } catch (e) {
        console.warn('[Local] localStorage failed:', e);
      }
      return newAnswers;
    });

    // REAL-TIME AUTO-SAVE to Supabase (debounced)
    if (!participantId || !questions.length) {
      console.log('[AutoSave] EARLY RETURN - participantId:', participantId, 'questions.length:', questions.length);
      return;
    }
    
    // If offline-first mode or QR submission mode is enabled, only save to localStorage (bypassing DB autosave)
    if (exam?.offline_mode || exam?.qr_submission) {
      return;
    }
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce: save after 1 second of no changes
    saveTimeoutRef.current = setTimeout(async () => {
      console.log('>>>>>> AUTO-SAVE EXECUTING <<<<<<');
      console.log('Saving for question:', questionId, 'answer:', answer);
      try {
        const question = questions.find((q: any) => q.id === questionId);
        if (!question) return;

        const isMCQ = question.question_type === 'pilihan_ganda';
        
        // Check if answer already exists
        const { data: existingAnswer } = await supabase
          .from('answers')
          .select('id')
          .eq('participant_id', participantId)
          .eq('question_id', questionId)
          .maybeSingle();

        if (existingAnswer) {
          console.log('[DB] Updating existing answer ID:', existingAnswer.id);
          const { data: updateData, error: updateError } = await supabase
            .from('answers')
            .update({
              answer_text: isMCQ ? null : answer,
              option_id: isMCQ ? answer : null
            })
            .eq('id', existingAnswer.id);
          
          console.log('[DB] Update response - error:', updateError, 'data:', updateData);
        } else {
          console.log('[DB] Inserting NEW answer');
          console.log('[DB] Insert payload:', {
            participant_id: participantId,
            question_id: questionId,
            answer_text: isMCQ ? null : answer,
            option_id: isMCQ ? answer : null,
            is_correct: null
          });
          
          const { data: insertData, error: insertError } = await supabase
            .from('answers')
            .insert([{
              participant_id: participantId,
              question_id: questionId,
              answer_text: isMCQ ? null : answer,
              option_id: isMCQ ? answer : null,
              is_correct: null
            }]);
          
          console.log('[DB] Insert response - error:', insertError, 'data:', insertData);
        }

        // Update last saved
        lastSavedAnswersRef.current = { ...lastSavedAnswersRef.current, [questionId]: answer };
        
        // Mark as online after successful save
        if (!isOnline) {
          setIsOnline(true);
        }
      } catch (err) {
        console.error('Real-time save failed', err);
        setIsOnline(false);
      }
    }, 5000);
  }, [participantId, questions, isOnline, exam]);

  const handleViolation = useCallback(async () => {
    if (loading || submitting || !participantId) return;
    
    // Skip violation if offline (network/server error)
    if (!isOnline) return;
    
    const limit = exam?.strict_limit !== undefined ? exam.strict_limit : 3;

    // Prevent double counting
    if (limit > 0 && violations >= limit) return;

    const newViolations = violations + 1;
    setViolations(newViolations);
    
    // Save to localStorage immediately
    try {
      localStorage.setItem(`violations_${participantId}`, String(newViolations));
    } catch (e) {
      console.warn('[Local] Failed to save violations:', e);
    }
    
    // Update violation count to DB (fails silently if offline/QR Mode)
    if (!exam?.qr_submission) {
      try {
        await supabase
          .from('participants')
          .update({ violations: newViolations })
          .eq('id', participantId);
      } catch (dbErr) {
        console.warn('[DB] Failed to update violation count:', dbErr);
      }
    }

    if (limit > 0 && newViolations >= limit) {
      // Save local lock status
      try {
        localStorage.setItem(`is_locked_${participantId}`, 'true');
      } catch (e) {
        console.warn('[Local] Failed to save is_locked status:', e);
      }

      // BLOCK THE ACCOUNT and set score to 0 (fails silently if offline/QR Mode)
      if (!exam?.qr_submission) {
        try {
          await supabase
            .from('participants')
            .update({ 
              is_locked: true,
              status: 'blocked_violation',
              lock_reason: `Pelanggaran: Membuka tab/hal lain saat ujian (Batas: ${limit}x)`,
              score: 0
            })
            .eq('id', participantId);
        } catch (dbErr) {
          console.warn('[DB] Failed to block account:', dbErr);
        }
      }
      
      setIsBlocked(true);
      
      if (exam?.offline_mode) {
        // If offline mode, show local lock overlay instead of redirecting and clearing answers
        return;
      }

      // Clear local storage (only for regular online mode)
      localStorage.removeItem(`exam_info_${participantId}`);
      localStorage.removeItem(`exam_questions_${participantId}`);
      localStorage.removeItem(`exam_answers_${participantId}`);
      localStorage.removeItem(`exam_session_${examCode}`);
      localStorage.removeItem(`violations_${participantId}`);
      localStorage.removeItem(`last_position_${participantId}`);
      
      // Show blocked modal and redirect (only for regular online mode)
      alert(`AKUN TERBLOKIR! Anda terdeteksi melanggar aturan ujian (membuka tab lain) sebanyak ${limit} kali. Nilai Anda otomatis menjadi 0. Silakan hubungi Admin jika ada kesalahan.`);
      navigate('/exam', { replace: true });
      return;
    } else {
      setShowViolationWarning(true);
      // Update Presence with new violation count
      if (roomRef.current) {
        roomRef.current.track({
          participantId: participantId,
          status: 'online',
          violations: newViolations,
          updatedAt: new Date().toISOString()
        });
      }
    }
  }, [violations, loading, submitting, participantId, isOnline, examCode, navigate, exam]);

  const handleBypassUnlock = useCallback(async () => {
    const cleanInput = unlockCode.trim().toUpperCase();
    const dbBypassCode = exam?.bypass_code?.trim().toUpperCase();
    
    // Support either the custom bypass_code OR fallback unlock codes
    const isSuccess = (dbBypassCode && cleanInput === dbBypassCode) || 
                      cleanInput === `UNLOCK-${examCode?.toUpperCase()}` || 
                      cleanInput === `UNLOCK${examCode?.toUpperCase()}`;

    if (isSuccess) {
      setViolations(0);
      setIsBlocked(false);
      setUnlockCode('');
      setUnlockError('');
      
      try {
        localStorage.setItem(`violations_${participantId}`, '0');
        localStorage.setItem(`is_locked_${participantId}`, 'false');
        localStorage.removeItem(`is_locked_permanent_${participantId}`);
      } catch (e) {
        console.warn('[Local] Failed to reset local storage violations:', e);
      }

      try {
        await supabase
          .from('participants')
          .update({ 
            is_locked: false, 
            violations: 0,
            status: 'ongoing',
            lock_reason: null
          })
          .eq('id', participantId);
      } catch (dbErr) {
        console.warn('[DB] Failed to unlock account in DB:', dbErr);
      }

      alert('Akses ujian berhasil dibuka! Silakan lanjutkan pengerjaan dan jangan keluar dari tab lagi.');
    } else {
      setUnlockError('Kode bypass salah. Silakan minta kode yang benar kepada Guru atau Pengawas.');
    }
  }, [unlockCode, examCode, participantId, exam]);

  // Listen for fullscreen state changes
  useEffect(() => {
    if (loading) return;

    // Devices without DOM Fullscreen API support (like iPhone Safari)
    if (!isFullscreenSupported || isIOSDevice) {
      setIsFullscreen(true);
      return;
    }

    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFull = !!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      
      setIsFullscreen(isFull);

      // Trigger violation if student exits fullscreen during exam and strict mode is active
      if (!isFull && !loading && !submitting && exam?.strict_mode !== false) {
        handleViolation();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Initial check
    const doc = document as any;
    const initialFull = !!(
      document.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
    setIsFullscreen(initialFull);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [loading, submitting, exam, handleViolation]);

  useEffect(() => {
    // Apabila Mode Anti Curang dinonaktifkan dari pengaturan
    if (exam && exam.strict_mode === false) {
      return;
    }

    // Grace period: 5 detik sebelum pelanggaran dihitung
    // Ini mencegah false positive dari klik address bar, minimize, dll
    let graceTimeout: NodeJS.Timeout | null = null;
    let isProcessingViolation = false;
    let hasTriggeredViolation = false;
    const GRACE_PERIOD = 1000; // 1 detik grace period (lebih ketat)
    const COOLDOWN = 1500; // 1.5 detik cooldown setelah pelanggaran

    const triggerViolation = async () => {
      if (isProcessingViolation || hasTriggeredViolation) return;
      if (loading || submitting || !participantId) return;
      if (!isOnline && !exam?.offline_mode) return;

      isProcessingViolation = true;
      try {
        await handleViolation();
        hasTriggeredViolation = true;
        setTimeout(() => {
          hasTriggeredViolation = false;
        }, COOLDOWN);
      } finally {
        isProcessingViolation = false;
      }
    };

    const onBlur = () => {
      if (isProcessingViolation || hasTriggeredViolation) return;
      if (graceTimeout) clearTimeout(graceTimeout);
      graceTimeout = setTimeout(() => {
        if (!hasTriggeredViolation && !isProcessingViolation) {
          triggerViolation();
        }
      }, GRACE_PERIOD);
    };

    const onFocus = () => {
      if (graceTimeout) {
        clearTimeout(graceTimeout);
        graceTimeout = null;
      }
      isProcessingViolation = false;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        onBlur();
      } else {
        onFocus();
      }
    };

    // Cegah Copy-Paste dan Klik Kanan
    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    const onSelectStart = (e: Event) => e.preventDefault();
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      alert("Menyalin teks dilarang selama ujian!");
    };
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      alert("Menempel teks dilarang selama ujian!");
    };

    // Peringatan sebelum Reload/Keluar halaman
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Anda yakin ingin meninggalkan halaman? Waktu ujian dan jawaban mungkin tidak tersimpan optimal.";
      return e.returnValue;
    };

    // Listeners
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('selectstart', onSelectStart);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      if (graceTimeout) clearTimeout(graceTimeout);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('selectstart', onSelectStart);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [handleViolation, violations, exam, isOnline]);

  // DEBUG: Log whenever questions change
  useEffect(() => {
    console.log('QUESTIONS UPDATED:', questions.length, '| First question options:', questions[0]?.question_options?.map(o => o.option_label));
  }, [questions]);

  const handleSubmit = useCallback(async (isForced = false, retryCount = 0) => {
    if (submitting) return;
    if (!participantId) {
      alert('Sesi ujian tidak ditemukan. Silakan masuk ulang.');
      navigate('/exam', { replace: true });
      return;
    }

    setShowSubmitConfirm(false);

    // Calculate score
    let correctCount = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const userAnswer = answers[q.id];
      
      // Get original correct answer text (stored when randomized)
      const correctAnswerText = q._original_correct_answer_text || q.correct_answer;
      
      let isCorrect = false;
      
      if (q.question_type === 'pilihan_ganda') {
        // Find selected option and compare by text, not label
        const selectedOption = q.question_options?.find((opt: any) => opt.id === userAnswer);
        if (selectedOption) {
          isCorrect = (selectedOption.option_text || '').trim().toLowerCase() === (correctAnswerText || '').trim().toLowerCase();
        }
      } else if (q.question_type === 'menjodohkan') {
        try {
          const expectedPairs: any[] = JSON.parse(q.correct_answer || '[]');
          const userPairs = JSON.parse(userAnswer || '{}');
          if (expectedPairs.length > 0) {
            let matched = 0;
            expectedPairs.forEach(ep => {
              const uVal = userPairs[ep.id] || userPairs[ep.left];
              if (uVal && uVal.trim().toLowerCase() === ep.right.trim().toLowerCase()) {
                matched++;
              }
            });
            correctCount += (matched / expectedPairs.length);
            continue;
          }
        } catch (e) {
          isCorrect = false;
        }
      } else if (q.question_type === 'essay') {
        // Essay response: submitted for teacher evaluation
        if (userAnswer && userAnswer.trim().length > 0) {
          isCorrect = true;
        }
      } else {
        isCorrect = (userAnswer || '').trim().toLowerCase() === (correctAnswerText || '').trim().toLowerCase();
      }
      
      if (isCorrect) correctCount++;
    }
    
    const score = (correctCount / questions.length) * 100;

    // Generate answersString for QR submission (or as offline backup)
    const sortedQuestions = [...questions].sort((a, b) => a.id.localeCompare(b.id));
    const answerTokens = sortedQuestions.map(q => {
      const userAnswer = answers[q.id];
      if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
        return '_'; // Unanswered
      }
      
      if (q.question_type === 'pilihan_ganda') {
        const sortedOptions = [...(q.question_options || [])].sort((a, b) => a.id.localeCompare(b.id));
        const optIndex = sortedOptions.findIndex(opt => opt.id === userAnswer);
        return optIndex !== -1 ? optIndex.toString() : '_';
      } else {
        try {
          const utf8Bytes = encodeURIComponent(userAnswer);
          const base64Text = btoa(unescape(utf8Bytes));
          return base64Text.replace(/,/g, '%2C').replace(/#/g, '%23');
        } catch (e) {
          return '_';
        }
      }
    });
    const answersString = answerTokens.join(',');
    const finalScore = Math.round(score * 100) / 100;

    // Helper UUID validator for option_id in PostgreSQL
    const isUUID = (v: any) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

    // Prepare answer records for is_correct and answers table
    const finalAnswers = questions.map((q) => {
      const userAnswer = answers[q.id];
      const correctAnswerText = q._original_correct_answer_text || q.correct_answer;
      let isCorrect = false;
      
      if (q.question_type === 'pilihan_ganda') {
        const selectedOption = q.question_options?.find((opt: any) => opt.id === userAnswer);
        if (selectedOption) {
          isCorrect = (selectedOption.option_text || '').trim().toLowerCase() === (correctAnswerText || '').trim().toLowerCase();
        }
      } else if (q.question_type === 'menjodohkan') {
        try {
          const expectedPairs: any[] = JSON.parse(q.correct_answer || '[]');
          const userPairs = JSON.parse(userAnswer || '{}');
          if (expectedPairs.length > 0) {
            let matched = 0;
            expectedPairs.forEach((ep: any) => {
              const uVal = userPairs[ep.id] || userPairs[ep.left];
              if (uVal && uVal.trim().toLowerCase() === ep.right.trim().toLowerCase()) {
                matched++;
              }
            });
            isCorrect = matched === expectedPairs.length;
          }
        } catch (e) {
          isCorrect = false;
        }
      } else if (q.question_type === 'essay') {
        isCorrect = !!(userAnswer && userAnswer.trim().length > 0);
      } else {
        isCorrect = (userAnswer || '').trim().toLowerCase() === (correctAnswerText || '').trim().toLowerCase();
      }
      
      return {
        id: q.id,
        question_type: q.question_type,
        userAnswer: userAnswer,
        isCorrect
      };
    });

    const answersToInsert = finalAnswers.map(q => {
      const isMCQ = q.question_type === 'pilihan_ganda';
      const validOptionId = isMCQ && isUUID(q.userAnswer) ? q.userAnswer : null;
      let answerTextVal: string | null = null;
      if (!isMCQ) {
        if (typeof q.userAnswer === 'object' && q.userAnswer !== null) {
          answerTextVal = JSON.stringify(q.userAnswer);
        } else if (q.userAnswer !== undefined && q.userAnswer !== null && q.userAnswer !== '') {
          answerTextVal = String(q.userAnswer);
        }
      }
      return {
        participant_id: participantId,
        question_id: q.id,
        is_correct: q.isCorrect,
        answer_text: answerTextVal,
        option_id: validOptionId
      };
    });

    if (exam?.qr_submission) {
      setSubmitting(true);
      try {
        const studentInfoCached = localStorage.getItem(`participant_info_${participantId}`);
        const parsedStudentInfo = studentInfoCached ? JSON.parse(studentInfoCached) : {};

        // 1. Generate QR data URL
        const { default: QRCode } = await import('qrcode');
        const qrPayload = `EDUTEST#${participantId}#${finalScore}#${answersString}`;
        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
          width: 350, margin: 2,
          color: { dark: '#1e3a8a', light: '#ffffff' }
        });

        const offlineResult = {
          participant: {
            id: participantId,
            name: parsedStudentInfo.name || 'Siswa',
            class: parsedStudentInfo.class || '',
            score: finalScore,
            end_time: new Date().toISOString(),
            status: 'menunggu_scan',
            is_qr: true
          },
          exam: exam,
          answersString: answersString,
          qrDataUrl: qrDataUrl
        };
        localStorage.setItem(`offline_result_${participantId}`, JSON.stringify(offlineResult));

        // Mode QR: Hasil TIDAK dikirim ke Supabase oleh murid.
        // Hanya tandai end_time & status menunggu_scan di DB agar murid tidak bisa masuk ulang ujian.
        // Guru/pengawas yang akan memindai QR code murid untuk memvalidasi dan mengirim nilai ke Supabase.
        try {
          await supabaseAnon
            .from('participants')
            .update({ 
              end_time: new Date().toISOString(),
              status: 'menunggu_scan'
            })
            .eq('id', participantId);
        } catch (dbErr) {
          console.warn('Offline mode: unable to update end_time in DB:', dbErr);
        }

        localStorage.removeItem(`exam_info_${participantId}`);
        localStorage.removeItem(`exam_questions_${participantId}`);
        localStorage.removeItem(`exam_answers_${participantId}`);
        localStorage.removeItem(`violations_${participantId}`);
        localStorage.removeItem(`last_position_${participantId}`);

        navigate(`/exam/result/${participantId}`, { replace: true });
        return;
      } catch (err) {
        console.error('Error generating QR offline cache:', err);
      }
    }

    setSubmitting(true);
    try {
      // Update Participant with dual client support (supabaseAnon ensures anon RLS policy match)
      const updateParticipant = async () => {
        const updatePayload = {
          end_time: new Date().toISOString(),
          score: finalScore,
          status: 'completed'
        };

        // 1. Try supabaseAnon first
        const { data: anonData, error: anonErr } = await supabaseAnon
          .from('participants')
          .update(updatePayload)
          .eq('id', participantId)
          .select();

        if (!anonErr && anonData && anonData.length > 0) {
          return null;
        }

        // 2. Fallback to supabase client
        const { data: authData, error: authErr } = await supabase
          .from('participants')
          .update(updatePayload)
          .eq('id', participantId)
          .select();

        if (!authErr && authData && authData.length > 0) {
          return null;
        }

        return anonErr || authErr;
      };

      let participantError = await updateParticipant();
      
      // Retry up to 3 times if network error
      let attemptCount = 0;
      while (participantError && attemptCount < 3 && (participantError.message?.includes('fetch') || participantError.message?.includes('network'))) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attemptCount + 1)));
        participantError = await updateParticipant();
        attemptCount++;
      }

      if (participantError) {
        console.warn('Participant update returned error/0 rows:', participantError);
      }

      // If offline-first mode is active, add jitter delay to avoid DB overload spikes
      if (exam?.offline_mode) {
        const jitterDelay = Math.random() * 3000;
        await new Promise(resolve => setTimeout(resolve, jitterDelay));
      }

      // Batch insert answers with retry loop (non-blocking for overall completion)
      const upsertAnswersWithRetry = async (attempt = 0): Promise<any> => {
        try {
          // Delete old answers
          const { error: deleteError } = await supabaseAnon
            .from('answers')
            .delete()
            .eq('participant_id', participantId);
          
          if (deleteError) {
            await supabase.from('answers').delete().eq('participant_id', participantId);
          }

          const validAnswers = answersToInsert.filter(ans => ans.option_id !== null || ans.answer_text !== null);
          if (validAnswers.length > 0) {
            let { error: insertError } = await supabaseAnon
              .from('answers')
              .insert(validAnswers);
            
            if (insertError) {
              const res = await supabase.from('answers').insert(validAnswers);
              insertError = res.error;
            }

            if (insertError) {
              if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                return upsertAnswersWithRetry(attempt + 1);
              }
              console.warn('[Exam] Insert answers error:', insertError);
              return insertError;
            }
          }
          return null;
        } catch (e: any) {
          console.warn('[Exam] Upsert answers exception:', e);
          return e;
        }
      };

      await upsertAnswersWithRetry();

      // Clear local storage upon completion
      localStorage.removeItem(`exam_info_${participantId}`);
      localStorage.removeItem(`exam_questions_${participantId}`);
      localStorage.removeItem(`exam_answers_${participantId}`);
      localStorage.removeItem(`violations_${participantId}`);
      localStorage.removeItem(`last_position_${participantId}`);
      
      // Clean up presence
      if (roomRef.current) {
        try {
          await roomRef.current.untrack();
        } catch (e) {
          console.warn('[Presence] Untrack failed (expected offline):', e);
        }
      }

      navigate(`/exam/result/${participantId}`, { replace: true });
    } catch (err) {
      console.error('Submit error:', err);
      alert('Gagal mengirim jawaban (silakan periksa koneksi internet Anda): ' + (err instanceof Error ? err.message : 'Silakan coba lagi.'));
    } finally {
      setSubmitting(false);
    }
  }, [submitting, answers, questions, participantId, navigate, exam]);



  if (loading) return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Deep Blue Ambient Background Glow - No purple */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        {/* Modern multi-ring pulsing spinner (no hourglass emoji) */}
        <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping opacity-25" />
          <div className="w-20 h-20 rounded-full border-3 border-blue-500/20 border-t-blue-500 animate-spin" />
          <div className="absolute w-12 h-12 rounded-full border-2 border-indigo-400/30 border-b-indigo-400 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
          <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_12px_#60A5FA]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Menyiapkan Ruang Ujian...</h2>
        <p className="text-slate-400 font-medium mt-3 text-sm sm:text-base leading-relaxed">
          Mohon tunggu sebentar, sistem sedang memverifikasi data dan memuat soal ujian Anda.
        </p>
      </div>
    </div>
  );

  if (initError) return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="bg-white/5 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-white/10 mb-8 text-center max-w-md shadow-2xl relative z-10">
        <div className="bg-red-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-9 h-9 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Gagal Memuat Ujian</h2>
        <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">{initError}</p>
        <div className="space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            Coba Lagi
          </button>
          <button 
            onClick={() => navigate('/exam')}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            Kembali ke Daftar Ujian
          </button>
        </div>
      </div>
    </div>
  );

  const currentQuestion = questions && questions.length > currentIndex ? questions[currentIndex] : null;

  if (!loading && !initError && questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#1D4ED8] flex flex-col items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] border border-white/10 mb-8 text-center max-w-md shadow-2xl">
          <div className="bg-red-500/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Tidak Ada Soal</h2>
          <p className="text-indigo-200 font-medium mb-8 leading-relaxed">Tidak ada soal dalam ujian ini. Hubungi guru Anda.</p>
          <button onClick={() => navigate('/exam')} className="w-full py-4 px-4 rounded-full font-black text-[#3B66F5]/70 bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
            Kembali ke Daftar Ujian
          </button>
        </div>
      </div>
    );
  }

  const getDisplayOptions = () => {
    if (!currentQuestion || !currentQuestion.question_options) return [];
    try {
      let options = currentQuestion.question_options;
      if (!Array.isArray(options)) {
        if (typeof options === 'object' && options !== null) {
          options = Object.values(options);
        } else {
          return [];
        }
      }
      if (!options || !options.length) return [];
      const order = ['A', 'B', 'C', 'D', 'E'];
      return [...options]
        .filter(opt => opt && opt.option_label)
        .sort((a, b) => {
          const aIdx = order.indexOf((a.option_label || '').toUpperCase());
          const bIdx = order.indexOf((b.option_label || '').toUpperCase());
          return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
        })
        .slice(0, 5);
    } catch (e) {
      console.error('[Exam] Error processing options:', e);
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-400/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[40%] h-[40%] bg-[#1D4ED8]/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[25%] h-[25%] bg-emerald-400/5 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="bg-[#0B1120] border-b border-slate-800 h-20 sticky top-0 z-30 px-6 sm:px-12 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex bg-white/10 border border-white/15 w-12 h-12 rounded-2xl items-center justify-center text-blue-400 shadow-md">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Waktu Tersisa</p>
            {examEndTime > 0 && <ExamTimer endTime={examEndTime} onTimeUp={() => handleSubmit(true)} />}
          </div>
        </div>
        
        {/* Network Status Indicator */}
        {!isOnline && (
          <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 px-4 py-2 rounded-xl animate-pulse">
            <WifiOff className="w-4 h-4" />
            <span className="text-xs font-bold">Koneksi Terputus - Pelanggaran Ditunda</span>
          </div>
        )}

        {/* Offline Mode Active Banner */}
        {exam?.offline_mode && (
          <div className="hidden md:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl">
            <WifiOff className="w-4 h-4" />
            <span className="text-xs font-bold">Mode Offline-First Aktif</span>
          </div>
        )}

        <div className="text-center">
          <h1 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider line-clamp-1 max-w-[140px] sm:max-w-md">{exam?.title || 'Ujian'}</h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Progress:</span>
            <div className="w-20 sm:w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" 
                style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-blue-400">{Object.keys(answers).length}/{questions.length}</span>
          </div>
        </div>

        <button 
          onClick={() => setShowSubmitConfirm(true)}
          disabled={submitting}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-95 text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/30 border border-emerald-400/30 flex items-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4 text-white" />
          <span className="hidden sm:inline">Kumpulkan</span>
        </button>
      </header>

      {/* Violation Warning Modal */}
      <AnimatePresence>
        {showViolationWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center"
            >
              <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-6">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-[#1D4ED8] mb-2">Peringatan Pelanggaran!</h3>
              <p className="text-slate-500 font-medium mb-8">
                Anda terdeteksi meninggalkan halaman ujian. Hal ini dilarang keras! 
                {exam?.strict_limit === 0 ? (
                  `Jumlah pelanggaran Anda: ${violations}.`
                ) : (
                  `Percobaan ke-${violations} dari ${exam?.strict_limit !== undefined ? exam.strict_limit : 3}.`
                )}
              </p>
              <button 
                onClick={() => setShowViolationWarning(false)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-full font-black transition-all border border-white/10 shadow-xl shadow-slate-200"
              >
                Saya Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowSubmitConfirm(false)}
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
              <h3 className="text-xl font-bold text-[#1D4ED8] text-center mb-2 tracking-tight">Kumpulkan Jawaban?</h3>
              <p className="text-center text-slate-500 font-medium mb-8">
                Apakah Anda sudah yakin dengan semua jawaban Anda? Ujian tidak dapat diulang setelah dikumpulkan.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSubmitConfirm(false)}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-full font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Tidak, Cek Lagi
                </button>
                <button 
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all border border-white/10 flex items-center justify-center"
                >
                  {submitting ? 'Mengirim...' : 'Ya, Kumpulkan'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col lg:flex-row p-4 sm:p-12 gap-6 lg:gap-10 max-w-[1600px] mx-auto w-full relative z-10">
        {/* Sidebar Navigation - Moved to top on mobile */}
        <div className="w-full lg:w-96 space-y-6 lg:space-y-8 order-1 lg:order-2">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden text-slate-800">
            <div className="bg-slate-50/90 p-5 sm:p-6 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Navigasi Soal</h3>
                  <p className="text-[11px] font-medium text-slate-400">{questions.length} Pertanyaan</p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {Object.keys(answers).length} Terjawab
              </span>
            </div>
            <div className="p-5 sm:p-6 grid grid-cols-6 sm:grid-cols-5 gap-2 sm:gap-2.5">
              {questions.map((q, i) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = i === currentIndex;
                return (
                  <button 
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "h-10 sm:h-11 rounded-xl font-bold text-xs sm:text-sm transition-all relative border flex items-center justify-center cursor-pointer",
                      isCurrent 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 border-blue-600 scale-105 z-10" 
                        : isAnswered
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100" 
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {i + 1}
                    {isAnswered && !isCurrent && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden lg:block bg-gradient-to-br from-[#0B1120] via-[#0F172A] to-[#1E3A8A] border border-blue-900/40 rounded-3xl p-8 text-white overflow-hidden relative group shadow-lg">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <HelpCircle className="w-28 h-28" />
            </div>
            <div className="relative z-10">
              <div className="bg-white/10 w-11 h-11 rounded-xl flex items-center justify-center mb-5 border border-white/10">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              </div>
              <h4 className="text-lg font-bold mb-2 tracking-tight">Butuh Bantuan?</h4>
              <p className="text-xs text-slate-300 font-normal leading-relaxed">
                Jika Anda mengalami kendala teknis atau gangguan koneksi, segera hubungi pengawas ujian.
              </p>
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 space-y-6 lg:space-y-8 order-2 lg:order-1">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-3xl sm:rounded-[3rem] border border-slate-100 shadow-sm p-6 sm:p-16 relative overflow-hidden"
            >


              <div className="flex items-center gap-4 mb-8">
                <div className="bg-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20">
                  {currentIndex + 1}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Pertanyaan</p>
                  <p className="text-sm font-bold text-slate-800">Dari {questions.length} Soal</p>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-8">
                {currentQuestion.question_text}
              </h2>

              {currentQuestion.image_url && (
                <div className="mb-8 rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center max-w-[500px] mx-auto w-full">
                  <img src={currentQuestion.image_url} alt="Question" className="max-w-full h-auto object-contain max-h-[300px] p-2" />
                </div>
              )}

              {currentQuestion.question_type === 'pilihan_ganda' ? (
                <div className="grid grid-cols-1 gap-3.5 sm:gap-4">
                  {getDisplayOptions().map((opt: any) => {
                    const isSelected = answers[currentQuestion.id] === opt.id;
                    return (
                      <button 
                        key={opt.id}
                        onClick={() => {
                          handleAnswer(currentQuestion.id, opt.id);
                        }}
                        className={cn(
                          "flex items-start gap-4 p-4 sm:p-5 rounded-2xl border-2 text-left transition-all group cursor-pointer",
                          isSelected
                            ? "bg-blue-50/80 border-blue-600 text-blue-950 shadow-xs ring-2 ring-blue-500/20"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-700"
                        )}
                      >
                        <div className={cn(
                          "w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl font-bold text-sm sm:text-base transition-all shrink-0 mt-0.5",
                          isSelected
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700"
                        )}>
                          {opt.option_label}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 w-full">
                            <span className={cn(
                              "text-base sm:text-lg leading-relaxed min-w-0 break-words",
                              isSelected ? "font-bold text-blue-950" : "font-medium text-slate-800"
                            )}>
                              {opt.option_text}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            )}
                          </div>
                          {opt.image_url && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 bg-white w-full sm:w-64">
                              <img src={opt.image_url} alt={`Option ${opt.option_label}`} className="w-full h-auto object-cover max-h-48" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : currentQuestion.question_type === 'menjodohkan' ? (
                (() => {
                  let pairs: { id: string; left: string; right: string }[] = [];
                  try {
                    pairs = JSON.parse(currentQuestion.correct_answer || '[]');
                  } catch (e) {
                    pairs = [];
                  }

                  let currentMatches: Record<string, string> = {};
                  try {
                    currentMatches = JSON.parse(answers[currentQuestion.id] || '{}');
                  } catch (e) {
                    currentMatches = {};
                  }

                  const leftItems = pairs.map(p => ({ key: p.id || p.left, label: p.left }));
                  const rightItems = pairs.map(p => p.right);

                  const colorPalettes = [
                    { bg: 'bg-blue-500', light: 'bg-blue-50 border-blue-200 text-blue-900', badge: 'bg-blue-100 text-blue-700' },
                    { bg: 'bg-purple-500', light: 'bg-purple-50 border-purple-200 text-purple-900', badge: 'bg-purple-100 text-purple-700' },
                    { bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-900', badge: 'bg-emerald-100 text-emerald-700' },
                    { bg: 'bg-amber-500', light: 'bg-amber-50 border-amber-200 text-amber-900', badge: 'bg-amber-100 text-amber-700' },
                    { bg: 'bg-rose-500', light: 'bg-rose-50 border-rose-200 text-rose-900', badge: 'bg-rose-100 text-rose-700' },
                    { bg: 'bg-cyan-500', light: 'bg-cyan-50 border-cyan-200 text-cyan-900', badge: 'bg-cyan-100 text-cyan-700' },
                  ];

                  const getPairIndex = (leftKey: string) => {
                    const keys = Object.keys(currentMatches);
                    return keys.indexOf(leftKey);
                  };

                  const handlePairSelect = (leftKey: string, rightVal: string) => {
                    const newMatches = { ...currentMatches };
                    Object.keys(newMatches).forEach(k => {
                      if (newMatches[k] === rightVal) delete newMatches[k];
                    });
                    newMatches[leftKey] = rightVal;
                    handleAnswer(currentQuestion.id, JSON.stringify(newMatches));
                    setSelectedMatchLeft(null);
                  };

                  const handleUnpair = (leftKey: string) => {
                    const newMatches = { ...currentMatches };
                    delete newMatches[leftKey];
                    handleAnswer(currentQuestion.id, JSON.stringify(newMatches));
                  };

                  const handleResetAll = () => {
                    handleAnswer(currentQuestion.id, JSON.stringify({}));
                    setSelectedMatchLeft(null);
                  };

                  const totalPaired = Object.keys(currentMatches).length;

                  return (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 p-4 sm:p-6 rounded-3xl border border-indigo-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-0.5">Soal Menjodohkan (TKA)</p>
                          <p className="text-xs sm:text-sm text-slate-600 font-medium">
                            1. Klik item di <strong>Kolom Kiri</strong>, lalu klik pasangan yang cocok di <strong>Kolom Kanan</strong>.
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Anda juga bisa melakukan drag & drop dari kolom kanan ke kiri.</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-indigo-200 text-indigo-700 shadow-2xs">
                            Terpasang: {totalPaired} / {leftItems.length}
                          </span>
                          {totalPaired > 0 && (
                            <button
                              type="button"
                              onClick={handleResetAll}
                              className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-full border border-rose-200 transition-colors cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Kolom Kiri: Premis */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Kolom Kiri (Premis / Soal)</span>
                            <span className="text-[11px] font-bold text-indigo-600">{selectedMatchLeft ? 'Pilih pasangan di kanan' : 'Klik untuk memilih'}</span>
                          </div>

                          {leftItems.map((item, idx) => {
                            const isSelected = selectedMatchLeft === item.key;
                            const pairedValue = currentMatches[item.key];
                            const pairIdx = getPairIndex(item.key);
                            const palette = pairIdx >= 0 ? colorPalettes[pairIdx % colorPalettes.length] : null;

                            return (
                              <div
                                key={item.key}
                                onClick={() => {
                                  setSelectedMatchLeft(isSelected ? null : item.key);
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const rightVal = e.dataTransfer.getData('text/plain');
                                  if (rightVal) handlePairSelect(item.key, rightVal);
                                }}
                                className={cn(
                                  "p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative",
                                  isSelected 
                                    ? "border-[#3B66F5] bg-blue-50/70 shadow-md ring-2 ring-[#3B66F5]/20 scale-[1.01]" 
                                    : pairedValue && palette
                                      ? `${palette.light} border-transparent shadow-xs`
                                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <span className={cn(
                                    "w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5",
                                    isSelected ? "bg-[#3B66F5] text-white" : "bg-slate-100 text-slate-600"
                                  )}>
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm sm:text-base text-slate-800 leading-snug">{item.label}</p>
                                    {pairedValue ? (
                                      <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/50">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-bold text-indigo-700">➔ Terhubung:</span>
                                          <span className="font-black text-xs sm:text-sm text-indigo-950 truncate max-w-[170px]">{pairedValue}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleUnpair(item.key);
                                          }}
                                          className="text-[11px] font-bold text-rose-600 hover:underline shrink-0 cursor-pointer"
                                        >
                                          Lepas
                                        </button>
                                      </div>
                                    ) : (
                                      <p className="text-[11px] font-semibold text-slate-400 mt-2">
                                        {isSelected ? '👉 Sekarang klik salah satu jawaban di kanan' : 'Belum dipasangkan (Klik untuk memilih)'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Kolom Kanan: Target */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Kolom Kanan (Jawaban)</span>
                            <span className="text-[11px] font-bold text-slate-400">Klik / Drag ke kiri</span>
                          </div>

                          {rightItems.map((rText, rIdx) => {
                            const assignedLeftKey = Object.keys(currentMatches).find(k => currentMatches[k] === rText);
                            const pairIdx = assignedLeftKey ? getPairIndex(assignedLeftKey) : -1;
                            const palette = pairIdx >= 0 ? colorPalettes[pairIdx % colorPalettes.length] : null;

                            return (
                              <div
                                key={rIdx}
                                draggable
                                onDragStart={(e) => e.dataTransfer.setData('text/plain', rText)}
                                onClick={() => {
                                  if (selectedMatchLeft) {
                                    handlePairSelect(selectedMatchLeft, rText);
                                  } else if (assignedLeftKey) {
                                    setSelectedMatchLeft(assignedLeftKey);
                                  }
                                }}
                                className={cn(
                                  "p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative select-none",
                                  assignedLeftKey && palette
                                    ? `${palette.light} border-transparent shadow-xs`
                                    : selectedMatchLeft
                                      ? "border-indigo-300 bg-white hover:border-[#3B66F5] hover:bg-blue-50/30 hover:scale-[1.01]"
                                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                                )}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                                      {String.fromCharCode(65 + rIdx)}
                                    </span>
                                    <p className="font-bold text-sm sm:text-base text-slate-800 leading-snug">{rText}</p>
                                  </div>
                                  {assignedLeftKey && (
                                    <span className={cn("text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0", palette?.badge || "bg-indigo-100 text-indigo-700")}>
                                      ✓ Terhubung
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest">
                      {currentQuestion.question_type === 'essay' ? 'Lembar Jawaban Essay / Uraian' : 'Jawaban Singkat'}
                    </label>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      ✓ Tersimpan otomatis
                    </span>
                  </div>
                  <textarea 
                    rows={currentQuestion.question_type === 'essay' ? 8 : 4}
                    className="w-full p-6 sm:p-8 rounded-[2rem] border-2 border-slate-200 bg-slate-50/60 focus:border-[#3B66F5] focus:bg-white outline-none transition-all font-medium text-base sm:text-lg text-[#1D4ED8] placeholder:text-slate-300 shadow-inner"
                    placeholder={currentQuestion.question_type === 'essay' 
                      ? "Ketikkan jawaban uraian / essay lengkap Anda secara terstruktur di sini..." 
                      : "Ketikkan jawaban singkat Anda di sini..."}
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  />
                  {currentQuestion.question_type === 'essay' && (
                    <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
                      <span>Hitungan: {(answers[currentQuestion.id] || '').trim() ? (answers[currentQuestion.id] || '').trim().split(/\s+/).length : 0} kata</span>
                      <span>{(answers[currentQuestion.id] || '').length} karakter</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 sm:gap-6 pt-2">
            <button 
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-xs sm:text-base text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all group cursor-pointer shadow-xs"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
              Sebelumnya
            </button>
            
            <div className="hidden sm:flex items-center gap-2">
              {questions.map((_, i) => (
                <div 
                  key={i}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === currentIndex ? "w-8 bg-blue-600" : answers[questions[i]?.id] ? "w-2 bg-emerald-400" : "w-2 bg-slate-200"
                  )}
                />
              ))}
            </div>

            {(() => {
              const isAllAnswered = questions.length > 0 && Object.keys(answers).length >= questions.length;
              const isLastQuestion = currentIndex === questions.length - 1;

              if (isAllAnswered && isLastQuestion) {
                return (
                  <button 
                    onClick={() => setShowSubmitConfirm(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold text-xs sm:text-base text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/30 border border-emerald-400/30 cursor-pointer animate-pulse"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Kirim Jawaban</span>
                  </button>
                );
              }

              if (isAllAnswered && !isLastQuestion) {
                return (
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none justify-end">
                    <button 
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-bold text-xs sm:text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
                    >
                      Selanjutnya
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button 
                      onClick={() => setShowSubmitConfirm(true)}
                      className="flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-4 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-emerald-500/30 border border-emerald-400/30 cursor-pointer animate-pulse"
                    >
                      <Send className="w-4 h-4" />
                      <span>Kirim</span>
                    </button>
                  </div>
                );
              }

              if (isLastQuestion) {
                return (
                  <button 
                    onClick={() => setShowSubmitConfirm(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-xs sm:text-base text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Kumpulkan</span>
                  </button>
                );
              }

              return (
                <button 
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-xs sm:text-base text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group cursor-pointer shadow-xs"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              );
            })()}
          </div>
        </div>

        {/* Removed duplicate sidebar from here */}
      </div>

      {/* Dynamic Lock Screen Overlay */}
      <AnimatePresence>
        {isBlocked && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center border border-red-100 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-red-500" />
              
              <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6 shadow-inner">
                <Lock className="w-10 h-10" />
              </div>
              
              {isPermanentlyBlocked ? (
                <>
                  <h3 className="text-2xl font-black text-[#1D4ED8] mb-3">Ujian Selesai!</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                    Akun Anda telah dinonaktifkan secara permanen karena melanggar aturan ujian (membuka tab/aplikasi lain) melewati batas toleransi yang ditentukan ({exam?.strict_limit} kali).
                  </p>
                  <p className="text-red-500 font-black text-sm uppercase tracking-wider mb-6 bg-red-50 py-3 rounded-2xl">
                    Nilai Ujian Anda: 0
                  </p>
                  <button 
                    onClick={() => {
                      localStorage.removeItem(`exam_session_${examCode}`);
                      navigate('/exam');
                    }}
                    className="w-full bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white py-4 rounded-full font-black hover:scale-[1.01] transition-all shadow-glow-loading flex items-center justify-center gap-2"
                  >
                    Kembali ke Menu
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-black text-[#1D4ED8] mb-3">Layar Terkunci!</h3>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                    Aktivitas mencurigakan terdeteksi (membuka tab/aplikasi lain). Silakan hubungi guru/pengawas untuk memasukkan kode bypass.
                  </p>
                  
                  <div className="space-y-4 text-left">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Kode Bypass Pengawas</label>
                      <input 
                        type="password" 
                        placeholder="Masukkan kode..." 
                        value={unlockCode}
                        onChange={(e) => {
                          setUnlockCode(e.target.value);
                          setUnlockError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleBypassUnlock();
                          }
                        }}
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition-all font-bold text-center tracking-widest text-[#1D4ED8] uppercase"
                      />
                      {unlockError && (
                        <p className="text-xs font-bold text-red-500 mt-2">
                          {unlockError}
                        </p>
                      )}
                    </div>
                    
                    <button 
                      onClick={handleBypassUnlock}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-full font-black transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 mt-4"
                    >
                      <Unlock className="w-5 h-5" />
                      Buka Kunci Ujian
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Forcing Overlay */}
      <AnimatePresence>
        {!isFullscreen && !isBlocked && !loading && (
          <div className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center border border-[#3B66F5]/20 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-2 bg-[#3B66F5]/50" />
              
              <div className="bg-[#3B66F5]/5 w-20 h-20 rounded-3xl flex items-center justify-center text-[#3B66F5] mx-auto mb-6 shadow-inner animate-pulse">
                <Maximize2 className="w-10 h-10" />
              </div>
              
              <h3 className="text-2xl font-black text-[#1D4ED8] mb-3">Wajib Layar Penuh!</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                {(!isFullscreenSupported || isIOSDevice)
                  ? 'Ujian ini memerlukan konsentrasi penuh. Mode layar telah disesuaikan secara khusus untuk browser perangkat Anda.'
                  : 'Untuk mencegah kecurangan, ujian ini wajib dikerjakan dalam mode layar penuh (fullscreen).'}
              </p>
              
              <button 
                onClick={async () => {
                  if (!isFullscreenSupported || isIOSDevice) {
                    setIsFullscreen(true);
                    return;
                  }
                  try {
                    const docEl = document.documentElement;
                    if (docEl.requestFullscreen) {
                      await docEl.requestFullscreen();
                    } else if ((docEl as any).webkitRequestFullscreen) {
                      await (docEl as any).webkitRequestFullscreen();
                    } else if ((docEl as any).mozRequestFullScreen) {
                      await (docEl as any).mozRequestFullScreen();
                    } else if ((docEl as any).msRequestFullscreen) {
                      await (docEl as any).msRequestFullscreen();
                    }
                    setIsFullscreen(true);
                  } catch (err) {
                    console.warn('Failed to enter fullscreen, using fallback:', err);
                    setIsFullscreen(true);
                  }
                }}
                className="w-full bg-gradient-to-r from-[#685ECC] via-[#5C53D4] to-[#4F46E5] text-white py-4 rounded-full font-black transition-all shadow-lg shadow-[#5C53D4]/25 hover:scale-[1.01] border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {(!isFullscreenSupported || isIOSDevice) ? 'Mulai Ujian Sekarang' : 'Masuk Mode Layar Penuh'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
