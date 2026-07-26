import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, FileSpreadsheet, FileText, Trash2, ChevronRight, 
  Trophy, BookOpen, ClipboardCheck, X, Zap, GraduationCap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Meeting } from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Select, Modal, Card,
  Header, Layout, PageTransition, useToast
} from '../Layout';
import { useTeacherProfile, useClasses } from '../../services/hooks';
import { autoFitColumns } from './SharedUtils';
import { QuickInputModal } from './QuickInputModal';

export const MeetingListScreen: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { profile } = useTeacherProfile();
  const { classes } = useClasses(profile?.activeSchoolId);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [isQuickInputOpen, setIsQuickInputOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });

  const loadData = useCallback(async () => {
    const schoolId = profile?.activeSchoolId || null;
    const m = await db.getMeetings(undefined, schoolId || undefined);
    setMeetings(m);
    if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0].idKelas);
  }, [profile?.activeSchoolId, classes, selectedClass]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMeetings = selectedClass 
    ? meetings.filter(m => m.idKelas === selectedClass)
    : meetings;

  const confirmDeleteMeeting = (id: string) => {
    setDeleteConfirmation({ isOpen: true, id });
  };

  const executeDeleteMeeting = async () => {
    const schoolId = profile?.activeSchoolId || null;
    if (deleteConfirmation.id) {
      try {
        await db.deleteMeeting(deleteConfirmation.id);
        showToast("Nilai berhasil dihapus");
        setMeetings(await db.getMeetings(undefined, schoolId || undefined));
        setDeleteConfirmation({ isOpen: false, id: null });
      } catch (err: any) {
        showToast("Gagal menghapus nilai: " + err.message, "error");
      }
    }
  };

  const currentClassName = classes.find(c => c.idKelas === selectedClass)?.namaKelas || "Semua Kelas";

  const exportRekapExcel = async () => {
    if (!selectedClass) {
      showToast("Pilih kelas terlebih dahulu", "warning");
      return;
    }
    showToast("Menyiapkan data...");
    const schoolId = profile?.activeSchoolId || '';
    const s = await db.getStudents(selectedClass, schoolId);
    const m = await db.getMeetings(selectedClass, schoolId);
    const allScores = await db.getAllScores(schoolId);
    const pts = await db.getStudentPoints(selectedClass, schoolId);

    const data = s.sort((a,b) => a.nama.localeCompare(b.nama)).map((std, i) => {
       const studentScores = allScores.filter(sc => sc.idSiswa === std.idSiswa && m.some(mt => mt.idPertemuan === sc.idPertemuan));
       const pScores = studentScores.filter(sc => m.find(mt => mt.idPertemuan === sc.idPertemuan)?.aspekPenilaian === 'Pengetahuan' && sc.nilaiAngka !== null);
       const pAvg = pScores.length ? (pScores.reduce((a,b) => a + (b.nilaiAngka || 0), 0) / pScores.length).toFixed(1) : '-';
       const kScores = studentScores.filter(sc => m.find(mt => mt.idPertemuan === sc.idPertemuan)?.aspekPenilaian === 'Keterampilan' && sc.nilaiAngka !== null);
       const kAvg = kScores.length ? (kScores.reduce((a,b) => a + (b.nilaiAngka || 0), 0) / kScores.length).toFixed(1) : '-';
       const sScores = studentScores.filter(sc => m.find(mt => mt.idPertemuan === sc.idPertemuan)?.aspekPenilaian === 'Sikap' && sc.nilaiAngka !== null);
       const sAvgBase = sScores.length ? (sScores.reduce((a,b) => a + (b.nilaiAngka || 0), 0) / sScores.length) : 85;
       const poinSiswa = pts.filter(p => p.idSiswa === std.idSiswa).reduce((a,b) => a + b.poin, 0);
       const finalSikapNum = Math.min(100, Math.max(0, sAvgBase + poinSiswa));
       let sLetter = 'E';
       if (finalSikapNum >= 91) sLetter = 'A';
       else if (finalSikapNum >= 81) sLetter = 'B';
       else if (finalSikapNum >= 71) sLetter = 'C';
       else if (finalSikapNum >= 60) sLetter = 'D';

       return {
          No: i + 1,
          Nama: std.nama,
          'Rerata Pengetahuan': pAvg,
          'Rata-rata Keterampilan': kAvg,
          'Nilai Sikap': sLetter,
          'Total Nilai Masuk': studentScores.length
       };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = autoFitColumns(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Nilai');
    XLSX.writeFile(wb, `Rekap_Nilai_${currentClassName}.xlsx`);
    showToast("Berhasil export ke Excel!");
  };

  const exportRekapPDF = () => {
    navigate(`/reports/view/${selectedClass}`);
    showToast("Klik tombol PDF di halaman Rekap");
  };

  return (
    <Layout>
      <Header 
        title="Input Nilai" 
        subtitle="Daftar pertemuan & penilaian kelas." 
        rightAction={
          <div className="flex gap-2 px-1">
            <Button variant="secondary" onClick={exportRekapExcel} className="!py-3 !px-6 !text-[13px] hidden md:flex"><FileSpreadsheet size={18} className="mr-2 text-indigo-950"/> Export Excel</Button>
            <Button variant="primary" onClick={exportRekapPDF} className="!py-3 !px-6 !text-[13px] hidden md:flex shadow-none"><FileText size={18} className="mr-2 text-white"/> Export PDF</Button>
          </div>
        }
      />
      
      {/* 3 Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Card 1: Input Nilai Per Pertemuan */}
        <Link to="/grading/meetings/new" className="group">
          <Card className="p-5 bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all h-full flex items-center gap-4 cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-950 flex items-center justify-center shrink-0 group-hover:bg-indigo-950 group-hover:text-white transition-all">
              <Plus size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-950 transition-colors">Pertemuan Baru</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Input nilai per pertemuan / harian</p>
            </div>
          </Card>
        </Link>

        {/* Card 2: Input Kilat (Cepat) */}
        <button onClick={() => setIsQuickInputOpen(true)} className="group text-left w-full cursor-pointer focus:outline-none">
          <Card className="p-5 bg-white border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all h-full flex items-center gap-4 cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Zap size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">Input Kilat</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Instan input nilai satu kolom kelas</p>
            </div>
          </Card>
        </button>

        {/* Card 3: Rekap e-Rapor */}
        <Link to="/grading/recap" className="group">
          <Card className="p-5 bg-white border border-slate-200 hover:border-purple-200 hover:shadow-md transition-all h-full flex items-center gap-4 cursor-pointer">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <GraduationCap size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm group-hover:text-purple-600 transition-colors">Rekap e-Rapor</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Finalisasi, rerata, & export rapor</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Filter Kelas */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8">
         <div className="w-full md:max-w-xs">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">Filter Kelas</label>
            <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              {classes.map(c => <option key={c.idKelas} value={c.idKelas}>{c.namaKelas}</option>)}
            </Select>
         </div>
      </div>

      <PageTransition className="mt-4 grid gap-4 md:gap-8">
        <div className="space-y-3 px-1 md:space-y-0 md:grid md:gap-6">
           <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 mb-2 md:mb-0">
              Menampilkan {filteredMeetings.length} Nilai untuk {currentClassName}
           </div>
           
            {filteredMeetings.length === 0 ? (
              <div className="py-20 text-center opacity-40">
                 <FileText size={48} className="mx-auto mb-4 text-slate-300"/>
                 <p className="font-bold text-slate-400 uppercase tracking-widest">Belum ada pertemuan</p>
              </div>
            ) : (
              filteredMeetings.map(m => (
                <React.Fragment key={m.idPertemuan}>
                  <Link to={`/grading/score/${m.idPertemuan}`} className="md:hidden block group">
                    <div className={`bg-white rounded-2xl p-3 border-2 ${m.assessmentCategory === 'Sumatif' ? 'border-indigo-900' : 'border-indigo-600'} flex items-center justify-between shadow-sm active:scale-95 transition-all relative overflow-hidden`}>
                         <div className="flex items-center gap-3 relative z-10">
                             <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${m.assessmentCategory === 'Sumatif' ? 'bg-indigo-50 text-indigo-950 border-indigo-100' : 'bg-blue-50 text-indigo-600 border-blue-100'} border transition-colors group-hover:bg-indigo-950 group-hover:text-white`}>
                                 {m.assessmentCategory === 'Sumatif' ? <Trophy size={18} className="text-indigo-900" /> : <BookOpen size={18} />}
                             </div>
                             <div className="min-w-0">
                                 <h3 className="font-black text-slate-800 text-[13px] uppercase tracking-tight group-hover:text-indigo-950 transition-colors truncate leading-tight">{m.materi}</h3>
                                 <div className="flex items-center gap-1.5 mt-0.5">
                                     <span className={`text-[9px] font-black uppercase tracking-widest ${m.assessmentCategory === 'Sumatif' ? 'text-indigo-950' : 'text-indigo-600'}`}>{m.activityType}</span>
                                     <span className="text-[9px] text-slate-300 font-bold">•</span>
                                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">Ke-{m.urutanKe} • {new Date(m.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                 </div>
                             </div>
                         </div>
                         <div className="flex items-center gap-1 relative z-10">
                              <button 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); confirmDeleteMeeting(m.idPertemuan); }} 
                                  className="p-2 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                               >
                                  <Trash2 size={16} />
                               </button>
                               <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-950 group-hover:translate-x-1 transition-all" />
                         </div>
                     </div>
                   </Link>
 
                   <div className={`hidden md:flex bg-white rounded-3xl p-8 shadow-sm border-l-[12px] ${m.assessmentCategory === 'Sumatif' ? 'border-indigo-900' : 'border-indigo-600'} hover:shadow-xl transition-all group gap-8 items-center relative overflow-hidden`}>
                     <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                     <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner relative z-10 ${m.assessmentCategory === 'Sumatif' ? 'bg-indigo-50 text-indigo-950' : 'bg-blue-50 text-indigo-600'}`}>
                         {m.assessmentCategory === 'Sumatif' ? <Trophy size={32} /> : <BookOpen size={32} />}
                     </div>
                     <div className="flex-1 min-w-0 relative z-10">
                         <div className="flex items-center gap-3 mb-1">
                           <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${m.assessmentCategory === 'Sumatif' ? 'bg-indigo-100 text-indigo-950 border-indigo-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                               {m.activityType}
                           </span>
                           <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{new Date(m.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                         </div>
                         <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight truncate leading-tight">{m.materi}</h3>
                         <p className="text-sm text-slate-400 font-bold truncate mt-0.5">Pertemuan Ke-{m.urutanKe} • {m.activityName}</p>
                     </div>
                     <div className="flex items-center gap-3 relative z-10">
                         <Link to={`/grading/score/${m.idPertemuan}`}>
                            <button className={`h-14 px-8 rounded-full flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-md cursor-pointer ${m.assessmentCategory === 'Sumatif' ? 'bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white shadow-[#3B66F5]/25' : 'bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white shadow-[#3B66F5]/25'}`}>
                               <ClipboardCheck size={20} />
                               <span>Input Nilai</span>
                           </button>
                         </Link>
                         <button 
                           onClick={() => confirmDeleteMeeting(m.idPertemuan)} 
                           className="h-14 w-14 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 shadow-sm active:scale-95 cursor-pointer"
                         >
                           <Trash2 size={20} />
                         </button>
                     </div>      
                  </div>
                </React.Fragment>
              ))
            )}
        </div>
      </PageTransition>

      <Modal isOpen={deleteConfirmation.isOpen} onClose={() => setDeleteConfirmation({ isOpen: false, id: null })} title="Hapus Nilai?">
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
                 Tindakan ini tidak dapat dibatalkan. <br/>
                 Seluruh <strong>Nilai Siswa</strong> yang telah diinput pada entri ini akan terhapus.
              </p>
           </div>
           <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setDeleteConfirmation({ isOpen: false, id: null })} className="flex-1 !py-4">Batal</Button>
              <Button variant="danger" onClick={executeDeleteMeeting} className="flex-1 !py-4 shadow-lg shadow-red-500/20">Hapus Nilai</Button>
           </div>
        </div>
      </Modal>

      <QuickInputModal 
        isOpen={isQuickInputOpen} 
        onClose={() => setIsQuickInputOpen(false)} 
        profile={profile} 
        onSave={loadData} 
      />
    </Layout>
  );
};
