import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileSpreadsheet, FileText, Users, BookOpen, 
  TrendingUp, Star, Info, CheckCircle2, 
  ClipboardCheck, GraduationCap, Database, Plus, Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Student, StudentPoint, DEFAULT_WEIGHTS } from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button,
  Header, Layout, PageTransition, useToast
} from '../Layout';
import { useTeacherProfile } from '../../services/hooks';
import { autoFitColumns } from './SharedUtils';

export const StudentReportDetailScreen: React.FC = () => {
  const { showToast } = useToast();
   const reportRef = useRef<HTMLDivElement>(null);
   const pdfRef = useRef<HTMLDivElement>(null);
   const { idKelas, idSiswa } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [pointHistory, setPointHistory] = useState<StudentPoint[]>([]);
  const [detailedAverages, setDetailedAverages] = useState<any[]>([]);
  const [currentClass, setCurrentClass] = useState<any>(null);
  const [points, setPoints] = useState<number>(0);
  const [averages, setAverages] = useState({ formatif: '-', sumatif: '-', pts: '-', pas: '-', final: '-' });
  const [counts, setCounts] = useState({ formatif: 0, sumatif: 0, pts: 0, pas: 0 });
  const [description, setDescription] = useState("");
  const { profile } = useTeacherProfile();

  useEffect(() => {
    if (!idKelas || !idSiswa) return;
    const load = async () => {
      const prof = await db.getTeacherProfile();
      const schoolId = prof?.activeSchoolId || '';
      const cls = await db.getClassById(idKelas);
      const allLos = await db.getLearningObjectives();
      setCurrentClass(cls || null);
      const s = await db.getStudentById(idSiswa);
      const m = await db.getMeetings(idKelas, schoolId || undefined);
      const sc = await db.getAllScores(schoolId || undefined);
      const pts = await db.getStudentPoints(idKelas, schoolId || undefined);
       
      const data = m.map(mt => {
        const score = sc.find(x => x.idPertemuan === mt.idPertemuan && x.idSiswa === idSiswa);
        return { ...mt, score: score?.nilaiAngka, stars: score?.bintang };
      });

      const studentPointsList = pts.filter(p => p.idSiswa === idSiswa).sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
      const totalPoints = studentPointsList.reduce((a, b) => a + b.poin, 0);
      
      const getAvg = (cat: string) => {
         const filtered = data.filter(d => d.assessmentCategory === cat && d.score !== null);
         return filtered.length ? (filtered.reduce((a, b) => a + (b.score || 0), 0) / filtered.length) : 0;
      };

      const avgF = getAvg('Formatif');
      const avgS = getAvg('Sumatif');
      const avgPTS = getAvg('PTS');
      const avgPAS = getAvg('PAS');
      
      const weights = prof?.weights || DEFAULT_WEIGHTS;
      const finalScore = (
          (avgF * (weights.formatif / 100)) +
          (avgS * (weights.sumatif / 100)) +
          (avgPTS * (weights.pts / 100)) +
          (avgPAS * (weights.pas / 100))
      );

      const materialGroups: Record<string, { formatif: number[], sumatif: number[] }> = {};
      data.forEach(d => {
          if (!materialGroups[d.materi]) materialGroups[d.materi] = { formatif: [], sumatif: [] };
          if (d.score !== null) {
              if (d.assessmentCategory === 'Formatif') materialGroups[d.materi].formatif.push(d.score);
              if (d.assessmentCategory === 'Sumatif') materialGroups[d.materi].sumatif.push(d.score);
          }
      });
      const detailed = Object.entries(materialGroups).map(([materi, scores]) => ({
          materi,
          avgF: scores.formatif.length ? (scores.formatif.reduce((a,b) => a+b, 0) / scores.formatif.length).toFixed(1) : '-',
          avgS: scores.sumatif.length ? (scores.sumatif.reduce((a,b) => a+b, 0) / scores.sumatif.length).toFixed(1) : '-'
      })).filter(x => x.avgF !== '-' || x.avgS !== '-');

      const tpScores: Record<string, number[]> = {};
      data.forEach(d => {
          if (d.idTP && d.score !== null) {
              if (!tpScores[d.idTP]) tpScores[d.idTP] = [];
              tpScores[d.idTP].push(d.score);
          }
      });
      const tpAverages = Object.entries(tpScores).map(([idTP, vals]) => ({
          idTP,
          avg: vals.reduce((a,b) => a+b, 0) / vals.length
      })).sort((a,b) => b.avg - a.avg);

      let desc = "";
      if (tpAverages.length > 0) {
          const topTP = allLos.find(lo => lo.id === tpAverages[0].idTP);
          const bottomTP = tpAverages.length > 1 ? allLos.find(lo => lo.id === tpAverages[tpAverages.length - 1].idTP) : null;
          desc = `Menunjukkan penguasaan yang sangat baik dalam ${topTP?.deskripsi || 'materi terkait'}`;
          if (bottomTP && tpAverages[tpAverages.length - 1].avg < 75) {
              desc += `, perlu bimbingan lebih lanjut dalam ${bottomTP.deskripsi}`;
          } else {
              desc += ".";
          }
      }

      setStudent(s || null);
      setReportData(data);
      setPointHistory(studentPointsList);
      setDetailedAverages(detailed);
      setPoints(totalPoints);
      setDescription(desc);
      setCounts({
          formatif: data.filter(d => d.assessmentCategory === 'Formatif' && d.score !== null).length,
          sumatif: data.filter(d => d.assessmentCategory === 'Sumatif' && d.score !== null).length,
          pts: data.filter(d => d.assessmentCategory === 'PTS' && d.score !== null).length,
          pas: data.filter(d => d.assessmentCategory === 'PAS' && d.score !== null).length
      });
      setAverages({
        formatif: avgF ? avgF.toFixed(1) : '-',
        sumatif: avgS ? avgS.toFixed(1) : '-',
        pts: avgPTS ? avgPTS.toFixed(1) : '-',
        pas: avgPAS ? avgPAS.toFixed(1) : '-',
        final: finalScore.toFixed(0)
      });
    };
    load();
  }, [idKelas, idSiswa]);

  const exportPDF = async () => {
    if (!pdfRef.current || !student) return;
    showToast("Menyiapkan PDF...");
    
    try {
       const opt: any = {
          margin:       [10, 10, 10, 10],
          filename:     `Laporan_${student.nama}.pdf`,
          image:        { type: 'jpeg', quality: 0.9 },
          html2canvas:  { scale: 1.8, useCORS: true, width: 800 },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
          pagebreak:    { mode: 'css' }
       };
       await html2pdf().from(pdfRef.current).set(opt).save();
    } catch (error) {
       showToast("Gagal export PDF", "error");
    }
  };

  if (!student) return null;

  return (
    <Layout>
      <Header 
        title="Laporan Detail" 
        subtitle="Analisis Capaian Siswa" 
        backTo={`/reports/view/${idKelas}`} 
        rightAction={
          <div className="flex gap-2 px-1">
            <Button variant="secondary" onClick={() => {
                const data = reportData.map(r => ({
                    Materi: r.materi,
                    Aspek: r.aspekPenilaian,
                    Nilai: r.score
                }));
                const ws = XLSX.utils.json_to_sheet(data);
                ws['!cols'] = autoFitColumns(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Detail');
                XLSX.writeFile(wb, `Laporan_${student.nama}.xlsx`);
            }} className="!py-3 !px-6 !text-[13px] !bg-white/50 backdrop-blur-md border-slate-200 hidden md:flex">
                <FileSpreadsheet size={18} className="mr-2 text-emerald-600"/> Excel
            </Button>
            <Button variant="accent" onClick={exportPDF} className="!py-3 !px-6 !text-[13px] shadow-glow-gold hidden md:flex">
                <FileText size={18} className="mr-2 text-primaryDark/60"/> Export PDF
            </Button>
          </div>
        }
      />
      <div ref={reportRef} data-pdf-detail className="bg-slate-50 min-h-screen">
         <PageTransition className="space-y-6 pb-20">
            <div className="bg-gradient-primary p-8 md:p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden animate-fade">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
               <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-[80px] -ml-24 -mb-24"></div>
               
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                     <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-[0.3em] mb-4 border border-white/10">Murid</span>
                     <h2 className="text-xl md:text-3xl font-black tracking-tighter uppercase leading-tight">{student.nama}</h2>
                     <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-6 opacity-80">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"><Users size={14} /></div>
                           <span className="text-sm font-bold uppercase">{currentClass?.namaKelas}</span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"><BookOpen size={14} /></div>
                           <span className="text-sm font-bold uppercase truncate max-w-[200px]">{currentClass?.mapel}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex gap-3 md:hidden" data-html2canvas-ignore>
                <Button variant="secondary" onClick={() => {
                    const data = reportData.map(r => ({ Materi: r.materi, Aspek: r.aspekPenilaian, Nilai: r.score }));
                    const ws = XLSX.utils.json_to_sheet(data);
                    ws['!cols'] = autoFitColumns(data);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Detail');
                    XLSX.writeFile(wb, `Laporan_${student.nama}.xlsx`);
                }} className="flex-1 h-14 text-[13px] uppercase font-black tracking-widest shadow-sm">
                    <FileSpreadsheet size={18} className="mr-2 text-emerald-600" /> Excel
                </Button>
                <Button variant="accent" onClick={exportPDF} className="flex-1 h-14 text-[13px] uppercase font-black tracking-widest shadow-glow-gold">
                    <FileText size={18} className="mr-2 text-red-500" /> PDF
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
               {[
                  { label: 'Nilai Rapor', val: averages.final, count: 'Prediksi', icon: TrendingUp, color: 'text-white', bg: 'bg-gradient-primary', border: 'border-transparent', isFeatured: true },
                  { label: 'Formatif', val: averages.formatif, count: counts.formatif, icon: ClipboardCheck, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
                  { label: 'Sumatif', val: averages.sumatif, count: counts.sumatif, icon: CheckCircle2, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
                  { label: 'PTS / PAS', val: `${averages.pts} / ${averages.pas}`, count: counts.pts + counts.pas, icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
                  { label: 'Poin', val: points, count: pointHistory.length, icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' }
               ].map((st, i) => (
                  <div key={i} className={`${st.isFeatured ? 'bg-gradient-primary text-white shadow-lg scale-105 z-10' : 'bg-white text-slate-800'} p-6 rounded-[2rem] border ${st.border} shadow-sm flex flex-col items-center text-center group hover:border-primary/20 transition-all active:scale-95`}>
                     <div className={`w-12 h-12 ${st.isFeatured ? 'bg-white/20 text-white' : st.bg + ' ' + st.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <st.icon size={20} strokeWidth={2.5} />
                     </div>
                     <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${st.isFeatured ? 'text-blue-100' : 'text-slate-400'}`}>{st.label}</span>
                     <span className={`text-2xl md:text-3xl font-black ${st.val === '-' ? (st.isFeatured ? 'text-white/30' : 'text-slate-200') : (st.isFeatured ? 'text-white' : 'text-slate-800')}`}>{st.val}</span>
                     <span className={`text-[9px] font-bold uppercase mt-1 ${st.isFeatured ? 'text-blue-200' : 'text-slate-300'}`}>{st.count} {typeof st.count === 'number' ? 'Sesi' : ''}</span>
                  </div>
               ))}
            </div>

            {description && (
                <div className="bg-slate-900 rounded-[2rem] p-6 md:p-8 text-white relative overflow-hidden shadow-xl group">
                   <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:scale-125 transition-transform duration-1000"></div>
                   <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner backdrop-blur-md">
                         <Info size={24} className="text-accent" strokeWidth={2.5} />
                      </div>
                      <div>
                         <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent mb-2 block">Analisis Capaian Kompetensi</span>
                         <p className="text-sm md:text-base font-bold leading-relaxed uppercase tracking-tight opacity-90">{description}</p>
                      </div>
                   </div>
                </div>
             )}

            <div className="space-y-10">
               {pointHistory.length > 0 && (
                  <div className="space-y-6">
                     <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Catatan Poin & Karakter</h3>
                        <div className="px-4 py-1.5 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Total {points} Poin</div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pointHistory.map(p => (
                           <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center group hover:border-purple-200 transition-all hover:shadow-md">
                              <div className="flex items-center gap-5">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${p.poin >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 'bg-red-50 border-red-100 text-red-500'}`}>
                                    {p.poin >= 0 ? <Plus size={18} strokeWidth={3} /> : <Trash2 size={18} strokeWidth={3} />}
                                 </div>
                                 <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</p>
                                    <h4 className="font-bold text-slate-800 text-[13px] uppercase leading-relaxed group-hover:text-purple-600 transition-colors">{p.keterangan}</h4>
                                 </div>
                              </div>
                              <div className={`text-2xl font-black ${p.poin >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                 {p.poin >= 0 ? '+' : ''}{p.poin}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </div>

            <div className="space-y-6 pt-10">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Riwayat Sesi Belajar</h3>
                  <div className="flex gap-2">
                     <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                     <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                     <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {reportData.length === 0 ? (
                  <div className="col-span-full bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
                     <Database size={40} className="mx-auto text-slate-100 mb-4" />
                     <p className="italic text-slate-300 uppercase text-[10px] font-black tracking-widest">Belum ada data aktivitas tersedia</p>
                  </div>
               ) : (
                  reportData.map(item => (
                  <div key={item.idPertemuan} className="bg-white p-6 md:p-8 rounded-[2.25rem] border border-slate-100 shadow-sm flex justify-between items-center transition-all hover:shadow-lg hover:border-primary/20 group">
                     <div className="min-w-0 flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner shrink-0 transition-transform group-hover:scale-110 ${
                           item.score >= 90 ? 'bg-emerald-50 text-emerald-600' : 
                           item.score >= 75 ? 'bg-blue-50 text-blue-600' : 
                           item.score === null ? 'bg-slate-50 text-slate-300' : 'bg-red-50 text-red-500'
                        }`}>
                           {item.aspekPenilaian === 'Sikap' ? (
                              item.score === 95 ? 'A' : item.score === 85 ? 'B' : item.score === 75 ? 'C' : 'D'
                           ) : (
                              item.score ?? '-'
                           )}
                        </div>
                        <div className="min-w-0">
                           <div className="flex items-center gap-2 mb-1.5">
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                 item.assessmentCategory === 'Sumatif' ? 'bg-amber-100 text-amber-700' : 
                                 item.assessmentCategory === 'PTS' || item.assessmentCategory === 'PAS' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>{item.assessmentCategory}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                           </div>
                           <h4 className="font-black text-slate-800 text-sm md:text-base uppercase truncate leading-tight group-hover:text-primary transition-colors">{item.materi}</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase truncate mt-0.5">{item.activityName}</p>
                        </div>
                     </div>
                     <div className="shrink-0 flex flex-col items-center ml-4 opacity-40 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-0.5">
                           {[...Array(item.stars || 0)].map((_, i) => (
                           <Star key={i} size={12} fill="currentColor" className="text-amber-400" />
                           ))}
                        </div>
                     </div>
                  </div>
                  ))
               )}
               </div>
            </div>
         </PageTransition>
      </div>

      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
         <div ref={pdfRef} style={{ width: '800px', padding: '60px', backgroundColor: 'white', color: '#1e293b', fontFamily: 'Arial, sans-serif' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '5px solid #4338ca', paddingBottom: '30px', marginBottom: '40px' }}>
               <div>
                  <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#4338ca', margin: 0, textTransform: 'uppercase', letterSpacing: '-1px' }}>{student.nama}</h1>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b', margin: '5px 0 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
                     {(profile?.schools || []).find(s => s.id === profile?.activeSchoolId)?.nama || (profile as any)?.sekolah || 'EduScore Digital School'} • KELAS {currentClass?.namaKelas}
                  </p>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ backgroundColor: '#4338ca', color: 'white', padding: '15px 25px', borderRadius: '25px', marginBottom: '10px' }}>
                     <p style={{ fontSize: '10px', fontWeight: '900', margin: '0 0 2px 0', textTransform: 'uppercase', opacity: 0.7 }}>Nilai Rapor</p>
                     <p style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>{averages.final}</p>
                  </div>
                  <p style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '40px' }}>
               <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '20px', border: '1px solid #dbeafe', textAlign: 'center' }}>
                  <p style={{ fontSize: '9px', fontWeight: '900', color: '#3b82f6', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Formatif ({counts.formatif})</p>
                  <p style={{ fontSize: '24px', fontWeight: '900', color: '#1e40af', margin: 0 }}>{averages.formatif}</p>
               </div>
               <div style={{ padding: '20px', backgroundColor: '#fffbeb', borderRadius: '20px', border: '1px solid #fef3c7', textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', fontWeight: '900', color: '#f59e0b', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Sumatif ({counts.sumatif})</p>
                  <p style={{ fontSize: '24px', fontWeight: '900', color: '#92400e', margin: 0 }}>{averages.sumatif}</p>
               </div>
               <div style={{ padding: '20px', backgroundColor: '#fdf4ff', borderRadius: '20px', border: '1px solid #fae8ff', textAlign: 'center' }}>
                  <p style={{ fontSize: '9px', fontWeight: '900', color: '#d946ef', margin: '0 0 5px 0', textTransform: 'uppercase' }}>PTS / PAS</p>
                  <p style={{ fontSize: '18px', fontWeight: '900', color: '#701a75', margin: 0 }}>{averages.pts} / {averages.pas}</p>
               </div>
               <div style={{ padding: '20px', backgroundColor: '#faf5ff', borderRadius: '20px', border: '1px solid #f3e8ff', textAlign: 'center' }}>
                  <p style={{ fontSize: '9px', fontWeight: '900', color: '#a855f7', margin: '0 0 5px 0', textTransform: 'uppercase' }}>Total Poin</p>
                  <p style={{ fontSize: '24px', fontWeight: '900', color: '#6b21a8', margin: 0 }}>{points}</p>
               </div>
            </div>

            {description && (
               <div style={{ padding: '25px', backgroundColor: '#1e293b', color: 'white', borderRadius: '30px', marginBottom: '40px' }}>
                  <p style={{ fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.6)', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Analisis Capaian Kompetensi</p>
                  <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', lineHeight: '1.6' }}>{description}</p>
               </div>
            )}

            <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b', marginTop: '40px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px', borderLeft: '5px solid #4338ca', paddingLeft: '15px' }}>Rincian Nilai Per Materi</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
               <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                     <th style={{ padding: '15px 20px', textAlign: 'left', fontSize: '10px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Materi</th>
                     <th style={{ padding: '15px 20px', textAlign: 'center', fontSize: '10px', fontWeight: '900', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Formatif</th>
                     <th style={{ padding: '15px 20px', textAlign: 'center', fontSize: '10px', fontWeight: '900', color: '#92400e', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Sumatif</th>
                  </tr>
               </thead>
               <tbody>
                  {detailedAverages.map((item, idx) => (
                     <tr key={idx}>
                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', fontWeight: 'bold', color: '#1e293b', textTransform: 'uppercase' }}>{item.materi}</td>
                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontSize: '16px', fontWeight: '900', color: '#1e40af' }}>{item.avgF}</td>
                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontSize: '16px', fontWeight: '900', color: '#92400e' }}>{item.avgS}</td>
                     </tr>
                  ))}
               </tbody>
            </table>

            {pointHistory.length > 0 && (
               <>
                  <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b', marginTop: '40px', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px', borderLeft: '5px solid #a855f7', paddingLeft: '15px' }}>Catatan Poin & Karakter</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     {pointHistory.map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', borderLeft: '6px solid #a855f7' }}>
                           <div>
                              <p style={{ fontSize: '9px', fontWeight: '900', color: '#a855f7', margin: '0 0 5px 0', textTransform: 'uppercase' }}>{new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: 0, textTransform: 'uppercase' }}>{p.keterangan}</h4>
                           </div>
                           <div style={{ fontSize: '20px', fontWeight: '900', color: p.poin >= 0 ? '#10b981' : '#ef4444' }}>
                              {p.poin >= 0 ? '+' : ''}{p.poin}
                           </div>
                        </div>
                     ))}
                  </div>
               </>
            )}

            <div style={{ marginTop: '60px', paddingTop: '30px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
               <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>Dokumen ini dihasilkan secara otomatis oleh EduScore Digital System</p>
            </div>
         </div>
      </div>
    </Layout>
  );
};
