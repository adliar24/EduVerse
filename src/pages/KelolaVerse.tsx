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
  Users,
  X,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown
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
import { resetStudentVerse, adjustStudentVerseExp } from '../services/verseService';

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
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(40);
  const detailRef = useRef<HTMLDivElement>(null);

  // Reset visible limit when filters change
  useEffect(() => {
    setVisibleCount(40);
  }, [searchQuery, selectedClass, selectedElement, selectedStatus, sortBy]);

  // Reset Modal State
  const [resettingStudent, setResettingStudent] = useState<StudentWithVerse | null>(null);
  const [isProcessingReset, setIsProcessingReset] = useState(false);

  // Adjust EXP Modal State
  const [adjustExpStudent, setAdjustExpStudent] = useState<StudentWithVerse | null>(null);
  const [expMode, setExpMode] = useState<'add' | 'subtract' | 'set'>('add');
  const [expAmount, setExpAmount] = useState<number>(50);
  const [isSubmittingExp, setIsSubmittingExp] = useState(false);

  // Calculated EXP Preview
  const expPreview = useMemo(() => {
    if (!adjustExpStudent?.verse) return null;
    const currentExp = Number(adjustExpStudent.verse.lifetimePoints) || 0;
    const amt = Math.max(0, Number(expAmount) || 0);
    let targetTotal = currentExp;

    if (expMode === 'add') {
      targetTotal = currentExp + amt;
    } else if (expMode === 'subtract') {
      targetTotal = Math.max(0, currentExp - amt);
    } else {
      targetTotal = amt;
    }

    const currentStats = calculateLevelAndProgress(currentExp);
    const newStats = calculateLevelAndProgress(targetTotal);
    const delta = targetTotal - currentExp;

    return {
      currentExp,
      targetTotal,
      delta,
      currentLevel: currentStats.currentLevel,
      newLevel: newStats.currentLevel,
      currentStage: currentStats.currentStage,
      newStage: newStats.currentStage,
      levelDiff: newStats.currentLevel - currentStats.currentLevel,
      stageDiff: newStats.currentStage - currentStats.currentStage,
      progressPercent: newStats.progressPercent
    };
  }, [adjustExpStudent, expMode, expAmount]);

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

      // 4. Fetch student_points so all points (presensi, tugas, manual) are counted
      let pointsQuery = supabase.from('student_points').select('id_siswa, poin');
      if (schoolId) pointsQuery = pointsQuery.eq('school_id', schoolId);
      const { data: pointsData } = await pointsQuery;
      const pointsMap = new Map<string, number>();
      (pointsData || []).forEach((p: any) => {
        const sid = String(p.id_siswa);
        pointsMap.set(sid, (pointsMap.get(sid) || 0) + (Number(p.poin) || 0));
      });

      // 5. Combine data
      const combined: StudentWithVerse[] = (studentsData || []).map((std: any) => {
        const rawVerse = verseMap.get(std.id);
        const accumulatedPoints = pointsMap.get(std.id) || 0;
        const rawVersePoints = rawVerse ? (Number(rawVerse.lifetime_points) || 0) : 0;
        const effectivePoints = Math.max(rawVersePoints, accumulatedPoints);

        const verseObj: StudentVerse | null = rawVerse ? {
          id: rawVerse.id,
          studentId: rawVerse.student_id,
          schoolId: rawVerse.school_id,
          species: rawVerse.species as VerseSpecies,
          element: rawVerse.element,
          nickname: rawVerse.nickname,
          lifetimePoints: effectivePoints,
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
          lifetimePoints: effectivePoints
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

  // Handle Adjust Verse EXP Action (Add or Subtract EXP without touching student_points)
  const handleConfirmAdjustExp = async () => {
    if (!adjustExpStudent?.verse || !expPreview) return;
    setIsSubmittingExp(true);
    try {
      const res = await adjustStudentVerseExp({
        studentId: adjustExpStudent.id,
        targetExp: expPreview.targetTotal
      });

      if (res.success && res.verse) {
        const newVerse = res.verse;
        const levelMsg = res.oldLevel !== res.newLevel 
          ? ` (Lv. ${res.oldLevel} ➔ Lv. ${res.newLevel})`
          : '';
        showToast(
          `EXP Verse ${adjustExpStudent.name} berhasil diperbarui${levelMsg}!`,
          'success'
        );

        setStudents(prev => prev.map(s => {
          if (s.id === adjustExpStudent.id) {
            return {
              ...s,
              verse: newVerse,
              lifetimePoints: newVerse.lifetimePoints
            };
          }
          return s;
        }));

        setAdjustExpStudent(null);
      } else {
        showToast(res.error || 'Gagal mengubah EXP Verse', 'error');
      }
    } catch (err) {
      console.error('[KelolaVerse] Error adjusting EXP:', err);
      showToast('Terjadi kesalahan saat menyimpan penyesuaian EXP', 'error');
    } finally {
      setIsSubmittingExp(false);
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

  // Helper to render student verse detail card (both for desktop panel & mobile pop-up modal)
  const renderStudentDetailCard = (student: StudentWithVerse, isModal = false) => {
    const verse = student.verse;
    const char = verse ? getVerseCharacter(verse.species) : null;
    const stageInfo = verse ? getStageInfo(verse.species, verse.stage) : null;
    const vStats = verse ? calculateLevelAndProgress(verse.lifetimePoints) : null;

    return (
      <div className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 ${isModal ? 'shadow-2xl' : 'shadow-xs'}`}>
        {/* Student Header Info */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Detail Murid & Sahabat Verse
            </span>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
              {student.name || 'Murid'}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60">
                {student.className || 'Tanpa Kelas'}
              </span>
              {student.nisn && (
                <span className="text-[10px] font-mono text-slate-400">
                  NISN: {student.nisn}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {verse && (
              <button
                onClick={() => {
                  setAdjustExpStudent(student);
                  setExpMode('add');
                  setExpAmount(50);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200/90 bg-blue-50/90 hover:bg-blue-100 text-[#3B66F5] text-xs font-bold transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                title="Sesuaikan EXP Verse murid (tambah atau kurangi)"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>Ubah EXP</span>
              </button>
            )}
            {verse && (
              <button
                onClick={() => setResettingStudent(student)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98]"
                title="Reset Verse murid agar bisa memilih ulang"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
            {isModal && (
              <button
                onClick={() => setIsMobileDetailOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Verse Content */}
        {verse && char && stageInfo && vStats ? (
          <div className="space-y-4">
            {/* Visual Showcase Card - Clean White Backdrop, No Blurry Background */}
            <div className="relative rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 sm:gap-6 shadow-xs">
              {/* Visual Pet Image - Crystal Clear */}
              <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60 rounded-2xl relative flex items-center justify-center p-3 shrink-0 bg-slate-50/70 border border-slate-100 shadow-2xs">
                <img 
                  src={stageInfo.image}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = stageInfo.pngImage; }}
                  alt={verse.nickname || char.species || 'Sahabat Verse'}
                  className="w-full h-full object-contain filter drop-shadow-md relative z-10 transition-transform duration-300 hover:scale-105 select-none"
                />
              </div>

              {/* Pet Description & Identity */}
              <div className="min-w-0 flex-1 text-center sm:text-left space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 shadow-xs text-xs font-bold text-slate-700">
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
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Progres Level & Perolehan EXP
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAdjustExpStudent(student);
                      setExpMode('add');
                      setExpAmount(50);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 text-[#3B66F5] hover:bg-blue-100 text-xs font-bold transition-all shadow-xs cursor-pointer hover:scale-105"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ubah EXP</span>
                  </button>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-[#3B66F5] text-white shadow-xs">
                    Level {verse.level}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Menuju Level {vStats.currentLevel + 1}</span>
                  <span className="text-[#3B66F5] font-black">{vStats.progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/60">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${vStats.progressPercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#3B66F5] to-indigo-600 rounded-full"
                  />
                </div>
              </div>

              {/* EXP Metric Chips (4 Columns) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">EXP Level Ini</span>
                  <span className="text-xs font-black text-slate-800 mt-0.5 block truncate">
                    {vStats.currentLevelProgress} <span className="text-[9px] text-slate-400 font-normal">/ {vStats.pointsNeededForNext}</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Sisa Kebutuhan</span>
                  <span className="text-xs font-black text-blue-600 mt-0.5 block truncate">
                    {vStats.pointsRemaining} <span className="text-[9px] text-slate-400 font-normal">XP</span>
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Tahap Evolusi</span>
                  <span className="text-xs font-black text-slate-800 mt-0.5 block truncate">
                    Tahap {verse.stage}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Total EXP (Lifetime)</span>
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
            <div className="max-w-md space-y-2">
              <h3 className="text-base font-extrabold text-slate-800">
                Belum Menetaskan Telur Verse
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Murid ini belum membuka peti misterius untuk mengadopsi Verse pertamanya. Begitu murid memilih telur di menu My Verse, status pet akan otomatis aktif.
              </p>
              {selectedStudent.lifetimePoints > 0 ? (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tabungan EXP:</span>
                  <span className="text-emerald-600 font-black">+{selectedStudent.lifetimePoints} XP</span>
                  <span className="text-[10px] text-slate-400 font-normal">(dari presensi & aktivitas)</span>
                </div>
              ) : (
                <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-medium">
                  Belum ada EXP terkumpul
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
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
      <div className="flex items-center justify-between gap-3 bg-white px-4 sm:px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#3B66F5] flex items-center justify-center font-bold shadow-xs border border-blue-100 shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-[#3B66F5]" />
          </div>
          <div className="min-w-0 flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Pusat Pantau & Kelola Verse
            </h1>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full shrink-0 border border-slate-200/60">
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
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs hover:shadow-sm"
            title="Segarkan data terbaru"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#3B66F5]' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Sinkron...' : 'Segarkan'}</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards - Rounded 2xl & Subtle Shadow */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Diadopsi</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-slate-900">{metrics.adoptedCount}</span>
              <span className="text-[10px] font-semibold text-slate-400">/ {metrics.totalStudents} Murid</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#3B66F5] flex items-center justify-center shrink-0 border border-blue-100">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rata-rata Level</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-slate-900">Lv. {metrics.avgLevel}</span>
              <span className="text-[10px] font-semibold text-emerald-600">Aktif</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Trophy className="w-4 h-4" />
          </div>
        </div>

        <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-sm transition-all flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tertinggi</span>
            <div className="flex items-baseline gap-1 mt-0.5 truncate">
              <span className="text-lg font-black text-slate-900">Lv. {metrics.maxLevel}</span>
              <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[85px]" title={metrics.topStudentName}>
                {metrics.topStudentName}
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-sm transition-all flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Belum Adopsi</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-slate-900">{metrics.unadoptedCount}</span>
              <span className="text-[10px] font-semibold text-slate-400">Murid</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar - Rounded 2xl & Subtle Shadow */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari murid, nama Verse, atau spesies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3B66F5]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto text-[11px] font-bold">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
              selectedStatus === 'all' 
                ? 'bg-white text-[#3B66F5] shadow-xs font-black' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua ({students.length})
          </button>
          <button
            onClick={() => setSelectedStatus('adopted')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
              selectedStatus === 'adopted' 
                ? 'bg-white text-[#3B66F5] shadow-xs font-black' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Adopsi ({metrics.adoptedCount})
          </button>
          <button
            onClick={() => setSelectedStatus('unadopted')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
              selectedStatus === 'unadopted' 
                ? 'bg-white text-[#3B66F5] shadow-xs font-black' 
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
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3B66F5]"
          >
            <option value="all">Semua Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedElement}
            onChange={(e) => setSelectedElement(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3B66F5]"
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
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3B66F5]"
          >
            <option value="level_desc">Level Tertinggi</option>
            <option value="points_desc">Poin Terbanyak</option>
            <option value="name_asc">Nama (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Student Verse Split View Layout */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs font-medium shadow-xs">
          Tidak ada data murid yang cocok dengan filter atau kata kunci pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* LEFT COLUMN: Scrollable Master List (Full width on mobile, 5 cols on lg) */}
          <div className="w-full lg:col-span-5 xl:col-span-4 flex flex-col h-[calc(100vh-215px)] min-h-[440px] max-h-[640px]">
            {/* List Header & Counter */}
            <div className="bg-white rounded-t-2xl border border-b-0 border-slate-200 px-4 py-3 shadow-xs flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-slate-800">
                Daftar Murid
              </span>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60">
                {filteredStudents.length} Murid
              </span>
            </div>

            {/* Scrollable Container with custom scrollbar */}
            <div 
              onScroll={handleListScroll}
              className="flex-1 overflow-y-auto space-y-2 p-2.5 bg-slate-50/60 rounded-b-2xl border border-slate-200 focus:outline-none shadow-xs"
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
                      setIsMobileDetailOpen(true);
                      if (window.innerWidth >= 1024) {
                        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    }}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '54px' }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${
                      isSelected 
                        ? 'bg-blue-50/90 border-[#3B66F5] shadow-xs ring-1 ring-[#3B66F5]/25' 
                        : 'bg-white hover:bg-slate-50/90 border-slate-200 shadow-xs'
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
                    </div>

                    {/* Right side of item: Lv & Pet nickname or status */}
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
                        <div className="flex flex-col items-end">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            item.lifetimePoints > 0 
                              ? 'bg-amber-50 text-amber-600 border border-amber-200/60' 
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {item.lifetimePoints > 0 ? `${item.lifetimePoints} XP` : 'Belum Adopsi'}
                          </span>
                          {item.lifetimePoints > 0 && (
                            <span className="text-[8px] text-slate-400 font-medium">Tersimpan</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Load more hint on scroll */}
              {visibleCount < filteredStudents.length && (
                <div className="py-2 text-center text-[10px] font-semibold text-slate-400">
                  Scroll ke bawah untuk memuat lagi...
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Detail & Visual Pet Panel (Desktop Only, hidden on mobile) */}
          <div 
            ref={detailRef} 
            className="hidden lg:block lg:col-span-7 xl:col-span-8 h-[calc(100vh-215px)] min-h-[440px] max-h-[640px] overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            {selectedStudent ? (
              renderStudentDetailCard(selectedStudent, false)
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs font-medium shadow-xs">
                Pilih salah satu murid di sisi kiri untuk melihat detail visual & progres EXP.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Pop-up Modal: Student Verse Detail */}
      <AnimatePresence>
        {isMobileDetailOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs lg:hidden">
            {/* Backdrop click dismiss */}
            <div 
              className="absolute inset-0" 
              onClick={() => setIsMobileDetailOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-lg max-h-[88vh] overflow-y-auto"
              style={{ scrollbarWidth: 'thin' }}
            >
              {renderStudentDetailCard(selectedStudent, true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Modal: Sesuaikan EXP Verse Murid (Tambah / Kurang EXP Tanpa Sentuh Nilai Rapor) */}
      <AnimatePresence>
        {adjustExpStudent && adjustExpStudent.verse && expPreview && (() => {
          const v = adjustExpStudent.verse;
          const char = getVerseCharacter(v.species);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-7 w-full max-w-lg relative overflow-hidden space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/80 text-[#3B66F5] flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-amber-500 fill-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                        Sesuaikan EXP Verse
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {adjustExpStudent.name} • <strong className="text-slate-800">{v.nickname}</strong> ({char.species})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setAdjustExpStudent(null)}
                    disabled={isSubmittingExp}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setExpMode('add')}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      expMode === 'add'
                        ? 'bg-white text-emerald-600 shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah EXP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpMode('subtract')}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      expMode === 'subtract'
                        ? 'bg-white text-rose-600 shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Kurangi EXP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExpMode('set');
                      setExpAmount(expPreview.currentExp);
                    }}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      expMode === 'set'
                        ? 'bg-white text-[#3B66F5] shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>Set Langsung</span>
                  </button>
                </div>

                {/* Amount Input & Preset Chips */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    {expMode === 'add' && 'Jumlah EXP yang Ingin Ditambahkan:'}
                    {expMode === 'subtract' && 'Jumlah EXP yang Ingin Dikurangi:'}
                    {expMode === 'set' && 'Total EXP Baru yang Ditetapkan:'}
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100000"
                      value={expAmount}
                      onChange={(e) => setExpAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full pl-4 pr-14 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-base font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B66F5]"
                      placeholder="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                      XP
                    </span>
                  </div>

                  {/* Preset Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Cepat:</span>
                    {expMode === 'add' && [25, 50, 100, 250, 500].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setExpAmount(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          expAmount === val 
                            ? 'bg-emerald-600 text-white shadow-2xs' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        +{val}
                      </button>
                    ))}
                    {expMode === 'subtract' && [25, 50, 100, 250, 500].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setExpAmount(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          expAmount === val 
                            ? 'bg-rose-600 text-white shadow-2xs' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        -{val}
                      </button>
                    ))}
                    {expMode === 'set' && [0, 100, 250, 500, 1000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setExpAmount(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          expAmount === val 
                            ? 'bg-[#3B66F5] text-white shadow-2xs' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {val} XP
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Pratinjau Hasil Perubahan:</span>
                    {expPreview.levelDiff > 0 && (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-black">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Naik +{expPreview.levelDiff} Level!
                      </span>
                    )}
                    {expPreview.levelDiff < 0 && (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-black">
                        <TrendingDown className="w-3.5 h-3.5" />
                        Turun {expPreview.levelDiff} Level
                      </span>
                    )}
                    {expPreview.levelDiff === 0 && (
                      <span className="text-slate-600 font-black">
                        Level Tetap
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Sebelumnya</span>
                      <div className="text-sm font-black text-slate-700 mt-0.5">
                        Level {expPreview.currentLevel} <span className="text-[10px] text-slate-400 font-bold">(Tahap {expPreview.currentStage})</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {expPreview.currentExp} XP
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${
                      expPreview.levelDiff > 0 ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' :
                      expPreview.levelDiff < 0 ? 'bg-rose-50/60 border-rose-200 text-rose-900' :
                      'bg-blue-50/60 border-blue-200 text-blue-900'
                    }`}>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Menjadi</span>
                      <div className="text-sm font-black mt-0.5">
                        Level {expPreview.newLevel} <span className="text-[10px] opacity-75 font-bold">(Tahap {expPreview.newStage})</span>
                      </div>
                      <span className="text-[11px] font-extrabold">
                        {expPreview.targetTotal} XP ({expPreview.delta >= 0 ? `+${expPreview.delta}` : expPreview.delta})
                      </span>
                    </div>
                  </div>

                  {expPreview.stageDiff > 0 && (
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold text-center flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Verse akan ber-evolusi ke wujud Tahap {expPreview.newStage}!</span>
                    </div>
                  )}
                </div>

                {/* Safe Academic Guarantee Callout */}
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium bg-slate-100/70 p-2.5 rounded-xl border border-slate-200/60">
                  🛡️ <strong>Aman:</strong> Penyesuaian ini hanya mengubah EXP & Level Verse secara langsung, <strong>tanpa mempengaruhi nilai ujian atau poin prestasi</strong> yang sudah diraih murid.
                </p>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setAdjustExpStudent(null)}
                    disabled={isSubmittingExp}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAdjustExp}
                    disabled={isSubmittingExp || expPreview.delta === 0}
                    className="px-5 py-2.5 rounded-xl bg-[#3B66F5] hover:bg-blue-600 text-white text-xs font-black shadow-md shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingExp ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan EXP</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
