import React, { useState, useCallback } from 'react';
import { Student, GroupConfig, GroupingMode, GroupResult, DistributionStrategy } from '../../types/tools';
import InputSection from './InputSection';
import ConfigSection from './ConfigSection';
import ResultsSection from './ResultsSection';
import { generateGroups } from '../../utils/tools/randomizer';
import { Shuffle, RotateCcw, X } from 'lucide-react';

const PROFICIENCY_CYCLE: { value: number; label: string; color: string }[] = [
  { value: 4, label: 'Mahir', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 3, label: 'Cakap', color: 'bg-[#3B66F5]/10 text-blue-700 border-[#3B66F5]/30' },
  { value: 2, label: 'Dasar', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 1, label: 'Perlu Intervensi', color: 'bg-rose-100 text-rose-700 border-rose-200' },
];

interface AttributeOverride {
  gender?: 'M' | 'F';
  proficiency?: number;
}

interface GroupGeneratorProps {
  themeColor?: 'blue' | 'rose' | 'emerald' | 'orange' | 'purple';
}

const GroupGenerator: React.FC<GroupGeneratorProps> = ({ themeColor = 'blue' }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [attrOverrides, setAttrOverrides] = useState<Map<string, AttributeOverride>>(new Map());
  
  const [config, setConfig] = useState<GroupConfig>({
    mode: GroupingMode.BY_COUNT,
    value: 4,
    strategy: DistributionStrategy.RANDOM,
    namingPattern: '',
    namingType: 'auto',
    customNames: [],
  });
  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);

  const activeStudents = students.filter(s => !removedIds.has(s.id));

  const enrichedStudents = activeStudents.map(s => {
    const ov = attrOverrides.get(s.id);
    return {
      ...s,
      gender: ov?.gender ?? s.gender,
      proficiency: ov?.proficiency ?? s.proficiency,
      proficiencyLabel: ov?.proficiency
        ? PROFICIENCY_CYCLE.find(p => p.value === ov.proficiency)?.label
        : s.proficiencyLabel,
    };
  });

  const handleStudentsLoaded = (newStudents: Student[]) => {
    setStudents(newStudents);
    setRemovedIds(new Set());
    setAttrOverrides(new Map());
    setIsGenerated(false);
  };

  const handleReset = () => {
    setStudents([]);
    setRemovedIds(new Set());
    setAttrOverrides(new Map());
    setGroups([]);
    setIsGenerated(false);
  };

  const handleRemoveStudent = (id: string) => {
    const newRemoved = new Set(removedIds);
    newRemoved.add(id);
    setRemovedIds(newRemoved);
    setIsGenerated(false);
  };

  const handleGenderCycle = useCallback((studentId: string) => {
    setAttrOverrides(prev => {
      const next = new Map(prev);
      const current: AttributeOverride = next.get(studentId) || {};
      const currentGender = current.gender;
      let nextGender: 'M' | 'F' | undefined;
      if (currentGender === undefined) nextGender = 'M';
      else if (currentGender === 'M') nextGender = 'F';
      else nextGender = undefined;
      next.set(studentId, { gender: nextGender, proficiency: current.proficiency });
      return next;
    });
  }, []);

  const handleProficiencyCycle = useCallback((studentId: string) => {
    setAttrOverrides(prev => {
      const next = new Map(prev);
      const current: AttributeOverride = next.get(studentId) || {};
      const currentProf = current.proficiency;
      const currentIndex = currentProf ? PROFICIENCY_CYCLE.findIndex(p => p.value === currentProf) : -1;
      const nextIndex = currentIndex + 1;
      const nextProf = nextIndex < PROFICIENCY_CYCLE.length ? PROFICIENCY_CYCLE[nextIndex].value : undefined;
      next.set(studentId, { gender: current.gender, proficiency: nextProf });
      return next;
    });
  }, []);

  const getGenderDisplay = (s: Student) => {
    const ov = attrOverrides.get(s.id);
    const gender = ov?.gender ?? s.gender;
    return gender;
  };

  const getProficiencyDisplay = (s: Student) => {
    const ov = attrOverrides.get(s.id);
    const prof = ov?.proficiency ?? s.proficiency;
    return prof;
  };

  const handleGenerate = () => {
    if (enrichedStudents.length < 2) {
      alert("Mohon masukkan minimal 2 data siswa terlebih dahulu.");
      return;
    }

    let targetVal = config.value;
    if (!targetVal || targetVal <= 0) {
      targetVal = Math.min(4, Math.max(1, Math.floor(enrichedStudents.length / 2)));
      setConfig(prev => ({ ...prev, value: targetVal }));
    }

    const newGroups = generateGroups(
      enrichedStudents, 
      config.mode, 
      targetVal, 
      config.strategy, 
      config.namingPattern, 
      config.customNames, 
      config.namingType
    );
    setGroups(newGroups);
    setIsGenerated(true);
  };

  const buttonGradient = 'from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] shadow-[#3B66F5]/20';

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <InputSection 
          onStudentsLoaded={handleStudentsLoaded} 
          currentCount={activeStudents.length}
          title="1. Input Data Siswa"
          colorTheme={themeColor}
        >
            {activeStudents.length > 0 && (
              <div className="space-y-3">
                 <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <h3 className="font-bold text-sm text-[#1D4ED8]">
                      Nama Tersedia ({activeStudents.length})
                    </h3>
                    <button 
                      onClick={handleReset} 
                      className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-red-600" /> Reset Data
                    </button>
                 </div>
                 
                 <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                    {activeStudents.map((s, i) => {
                      const gender = getGenderDisplay(s);
                      const prof = getProficiencyDisplay(s);
                      const profInfo = prof ? PROFICIENCY_CYCLE.find(p => p.value === prof) : null;
                      return (
                        <div key={s.id} className="text-sm px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg flex justify-between items-center group hover:bg-slate-100 transition-colors">
                          <span className="flex items-center gap-2 truncate text-slate-700">
                            <span className="text-slate-400 font-mono text-xs w-5 text-right">{i + 1}.</span>
                            <span className="truncate font-medium">{s.name}</span>
                            <button
                              type="button"
                              onClick={() => handleGenderCycle(s.id)}
                              className={`text-[9px] px-1.5 rounded-full font-bold border cursor-pointer transition-all hover:scale-105 ${
                                gender === 'M' ? 'bg-[#3B66F5]/10 text-blue-700 border-[#3B66F5]/30' :
                                gender === 'F' ? 'bg-pink-100 text-pink-700 border-pink-200' :
                                'bg-slate-100 text-slate-400 border-slate-200 border-dashed'
                              }`}
                              title="Klik untuk ganti gender"
                            >
                              {gender === 'M' ? 'L' : gender === 'F' ? 'P' : 'L/P'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProficiencyCycle(s.id)}
                              className={`text-[9px] px-1.5 rounded-full font-bold border cursor-pointer transition-all hover:scale-105 ${
                                profInfo ? profInfo.color : 'bg-slate-100 text-slate-400 border-slate-200 border-dashed'
                              }`}
                              title="Klik untuk ganti kemampuan"
                            >
                              {profInfo ? profInfo.label : 'Kemampuan'}
                            </button>
                          </span>
                          <button 
                            onClick={() => handleRemoveStudent(s.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-slate-200 cursor-pointer"
                            title="Hapus nama ini"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                 </div>
              </div>
            )}
        </InputSection>

        <div className="flex flex-col gap-6">
          <ConfigSection 
            config={config} 
            setConfig={setConfig} 
            totalStudents={enrichedStudents.length} 
            colorTheme={themeColor}
          />

          <button
            onClick={handleGenerate}
            disabled={enrichedStudents.length < 2}
            className={`w-full py-4 rounded-full font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 cursor-pointer ${
              enrichedStudents.length >= 2
                ? `bg-gradient-to-r ${buttonGradient} text-white hover:shadow-xl hover:translate-y-[-2px]`
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Shuffle className="w-6 h-6 text-white" />
            Acak dan Bagi Kelompok
          </button>
        </div>
      </div>

      {isGenerated && (
         <div className="mt-12 pt-8 border-t border-slate-250">
           <ResultsSection groups={groups} />
         </div>
      )}
    </div>
  );
};

export default GroupGenerator;
