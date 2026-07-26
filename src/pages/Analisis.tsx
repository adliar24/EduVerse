import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Award, 
  AlertTriangle,
  Filter,
  ChevronDown,
  Activity,
  Target,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { cn } from '../lib/utils';
import HasilUjian from './HasilUjian';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSchool } from '../context/SchoolContext';

export default function Analisis() {
  useDocumentTitle('Analisis Hasil');
  const { activeSchool } = useSchool();
  const [activeTab, setActiveTab] = useState<'statistik' | 'nilai'>('statistik');
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, [activeSchool]);

  useEffect(() => {
    fetchAnalisis();
  }, [selectedExam]);

  const fetchExams = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let query = supabase.from('exams').select('id, title').eq('teacher_id', user.id);
    if (activeSchool?.id) {
      if (activeSchool.id === 'legacy') {
        query = query.is('school_id', null);
      } else {
        query = query.eq('school_id', activeSchool.id);
      }
    }
    const { data } = await query;
    setExams(data || []);
  };

  const fetchAnalisis = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase.from('participants').select('*, exams!inner(teacher_id, school_id)');
      
      if (selectedExam !== 'all') {
        query = query.eq('exam_id', selectedExam);
      } else {
        query = query.eq('exams.teacher_id', user.id);
        if (activeSchool?.id) {
          if (activeSchool.id === 'legacy') {
            query = query.is('exams.school_id', null);
          } else {
            query = query.eq('exams.school_id', activeSchool.id);
          }
        }
      }
      const { data: participants } = await query;

      if (!participants || participants.length === 0) {
        setStats(null);
        setChartData([]);
        return;
      }

      const total = participants.length;
      const scores = participants.map(p => p.score || 0);
      const avg = scores.reduce((a, b) => a + b, 0) / total;
      const max = Math.max(...scores);
      const min = Math.min(...scores);

      const passCount = scores.filter(s => s >= 75).length;
      const failCount = total - passCount;

      setStats({
        total,
        avg: Math.round(avg),
        max,
        min,
        passRate: Math.round((passCount / total) * 100)
      });

      // Score Distribution for Chart
      const distribution = [
        { range: '0-20', count: 0 },
        { range: '21-40', count: 0 },
        { range: '41-60', count: 0 },
        { range: '61-80', count: 0 },
        { range: '81-100', count: 0 },
      ];

      scores.forEach(s => {
        if (s <= 20) distribution[0].count++;
        else if (s <= 40) distribution[1].count++;
        else if (s <= 60) distribution[2].count++;
        else if (s <= 80) distribution[3].count++;
        else distribution[4].count++;
      });

      setChartData(distribution);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#F43F5E', '#F59E0B', '#3B82F6', '#10B981', '#6366F1'];

  if (loading) return (
    <div className="animate-pulse space-y-10">
      <div className="flex justify-between items-center">
        <div className="space-y-3">
          <div className="h-10 bg-slate-200 rounded-2xl w-64"></div>
          <div className="h-4 bg-slate-100 rounded-lg w-48"></div>
        </div>
        <div className="h-12 bg-slate-200 rounded-2xl w-48"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-40 bg-slate-200 rounded-[2.5rem]"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-96 bg-slate-200 rounded-[2.5rem]"></div>
        <div className="h-96 bg-slate-200 rounded-[2.5rem]"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-2">
        <div>
          <h2 className="text-3xl font-bold text-[#1D4ED8] tracking-tight">Analisis Performa</h2>
          <p className="text-slate-500 font-medium mt-1">Pantau statistik dan laporan detail hasil ujian siswa Anda.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar relative">
          <div className={cn(
            "relative group shrink-0 min-w-[180px] transition-opacity duration-200",
            activeTab === 'statistik' ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none absolute"
          )}>
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-[#1D4ED8] transition-colors" />
            <select 
              className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#3B66F5]/5 focus:border-[#3B66F5] appearance-none bg-white font-bold text-sm text-slate-700 transition-all cursor-pointer"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              <option value="all">Semua Ujian</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>

          <button 
            onClick={() => document.getElementById('btn-export-hasil')?.click()}
            className={cn(
              "flex items-center gap-2 bg-[#3B66F5] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#2563EB] transition-all shadow-md shadow-[#3B66F5]/25 shrink-0 whitespace-nowrap transition-opacity duration-200",
              activeTab === 'nilai' ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none absolute"
            )}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Eksport Data</span>
          </button>

          <div className="relative flex items-center bg-slate-100 p-1.5 rounded-xl shrink-0 overflow-hidden">
            <motion.div
              className="absolute top-1.5 bottom-1.5 bg-white rounded-lg shadow-sm"
              initial={false}
              animate={{
                left: activeTab === 'statistik' ? '4px' : '50%',
                width: 'calc(50% - 4px)'
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
            <button 
              onClick={() => setActiveTab('statistik')}
              className={cn("relative z-10 flex-1 px-5 py-2 rounded-lg text-sm font-bold transition-colors", activeTab === 'statistik' ? "text-[#1D4ED8]" : "text-slate-500 hover:text-[#1D4ED8]")}
            >
              Statistik
            </button>
            <button 
              onClick={() => setActiveTab('nilai')}
              className={cn("relative z-10 flex-1 px-5 py-2 rounded-lg text-sm font-bold transition-colors", activeTab === 'nilai' ? "text-[#1D4ED8]" : "text-slate-500 hover:text-[#1D4ED8]")}
            >
              Nilai
            </button>
          </div>
        </div>
      </div>

      <div className="relative w-full mt-4">
        {/* TAB STATISTIK */}
        <div 
          className={cn(
            "w-full transition-all duration-500 ease-in-out",
            activeTab === 'statistik' 
              ? "opacity-100 visible relative z-10" 
              : "opacity-0 invisible absolute top-0 left-0 z-0"
          )}
        >

            {stats ? (
              <div className="space-y-6">
            {/* Charts Section (Now on Top) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-5 lg:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#1D4ED8] tracking-tight">Distribusi Nilai</h3>
                    <p className="text-sm text-slate-400 font-medium mt-1">Persebaran skor peserta ujian</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl w-fit">
                    <div className="w-2 h-2 rounded-full bg-[#3B66F5]/50"></div>
                    <span className="text-xs font-bold text-slate-500">Nilai Peserta</span>
                  </div>
                </div>
                <div className="flex-1 min-h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="range" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }} 
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '24px', 
                          border: 'none', 
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                          padding: '16px 24px'
                        }}
                        itemStyle={{ fontWeight: 700, color: '#1e1b4b' }}
                        labelStyle={{ fontWeight: 600, color: '#64748B', marginBottom: '4px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#3B82F6" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorCount)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 lg:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                <div className="mb-2">
                  <h3 className="text-xl font-bold text-[#1D4ED8] tracking-tight">Status Kelulusan</h3>
                  <p className="text-sm text-slate-400 font-medium mt-1">Berdasarkan KKM 75</p>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="h-[160px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Lulus', value: stats.passRate },
                            { name: 'Tidak Lulus', value: 100 - stats.passRate }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#10B981" />
                          <Cell fill="#F43F5E" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-4xl font-bold text-[#1D4ED8]">{stats.passRate}%</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Lulus</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full mt-4">
                    <div className="bg-emerald-50 p-2 lg:p-3 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Lulus</span>
                      </div>
                      <p className="text-lg font-bold text-[#1D4ED8]">{stats.passRate}%</p>
                    </div>
                    <div className="bg-rose-50 p-2 lg:p-3 rounded-2xl border border-rose-100">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Gagal</span>
                      </div>
                      <p className="text-lg font-bold text-[#1D4ED8]">{100 - stats.passRate}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid (Now clearly visible but below charts) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Peserta', value: stats.total, icon: Users, color: 'blue', suffix: 'Siswa' },
                { label: 'Rata-rata Nilai', value: stats.avg, icon: Activity, color: 'indigo', suffix: '%' },
                { label: 'Nilai Tertinggi', value: stats.max, icon: Award, color: 'emerald', suffix: 'Poin' },
                { label: 'Tingkat Kelulusan', value: stats.passRate, icon: Target, color: 'rose', suffix: '%' }
              ].map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.1 }}
                  key={item.label} 
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all group flex flex-col justify-center"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                      item.color === 'blue' ? "bg-[#3B66F5]/5 text-[#3B66F5]" :
                      item.color === 'indigo' ? "bg-[#3B66F5]/10 text-[#3B66F5]" :
                      item.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                      "bg-rose-50 text-rose-600"
                    )}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest line-clamp-1 pl-2 text-right">{item.label}</p>
                  </div>
                  <div className="flex items-baseline gap-1 mt-auto">
                    <p className="text-2xl font-bold text-[#1D4ED8] tracking-tight">{item.value}</p>
                    <span className="text-[10px] font-bold text-slate-400">{item.suffix}</span>
                  </div>
                </motion.div>
              ))}
            </div>
              </div>
            ) : (
              <div className="text-center py-40 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                  <TrendingUp className="w-12 h-12 text-slate-200" />
                </div>
                <h3 className="text-2xl font-bold text-[#1D4ED8] mb-2">Data Belum Tersedia</h3>
                <p className="text-slate-400 font-medium max-w-sm mx-auto">
                  Belum ada peserta yang mengikuti ujian ini atau data statistik belum terkumpul.
                </p>
              </div>
            )}
        </div>

        {/* TAB NILAI */}
        <div 
          className={cn(
            "w-full transition-all duration-500 ease-in-out",
            activeTab === 'nilai' 
              ? "opacity-100 visible relative z-10" 
              : "opacity-0 invisible absolute top-0 left-0 z-0"
          )}
        >
          <HasilUjian isEmbedded={true} />
        </div>
      </div>
    </div>
  );
}
