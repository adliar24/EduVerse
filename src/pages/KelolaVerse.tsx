import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Search, 
  RotateCw, 
  RotateCcw, 
  Trophy, 
  AlertTriangle, 
  Flame, 
  Droplets, 
  Mountain, 
  Wind, 
  Zap, 
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

  // Split View & Scrollable State (Ultra lightweight scrolling)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(40);
  const detailRef = useRef<HTMLDivElement>(null);

  // Reset visible limit when filters change
  useEffect(() => {
    setVisibleCount(40);
  }, [searchQuery, selectedClass, selectedElement, selectedStatus, sortBy]);

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
    const adoptedCount = students.filter(s => !!s?.verse).length;
    const unadoptedCount = Math.max(0, totalStudents - adoptedCount);

    const adoptedList = students.filter(s => !!s?.verse);
    const avgLevel = adoptedList.length > 0 
      ? Math.round((adoptedList.reduce((acc, curr) => acc + (curr.verse?.level || 1), 0) / adoptedList.length) * 10) / 10 
      : 0;

    let maxLevel = 0;
    let topStudentName = '-';
    adoptedList.forEach(s => {
      if ((s.verse?.level || 0) > maxLevel) {
        maxLevel = s.verse?.level || 0;
        topStudentName = `${s.name || 'Murid'} (${s.verse?.nickname || 'Verse'})`;
      }
    });

    return { totalStudents, adoptedCount, unadoptedCount, avgLevel, maxLevel, topStudentName };
  }, [students]);

  // Filtered & Sorted Students with complete null guards
  const filteredStudents = useMemo(() => {
    return students.filter(std => {
      if (!std) return false;

      // Search (Safely handle null or undefined names, nicknames, and species)
      const q = (searchQuery || '').toLowerCase();
      const matchName = (std.name || '').toLowerCase().includes(q);
      const matchNickname = std.verse?.nickname ? String(std.verse.nickname).toLowerCase().includes(q) : false;
      const matchSpecies = std.verse?.species ? String(std.verse.species).toLowerCase().includes(q) : false;
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
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });
  }, [students, searchQuery, selectedClass, selectedElement, selectedStatus, sortBy]);

  // Keep selected student synced with filtered results
  useEffect(() => {
    if (filteredStudents.length > 0) {
      const exists = filteredStudents.some(s => s.id === selectedStudentId);
      if (!exists) {
        setSelectedStudentId(filteredStudents[0].id);
      }
    } else {
      setSelectedStudentId(null);
    }
  }, [filteredStudents, selectedStudentId]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return filteredStudents[0] || null;
    return students.find(s => s.id === selectedStudentId) || filteredStudents[0] || null;
  }, [students, selectedStudentId, filteredStudents]);

  // Lightweight visible list for high-performance scrolling
  const visibleStudents = useMemo(() => {
    return filteredStudents.slice(0, visibleCount);
  }, [filteredStudents, visibleCount]);

  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 120) {
      setVisibleCount(prev => Math.min(prev + 30, filteredStudents.length));
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-12 bg-slate-100 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl" />)}
        </div>
        <div className="h-10 bg-slate-100 rounded-xl" />
        <div className="h-[480px] bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pb-2">
      {/* Minimalist Compact Header */}
      <div className="flex items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#3B66F5] flex items-center justify-center font-bold shadow-2xs border border-blue-100 shrink-0">
            <Sparkles className="w-4 h-4 text-[#3B66F5]" />
          </div>
          <div className="min-w-0 flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Pusat Pantau & Kelola Verse
            </h1>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
              {metrics.totalStudents} Murid
            </span>
            <span className="text-[11px] text-slate-400 font-medium hidden lg:inline">
              • Pantau level, evolusi, & XP Verse seluruh siswa
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Segarkan data terbaru"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#3B66F5]' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Sinkron...' : 'Segarkan'}</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards - Compact Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diadopsi</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-slate-900">{metrics.adoptedCount}</span>
              <span className="text-[10px] font-semibold text-slate-400">/ {metrics.totalStudents} Murid</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#3B66F5] flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rata-rata Level</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-slate-900">Lv. {metrics.avgLevel}</span>
              <span className="text-[10px] font-semibold text-emerald-600">Aktif</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Trophy className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tertinggi</span>
            <div className="flex items-baseline gap-1 mt-0.5 truncate">
              <span className="text-base font-black text-slate-900">Lv. {metrics.maxLevel}</span>
              <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[85px]" title={metrics.topStudentName}>
                {metrics.topStudentName}
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Belum Adopsi</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base font-black text-slate-900">{metrics.unadoptedCount}</span>
              <span className="text-[10px] font-semibold text-slate-400">Murid</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar - Single Compact Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2 px-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari murid, nama Verse, atau spesies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3B66F5]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg shrink-0 overflow-x-auto text-[11px] font-bold">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
              selectedStatus === 'all' 
                ? 'bg-white text-[#3B66F5] shadow-2xs font-black' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua ({students.length})
          </button>
          <button
            onClick={() => setSelectedStatus('adopted')}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
              selectedStatus === 'adopted' 
                ? 'bg-white text-[#3B66F5] shadow-2xs font-black' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Adopsi ({metrics.adoptedCount})
          </button>
          <button
            onClick={() => setSelectedStatus('unadopted')}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer shrink-0 ${
              selectedStatus === 'unadopted' 
                ? 'bg-white text-[#3B66F5] shadow-2xs font-black' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Belum ({metrics.unadoptedCount})
          </button>
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3B66F5]"
          >
            <option value="all">Semua Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedElement}
            onChange={(e) => setSelectedElement(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3B66F5]"
          >
            <option value="all">Semua Elemen</option>
            <option value="api">Api</option>
            <option value="air">Air</option>
            <option value="bumi">Bumi</option>
            <option value="angin">Angin</option>
            <option value="petir">Petir</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3B66F5]"
          >
            <option value="level_desc">Level Tertinggi</option>
            <option value="points_desc">Poin Terbanyak</option>
            <option value="name_asc">Nama (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Student Verse Split View Layout */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center text-slate-400 text-xs font-medium">
          Tidak ada data murid yang cocok dengan filter atau kata kunci pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* LEFT COLUMN: Scrollable Master List */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-[calc(100vh-215px)] min-h-[440px] max-h-[640px]">
            {/* List Header & Counter */}
            <div className="bg-white rounded-t-xl border border-b-0 border-slate-200/90 px-3 py-2 shadow-2xs flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-700">
                Daftar Murid
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredStudents.length} Murid
              </span>
            </div>

            {/* Scrollable Container with custom scrollbar */}
            <div 
              onScroll={handleListScroll}
              className="flex-1 overflow-y-auto space-y-1.5 p-2 bg-slate-50/50 rounded-b-xl border border-slate-200/90 focus:outline-none"
              style={{ scrollbarWidth: 'thin' }}
            >
              {visibleStudents.map((item) => {
                const isSelected = selectedStudent?.id === item.id;
                const verse = item.verse;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedStudentId(item.id);
                      if (window.innerWidth < 1024) {
                        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '54px' }}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 text-left ${
                      isSelected 
                        ? 'bg-blue-50/90 border-[#3B66F5] shadow-xs ring-1 ring-[#3B66F5]/25' 
                        : 'bg-white hover:bg-slate-50/90 border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className={`text-xs font-bold truncate ${
                        isSelected ? 'text-[#3B66F5]' : 'text-slate-800'
                      }`}>
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.className}
                        </span>
                        {item.nisn && (
                          <span className="text-[9px] font-mono text-slate-400 truncate">
                            {item.nisn}
                          </span>
                        )}
                      </div>
                    </div>                      {/* Right side of item: Lv & Pet nickname or status */}
                    <div className="shrink-0 flex flex-col items-end gap-0.5">
                      {verse ? (
                        <>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100/70 text-[#3B66F5] border border-blue-200/50">
                            Lv. {verse.level || 1}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 truncate max-w-[90px]" title={verse.nickname || verse.species || 'Verse'}>
                            {verse.nickname || verse.species || 'Verse'}
                          </span>
                        </>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-400">
                          Belum Memilih
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load more hint on scroll */}
              {visibleCount < filteredStudents.length && (
                <div className="py-1.5 text-center text-[10px] font-semibold text-slate-400">
                  Scroll ke bawah untuk memuat lagi...
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Detail & Visual Pet Panel */}
          <div 
            ref={detailRef} 
            className="lg:col-span-7 xl:col-span-8 h-[calc(100vh-215px)] min-h-[440px] max-h-[640px] overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            {selectedStudent ? (
              (() => {
                const verse = selectedStudent.verse;
                const char = verse ? getVerseCharacter(verse.species) : null;
                const stageInfo = verse ? getStageInfo(verse.species, verse.stage) : null;
                const vStats = verse ? calculateLevelAndProgress(verse.lifetimePoints) : null;

                return (
                  <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 space-y-3">
                    {/* Student Header Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Detail Murid & Sahabat Verse
                        </span>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                          {selectedStudent.name || 'Murid'}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {selectedStudent.className || 'Tanpa Kelas'}
                          </span>
                          {selectedStudent.nisn && (
                            <span className="text-[10px] font-mono text-slate-400">
                              NISN: {selectedStudent.nisn}
                            </span>
                          )}
                        </div>
                      </div>

                      {verse && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setResettingStudent(selectedStudent)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                            title="Reset Verse murid agar bisa memilih ulang"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset Verse</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Verse Content */}
                    {verse && char && stageInfo && vStats ? (
                      <div className="space-y-3">
                        {/* Visual Showcase Card */}
                        <div className="relative rounded-xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 overflow-hidden">
                          {/* Element Glow Effect */}
                          <div 
                            className="absolute -top-12 -left-12 w-52 h-52 rounded-full blur-3xl opacity-25 pointer-events-none"
                            style={{ backgroundColor: char.elementColor || '#3B66F5' }}
                          />

                          {/* Visual Pet Image - Enlarged */}
                          <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-2xl relative flex items-center justify-center p-2 shrink-0">
                            <div 
                              className="absolute inset-2 rounded-full blur-xl opacity-35"
                              style={{ backgroundColor: char.elementColor || '#3B66F5' }}
                            />
                            <img 
                              src={stageInfo.image}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = stageInfo.pngImage; }}
                              alt={verse.nickname || char.species || 'Sahabat Verse'}
                              className="w-full h-full object-contain filter drop-shadow-xl relative z-10 transition-transform duration-300 hover:scale-105"
                            />
                          </div>

                          {/* Pet Description & Identity */}
                          <div className="min-w-0 flex-1 text-center sm:text-left space-y-1.5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200/80 shadow-2xs text-[11px] font-bold text-slate-700">
                              {getElementIcon(verse.element)}
                              <span className="capitalize">{char.elementName}</span>
                              <span className="text-slate-300">•</span>
                              <span>Spesies {char.species}</span>
                            </div>

                            <div>
                              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                {verse.nickname || char.species || 'Sahabat Verse'}
                              </h3>
                              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                {stageInfo.name} — Tahap Evolusi {verse.stage || 1}
                              </p>
                            </div>

                            <p className="text-xs text-slate-600 font-medium line-clamp-3 leading-relaxed">
                              {stageInfo.description || char.philosophy}
                            </p>
                          </div>
                        </div>

                        {/* EXP & Level Details Card */}
                        <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                              Progres Level & Perolehan EXP
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#3B66F5] text-white shadow-2xs">
                              Level {verse.level}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                              <span>Menuju Level {vStats.currentLevel + 1}</span>
                              <span className="text-[#3B66F5] font-extrabold">{vStats.progressPercent}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/60">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${vStats.progressPercent}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-[#3B66F5] to-indigo-600 rounded-full"
                              />
                            </div>
                          </div>

                          {/* EXP Metric Chips (4 Columns) */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">EXP Level Ini</span>
                              <span className="text-xs font-black text-slate-800 mt-0.5 block truncate">
                                {vStats.currentLevelProgress} <span className="text-[9px] text-slate-400 font-normal">/ {vStats.pointsNeededForNext}</span>
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Sisa Kebutuhan</span>
                              <span className="text-xs font-black text-blue-600 mt-0.5 block truncate">
                                {vStats.pointsRemaining} <span className="text-[9px] text-slate-400 font-normal">XP</span>
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Tahap Evolusi</span>
                              <span className="text-xs font-black text-slate-800 mt-0.5 block truncate">
                                Tahap {verse.stage}
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Total EXP (Lifetime)</span>
                              <span className="text-xs font-black text-emerald-600 mt-0.5 block truncate">
                                {verse.lifetimePoints} <span className="text-[9px] text-slate-400 font-normal">XP</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Unadopted State */
                      <div className="p-8 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200 flex flex-col items-center justify-center space-y-3">
                        <div className="w-24 h-24 rounded-2xl flex items-center justify-center p-2">
                          <img 
                            src={CHEST_ASSET.webp}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = CHEST_ASSET.png; }}
                            alt="Peti Verse"
                            className="w-full h-full object-contain opacity-75 drop-shadow-md"
                          />
                        </div>
                        <div className="max-w-md space-y-1">
                          <h3 className="text-base font-extrabold text-slate-800">
                            Belum Mengadopsi Sahabat Verse
                          </h3>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Murid ini belum membuka peti misterius untuk mengadopsi Verse pertamanya. Status akan otomatis diperbarui begitu murid memilih telur di menu My Verse.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center text-slate-400 text-xs font-medium">
                Pilih salah satu murid di sisi kiri untuk melihat detail visual & progres EXP.
              </div>
            )}
          </div>
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
