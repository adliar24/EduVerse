import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  RotateCw, 
  Check, 
  Zap, 
  Flame, 
  Droplets, 
  Mountain, 
  Wind,
  Edit2,
  ArrowRight
} from 'lucide-react';
import { capitalizeEachWord } from '../../lib/utils';
import { StudentVerse, VerseSpecies } from '../../types';
import { 
  VERSE_CHARACTERS, 
  CHEST_ASSET, 
  getAllVerseCharacters, 
  getVerseCharacter, 
  calculateLevelAndProgress, 
  getRandomMotivationQuote,
  getStageInfo
} from '../../utils/verseEngine';
import { 
  getStudentVerse, 
  saveStudentVerse, 
  getStudentPointsHistory, 
  syncVerseWithPoints,
  PointHistoryItem
} from '../../services/verseService';

type OnboardingStep = 'chest' | 'select_egg' | 'hatching' | 'reveal';

export default function MyVerse() {
  const navigate = useNavigate();

  // Student Session
  const [student, setStudent] = useState<any>(null);
  const [verse, setVerse] = useState<StudentVerse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Points & History
  const [pointsHistory, setPointsHistory] = useState<PointHistoryItem[]>([]);
  const [totalLifetimePoints, setTotalLifetimePoints] = useState(0);

  // Onboarding States: 'chest' | 'select_egg' | 'hatching' | 'reveal'
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('chest');
  const [selectedSpecies, setSelectedSpecies] = useState<VerseSpecies>('Pyrofox');
  const [nicknameInput, setNicknameInput] = useState('');
  const [isSubmittingAdoption, setIsSubmittingAdoption] = useState(false);

  // Interactive Tap-Tap Hatching States
  const [tapCount, setTapCount] = useState(0);
  const [isWobbling, setIsWobbling] = useState(false);
  const [isCracking, setIsCracking] = useState(false);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number }>>([]);

  // Rename modal
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');

  // Daily quote
  const [quote, setQuote] = useState('');

  // Level Up & Evolution Celebrations
  const [levelUpCelebration, setLevelUpCelebration] = useState<{
    oldLevel: number;
    newLevel: number;
    species: VerseSpecies;
    nickname: string;
  } | null>(null);

  const [evolutionCelebration, setEvolutionCelebration] = useState<{
    oldStage: number;
    newStage: number;
    species: VerseSpecies;
    nickname: string;
    oldLevel: number;
    newLevel: number;
  } | null>(null);

  const [evolutionPhase, setEvolutionPhase] = useState<'transforming' | 'revealed'>('transforming');

  const playLevelUpSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.4);
      });
    } catch (e) {}
  };

  const playEvolutionSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.2);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.4);

      const fanfareNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      fanfareNotes.forEach((freq, idx) => {
        const fOsc = ctx.createOscillator();
        const fGain = ctx.createGain();
        fOsc.type = 'triangle';
        fOsc.frequency.value = freq;
        fGain.gain.setValueAtTime(0.25, ctx.currentTime + 1.4 + idx * 0.15);
        fGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4 + idx * 0.15 + 0.6);
        fOsc.connect(fGain);
        fGain.connect(ctx.destination);
        fOsc.start(ctx.currentTime + 1.4 + idx * 0.15);
        fOsc.stop(ctx.currentTime + 1.4 + idx * 0.15 + 0.7);
      });
    } catch (e) {}
  };

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const sessionStr = localStorage.getItem('student_session');
      if (!sessionStr) {
        navigate('/login');
        return;
      }
      const studentObj = JSON.parse(sessionStr);
      setStudent(studentObj);

      // 1. Fetch verse & points in parallel
      const [existingVerse, pointsData] = await Promise.all([
        getStudentVerse(studentObj.id),
        getStudentPointsHistory(studentObj.id, studentObj.name, studentObj.className || '')
      ]);

      const effectiveLifetimePoints = existingVerse !== null && existingVerse.lifetimePoints !== undefined
        ? existingVerse.lifetimePoints
        : (pointsData.totalPoints || 0);
      setPointsHistory(pointsData.items);
      setTotalLifetimePoints(effectiveLifetimePoints);

      if (existingVerse) {
        // Sync level & stage based on lifetime points
        const { verse: syncedVerse } = await syncVerseWithPoints(existingVerse, effectiveLifetimePoints);
        setVerse(syncedVerse);
        setQuote(getRandomMotivationQuote(syncedVerse.species, syncedVerse.nickname));

        // Check for level up or evolution celebration
        const lastSeenLevelKey = `eduverse_last_level_${studentObj.id}`;
        const lastSeenStageKey = `eduverse_last_stage_${studentObj.id}`;
        const rawLastLevel = localStorage.getItem(lastSeenLevelKey);
        const rawLastStage = localStorage.getItem(lastSeenStageKey);

        if (rawLastLevel !== null && rawLastStage !== null) {
          const lastLevel = parseInt(rawLastLevel, 10);
          const lastStage = parseInt(rawLastStage, 10);

          if (syncedVerse.stage > lastStage) {
            // Preload new evolved image immediately so browser caches it before reveal
            try {
              const stageData = getStageInfo(syncedVerse.species, syncedVerse.stage);
              const evoImg = new Image();
              evoImg.src = stageData.image;
              if (stageData.pngImage) {
                const evoPng = new Image();
                evoPng.src = stageData.pngImage;
              }
            } catch (e) {}

            setEvolutionPhase('transforming');
            setEvolutionCelebration({
              oldStage: lastStage,
              newStage: syncedVerse.stage,
              species: syncedVerse.species,
              nickname: syncedVerse.nickname,
              oldLevel: lastLevel,
              newLevel: syncedVerse.level
            });
            playEvolutionSound();
            setTimeout(() => setEvolutionPhase('revealed'), 2200);
          } else if (syncedVerse.level > lastLevel) {
            setLevelUpCelebration({
              oldLevel: lastLevel,
              newLevel: syncedVerse.level,
              species: syncedVerse.species,
              nickname: syncedVerse.nickname
            });
            playLevelUpSound();
          }
        }

        // Cache latest seen level and stage
        localStorage.setItem(lastSeenLevelKey, String(syncedVerse.level));
        localStorage.setItem(lastSeenStageKey, String(syncedVerse.stage));
      } else {
        setVerse(null);
      }
    } catch (err) {
      console.error('[MyVerse] Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculated level & progress stats
  const levelStats = useMemo(() => {
    return calculateLevelAndProgress(totalLifetimePoints);
  }, [totalLifetimePoints]);

  const activeCharData = useMemo(() => {
    if (!verse) return null;
    return getVerseCharacter(verse.species);
  }, [verse]);

  const activeStageInfo = useMemo(() => {
    if (!verse) return null;
    return getStageInfo(verse.species, verse.stage);
  }, [verse]);

  // Start the tap-tap egg hatching flow
  const handleStartEggHatching = () => {
    setTapCount(0);
    setIsWobbling(false);
    setIsCracking(false);
    setSparkles([]);
    setOnboardingStep('hatching');
  };

  // Handle each interactive tap on the egg (Target: 12 taps)
  const TOTAL_HATCH_TAPS = 12;

  const handleTapEgg = () => {
    if (isCracking) return;
    const nextCount = tapCount + 1;
    setTapCount(nextCount);

    // Vibration feedback on mobile devices if supported (intensifies as it approaches 12)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25 + Math.min(nextCount * 4, 50));
    }

    // Trigger fluid wobble
    setIsWobbling(true);
    setTimeout(() => setIsWobbling(false), 260);

    // Spawn colorful element sparkles around the egg (more sparkles on higher taps)
    const char = getVerseCharacter(selectedSpecies);
    const sparkleAmount = 6 + Math.min(Math.floor(nextCount * 0.8), 8);
    const newSparkles = Array.from({ length: sparkleAmount }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: (Math.random() - 0.5) * (180 + nextCount * 6),
      y: (Math.random() - 0.5) * (180 + nextCount * 6),
      color: char.elementColor || '#F59E0B',
      size: Math.floor(Math.random() * 8) + 8
    }));
    setSparkles(prev => [...prev.slice(-28), ...newSparkles]);

    // Check if reached 12 taps -> crack egg and reveal character
    if (nextCount >= TOTAL_HATCH_TAPS) {
      setIsCracking(true);
      setTimeout(() => {
        setIsCracking(false);
        setOnboardingStep('reveal');
      }, 700);
    }
  };

  // Confirm adoption on the Reveal Screen
  const handleConfirmAdoption = async () => {
    if (!student || !selectedSpecies) return;
    const finalNickname = nicknameInput.trim() || selectedSpecies;

    setIsSubmittingAdoption(true);
    try {
      const char = getVerseCharacter(selectedSpecies);
      const { currentLevel, currentStage } = calculateLevelAndProgress(totalLifetimePoints);

      const newVerse: StudentVerse = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `verse_${Date.now()}`,
        studentId: student.id,
        schoolId: student.school_id || undefined,
        species: selectedSpecies,
        element: char.element,
        nickname: finalNickname,
        lifetimePoints: totalLifetimePoints,
        level: currentLevel,
        stage: currentStage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await saveStudentVerse(newVerse);
      setVerse(saved);
      setQuote(getRandomMotivationQuote(saved.species, saved.nickname));
    } catch (err) {
      console.error('[MyVerse] Error adopting verse:', err);
    } finally {
      setIsSubmittingAdoption(false);
    }
  };

  // Handle updating nickname
  const handleSaveNickname = async () => {
    if (!verse || !editNameInput.trim()) return;
    const updated = { ...verse, nickname: editNameInput.trim() };
    const saved = await saveStudentVerse(updated);
    setVerse(saved);
    setIsEditingName(false);
  };

  const getElementIcon = (element: string, className?: string) => {
    const baseClass = className || "w-3.5 h-3.5";
    switch (element) {
      case 'api': return <Flame className={`${baseClass} ${!className?.includes('text-') ? 'text-red-500' : ''}`} />;
      case 'air': return <Droplets className={`${baseClass} ${!className?.includes('text-') ? 'text-cyan-500' : ''}`} />;
      case 'bumi': return <Mountain className={`${baseClass} ${!className?.includes('text-') ? 'text-emerald-500' : ''}`} />;
      case 'angin': return <Wind className={`${baseClass} ${!className?.includes('text-') ? 'text-sky-500' : ''}`} />;
      case 'petir': return <Zap className={`${baseClass} ${!className?.includes('text-') ? 'text-amber-500' : ''}`} />;
      default: return <Sparkles className={`${baseClass} ${!className?.includes('text-') ? 'text-[#3B66F5]' : ''}`} />;
    }
  };

  // Helper for elemental card themes (soft, bright pastel wash to keep pet artwork crystal clear)
  const getElementCardTheme = (element?: string) => {
    switch (element) {
      case 'api':
        return {
          cardBg: 'bg-gradient-to-b from-orange-50/80 via-rose-50/40 to-white',
          border: 'border-orange-200/80',
          divider: 'border-orange-100/90',
          progressBox: 'bg-white/85 border border-orange-100/90 shadow-2xs',
          progressBar: 'bg-gradient-to-r from-orange-500 to-rose-500',
          progressText: 'text-orange-600',
          quoteBubble: 'bg-orange-50/70 border border-orange-200/70 text-orange-950',
          stageBadge: 'bg-orange-100/80 text-orange-700 border-orange-200/80',
          levelBadge: 'bg-rose-100/80 text-rose-700 border-rose-200/80',
        };
      case 'air':
        return {
          cardBg: 'bg-gradient-to-b from-cyan-50/80 via-sky-50/40 to-white',
          border: 'border-cyan-200/80',
          divider: 'border-cyan-100/90',
          progressBox: 'bg-white/85 border border-cyan-100/90 shadow-2xs',
          progressBar: 'bg-gradient-to-r from-cyan-500 to-blue-500',
          progressText: 'text-cyan-600',
          quoteBubble: 'bg-cyan-50/70 border border-cyan-200/70 text-cyan-950',
          stageBadge: 'bg-cyan-100/80 text-cyan-700 border-cyan-200/80',
          levelBadge: 'bg-blue-100/80 text-blue-700 border-blue-200/80',
        };
      case 'bumi':
        return {
          cardBg: 'bg-gradient-to-b from-emerald-50/80 via-teal-50/40 to-white',
          border: 'border-emerald-200/80',
          divider: 'border-emerald-100/90',
          progressBox: 'bg-white/85 border border-emerald-100/90 shadow-2xs',
          progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-600',
          progressText: 'text-emerald-600',
          quoteBubble: 'bg-emerald-50/70 border border-emerald-200/70 text-emerald-950',
          stageBadge: 'bg-emerald-100/80 text-emerald-700 border-emerald-200/80',
          levelBadge: 'bg-teal-100/80 text-teal-700 border-teal-200/80',
        };
      case 'angin':
        return {
          cardBg: 'bg-gradient-to-b from-sky-50/80 via-indigo-50/40 to-white',
          border: 'border-sky-200/80',
          divider: 'border-sky-100/90',
          progressBox: 'bg-white/85 border border-sky-100/90 shadow-2xs',
          progressBar: 'bg-gradient-to-r from-sky-500 to-indigo-500',
          progressText: 'text-sky-600',
          quoteBubble: 'bg-sky-50/70 border border-sky-200/70 text-sky-950',
          stageBadge: 'bg-sky-100/80 text-sky-700 border-sky-200/80',
          levelBadge: 'bg-indigo-100/80 text-indigo-700 border-indigo-200/80',
        };
      case 'petir':
        return {
          cardBg: 'bg-gradient-to-b from-amber-50/80 via-yellow-50/40 to-white',
          border: 'border-amber-200/80',
          divider: 'border-amber-100/90',
          progressBox: 'bg-white/85 border border-amber-100/90 shadow-2xs',
          progressBar: 'bg-gradient-to-r from-amber-500 to-orange-500',
          progressText: 'text-amber-600',
          quoteBubble: 'bg-amber-50/70 border border-amber-200/70 text-amber-950',
          stageBadge: 'bg-amber-100/80 text-amber-700 border-amber-200/80',
          levelBadge: 'bg-yellow-100/80 text-yellow-800 border-yellow-200/80',
        };
      default:
        return {
          cardBg: 'bg-gradient-to-b from-blue-50/80 via-indigo-50/40 to-white',
          border: 'border-blue-200/80',
          divider: 'border-blue-100/90',
          progressBox: 'bg-white/85 border border-blue-100/90 shadow-2xs',
          progressBar: 'bg-gradient-to-r from-[#3B66F5] to-indigo-600',
          progressText: 'text-[#3B66F5]',
          quoteBubble: 'bg-blue-50/70 border border-blue-200/70 text-slate-800',
          stageBadge: 'bg-blue-100/80 text-[#3B66F5] border-blue-200/80',
          levelBadge: 'bg-indigo-100/80 text-indigo-700 border-indigo-200/80',
        };
    }
  };

  // --------------------------------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-[#3B66F5] animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Menghubungkan ke Verse...</p>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // FIRST TIME ONBOARDING FLOW: NO VERSE ADOPTED YET
  // --------------------------------------------------------------------------
  if (!verse) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* STEP 1: MYSTERIOUS CHEST */}
          {onboardingStep === 'chest' && (
            <motion.div
              key="step_chest"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center py-10"
            >
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
                Peti Misterius Verse Ditemukan!
              </h1>
              <p className="text-slate-500 text-sm max-w-md mb-8">
                Di dalam peti ini bersemayam 5 telur makhluk fiksi "Verse". Ketuk peti untuk membukanya dan memilih pendamping belajarmu.
              </p>

              {/* Chest Card with Floating & Pulse Glow */}
              <div 
                onClick={() => setOnboardingStep('select_egg')}
                className="group relative cursor-pointer flex flex-col items-center mb-8"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-amber-400/20 via-[#3B66F5]/10 to-transparent blur-2xl rounded-full group-hover:scale-110 transition-transform duration-500" />
                
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative z-10 p-6 rounded-3xl bg-white/70 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-200/50 group-hover:border-amber-300 group-hover:shadow-amber-100 transition-all duration-300"
                >
                  <img 
                    src={CHEST_ASSET.webp} 
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = CHEST_ASSET.png; }}
                    alt="Peti Misterius Verse" 
                    className="w-56 h-56 md:w-64 md:h-64 object-contain filter drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
                  />
                </motion.div>

                <div className="mt-6">
                  <button 
                    onClick={() => setOnboardingStep('select_egg')}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-gradient-to-r from-[#3B66F5] to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span>Ketuk Peti untuk Membuka</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: SELECT 1 OF 5 EGGS */}
          {onboardingStep === 'select_egg' && (
            <motion.div
              key="step_select_egg"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="py-4"
            >
              <div className="text-center mb-8">
                <span className="text-xs font-bold text-[#3B66F5] uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  Pilih Sahabat Elemen
                </span>
                <h2 className="text-2xl font-extrabold text-slate-800 mt-2">
                  5 Telur Elemen Verse Telah Terbuka!
                </h2>
                <p className="text-slate-500 text-xs md:text-sm mt-1">
                  Pilih satu telur yang paling mencerminkan semangat belajarmu.
                </p>
              </div>

              {/* Egg Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 mb-8">
                {getAllVerseCharacters().map((char) => {
                  const isSelected = selectedSpecies === char.species;
                  return (
                    <div
                      key={char.species}
                      onClick={() => setSelectedSpecies(char.species)}
                      className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? 'border-[#3B66F5] bg-blue-50/60 shadow-md shadow-blue-500/10 scale-[1.03]' 
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Selection Checkmark */}
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#3B66F5] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      {/* Egg Image */}
                      <motion.div
                        animate={isSelected ? { y: [0, -5, 0] } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-24 h-24 mb-3 flex items-center justify-center"
                      >
                        <img 
                          src={char.eggImage} 
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = char.eggPngImage; }}
                          alt={char.species}
                          className="w-full h-full object-contain filter drop-shadow-md"
                        />
                      </motion.div>

                      <div className="text-center w-full">
                        <div className="text-xs font-bold text-slate-800 truncate">{char.species}</div>
                        <div className="flex items-center justify-center gap-1 mt-1 text-[11px] text-slate-500 font-medium">
                          {getElementIcon(char.element)}
                          <span>{char.elementName}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Character Preview & Nickname Card */}
              {selectedSpecies && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6 max-w-xl mx-auto">
                  {(() => {
                    const selChar = getVerseCharacter(selectedSpecies);
                    return (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 p-2 shrink-0 flex items-center justify-center">
                            <img 
                              src={selChar.eggImage} 
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = selChar.eggPngImage; }}
                              alt={selChar.species}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-slate-800">{selChar.species}</h3>
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${selChar.badgeBg}`}>
                                {selChar.elementName}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{selChar.philosophy}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => setOnboardingStep('chest')}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            Kembali
                          </button>
                          <button
                            onClick={handleStartEggHatching}
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B66F5] to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Tetaskan Telur</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: INTERACTIVE TAP-TAP HATCHING (DARK THEME) */}
          {onboardingStep === 'hatching' && (
            <motion.div
              key="step_hatching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#070A13] flex flex-col items-center justify-center p-4 select-none overflow-hidden text-white"
            >
              {(() => {
                const selChar = getVerseCharacter(selectedSpecies);
                return (
                  <div className="relative flex flex-col items-center text-center max-w-md w-full">
                    {/* Ambient Element Glow */}
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-96 sm:h-96 rounded-full blur-[100px] pointer-events-none transition-all duration-300"
                      style={{ 
                        backgroundColor: selChar.elementColor || '#3B66F5',
                        opacity: 0.25 + (tapCount * 0.08)
                      }}
                    />

                    {/* Top Guide */}
                    <div className="relative z-10 mb-6 sm:mb-8 space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/10 text-white border border-white/20 uppercase tracking-widest backdrop-blur-md">
                        {getElementIcon(selChar.element)}
                        {selChar.species} • Elemen {selChar.elementName}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Ketuk Telur untuk Menetaskannya!
                      </h2>
                      <p className="text-slate-400 text-xs sm:text-sm max-w-xs mx-auto">
                        {tapCount === 0 && 'Ketuk telur berulang kali untuk membangunkannya!'}
                        {tapCount > 0 && tapCount <= 3 && 'Telur mulai bergetar pelan... Terus ketuk!'}
                        {tapCount > 3 && tapCount <= 7 && 'Retakan cangkang mulai terlihat jelas!'}
                        {tapCount > 7 && tapCount < TOTAL_HATCH_TAPS && 'Pancaran aura elemen semakin menyilaukan!'}
                        {tapCount >= TOTAL_HATCH_TAPS && 'Cangkang terbelah sempurna!'}
                      </p>
                    </div>

                    {/* Interactive Tappable Egg with Sparkles */}
                    <div className="relative z-10 my-4 flex items-center justify-center cursor-pointer select-none" onClick={handleTapEgg}>
                      {/* Floating Sparkles Array */}
                      {sparkles.map((sp) => (
                        <motion.div
                          key={sp.id}
                          initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                          animate={{ opacity: 0, scale: 1.6, x: sp.x, y: sp.y }}
                          transition={{ duration: 0.55, ease: 'easeOut' }}
                          className="absolute pointer-events-none z-20 flex items-center justify-center"
                        >
                          <Sparkles 
                            className="drop-shadow-lg" 
                            style={{ 
                              color: sp.color, 
                              width: sp.size, 
                              height: sp.size 
                            }} 
                          />
                        </motion.div>
                      ))}

                      {/* Egg Image with Fluid Spring Wobble */}
                      <motion.div
                        animate={
                          isWobbling 
                            ? { 
                                rotate: [-10 - tapCount * 1.5, 10 + tapCount * 1.5, -6, 6, 0], 
                                scale: [1, 1.12 + tapCount * 0.012, 0.96, 1],
                                y: [-4, 4, 0]
                              } 
                            : { 
                                y: [0, -8, 0],
                                scale: [1, 1.02, 1]
                              }
                        }
                        transition={
                          isWobbling 
                            ? { duration: 0.26, ease: 'easeOut' } 
                            : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                        }
                        className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center relative active:scale-95 transition-transform"
                      >
                        <img 
                          src={selChar.eggImage} 
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = selChar.eggPngImage; }}
                          alt="Telur Verse"
                          className="w-full h-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)] pointer-events-none"
                        />
                      </motion.div>

                      {/* Egg Flash when fully cracked */}
                      {isCracking && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 2 }}
                          transition={{ duration: 0.6 }}
                          className="absolute inset-0 bg-white rounded-full blur-2xl z-30 pointer-events-none"
                        />
                      )}
                    </div>

                    {/* Tap Progress Counter (Progress Bar for 12 taps) */}
                    <div className="relative z-10 mt-6 sm:mt-8 flex flex-col items-center gap-3 w-full max-w-xs px-4">
                      <div className="w-full h-2 rounded-full bg-slate-800 border border-slate-700/80 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-sm shadow-amber-500/50 transition-all duration-200"
                          style={{ width: `${Math.min(100, Math.round((tapCount / TOTAL_HATCH_TAPS) * 100))}%` }}
                        />
                      </div>

                      <button
                        onClick={handleTapEgg}
                        className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-xs font-black text-amber-300 flex items-center gap-2 transition-all cursor-pointer shadow-md"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ketuk Telur! ({Math.min(tapCount, TOTAL_HATCH_TAPS)} / {TOTAL_HATCH_TAPS})</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* STEP 4: DRAMATIC CHARACTER REVEAL (DARK THEME) */}
          {onboardingStep === 'reveal' && (
            <motion.div
              key="step_reveal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#060810] flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-y-auto text-white"
            >
              {(() => {
                const selChar = getVerseCharacter(selectedSpecies);
                const stage1Info = getStageInfo(selectedSpecies, 1);
                return (
                  <div className="relative flex flex-col items-center text-center max-w-lg w-full py-6">
                    {/* Massive Ambient Elemental Aura */}
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[550px] md:w-[720px] h-[400px] sm:h-[550px] md:h-[720px] rounded-full blur-[140px] pointer-events-none transition-all duration-700"
                      style={{ 
                        backgroundColor: selChar.elementColor || '#3B66F5',
                        opacity: 0.45
                      }}
                    />

                    {/* Celebration Badge */}
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="relative z-10 mb-2"
                    >
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-white/10 text-white border border-white/20 uppercase tracking-widest backdrop-blur-md shadow-lg">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        Sahabat Baru Telah Menetas!
                      </span>
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                      initial={{ y: -15, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.15 }}
                      className="relative z-10 text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight"
                    >
                      Selamat Datang, {selChar.species}!
                    </motion.h2>
                    <motion.p
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="relative z-10 text-slate-300 text-xs sm:text-sm mt-1 max-w-sm"
                    >
                      {selChar.philosophy}
                    </motion.p>

                    {/* HERO-SCALE MASCOT IN THE CENTER (CRISP RESOLUTION) */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 14, stiffness: 90, delay: 0.25 }}
                      className="relative z-10 my-3 sm:my-5 w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-center justify-center"
                    >
                      <img 
                        src={stage1Info.image} 
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = stage1Info.pngImage; }}
                        alt={stage1Info.name}
                        className="w-full h-full object-contain filter drop-shadow-[0_25px_60px_rgba(0,0,0,0.85)] select-none"
                      />
                    </motion.div>

                    {/* Nickname & Action Card */}
                    <motion.div
                      initial={{ y: 25, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl text-left space-y-3 shadow-2xl"
                    >
                      <div>
                        <label className="block text-xs font-bold text-slate-200 mb-1">
                          Beri Nama Panggilan Verse-mu:
                        </label>
                        <input
                          type="text"
                          maxLength={24}
                          value={nicknameInput}
                          onChange={(e) => setNicknameInput(e.target.value)}
                          placeholder={`Contoh: ${selChar.species === 'Pyrofox' ? 'Blaze' : selChar.species === 'Voltlynx' ? 'Sparky' : selChar.species}`}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/20 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3B66F5] focus:border-transparent transition-all"
                        />
                      </div>

                      <button
                        onClick={handleConfirmAdoption}
                        disabled={isSubmittingAdoption}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#3B66F5] to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingAdoption ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Mulai Petualangan Bersama {nicknameInput.trim() || selChar.species}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </motion.div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ACTIVE PET HUB: VERSE HAS BEEN ADOPTED
  // --------------------------------------------------------------------------
  const elementTheme = getElementCardTheme(verse.element);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner: Verse Identity & Mascot - Stacked Vertical Layout with Clean Fade Entrance */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`relative overflow-hidden rounded-3xl border shadow-xs p-5 sm:p-7 flex flex-col items-center text-center space-y-5 ${elementTheme.cardBg} ${elementTheme.border}`}
      >
        
        {/* 1. BAGIAN ATAS: Teks Tahap, Elemen, Level, Nama, & Sinkron Poin */}
        <div className="w-full flex flex-col items-center gap-3">
          {/* Header Row: Pet Nickname & Sinkron Poin Button */}
          <div className={`w-full flex items-center justify-between gap-2 border-b pb-3 ${elementTheme.divider}`}>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                {verse.nickname}
              </h1>
              <button
                onClick={() => {
                  setEditNameInput(verse.nickname);
                  setIsEditingName(true);
                }}
                title="Ubah Nama Panggilan"
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#3B66F5] hover:bg-white/80 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white/85 text-slate-700 text-xs font-bold hover:bg-white transition-colors cursor-pointer shrink-0 disabled:opacity-50 shadow-2xs"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#3B66F5]' : 'text-slate-500'}`} />
              <span>Sinkron Poin</span>
            </button>
          </div>

          {/* Badges: Tahap, Elemen, Level, Spesies */}
          <div className="flex items-center justify-center flex-wrap gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 text-slate-700 border border-slate-200/80 shadow-2xs">
              {getElementIcon(verse.element)}
              <span className="capitalize">{activeCharData?.elementName}</span>
              <span className="text-slate-300">•</span>
              <span>Spesies {activeCharData?.species}</span>
            </span>

            <span className={`px-3 py-1 rounded-full border shadow-2xs font-black ${elementTheme.stageBadge}`}>
              {activeStageInfo?.name} • Tahap {verse.stage}
            </span>

            <span className={`px-3 py-1 rounded-full border shadow-2xs font-black ${elementTheme.levelBadge}`}>
              Level {levelStats.currentLevel}
            </span>
          </div>
        </div>

        {/* 2. BAGIAN TENGAH: Gambar Karakter Verse (Dikecilkan Agar Super Tajam & Tidak Pecah) */}
        <div className="w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 flex items-center justify-center relative my-1 select-none">
          {activeStageInfo && (
            <img 
              src={activeStageInfo.image}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = activeStageInfo.pngImage; }}
              alt={verse.nickname}
              className="w-full h-full object-contain filter drop-shadow-md relative z-10 transition-transform duration-300 hover:scale-105"
            />
          )}
        </div>

        {/* 3. BAGIAN DI BAWAH KARAKTER: Progres Bar Level */}
        <div className={`w-full max-w-xl rounded-2xl p-4 text-left space-y-2 transition-all ${elementTheme.progressBox}`}>
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700">Progres Level {levelStats.currentLevel}</span>
            <span className={`font-extrabold ${elementTheme.progressText}`}>
              {levelStats.currentLevelProgress} / {levelStats.pointsNeededForNext} XP ({levelStats.progressPercent}%)
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-200/80 overflow-hidden relative">
            <div 
              style={{ width: `${levelStats.progressPercent}%` }}
              className={`h-full rounded-full transition-all duration-500 ${elementTheme.progressBar}`}
            />
          </div>
        </div>

        {/* 4. BAWAHNYA LAGI: Teks Motivasi */}
        {quote && (
          <div className={`w-full max-w-xl p-3 sm:p-3.5 rounded-2xl text-xs font-medium leading-relaxed text-center sm:text-left transition-all ${elementTheme.quoteBubble}`}>
            💬 "{quote}"
          </div>
        )}
      </motion.div>

      {/* Point Activity History (Bersih tanpa aturan poin) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#3B66F5]" />
            <h3 className="text-base font-bold text-slate-800">Riwayat Perolehan Poin</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {pointsHistory.length} aktivitas
          </span>
        </div>

        {pointsHistory.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs font-medium">
            Belum ada riwayat perolehan poin. Selesaikan ujian atau tugas untuk mulai mengumpulkan EXP!
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {pointsHistory.slice(0, 25).map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#3B66F5] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 leading-tight">{item.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(item.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                  item.type === 'positive' 
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60' 
                    : 'text-rose-700 bg-rose-50 border border-rose-200/60'
                }`}>
                  {item.points >= 0 ? `+${item.points}` : item.points} Poin
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Nickname Modal */}
      <AnimatePresence>
        {isEditingName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm"
            >
              <h3 className="text-base font-bold text-slate-800 mb-1">Ubah Nama Verse</h3>
              <p className="text-xs text-slate-500 mb-4">Beri nama panggilan baru untuk sahabat belajarmu.</p>

              <input
                type="text"
                maxLength={24}
                value={editNameInput}
                onChange={(e) => setEditNameInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3B66F5]/20 focus:border-[#3B66F5] mb-4"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsEditingName(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveNickname}
                  className="px-4 py-2 rounded-xl bg-[#3B66F5] hover:bg-blue-600 text-white text-xs font-bold shadow-sm"
                >
                  Simpan Nama
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Full-Screen Spectacular Evolution Celebration (Menutupi Seluruh Layar Seperti Menetas Telur) */}
      <AnimatePresence>
        {evolutionCelebration && (() => {
          const evoChar = getVerseCharacter(evolutionCelebration.species);
          const stageInfo = getStageInfo(evolutionCelebration.species, evolutionCelebration.newStage);
          return (
            <motion.div
              key="evolution_fullscreen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#060810] flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-hidden text-white"
            >
              {/* Massive Ambient Elemental Aura */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] sm:w-[600px] md:w-[750px] h-[450px] sm:h-[600px] md:h-[750px] rounded-full blur-[140px] pointer-events-none transition-all duration-700"
                style={{ 
                  backgroundColor: evoChar.elementColor || '#F59E0B',
                  opacity: evolutionPhase === 'transforming' ? 0.35 : 0.55
                }}
              />

              <AnimatePresence mode="wait">
                {evolutionPhase === 'transforming' ? (
                  <motion.div 
                    key="transforming"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.25 }}
                    className="relative flex flex-col items-center text-center max-w-md w-full py-8 space-y-6 z-10"
                  >
                    {/* Elemental Badge */}
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-white/10 text-white border border-white/20 uppercase tracking-widest backdrop-blur-md shadow-lg">
                      {getElementIcon(evoChar.element, "w-3.5 h-3.5")}
                      <span>{evoChar.species} • Elemen {evoChar.elementName}</span>
                    </span>

                    <div className="space-y-2">
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg">
                        Sensasi Misterius Terjadi...
                      </h2>
                      <p className="text-amber-300 text-xs sm:text-sm font-bold animate-pulse">
                        Sahabat Verse {evolutionCelebration.nickname} sedang ber-evolusi!
                      </p>
                    </div>

                    {/* Center Elemental Portal Orb */}
                    <div className="relative my-8 flex items-center justify-center">
                      <motion.div 
                        animate={{ scale: [1, 1.3, 1], opacity: [0.35, 0.75, 0.35] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute w-48 h-48 rounded-full blur-2xl pointer-events-none"
                        style={{ backgroundColor: evoChar.elementColor || '#F59E0B' }}
                      />
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                        className="w-36 h-36 rounded-full border-2 border-dashed border-amber-400/60 absolute pointer-events-none"
                      />
                      <div className="w-28 h-28 rounded-full bg-white/10 border-2 border-amber-400/80 shadow-2xl shadow-amber-400/40 flex items-center justify-center backdrop-blur-md relative z-10">
                        {getElementIcon(evoChar.element, "w-14 h-14 animate-pulse")}
                      </div>
                    </div>

                    <p className="text-slate-400 text-xs tracking-widest uppercase font-bold animate-pulse">
                      Mempersiapkan Wujud Baru...
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="revealed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative flex flex-col items-center text-center max-w-lg w-full py-4 z-10 max-h-screen overflow-y-auto"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {/* Celebration Badge */}
                    <div className="relative z-10 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-white/10 text-white border border-white/20 uppercase tracking-widest backdrop-blur-md shadow-lg">
                        {getElementIcon(evoChar.element, "w-3.5 h-3.5")}
                        <span>Evolusi Spektakuler!</span>
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="relative z-10 text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg">
                      Wujud Baru Terbuka!
                    </h2>
                    <p className="relative z-10 text-slate-300 text-xs sm:text-sm mt-1 max-w-sm">
                      <strong className="text-amber-300">{evolutionCelebration.nickname}</strong> telah berevolusi dari Tahap {evolutionCelebration.oldStage} ke Tahap {evolutionCelebration.newStage}!
                    </p>

                    {/* Hero Mascot Showcase with Seamless White-Golden Burst & Zoom */}
                    <div className="relative my-3 sm:my-5 w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center">
                      {/* Outer Golden-White Ambient Flare */}
                      <motion.div
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: [0.3, 1.4, 1.15], opacity: [0, 0.95, 0.5] }}
                        transition={{ duration: 1.0, ease: "easeOut" }}
                        className="absolute inset-0 m-auto w-64 h-64 rounded-full bg-gradient-to-r from-amber-200 via-white to-yellow-300 blur-3xl pointer-events-none z-0"
                      />

                      {/* Intense White-Golden Core Flash (Luminous Radial Glow) */}
                      <motion.div
                        initial={{ scale: 0.2, opacity: 0 }}
                        animate={{ scale: [0.2, 1.5, 1.25], opacity: [0, 1, 0.35] }}
                        transition={{ duration: 0.85, ease: "easeOut" }}
                        style={{
                          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(254,240,138,0.9) 40%, rgba(251,191,36,0) 70%)'
                        }}
                        className="absolute inset-0 m-auto w-56 h-56 rounded-full blur-2xl pointer-events-none z-0"
                      />

                      {/* Evolved Character Mascot with Pure Center Spring Zoom - Clean, Straight & Glitch-Free */}
                      <motion.div
                        initial={{ scale: 0.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 110, 
                          damping: 14, 
                          mass: 0.8
                        }}
                        style={{ willChange: 'transform, opacity' }}
                        className="w-full h-full relative flex items-center justify-center z-10 pointer-events-none"
                      >
                        <img 
                          src={stageInfo.image}
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = stageInfo.pngImage; }}
                          alt={evolutionCelebration.nickname}
                          className="w-full h-full object-contain filter drop-shadow-[0_25px_60px_rgba(0,0,0,0.85)] relative z-10 select-none pointer-events-none"
                        />
                      </motion.div>
                    </div>

                    {/* Stage description & stats card */}
                    <motion.div
                      initial={{ y: 15, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.35, delay: 0.08 }}
                      className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl text-left space-y-4 shadow-2xl"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-amber-300">
                          {stageInfo.name}
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          Level {evolutionCelebration.newLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium leading-relaxed">
                        {stageInfo.description}
                      </p>

                      <button
                        onClick={() => setEvolutionCelebration(null)}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Luar Biasa!
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Level Up Celebration Modal */}
      <AnimatePresence>
        {levelUpCelebration && !evolutionCelebration && (() => {
          const lvlChar = getVerseCharacter(levelUpCelebration.species);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-sm w-full text-center p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
              >
                {/* Element icon badge with spring zoom animation (no generic sparkle) */}
                <motion.div 
                  initial={{ scale: 0.5, rotate: -12 }}
                  animate={{ scale: [0.5, 1.15, 1], rotate: [-12, 6, 0] }}
                  transition={{ type: "spring", stiffness: 220, damping: 12 }}
                  className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-center shadow-md mb-4 relative"
                >
                  <div 
                    className="absolute inset-0 rounded-2xl blur-xs opacity-25 pointer-events-none"
                    style={{ backgroundColor: lvlChar.elementColor || '#3B66F5' }}
                  />
                  <div className="relative z-10 flex items-center justify-center">
                    {getElementIcon(lvlChar.element, "w-8 h-8")}
                  </div>
                </motion.div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#3B66F5] text-xs font-black uppercase tracking-wider mb-2">
                  {getElementIcon(lvlChar.element, "w-3 h-3")}
                  <span>Level Up!</span>
                </span>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Level {levelUpCelebration.newLevel} Dicapai!
                </h3>

                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                  Hebat! Sahabat Verse <strong className="text-slate-800">{levelUpCelebration.nickname}</strong> bertambah kuat dari perolehan EXP belajarmu!
                </p>

                <div className="my-5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-3">
                  <span className="text-sm font-bold text-slate-400 line-through">
                    Level {levelUpCelebration.oldLevel}
                  </span>
                  <span className="text-xs font-bold text-slate-400">➔</span>
                  <span className="text-lg font-black text-[#3B66F5]">
                    Level {levelUpCelebration.newLevel}
                  </span>
                </div>

                <button
                  onClick={() => setLevelUpCelebration(null)}
                  className="w-full py-3 rounded-xl bg-[#3B66F5] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  Keren, Lanjutkan!
                </button>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
