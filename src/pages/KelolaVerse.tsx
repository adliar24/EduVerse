import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Search, 
  Filter, 
  RotateCw, 
  RotateCcw, 
  Trophy, 
  AlertTriangle, 
  Flame, 
  Droplets, 
  Mountain, 
  Wind, 
  Zap, 
  Check, 
  X,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSchool } from '../context/SchoolContext';
import { useAlert } from '../context/AlertContext';
import { StudentVerse, VerseSpecies } from '../types';
import { 
  getVerseCharacter, 
  getStageInfo, 
  calculateLevelAndProgress, 
  CHEST_ASSET 
} from '../utils/verseEngine';
import { resetStudentVerse } from '../services/verseService';

interface StudentWithVerse {
  id: string;
  name: string;
  nisn?: string;
  class_id?: string;
  className?: string;
  verse: StudentVerse | null;
  lifetimePoints: number;
}

export default function KelolaVerse() {
  const { activeSchool } = useSchool();
  const { showToast } = useAlert();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<StudentWithVerse[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedElement, setSelectedElement] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'adopted' | 'unadopted'>('all');
  const [sortBy, setSortBy] = useState<'level_desc' | 'points_desc' | 'name_asc'>('level_desc');

  // Reset Modal State
  const [resettingStudent, setResettingStudent] = useState<StudentWithVerse | null>(null);
  const [isProcessingReset, setIsProcessingReset] = useState(false);

  // Fetch all students, classes, and their verses
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const schoolId = activeSchool?.id;

      // 1. Fetch classes
      let classQuery = supabase.from('classes').select('id, name').order('name');
      if (schoolId) classQuery = classQuery.eq('school_id', schoolId);
      const { data: classesData } = await classQuery;
      const classList = classesData || [];
      setClasses(classList);
      const classMap = new Map(classList.map(c => [c.id, c.name]));

      // 2. Fetch students
      let studentQuery = supabase
        .from('students')
        .select('id, name, nisn, class_id, school_id')
        .order('name');
      if (schoolId) studentQuery = studentQuery.eq('school_id', schoolId);
      const { data: studentsData } = await studentQuery;

      // 3. Fetch all student verses
      let verseQuery = supabase.from('student_verses').select('*');
      if (schoolId) verseQuery = verseQuery.eq('school_id', schoolId);
      const { data: versesData } = await verseQuery;
      const verseMap = new Map((versesData || []).map((v: any) => [v.student_id, v]));

      // 4. Combine data
      const combined: StudentWithVerse[] = (studentsData || []).map((std: any) => {
        const rawVerse = verseMap.get(std.id);
        const verseObj: StudentVerse | null = rawVerse ? {
          id: rawVerse.id,
          studentId: rawVerse.student_id,
          schoolId: rawVerse.school_id,
          species: rawVerse.species as VerseSpecies,
          element: rawVerse.element,
          nickname: rawVerse.nickname,
          lifetimePoints: rawVerse.lifetime_points || 0,
          level: rawVerse.level || 1,
          stage: rawVerse.stage || 1,
          createdAt: rawVerse.created_at,
          updatedAt: rawVerse.updated_at,
        } : null;

        return {
          id: std.id,
          name: std.name,
          nisn: std.nisn,
          class_id: std.class_id,
          className: std.class_id ? classMap.get(std.class_id) || 'Tanpa Kelas' : 'Tanpa Kelas',
          verse: verseObj,
          lifetimePoints: verseObj ? verseObj.lifetimePoints : 0
        };
      });

      setStudents(combined);
    } catch (err) {
      console.error('[KelolaVerse] Error fetching data:', err);
      showToast('Gagal memuat data Verse murid', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSchool, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Reset Verse Action
  const handleConfirmReset = async () => {
    if (!resettingStudent) return;
    setIsProcessingReset(true);
    try {
      const success = await resetStudentVerse(resettingStudent.id);
      if (success) {
        showToast(`Verse milik ${resettingStudent.name} berhasil di-reset ke awal`, 'success');
        setStudents(prev => prev.map(s => {
          if (s.id === resettingStudent.id) {
            return { ...s, verse: null, lifetimePoints: 0 };
          }
          return s;
        }));
      } else {
        showToast('Gagal mereset Verse murid', 'error');
      }
    } catch (err) {
      console.error('[KelolaVerse] Error resetting verse:', err);
      showToast('Terjadi kesalahan saat mereset Verse', 'error');
    } finally {
      setIsProcessingReset(false);
      setResettingStudent(null);
    }
  };

  // Helper for Element Icon
  const getElementIcon = (element?: string) => {
    switch (element) {
      case 'api': return <Flame className="w-3.5 h-3.5 text-red-500" />;
      case 'air': return <Droplets className="w-3.5 h-3.5 text-cyan-500" />;
      case 'bumi': return <Mountain className="w-3.5 h-3.5 text-emerald-500" />;
      case 'angin': return <Wind className="w-3.5 h-3.5 text-sky-500" />;
      case 'petir': return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-[#3B66F5]" />;
    }
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalStudents = students.length;
    const adoptedCount = students.filter(s => !!s.verse).length;
    const unadoptedCount = totalStudents - adoptedCount;

    const adoptedList = students.filter(s => !!s.verse);
    const avgLevel = adoptedList.length > 0 
      ? Math.round((adoptedList.reduce((acc, curr) => acc + (curr.verse?.level || 1), 0) / adoptedList.length) * 10) / 10 
      : 0;

    let maxLevel = 0;
    let topStudentName = '-';
    adoptedList.forEach(s => {
      if ((s.verse?.level || 0) > maxLevel) {
        maxLevel = s.verse?.level || 0;
        topStudentName = `${s.name} (${s.verse?.nickname})`;
      }
    });

    return { totalStudents, adoptedCount, unadoptedCount, avgLevel, maxLevel, topStudentName };
  }, [students]);

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    return students.filter(std => {
      // Search
      const q = searchQuery.toLowerCase();
      const matchName = std.name.toLowerCase().includes(q);
      const matchNickname = std.verse?.nickname.toLowerCase().includes(q) || false;
      const matchSpecies = std.verse?.species.toLowerCase().includes(q) || false;
      const matchSearch = matchName || matchNickname || matchSpecies;

      // Class Filter
      const matchClass = selectedClass === 'all' || std.class_id === selectedClass;

      // Element Filter
      const matchElement = selectedElement === 'all' || std.verse?.element === selectedElement;

      // Status Filter
      const matchStatus = 
        selectedStatus === 'all' ? true :
        selectedStatus === 'adopted' ? !!std.verse :
        !std.verse;

      return matchSearch && matchClass && matchElement && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'level_desc') {
        const lvlA = a.verse?.level || 0;
        const lvlB = b.verse?.level || 0;
        if (lvlB !== lvlA) return lvlB - lvlA;
        return (b.verse?.lifetimePoints || 0) - (a.verse?.lifetimePoints || 0);
      }
      if (sortBy === 'points_desc') {
        return (b.verse?.lifetimePoints || 0) - (a.verse?.lifetimePoints || 0);
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [students, searchQuery, selectedClass, selectedElement, selectedStatus, sortBy]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-slate-100 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="h-96 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E40AF] p-6 sm:p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="flex items-center gap-4 relative z-10 min-w-0 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-white/15 text-white flex items-center justify-center font-bold text-xl shadow-lg border border-white/20 shrink-0">
            <Sparkles className="w-7 h-7 text-amber-300" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
              Pusat Pantau & Kelola Verse Murid
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm font-medium mt-0.5">
              Pantau progres level, wujud evolusi, XP seluruh murid, dan kelola status Verse.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            title="Segarkan data terbaru"
          >
            <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-300' : 'text-white'}`} />
            <span>{refreshing ? 'Sinkron...' : 'Segarkan'}</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Verse Diadopsi</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#3B66F5] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <h3 className="text-2xl font-black text-slate-900">{metrics.adoptedCount}</h3>
            <span className="text-xs font-semibold text-slate-400">/ {metrics.totalStudents} Murid</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rata-rata Level</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <h3 className="text-2xl font-black text-slate-900">Lv. {metrics.avgLevel}</h3>
            <span className="text-xs font-semibold text-slate-400">Aktif</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Level Tertinggi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <h3 className="text-2xl font-black text-slate-900">Lv. {metrics.maxLevel}</h3>
            <span className="text-xs font-semibold text-slate-400 truncate max-w-[120px]" title={metrics.topStudentName}>
              {metrics.topStudentName}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Belum Memilih</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <h3 className="text-2xl font-black text-slate-900">{metrics.unadoptedCount}</h3>
            <span className="text-xs font-semibold text-slate-400">Murid Baru</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari murid, nama Verse, atau spesies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B66F5]/20 focus:border-[#3B66F5]"
            />
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3B66F5]/20 focus:border-[#3B66F5]"
            >
              <option value="all">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Element Filter */}
          <div>
            <select
              value={selectedElement}
              onChange={(e) => setSelectedElement(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3B66F5]/20 focus:border-[#3B66F5]"
            >
              <option value="all">Semua Elemen</option>
              <option value="api">Api (Pyrofox)</option>
              <option value="air">Air (Aqualotl)</option>
              <option value="bumi">Bumi (Pangorock)</option>
              <option value="angin">Angin (Cirrofinch)</option>
              <option value="petir">Petir (Voltlynx)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3B66F5]/20 focus:border-[#3B66F5]"
            >
              <option value="level_desc">Level Tertinggi</option>
              <option value="points_desc">Poin Terbanyak</option>
              <option value="name_asc">Nama Murid (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Status Pill Tabs */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 overflow-x-auto text-xs font-bold">
          <span className="text-slate-400 shrink-0">Status:</span>
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
              selectedStatus === 'all' 
                ? 'bg-[#3B66F5] text-white shadow-2xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({students.length})
          </button>
          <button
            onClick={() => setSelectedStatus('adopted')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
              selectedStatus === 'adopted' 
                ? 'bg-[#3B66F5] text-white shadow-2xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sudah Adopsi ({metrics.adoptedCount})
          </button>
          <button
            onClick={() => setSelectedStatus('unadopted')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
              selectedStatus === 'unadopted' 
                ? 'bg-[#3B66F5] text-white shadow-2xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Belum Memilih ({metrics.unadoptedCount})
          </button>
        </div>
      </div>

      {/* Student Verse Card Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 text-sm font-medium">
          Tidak ada data murid yang cocok dengan filter atau kata kunci pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((item) => {
            const verse = item.verse;
            const char = verse ? getVerseCharacter(verse.species) : null;
            const stageInfo = verse ? getStageInfo(verse.species, verse.stage) : null;
            const vStats = verse ? calculateLevelAndProgress(verse.lifetimePoints) : null;

            return (
              <motion.div
                key={item.id}
                layout
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-4.5 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Upper Content */}
                <div>
                  {/* Student Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-800 truncate" title={item.name}>
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {item.className}
                        </span>
                        {item.nisn && (
                          <span className="text-[10px] font-mono text-slate-400">
                            NISN: {item.nisn}
                          </span>
                        )}
                      </div>
                    </div>

                    {verse ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 text-[#3B66F5] border border-blue-200/60 shrink-0">
                        Lv. {verse.level}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200 shrink-0">
                        Belum Adopsi
                      </span>
                    )}
                  </div>

                  {/* Verse Body Preview */}
                  {verse && char && stageInfo && vStats ? (
                    <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100 mb-3">
                      {/* Character Avatar */}
                      <div className="w-16 h-16 rounded-xl relative flex items-center justify-center p-1 shrink-0 overflow-hidden">
                        <div 
                          className="absolute inset-0 rounded-full blur-md opacity-25"
                          style={{ backgroundColor: char.elementColor || '#3B66F5' }}
                        />
                        <img 
                          src={stageInfo.image}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = stageInfo.pngImage; }}
                          alt={verse.nickname}
                          className="w-full h-full object-contain filter drop-shadow-md relative z-10"
                        />
                      </div>

                      {/* Character Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-extrabold text-slate-800 truncate">
                            {verse.nickname}
                          </h4>
                          {getElementIcon(verse.element)}
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 truncate mt-0.5">
                          {stageInfo.name} • Tahap {verse.stage}
                        </p>
                        
                        {/* XP Progress */}
                        <div className="mt-1.5">
                          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#3B66F5] to-indigo-500 rounded-full"
                              style={{ width: `${vStats.progressPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-0.5">
                            <span>{vStats.currentLevelProgress}/{vStats.pointsNeededForNext} XP</span>
                            <span>{verse.lifetimePoints} Total XP</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100 mb-3">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center p-1 shrink-0">
                        <img 
                          src={CHEST_ASSET.webp}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = CHEST_ASSET.png; }}
                          alt="Peti Verse"
                          className="w-full h-full object-contain opacity-60"
                        />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        Murid belum membuka peti misterius untuk mengadopsi Verse.
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {verse ? `Spesies: ${verse.species}` : 'Status: Telur Kosong'}
                  </span>

                  {verse && (
                    <button
                      onClick={() => setResettingStudent(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                      title="Reset Verse murid agar bisa memilih ulang dari awal"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Verse</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Reset Verse */}
      <AnimatePresence>
        {resettingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 w-full max-w-md relative overflow-hidden"
            >
              {/* Header Warning Icon */}
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-200/60 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Reset Verse Milik {resettingStudent.name}?
              </h3>
              
              <div className="mt-2 space-y-2 text-xs text-slate-600 font-medium">
                <p>
                  Tindakan ini akan menghapus sahabat Verse <strong className="text-slate-900">"{resettingStudent.verse?.nickname}"</strong> (Lv. {resettingStudent.verse?.level}) milik murid ini dari cloud.
                </p>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800">
                  ⚠️ Saat murid membuka menu <strong>My Verse</strong> kembali, ia akan mulai dari awal lagi (melihat peti misterius dan memilih telur elemen baru).
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setResettingStudent(null)}
                  disabled={isProcessingReset}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmReset}
                  disabled={isProcessingReset}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingReset ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Ya, Reset Verse</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
