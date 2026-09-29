import React, { useState } from 'react';
import { Sparkles, Edit2, Check, X, Shield, ArrowUpRight } from 'lucide-react';
import { 
  StudentVerse, 
  VERSE_SPECIES_CONFIG, 
  calculateLevelFromPoints, 
  getVerseStageInfo, 
  getVerseGreeting,
  saveStudentVerseLocal
} from '../../utils/verseEngine';
import { supabase } from '../../lib/supabase';

interface VerseWidgetProps {
  verse: StudentVerse;
  studentName?: string;
  onVerseUpdated?: (updated: StudentVerse) => void;
  onOpenEvolutionTree?: () => void;
}

export default function VerseWidget({
  verse,
  studentName = 'Murid',
  onVerseUpdated,
  onOpenEvolutionTree
}: VerseWidgetProps) {
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(verse.nickname);
  const [savingNickname, setSavingNickname] = useState(false);

  const cfg = VERSE_SPECIES_CONFIG[verse.species] || VERSE_SPECIES_CONFIG.Pyrofox;
  const progress = calculateLevelFromPoints(verse.lifetimePoints);
  const stageInfo = getVerseStageInfo(verse.species, progress.stage);
  const greeting = getVerseGreeting(verse.species, studentName, progress.level);

  const handleSaveNickname = async () => {
    const clean = tempNickname.trim();
    if (!clean || clean === verse.nickname) {
      setIsEditingNickname(false);
      return;
    }

    setSavingNickname(true);
    const updated: StudentVerse = {
      ...verse,
      nickname: clean,
      updatedAt: new Date().toISOString()
    };

    saveStudentVerseLocal(updated);
    if (onVerseUpdated) onVerseUpdated(updated);

    try {
      await supabase
        .from('student_verses')
        .update({ nickname: clean, updated_at: updated.updatedAt })
        .eq('student_id', verse.studentId);
    } catch (err) {
      console.warn('Gagal simpan nama verse ke cloud:', err);
    } finally {
      setSavingNickname(false);
      setIsEditingNickname(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-sm transition-all hover:shadow-md">
      {/* Background Accent Subtle Glow */}
      <div 
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: cfg.elementColor }}
      />

      <div className="p-4 sm:p-5 flex flex-col md:flex-row items-center gap-4 sm:gap-6 relative z-10">
        {/* AVATAR KARAKTER VERSE (Animated Float) */}
        <div className="relative shrink-0">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/90 border border-slate-200 flex items-center justify-center p-2 group shadow-inner">
            {/* Soft Ambient Light Circle */}
            <div 
              className="absolute inset-2 rounded-xl opacity-25 blur-md"
              style={{ backgroundColor: cfg.elementColor }}
            />

            <img
              src={stageInfo.image}
              alt={stageInfo.name}
              className="w-full h-full object-contain relative z-10 transition-transform duration-500 ease-out group-hover:scale-110 drop-shadow-md select-none animate-subtle-float"
              onError={(e) => {
                // Fallback jika webp gagal, coba png
                const target = e.currentTarget;
                if (target.src.endsWith('.webp')) {
                  target.src = target.src.replace('.webp', '.png');
                }
              }}
            />

            {/* Stage Indicator Badge */}
            <span 
              className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-xs z-20 flex items-center gap-1 border border-white/50"
              style={{ backgroundColor: cfg.elementColor }}
            >
              Tahap {progress.stage}
            </span>
          </div>
        </div>

        {/* INFORMASI VERSE & PROGRESS EXP */}
        <div className="flex-1 w-full text-center md:text-left space-y-2.5">
          {/* Header Baris: Nama & Elemen */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2">
              {isEditingNickname ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={20}
                    value={tempNickname}
                    onChange={(e) => setTempNickname(e.target.value)}
                    className="px-2 py-1 text-sm font-bold text-slate-800 border border-blue-400 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                    placeholder="Nama Verse..."
                    autoFocus
                  />
                  <button
                    onClick={handleSaveNickname}
                    disabled={savingNickname}
                    className="p-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setTempNickname(verse.nickname);
                      setIsEditingNickname(false);
                    }}
                    className="p-1 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {verse.nickname}
                  </h3>
                  <button
                    onClick={() => setIsEditingNickname(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                    title="Ubah Nama Panggilan"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}

              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                {stageInfo.name} ({cfg.elementLabel})
              </span>
            </div>

            {/* Badge Level */}
            <div className="flex items-center justify-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#3B66F5]/10 text-[#1D4ED8] border border-[#3B66F5]/20">
                Lv. {progress.level}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Total {verse.lifetimePoints.toLocaleString()} Poin
              </span>
            </div>
          </div>

          {/* Progress Bar EXP Menuju Level Berikutnya */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-slate-600">
                Progres EXP Menuju Lv. {progress.level + 1}
              </span>
              <span className="text-slate-500 font-mono">
                {progress.currentExp} / {progress.nextLevelExp} Poin ({progress.progressPct}%)
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/80">
              <div 
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ 
                  width: `${progress.progressPct}%`,
                  backgroundColor: cfg.elementColor 
                }}
              />
            </div>

            {/* Status Target Evolusi Berikutnya */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>
                Wujud: <strong className="text-slate-600">{stageInfo.title}</strong>
              </span>
              {progress.nextStageLevel ? (
                <span className="text-blue-600 font-medium">
                  Evolusi Tahap {progress.stage + 1} di Lv. {progress.nextStageLevel} (sisa {progress.pointsToNextStage} poin)
                </span>
              ) : (
                <span className="text-amber-600 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Wujud Tertinggi (Mythic Titan)
                </span>
              )}
            </div>
          </div>

          {/* Sapaan Motivasi Verse */}
          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-600 italic line-clamp-1">
              "{greeting}"
            </p>
            {onOpenEvolutionTree && (
              <button
                type="button"
                onClick={onOpenEvolutionTree}
                className="shrink-0 text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Lihat Evolusi</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .animate-subtle-float {
          animation: subtleFloat 3.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
