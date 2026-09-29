import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, Lock, CheckCircle2 } from 'lucide-react';
import { 
  StudentVerse, 
  VERSE_SPECIES_CONFIG, 
  VerseEvolutionStage,
  calculateLevelFromPoints
} from '../../utils/verseEngine';

interface VerseEvolutionModalProps {
  verse: StudentVerse;
  isOpen: boolean;
  onClose: () => void;
  celebrationStage?: VerseEvolutionStage | null;
}

export default function VerseEvolutionModal({
  verse,
  isOpen,
  onClose,
  celebrationStage
}: VerseEvolutionModalProps) {
  if (!isOpen) return null;

  const cfg = VERSE_SPECIES_CONFIG[verse.species] || VERSE_SPECIES_CONFIG.Pyrofox;
  const progress = calculateLevelFromPoints(verse.lifetimePoints);
  const currentStage = celebrationStage || progress.stage;
  const activeStageInfo = cfg.stages[currentStage];
  const stages: VerseEvolutionStage[] = [1, 2, 3, 4];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-auto text-center"
      >
        {/* Glow Header */}
        <div 
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ backgroundColor: cfg.elementColor }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors z-20 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7 space-y-5 relative z-10">
          {/* Header */}
          <div className="space-y-1">
            {celebrationStage ? (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 inline-flex items-center gap-1 mb-1 animate-bounce">
                <Sparkles className="w-3 h-3" /> Verse Berevolusi!
              </span>
            ) : (
              <span 
                className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white inline-block mb-1 shadow-xs"
                style={{ backgroundColor: cfg.elementColor }}
              >
                Pohon Evolusi • {cfg.elementLabel}
              </span>
            )}

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {verse.nickname}
            </h2>
            <p className="text-xs text-slate-500">
              Level {progress.level} • {progress.title}
            </p>
          </div>

          {/* Model Karakter Utama (Wujud Terpilih) */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/90 border border-slate-200 relative overflow-hidden">
            <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto relative flex items-center justify-center">
              <img
                src={activeStageInfo.image}
                alt={activeStageInfo.name}
                className="w-full h-full object-contain drop-shadow-lg select-none"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.endsWith('.webp')) target.src = target.src.replace('.webp', '.png');
                }}
              />
            </div>

            <div className="mt-2 space-y-0.5">
              <h3 className="text-base font-black text-slate-900">
                {activeStageInfo.name}
              </h3>
              <p className="text-xs font-semibold text-slate-600">
                {activeStageInfo.title}
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto pt-1 leading-relaxed">
                {activeStageInfo.description}
              </p>
            </div>
          </div>

          {/* Grid 4 Tahapan Evolusi */}
          <div className="space-y-1.5 text-left">
            <label className="text-[11px] font-bold text-slate-700 block">
              Tahapan Evolusi Spesies:
            </label>

            <div className="grid grid-cols-4 gap-2">
              {stages.map((stg) => {
                const sInfo = cfg.stages[stg];
                const isUnlocked = progress.level >= sInfo.minLevel;
                const isCurrent = progress.stage === stg;

                return (
                  <div
                    key={stg}
                    className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all ${
                      isCurrent
                        ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                        : isUnlocked
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="w-10 h-10 flex items-center justify-center relative p-0.5">
                      <img
                        src={sInfo.image}
                        alt={sInfo.name}
                        className={`w-full h-full object-contain ${!isUnlocked ? 'filter grayscale blur-[0.5px]' : ''}`}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src.endsWith('.webp')) target.src = target.src.replace('.webp', '.png');
                        }}
                      />
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 rounded-lg">
                          <Lock className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] font-bold text-slate-800 mt-1 truncate max-w-full">
                      {sInfo.name}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      Lv. {sInfo.minLevel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tombol Tutup / Lanjutkan */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer"
          >
            {celebrationStage ? 'Lanjutkan Belajar & Raih Poin!' : 'Tutup'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
