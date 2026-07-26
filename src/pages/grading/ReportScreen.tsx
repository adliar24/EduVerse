import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BarChart3, FileSpreadsheet, FileText, ChevronRight, 
  Users, TrendingUp, Star, GraduationCap, Info, 
  CheckCircle2, ClipboardCheck, Database, Trash2,
  Plus, BookOpen
} from 'lucide-react';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Student, StudentPoint, TeacherProfile } from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Card,
  Header, Layout, PageTransition, useToast
} from '../Layout';
import { useTeacherProfile, useClasses } from '../../services/hooks';
import { autoFitColumns } from './SharedUtils';

export const ReportScreen: React.FC = () => {
  const { profile } = useTeacherProfile();
  const { classes } = useClasses(profile?.activeSchoolId);
  const { idKelas } = useParams();

  return (
    <Layout>
      <Header title="Laporan Belajar" subtitle="Rekapitulasi Nilai Siswa" />
      <PageTransition className="space-y-8">
        {!idKelas ? (
           <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
             {classes.map(c => (
               <React.Fragment key={c.idKelas}>
                 <Link to={`/reports/view/${c.idKelas}`} className="md:hidden block group">
                    <div className="bg-white rounded-2xl p-4 border-2 !border-[#3B66F5] flex items-center justify-between shadow-sm active:scale-95 transition-all relative overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-[#3B66F5]/5 text-[#3B66F5] flex items-center justify-center font-black text-lg border border-[#3B66F5]/20 shadow-inner group-hover:bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] group-hover:text-white transition-colors">
                                {c.namaKelas.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-[13px] uppercase tracking-wide group-hover:text-[#3B66F5] transition-colors">{c.namaKelas}</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{c.mapel}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 relative z-10">
                             <ChevronRight size={18} className="text-slate-300 group-hover:text-[#3B66F5] group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                 </Link>

                 <Link key={c.idKelas} to={`/reports/view/${c.idKelas}`} className="hidden md:block">
                   <div className="bg-white p-8 rounded-[2.5rem] no-box-border hover:shadow-xl hover:border-accent hover:-translate-y-1 transition-all group h-full">
                      <div className="w-16 h-16 rounded-2xl bg-[#3B66F5]/5 text-[#3B66F5] flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform">
                         <BarChart3 size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-wide mb-2">{c.namaKelas}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{c.mapel}</p>
                   </div>
                 </Link>
               </React.Fragment>
             ))}
           </div>
        ) : (
           <ReportDetailView idKelas={idKelas} />
        )}
      </PageTransition>
    </Layout>
  );
};

const ReportDetailView: React.FC<{ idKelas: string }> = ({ idKelas }) => {
   const { profile } = useTeacherProfile();
   const [currentClass, setCurrentClass] = useState<any>(null);
   const [students, setStudents] = useState<Student[]>([]);
   const [stats, setStats] = useState<Record<string, any>>({});
   const { showToast } = useToast();
   const reportRef = useRef<HTMLDivElement>(null);
   const pdfRef = useRef<HTMLDivElement>(null);
   
   useEffect(() => {
      const load = async () => {
         const prof = await db.getTeacherProfile();
         const schoolId = prof?.activeSchoolId || '';
         const cls = await db.getClassById(idKelas);
         setCurrentClass(cls || null);
         
         const s = await db.getStudents(idKelas, schoolId || undefined);
         let m = await db.getMeetings(idKelas, schoolId || undefined);
         let allScores = await db.getAllScores(schoolId || undefined);
         const pts = await db.getStudentPoints(idKelas, schoolId || undefined);

         if (m.length === 0) {
            m = await db.getMeetings(idKelas);
            allScores = await db.getAllScores();
         }
         
         const statMap: any = {};
         s.forEach(std => {
            const studentScores = allScores.filter(sc => sc.idSiswa === std.idSiswa && m.some(mt => mt.idPertemuan === sc.idPertemuan));
            
            const getAspectAvg = (aspect: string) => {
               const filtered = studentScores.filter(sc => {
                  const meet = m.find(mt => mt.idPertemuan === sc.idPertemuan);
                  const meetAspect = meet?.aspekPenilaian || 'Pengetahuan';
                  return meetAspect === aspect && sc.nilaiAngka !== null;
               });
               return filtered.length ? (filtered.reduce((a,b) => a + (b.nilaiAngka || 0), 0) / filtered.length) : null;
            };

            const pAvg = getAspectAvg('Pengetahuan');
            const kAvg = getAspectAvg('Keterampilan');
            const sAvgBase = getAspectAvg('Sikap') ?? 85;
            
            const poinSiswa = pts.filter(p => p.idSiswa === std.idSiswa).reduce((a,b) => a + b.poin, 0);
            const finalSikapNum = Math.min(100, Math.max(0, sAvgBase + poinSiswa));
            
            let sikapLetter = 'E';
            if (finalSikapNum >= 91) sikapLetter = 'A';
            else if (finalSikapNum >= 81) sikapLetter = 'B';
            else if (finalSikapNum >= 71) sikapLetter = 'C';
            else if (finalSikapNum >= 60) sikapLetter = 'D';

            statMap[std.idSiswa] = { 
               pAvg: pAvg !== null ? pAvg.toFixed(1) : '-',
               kAvg: kAvg !== null ? kAvg.toFixed(1) : '-',
               sLetter: sikapLetter,
               count: studentScores.filter(sc => sc.nilaiAngka !== null).length
            };
         });
         setStudents(s);
         setStats(statMap);
      };
      load();
   }, [idKelas]);

   const exportExcel = () => {
      if (students.length === 0) return;
      const data = students.sort((a,b) => a.nama.localeCompare(b.nama)).map((s, i) => ({
         No: i + 1,
         Nama: s.nama,
         'Rata-rata Pengetahuan': stats[s.idSiswa]?.pAvg,
         'Rata-rata Keterampilan': stats[s.idSiswa]?.kAvg,
         'Nilai Sikap': stats[s.idSiswa]?.sLetter,
         'Total Sesi Diikuti': stats[s.idSiswa]?.count
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = autoFitColumns(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Sementara');
      XLSX.writeFile(wb, `Rekap_Nilai_Sementara.xlsx`);
      showToast("Berhasil export ke Excel!");
   };

   const exportPDF = async () => {
      if (!pdfRef.current) return;
      showToast("Menyiapkan PDF...");
      
      try {
         const opt: any = {
            margin:       [10, 10, 10, 10],
            filename:     'Rekap_Nilai_Sementara.pdf',
            image:        { type: 'jpeg', quality: 0.9 },
            html2canvas:  { 
               scale: 1.8, 
               useCORS: true, 
               letterRendering: true,
               width: 800
            },
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
     <>
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] no-box-border overflow-hidden" ref={reportRef} data-pdf-rekap>
        <div className="hidden block-in-pdf p-10 bg-gradient-to-br from-primary via-blue-700 to-[#2563EB] text-white relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className="flex justify-between items-end relative z-10">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                        <BarChart3 size={24} />
                     </div>
                     <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Laporan Hasil Belajar</h1>
                        <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em] mt-1">Akumulasi Nilai Capaian Siswa</p>
                     </div>
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-sm font-black uppercase tracking-wider">{profile?.schoolName || 'EduScore Digital School'}</div>
                  <div className="text-[9px] font-bold opacity-60 uppercase mt-0.5">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
               </div>
            </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-border-in-pdf">
           <div className="flex flex-col">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Ringkasan Nilai Sementara</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 hidden-in-pdf">Data real-time berdasarkan aktivitas kelas</p>
           </div>
           <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto" data-html2canvas-ignore>
              <Button variant="secondary" onClick={exportExcel} className="flex-1 md:flex-none !py-3 !px-6 !text-[13px] h-14 md:h-auto"><FileSpreadsheet size={18} className="mr-2 text-emerald-600"/> Export Excel</Button>
              <Button variant="accent" onClick={exportPDF} className="flex-1 md:flex-none !py-3 !px-6 !text-[13px] h-14 md:h-auto shadow-glow-gold"><FileText size={18} className="mr-2 text-red-500"/> Export PDF</Button>
           </div>
        </div>
        
        {students.length === 0 ? (
            <div className="py-20 text-center">
               <Users size={48} className="mx-auto mb-4 text-slate-200" />
               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Belum ada siswa di kelas ini</p>
            </div>
         ) : (
            <>
        <div className="overflow-x-auto custom-scrollbar">
           <table className="w-full text-left whitespace-nowrap">
              <thead>
                 <tr className="text-[11px] md:text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                    <th className="px-6 py-6 w-12 text-center">No</th>
                    <th className="px-4 py-6 min-w-[200px]">Nama Siswa</th>
                    <th className="px-4 py-6 text-center">Pengetahuan</th>
                    <th className="px-4 py-6 text-center">Keterampilan</th>
                    <th className="px-4 py-6 text-center">Sikap</th>
                    <th className="px-6 py-6 w-12"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {students.sort((a,b) => a.nama.localeCompare(b.nama)).map((std, idx) => (
                    <tr key={std.idSiswa} className="hover:bg-slate-50 transition-colors group pdf-row">
                       <td className="px-6 py-4 text-center">
                          <span className="text-sm font-black text-slate-400 tabular-nums">{idx + 1}</span>
                       </td>
                       <td className="px-4 py-5">
                          <h4 className="font-black text-slate-800 uppercase text-[14px] md:text-[16px] group-hover:text-[#3B66F5] transition-colors leading-tight">{std.nama}</h4>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-1 hidden-in-pdf">{stats[std.idSiswa]?.count} Aktivitas</span>
                       </td>
                       <td className="px-4 py-5 text-center">
                           <span className="text-sm md:text-base font-black text-slate-700">{stats[std.idSiswa]?.pAvg}</span>
                       </td>
                       <td className="px-4 py-5 text-center">
                           <span className="text-sm md:text-base font-black text-slate-700">{stats[std.idSiswa]?.kAvg}</span>
                       </td>
                       <td className="px-4 py-5 text-center">
                             <span className={`font-black text-base md:text-xl ${
                                stats[std.idSiswa]?.sLetter === 'A' ? 'text-emerald-600' :
                                stats[std.idSiswa]?.sLetter === 'B' ? 'text-[#3B66F5]' :
                                stats[std.idSiswa]?.sLetter === 'C' ? 'text-amber-600' : 'text-red-600'
                           }`}>
                              {stats[std.idSiswa]?.sLetter}
                           </span>
                       </td>
                       <td className="px-6 py-4 no-print" data-html2canvas-ignore>
                          <Link to={`/reports/${idKelas}/${std.idSiswa}`} className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] hover:text-white transition-colors">
                             <ChevronRight size={16} />
                          </Link>
                       </td>
                    </tr>
                  ))}
               </tbody>
           </table>
        </div>
        </>
        )}

      </div>

      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
         <div ref={pdfRef} style={{ width: '800px', padding: '40px', backgroundColor: 'white', color: '#1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '4px solid #0f52ba', paddingBottom: '20px', marginBottom: '30px' }}>
               <div>
                  <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0f52ba', margin: 0, textTransform: 'uppercase', letterSpacing: '-1px' }}>Laporan Hasil Belajar</h1>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#64748b', margin: '5px 0 0 0', textTransform: 'uppercase' }}>
                     {(profile?.schools || []).find(s => s.id === profile?.activeSchoolId)?.nama || (profile as any)?.sekolah || 'EduScore Digital School'} • KELAS {currentClass?.namaKelas}
                  </p>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
               </div>
            </div>

            <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#1e293b', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Ringkasan Nilai Sementara</h2>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                     <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>No</th>
                     <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Nama Siswa</th>
                     <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Pengetahuan</th>
                     <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Keterampilan</th>
                     <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Sikap</th>
                  </tr>
               </thead>
               <tbody>
                  {students.sort((a,b) => a.nama.localeCompare(b.nama)).map((std, idx) => (
                     <tr key={std.idSiswa} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '15px 8px', textAlign: 'center', fontSize: '13px', fontWeight: '900', color: '#94a3b8' }}>{idx + 1}</td>
                        <td style={{ padding: '15px 8px' }}>
                           <div style={{ fontSize: '15px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' }}>{std.nama}</div>
                        </td>
                        <td style={{ padding: '15px 8px', textAlign: 'center', fontSize: '15px', fontWeight: '900', color: '#334155' }}>{stats[std.idSiswa]?.pAvg}</td>
                        <td style={{ padding: '15px 8px', textAlign: 'center', fontSize: '15px', fontWeight: '900', color: '#334155' }}>{stats[std.idSiswa]?.kAvg}</td>
                        <td style={{ padding: '15px 8px', textAlign: 'center' }}>
                           <span style={{ 
                               fontSize: '20px', 
                               fontWeight: '900', 
                               color: stats[std.idSiswa]?.sLetter === 'A' ? '#059669' : 
                                      stats[std.idSiswa]?.sLetter === 'B' ? '#2563eb' : 
                                      stats[std.idSiswa]?.sLetter === 'C' ? '#d97706' : '#dc2626' 
                           }}>
                               {stats[std.idSiswa]?.sLetter}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
     </>
   );
};
