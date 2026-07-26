import React, { useRef } from 'react';
import { Settings, Users, Hash, Type, Upload, Scale, Shuffle, Layers, GitMerge, UserCheck } from 'lucide-react';
import { GroupConfig, GroupingMode, NamingType, DistributionStrategy } from '../../types/tools';
import { parseTextFile, parseExcelFile } from '../../utils/tools/fileParsers';

interface ConfigSectionProps {
  config: GroupConfig;
  setConfig: React.Dispatch<React.SetStateAction<GroupConfig>>;
  totalStudents: number;
  colorTheme?: 'blue' | 'rose' | 'emerald' | 'orange' | 'purple';
}

const ConfigSection: React.FC<ConfigSectionProps> = ({ config, setConfig, totalStudents }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const themeClasses = {
    headerBg: 'bg-slate-50/80 border-b border-slate-200/60',
    iconText: 'text-indigo-950',
    ring: 'focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950',
    activeTab: 'bg-[#3B66F5] text-white shadow-md shadow-[#3B66F5]/20',
    link: 'text-indigo-650 hover:text-indigo-800'
  };

  const handleModeChange = (mode: GroupingMode) => {
    setConfig({ ...config, mode });
  };

  const handleStrategyChange = (strategy: DistributionStrategy) => {
    setConfig({ ...config, strategy });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setConfig({ ...config, value: isNaN(val) ? 0 : val });
  };

  const handleCustomNamesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const names = val.split(/\r?\n/); 
    setConfig({ ...config, customNames: names });
  };

  const handleUploadNames = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let names: string[] = [];
      if (file.name.endsWith('.txt')) {
        const parsed = await parseTextFile(file);
        names = parsed.map(p => p.name);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
        const parsed = await parseExcelFile(file);
        names = parsed.map(p => p.name);
      }
      
      if (names.length > 0) {
        setConfig({ ...config, customNames: names });
      } else {
        alert("File kosong atau format tidak sesuai.");
      }
    } catch (error) {
      console.error(error);
      alert("Gagal membaca file nama kelompok.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getEstimation = () => {
    if (totalStudents === 0 || config.value <= 0) return null;
    if (config.mode === GroupingMode.BY_COUNT) {
      const size = Math.floor(totalStudents / config.value);
      const remainder = totalStudents % config.value;
      return `${config.value} Kelompok (±${size}${remainder > 0 ? '-' + (size + 1) : ''} orang/kelompok)`;
    } else {
      const count = Math.ceil(totalStudents / config.value);
      return `±${count} Kelompok (${config.value} orang/kelompok)`;
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden h-full transition-all duration-300 hover:shadow-md border border-slate-200/80">
      {/* HEADER BERWARNA */}
      <div className={`p-5 flex items-center justify-between border-b ${themeClasses.headerBg}`}>
        <h2 className={`text-lg font-bold flex items-center gap-2 font-display ${themeClasses.iconText}`}>
          <div className="p-1.5 bg-slate-100 rounded-lg shadow-inner">
             <Settings className="w-5 h-5 text-indigo-950" />
          </div>
          2. Pengaturan Kelompok
        </h2>
      </div>

      <div className="p-6 space-y-8">
        
        {/* 1. Mode & Value */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Hash className="w-3 h-3" /> Metode Pembagian
          </label>
          <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
             <button
               onClick={() => handleModeChange(GroupingMode.BY_COUNT)}
               className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 cursor-pointer ${config.mode === GroupingMode.BY_COUNT ? `${themeClasses.activeTab}` : 'text-slate-500 hover:text-slate-700'}`}
             >
               Jumlah Kelompok
             </button>
             <button
               onClick={() => handleModeChange(GroupingMode.BY_SIZE)}
               className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-300 cursor-pointer ${config.mode === GroupingMode.BY_SIZE ? `${themeClasses.activeTab}` : 'text-slate-500 hover:text-slate-700'}`}
             >
               Siswa per Kelompok
             </button>
          </div>

          <div className="relative group">
             <input
               type="number"
               min="1"
               value={config.value === 0 ? '' : config.value}
               onChange={handleValueChange}
               placeholder={config.mode === GroupingMode.BY_COUNT ? "Mau berapa kelompok?" : "Mau berapa siswa per kelompok?"}
               className={`w-full p-4 pl-12 border border-slate-200 rounded-2xl bg-white text-slate-900 transition-all outline-none font-bold text-lg ${themeClasses.ring}`}
             />
             <div className="absolute left-4 top-4.5 text-slate-400 group-hover:text-indigo-950 transition-colors">
               {config.mode === GroupingMode.BY_COUNT ? <Layers className="w-6 h-6" /> : <Users className="w-6 h-6" />}
             </div>
             {getEstimation() && (
               <p className={`text-xs mt-2 font-bold flex items-center gap-1 animate-in fade-in ml-1 text-indigo-950`}>
                 <Scale className="w-3 h-3 text-indigo-950" /> Estimasi: {getEstimation()}
               </p>
             )}
          </div>
        </div>

        {/* 2. Strategy */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <GitMerge className="w-3 h-3" /> Strategi Distribusi
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <button
               onClick={() => handleStrategyChange(DistributionStrategy.RANDOM)}
               className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${config.strategy === DistributionStrategy.RANDOM ? 'border-indigo-950 bg-indigo-50/50 ring-1 ring-indigo-950' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
             >
               <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                 <div className="p-1.5 rounded-lg bg-slate-100 text-indigo-950"><Shuffle className="w-4 h-4 text-indigo-950" /></div>
                 Acak Total
               </div>
               <p className="text-[10px] text-slate-500 mt-2 pl-[38px]">Murni acak tanpa aturan khusus.</p>
             </button>

             <button
               onClick={() => handleStrategyChange(DistributionStrategy.GENDER_BALANCE)}
               className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${config.strategy === DistributionStrategy.GENDER_BALANCE ? 'border-indigo-950 bg-indigo-50/50 ring-1 ring-indigo-950' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
             >
               <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                 <div className="p-1.5 rounded-lg bg-slate-100 text-indigo-950"><Scale className="w-4 h-4 text-indigo-950" /></div>
                 Seimbang Gender
               </div>
               <p className="text-[10px] text-slate-500 mt-2 pl-[38px]">Laki-laki & Perempuan dibagi rata.</p>
             </button>

             <button
               onClick={() => handleStrategyChange(DistributionStrategy.ABILITY_HETEROGENEOUS)}
               className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${config.strategy === DistributionStrategy.ABILITY_HETEROGENEOUS ? 'border-indigo-950 bg-indigo-50/50 ring-1 ring-indigo-950' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
             >
               <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                 <div className="p-1.5 rounded-lg bg-slate-100 text-indigo-950"><UserCheck className="w-4 h-4 text-indigo-950" /></div>
                 Heterogen (Skill)
               </div>
               <p className="text-[10px] text-slate-500 mt-2 pl-[38px]">Campur Mahir & Dasar dalam 1 tim.</p>
             </button>

             <button
               onClick={() => handleStrategyChange(DistributionStrategy.GENDER_AND_ABILITY_HETEROGENEOUS)}
               className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${config.strategy === DistributionStrategy.GENDER_AND_ABILITY_HETEROGENEOUS ? 'border-indigo-950 bg-indigo-50/50 ring-1 ring-indigo-950' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
             >
               <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                 <div className="p-1.5 rounded-lg bg-slate-100 text-indigo-950"><Layers className="w-4 h-4 text-indigo-950" /></div>
                 Super Mix
               </div>
               <p className="text-[10px] text-slate-500 mt-2 pl-[38px]">Keseimbangan gender & skill sekaligus.</p>
             </button>
          </div>
        </div>

        {/* 3. Naming */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Type className="w-3 h-3" /> Penamaan Kelompok
          </label>
          
          <div className="flex gap-6 mb-4 font-semibold text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${config.namingType === 'auto' ? 'border-indigo-950' : 'border-slate-300'}`}>
                {config.namingType === 'auto' && <div className="w-2.5 h-2.5 bg-indigo-950 rounded-full" />}
              </div>
              <input 
                type="radio" 
                checked={config.namingType === 'auto'}
                onChange={() => setConfig({...config, namingType: 'auto'})}
                className="hidden"
              />
              <span className="text-sm group-hover:text-indigo-950 transition-colors">Otomatis (Pola)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
               <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${config.namingType === 'custom' ? 'border-indigo-950' : 'border-slate-300'}`}>
                {config.namingType === 'custom' && <div className="w-2.5 h-2.5 bg-indigo-950 rounded-full" />}
              </div>
              <input 
                type="radio" 
                checked={config.namingType === 'custom'}
                onChange={() => setConfig({...config, namingType: 'custom'})}
                className="hidden"
              />
              <span className="text-sm group-hover:text-indigo-950 transition-colors">Kustom (Manual)</span>
            </label>
          </div>

          {config.namingType === 'auto' ? (
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
               <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">Pola Nama</label>
               <input 
                 type="text"
                 value={config.namingPattern}
                 onChange={(e) => setConfig({...config, namingPattern: e.target.value})}
                 placeholder="Contoh: Kelompok, Tim, Squad (Default: Kelompok)"
                 className="w-full p-3 text-sm border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-950/15 focus:border-indigo-950 outline-none"
               />
               <p className="text-[10px] text-slate-400 mt-2">Output: "Kelompok 1", "Kelompok 2", dst.</p>
             </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                 <span className="text-xs text-slate-500 font-medium">Masukkan 1 nama per baris</span>
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   className={`text-xs flex items-center gap-1 hover:underline font-bold ${themeClasses.link}`}
                 >
                   <Upload className="w-3 h-3 text-indigo-950" /> Upload .txt/.xlsx
                 </button>
                 <input 
                   type="file"
                   ref={fileInputRef}
                   onChange={handleUploadNames}
                   className="hidden"
                   accept=".txt,.csv,.xlsx"
                 />
              </div>
              <textarea
                value={config.customNames.join('\n')}
                onChange={handleCustomNamesChange}
                placeholder={`Harimau\nSinga\nElang\nHiu...`}
                className={`w-full h-32 p-3 text-sm border border-slate-300 rounded-xl bg-white text-slate-900 font-mono transition-all outline-none ${themeClasses.ring}`}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ConfigSection;
