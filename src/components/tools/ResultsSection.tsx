import React from 'react';
import { GroupResult } from '../../types/tools';
import { FileText, File as FileIcon, SignalHigh, SignalMedium, SignalLow, Info } from 'lucide-react';
import { exportToDocx, exportToTxt } from '../../utils/tools/exporters';
import { motion } from 'framer-motion';

interface ResultsSectionProps {
  groups: GroupResult[];
}

const ProficiencyBadge = ({ score, label }: { score?: number, label?: string }) => {
  if (score === undefined || score === null) return null;
  
  let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
  let icon = <SignalLow className="w-3 h-3" />;
  let defaultLabel = "Umum";

  switch (score) {
    case 4: // Mahir
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      icon = <SignalHigh className="w-3 h-3 text-emerald-600" />;
      defaultLabel = "Mahir";
      break;
    case 3: // Cakap
      colorClass = "bg-blue-50 text-blue-700 border-blue-200";
      icon = <SignalMedium className="w-3 h-3 text-blue-600" />;
      defaultLabel = "Cakap";
      break;
    case 2: // Dasar / Berkembang
      colorClass = "bg-yellow-50 text-yellow-700 border-yellow-200";
      icon = <SignalLow className="w-3 h-3 text-yellow-600" />;
      defaultLabel = "Dasar";
      break;
    case 1: // Intervensi
      colorClass = "bg-rose-50 text-rose-700 border-rose-200";
      icon = <Info className="w-3 h-3 text-rose-600" />;
      defaultLabel = "Perlu Intervensi";
      break;
    default:
      defaultLabel = label || "Umum";
      break;
  }

  const displayLabel = label || defaultLabel;

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 border ${colorClass} w-fit mt-1 shadow-sm`} title={`Level: ${score}`}>
      {icon} {displayLabel}
    </span>
  );
};

const ResultsSection: React.FC<ResultsSectionProps> = ({ groups }) => {
  if (groups.length === 0) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-indigo-950">Hasil Pembagian ({groups.length} Kelompok)</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => exportToTxt(groups)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-350 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-colors text-sm font-semibold cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            Ekspor .TXT
          </button>
          <button
            onClick={() => exportToDocx(groups)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-950 hover:bg-indigo-900 text-white rounded-lg shadow-md transition-colors text-sm font-semibold cursor-pointer"
          >
            <FileIcon className="w-4 h-4 text-white" />
            Ekspor .DOCX
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group, idx) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col transition-all hover:shadow-md"
          >
            <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 px-5 py-4 border-b border-indigo-900/10">
              <h3 className="text-white font-bold text-lg leading-tight uppercase tracking-tight">{group.name}</h3>
              <p className="text-indigo-200 text-xs font-semibold mt-0.5">{group.members.length} Anggota</p>
            </div>
            <div className="p-4 flex-1">
              <ul className="space-y-3">
                {group.members.map((member, i) => (
                  <li key={member.id} className="flex items-start gap-3 text-slate-700 text-sm border-b last:border-0 border-slate-100 pb-3 last:pb-0">
                    <span className="font-mono text-slate-400 w-5 text-right flex-shrink-0 select-none pt-0.5">{i + 1}.</span>
                    <div className="flex flex-col w-full">
                       <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">{member.name}</span>
                        {member.gender === 'M' && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0 rounded">L</span>}
                        {member.gender === 'F' && <span className="text-[9px] font-bold text-pink-600 bg-pink-50 border border-pink-100 px-1.5 py-0 rounded">P</span>}
                       </div>
                       <ProficiencyBadge score={member.proficiency} label={member.proficiencyLabel} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ResultsSection;
