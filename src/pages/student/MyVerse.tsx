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
  Edit2
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

  // Onboarding States: 'chest' | 'select_egg' | 'hatching'
  const [onboardingStep, setOnboardingStep] = useState<'chest' | 'select_egg' | 'hatching'>('chest');
  const [selectedSpecies, setSelectedSpecies] = useState<VerseSpecies>('Pyrofox');
  const [nicknameInput, setNicknameInput] = useState('');
  const [isSubmittingAdoption, setIsSubmittingAdoption] = useState(false);

  // Rename modal
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');

  // Daily quote
  const [quote, setQuote] = useState('');

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

      setPointsHistory(pointsData.items);
      setTotalLifetimePoints(pointsData.totalPoints);

      if (existingVerse) {
        // Sync level & stage based on lifetime points
        const { verse: syncedVerse } = await syncVerseWithPoints(existingVerse, pointsData.totalPoints);
        setVerse(syncedVerse);
        setQuote(getRandomMotivationQuote(syncedVerse.species, syncedVerse.nickname));
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

  // Handle adopting & hatching verse
  const handleHatchVerse = async () => {
    if (!student || !selectedSpecies) return;
    const finalNickname = nicknameInput.trim() || selectedSpecies;

    setIsSubmittingAdoption(true);
    setOnboardingStep('hatching');

    // Slight suspense for hatching animation (1.2s)
    setTimeout(async () => {
      try {
        const char = getVerseCharacter(selectedSpecies);
        const { currentLevel, currentStage } = calculateLevelAndProgress(totalLifetimePoints);

        const newVerse: StudentVerse = {
          id: crypto.randomUUID ? crypto.randomUUID() : `verse_${Date.now()}`,
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
        console.error('[MyVerse] Error hatching verse:', err);
      } finally {
        setIsSubmittingAdoption(false);
      }
    }, 1400);
  };

  // Handle updating nickname
  const handleSaveNickname = async () => {
    if (!verse || !editNameInput.trim()) return;
    const updated = { ...verse, nickname: editNameInput.trim() };
    const saved = await saveStudentVerse(updated);
    setVerse(saved);
    setIsEditingName(false);
  };

  const getElementIcon = (element: string) => {
    switch (element) {
      case 'api': return <Flame className="w-3.5 h-3.5 text-red-500" />;
      case 'air': return <Droplets className="w-3.5 h-3.5 text-cyan-500" />;
      case 'bumi': return <Mountain className="w-3.5 h-3.5 text-emerald-500" />;
      case 'angin': return <Wind className="w-3.5 h-3.5 text-sky-500" />;
      case 'petir': return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-[#3B66F5]" />;
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
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold mb-4 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Pusat Sahabat Belajar EduVerse
              </div>

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
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#3B66F5] to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Ketuk Peti untuk Membuka
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

                        <div className="pt-2 border-t border-slate-100">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Beri Nama Panggilan Verse-mu:
                          </label>
                          <input
                            type="text"
                            maxLength={24}
                            value={nicknameInput}
                            onChange={(e) => setNicknameInput(e.target.value)}
                            placeholder={`Contoh: ${selChar.species === 'Pyrofox' ? 'Blaze' : selChar.species === 'Voltlynx' ? 'Sparky' : selChar.species}`}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3B66F5]/20 focus:border-[#3B66F5]"
                          />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => setOnboardingStep('chest')}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            Kembali
                          </button>
                          <button
                            onClick={handleHatchVerse}
                            disabled={isSubmittingAdoption}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-[#3B66F5] hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            Tetaskan Verse Sekarang
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: HATCHING ANIMATION */}
          {onboardingStep === 'hatching' && (
            <motion.div
              key="step_hatching"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <motion.div
                animate={{ rotate: [-6, 6, -6], scale: [1, 1.08, 1] }}
                transition={{ duration: 0.35, repeat: Infinity }}
                className="w-40 h-40 mb-6 flex items-center justify-center"
              >
                {(() => {
                  const selChar = getVerseCharacter(selectedSpecies);
                  return (
                    <img 
                      src={selChar.eggImage} 
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = selChar.eggPngImage; }}
                      alt="Hatching Egg"
                      className="w-full h-full object-contain filter drop-shadow-xl"
                    />
                  );
                })()}
              </motion.div>
              <h2 className="text-xl font-extrabold text-slate-800">Telur Sedang Menetas...</h2>
              <p className="text-slate-500 text-xs mt-1">Sahabat barumu segera menyapamu!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // ACTIVE PET HUB: VERSE HAS BEEN ADOPTED
  // --------------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner: Verse Identity & Live Mascot */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-8">
        {/* Subtle decorative background gradient matching element */}
        <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl ${activeCharData?.accentBg} rounded-full blur-3xl -z-0 pointer-events-none`} />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          {/* Pet Avatar - Hero Sized, Crisp, Seamless */}
          <div className="relative shrink-0 flex flex-col items-center w-full md:w-[460px] lg:w-[520px]">
            <div className="w-80 h-80 sm:w-96 sm:h-96 md:w-[460px] md:h-[460px] lg:w-[500px] lg:h-[500px] xl:w-[520px] xl:h-[520px] flex items-center justify-center relative">
              {/* Vibrant radial aura behind the transparent character */}
              <div 
                className="absolute inset-0 rounded-full blur-3xl opacity-35 pointer-events-none"
                style={{ backgroundColor: activeCharData?.elementColor || '#3B66F5' }}
              />
              {activeStageInfo && (
                <img 
                  src={activeStageInfo.image}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = activeStageInfo.pngImage; }}
                  alt={verse.nickname}
                  className="w-full h-full object-contain filter drop-shadow-2xl relative z-10 transition-transform duration-300 hover:scale-105 select-none"
                />
              )}
            </div>

            <span className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-slate-100/90 text-slate-800 border border-slate-200/90 shadow-2xs">
              {getElementIcon(verse.element)}
              {activeStageInfo?.name} • Tahap {verse.stage}
            </span>
          </div>

          {/* Verse Info & Progress Bar */}
          <div className="flex-1 w-full text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
                    {verse.nickname}
                  </h1>
                  <button
                    onClick={() => {
                      setEditNameInput(verse.nickname);
                      setIsEditingName(true);
                    }}
                    title="Ubah Nama Panggilan"
                    className="p-1 rounded-lg text-slate-400 hover:text-[#3B66F5] hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-semibold text-slate-500 mt-1">
                  <span>{activeCharData?.species}</span>
                  <span>•</span>
                  <span>Elemen {activeCharData?.elementName}</span>
                  <span>•</span>
                  <span className="text-[#3B66F5] font-bold">Level {levelStats.currentLevel}</span>
                </div>
              </div>

              {/* Refresh button */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => loadData(true)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  Sinkron Poin
                </button>
              </div>
            </div>

            {/* Motivation Quote Bubble */}
            {quote && (
              <div className="inline-block p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-slate-700 text-xs font-medium text-left">
                💬 "{quote}"
              </div>
            )}

            {/* EXP Progress Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700">Progres Level {levelStats.currentLevel}</span>
                <span className="text-[#3B66F5]">
                  {levelStats.currentLevelProgress} / {levelStats.pointsNeededForNext} XP ({levelStats.progressPercent}%)
                </span>
              </div>

              {/* Bar */}
              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${levelStats.progressPercent}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#3B66F5] to-indigo-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
