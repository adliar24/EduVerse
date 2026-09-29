import React from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { 
  LkpdBlock, 
  LkpdResponseType, 
  LkpdMediaKind, 
  OBSERVATION_PRESETS,
  convertPresetToBlocks,
  createEmptyFormBlocks
} from '../utils/lkpdPresets';

interface LkpdFormBuilderProps {
  blocks: LkpdBlock[];
  onChange: (blocks: LkpdBlock[]) => void;
  presetKey: string;
  onSelectPreset: (presetKey: string) => void;
}

export default function LkpdFormBuilder({
  blocks,
  onChange,
  presetKey,
  onSelectPreset
}: LkpdFormBuilderProps) {

  // Tambah blok pertanyaan baru
  const handleAddQuestion = () => {
    const newBlock: LkpdBlock = {
      id: `blk_q_${Date.now()}`,
      order: blocks.length + 1,
      type: 'question',
      title: '',
      description: '',
      responseType: 'text',
      required: true,
      placeholder: 'Tuliskan jawaban kamu di sini...'
    };
    onChange([...blocks, newBlock]);
  };

  // Tambah blok petunjuk baru
  const handleAddInstruction = () => {
    const newBlock: LkpdBlock = {
      id: `blk_inst_${Date.now()}`,
      order: blocks.length + 1,
      type: 'instruction',
      title: 'Petunjuk Kegiatan',
      description: ''
    };
    onChange([...blocks, newBlock]);
  };

  // Pindah urutan blok
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(index, 1);
    newBlocks.splice(targetIndex, 0, moved);

    const updated = newBlocks.map((b, idx) => ({ ...b, order: idx + 1 }));
    onChange(updated);
  };

  // Hapus blok
  const handleRemoveBlock = (index: number) => {
    if (blocks.length <= 1) {
      alert('LKPD minimal harus memiliki 1 butir.');
      return;
    }
    const newBlocks = blocks.filter((_, idx) => idx !== index);
    const updated = newBlocks.map((b, idx) => ({ ...b, order: idx + 1 }));
    onChange(updated);
  };

  // Update nilai blok
  const handleUpdateBlock = (index: number, updates: Partial<LkpdBlock>) => {
    const updated = blocks.map((b, idx) => {
      if (idx === index) {
        return { ...b, ...updates };
      }
      return b;
    });
    onChange(updated);
  };

  // Helper mapping responseType & mediaKind ke value select
  const getFormatValue = (block: LkpdBlock): string => {
    if (block.responseType === 'link') return 'link';
    if (block.responseType === 'media') {
      return `media_${block.mediaKind || 'image'}`;
    }
    return 'text';
  };

  const handleFormatChange = (index: number, val: string) => {
    if (val === 'link') {
      handleUpdateBlock(index, { 
        responseType: 'link', 
        mediaKind: undefined, 
        placeholder: 'https://drive.google.com/...' 
      });
    } else if (val.startsWith('media_')) {
      const mediaKind = val.replace('media_', '') as LkpdMediaKind;
      handleUpdateBlock(index, { 
        responseType: 'media', 
        mediaKind, 
        placeholder: undefined 
      });
    } else {
      handleUpdateBlock(index, { 
        responseType: 'text', 
        mediaKind: undefined, 
        placeholder: 'Tuliskan jawaban kamu di sini...' 
      });
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Bar Preset Template: Ringkas & Tidak Memenuhi Layar */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">
            Draf Cepat:
          </span>
          <select
            value={presetKey}
            onChange={(e) => {
              const val = e.target.value;
              onSelectPreset(val);
              if (val === 'empty') {
                onChange(createEmptyFormBlocks());
              } else {
                onChange(convertPresetToBlocks(val));
              }
            }}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
          >
            {Object.values(OBSERVATION_PRESETS).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            <option value="empty">Mulai Form Kosong (Kustom)</option>
          </select>
        </div>

        <span className="text-[11px] text-slate-500 font-medium">
          {blocks.length} butir tersusun
        </span>
      </div>

      {/* Daftar Butir LKPD */}
      <div className="space-y-3">
        {blocks.map((block, index) => {
          const isInstruction = block.type === 'instruction';
          const formatValue = getFormatValue(block);

          return (
            <div 
              key={block.id || `blk_${index}`}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                isInstruction
                  ? 'bg-amber-50/40 border-amber-200/90'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Header Kartu Butir: Nomor, Tipe Toggle, & Tombol Kontrol */}
              <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>

                  {/* Toggle Tipe: Pertanyaan vs Petunjuk Saja */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateBlock(index, { 
                        type: 'question', 
                        responseType: block.responseType || 'text' 
                      })}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        !isInstruction 
                          ? 'bg-white text-blue-700 shadow-2xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Pertanyaan
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateBlock(index, { 
                        type: 'instruction',
                        responseType: undefined,
                        mediaKind: undefined
                      })}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        isInstruction 
                          ? 'bg-amber-500 text-white shadow-2xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Petunjuk Saja
                    </button>
                  </div>
                </div>

                {/* Kontrol Aksi: Naik, Turun, Hapus */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveBlock(index, 'up')}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                    title="Geser ke atas"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === blocks.length - 1}
                    onClick={() => handleMoveBlock(index, 'down')}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 cursor-pointer"
                    title="Geser ke bawah"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveBlock(index)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Hapus butir ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Isi Butir */}
              <div className="space-y-2.5">
                {isInstruction ? (
                  /* Blok Petunjuk */
                  <>
                    <input
                      type="text"
                      value={block.title}
                      onChange={(e) => handleUpdateBlock(index, { title: e.target.value })}
                      placeholder="Judul petunjuk (contoh: Petunjuk Pengamatan)"
                      className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-amber-500 transition-colors"
                    />
                    <textarea
                      rows={2}
                      value={block.description || ''}
                      onChange={(e) => handleUpdateBlock(index, { description: e.target.value })}
                      placeholder="Tuliskan petunjuk atau arahan langkah kerja untuk murid..."
                      className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-colors resize-none leading-relaxed"
                    />
                  </>
                ) : (
                  /* Blok Pertanyaan */
                  <>
                    <input
                      type="text"
                      value={block.title}
                      onChange={(e) => handleUpdateBlock(index, { title: e.target.value })}
                      placeholder="Tuliskan pertanyaan / poin yang harus dijawab siswa..."
                      className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-colors"
                    />

                    {/* Baris Format Respon & Switch Wajib Diisi */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                          Format Jawaban:
                        </span>
                        <select
                          value={formatValue}
                          onChange={(e) => handleFormatChange(index, e.target.value)}
                          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 cursor-pointer"
                        >
                          <option value="text">Teks / Esai</option>
                          <option value="link">Tautan / Link Web (Drive / Canva)</option>
                          <option value="media_image">Foto / Kamera HP</option>
                          <option value="media_audio">Rekaman Suara (Audio)</option>
                          <option value="media_video">Video Praktikum</option>
                          <option value="media_document">Dokumen PDF</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={block.required !== false}
                          onChange={(e) => handleUpdateBlock(index, { required: e.target.checked })}
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span>Wajib Dijawab</span>
                      </label>
                    </div>

                    {/* Catatan Bantuan Tambahan (Opsional) */}
                    <input
                      type="text"
                      value={block.description || ''}
                      onChange={(e) => handleUpdateBlock(index, { description: e.target.value })}
                      placeholder="Petunjuk tambahan opsional untuk murid (misal: 'Amati bagian warna')..."
                      className="w-full px-3 py-1.5 bg-slate-50/70 rounded-lg border border-slate-200 text-[11px] text-slate-700 outline-none focus:bg-white focus:border-blue-400 transition-colors"
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tombol Tambah Butir: Bersih & Nyaman di Mobile */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleAddQuestion}
          className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Soal</span>
        </button>

        <button
          type="button"
          onClick={handleAddInstruction}
          className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 active:scale-[0.99] text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-slate-500" />
          <span>Tambah Petunjuk</span>
        </button>
      </div>
    </div>
  );
}
