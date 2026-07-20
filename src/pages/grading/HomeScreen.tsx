import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, ChevronRight, TrendingUp, Zap, 
  Database, ClipboardCheck, GraduationCap, 
  AlertOctagon, Check, Plus
} from 'lucide-react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TeacherProfile, ClassData, Meeting } from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Header, Layout, PageTransition
} from '../Layout';
import { QuickInputModal } from './QuickInputModal';

interface HomeScreenProps {
  profile: TeacherProfile | null;
  refreshProfile: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ profile: propProfile, refreshProfile }) => {
  const [localProfile, setLocalProfile] = useState<TeacherProfile | null>(propProfile);
  const profile = propProfile || localProfile;
  const [stats, setStats] = useState({ classes: 0, meetings: 0, students: 0 });
  const [isQuickInputOpen, setIsQuickInputOpen] = useState(false);
  
  useEffect(() => {
    if (propProfile) setLocalProfile(propProfile);
  }, [propProfile]);
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartMode, setChartMode] = useState<'minggu' | 'bulan' | 'semester'>('minggu');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const p = await db.getTeacherProfile();
        const schoolId = p?.activeSchoolId || null;
        const c = await db.getClasses(schoolId || undefined);
        const m = await db.getMeetings(undefined, schoolId || undefined);
        const s = await db.getStudents(undefined, schoolId || undefined);
        const allScores = await db.getAllScores(schoolId || undefined);

        setLocalProfile(p || null);
        setStats({ classes: c.length, meetings: m.length, students: s.length });

        let cData: any[] = [];
        
        if (chartMode === 'minggu') {
            const weeks: Record<string, number[]> = {};
            allScores.forEach(sc => {
                const date = new Date(sc.lastUpdated || Date.now());
                const d = new Date(date);
                d.setDate(d.getDate() - d.getDay());
                const key = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                if (!weeks[key]) weeks[key] = [];
                weeks[key].push(sc.nilaiAngka || 0);
            });
            cData = Object.entries(weeks).slice(-6).map(([key, vals]) => ({
                name: key,
                fullMateri: `Minggu: ${key}`,
                nilai: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
            }));
        } else if (chartMode === 'bulan') {
            const months: Record<string, number[]> = {};
            allScores.forEach(sc => {
                const date = new Date(sc.lastUpdated || Date.now());
                const key = date.toLocaleDateString('id-ID', { month: 'short' });
                if (!months[key]) months[key] = [];
                months[key].push(sc.nilaiAngka || 0);
            });
            cData = Object.entries(months).slice(-6).map(([key, vals]) => ({
                name: key,
                fullMateri: `Bulan: ${key}`,
                nilai: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
            }));
        } else if (chartMode === 'semester') {
            const semesters: Record<string, number[]> = {};
            allScores.forEach(sc => {
                const meet = m.find(meet => meet.idPertemuan === sc.idPertemuan);
                if (meet) {
                    const semKey = meet.semester === '1' ? 'Ganjil' : 'Genap';
                    if (!semesters[semKey]) semesters[semKey] = [];
                    semesters[semKey].push(sc.nilaiAngka || 0);
                }
            });
            cData = Object.entries(semesters).map(([key, vals]) => ({
                name: key,
                fullMateri: `Semester: ${key}`,
                nilai: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
            }));
        }
        
        const maxBars = 6;
        const paddedData = [...cData];
        while (paddedData.length < maxBars) {
            paddedData.push({ name: '', fullMateri: 'Data belum tersedia', nilai: null });
        }
        setChartData(paddedData);

        const kkm = p?.kkmDefault || 75;
        const struggling: any[] = [];
        s.forEach(student => {
            const sScores = allScores.filter(sc => sc.idSiswa === student.idSiswa);
            if (sScores.length > 0) {
                const avg = sScores.reduce((sum, curr) => sum + (curr.nilaiAngka || 0), 0) / sScores.length;
                if (avg < kkm) {
                    const cls = c.find(cl => cl.idKelas === student.idKelas);
                    struggling.push({ id: student.idSiswa, nama: student.nama, kelas: cls?.namaKelas || '?', nilai: Math.round(avg) });
                }
            }
        });
        setAlerts(struggling.sort((a,b) => a.nilai - b.nilai).slice(0, 4));

      } catch (err) {
        console.error("HomeScreen loadStats error:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadStats();
  }, [chartMode, profile?.activeSchoolId]);

  if (isLoadingData) {
    return (
      <Layout profile={profile} refreshProfile={refreshProfile}>
        <div className="animate-pulse space-y-8">
           <div className="h-32 bg-slate-200 rounded-[3rem] w-full"></div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2 h-64 bg-slate-200 rounded-[2rem]"></div>
              <div className="h-64 bg-slate-200 rounded-[2rem]"></div>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>)}
           </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout profile={profile} refreshProfile={refreshProfile}>
      {/* MOBILE HEADER */}
      <div className="md:hidden -mx-6 -mt-2 px-8 pt-6 pb-12 bg-gradient-primary rounded-b-[3rem] shadow-xl mb-10 text-white relative overflow-hidden animate-fade z-0">
         <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

         <div className="relative z-10 flex justify-between items-start gap-5">
            <div className="flex-1 min-w-0">
               <h1 className="font-black text-3xl leading-tight uppercase tracking-wide break-words text-white drop-shadow-sm mb-1">
                  BERANDA <br/> PENGAJAR
               </h1>
               <p className="text-blue-100 font-bold text-sm opacity-90 leading-relaxed mb-4">
                  Selamat bekerja, {profile?.namaGuru?.split(',')[0]}.
               </p>
               
               <div className="flex flex-wrap items-center gap-2">
                   <div className="inline-flex items-center px-3 py-1.5 bg-white/10 rounded-lg border border-white/10 backdrop-blur-sm shadow-sm">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-50">{profile?.tahunAjaran}</span>
                   </div>
                   <div className="inline-flex items-center px-3 py-1.5 bg-white/10 rounded-lg border border-white/10 backdrop-blur-sm shadow-sm">
                      <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-[150px] text-blue-50">{profile?.schools?.find(s => s.id === profile?.activeSchoolId)?.nama || profile?.sekolah}</span>
                   </div>
               </div>
            </div>
            
            <Link to="/profile" className="shrink-0 w-14 h-14 bg-white/10 border-2 border-white/20 rounded-[1.2rem] flex items-center justify-center overflow-hidden shadow-lg active:scale-95 transition-transform hover:bg-white/20">
               {profile?.fotoUrl ? (
                 <img src={profile.fotoUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <User size={24} className="text-white/80"/>
               )}
            </Link>
         </div>
      </div>

      {/* DESKTOP HEADER */}
      <div className="hidden md:block mb-8 animate-enter">
         <div className="flex items-start justify-between">
           <div>
              <h1 className="font-black text-3xl md:text-4xl text-slate-800 tracking-wide leading-tight uppercase">Beranda Pengajar</h1>
              <div className="mt-2">
                <p className="text-slate-500 font-bold text-sm md:text-base opacity-70 leading-relaxed">
                  Selamat bekerja, {profile?.namaGuru}.
                </p>
              </div>
           </div>
         </div>
      </div>

      <PageTransition className="flex flex-col gap-5 md:gap-5">
        <div className="order-2 md:order-1 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-[2rem] p-6 md:p-7 border border-slate-100 shadow-sm overflow-hidden relative group">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-800 text-base uppercase tracking-wide flex items-center gap-2">
                        <TrendingUp className="text-primary" size={18} /> Tren Nilai
                    </h3>
                    <Link to="/statistics">
                        <Button variant="secondary" className="!rounded-2xl !py-2 !px-4 text-[10px] font-black uppercase tracking-widest shadow-sm hover:text-primary transition-all">
                           Statistik <ChevronRight size={14} className="ml-1" />
                        </Button>
                    </Link>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto custom-scrollbar-hide max-w-[200px] md:max-w-none">
                        {(['minggu', 'bulan', 'semester'] as const).map(mode => (
                            <button 
                                key={mode}
                                onClick={() => setChartMode(mode)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                    chartMode === mode 
                                    ? 'bg-white text-primary shadow-sm border border-slate-100' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {mode === 'minggu' ? 'Minggu' : mode === 'bulan' ? 'Bulan' : 'Semester'}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="h-[180px] w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.3}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    dy={10}
                                    interval={0}
                                />
                                <YAxis 
                                    domain={[0, 100]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-slate-900 border-none shadow-2xl p-4 rounded-2xl animate-in zoom-in-95 duration-200">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].payload.fullMateri}</p>
                                                    <p className="text-xl font-black text-white">{payload[0].value} <span className="text-[10px] text-slate-400">Rerata</span></p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar 
                                    dataKey="nilai" 
                                    barSize={35} 
                                    fill="url(#colorBar)" 
                                    radius={[8, 8, 0, 0]} 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="nilai" 
                                    stroke="#ef4444" 
                                    strokeWidth={4} 
                                    dot={{ r: 5, fill: '#ef4444', strokeWidth: 3, stroke: '#fff' }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                            <Database size={30} className="opacity-20" />
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Belum ada data</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Kelas', val: stats.classes, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                        { label: 'Siswa', val: stats.students, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
                        { label: 'Nilai', val: stats.meetings, color: 'text-primary', bg: 'bg-blue-50', border: 'border-primary/20' }
                    ].map((stat, i) => (
                        <div key={i} className={`bg-white rounded-2xl p-4 border ${stat.border} shadow-sm flex flex-col items-center text-center transition-all hover:scale-105 ${stat.bg.replace('bg-', 'hover:bg-')}`}>
                            <span className={`text-lg font-black ${stat.color} leading-none mb-1`}>{stat.val}</span>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.1em]">{stat.label}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-[2rem] p-7 border border-slate-100 shadow-sm flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest flex items-center gap-2">
                            <AlertOctagon className="text-red-500" size={14} /> Remedial
                        </h3>
                        <div className="px-2 py-0.5 bg-red-50 text-red-500 rounded text-[8px] font-black tracking-widest uppercase">
                            Peringatan
                        </div>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px] custom-scrollbar">
                        {alerts.length > 0 ? (
                            alerts.map(alert => (
                                <div key={alert.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 group hover:border-red-100 transition-all">
                                    <div className="min-w-0">
                                        <p className="font-black text-slate-700 text-[11px] uppercase truncate">{alert.nama}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{alert.kelas}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-black text-red-500 text-sm leading-none">{alert.nilai}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-2 py-6">
                                <Check size={20} strokeWidth={3} className="text-emerald-500" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Semua Aman</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="order-1 md:order-2 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <Link to="/meetings" className="group">
             <div className="bg-gradient-primary rounded-2xl p-4 md:p-8 text-white shadow-lg relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-between min-h-[70px] md:min-h-[180px]">
               <div className="flex items-center gap-3 z-10">
                 <div className="w-12 md:w-14 h-12 md:h-14 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                   <Plus size={24} strokeWidth={3} />
                 </div>
                 <div>
                   <h3 className="text-lg md:text-xl font-black tracking-wide uppercase">Input Nilai</h3>
                   <p className="text-[10px] md:text-[11px] text-blue-100/60 font-bold leading-tight">Nilai Harian & Tugas</p>
                 </div>
               </div>
               <div className="absolute -bottom-2 -right-2 opacity-10 pointer-events-none"><ClipboardCheck size={60} /></div>
             </div>
           </Link>

           <button onClick={() => setIsQuickInputOpen(true)} className="group text-left">
             <div className="bg-white rounded-2xl p-4 md:p-8 text-slate-800 shadow-md border border-slate-100 relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-between min-h-[70px] md:min-h-[180px]">
               <div className="flex items-center gap-3 z-10">
                 <div className="w-12 md:w-14 h-12 md:h-14 bg-accent/20 text-accent rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                   <Zap size={24} strokeWidth={3} fill="currentColor" />
                 </div>
                 <div>
                   <h3 className="text-lg md:text-xl font-black tracking-wide uppercase">Input Kilat</h3>
                   <p className="text-[10px] md:text-[11px] text-slate-400 font-bold leading-tight">Instan satu kolom</p>
                 </div>
               </div>
               <div className="absolute -bottom-2 -right-2 opacity-[0.03] pointer-events-none"><Zap size={60} strokeWidth={2} fill="currentColor" /></div>
             </div>
           </button>

           <Link to="/rapor" className="group">
              <div className="bg-gradient-gold rounded-2xl p-4 md:p-8 text-primaryDark shadow-lg relative overflow-hidden transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-between min-h-[70px] md:min-h-[180px]">
                 <div className="flex items-center gap-3 z-10">
                   <div className="w-12 md:w-14 h-12 md:h-14 bg-primaryDark/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                     <GraduationCap size={24} strokeWidth={2.5} />
                   </div>
                   <div>
                     <h3 className="text-lg md:text-xl font-black tracking-wide uppercase">e-Rapor</h3>
                     <p className="text-[10px] md:text-[11px] text-primaryDark/60 font-bold leading-tight">Finalisasi & Rekap</p>
                   </div>
                 </div>
                 <div className="absolute -bottom-2 -right-2 opacity-10 pointer-events-none"><GraduationCap size={60} /></div>
              </div>
           </Link>
        </div>

        <QuickInputModal 
          isOpen={isQuickInputOpen} 
          onClose={() => setIsQuickInputOpen(false)} 
        />
      </PageTransition>
    </Layout>
  );
};
