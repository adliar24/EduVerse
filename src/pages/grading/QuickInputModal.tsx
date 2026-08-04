import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, FileText, Camera, Save } from 'lucide-react';
import { 
  ClassData, Student, AssessmentCategory 
} from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Select, Input, Modal
} from '../Layout';

export const QuickInputModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const [classes, setClasses] = useState<ClassData[]>([]);
    const [selectedIdKelas, setSelectedIdKelas] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [label, setLabel] = useState('');
    const [type, setType] = useState<AssessmentCategory>('Formatif');
    const [scores, setScores] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);
    
    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    // OCR State
    const [ocrMode, setOcrMode] = useState<'none' | 'manual' | 'camera'>('none');
    const [ocrImage, setOcrImage] = useState<string | null>(null);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrStatus, setOcrStatus] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ocrInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            db.getClasses().then(data => {
                setClasses(data);
                if (data.length > 0 && !selectedIdKelas) {
                    setSelectedIdKelas(data[0].idKelas);
                }
            });
        }
    }, [isOpen, selectedIdKelas]);

    useEffect(() => {
        if (selectedIdKelas) {
            db.getStudents(selectedIdKelas).then(setStudents);
        } else {
            setStudents([]);
        }
    }, [selectedIdKelas]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'id-ID';

            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const speechResult = event.results[i][0].transcript.toLowerCase();
                    if (event.results[i].isFinal) {
                        processVoiceCommand(speechResult);
                        setTranscript('');
                    } else {
                        interimTranscript = speechResult;
                    }
                }
                setTranscript(interimTranscript);
            };

            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);
            recognitionRef.current = recognition;
        }
    }, [students]);

    const processVoiceCommand = (text: string) => {
        const rawText = text.toLowerCase();
        const numberMatch = rawText.match(/\d+/);
        let scoreVal: number | null = null;
        
        if (numberMatch) {
            scoreVal = parseInt(numberMatch[0]);
        } else {
            const numberMap: Record<string, number> = {
                'nol': 0, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
                'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
                'seratus': 100, 'kosong': 0, 'delapan puluh': 80, 'tujuh puluh': 70
            };
            Object.keys(numberMap).forEach(key => {
                if (rawText.includes(key)) scoreVal = numberMap[key];
            });
        }

        if (scoreVal !== null) {
            let bestMatch: Student | null = null;
            let maxScore = 0;

            students.forEach(s => {
                const nameParts = s.nama.toLowerCase().split(' ');
                let currentScore = 0;
                nameParts.forEach(part => {
                    if (part.length > 2 && rawText.includes(part)) currentScore += part.length;
                });
                if (currentScore > maxScore) {
                    maxScore = currentScore;
                    bestMatch = s;
                }
            });

            if (bestMatch && maxScore >= 3) {
                setScores(prev => ({ ...prev, [bestMatch!.idSiswa]: scoreVal! }));
                setTranscript(`Mencatat: ${bestMatch.nama.split(' ')[0]} = ${scoreVal}`);
            }
        }
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Maaf, browser Anda tidak mendukung fitur suara.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setShowCamera(true);
            }
        } catch (err) {
            alert("Gagal mengakses kamera: " + err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setShowCamera(false);
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            setOcrImage(dataUrl);
            setShowCamera(false);
            stopCamera();
        }
    };

    const processOCR = async () => {
        if (!ocrImage) return;
        setOcrStatus('Memproses OCR...');
        setOcrProgress(0);
        try {
            // @ts-ignore - tesseract.js ships without bundled type declarations
            const { default: Tesseract } = await import('tesseract.js');
            const { data: { text } } = await Tesseract.recognize(ocrImage, 'ind+eng', {
                logger: (m: any) => {
                    if (m.status === 'recognizing text') setOcrProgress(Math.round(m.progress * 100));
                }
            });
            setOcrStatus('Mengurai data...');
            const lines = text.split('\n').filter((l: string) => l.trim());
            const parsedScores: Record<string, number> = {};
            lines.forEach((line: string) => {
                const nameMatch = line.match(/^([A-Za-z\s]+?)[\s,]+(\d{1,3})$/);
                if (nameMatch) {
                    const nama = nameMatch[1].trim().toLowerCase();
                    const nilai = parseInt(nameMatch[2]);
                    students.forEach(s => {
                        const studentName = s.nama.toLowerCase();
                        if (studentName.includes(nama) || nama.includes(studentName.split(' ')[0])) parsedScores[s.idSiswa] = nilai;
                    });
                }
            });
            if (Object.keys(parsedScores).length > 0) {
                setScores(prev => ({ ...prev, ...parsedScores }));
                setOcrStatus(`${Object.keys(parsedScores).length} nilai terbaca!`);
            } else setOcrStatus('Tidak ada data terbaca. Coba lagi.');
        } catch (err) {
            setOcrStatus('Gagal memproses: ' + err);
        }
    };

    const handleSave = async () => {
        if (!selectedIdKelas || !label.trim()) {
            alert("Pilih kelas dan isi keterangan nilai.");
            return;
        }
        setIsLoading(true);
        try {
            const meetingId = crypto.randomUUID();
            const now = new Date().toISOString();
            const cls = classes.find(c => c.idKelas === selectedIdKelas);
            const prof = await db.getTeacherProfile();
            const schoolId = prof?.activeSchoolId || '';
            await db.saveMeeting({
                idPertemuan: meetingId,
                schoolId,
                idKelas: selectedIdKelas,
                mapel: cls?.mapel || '',
                semester: prof?.semester || '1',
                urutanKe: 0,
                tanggal: now,
                materi: label.trim(),
                activityType: 'Kuis',
                activityName: label.trim(),
                assessmentCategory: type,
                aspekPenilaian: 'Pengetahuan'
            });
            for (const idSiswa of Object.keys(scores)) {
                await db.saveScore({
                    id: meetingId + '_' + idSiswa,
                    schoolId,
                    idPertemuan: meetingId,
                    idSiswa: idSiswa,
                    nilaiAngka: scores[idSiswa],
                    bintang: 0,
                    lastUpdated: Date.now()
                });
            }
            alert("Nilai berhasil disimpan kilat!");
            setLabel('');
            setScores({});
            onClose();
        } catch (err) {
            alert("Gagal menyimpan nilai.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Input Nilai Kilat" fullScreen>
            <div className="flex flex-col h-full overflow-hidden bg-white md:bg-transparent">
                <div className="p-5 md:p-8 space-y-4 md:space-y-6 bg-white border-b border-slate-100 shadow-sm z-20">
                    <div className="w-full">
                        <Select label="PILIH KELAS" value={selectedIdKelas} onChange={e => setSelectedIdKelas(e.target.value)}>
                            {classes.length === 0 && <option value="">Belum ada kelas</option>}
                            {classes.map(c => <option key={c.idKelas} value={c.idKelas}>{c.namaKelas} - {c.mapel}</option>)}
                        </Select>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-4 md:gap-5 items-end">
                        <div className="flex-[2] w-full">
                            <Input label="KETERANGAN NILAI" placeholder="Contoh: Kuis 1, Tugas Bab 2, dll" value={label} onChange={e => setLabel(e.target.value)} />
                        </div>
                        <div className="flex-[2] w-full">
                            <Select label="KATEGORI" value={type} onChange={e => setType(e.target.value as AssessmentCategory)}>
                                <option value="Formatif">FORMATIF (Harian)</option>
                                <option value="Sumatif">SUMATIF (Ujian/Besar)</option>
                            </Select>
                        </div>
                        <div className="flex-none w-full lg:w-auto">
                            <Button variant="primary" className="w-full lg:w-48 py-3.5 md:py-4 shadow-xl uppercase tracking-widest text-[10px] md:text-[11px] font-black" onClick={handleSave} isLoading={isLoading}>
                                Simpan <Save size={16} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-50/30 p-5 md:p-8 custom-scrollbar">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 px-5 md:px-8 py-3 md:py-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2 md:gap-3">
                            <div className="flex items-center gap-2 md:gap-3">
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500">Daftar Input</span>
                                {isListening && (
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500 text-white rounded-full animate-pulse shadow-lg shadow-red-500/20">
                                        <div className="w-1 h-1 bg-white rounded-full animate-ping" />
                                        <span className="text-[7px] font-black uppercase tracking-widest">Mic Aktif</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <button onClick={toggleListening} className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 transition-all ${isListening ? 'bg-red-500 border-red-400 text-white shadow-xl scale-105' : 'bg-white border-slate-200 text-slate-600 hover:border-[#3B66F5] shadow-sm'}`}>
                                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                                    <span className="text-[8px] font-black uppercase tracking-widest">{isListening ? 'Stop' : 'Suara'}</span>
                                </button>
                                <button onClick={() => ocrMode === 'manual' ? setOcrMode('none') : setOcrMode('manual')} className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 transition-all ${ocrMode !== 'none' ? 'bg-purple-500 border-purple-400 text-white shadow-xl' : 'bg-white border-slate-200 text-slate-600 hover:border-purple-400 shadow-sm'}`}>
                                    <FileText size={14} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">OCR</span>
                                </button>
                            </div>
                        </div>
                        {ocrMode === 'camera' && (
                            <div className="relative bg-black rounded-2xl overflow-hidden mx-8 mt-4">
                                <video ref={videoRef} autoPlay playsInline className="w-full" />
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                    <button onClick={() => { setOcrMode('none'); stopCamera(); }} className="px-6 py-3 bg-red-500 text-white rounded-full font-black text-[10px] uppercase">Batal</button>
                                    <button onClick={captureImage} className="px-6 py-3 bg-white text-purple-600 rounded-full font-black text-[10px] uppercase"><Camera size={18} className="inline mr-2" />Ambil Foto</button>
                                </div>
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                        )}
                        {ocrMode === 'manual' && !ocrImage && (
                            <div className="p-8 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50" onClick={() => ocrInputRef.current?.click()}>
                                        <FileText size={32} className="mx-auto text-slate-400 mb-2" />
                                        <p className="text-[10px] font-bold text-slate-500">Pilih dari Galeri</p>
                                    </div>
                                    <div className="border-2 border-dashed border-purple-300 bg-purple-50 rounded-2xl p-6 text-center cursor-pointer hover:bg-purple-100" onClick={() => { setOcrMode('camera'); startCamera(); }}>
                                        <Camera size={32} className="mx-auto text-purple-500 mb-2" />
                                        <p className="text-[10px] font-bold text-purple-600">Buka Kamera</p>
                                    </div>
                                </div>
                                <input type="file" ref={ocrInputRef} accept="image/*" className="hidden" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => setOcrImage(ev.target?.result as string);
                                        reader.readAsDataURL(file);
                                    }
                                }} />
                            </div>
                        )}
                        {ocrImage && ocrMode !== 'camera' && (
                            <div className="p-8 space-y-4">
                                <img src={ocrImage} alt="OCR" className="w-full rounded-2xl border border-slate-200 max-h-64 object-contain" />
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => { setOcrImage(null); setOcrProgress(0); }} className="flex-1">Ganti Foto</Button>
                                    <Button onClick={processOCR} isLoading={ocrProgress > 0 && ocrProgress < 100} className="flex-1">{ocrProgress > 0 ? ocrProgress + '%' : 'Proses OCR'}</Button>
                                </div>
                                {ocrStatus && <p className="text-[10px] text-center font-bold">{ocrStatus}</p>}
                            </div>
                        )}
                        {isListening && transcript && (
                            <div className="bg-[#3B66F5]/5/50 px-8 py-3 border-b border-[#3B66F5]/20/50 italic text-sm text-[#3B66F5] font-bold animate-fade flex items-center gap-3">
                                <div className="w-2 h-2 bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] rounded-full animate-bounce"/> "{transcript}..."
                            </div>
                        )}
                        <div className="divide-y divide-slate-100">
                            {students.length === 0 ? (
                                <div className="p-20 text-center text-slate-400 italic font-black uppercase text-[10px] tracking-[0.2em] opacity-40">Silakan Pilih kelas di atas.</div>
                            ) : (
                                students.map((s, idx) => (
                                    <div key={s.idSiswa} className="px-6 md:px-10 py-4 md:py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <span className="text-slate-300 font-black text-[9px] w-6 tabular-nums">{idx + 1}.</span>
                                            <p className="font-black text-slate-700 uppercase tracking-wide text-[13px] md:text-sm">{s.nama}</p>
                                        </div>
                                        <div className="w-24 md:w-28">
                                            <input type="number" className="w-full text-center bg-white border-2 border-slate-100 rounded-2xl px-3 py-2.5 font-black text-slate-800 text-base focus:border-[#3B66F5] outline-none" placeholder="0" value={scores[s.idSiswa] || ''} onChange={e => setScores({ ...scores, [s.idSiswa]: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
