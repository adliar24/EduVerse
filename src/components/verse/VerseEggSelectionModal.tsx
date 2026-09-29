import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, ChevronRight } from 'lucide-react';
import { 
  VerseSpecies, 
  VERSE_SPECIES_CONFIG, 
  StudentVerse
} from '../../utils/verseEngine';
import { createStudentVerse } from '../../services/verseService';

interface VerseEggSelectionModalProps {
  studentId: string;
  studentName: string;
  schoolId?: string | null;
  onEggHatched: (newVerse: StudentVerse) => void;
}

export default function VerseEggSelectionModal({
  studentId,
  studentName,
  schoolId,
  onEggHatched
}: VerseEggSelectionModalProps) {
  const [selectedSpecies, setSelectedSpecies] = useState<VerseSpecies>('Pyrofox');
  const [nickname, setNickname] = useState('');
  const [isHatching, setIsHatching] = useState(false);

  const activeConfig = VERSE_SPECIES_CONFIG[selectedSpecies];
  const speciesList: VerseSpecies[] = ['Pyrofox', 'Aquaxolt', 'Pangorock', 'Cirrofinch', 'Voltlynx'];

  const handleConfirmHatch = async () => {
    setIsHatching(true);

    const finalNickname = nickname.trim() || activeConfig.stages[1].name;

    // Beri sedikit jeda efek penetasan
    setTimeout(async () => {
      const newVerse = await createStudentVerse({
        studentId,
        schoolId,
        species: selectedSpecies,
        nickname: finalNickname
      });
      setIsHatching(false);
      onEggHatched(newVerse);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-auto"
      >
        {/* Glow Header */}
        <div 
          className="absolute -top-12 -left-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: activeConfig.elementColor }}
        />

        <div className="p-5 sm:p-7 space-y-5 relative z-10">
          {/* Judul & Penjelasan */}
          <div className="text-center space-y-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100 inline-block mb-1">
              Pendamping Belajar EduVerse
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pilih Telur Verse-mu
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Halo {studentName.split(' ')[0]}! Pilih salah satu telur elemen untuk menemanimu belajar dan bertumbuh di EduVerse.
            </p>
          </div>

          {/* Grid 5 Telur Elemen */}
          <div className="grid grid-cols-5 gap-2 pt-1">
            {speciesList.map((spKey) => {
              const sp = VERSE_SPECIES_CONFIG[spKey];
              const isSelected = selectedSpecies === spKey;

              return (
                <button
                  key={spKey}
                  type="button"
                  onClick={() => {
                    setSelectedSpecies(spKey);
                    if (!nickname) {
                      setNickname('');
                    }
                  }}
                  className={`flex flex-col items-center p-2 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-slate-50 border-2 shadow-sm scale-105'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 opacity-80 hover:opacity-100'
                  }`}
                  style={{ borderColor: isSelected ? sp.elementColor : undefined }}
                >
                  <div className="w-12 h-14 sm:w-14 sm:h-16 flex items-center justify-center p-1">
                    <img
                      src={sp.eggImage}
                      alt={sp.eggTitle}
                      className="w-full h-full object-contain drop-shadow-sm select-none"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src.endsWith('.webp')) target.src = target.src.replace('.webp', '.png');
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 mt-1 truncate max-w-full">
                    {sp.elementLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detail Telur Terpilih */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                <img
                  src={activeConfig.eggImage}
                  alt={activeConfig.eggTitle}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.endsWith('.webp')) target.src = target.src.replace('.webp', '.png');
                  }}
                />
              </div>

              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {activeConfig.eggTitle}
                  </h4>
                  <span 
                    className="px-2 py-0.5 rounded-full text-[9px] font-black text-white shrink-0"
                    style={{ backgroundColor: activeConfig.elementColor }}
                  >
                    {activeConfig.trait}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {activeConfig.eggDescription} Menetas menjadi <strong>{activeConfig.stages[1].name}</strong> ({activeConfig.stages[1].title}).
                </p>
              </div>
            </div>

            {/* Input Nama Panggilan Verse */}
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Beri Nama Panggilan Verse-mu (Opsional):
              </label>
              <input
                type="text"
                maxLength={20}
                placeholder={`Contoh: ${activeConfig.stages[1].name}`}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-500 transition-colors text-slate-800"
              />
            </div>
          </div>

          {/* Tombol Tetaskan */}
          <button
            type="button"
            disabled={isHatching}
            onClick={handleConfirmHatch}
            className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer"
            style={{ 
              background: `linear-gradient(135deg, ${activeConfig.elementColor}, #3B66F5)`
            }}
          >
            {isHatching ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menetaskan Telur...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tetaskan {nickname.trim() || activeConfig.stages[1].name}!</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
