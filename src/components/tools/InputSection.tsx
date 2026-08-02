import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, UserPlus, CheckCircle, Download, Users, ToggleLeft, ToggleRight, BookOpen, ChevronDown } from 'lucide-react';
import { parseTextFile, parseExcelFile, processRawNames, generateStudentListTemplate, ParsedStudent } from '../../utils/tools/fileParsers';
import { Student } from '../../types/tools';
import { getFullState } from '../../services/dbAttendance';
import { ClassEntity } from '../../types';

interface InputSectionProps {
  onStudentsLoaded: (students: Student[]) => void;
  currentCount: number;
  title?: string;
  children?: React.ReactNode;
  colorTheme?: 'blue' | 'rose' | 'emerald' | 'orange' | 'purple';
  showClassSelector?: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onStudentsLoaded, currentCount, title, children, showClassSelector = true }) => {
  const [activeTab, setActiveTab] = useState<'class' | 'manual' | 'file'>(showClassSelector ? 'class' : 'manual');
  
  const [manualText, setManualText] = useState('');
  const [isGenderMode, setIsGenderMode] = useState(false);
  const [maleText, setMaleText] = useState('');
  const [femaleText, setFemaleText] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [classList, setClassList] = useState<ClassEntity[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [checkedStudentIds, setCheckedStudentIds] = useState<Set<string>>(new Set());
  const [isLoadingClass, setIsLoadingClass] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themeClasses = {
    headerBg: 'bg-slate-50/80 border-b border-slate-200/60',
    iconText: 'text-[#1D4ED8]',
    badge: 'bg-[#3B66F5]/10 text-[#1D4ED8] border border-[#3B66F5]/20/50',
    tabActive: 'bg-[#3B66F5] text-white shadow-md shadow-[#3B66F5]/20',
    button: 'from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] hover:opacity-95 shadow-md shadow-[#3B66F5]/20',
    ring: 'focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5]',
    border: 'border-slate-200/80'
  };

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const state = await getFullState();
        setClassList(state.classes || []);
      } catch (err) {
        console.error('Gagal memuat daftar kelas:', err);
      }
    };
    if (showClassSelector) {
      loadClasses();
    }
  }, [showClassSelector]);

  useEffect(() => {
    if (!selectedClassId) {
      setClassStudents([]);
      setCheckedStudentIds(new Set());
      return;
    }
    const loadStudents = async () => {
      setIsLoadingClass(true);
      try {
        const state = await getFullState();
        const filtered = (state.students || []).filter(s => {
          const sClassId = s.classId || s.class_id;
          return sClassId === selectedClassId;
        });
        const mapped: Student[] = filtered.map(s => ({
          id: s.id || Math.random().toString(36).substr(2, 9),
          name: s.name || s.nama || '',
          classId: s.classId || s.class_id,
        })).filter(s => s.name);
        setClassStudents(mapped);
        setCheckedStudentIds(new Set(mapped.map(s => s.id)));
        if (mapped.length > 0) {
          onStudentsLoaded(mapped);
        }
      } catch (err) {
        console.error('Gagal memuat siswa kelas:', err);
      } finally {
        setIsLoadingClass(false);
      }
    };
    loadStudents();
  }, [selectedClassId, onStudentsLoaded]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleAll = useCallback(() => {
    if (checkedStudentIds.size === classStudents.length) {
      setCheckedStudentIds(new Set());
    } else {
      setCheckedStudentIds(new Set(classStudents.map(s => s.id)));
    }
  }, [classStudents, checkedStudentIds.size]);

  const handleToggleStudent = useCallback((id: string) => {
    setCheckedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleLoadFromClass = () => {
    const selected = classStudents.filter(s => checkedStudentIds.has(s.id));
    if (selected.length > 0) {
      onStudentsLoaded(selected);
    }
  };

  const selectedClassName = classList.find(c => c.id === selectedClassId)?.name || '';

  const handleManualSubmit = () => {
    let students: Student[] = [];

    if (isGenderMode) {
      const males = maleText.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0).map(name => ({
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        gender: 'M' as const
      }));

      const females = femaleText.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0).map(name => ({
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        gender: 'F' as const
      }));

      students = [...males, ...females];
      setMaleText('');
      setFemaleText('');
    } else {
      if (!manualText.trim()) return;
      const names = manualText.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0);
      students = processRawNames(names);
      setManualText(''); 
    }

    if (students.length > 0) {
      onStudentsLoaded(students);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      let parsedData: ParsedStudent[] = [];
      if (file.name.endsWith('.txt')) {
        parsedData = await parseTextFile(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
        parsedData = await parseExcelFile(file);
      } else {
        alert('Format file tidak didukung.');
        setIsLoading(false);
        return;
      }

      if (parsedData.length === 0) {
        alert('Tidak ada nama yang ditemukan.');
      } else {
        const students = processRawNames(parsedData);
        onStudentsLoaded(students);
      }
    } catch (error) {
      console.error(error);
      alert('Gagal membaca file.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const tabs = showClassSelector
    ? ([{ key: 'class' as const, label: 'Pilih dari Kelas' }, { key: 'manual' as const, label: 'Manual' }, { key: 'file' as const, label: 'Upload Excel' }])
    : ([{ key: 'manual' as const, label: 'Manual' }, { key: 'file' as const, label: 'Upload Excel' }]);

  return (
    <div className="bg-white rounded-2xl h-full transition-all duration-300 hover:shadow-md border border-slate-200/80">
      <div className={`p-5 flex items-center justify-between border-b ${themeClasses.headerBg}`}>
        <h2 className={`text-lg font-bold flex items-center gap-2 font-display ${themeClasses.iconText}`}>
          <div className="p-1.5 bg-slate-100 rounded-lg shadow-inner">
             <UserPlus className="w-5 h-5 text-[#1D4ED8]" />
          </div>
          {title || "1. Input Data Siswa"}
        </h2>
        {currentCount > 0 && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm ${themeClasses.badge}`}>
            <CheckCircle className="w-3.5 h-3.5 text-[#1D4ED8]" />
            {currentCount} Data
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
               className={`flex-1 py-2 px-3 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
                activeTab === tab.key
                  ? `${themeClasses.tabActive}`
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'class' && showClassSelector && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1D4ED8] uppercase flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Pilih Kelas
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                  className={`w-full flex items-center justify-between p-3 border border-slate-200 rounded-full bg-white text-sm text-left transition-all cursor-pointer ${themeClasses.ring} ${selectedClassId ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}
                >
                  <span className="truncate">{selectedClassName || '— Pilih kelas —'}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isClassDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {classList.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center">Tidak ada kelas ditemukan</div>
                    ) : (
                      classList.map(cls => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            setSelectedClassId(cls.id);
                            setIsClassDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                            selectedClassId === cls.id
                              ? 'bg-[#3B66F5]/10 text-[#1D4ED8] font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block">{cls.name}</span>
                          {cls.subject && <span className="block text-xs text-slate-400 mt-0.5">{cls.subject}</span>}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedClassId && (
              <div className="space-y-3">
                {isLoadingClass ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B66F5]"></div>
                  </div>
                ) : classStudents.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400">Tidak ada siswa di kelas ini</div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={checkedStudentIds.size === classStudents.length && classStudents.length > 0}
                          onChange={handleToggleAll}
                          className="w-4 h-4 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#3B66F5]/20 cursor-pointer accent-indigo-950"
                        />
                        <span className="text-xs font-bold text-slate-600">Pilih Semua</span>
                      </label>
                      <span className="text-xs text-slate-400 font-semibold">
                        {checkedStudentIds.size}/{classStudents.length} dipilih
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                      {classStudents.map(student => (
                        <label
                          key={student.id}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checkedStudentIds.has(student.id)}
                            onChange={() => handleToggleStudent(student.id)}
                            className="w-4 h-4 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#3B66F5]/20 cursor-pointer accent-indigo-950"
                          />
                          <span className="text-sm text-slate-700">{student.name}</span>
                        </label>
                      ))}
                    </div>

                    <button
                      onClick={handleLoadFromClass}
                      disabled={checkedStudentIds.size === 0}
                      className={`w-full py-3 bg-gradient-to-r text-white rounded-full font-bold shadow-md transition-all active:scale-[0.98] disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer ${themeClasses.button}`}
                    >
                      Muat Siswa Terpilih ({checkedStudentIds.size})
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="space-y-4">
            <div 
              className="flex items-center gap-3 cursor-pointer select-none mb-2"
              onClick={() => setIsGenderMode(!isGenderMode)}
            >
               {isGenderMode ? (
                 <ToggleRight className={`w-6 h-6 text-[#1D4ED8]`} /> 
               ) : (
                 <ToggleLeft className="w-6 h-6 text-slate-400" />
               )}
               <span className={`text-sm font-semibold ${isGenderMode ? `text-[#1D4ED8] font-bold` : 'text-slate-600'}`}>
                 Mode Bagi Rata Gender (L/P)
               </span>
            </div>

            {isGenderMode ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-[#3B66F5] uppercase flex items-center gap-1">
                     <Users className="w-3 h-3" /> Laki-laki
                   </label>
                   <textarea
                    value={maleText}
                    onChange={(e) => setMaleText(e.target.value)}
                    placeholder={`Budi\nJoko\n...`}
                    className={`w-full h-48 p-3 border border-slate-200 rounded-xl resize-none font-mono text-sm bg-white text-slate-800 transition-all outline-none ${themeClasses.ring}`}
                  />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-pink-600 uppercase flex items-center gap-1">
                     <Users className="w-3 h-3" /> Perempuan
                   </label>
                   <textarea
                    value={femaleText}
                    onChange={(e) => setFemaleText(e.target.value)}
                    placeholder={`Siti\nAni\n...`}
                    className={`w-full h-48 p-3 border border-slate-200 rounded-xl resize-none font-mono text-sm bg-white text-slate-800 transition-all outline-none ${themeClasses.ring}`}
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={`Andi\nBudi\nCitra\nDedi...`}
                  className={`w-full h-48 p-4 border border-slate-200 rounded-xl resize-none font-mono text-sm bg-white text-slate-800 transition-all outline-none ${themeClasses.ring}`}
                />
                <div className="absolute top-2 right-2 text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                  1 nama/baris
                </div>
              </div>
            )}

            <button
              onClick={handleManualSubmit}
              disabled={isGenderMode ? (!maleText.trim() && !femaleText.trim()) : !manualText.trim()}
              className={`w-full py-3 bg-gradient-to-r text-white rounded-full font-bold shadow-md transition-all active:scale-[0.98] disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer ${themeClasses.button}`}
            >
              Muat Data Manual
            </button>
          </div>
        )}

        {activeTab === 'file' && (
          <div className="space-y-4">
            <div className={`border rounded-xl p-4 flex items-center justify-between border-slate-200 bg-slate-50/50`}>
               <div className="text-xs text-slate-600">
                  <span className="font-bold block mb-0.5 text-sm text-[#1D4ED8]">Butuh format data?</span>
                  Unduh template Excel (Nama, Gender, & Kemampuan).
               </div>
               <button 
                 onClick={generateStudentListTemplate}
                  className={`flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2 rounded-full text-xs font-bold transition-all shadow-sm hover:bg-slate-50 text-[#1D4ED8] cursor-pointer`}
               >
                 <Download className="w-3 h-3 text-[#1D4ED8]" /> Template
               </button>
            </div>

            <div 
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 bg-slate-50/50 hover:bg-slate-50 hover:border-[#3B66F5] transition-all cursor-pointer group border-slate-300 text-[#1D4ED8]`} 
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                className="hidden"
              />
              {isLoading ? (
                <div className={`animate-spin rounded-full h-10 w-10 border-b-2 border-[#3B66F5]`}></div>
              ) : (
                <>
                  <div className={`w-16 h-16 bg-white border border-slate-200 shadow-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform text-[#1D4ED8]`}>
                    <Upload className="w-8 h-8 text-[#1D4ED8]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1D4ED8]">Klik untuk upload berkas</h3>
                  <p className="text-xs text-slate-500 mt-1">.xlsx, .csv (Support kolom L/P & Kemampuan)</p>
                </>
              )}
            </div>
          </div>
        )}

        {children && (
           <div className="mt-8 pt-6 border-t border-slate-200/60 animate-in fade-in">
             {children}
           </div>
        )}
      </div>
    </div>
  );
};

export default InputSection;
