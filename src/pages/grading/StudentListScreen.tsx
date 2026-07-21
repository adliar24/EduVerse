import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Plus, Trash2, Users, ClipboardCheck, Download, 
  FileSpreadsheet, QrCode, Trophy, BookOpen, ChevronRight,
  X, AlertCircle, User, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { ClassData, Student, Meeting } from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Input, Card, Modal,
  Header, Layout, PageTransition, useToast, Skeleton
} from '../Layout';
import { useTeacherProfile, useStudents } from '../../services/hooks';

export const StudentListScreen: React.FC = () => {
  const { idKelas } = useParams();
  const { showToast } = useToast();
  const { profile } = useTeacherProfile();
  const { students, loading: studentsLoading, refreshStudents } = useStudents(idKelas, profile?.activeSchoolId);
  
  const [currentClass, setCurrentClass] = useState<ClassData | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const fileImportRef = useRef<HTMLInputElement>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'siswa' | 'nilai'>('siswa');
  const [classMeetings, setClassMeetings] = useState<Meeting[]>([]);
  const [deleteMeetingConf, setDeleteMeetingConf] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });

  useEffect(() => {
    if (idKelas) {
      db.getClassById(idKelas).then(res => setCurrentClass(res || null));
      refreshClassMeetings();
    }
  }, [idKelas]);

  const refreshClassMeetings = async () => {
    if (!idKelas) return;
    const schoolId = profile?.activeSchoolId || null;
    const m = await db.getMeetings(idKelas, schoolId || undefined);
    setClassMeetings(m);
  };

  const executeDeleteMeeting = async () => {
    if (deleteMeetingConf.id) {
      try {
        await db.deleteMeeting(deleteMeetingConf.id);
        showToast("Nilai berhasil dihapus");
        refreshClassMeetings();
        setDeleteMeetingConf({ isOpen: false, id: null });
      } catch (err: any) {
        showToast("Gagal menghapus nilai: " + err.message, "error");
      }
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !idKelas) return;
    const schoolId = profile?.activeSchoolId || '';
    try {
      await db.saveStudent({ idSiswa: crypto.randomUUID(), schoolId, idKelas, nama: newStudentName.trim() });
      showToast("Murid berhasil ditambahkan");
      refreshStudents();
      setNewStudentName('');
    } catch (err: any) {
      showToast("Gagal menambah murid: " + err.message, "error");
    }
  };

  const handleDownloadTemplate = () => {
    const data = [
      ["Nama Siswa"],
      ["Budi Santoso"],
      ["Ani Wijaya"],
      ["Zulkhairil"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Templat");
    XLSX.writeFile(wb, "templat_siswa_eduscore.xlsx");
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !idKelas) return;
    const currentClassId: string = idKelas as string;

    const reader = new FileReader();
    reader.onload = async (event: ProgressEvent<FileReader>) => {
      try {
        const target = event.target;
        if (!target?.result) return;
        const data = new Uint8Array(target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = String(workbook.SheetNames[0]);
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        const firstRow = jsonData[0] || [];
        const firstCell = firstRow[0] ? String(firstRow[0]) : "";
        const startIdx = firstCell.toLowerCase().includes("nama") ? 1 : 0;

        const prof = await db.getTeacherProfile();
        const schoolId = prof?.activeSchoolId || '';
        for (let i = startIdx; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && row[0]) {
              await db.saveStudent({ 
                idSiswa: crypto.randomUUID(), 
                schoolId,
                idKelas: currentClassId, 
                nama: String(row[0] || "").trim() 
              });
            }
          }
          refreshStudents();
          showToast("Murid berhasil diimpor!");
        } catch (err) {
          showToast("Gagal membaca file Excel.", "error");
          console.error(err);
        }
      };
      reader.readAsArrayBuffer(file);
    };

  const confirmDeleteStudent = (id: string) => {
    setDeleteConfirmation({ isOpen: true, id });
  };

  const executeDeleteStudent = async () => {
    if (deleteConfirmation.id) {
      try {
        await db.deleteStudent(deleteConfirmation.id);
        showToast("Murid berhasil dihapus");
        refreshStudents();
        setDeleteConfirmation({ isOpen: false, id: null });
      } catch (err: any) {
        showToast("Gagal menghapus murid: " + err.message, "error");
      }
    }
  };

  return (
    <Layout>
      <Header title={currentClass?.namaKelas || '—'} subtitle={currentClass?.mapel} backTo="/classes" />
      
      <div className="mt-6 -mx-2 px-2 overflow-x-auto custom-scrollbar-hide">
          <div className="flex bg-white p-1.5 rounded-[2rem] border border-slate-200 shadow-sm w-full max-w-md">
              <button 
                  onClick={() => setActiveTab('siswa')}
                  className={`flex-1 py-4 px-6 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'siswa' 
                      ? 'bg-gradient-primary text-white shadow-lg shadow-blue-900/20 scale-[1.02]' 
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
              >
                  <Users size={16} /> Murid
              </button>
              <button 
                  onClick={() => setActiveTab('nilai')}
                  className={`flex-1 py-4 px-6 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'nilai' 
                      ? 'bg-gradient-primary text-white shadow-lg shadow-blue-900/20 scale-[1.02]' 
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
              >
                  <ClipboardCheck size={16} /> Riwayat Nilai
              </button>
          </div>
      </div>

      <PageTransition className="mt-8 space-y-8">
        {activeTab === 'siswa' ? (
          <>
            <input type="file" ref={fileImportRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
            
            <div className="flex flex-col gap-4">
              <div className="bg-white p-4 md:p-7 rounded-[2rem] md:rounded-[2.5rem] border-2 border-blue-50 shadow-md flex gap-3 md:gap-5 items-center">
                <div className="flex-1">
                  <Input 
                    placeholder="Masukkan nama murid..." 
                    value={newStudentName} 
                    onChange={e => setNewStudentName(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleAddStudent()} 
                    className="!border-none !ring-0 !bg-slate-50 !font-black !py-4" 
                  />
                </div>
                <Button onClick={handleAddStudent} variant="primary" className="!p-4 !rounded-2xl shrink-0"><Plus strokeWidth={4}/></Button>
              </div>
              
              <div className="flex flex-wrap gap-2 md:gap-3 justify-end px-2">
                <Button variant="secondary" onClick={handleDownloadTemplate} className="!text-[9px] md:!text-[10px] !rounded-xl !px-4 !py-2.5 md:!px-5 md:!py-3 font-black tracking-widest uppercase shadow-sm border-slate-200">
                  <Download size={14} className="mr-2 text-primary"/> Templat
                </Button>
                <Button variant="secondary" onClick={() => fileImportRef.current?.click()} className="!text-[9px] md:!text-[10px] !rounded-xl !px-4 !py-2.5 md:!px-5 md:!py-3 font-black tracking-widest uppercase shadow-sm border-slate-200">
                  <FileSpreadsheet size={14} className="mr-2 text-emerald-600"/> Impor
                </Button>
                <Button variant="accent" onClick={() => setIsQRModalOpen(true)} className="!text-[9px] md:!text-[10px] !rounded-xl !px-4 !py-2.5 md:!px-5 md:!py-3 font-black tracking-widest uppercase shadow-sm border-slate-200 bg-white hover:bg-slate-50 !text-slate-800">
                  <QrCode size={14} className="mr-2 text-indigo-500"/> Kartu QR
                </Button>
              </div>
            </div>

        <div className="bg-white rounded-[2rem] md:rounded-[3rem] no-box-border overflow-hidden">
              <div className="px-6 py-4 md:px-10 md:py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-black text-slate-400 text-[10px] md:text-xs tracking-widest uppercase">Daftar Murid ({students.length})</h3>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {studentsLoading ? (
                  <div className="p-10 space-y-4">
                    {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-32 text-center text-slate-300 font-black uppercase tracking-widest text-xs">Kosong</div>
                ) : (
                  students.sort((a,b) => a.nama.localeCompare(b.nama)).map((std, idx) => (
                    <div key={std.idSiswa} className="px-6 py-4 md:px-10 md:py-6 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-4 md:gap-8 overflow-hidden">
                        <span className="text-xs font-black text-slate-400 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg tabular-nums">{idx + 1}</span>
                        <div className="font-black text-slate-700 text-sm md:text-lg uppercase tracking-wide truncate">{std.nama}</div>
                      </div>
                      <button 
                        onClick={() => confirmDeleteStudent(std.idSiswa)} 
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-95 flex-shrink-0 shadow-sm"
                        title="Hapus Murid"
                      >
                        <Trash2 size={18} strokeWidth={2.5}/>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
              <div className="flex justify-between items-center px-2">
                 <h3 className="font-black text-slate-400 text-[10px] md:text-xs tracking-widest uppercase">Riwayat Nilai ({classMeetings.length})</h3>
                 <Link to="/meetings/new">
                    <Button variant="primary" className="!rounded-xl !py-2 !px-4 text-[9px] uppercase tracking-widest"><Plus size={14} className="mr-1" /> Baru</Button>
                 </Link>
              </div>

              {classMeetings.length === 0 ? (
                <div className="py-32 text-center opacity-30">
                    <ClipboardCheck size={48} className="mx-auto mb-4 text-slate-300"/>
                    <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Belum ada nilai di kelas ini</p>
                </div>
              ) : (
                <div className="grid gap-3 px-1">
                    {classMeetings.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map(m => (
                        <Link key={m.idPertemuan} to={`/grading/${m.idPertemuan}`} className="group">
                            <div className={`bg-white rounded-2xl p-3 border-2 ${m.assessmentCategory === 'Sumatif' ? 'border-amber-400' : 'border-primary'} flex items-center justify-between shadow-sm active:scale-95 transition-all relative overflow-hidden`}>
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${m.assessmentCategory === 'Sumatif' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-primary'} border border-slate-100 transition-colors group-hover:bg-primary group-hover:text-white`}>
                                        {m.assessmentCategory === 'Sumatif' ? <Trophy size={18} /> : <BookOpen size={18} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-slate-800 text-[13px] uppercase tracking-tight group-hover:text-primary transition-colors truncate leading-tight">{m.materi}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${m.assessmentCategory === 'Sumatif' ? 'text-amber-600' : 'text-primary'}`}>{m.activityType}</span>
                                            <span className="text-[9px] text-slate-300 font-bold">•</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">Ke-{m.urutanKe} • {new Date(m.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 relative z-10">
                                    <button 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteMeetingConf({ isOpen: true, id: m.idPertemuan }); }}
                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
              )}
          </div>
        )}
      </PageTransition>

      <Modal isOpen={deleteMeetingConf.isOpen} onClose={() => setDeleteMeetingConf({ isOpen: false, id: null })} title="Hapus Nilai?">
        <div className="py-2 text-center space-y-6">
           <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-4 animate-pop">
              <ClipboardCheck size={40} />
              <div className="absolute top-0 right-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                  <X size={16} strokeWidth={3} />
              </div>
           </div>
           <div>
              <h3 className="text-xl font-black text-slate-800 uppercase mb-2">Hapus Penilaian</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                 Seluruh <strong>Nilai Murid</strong> yang telah diinput pada entri ini akan terhapus permanen.
              </p>
           </div>
           <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setDeleteMeetingConf({ isOpen: false, id: null })} className="flex-1 !py-4 !rounded-2xl">Batal</Button>
              <Button variant="danger" onClick={executeDeleteMeeting} className="flex-1 !py-4 !rounded-2xl shadow-lg shadow-red-500/20">Hapus Nilai</Button>
           </div>
        </div>
      </Modal>

      <Modal isOpen={deleteConfirmation.isOpen} onClose={() => setDeleteConfirmation({ isOpen: false, id: null })} title="Hapus Murid?">
        <div className="py-2 text-center space-y-6">
           <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-4 animate-pop">
              <User size={40} />
              <div className="absolute top-0 right-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-white">
                  <X size={16} strokeWidth={3} />
              </div>
           </div>
           <div>
              <h3 className="text-xl font-black text-slate-800 uppercase mb-2">Konfirmasi Hapus</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                 Yakin ingin menghapus murid ini? <br/>
                 Semua <strong>Nilai</strong> dan <strong>Poin</strong> murid tersebut akan hilang permanen.
              </p>
           </div>
           <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setDeleteConfirmation({ isOpen: false, id: null })} className="flex-1 !py-4 !rounded-2xl">Batal</Button>
              <Button variant="danger" onClick={executeDeleteStudent} className="flex-1 !py-4 !rounded-2xl shadow-lg shadow-red-500/20">Hapus</Button>
           </div>
        </div>
      </Modal>

      <StudentQRModal 
        isOpen={isQRModalOpen} 
        onClose={() => setIsQRModalOpen(false)} 
        students={students} 
        className={currentClass?.namaKelas || ""}
      />
    </Layout>
  );
};

export const StudentQRModal: React.FC<{ 
  isOpen: boolean, 
  onClose: () => void, 
  students: Student[], 
  className: string 
}> = ({ isOpen, onClose, students, className }) => {
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && students.length > 0) {
      generateAllQRs();
    }
  }, [isOpen, students]);

  const generateAllQRs = async () => {
    setIsGenerating(true);
    const urls: Record<string, string> = {};
    for (const s of students) {
      try {
        const url = await QRCode.toDataURL(s.idSiswa, {
          width: 250,
          margin: 2,
          color: { dark: '#1e293b', light: '#ffffff' }
        });
        urls[s.idSiswa] = url;
      } catch (err) {
        console.error(err);
      }
    }
    setQrUrls(urls);
    setIsGenerating(false);
  };

  const handleDownloadZip = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`QR_Cards_${className}`) || zip.folder('QR_Cards');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      for (const student of students) {
        if (!qrUrls[student.idSiswa]) continue;

        const templateImg = new Image();
        await new Promise((resolve, reject) => {
          templateImg.onload = resolve;
          templateImg.onerror = () => reject(new Error("Gagal memuat template: Pastikan qr-template.png ada di folder root"));
          templateImg.src = '/qr-template.png';
        });

        const width = templateImg.width;
        const height = templateImg.height;
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(templateImg, 0, 0, width, height);
        const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
          const words = text.split(' ');
          let line = '';
          let lines = [];
          for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = context.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          lines.push(line);
          for (let k = 0; k < lines.length; k++) {
            context.fillText(lines[k].trim(), x, y + (k * lineHeight));
          }
          return lines.length;
        };

        const qrImg = new Image();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        await new Promise(resolve => {
          qrImg.onload = resolve;
          qrImg.src = qrUrls[student.idSiswa];
        });

        const qrSize = Math.floor(width * 0.56); 
        const qrX = (width - qrSize) / 2;
        const qrY = Math.floor(height * 0.295); 
        
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        const batchW = 85;
        const batchH = 36;
        const batchX = width - batchW - 25;
        const batchY = 22;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        (ctx as any).roundRect(batchX, batchY, batchW, batchH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const classText = className.toUpperCase();
        const words = classText.split(' ');
        let testLines = 0;
        let line = '';
        for (let n = 0; n < words.length; n++) {
          let testLine = line + words[n] + ' ';
          if (ctx.measureText(testLine).width > (batchW - 10) && n > 0) {
            testLines++;
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        testLines++;
        
        const lineHeight = 15;
        const totalTextH = testLines * lineHeight;
        const startYClass = batchY + (batchH - totalTextH) / 2;
        wrapText(ctx, classText, batchX + batchW / 2, startYClass, batchW - 10, lineHeight);

        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = '#1e293b'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        const name = student.nama.toUpperCase();
        const nameY = qrY + qrSize + 70; 
        wrapText(ctx, name, width / 2, nameY, qrSize + 30, 26);

        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const base64Data = dataUrl.split(',')[1];
        folder.file(`${student.nama}.png`, base64Data, { base64: true });

      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `QR_Cards_EduScore_${className}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh ZIP: ' + err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cetak Kartu QR Murid" fullScreen>
      <div className="space-y-8 pb-20">
        <div className="flex justify-between items-center bg-gradient-primary p-6 rounded-[2rem] border border-white/20 shadow-xl shadow-blue-900/10 no-print">
          <div>
            <h3 className="font-black text-xl text-white uppercase">Kartu QR EduScore</h3>
            <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mt-1">Gunakan untuk input poin Penghargaan & Hukuman</p>
          </div>
          <Button onClick={handleDownloadZip} variant="accent" className="!rounded-2xl shadow-lg bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-none">
            <Download size={20} className="mr-3" /> Unduh ZIP
          </Button>
        </div>

        {isGenerating ? (
          <div className="py-20 text-center">
            <Loader2 className="animate-spin mx-auto text-primary mb-4" size={40} />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Menyiapkan Kartu QR...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-2 print-grid">
            {students.sort((a,b) => a.nama.localeCompare(b.nama)).map(std => (
              <div 
                key={std.idSiswa} 
                className="relative aspect-[4/5.5] border-2 border-transparent rounded-2xl overflow-hidden shadow-md group hover:shadow-xl transition-all qr-card-print"
                style={{ 
                  backgroundImage: "url('/qr-template.png')", 
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                 <div className="absolute top-[4%] right-[6%] w-[22%] h-[6%] flex items-center justify-center bg-white/10 border border-white/20 backdrop-blur-[4px] rounded-lg text-[6px] font-black text-white uppercase leading-tight text-center px-1">
                    {className}
                 </div>
                 
                 <div className="absolute top-[29.5%] left-1/2 -translate-x-1/2 w-[56%] aspect-square flex items-center justify-center">
                    {qrUrls[std.idSiswa] ? (
                      <img src={qrUrls[std.idSiswa]} alt="QR" className="w-full h-full object-contain mix-blend-multiply opacity-90" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-200/30 animate-pulse rounded-lg" />
                    )}
                 </div>

                 <div className="absolute top-[81%] left-0 right-0 px-6 text-center">
                    <h4 className="font-extrabold text-slate-800 uppercase text-[9px] sm:text-[10px] leading-tight line-clamp-3">
                       {std.nama}
                    </h4>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-grid, .print-grid * { visibility: visible; }
          .print-grid { position: absolute; left: 0; top: 0; width: 100%; display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 20px !important; }
          .no-print { display: none !important; }
          .qr-card-print { border: 1px solid #eee !important; page-break-inside: avoid; }
        }
      `}</style>
    </Modal>
  );
};
