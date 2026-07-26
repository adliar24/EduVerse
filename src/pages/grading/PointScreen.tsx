import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, Users, QrCode, Search, Filter, 
  CheckSquare, Square, User, Minus
} from 'lucide-react';
// @ts-ignore
import jsQR from 'jsqr';
import { 
  Student, StudentPoint, MeetingScore, 
  PointTemplate
} from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Input, Modal,
  Header, Layout, PageTransition, useToast
} from '../Layout';
import { useTeacherProfile, useClasses } from '../../services/hooks';

// --- POINT SCREEN ---

export const PointScreen: React.FC = () => {
  const { showToast } = useToast();
  const { profile: teacherProfile } = useTeacherProfile();
  const { classes } = useClasses(teacherProfile?.activeSchoolId);
  
  const [activeTab, setActiveTab] = useState<'manual' | 'qr'>('manual');
  const [isScanning, setIsScanning] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [studentPoints, setStudentPoints] = useState<StudentPoint[]>([]);
  const [meetingScores, setMeetingScores] = useState<MeetingScore[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [pointForm, setPointForm] = useState({ amount: '', note: '', mode: 'add' as 'add' | 'deduct', source: 'manual' as 'manual' | 'qr' });
  const [pointTemplates, setPointTemplates] = useState<PointTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState(false);

  const fetchData = useCallback(async () => {
      const schoolId = teacherProfile?.activeSchoolId || null;
      const stds = await db.getStudents(undefined, schoolId || undefined);
      const pts = await db.getStudentPoints(undefined, schoolId || undefined);
      const scores = await db.getAllScores(schoolId || undefined);
      setAllStudents(stds);
      setStudentPoints(pts);
      setMeetingScores(scores);
      const templates = await db.getPointTemplates(schoolId || undefined);
      setPointTemplates(templates);
  }, [teacherProfile?.activeSchoolId, classes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync scan state to trigger fullscreen mode in parent Layout
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('scan_mode_change', { detail: { active: isScanning } }));
  }, [isScanning]);

  // Listen to stop scan event from Layout fullscreen exit button
  useEffect(() => {
    const handleStop = () => setIsScanning(false);
    window.addEventListener('stop_scan', handleStop);
    return () => window.removeEventListener('stop_scan', handleStop);
  }, []);

  const effectiveClassFilter = selectedClassFilter;

  const filteredStudents = allStudents.filter(std => {
      const matchName = std.nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = effectiveClassFilter ? std.idKelas === effectiveClassFilter : true;
      return matchName && matchClass;
  });

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedStudentIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedStudentIds(newSet);
  };

  const toggleSelectAll = () => {
      if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
          setSelectedStudentIds(new Set());
      } else {
          setSelectedStudentIds(new Set(filteredStudents.map(s => s.idSiswa)));
      }
  };

  const getStudentTotalPoints = (studentId: string) => {
    const manualPoints = studentPoints
      .filter(p => p.idSiswa === studentId)
      .reduce((sum, curr) => sum + curr.poin, 0);

    let starPoints = 0;
    if (teacherProfile?.konversiBintangAktif) {
        const totalStars = meetingScores
            .filter(s => s.idSiswa === studentId)
            .reduce((sum, curr) => sum + (curr.bintang || 0), 0);
        starPoints = totalStars * (teacherProfile.konversiBintangRate || 0);
    }
    return manualPoints + starPoints;
  };

  const handleSubmitPoint = async () => {
    if (!pointForm.amount) return;
    const amount = parseInt(pointForm.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Masukkan jumlah poin yang valid.", "warning");
      return;
    }
    const finalPoint = pointForm.mode === 'add' ? amount : -amount;
    const studentsToUpdate = Array.from(selectedStudentIds);
    const promises = studentsToUpdate.map((sid: string) => {
        const student = allStudents.find(s => s.idSiswa === sid);
        if(!student) return Promise.resolve();
        
        const classId = student.idKelas as string;

        return db.saveStudentPoint({
            id: crypto.randomUUID(),
            schoolId: teacherProfile?.activeSchoolId || '',
            idSiswa: sid,
            idKelas: classId,
            tanggal: new Date().toISOString(),
            poin: finalPoint,
            keterangan: pointForm.note || (pointForm.mode === 'add' ? 'Tambahan Poin' : 'Pengurangan Poin'),
            tipe: pointForm.source
        });
    });
    await Promise.all(promises);
    showToast("Poin berhasil diperbarui");
    await fetchData();
    setShowModal(false);
    setSelectedStudentIds(new Set());
    if(isScanning) setIsScanning(false);
  };

  const handleQrSubmit = (val: string) => {
    const found = allStudents.find(s => s.idSiswa === val || s.nama.toLowerCase() === val.toLowerCase());
    if (found) {
        setSelectedStudentIds(new Set([found.idSiswa]));
        setPointForm({ amount: '', note: '', mode: 'add', source: 'qr' });
        setShowModal(true);
        setIsScanning(false);
    } else {
        showToast(`Siswa dengan ID "${val}" tidak ditemukan.`, "error");
        setIsScanning(false);
    }
  };

  const playBeep = () => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    const startCamera = async () => {
        if (!isScanning) return;
        try {
            setCameraError('');
            const getStream = async () => {
                try {
                    return await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
                        audio: false
                    });
                } catch (e) {
                    return await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 640 }, height: { ideal: 480 } },
                        audio: false
                    });
                }
            };
            stream = await getStream();
            setHasPermission(true);
            const assignStream = () => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.muted = true;
                    videoRef.current.setAttribute("playsinline", "true");
                    videoRef.current.play().catch(e => console.error("Play error:", e));
                    animationFrameId = requestAnimationFrame(tick);
                } else if (isScanning) {
                    setTimeout(assignStream, 50);
                }
            };
            assignStream();
        } catch (err) {
            console.error(err);
            setHasPermission(false);
            setCameraError("Gagal akses kamera.");
        }
    };
    const tick = () => {
        if (!isScanning) return;
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" }) as unknown as { data: string } | null;
                if (code && code.data) {
                    playBeep();
                    handleQrSubmit(code.data);
                    return;
                }
            }
        }
        animationFrameId = requestAnimationFrame(tick);
    };
    if (isScanning) startCamera();
    return () => {
        if (stream) stream.getTracks().forEach(track => track.stop());
        cancelAnimationFrame(animationFrameId);
    };
  }, [isScanning]);

  const getClassName = (id: string) => classes.find(c => c.idKelas === id)?.namaKelas || '?';

  return (
    <Layout>
      <Header title="Poin Siswa" subtitle="Penghargaan & Hukuman" />
      <PageTransition className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 mb-2 min-h-[88px] items-stretch">
            <div className="bg-white p-2 rounded-[2rem] flex border border-slate-200 shadow-sm w-full md:w-auto md:min-w-[340px] shrink-0 self-start">
                <button 
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 py-5 px-6 rounded-full font-black uppercase tracking-widest text-xs transition-all cursor-pointer ${
                        activeTab === 'manual' 
                        ? 'bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white shadow-lg shadow-[#3B66F5]/25 transform scale-[1.02]' 
                        : 'text-slate-400 hover:bg-slate-50'
                    }`}
                >
                    Input Manual
                </button>
                <button 
                    onClick={() => setActiveTab('qr')}
                    className={`flex-1 py-5 px-6 rounded-full font-black uppercase tracking-widest text-xs transition-all cursor-pointer ${
                        activeTab === 'qr' 
                        ? 'bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white shadow-lg shadow-[#3B66F5]/25 transform scale-[1.02]' 
                        : 'text-slate-400 hover:bg-slate-50'
                    }`}
                >
                    Scan QR
                </button>
            </div>
            {activeTab === 'manual' && selectedStudentIds.size > 0 ? (
                <div className="flex-1 bg-slate-800 text-white rounded-[2rem] p-3 pl-8 shadow-xl flex items-center justify-between animate-enter border border-slate-700/50">
                     <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Siswa Terpilih</span>
                        <div className="flex items-center gap-3">
                             <span className="text-3xl font-black leading-none">{selectedStudentIds.size}</span>
                             <div className="h-8 w-px bg-slate-600 mx-2 hidden sm:block"></div>
                             <span className="text-xs text-slate-400 hidden sm:inline-block max-w-[120px] leading-tight">Siap diberi poin</span>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button 
                            onClick={() => { setPointForm({...pointForm, mode: 'add', source: 'manual'}); setShowModal(true); }}
                            className="bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] hover:brightness-110 text-white h-14 px-6 rounded-full font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 shadow-lg shadow-[#3B66F5]/25 border border-white/10 active:scale-95 group cursor-pointer"
                        >
                            <Plus size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" /> <span className="hidden sm:inline">Tambah</span>
                        </button>
                        <button 
                            onClick={() => { setPointForm({...pointForm, mode: 'deduct', source: 'manual'}); setShowModal(true); }}
                            className="bg-red-500 hover:bg-red-400 text-white h-14 px-6 rounded-full font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 shadow-lg shadow-red-900/20 active:scale-95 group cursor-pointer"
                        >
                            <Minus size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" /> <span className="hidden sm:inline">Kurang</span>
                        </button>
                     </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 border-2 border-dashed border-slate-200 rounded-[2rem] items-center justify-center text-slate-300 font-black text-xs uppercase tracking-widest">
                    {activeTab === 'manual' ? 'Pilih siswa untuk aksi massal' : 'Gunakan kamera untuk scan'}
                </div>
            )}
        </div>
        {activeTab === 'manual' ? (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <input 
                            type="text" 
                            placeholder="Cari nama siswa..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white pl-12 pr-6 py-4 rounded-[1.5rem] border border-slate-200 outline-none focus:border-[#3B66F5] focus:ring-4 focus:ring-[#3B66F5]/5 transition-all font-bold text-slate-700"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    </div>
                    <div className="md:w-64 relative">
                        <select 
                             value={effectiveClassFilter} 
                             onChange={(e) => setSelectedClassFilter(e.target.value)}
                             className="w-full bg-white pl-12 pr-10 py-4 rounded-[1.5rem] border border-slate-200 outline-none focus:border-[#3B66F5] focus:ring-4 focus:ring-[#3B66F5]/5 transition-all font-bold text-slate-700 appearance-none cursor-pointer"
                        >
                            <option value="">Semua Kelas</option>
                            {classes.map(c => <option key={c.idKelas} value={c.idKelas}>{c.namaKelas}</option>)}
                        </select>
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                             <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>
                <div className="flex justify-between items-center px-2">
                    <button onClick={toggleSelectAll} className="flex items-center gap-3 text-slate-500 hover:text-[#3B66F5] transition-colors font-bold text-sm group">
                        {filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length ? (
                            <CheckSquare className="text-[#3B66F5] group-hover:scale-110 transition-transform" />
                        ) : (
                            <Square className="group-hover:scale-110 transition-transform" />
                        )}
                        <span className="uppercase tracking-wide text-xs">Tandai Semua</span>
                    </button>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">{filteredStudents.length} Siswa Ditemukan</div>
                </div>
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden min-h-[300px]">
                    {filteredStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <Users size={48} className="text-slate-300 mb-4" />
                            <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">Tidak ada data siswa</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredStudents.map(std => {
                                const isSelected = selectedStudentIds.has(std.idSiswa);
                                const points = getStudentTotalPoints(std.idSiswa);
                                return (
                                    <div 
                                        key={std.idSiswa}
                                        onClick={() => toggleSelection(std.idSiswa)}
                                        className={`p-5 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-[#3B66F5]/5/50' : ''}`}
                                    >
                                        <div className={`shrink-0 transition-colors ${isSelected ? 'text-[#3B66F5]' : 'text-slate-300'}`}>
                                            {isSelected ? <CheckSquare size={24} /> : <Square size={24} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className={`font-black uppercase truncate text-sm md:text-base ${isSelected ? 'text-[#3B66F5]' : 'text-slate-700'}`}>{std.nama}</h4>
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200 whitespace-nowrap">
                                                    {getClassName(std.idKelas)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                <User size={12} /> ID: {std.idSiswa}
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-xl font-black text-sm tabular-nums border ${points >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                            {points > 0 ? `+${points}` : points} <span className="text-[10px] ml-1">PT</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="py-10">
                <button 
                    onClick={() => setIsScanning(true)}
                    className="w-full max-w-sm mx-auto aspect-square rounded-full border-4 border-dashed border-slate-200 flex flex-col items-center justify-center gap-6 hover:bg-white hover:border-[#3B66F5] hover:scale-105 active:scale-95 transition-all group bg-slate-50"
                >
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all">
                        <QrCode size={48} className="text-slate-400 group-hover:text-[#3B66F5] transition-colors" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-black text-xl text-slate-700 uppercase tracking-wide group-hover:text-[#3B66F5] transition-colors">Klik Disini</h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Untuk Memindai QR Code</p>
                    </div>
                </button>
            </div>
        )}
      </PageTransition>

      {/* MODAL SCANNER QR */}
      <Modal 
        isOpen={isScanning} 
        onClose={() => setIsScanning(false)} 
        title="Scan QR Siswa"
        fullScreen
      >
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-white overflow-hidden -mt-20">
           {/* Camera Container */}
           <div className="relative w-full max-w-sm aspect-square rounded-[3rem] overflow-hidden border-8 border-slate-100 shadow-2xl">
              <video 
                ref={videoRef} 
                muted
                playsInline
                className="w-full h-full object-cover" 
              />
              <canvas 
                ref={canvasRef} 
                className="hidden" 
              />
              
              <div className="absolute inset-0 pointer-events-none">
                 <div className="absolute inset-[40px] border-2 border-[#3B66F5]/20 rounded-2xl">
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-[#3B66F5] rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-[#3B66F5] rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-[#3B66F5] rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-[#3B66F5] rounded-br-xl"></div>
                    
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8]/40 shadow-[0_0_15px_rgba(15,82,186,0.3)] animate-scan"></div>
                 </div>
              </div>
           </div>
           
           <div className="mt-12 text-center px-8">
              <h3 className="font-black text-2xl text-slate-800 uppercase tracking-wider mb-2">Arahkan Kamera</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Posisikan QR Code di dalam kotak</p>
           </div>

           {cameraError && (
             <div className="mt-8 px-8 w-full max-w-sm">
                <div className="bg-red-50 p-4 rounded-2xl text-red-500 text-center font-bold text-xs uppercase tracking-widest border border-red-100">
                   {cameraError}
                </div>
             </div>
           )}

           <Button 
             variant="secondary" 
             onClick={() => setIsScanning(false)}
             className="mt-12 !bg-slate-100 !text-slate-600 !border-none hover:!bg-slate-200 !px-12 !py-4 font-black uppercase tracking-widest text-xs transition-all"
           >
             Batalkan Pemindaian
           </Button>
        </div>
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Input Poin">
         <div className="py-2 space-y-8">
            <div className="text-center">
               <h3 className="text-xl font-black text-slate-800 uppercase leading-none mb-2">
                   {selectedStudentIds.size > 1 ? `${selectedStudentIds.size} Siswa Terpilih` : 'Kelola Poin Siswa'}
               </h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                   {pointForm.mode === 'add' ? 'Menambahkan Reward' : 'Memberikan Sanksi'}
               </p>
            </div>
            <div className={`p-4 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm ${pointForm.mode === 'add' ? 'bg-[#3B66F5]/5 text-[#3B66F5]' : 'bg-red-50 text-red-600'}`}>
                {pointForm.mode === 'add' ? <Plus size={20} /> : <Minus size={20} />}
                {pointForm.mode === 'add' ? 'Tambah Poin' : 'Kurangi Poin'}
            </div>
            <div className="relative">
                <Input 
                   autoFocus
                   type="number" 
                   placeholder="0" 
                   value={pointForm.amount} 
                   onChange={e => setPointForm({...pointForm, amount: e.target.value})}
                   className={`!text-center !text-5xl !py-8 !h-auto !font-black ${pointForm.mode === 'add' ? 'text-[#3B66F5] border-[#3B66F5]/20 focus:border-blue-300 focus:ring-blue-100' : 'text-red-600 border-red-100 focus:border-red-300 focus:ring-red-100'}`}
                />
            </div>

            {pointTemplates.length > 0 && (
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Template Kilat</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {pointTemplates.filter(t => t.type === (pointForm.mode === 'add' ? 'positive' : 'negative')).map(t => (
                            <button 
                                key={t.id}
                                onClick={() => {
                                    setPointForm({
                                        ...pointForm,
                                        amount: Math.abs(t.amount).toString(),
                                        note: t.title
                                    });
                                }}
                                className={`px-4 py-2.5 rounded-full border-2 font-bold text-[11px] uppercase tracking-wide transition-all active:scale-95 ${pointForm.mode === 'add' ? 'border-[#3B66F5]/20 text-[#3B66F5] bg-[#3B66F5]/5/30 hover:bg-[#3B66F5]/5' : 'border-red-100 text-red-600 bg-red-50/30 hover:bg-red-50'}`}
                            >
                                {t.title} ({t.amount > 0 ? `+${t.amount}` : t.amount})
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <Input 
              label="KETERANGAN (OPSIONAL)" 
              placeholder={pointForm.mode === 'add' ? 'Contoh: Keaktifan, Prestasi...' : 'Contoh: Terlambat, Atribut...'}
              value={pointForm.note}
              onChange={e => setPointForm({...pointForm, note: e.target.value})}
            />
            <Button onClick={handleSubmitPoint} className={`w-full py-5 font-black uppercase tracking-widest shadow-lg ${pointForm.mode === 'add' ? 'bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] hover:brightness-110 shadow-[#3B66F5]/25 border border-white/10' : 'bg-red-500 hover:bg-red-600 shadow-red-200'}`}>
               SIMPAN
            </Button>
         </div>
      </Modal>
    </Layout>
  );
};
