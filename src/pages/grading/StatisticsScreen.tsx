import React, { useState, useEffect } from 'react';
import { 
  Star, TrendingUp, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import * as db from '../../services/dbGrading';
import { 
  Header, Layout, PageTransition
} from '../Layout';

export const StatisticsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'siswa' | 'kelas'>('siswa');
  const [subTab, setSubTab] = useState<'nilai' | 'poin' | 'gabungan'>('nilai');
  const [studentRanking, setStudentRanking] = useState<any[]>([]);
  const [classRanking, setClassRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const calculateStats = async () => {
      const profile = await db.getTeacherProfile();
      const schoolId = profile?.activeSchoolId || null;
      const s = await db.getStudents(undefined, schoolId || undefined);
      const c = await db.getClasses(schoolId || undefined);
      const m = await db.getMeetings(undefined, schoolId || undefined);
      const scores = await db.getAllScores(schoolId || undefined);
      const points = await db.getStudentPoints(undefined, schoolId || undefined);

      // Calculate Rankings
      const sRank = s.map(st => {
        const sScores = scores.filter(sc => sc.idSiswa === st.idSiswa);
        const avgScore = sScores.length > 0 ? sScores.reduce((a, b) => a + (b.nilaiAngka || 0), 0) / sScores.length : 0;
        
        const sPoints = points.filter(p => p.idSiswa === st.idSiswa);
        const totalPoints = sPoints.reduce((a, b) => a + (b.poin || 0), 0);
        
        const cls = c.find(cl => cl.idKelas === st.idKelas);
        return {
          id: st.idSiswa,
          name: st.nama,
          className: cls?.namaKelas || '?',
          avgScore: Math.round(avgScore),
          totalPoints: totalPoints,
          combined: Math.round(avgScore) + totalPoints
        };
      })
      .filter(st => st.avgScore > 0 || st.totalPoints > 0);

      // 2. Class Ranking (All)
      const cRank = c.map(cls => {
        const cScores = scores.filter(sc => {
            const meet = m.find(mt => mt.idPertemuan === sc.idPertemuan);
            return meet?.idKelas === cls.idKelas;
        });
        const avg = cScores.length > 0 ? cScores.reduce((a, b) => a + (b.nilaiAngka || 0), 0) / cScores.length : 0;
        return {
          id: cls.idKelas,
          name: cls.namaKelas,
          subject: cls.mapel,
          avg: Math.round(avg)
        };
      })
      .filter(cl => cl.avg > 0)
      .sort((a, b) => b.avg - a.avg);

      setStudentRanking(sRank);
      setClassRanking(cRank);
      setLoading(false);
    };
    calculateStats();
  }, []);

  // Pagination & Sorting Logic
  let currentData = activeTab === 'siswa' ? [...studentRanking] : [...classRanking];
  
  if (activeTab === 'siswa') {
      if (subTab === 'nilai') currentData.sort((a, b) => b.avgScore - a.avgScore);
      else if (subTab === 'poin') currentData.sort((a, b) => b.totalPoints - a.totalPoints);
      else currentData.sort((a, b) => b.combined - a.combined);
  }

  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const pagedData = currentData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleTabChange = (tab: 'siswa' | 'kelas') => {
    setActiveTab(tab);
    setPage(1);
  };

  if (loading) return <Layout><div className="flex items-center justify-center p-40"><Loader2 className="animate-spin text-primary" size={40}/></div></Layout>;

  return (
    <Layout>
      <Header title="Statistik & Peringkat" subtitle="Analisis Performa Siswa & Kelas" backTo="/home" />

      <PageTransition className="space-y-6 pb-14">
        
        <div className="flex bg-slate-100 p-1.5 rounded-[2.5rem] w-full max-w-md mx-auto shadow-inner border border-slate-200/50">
            <button 
                onClick={() => handleTabChange('siswa')}
                className={`flex-1 py-3.5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === 'siswa' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
                Peringkat Siswa
            </button>
            <button 
                onClick={() => handleTabChange('kelas')}
                className={`flex-1 py-3.5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === 'kelas' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
                Performa Kelas
            </button>
        </div>

        {activeTab === 'siswa' && (
            <div className="flex flex-wrap justify-center gap-2 mb-2">
                <button 
                    onClick={() => { setSubTab('gabungan'); setPage(1); }}
                    className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                        subTab === 'gabungan' 
                        ? 'bg-primary text-white border-primary shadow-md' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-primary/30'
                    }`}
                >
                    Nilai + Poin
                </button>
                <button 
                    onClick={() => { setSubTab('nilai'); setPage(1); }}
                    className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                        subTab === 'nilai' 
                        ? 'bg-primary text-white border-primary shadow-md' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-primary/30'
                    }`}
                >
                    Nilai Saja
                </button>
                <button 
                    onClick={() => { setSubTab('poin'); setPage(1); }}
                    className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                        subTab === 'poin' 
                        ? 'bg-primary text-white border-primary shadow-md' 
                        : 'bg-white text-slate-400 border-slate-100 hover:border-primary/30'
                    }`}
                >
                    Poin Saja
                </button>
            </div>
        )}

        <div key={`${activeTab}-${subTab}`} className="mt-4 animate-fade">
            {activeTab === 'siswa' ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                             <Star size={18} className="text-amber-500" fill="currentColor"/> 
                             Ranking {subTab === 'nilai' ? 'Akademik' : subTab === 'poin' ? 'Keaktifan' : 'Keseluruhan'}
                        </h2>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{studentRanking.length} Siswa</span>
                    </div>
                    
                    <div className="space-y-3">
                        {pagedData.map((std, idx) => {
                            const globalIdx = (page - 1) * itemsPerPage + idx;
                            
                            const isGold = globalIdx === 0;
                            const isSilver = globalIdx === 1;
                            const isBronze = globalIdx === 2;

                            return (
                                <div key={std.id} 
                                   className={`rounded-[2rem] p-5 border-2 flex items-center justify-between group transition-all shadow-lg ${
                                    isGold ? 'bg-amber-100 border-amber-400 shadow-amber-200/50' : 
                                    isSilver ? 'bg-slate-200 border-slate-400 shadow-slate-300/50' : 
                                    isBronze ? 'bg-orange-100 border-orange-400 shadow-orange-200/50' : 
                                    'bg-white border-slate-100'
                                   }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                                            isGold ? 'bg-amber-400 text-white shadow-lg' : 
                                            isSilver ? 'bg-slate-400 text-white shadow-lg' : 
                                            isBronze ? 'bg-orange-400 text-white shadow-lg' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {globalIdx + 1}
                                        </div>
                                        <div>
                                            <h3 className={`font-black text-sm uppercase truncate max-w-[200px] md:max-w-none ${
                                                isGold ? 'text-amber-900' : isSilver ? 'text-slate-900' : isBronze ? 'text-orange-900' : 'text-slate-800'
                                            }`}>{std.name}</h3>
                                            <p className={`text-[9px] font-bold uppercase tracking-widest ${
                                                isGold ? 'text-amber-700' : isSilver ? 'text-slate-500' : isBronze ? 'text-orange-700' : 'text-slate-400'
                                            }`}>{std.className}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                        {(subTab === 'poin' || subTab === 'gabungan') && (
                                            <div className="text-right">
                                                <div className={`text-xl font-black leading-none mb-1 ${
                                                    isGold ? 'text-amber-600' : 'text-slate-900'
                                                }`}>{std.totalPoints}</div>
                                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Poin</div>
                                            </div>
                                        )}
                                        
                                        {(subTab === 'nilai' || subTab === 'gabungan') && (
                                            <div className="text-right">
                                                <div className={`text-xl font-black leading-none mb-1 ${
                                                    isGold ? 'text-amber-600' : 'text-slate-900'
                                                }`}>{std.avgScore}</div>
                                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Rerata</div>
                                            </div>
                                        )}

                                        {subTab === 'gabungan' && (
                                            <div className="w-px h-10 bg-slate-100 mx-1" />
                                        )}

                                        {subTab === 'gabungan' && (
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-primary leading-none mb-1">{std.combined}</div>
                                                <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Total</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <h2 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                             <TrendingUp size={18} className="text-primary" strokeWidth={3}/> Ranking Performa Kelas
                        </h2>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{classRanking.length} Kelas</span>
                    </div>

                    <div className="space-y-3">
                        {pagedData.map((cls, idx) => {
                            const globalIdx = (page - 1) * itemsPerPage + idx;
                            return (
                                <div key={cls.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="font-black text-3xl text-slate-100 group-hover:text-primary/10 transition-colors">#{globalIdx + 1}</div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">{cls.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cls.subject}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-8">
                                        <div className="hidden md:block w-32 h-2 bg-slate-50 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${cls.avg}%` }} />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-black text-slate-800 leading-none mb-1">{cls.avg}</div>
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Rerata</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>

        {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-12 h-12 rounded-2xl border border-slate-100 bg-white flex items-center justify-center text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all shadow-sm"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">Halaman {page}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">dari {totalPages}</span>
                </div>
                <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-12 h-12 rounded-2xl border border-slate-100 bg-white flex items-center justify-center text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all shadow-sm"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        )}

      </PageTransition>
    </Layout>
  );
};
