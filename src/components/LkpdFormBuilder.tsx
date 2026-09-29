import React from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Info, 
  HelpCircle, 
  FileText, 
  Link2, 
  Camera, 
  Mic, 
  Video, 
  File, 
  Sparkles,
  RotateCcw,
  Check
} from 'lucide-react';
import { 
  LkpdBlock, 
  LkpdBlockType, 
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

  // Tambah blok instruksi baru
  const handleAddInstruction = () => {
    const newBlock: LkpdBlock = {
      id: `blk_inst_${Date.now()}`,
      order: blocks.length + 1,
      type: 'instruction',
      title: `Instruksi / Panduan Bagian ${blocks.length + 1}`,
      description: ''
    };
    onChange([...blocks, newBlock]);
  };

  // Tambah blok pertanyaan baru
  const handleAddQuestion = (responseType: LkpdResponseType = 'text', mediaKind: LkpdMediaKind = 'image') => {
    const newBlock: LkpdBlock = {
      id: `blk_q_${Date.now()}`,
      order: blocks.length + 1,
      type: 'question',
      title: `Poin Pertanyaan / Analisis ${blocks.length + 1}`,
      description: '',
      responseType,
      mediaKind: responseType === 'media' ? mediaKind : undefined,
      required: true,
      placeholder: responseType === 'link' 
        ? 'https://drive.google.com/...' 
        : responseType === 'text' 
        ? 'Tuliskan jawaban kamu di sini...' 
        : undefined
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

    // Re-index order
    const updated = newBlocks.map((b, idx) => ({ ...b, order: idx + 1 }));
    onChange(updated);
  };

  // Duplikat blok
  const handleDuplicateBlock = (index: number) => {
    const source = blocks[index];
    const copy: LkpdBlock = {
      ...source,
      id: `blk_copy_${Date.now()}`,
      order: index + 2,
      title: `${source.title} (Salinan)`
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, copy);
    const updated = newBlocks.map((b, idx) => ({ ...b, order: idx + 1 }));
    onChange(updated);
  };

  // Hapus blok
  const handleRemoveBlock = (index: number) => {
    if (blocks.length <= 1) {
      alert('LKPD harus memiliki minimal 1 blok atau poin.');
      return;
    }
    const newBlocks = blocks.filter((_, idx) => idx !== index);
    const updated = newBlocks.map((b, idx) => ({ ...b, order: idx + 1 }));
    onChange(updated);
  };

  // Update nilai blok spesifik
  const handleUpdateBlock = (index: number, updates: Partial<LkpdBlock>) => {
    const updated = blocks.map((b, idx) => {
      if (idx === index) {
        return { ...b, ...updates };
      }
      return b;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Template Preset Selector Bar */}
      <div className="p-3.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/70 rounded-2xl border border-blue-200/80 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">
              Pilih Draf / Template Pembelajaran:
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm('Ganti seluruh butir dengan form kosong?')) {
                onChange(createEmptyFormBlocks());
                onSelectPreset('custom_empty');
              }
            }}
            className="text-[11px] font-bold text-slate-600 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Mulai Form Kosong (Kustom Total)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {Object.values(OBSERVATION_PRESETS).map(p => {
            const isSelected = presetKey === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelectPreset(p.id);
                  onChange(convertPresetToBlocks(p.id));
                }}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-sm'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center justify-between">
                    <span className="truncate">{p.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-white" />}
                  </div>
                  <div className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {p.subject}
                  </div>
                </div>
                <div className={`text-[10px] mt-2 font-medium ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  Template {p.aspects.length + 3} Butir
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-xs font-bold text-slate-900 block">
            Susunan Nomor & Butir LKPD ({blocks.length} Bagian):
          </span>
          <span className="text-[11px] text-slate-500">
            Guru bisa membedakan nomor petunjuk saja dan nomor poin yang wajib diisi murid (teks/link/media).
          </span>
        </div>
      </div>

      {/* List Blok Form Builder */}
      <div className="space-y-3">
        {blocks.map((block, index) => {
          const isInstruction = block.type === 'instruction';

          return (
            <div 
              key={block.id || `blk_${index}`}
              className={`p-4 rounded-2xl border transition-all ${
                isInstruction
                  ? 'bg-amber-50/40 border-amber-200/90 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {/* Block Top Controls */}
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  
                  {/* Badge Tipe Blok */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateBlock(index, { 
                        type: isInstruction ? 'question' : 'instruction',
                        responseType: isInstruction ? 'text' : undefined
                      })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isInstruction
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}
                      title="Klik untuk mengubah jenis blok"
                    >
                      {isInstruction ? (
                        <>
                          <Info className="w-3.5 h-3.5 text-amber-600" />
                          <span>Instruksi / Panduan Guru</span>
                        </>
                      ) : (
                        <>
                          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                          <span>Poin Pertanyaan Murid</span>
                        </>
                      )}
                    </button>

                    {/* Jika Pertanyaan: Pilih Format Respon Siswa */}
                    {!isInstruction && (
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        {/* Teks */}
                        <button
                          type="button"
                          onClick={() => handleUpdateBlock(index, { responseType: 'text', mediaKind: undefined })}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                            block.responseType === 'text'
                              ? 'bg-white text-indigo-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Jawaban Siswa Berupa Teks"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Teks</span>
                        </button>

                        {/* Link */}
                        <button
                          type="button"
                          onClick={() => handleUpdateBlock(index, { responseType: 'link', mediaKind: undefined })}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                            block.responseType === 'link'
                              ? 'bg-white text-violet-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Jawaban Siswa Berupa Tautan URL (Google Drive, Canva, dll)"
                        >
                          <Link2 className="w-3 h-3" />
                          <span>Link URL</span>
                        </button>

                        {/* Media: Foto/Kamera */}
                        <button
                          type="button"
                          onClick={() => handleUpdateBlock(index, { responseType: 'media', mediaKind: 'image' })}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                            block.responseType === 'media' && block.mediaKind === 'image'
                              ? 'bg-white text-emerald-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Jawaban Siswa Berupa Foto Kamera / Gambar"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Foto</span>
                        </button>

                        {/* Media: Audio */}
                        <button
                          type="button"
                          onClick={() => handleUpdateBlock(index, { responseType: 'media', mediaKind: 'audio' })}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                            block.responseType === 'media' && block.mediaKind === 'audio'
                              ? 'bg-white text-rose-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Jawaban Siswa Berupa Rekaman Suara / Audio"
                        >
                          <Mic className="w-3 h-3" />
                          <span>Audio</span>
                        </button>

                        {/* Media: Video */}
                        <button
                          type="button"
                          onClick={() => handleUpdateBlock(index, { responseType: 'media', mediaKind: 'video' })}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                            block.responseType === 'media' && block.mediaKind === 'video'
                              ? 'bg-white text-amber-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Jawaban Siswa Berupa Unggahan Video"
                        >
                          <Video className="w-3 h-3" />
                          <span>Video</span>
                        </button>

                        {/* Media: Dokumen */}
                        <button
                          type="button"
                          onClick={() => handleUpdateBlock(index, { responseType: 'media', mediaKind: 'document' })}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all ${
                            block.responseType === 'media' && block.mediaKind === 'document'
                              ? 'bg-white text-cyan-700 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                          title="Jawaban Siswa Berupa Dokumen PDF"
                        >
                          <File className="w-3 h-3" />
                          <span>Dokumen</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Tools: Reorder, Duplicate, Delete */}
                <div className="flex items-center gap-1">
                  {/* Reorder Buttons */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveBlock(index, 'up')}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Pindahkan ke atas"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={index === blocks.length - 1}
                    onClick={() => handleMoveBlock(index, 'down')}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    title="Pindahkan ke bawah"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-slate-200 mx-0.5" />

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => handleDuplicateBlock(index)}
                    className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Duplikasi butir ini"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleRemoveBlock(index)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Hapus butir ini"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Block Input Content */}
              <div className="space-y-2.5">
                {/* Judul Butir / Soal */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700">
                      {isInstruction ? 'Judul Bagian Panduan:' : 'Pertanyaan / Poin Analisis Siswa:'}
                    </label>

                    {/* Toggle Wajib Diisi (Khusus Pertanyaan) */}
                    {!isInstruction && (
                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={block.required !== false}
                          onChange={(e) => handleUpdateBlock(index, { required: e.target.checked })}
                          className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span>Wajib Dijawab Siswa</span>
                      </label>
                    )}
                  </div>

                  <input
                    type="text"
                    value={block.title}
                    onChange={(e) => handleUpdateBlock(index, { title: e.target.value })}
                    placeholder={isInstruction ? 'Contoh: Langkah-langkah Pengamatan...' : 'Contoh: 1. Amati dan jelaskan unsur garis pada objek...'}
                    className="w-full px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-xs font-semibold text-slate-800 transition-colors"
                  />
                </div>

                {/* Deskripsi / Instruksi Tambahan */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    {isInstruction ? 'Isi Teks Panduan / Materi:' : 'Petunjuk Pengerjaan Tambahan (Opsional):'}
                  </label>
                  <textarea
                    rows={isInstruction ? 3 : 2}
                    value={block.description || ''}
                    onChange={(e) => handleUpdateBlock(index, { description: e.target.value })}
                    placeholder={
                      isInstruction
                        ? 'Tuliskan instruksi langkah kerja yang harus dipahami oleh murid sebelum menjawab...'
                        : 'Contoh: Perhatikan arah datang cahaya dan bayangan yang terbentuk...'
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-blue-500 outline-none text-xs text-slate-800 transition-colors resize-none leading-relaxed"
                  />
                </div>

                {/* Format Respon Preview Pill */}
                {!isInstruction && (
                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <span>Tipe Jawaban:</span>
                      <b className="text-slate-800 font-bold capitalize">
                        {block.responseType === 'link' 
                          ? 'Tautan Link URL (Google Drive, Canva, dll)' 
                          : block.responseType === 'media' 
                          ? `Unggah Media ${block.mediaKind === 'image' ? 'Foto / Gambar' : block.mediaKind === 'audio' ? 'Audio Rekaman' : block.mediaKind === 'video' ? 'Video' : 'Dokumen PDF'}` 
                          : 'Teks / Esai'}
                      </b>
                    </span>
                    <span className={block.required !== false ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                      {block.required !== false ? '• Wajib' : '• Opsional'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Block Buttons */}
      <div className="p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleAddQuestion('text')}
          className="px-3 py-2 bg-white hover:bg-slate-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>+ Tambah Soal (Teks)</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddQuestion('link')}
          className="px-3 py-2 bg-white hover:bg-slate-100 text-violet-700 font-bold text-xs rounded-xl border border-violet-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>+ Tambah Soal (Link URL)</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddQuestion('media', 'image')}
          className="px-3 py-2 bg-white hover:bg-slate-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>+ Tambah Soal (Foto/Gambar)</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddQuestion('media', 'audio')}
          className="px-3 py-2 bg-white hover:bg-slate-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>+ Tambah Soal (Audio)</span>
        </button>

        <button
          type="button"
          onClick={() => handleAddInstruction()}
          className="px-3 py-2 bg-white hover:bg-slate-100 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <Info className="w-3.5 h-3.5" />
          <span>+ Tambah Instruksi / Panduan</span>
        </button>
      </div>
    </div>
  );
}
