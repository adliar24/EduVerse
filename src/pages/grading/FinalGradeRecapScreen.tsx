import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BarChart3, FileSpreadsheet, FileText, ChevronRight, 
  Zap, Mic, MicOff, Camera, Upload, Archive, 
  Settings2, AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { 
  ClassData, LearningObjective, TeacherProfile, 
  AssessmentCategory, DEFAULT_WEIGHTS 
} from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Select, Input, Card, Modal,
  Header, Layout, PageTransition, useToast
} from '../Layout';
import { useTeacherProfile } from '../../services/hooks';
import { autoFitColumns } from './SharedUtils';

export const FinalGradeRecapScreen: React.FC = () => {
   const navigate = useNavigate();
   const { showToast } = useToast();
   const reportRef = useRef<HTMLDivElement>(null);
   const pdfRef = useRef<HTMLDivElement>(null);
   const [classes, setClasses] = useState<ClassData[]>([]);
   const [selectedClass, setSelectedClass] = useState('');
   const [recapData, setRecapData] = useState<any[]>([]);
   const [profile, setProfile] = useState<TeacherProfile | null>(null);
   const [learningObjectives, setLearningObjectives] = useState<LearningObjective[]>([]);
   
   // e-Rapor Template State
   const [templateWorkbooks, setTemplateWorkbooks] = useState<{ name: string; workbook: XLSX.WorkBook }[]>([]);
   const [isProcessing, setIsProcessing] = useState(false);
   const [isDragging, setIsDragging] = useState(false);
   
   // Comparison State
   const [comparisonMode, setComparisonMode] = useState<'none' | 'manual' | 'ocr' | 'voice'>('none');
   const [previousScores, setPreviousScores] = useState<{ nama: string; nilai: number }[]>([]);
   const [comparisonResult, setComparisonResult] = useState<any[]>([]);
   const [showComparisonModal, setShowComparisonModal] = useState(false);
    
   // Voice State
   const [isListening, setIsListening] = useState(false);
   const [transcript, setTranscript] = useState('');
   const recognitionRef = useRef<any>(null);
    
   // OCR State
   const [ocrImage, setOcrImage] = useState<string | null>(null);
   const [ocrProgress, setOcrProgress] = useState(0);
   const [ocrStatus, setOcrStatus] = useState('');
   const [showCamera, setShowCamera] = useState(false);
   const videoRef = useRef<HTMLVideoElement>(null);
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const ocrInputRef = useRef<HTMLInputElement>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      db.getClasses().then(c => {
        setClasses(c);
        if (c.length > 0) setSelectedClass(c[0].idKelas);
      });
      db.getTeacherProfile().then(setProfile);
      db.getLearningObjectives().then(setLearningObjectives);
    }, []);

    const startCamera = async () => {
      setShowCamera(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert('Gagal mengakses kamera: ' + err);
        setShowCamera(false);
      }
    };

    const captureImage = () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setOcrImage(dataUrl);
        
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setShowCamera(false);
      }
    };

    const stopCamera = () => {
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
    };

    const toggleVoice = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Browser tidak mendukung fitur suara");
        return;
      }
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      } else {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'id-ID';
        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript.toLowerCase();
            if (event.results[i].isFinal) {
              processVoiceNilai(text);
              setTranscript('');
            } else {
              interim = text;
            }
          }
          setTranscript(interim);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
      }
    };

    const processVoiceNilai = (text: string) => {
      const rawText = text.toLowerCase();
      const numberMatch = rawText.match(/(\d+)\s*$/);
      let scoreVal: number | null = null;
      
      if (numberMatch) {
        scoreVal = parseInt(numberMatch[1]);
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

      if (scoreVal !== null && recapData.length > 0) {
        let bestMatch: any = null;
        let maxScore = 0;
        recapData.forEach(s => {
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
          const newScores = [...previousScores];
          const existing = newScores.findIndex(sc => sc.nama.toLowerCase() === bestMatch!.nama.toLowerCase());
          if (existing >= 0) {
            newScores[existing].nilai = scoreVal;
          } else {
            newScores.push({ nama: bestMatch.nama, nilai: scoreVal });
          }
          setPreviousScores(newScores);
          setTranscript('Mencatat: ' + bestMatch.nama.split(' ')[0] + ' = ' + scoreVal);
        }
      }
    };

    useEffect(() => {
      if (!selectedClass || !profile) return;
      const load = async () => {
        const schoolId = profile.activeSchoolId || '';
         const students = await db.getStudents(selectedClass, schoolId || undefined);
         let meetings = await db.getMeetings(selectedClass, schoolId || undefined);
         let scores = await db.getAllScores(schoolId || undefined);

         if (meetings.length === 0) {
            meetings = await db.getMeetings(selectedClass);
            scores = await db.getAllScores();
         }
         
         const weights = profile.weights || DEFAULT_WEIGHTS;

        const data = students.map(std => {
           const stdScores = scores.filter(s => s.idSiswa === std.idSiswa);
           
           const getAvg = (category: string) => {
               const filtered = stdScores.filter(s => {
                  const m = meetings.find(meet => meet.idPertemuan === s.idPertemuan);
                  const cat = m?.assessmentCategory || 'Formatif';
                  return cat === category && s.nilaiAngka !== null;
               });
               return filtered.length ? filtered.reduce((a,b) => a + (b.nilaiAngka||0), 0) / filtered.length : 0;
           };

           const avgFormatif = getAvg('Formatif');
           const avgSumatif = getAvg('Sumatif');
           const avgPTS = getAvg('PTS');
           const avgPAS = getAvg('PAS');
           
           const finalScore = (
               (avgFormatif * (weights.formatif / 100)) +
               (avgSumatif * (weights.sumatif / 100)) +
               (avgPTS * (weights.pts / 100)) +
               (avgPAS * (weights.pas / 100))
           );

           const tpScores: Record<string, number[]> = {};
           stdScores.forEach(s => {
               const meet = meetings.find(m => m.idPertemuan === s.idPertemuan);
               if (meet?.idTP && s.nilaiAngka !== null) {
                   if (!tpScores[meet.idTP]) tpScores[meet.idTP] = [];
                   tpScores[meet.idTP].push(s.nilaiAngka);
               }
           });

           const tpAverages = Object.entries(tpScores).map(([idTP, vals]) => ({
               idTP,
               avg: vals.reduce((a,b) => a+b, 0) / vals.length
           })).sort((a,b) => b.avg - a.avg);

           let description = "";
           if (tpAverages.length > 0) {
               const topTP = learningObjectives.find(lo => lo.id === tpAverages[0].idTP);
               const bottomTP = tpAverages.length > 1 ? learningObjectives.find(lo => lo.id === tpAverages[tpAverages.length - 1].idTP) : null;
               
               description = `Menunjukkan penguasaan yang sangat baik dalam ${topTP?.deskripsi || 'materi terkait'}`;
               if (bottomTP && tpAverages[tpAverages.length - 1].avg < 75) {
                   description += `, perlu bimbingan lebih lanjut dalam ${bottomTP.deskripsi}`;
               } else {
                   description += ".";
               }
           }

           return {
             ...std,
             avgFormatif: avgFormatif.toFixed(1),
             avgSumatif: avgSumatif.toFixed(1),
             finalScore: finalScore.toFixed(0),
             description
           };
        });
        setRecapData(data);
      };
      load();
    }, [selectedClass, profile, learningObjectives]);

     const [isFinishing, setIsFinishing] = useState(false);
     const [finishModalOpen, setFinishModalOpen] = useState(false);
     const [finishStep, setFinishStep] = useState(1); 
     const [nextSettings, setNextSettings] = useState({
         tahunAjaran: '',
         semester: '2',
         autoBackup: true
     });

     useEffect(() => {
          if (profile && finishModalOpen) {
              const currentYear = profile.tahunAjaran;
              const currentSem = profile.semester;
              let nextYear = currentYear;
              let nextSem = currentSem === '1' ? '2' : '1';
              
              if (currentSem === '2') {
                  const yearParts = currentYear.split('/');
                  if (yearParts.length === 2) {
                      nextYear = `${parseInt(yearParts[0]) + 1}/${parseInt(yearParts[1]) + 1}`;
                  }
              }

              setNextSettings({
                  tahunAjaran: nextYear,
                  semester: nextSem,
                  autoBackup: true
              });
          }
     }, [profile, finishModalOpen]);

     const handleFinishSemester = async () => {
         setIsFinishing(true);
         try {
             if (nextSettings.autoBackup) {
                 const backupData = await db.createBackup('full');
                 const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                 const url = URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.href = url;
                 a.download = `EduScore_Backup_ARCHIVE_${profile?.tahunAjaran.replace('/','-')}_Smt${profile?.semester}.json`;
                 document.body.appendChild(a);
                 a.click();
                 document.body.removeChild(a);
             }

             if (profile) {
                 await db.saveTeacherProfile({
                     ...profile,
                     tahunAjaran: nextSettings.tahunAjaran,
                     semester: nextSettings.semester
                 });
             }

             alert(`Semester berhasil diselesaikan! Sekarang Anda berada di Tahun Ajaran ${nextSettings.tahunAjaran} Semester ${nextSettings.semester === '1' ? 'Ganjil' : 'Genap'}.`);
             setFinishModalOpen(false);
             navigate('/home');
         } catch (err) {
             alert("Gagal memproses transisi semester: " + err);
         } finally {
             setIsFinishing(false);
         }
     };

     const processFiles = (files: FileList) => {
        setIsProcessing(true);
        let processedCount = 0;
        const newWorkbooks: { name: string; workbook: XLSX.WorkBook }[] = [];
        const fileArray = Array.from(files);

        fileArray.forEach((file: File) => {
            if (!file.name.match(/\.(xlsx|xls)$/i)) {
                processedCount++;
                if (processedCount === fileArray.length) {
                    setIsProcessing(false);
                }
                return;
            }

            const reader = new FileReader();
            reader.onload = (evt) => {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                newWorkbooks.push({ name: file.name, workbook: wb });
                processedCount++;

                if (processedCount === fileArray.length) {
                    setTemplateWorkbooks(prev => [...prev, ...newWorkbooks]);
                    setIsProcessing(false);
                }
            };
            reader.readAsBinaryString(file);
        });
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
         const files = e.target.files;
         if (!files || files.length === 0) return;
         processFiles(files);
         e.target.value = '';
     };

    const handleFileDrop = (files: FileList) => {
        if (!files || files.length === 0) return;
        processFiles(files);
    };

    const handleSmartFill = () => {
        if (templateWorkbooks.length === 0) {
            fileInputRef.current?.click();
            return;
        }

        setIsProcessing(true);
        try {
            const zip: any[] = [];

            templateWorkbooks.forEach((template) => {
                const wb = { ...template.workbook };
                const sheetName = wb.SheetNames[0];
                const ws = wb.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });

                const headerRowIdx = data.findIndex(row => row.some((cell: any) => typeof cell === 'string' && (cell.toLowerCase().includes('nama') || cell.toLowerCase().includes('nilai'))));
                if (headerRowIdx === -1) return;

                const headerRow = data[headerRowIdx];
                const nameColIdx = headerRow.findIndex((c: any) => typeof c === 'string' && c.toLowerCase().includes('nama'));
                const scoreColIdx = headerRow.findIndex((c: any) => typeof c === 'string' && (c.toLowerCase().includes('nilai') || c.toLowerCase().includes('angka')));
                const descColIdx = headerRow.findIndex((c: any) => typeof c === 'string' && (c.toLowerCase().includes('deskripsi') || c.toLowerCase().includes('capaian')));
                
                 const normalizeName = (name: string) => {
                     return name.toLowerCase()
                         .replace(/(h\.|hj\.|dra\.|drs\.|st\.|m\.pd|s\.pd|s\.kom|s\.sn|m\.kom)/gi, '') 
                         .replace(/[^\w\s]/gi, '') 
                         .replace(/\s+/g, ' ') 
                         .trim();
                 };

                 for (let i = headerRowIdx + 1; i < data.length; i++) {
                     const row = data[i];
                     const rawName = row[nameColIdx];
                     if (!rawName) continue;

                     const studentNameStr = rawName.toString();
                     const normalizedTarget = normalizeName(studentNameStr);

                     const match = recapData.find(d => {
                         const normalizedLocal = normalizeName(d.nama);
                         if (normalizedLocal === normalizedTarget) return true;
                         if (normalizedTarget.length > 5 && normalizedLocal.length > 5) {
                             return normalizedLocal.includes(normalizedTarget) || normalizedTarget.includes(normalizedLocal);
                         }
                         return false;
                     });

                     if (match) {
                         if (scoreColIdx !== -1) row[scoreColIdx] = Number(match.finalScore);
                         if (descColIdx !== -1) row[descColIdx] = match.description || "-";
                     }
                 }

                wb.Sheets[sheetName] = XLSX.utils.aoa_to_sheet(data);
                
                const baseName = template.name.replace(/\.(xlsx|xls)$/i, '');
                zip.push({
                    filename: `${baseName}_Filled.xlsx`,
                    workbook: wb
                });
            });

            zip.forEach((item, idx) => {
                setTimeout(() => {
                    XLSX.writeFile(item.workbook, item.filename);
                }, idx * 500);
            });

            alert(`Smart Filling Selesai! ${zip.length} file berhasil diproses dan diunduh.`);
            setTemplateWorkbooks([]);
        } catch (err) {
            alert("Error processing template: " + err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportRaw = () => {
       const formattedData = recapData.map(d => ({
          "Nama Siswa": d.nama,
          "Rerata Formatif": d.avgFormatif,
          "Rerata Sumatif": d.avgSumatif,
          "Nilai Akhir": d.finalScore,
          "Deskripsi": d.description
       }));
       const ws = XLSX.utils.json_to_sheet(formattedData);
       ws['!cols'] = autoFitColumns(formattedData);
       const wb = XLSX.utils.book_new();
       XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai");
       XLSX.writeFile(wb, `Rekap_Nilai_${selectedClass}.xlsx`);
    };

    const handleExportPDF = async () => {
        if (!pdfRef.current) return;
        showToast("Menyiapkan PDF...");
        try {
           const opt: any = {
              margin:       [10, 10, 10, 10],
              filename:     `Rekap_eRapor_${classes.find(c => c.idKelas === selectedClass)?.namaKelas || selectedClass}.pdf`,
              image:        { type: 'jpeg', quality: 0.9 },
              html2canvas:  { scale: 1.8, useCORS: true, width: 800 },
              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
              pagebreak:    { mode: 'css' }
           };
           await html2pdf().from(pdfRef.current).set(opt).save();
        } catch (error) {
           console.error("PDF Export error:", error);
           showToast("Gagal export PDF", "error");
        }
     };

 return (
      <Layout>
         <Header title="Rekap Nilai Akhir" subtitle="Kalkulasi e-Rapor & Smart Filling" />
         <PageTransition className="space-y-4 pb-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
               <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-3xl p-4 border border-indigo-100 space-y-3">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-[#3B66F5] rounded-xl flex items-center justify-center text-white">
                        <BarChart3 size={20} />
                     </div>
                     <div>
                        <h4 className="font-black text-indigo-950 text-sm uppercase tracking-wide">Banding Nilai Semester</h4>
                        <p className="text-[10px] text-slate-500 font-bold">vs nilai e-Rapor semester lalu</p>
                     </div>
                  </div>
                 
                 <div className="bg-white/60 rounded-2xl p-4 border border-indigo-100">
                    <p className="text-[10px] font-bold text-indigo-700/70 leading-relaxed uppercase">
                       Bandingkan nilai akhir semester ini dengan<br/>
                       nilai e-Rapor semester sebelumnya untuk<br/>
                       melihat progres belajar siswa
                    </p>
                 </div>

                 {comparisonResult.length > 0 ? (
                    <div className="space-y-3">
                       <div className="flex gap-2">
                          <div className="flex-1 bg-emerald-100 rounded-xl p-3 text-center">
                             <div className="text-xl font-black text-emerald-600">{comparisonResult.filter(r => r.trend === 'naik').length}</div>
                             <div className="text-[8px] font-bold text-emerald-700 uppercase">Naik</div>
                          </div>
                          <div className="flex-1 bg-amber-100 rounded-xl p-3 text-center">
                             <div className="text-xl font-black text-amber-600">{comparisonResult.filter(r => r.trend === 'stabil').length}</div>
                             <div className="text-[8px] font-bold text-amber-700 uppercase">Stabil</div>
                          </div>
                          <div className="flex-1 bg-red-100 rounded-xl p-3 text-center">
                             <div className="text-xl font-black text-red-600">{comparisonResult.filter(r => r.trend === 'turun').length}</div>
                             <div className="text-[8px] font-bold text-red-700 uppercase">Turun</div>
                          </div>
                       </div>
                       <div className="overflow-x-auto max-h-24 overflow-y-auto">
                          <table className="w-full text-[10px]">
                             <thead className="bg-white">
                                <tr>
                                   <th className="px-2 py-1 text-left font-black text-slate-400 uppercase">Siswa</th>
                                   <th className="px-2 py-1 text-center font-black text-slate-400 uppercase">Lalu</th>
                                   <th className="px-2 py-1 text-center font-black text-slate-400 uppercase">Skrg</th>
                                   <th className="px-2 py-1 text-center font-black text-slate-400 uppercase">Selisih</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                {comparisonResult.slice(0, 4).map((row, idx) => (
                                   <tr key={idx} className="bg-white">
                                      <td className="px-2 py-1 font-bold text-slate-600 uppercase truncate max-w-[80px]">{row.nama}</td>
                                      <td className="px-2 py-1 text-center font-black text-slate-500">{row.sebelum}</td>
                                      <td className="px-2 py-1 text-center font-black">{row.sekarang}</td>
                                      <td className={`px-2 py-1 text-center font-black ${row.selisih >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                         {row.selisih > 0 ? '+' : ''}{row.selisih}
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  ) : (
                      <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => { setComparisonMode('manual'); setShowComparisonModal(true); }} className="p-4 rounded-2xl border-2 border-indigo-200 bg-white hover:bg-indigo-50 transition-all">
                           <FileText size={24} className="mx-auto mb-2 text-indigo-500" />
                           <span className="text-[10px] font-black text-indigo-600 uppercase">Manual</span>
                        </button>
                        <button onClick={() => { setComparisonMode('voice'); toggleVoice(); }} className={`p-4 rounded-2xl border-2 transition-all ${isListening ? 'bg-red-500 border-red-400 text-white' : 'border-red-200 bg-white hover:bg-red-50'}`}>
                           {isListening ? <MicOff size={24} className="mx-auto mb-2" /> : <Mic size={24} className="mx-auto mb-2 text-red-500" />}
                           <span className={`text-[10px] font-black uppercase ${isListening ? 'text-white' : 'text-red-600'}`}>{isListening ? 'Stop' : 'Suara'}</span>
                        </button>
                        <button onClick={() => { setComparisonMode('ocr'); setShowComparisonModal(true); }} className="p-4 rounded-2xl border-2 border-purple-200 bg-white hover:bg-purple-50 transition-all">
                           <Camera size={24} className="mx-auto mb-2 text-purple-500" />
                           <span className="text-[10px] font-black text-purple-600 uppercase">Gambar</span>
                        </button>
                      </div>
                  )}

                  {comparisonMode === 'voice' && (
                    <div className="bg-red-50 rounded-2xl p-4 border border-red-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-red-600 uppercase">Input Suara - Nilai Semester Lalu</span>
                          {isListening && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded-full animate-pulse">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                <span className="text-[8px] font-black uppercase">Mic Aktif</span>
                              </div>
                          )}
                        </div>
                        {isListening && transcript && (
                          <div className="bg-white rounded-xl px-4 py-2 italic text-sm text-primary font-bold">
                              "{transcript}..."
                          </div>
                        )}
                        <p className="text-[9px] text-red-500 leading-relaxed">
                          Contoh: "Andi = sembilan puluh" atau "Budi 85"<br/>
                          Tekan Stop untuk selesai
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                          {previousScores.length === 0 ? (
                              <p className="text-[10px] text-slate-400 italic">Belum ada nilai...</p>
                          ) : (
                              previousScores.slice(0, 5).map((s, i) => (
                                <div key={i} className="flex justify-between text-[10px]">
                                    <span className="font-bold text-slate-600">{s.nama}</span>
                                    <span className="font-black text-primary">{s.nilai}</span>
                                </div>
                              ))
                          )}
                        </div>
                    </div>
                  )}
                </div>

                 <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-3xl p-4 border border-indigo-100 space-y-3">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-[#3B66F5] rounded-xl flex items-center justify-center text-white">
                        <Zap size={20} />
                     </div>
                     <div>
                        <h4 className="font-black text-indigo-950 text-sm uppercase tracking-wide">Smart Filling</h4>
                        <p className="text-[10px] text-slate-500 font-bold">Isi template e-Rapor otomatis</p>
                     </div>
                  </div>
                  
                  <div className="bg-white/60 rounded-2xl p-4 border border-slate-100">
                     <p className="text-[10px] font-bold text-slate-600 leading-relaxed uppercase">
                        1. Pilih/Drop file template Excel dari Web e-Rapor<br/>
                        2. Sistem auto-cocok nama siswa & isi nilai<br/>
                        3. File hasil download tanpa ubah format asli
                     </p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 items-stretch">
                     <div 
                        className="flex-1"
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileDrop(e.dataTransfer.files); }}
                     >
                        {templateWorkbooks.length > 0 ? (
                            <div className={`bg-white rounded-2xl p-4 border-2 h-full transition-all ${isDragging ? 'border-primary bg-blue-50' : 'border-slate-100'}`}>
                              <div className="flex items-center justify-between mb-2">
                                 <span className="text-[10px] font-black text-indigo-950 uppercase">{templateWorkbooks.length} File</span>
                                 <button onClick={() => setTemplateWorkbooks([])} className="text-[9px] text-red-500 font-bold">X</button>
                              </div>
                              <div className="flex flex-wrap gap-2 max-h-16 overflow-y-auto">
                                 {templateWorkbooks.map((tmpl, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-indigo-50/50 px-3 py-2 rounded-lg border border-indigo-100 text-[10px] font-bold text-indigo-950">
                                       <FileText size={12} className="text-indigo-900" />
                                       <span className="max-w-[120px] truncate">{tmpl.name}</span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        ) : (
                           <div 
                              className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer h-full flex flex-col justify-center ${
                                 isDragging ? 'border-primary bg-blue-50 scale-102' : 'border-slate-200 hover:border-indigo-950/20 hover:bg-slate-50/30'
                              }`}
                              onClick={() => fileInputRef.current?.click()}
                           >
                              <Upload size={20} className={`mx-auto mb-2 ${isDragging ? 'text-primary' : 'text-slate-400'}`} />
                              <div className="text-[10px] font-black text-slate-500 uppercase">
                                 {isDragging ? 'Lepaskan File' : 'Seret & Lepas'}
                              </div>
                           </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" multiple onChange={handleFileInputChange} />
                     </div>

                      <Button variant="primary" onClick={handleSmartFill} isLoading={isProcessing} className="!rounded-2xl py-4 px-6 flex items-center justify-center">
                         <Zap size={18} className="mr-2" />
                         <span className="uppercase font-black text-[10px] tracking-widest">Proses</span>
                      </Button>
                  </div>
               </div>
            </div>

           <div className="flex flex-col md:flex-row gap-4 items-stretch mb-6">
              <div className="flex-1 bg-white p-4 md:p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 md:gap-5">
                  <div className="flex gap-2 mb-2 md:mb-0" data-html2canvas-ignore>
                      <Button variant="secondary" onClick={() => {
                          const data = recapData.map((r, i) => ({ No: i + 1, Nama: r.nama, Formatif: r.avgFormatif, Sumatif: r.avgSumatif, Final: r.finalScore }));
                          const ws = XLSX.utils.json_to_sheet(data);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, ws, 'eRapor');
                          XLSX.writeFile(wb, `eRapor_${classes.find(c => c.idKelas === selectedClass)?.namaKelas}.xlsx`);
                      }} className="!py-2 !px-4 !text-[10px] !rounded-xl">
                          <FileSpreadsheet size={14} className="mr-1 text-emerald-600"/> Excel
                      </Button>
                  </div>
                  <div className="w-full md:w-64">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">Pilih Kelas</label>
                     <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="!py-2.5 !px-4 !text-xs !rounded-xl">
                        {classes.map(c => <option key={c.idKelas} value={c.idKelas}>{c.namaKelas}</option>)}
                     </Select>
                  </div>
                  <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                     <div className="text-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[8px] font-black text-slate-400 uppercase opacity-60">Form</div>
                        <div className="text-sm font-black text-indigo-950">{profile?.weights?.formatif ?? 40}%</div>
                     </div>
                     <div className="text-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[8px] font-black text-slate-400 uppercase opacity-60">Sum</div>
                        <div className="text-sm font-black text-indigo-950">{profile?.weights?.sumatif ?? 30}%</div>
                     </div>
                     <div className="text-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[8px] font-black text-slate-400 uppercase opacity-60">PTS</div>
                        <div className="text-sm font-black text-indigo-950">{profile?.weights?.pts ?? 15}%</div>
                     </div>
                     <div className="text-center p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-[8px] font-black text-slate-400 uppercase opacity-60">PAS</div>
                        <div className="text-sm font-black text-indigo-950">{profile?.weights?.pas ?? 15}%</div>
                     </div>
                  </div>
              </div>
           </div>

           <Card className="rounded-3xl p-0 overflow-hidden no-box-border" ref={reportRef}>
             <div className="hidden block-in-pdf p-8 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
                <div className="flex justify-between items-start">
                   <div>
                      <h1 className="text-2xl font-black uppercase tracking-tighter">Rekap Nilai e-Rapor</h1>
                      <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Kalkulasi Akhir & Capaian Kompetensi</p>
                   </div>
                   <div className="text-right">
                      <div className="text-xs font-black uppercase">{profile?.schoolName || 'EduScore School'}</div>
                      <div className="text-[9px] font-bold opacity-60 uppercase mt-0.5">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                   </div>
                </div>
             </div>

             <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-border-in-pdf">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pratinjau Nilai Rapor</span>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto" data-html2canvas-ignore>
                      <Button variant="secondary" onClick={handleExportRaw} className="flex-1 md:flex-none !py-3 !px-6 !text-[13px] !rounded-xl h-14 md:h-auto">
                         <FileSpreadsheet size={18} className="mr-2 text-emerald-600"/> Export Excel
                      </Button>
                      <Button variant="primary" onClick={handleExportPDF} className="flex-1 md:flex-none !py-3 !px-6 !text-[13px] !rounded-xl h-14 md:h-auto">
                         <FileText size={18} className="mr-2 text-white" /> Export PDF
                      </Button>
                   </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead className="bg-white border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Siswa</th>
                            <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Nilai Rapor</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Analisis Capaian</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {recapData.map(row => (
                            <tr key={row.idSiswa} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-8 py-5">
                                    <div className="font-black text-slate-700 uppercase text-sm">{row.nama}</div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">NISN: {row.nisn || '-'}</div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <div className="inline-block px-4 py-2 rounded-xl bg-slate-100 font-black text-lg text-slate-700 border border-slate-200 min-w-[60px]">
                                        {row.finalScore}
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 text-[11px] font-bold text-slate-500 leading-relaxed uppercase bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            {row.description || <span className="opacity-30">Belum ada data TP yang dihubungkan ke entri nilai.</span>}
                                        </div>
                                        <Link to={`/reports/${selectedClass}/${row.idSiswa}`} className="w-10 h-10 rounded-xl bg-white border-2 border-slate-100 text-slate-300 flex items-center justify-center hover:border-primary hover:text-primary transition-all shrink-0" data-html2canvas-ignore>
                                            <ChevronRight size={20} />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </Card>

            <div className="pt-10 flex flex-col items-center">
               <button onClick={() => { setFinishStep(1); setFinishModalOpen(true); }} className="group relative flex items-center gap-4 bg-white border border-slate-200 pl-6 pr-2 py-2 rounded-full shadow-lg hover:shadow-xl hover:border-amber-200 transition-all hover:scale-105 active:scale-95">
                  <div className="flex flex-col items-start pr-4">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Langkah Akhir</span>
                     <span className="text-xs font-black text-slate-700 uppercase">Selesaikan Semester Ini</span>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-full flex items-center justify-center text-white shadow-lg">
                     <Archive size={20} />
                  </div>
               </button>
            </div>

            <Modal isOpen={finishModalOpen} onClose={() => !isFinishing && setFinishModalOpen(false)} title="Transisi Semester Baru" maxWidth="max-w-md">
               <div className="p-2">
                  {finishStep === 1 ? (
                     <div className="space-y-6 text-center">
                        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto text-indigo-950 mb-2"><AlertCircle size={40} /></div>
                        <div>
                           <h3 className="text-lg font-black text-slate-800 uppercase">Selesaikan Semester?</h3>
                           <p className="text-sm font-bold text-slate-500 mt-2">Data nilai lama tetap tersimpan tapi tidak akan muncul di dashboard utama.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-4">
                           <Button variant="secondary" onClick={() => setFinishModalOpen(false)} disabled={isFinishing}>Batal</Button>
                           <Button variant="primary" onClick={() => setFinishStep(2)}>Lanjutkan</Button>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-6">
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                           <div className="space-y-4">
                              <Input label="TAHUN AJARAN BARU" value={nextSettings.tahunAjaran} onChange={e => setNextSettings({...nextSettings, tahunAjaran: e.target.value})} />
                              <Select label="SEMESTER BARU" value={nextSettings.semester} onChange={e => setNextSettings({...nextSettings, semester: e.target.value})}>
                                 <option value="1">1 (GANJIL)</option>
                                 <option value="2">2 (GENAP)</option>
                              </Select>
                              <label className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer mt-4">
                                 <input type="checkbox" checked={nextSettings.autoBackup} onChange={e => setNextSettings({...nextSettings, autoBackup: e.target.checked})} className="w-4 h-4 rounded-md text-primary" />
                                 <div>
                                    <p className="text-[10px] font-black text-slate-700 uppercase">Simpan File Arsip (.json)</p>
                                 </div>
                              </label>
                           </div>
                        </div>
                        <Button variant="primary" className="w-full py-4 shadow-lg shadow-blue-500/20" onClick={handleFinishSemester} isLoading={isFinishing}>KONFIRMASI & PROSES</Button>
                     </div>
                  )}
               </div>
             </Modal>
         </PageTransition>

         <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
            <div ref={pdfRef} style={{ width: '800px', padding: '40px', backgroundColor: 'white', color: '#1e293b' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '4px solid #4f46e5', paddingBottom: '20px', marginBottom: '30px' }}>
                  <div>
                     <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#4f46e5', margin: 0, textTransform: 'uppercase' }}>Rekap Nilai e-Rapor</h1>
                     <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b', margin: '5px 0 0 0', textTransform: 'uppercase' }}>
                        {(profile?.schools || []).find(s => s.id === profile?.activeSchoolId)?.nama || (profile as any)?.sekolah || 'EduScore'} • KELAS {classes.find(c => c.idKelas === selectedClass)?.namaKelas}
                     </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <p style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', margin: 0 }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
               </div>
               <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                     <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>No</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Nama Siswa</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Nilai Rapor</th>
                     </tr>
                  </thead>
                  <tbody>
                     {recapData.sort((a,b) => a.nama.localeCompare(b.nama)).map((row, idx) => (
                        <tr key={row.idSiswa} style={{ borderBottom: '1px solid #f1f5f9' }}>
                           <td style={{ padding: '15px 8px', textAlign: 'center', fontSize: '13px', fontWeight: '900' }}>{idx + 1}</td>
                           <td style={{ padding: '15px 8px' }}>
                              <div style={{ fontSize: '15px', fontWeight: '900', textTransform: 'uppercase' }}>{row.nama}</div>
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>NISN: {row.nisn || '-'}</div>
                           </td>
                           <td style={{ padding: '15px 8px', textAlign: 'center', fontSize: '16px', fontWeight: '900', color: row.finalScore >= 75 ? '#059669' : '#dc2626' }}>{row.finalScore}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </Layout>
    );
};
