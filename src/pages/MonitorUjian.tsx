import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Activity,
  UserX,
  RefreshCw,
  Search,
  Unlock,
  ShieldAlert,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSchool } from '../context/SchoolContext';

export default function MonitorUjian() {
  useDocumentTitle('Live Monitor');
  const { examId } = useParams();
  const navigate = useNavigate();
  const { activeSchool } = useSchool();
  
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  // Realtime States
  const [onlineParticipants, setOnlineParticipants] = useState<Record<string, any>>({});
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  
  // Refs for channel cleanup
  const roomChannelRef = useRef<any>(null);
  const participantsChannelRef = useRef<any>(null);
  
  // Combined useEffect for data fetching and realtime subscriptions
  useEffect(() => {
    if (!examId) return;
    
    // Cleanup previous channels
    if (roomChannelRef.current) {
      supabase.removeChannel(roomChannelRef.current);
      roomChannelRef.current = null;
    }
    if (participantsChannelRef.current) {
      supabase.removeChannel(participantsChannelRef.current);
      participantsChannelRef.current = null;
    }
    
    fetchSessions();
  }, [examId, activeSchool]);

  // Fetch class students when session is selected
  useEffect(() => {
    if (!selectedSession || !examId) return;
    
    // Cleanup previous channel
    if (participantsChannelRef.current) {
      supabase.removeChannel(participantsChannelRef.current);
      participantsChannelRef.current = null;
    }
    
    fetchExamAndParticipants();
  }, [selectedSession, examId]);

  const fetchSessions = async () => {
    if (!examId) return;
    const { data } = await supabase
      .from('exam_sessions')
      .select('id, class_name, class_id, started_at, is_active, expected_students')
      .eq('exam_id', examId)
      .eq('is_active', true)
      .order('started_at', { ascending: false });
    setSessions(data || []);
    
    // Auto-select first session if none selected
    if (data && data.length > 0 && !selectedSession) {
      setSelectedSession(data[0].id);
      setSelectedClassId(data[0].class_id || '');
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
    if (!examId) return;
    
    if (showLoading) setLoading(true);
    try {
      // Get exam details
      console.log('Fetching exam and participants for examId:', examId);
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*, exam_questions(questions(*, question_options(*)))')
        .eq('id', examId)
        .maybeSingle();
        
      console.log('Exam fetched:', examData, 'error:', examError);
      if (examError || !examData) {
        console.error('Exam not found:', examError);
        navigate('/daftar-ujian');
        return;
      }
      setExam(examData);

      // Fetch class students for offline tracking
      const currentSession = sessions.find(s => s.id === selectedSession);
      if (currentSession?.class_id) {
        fetchClassStudents(currentSession.class_id);
      }

      // Subscribe to Presence - using exam UUID from examId
      const room = supabase.channel(`exam_room_${examId}`);
      
      // Function to update presence only (lighter)
      const updateOnlineFromPresence = () => {
        const newState = room.presenceState();
        const currentOnline: Record<string, any> = {};
        
        Object.keys(newState).forEach(key => {
          const presences = newState[key] as any[];
          if (presences.length > 0) {
            const p = presences[presences.length - 1];
            const pid = p.participantId || p.participant_id;
            if (pid && p.type !== 'monitor') {
              currentOnline[pid] = {
                ...p,
                name: p.name || p.student_name,
                class: p.class || p.student_class,
                violations: p.violations || 0
              };
            }
          }
        });
        
        console.log('Presence sync - online:', Object.keys(currentOnline));
        setOnlineParticipants(currentOnline);
      };

      room
        .on('presence', { event: 'sync' }, updateOnlineFromPresence)
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            room.track({ type: 'monitor', timestamp: Date.now() });
            updateOnlineFromPresence();
          }
        });

      roomChannelRef.current = room;

      // Initial fetch - ONLY from current active session
      console.log('Fetching participants for examId:', examId, 'sessionId:', selectedSession);
      
      let query = supabase
        .from('participants')
        .select('*, exam_sessions(class_name)')
        .eq('exam_id', examId);
      
      // Filter by selected session ONLY
      if (selectedSession) {
        query = query.eq('session_id', selectedSession);
      }
      
      const { data: participantsData, error: participantsError } = await query.order('start_time', { ascending: false });
        
      console.log('Participants fetched:', participantsData?.length, 'error:', participantsError);
      setAllParticipants(participantsData || []);

      // Refresh when database changes (only for current session)
      const participantsChannel = supabase
        .channel(`participants_changes_${selectedSession}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'participants',
            filter: `session_id=eq.${selectedSession}`
          },
          () => {
            console.log('Database change detected, refreshing...');
            supabase
              .from('participants')
              .select('*, exam_sessions(class_name)')
              .eq('session_id', selectedSession)
              .order('start_time', { ascending: false })
              .then(({ data }) => {
                if (data) setAllParticipants(data);
              });
          }
        )
        .subscribe();

      participantsChannelRef.current = participantsChannel;

    } catch (err) {
      console.error(err);
      navigate('/daftar-ujian');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    fetchExamAndParticipants();
  };

  const handleUnlockParticipant = async (participantId: string, participantName: string) => {
    const confirmed = window.confirm(`Apakah Anda yakin ingin membuka kunci akun ${participantName}? Peserta akan bisa login kembali dan melanjutkan ujian dari posisi terakhir.`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('participants')
        .update({
          is_locked: false,
          violations: 0,
          status: 'ongoing',
          lock_reason: null
        })
        .eq('id', participantId);

      if (error) throw error;

      fetchExamAndParticipants();
      alert(`Akun ${participantName} berhasil dibuka!`);
    } catch (err) {
      console.error('Error unlocking participant:', err);
      alert('Gagal membuka kunci akun. Silakan coba lagi.');
    }
  };

  // Memoize filtered participants - MUST be before any early returns
  const filteredParticipants = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const participantNames = new Set(allParticipants.map(p => p.name.toLowerCase()));
    
    // Combine active participants with students who haven't joined
    const allDisplayData: any[] = [
      ...allParticipants.map(p => ({
        ...p,
        isFromClass: true,
        hasJoined: true
      })),
      ...classStudents
        .filter(cs => !participantNames.has(cs.name.toLowerCase()))
        .map(cs => ({
          id: cs.id,
          name: cs.name,
          class: '',
          status: 'not_started',
          hasJoined: false,
          isFromClass: true
        }))
    ];
    
    return allDisplayData.filter(p => 
      (p.name || '').toLowerCase().includes(term) || 
      (p.class || '').toLowerCase().includes(term)
    );
  }, [allParticipants, classStudents, searchTerm]);

  // Memoize counts - MUST be before any early returns
  const { onlineCount, completedCount, offlineCount, notStartedCount, totalCount } = useMemo(() => {
    const online = Object.keys(onlineParticipants).length;
    const completed = allParticipants.filter(p => p.status === 'completed').length;
    const participated = allParticipants.length;
    const classStudentCount = classStudents.length;
    
    // Not started = class students - those who have joined
    const notStarted = Math.max(0, classStudentCount - participated);
    
    // Offline = those who joined but currently not online
    const participatedNotOnline = participated - completed - online;
    const offline = Math.max(0, participatedNotOnline);
    
    return { 
      onlineCount: online, 
      completedCount: completed, 
      offlineCount: offline,
      notStartedCount: notStarted,
      totalCount: participated + notStarted
    };
  }, [onlineParticipants, allParticipants, classStudents]);

  // Early return for loading state - AFTER hooks
  if (loading) return (
    <div className="min-h-screen pt-20 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      <p className="text-slate-500 font-medium">Memuat data real-time...</p>
    </div>
  );

  const calculateStatus = (participant: any) => {
    if (!participant.hasJoined) {
      return { type: 'not_started', label: 'Belum Masuk', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-300', icon: UserPlus };
    }
    
    if (participant.status === 'completed' || participant.status === 'selesai') {
      return { type: 'completed', label: 'Selesai', color: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500', icon: CheckCircle2 };
    }

    if (participant.is_locked === true || participant.status === 'blocked') {
      return { type: 'blocked', label: 'Terblokir', color: 'bg-red-100 text-red-600', dot: 'bg-red-500', icon: ShieldAlert };
    }
    
    const presenceData = onlineParticipants[participant.id];
    const isOnline = !!presenceData;
    
    if (isOnline) {
      const vios = presenceData?.violations || participant.violations || 0;
      
      if (vios > 0) {
        return { type: 'warning', label: 'Terdeteksi Keluar Halaman', color: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500 animate-pulse', icon: AlertTriangle, violations: vios };
      }
      return { type: 'online', label: 'Sedang Mengerjakan', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500 animate-pulse', icon: Activity };
    }
    
    return { type: 'offline', label: 'Keluar / Offline', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400', icon: UserX };
  };

  return (
    <div className="space-y-6 pb-10 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/daftar-ujian')}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-950 hover:bg-slate-50 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-indigo-950 tracking-tight flex items-center gap-3">
              Live Monitoring 
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </h2>
            <p className="text-slate-500 text-sm font-medium">{exam?.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {sessions.length > 0 && (
              <div className="px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-sm font-bold text-indigo-700">
                {sessions[0].class_name}
              </div>
          )}
          <button 
            onClick={handleManualRefresh}
            className="bg-white text-indigo-950 border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
            <p className="text-2xl font-black text-indigo-950">{totalCount}</p>
          </div>
        </div>
        
        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Aktif</p>
            <p className="text-2xl font-black text-blue-700">{onlineCount}</p>
          </div>
        </div>

        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Selesai</p>
            <p className="text-2xl font-black text-emerald-700">{completedCount}</p>
          </div>
        </div>

        <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-slate-400"></div>
          <div className="bg-slate-200 p-3 rounded-xl text-slate-600">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Offline</p>
            <p className="text-2xl font-black text-slate-700">{offlineCount}</p>
          </div>
        </div>

        <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-amber-400"></div>
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Belum Masuk</p>
            <p className="text-2xl font-black text-amber-700">{notStartedCount}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Cari nama peserta atau kelas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
        />
      </div>

      {/* Participants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredParticipants.map((p, idx) => {
            const status = calculateStatus(p);
            const PIcon = status.icon;

            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-all",
                  status.type === 'warning' ? "border-amber-200" : 
                  status.type === 'blocked' ? "border-red-200" : "border-slate-100"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-indigo-950 text-base mb-1 line-clamp-1" title={p.name}>{p.name}</h4>
                    <p className="text-xs font-semibold text-slate-400">{p.class}</p>
                  </div>
                  <div className={cn("p-2 rounded-lg shrink-0", status.color)}>
                    <PIcon className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-auto space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", status.dot)} />
                    <span className={cn("text-xs font-bold", status.color.split(' ')[1])}>
                      {status.label}
                    </span>
                  </div>
                  
                  {status.type === 'warning' && (
                    <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-[10px] font-bold flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Telah keluar tab {status.violations} kali
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Masuk:</span>
                    <span className="text-slate-500">{new Date(p.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  {status.type === 'completed' && p.end_time && (
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Selesai:</span>
                      <span className="text-emerald-600">{new Date(p.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}

                  {status.type === 'blocked' && (
                    <button
                      onClick={() => handleUnlockParticipant(p.id, p.name)}
                      className="w-full mt-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-red-100 transition-colors"
                    >
                      <Unlock className="w-3 h-3" />
                      Buka Kunci Akun
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredParticipants.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Belum ada peserta yang sesuai dengan pencarian.</p>
          </div>
        )}
      </div>
    </div>
  );
}
