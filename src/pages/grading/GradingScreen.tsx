import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Mic, MicOff, FileText, Download, Upload, 
  Camera, CheckSquare, Square, Loader2
} from 'lucide-react';
import { Student, Meeting, MeetingScore } from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Modal,
  Header, Layout, PageTransition, useToast
} from '../Layout';
import { useTeacherProfile } from '../../services/hooks';

export const GradingScreen: React.FC = () => {
  const { idPertemuan } = useParams();
  const { showToast } = useToast();
  const { profile } = useTeacherProfile();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, MeetingScore>>({});
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [bulkScore, setBulkScore] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const ocrInputRef = useRef<HTMLInputElement>(null);

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !students.length) return;
    
    setIsImporting(true);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<{ Nama?: string; Nilai?: number }>(sheet);
      
      const studentMap = new Map<string, string>(students.map(s => [s.nama.toLowerCase().trim(), s.idSiswa]));
      let imported = 0;
      
      for (const row of rows) {
        const nama = row.Nama?.toString().toLowerCase().trim();
        if (nama && studentMap.has(nama)) {
          const idSiswa = studentMap.get(nama)!;
          const nilai = row.Nilai ?? null;
          if (nilai !== null && !isNaN(nilai)) {
            const existing = scores[idSiswa] || {
              id: `${idPertemuan}_${idSiswa}`, idPertemuan: idPertemuan!, idSiswa, nilaiAngka: null, bintang: 0, lastUpdated: 0
            };
            const updated = { ...existing, nilaiAngka: nilai, lastUpdated: Date.now() };
            const newScores: Record<string, MeetingScore> = { ...scores };
            newScores[idSiswa] = updated;
            setScores(newScores);
            await db.saveScore(updated);
            imported++;
          }
        }
      }
      
      if (imported > 0) {
        showToast(`Berhasil import ${imported} nilai!`);
      } else {
        showToast('Tidak ada data yang cocok.', "warning");
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal membaca file Excel', "error");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(students.map(s => ({ Nama: s.nama, Nilai: '' })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nilai');
    XLSX.writeFile(wb, `template_nilai_${meeting?.materi || 'nilai'}.xlsx`);
  };

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
        'seratus': 100, 'kosong': 0
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
          if (part.length > 2 && rawText.includes(part)) {
            currentScore += part.length;
          }
        });
        if (currentScore > maxScore) {
          maxScore = currentScore;
          bestMatch = s;
        }
      });

      if (bestMatch && maxScore >= 3) {
        handleScoreChange(bestMatch.idSiswa, scoreVal);
        setTranscript('Mencatat: ' + bestMatch.nama.split(' ')[0] + ' = ' + scoreVal);
      }
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Browser tidak mendukung fitur suara");
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
      const { default: Tesseract } = await import('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(ocrImage, 'ind+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });
      
      const lines = text.split('\n').filter(l => l.trim());
      let imported = 0;
      
      lines.forEach(line => {
        const nameMatch = line.match(/^([A-Za-z\s]+?)[\s,]+(\d{1,3})$/);
        if (nameMatch) {
          const nama = nameMatch[1].trim().toLowerCase();
          const nilai = parseInt(nameMatch[2]);
          
          students.forEach(s => {
            const studentName = s.nama.toLowerCase();
            if (studentName.includes(nama) || nama.includes(studentName.split(' ')[0])) {
              handleScoreChange(s.idSiswa, nilai);
              imported++;
            }
          });
        }
      });
      
      setOcrStatus(imported > 0 ? imported + ' nilai terbaca!' : 'Tidak ada data terbaca');
    } catch (err) {
      setOcrStatus('Gagal memproses: ' + err);
    }
  };

  useEffect(() => {
    if (!idPertemuan) return;
    const load = async () => {
       const profile = await db.getTeacherProfile();
       const schoolId = profile?.activeSchoolId || '';
       const m = await db.getMeetingById(idPertemuan);
       if (m) {
         setMeeting(m);
         const s = await db.getStudents(m.idKelas, schoolId || undefined);
         setStudents(s);
         const sc = await db.getScores(idPertemuan, schoolId || undefined);
         const scoreMap: Record<string, MeetingScore> = {};
         sc.forEach(x => scoreMap[x.idSiswa] = x);
         setScores(scoreMap);
       }
       setLoading(false);
    };
    load();
  }, [idPertemuan]);

  const handleScoreChange = async (idSiswa: string, val: number | null) => {
    const profile = await db.getTeacherProfile();
    const schoolId = profile?.activeSchoolId || '';
    const existing = scores[idSiswa] || {
       id: `${idPertemuan}_${idSiswa}`, schoolId, idPertemuan: idPertemuan!, idSiswa, nilaiAngka: null, bintang: 0, lastUpdated: 0
    };
    const updated = { ...existing, nilaiAngka: val, lastUpdated: Date.now() };
    setScores(prev => ({ ...prev, [idSiswa]: updated }));
    await db.saveScore(updated);
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === students.length && students.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(students.map(s => s.idSiswa)));
    }
  };

  const handleApplyBulkScore = async () => {
    if (selectedStudentIds.size === 0) {
      showToast("Pilih siswa terlebih dahulu", "warning");
      return;
    }
    let val: number | null = null;
    if (meeting?.aspekPenilaian === 'Sikap') {
        if (bulkScore === 'A') val = 95;
        else if (bulkScore === 'B') val = 85;
        else if (bulkScore === 'C') val = 75;
        else if (bulkScore === 'D') val = 65;
        else if (bulkScore === 'E') val = 55;
    } else {
        val = bulkScore ? parseFloat(bulkScore) : null;
    }
    
    const newScores = { ...scores };
    const profile = await db.getTeacherProfile();
    const schoolId = profile?.activeSchoolId || '';
    
    const savePromises = [];
    for (const idSiswa of selectedStudentIds) {
      const existing = scores[idSiswa] || {
        id: `${idPertemuan}_${idSiswa}`, schoolId, idPertemuan: idPertemuan!, idSiswa, nilaiAngka: null, bintang: 0, lastUpdated: 0
      };
      const updated = { ...existing, nilaiAngka: val, lastUpdated: Date.now() };
      newScores[idSiswa] = updated;
      savePromises.push(db.saveScore(updated));
    }
    
    await Promise.all(savePromises);
    setScores(newScores);
    showToast(`Berhasil mengisi ${selectedStudentIds.size} siswa`);
    setBulkScore('');
    setSelectedStudentIds(new Set());
  };

  if (loading || !meeting) return <Layout><div className="p-20 text-center"><Loader2 className="animate-spin mx-auto"/></div></Layout>;

  return (
    <Layout>
      <Header title="Input Nilai" subtitle={`${meeting.activityType} - ${meeting.materi}`} backTo="/grading" />
      <PageTransition>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-[#3B66F5] transition-all font-black text-[10px] uppercase tracking-widest shadow-sm"
                        >
                            {selectedStudentIds.size === students.length && students.length > 0 ? <CheckSquare size={16} className="text-[#3B66F5]" /> : <Square size={16} />}
                            {selectedStudentIds.size === students.length ? 'Batal Semua' : 'Pilih Semua'}
                        </button>
                        {selectedStudentIds.size > 0 && (
                            <span className="text-[10px] font-black text-[#3B66F5] uppercase tracking-widest">{selectedStudentIds.size} Terpilih</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {meeting?.aspekPenilaian === 'Sikap' ? (
                          <select 
                            className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-center font-black text-xs outline-none focus:border-[#3B66F5] transition-all appearance-none cursor-pointer"
                            value={bulkScore}
                            onChange={e => setBulkScore(e.target.value)}
                          >
                            <option value="">-</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                          </select>
                        ) : (
                          <input 
                              type="number" 
                              placeholder="Nilai..." 
                              className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-center font-black text-xs outline-none focus:border-[#3B66F5] transition-all"
                              value={bulkScore}
                              onChange={e => setBulkScore(e.target.value)}
                          />
                        )}
                        <Button 
                            onClick={handleApplyBulkScore}
                            variant="primary" 
                            className="!py-2 !px-4 !text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                            disabled={selectedStudentIds.size === 0}
                        >
                            Isi Cepat
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end w-full md:w-auto">
                   <button 
                      onClick={toggleListening}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all ${isListening ? 'bg-red-500 border-red-400 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-[#3B66F5]'}`}
                   >
                      {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{isListening ? 'Stop' : 'Suara'}</span>
                   </button>
                   <button 
                      onClick={() => ocrMode === 'manual' ? setOcrMode('none') : setOcrMode('manual')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all ${ocrMode !== 'none' ? 'bg-purple-500 border-purple-400 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-purple-400'}`}
                   >
                      <FileText size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">OCR</span>
                   </button>
                   <button onClick={handleDownloadTemplate} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#3B66F5] flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-slate-200">
                      <Download size={14} /> Template
                   </button>
                   <label className="text-[10px] font-black uppercase tracking-widest text-[#3B66F5] hover:text-[#3B66F5]Dark cursor-pointer flex items-center gap-2 bg-[#3B66F5]/5 px-3 py-2 rounded-full border border-[#3B66F5]/20">
                      <Upload size={14} /> Import
                      <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportExcel} disabled={isImporting} />
                   </label>
                </div>
            </div>

            {isListening && transcript && (
               <div className="bg-[#3B66F5]/5 px-8 py-3 border-b border-[#3B66F5]/20 italic text-sm text-[#3B66F5] font-bold animate-fade flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] rounded-full animate-bounce"/>
                  "{transcript}..."
               </div>
            )}

            {ocrMode === 'camera' && (
               <div className="relative bg-black rounded-2xl overflow-hidden mx-8 mt-4">
                  <video ref={videoRef} autoPlay playsInline className="w-full" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                     <button onClick={() => { setOcrMode('none'); stopCamera(); }} className="px-6 py-3 bg-red-500 text-white rounded-full font-black text-[10px] uppercase">Batal</button>
                     <button onClick={captureImage} className="px-6 py-3 bg-white text-purple-600 rounded-full font-black text-[10px] uppercase">
                        <Camera size={18} className="inline mr-2" />Ambil Foto
                     </button>
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
                        <p className="text-[8px] text-slate-400">Format: JPG, PNG</p>
                     </div>
                     <div className="border-2 border-dashed border-purple-300 bg-purple-50 rounded-2xl p-6 text-center cursor-pointer hover:bg-purple-100" onClick={() => { setOcrMode('camera'); startCamera(); }}>
                        <Camera size={32} className="mx-auto text-purple-500 mb-2" />
                        <p className="text-[10px] font-bold text-purple-600">Buka Kamera</p>
                        <p className="text-[8px] text-purple-400">Ambil langsung foto</p>
                     </div>
                  </div>
                  <input type="file" ref={ocrInputRef} accept="image/*" className="hidden" onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => { setOcrImage(ev.target?.result as string); };
                        reader.readAsDataURL(file);
                     }
                  }}/>
               </div>
            )}

            {ocrImage && ocrMode !== 'camera' && (
               <div className="p-8 space-y-4">
                  <img src={ocrImage} alt="OCR" className="w-full rounded-2xl border border-slate-200 max-h-64 object-contain" />
                  <div className="flex gap-2">
                     <Button variant="secondary" onClick={() => { setOcrImage(null); setOcrProgress(0); }} className="flex-1">Ganti Foto</Button>
                     <Button onClick={processOCR} isLoading={ocrProgress > 0 && ocrProgress < 100} className="flex-1">
                        {ocrProgress > 0 ? ocrProgress + '%' : 'Proses OCR'}
                     </Button>
                  </div>
                  {ocrStatus && <p className="text-[10px] text-center font-bold">{ocrStatus}</p>}
               </div>
            )}
          <div className="divide-y divide-slate-100">
             {students.sort((a,b) => a.nama.localeCompare(b.nama)).map((std, idx) => {
               const score = scores[std.idSiswa]?.nilaiAngka ?? '';
               return (
                  <div 
                    key={std.idSiswa} 
                    className={`p-6 md:p-8 flex items-center justify-between transition-all gap-4 border-b border-slate-50 last:border-0 ${selectedStudentIds.has(std.idSiswa) ? 'bg-[#3B66F5]/5/40' : 'hover:bg-slate-50'}`}
                  >
                     <div className="flex items-center gap-4 md:gap-6 overflow-hidden">
                        <div 
                            onClick={() => {
                                const newSelected = new Set(selectedStudentIds);
                                if (newSelected.has(std.idSiswa)) newSelected.delete(std.idSiswa);
                                else newSelected.add(std.idSiswa);
                                setSelectedStudentIds(newSelected);
                            }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${selectedStudentIds.has(std.idSiswa) ? 'bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white shadow-md' : 'bg-white border-2 border-slate-200 text-slate-300 hover:border-[#3B66F5] hover:text-[#3B66F5]'}`}
                        >
                            {selectedStudentIds.has(std.idSiswa) ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} />}
                        </div>

                        <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0 hidden sm:flex">{idx + 1}</span>
                        <div className="min-w-0">
                           <h4 className="font-black text-slate-800 uppercase text-sm md:text-base truncate">{std.nama}</h4>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {std.idSiswa}</p>
                        </div>
                     </div>
                     <div className="w-24 md:w-32">
                        {meeting?.aspekPenilaian === 'Sikap' ? (
                          <select 
                            className={`w-full bg-white border-2 rounded-2xl py-3 text-center font-black text-lg outline-none focus:ring-4 transition-all appearance-none cursor-pointer ${score ? 'border-[#3B66F5] text-[#3B66F5] focus:ring-[#3B66F5]/10' : 'border-slate-200 text-slate-700 focus:border-[#3B66F5] focus:ring-[#3B66F5]/5'}`}
                            value={score === 95 ? 'A' : score === 85 ? 'B' : score === 75 ? 'C' : score === 65 ? 'D' : score === 55 ? 'E' : ''}
                            onChange={e => {
                              const val = e.target.value === 'A' ? 95 : e.target.value === 'B' ? 85 : e.target.value === 'C' ? 75 : e.target.value === 'D' ? 65 : e.target.value === 'E' ? 55 : null;
                              handleScoreChange(std.idSiswa, val);
                            }}
                          >
                            <option value="">-</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                          </select>
                        ) : (
                          <input 
                            type="number" 
                            placeholder="0" 
                            className={`w-full bg-white border-2 rounded-2xl py-3 text-center font-black text-lg outline-none focus:ring-4 transition-all ${score ? 'border-[#3B66F5] text-[#3B66F5] focus:ring-[#3B66F5]/10' : 'border-slate-200 text-slate-700 focus:border-[#3B66F5] focus:ring-[#3B66F5]/5'}`}
                            value={score}
                            onChange={e => {
                              const val = e.target.value ? parseFloat(e.target.value) : null;
                              handleScoreChange(std.idSiswa, val);
                            }}
                          />
                        )}
                     </div>
                  </div>
               )
             })}
          </div>
        </div>
      </PageTransition>
    </Layout>
  );
};
