import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Camera, 
  ImageIcon, 
  Loader2, 
  Maximize2,
  ExternalLink,
  Trash2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Assignment, AssignmentSubmission } from '../types';
import { supabase, supabaseAnon } from '../lib/supabase';
import { compressImageFile, formatFileSize, uploadSubmissionFile, getOptimizedMediaUrl, CompressionResult } from '../utils/fileCompressor';
import { 
  getNormalizedLkpdBlocks, 
  parseLkpdResponse, 
  LkpdBlock, 
  LkpdBlockAnswer, 
  LkpdSubmissionPayload,
  ensureHttpUrl
} from '../utils/lkpdPresets';

interface LocalMediaFile {
  file: File;
  previewUrl: string;
  compression?: CompressionResult;
}

interface LkpdSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  studentInfo: any;
  existingSubmission: AssignmentSubmission | null;
  onSuccess: () => void;
}

export default function LkpdSubmissionModal({
  isOpen,
  onClose,
  assignment,
  studentInfo,
  existingSubmission,
  onSuccess
}: LkpdSubmissionModalProps) {
  // Susunan blok LKPD dinamis
  const blocks: LkpdBlock[] = useMemo(() => {
    return getNormalizedLkpdBlocks(assignment?.lkpd_config);
  }, [assignment]);

  // Answers map: key = blockId
  const [blockAnswers, setBlockAnswers] = useState<Record<string, LkpdBlockAnswer>>({});
  
  // Media local preview map: key = blockId -> LocalMediaFile
  const [localFiles, setLocalFiles] = useState<Record<string, LocalMediaFile>>({});
  const [compressingBlockId, setCompressingBlockId] = useState<string | null>(null);

  // Zoom modal image
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  // Status & Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Input refs for dynamic file inputs
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isGraded = existingSubmission?.status === 'graded' || existingSubmission?.score !== null;

  // Initialize data on modal open
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setLocalFiles({});

    if (existingSubmission) {
      const parsed = parseLkpdResponse(existingSubmission.text_response);
      const initialMap: Record<string, LkpdBlockAnswer> = {};

      if (parsed?.blockAnswers) {
        // V3 Modular format
        Object.entries(parsed.blockAnswers).forEach(([bId, ans]) => {
          initialMap[bId] = ans;
        });
      } else if (parsed) {
        // Legacy V1/V2 format: petakan ke blok yang ada
        blocks.forEach(b => {
          if (b.type === 'question') {
            if (b.responseType === 'media' && b.mediaKind === 'image' && existingSubmission.file_url) {
              initialMap[b.id] = {
                blockId: b.id,
                type: 'media',
                fileUrl: existingSubmission.file_url,
                fileName: existingSubmission.file_name || 'Foto Observasi'
              };
            } else if (b.id === 'legacy_object_name' || b.title.toLowerCase().includes('nama objek')) {
              initialMap[b.id] = {
                blockId: b.id,
                type: 'text',
                textValue: parsed.object_name || ''
              };
            } else if (b.id === 'legacy_reflection' || b.title.toLowerCase().includes('refleksi')) {
              initialMap[b.id] = {
                blockId: b.id,
                type: 'text',
                textValue: parsed.reflection || ''
              };
            } else if (parsed.answers && parsed.answers[b.id]) {
              initialMap[b.id] = {
                blockId: b.id,
                type: 'text',
                textValue: parsed.answers[b.id]
              };
            }
          }
        });
      }

      setBlockAnswers(initialMap);
      setIsEditMode(!isGraded && !existingSubmission.id);
    } else {
      setBlockAnswers({});
      setIsEditMode(true);
    }
  }, [isOpen, existingSubmission, assignment, blocks, isGraded]);

  // Handle text / link change
  const handleTextChange = (blockId: string, val: string, type: 'text' | 'link') => {
    setBlockAnswers(prev => ({
      ...prev,
      [blockId]: {
        blockId,
        type,
        textValue: val
      }
    }));
  };

  // Handle file select (image, audio, video, doc)
  const handleFileSelect = async (block: LkpdBlock, file?: File | null) => {
    if (!file) return;
    setErrorMsg(null);

    const isImage = file.type.startsWith('image/');

    if (isImage) {
      setCompressingBlockId(block.id);
      try {
        const compressed = await compressImageFile(file, 1800, 0.82);
        setLocalFiles(prev => ({
          ...prev,
          [block.id]: {
            file: compressed.file,
            previewUrl: compressed.previewUrl,
            compression: compressed
          }
        }));
        setBlockAnswers(prev => ({
          ...prev,
          [block.id]: {
            blockId: block.id,
            type: 'media',
            fileName: compressed.file.name,
            fileType: compressed.file.type,
            fileSize: compressed.file.size
          }
        }));
      } catch (err: any) {
        setErrorMsg('Gagal memproses gambar. Silakan coba pilih file lain.');
      } finally {
        setCompressingBlockId(null);
      }
    } else {
      // Non-image file (Audio, Video, Dokumen)
      const preview = URL.createObjectURL(file);
      setLocalFiles(prev => ({
        ...prev,
        [block.id]: {
          file,
          previewUrl: preview
        }
      }));
      setBlockAnswers(prev => ({
        ...prev,
        [block.id]: {
          blockId: block.id,
          type: 'media',
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        }
      }));
    }
  };

  const handleRemoveMedia = (blockId: string) => {
    setLocalFiles(prev => {
      const copy = { ...prev };
      delete copy[blockId];
      return copy;
    });
    setBlockAnswers(prev => {
      const copy = { ...prev };
      delete copy[blockId];
      return copy;
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment || !studentInfo) return;

    // Validasi butir yang wajib diisi
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.type === 'question' && b.required !== false) {
        const ans = blockAnswers[b.id];
        const local = localFiles[b.id];

        if (b.responseType === 'media') {
          if (!ans?.fileUrl && !local?.file) {
            setErrorMsg(`Butir nomor ${i + 1} (${b.title}) wajib dilampirkan berkas.`);
            return;
          }
        } else {
          if (!ans?.textValue || !ans.textValue.trim()) {
            setErrorMsg(`Butir nomor ${i + 1} (${b.title}) wajib diisi.`);
            return;
          }
        }
      }
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const finalBlockAnswers: Record<string, LkpdBlockAnswer> = { ...blockAnswers };
      let primaryFileUrl = existingSubmission?.file_url || null;
      let primaryFileName = existingSubmission?.file_name || null;
      let primaryFileType = existingSubmission?.file_type || null;
      let primaryFileSize = existingSubmission?.file_size || null;

      // Upload local files
      const uploadEntries = Object.entries(localFiles) as [string, LocalMediaFile][];
      for (const [bId, item] of uploadEntries) {
        const folder = `lkpd_${studentInfo.school_id || 'general'}/${assignment.id}/${studentInfo.id}`;
        const uploadedUrl = await uploadSubmissionFile(item.file, folder);
        
        finalBlockAnswers[bId] = {
          blockId: bId,
          type: 'media',
          fileUrl: uploadedUrl,
          fileName: item.file.name,
          fileType: item.file.type,
          fileSize: item.file.size
        };

        if (!primaryFileUrl) {
          primaryFileUrl = uploadedUrl;
          primaryFileName = item.file.name;
          primaryFileType = item.file.type;
          primaryFileSize = item.file.size;
        }
      }

      // Normalisasi link answers
      Object.keys(finalBlockAnswers).forEach(bId => {
        if (finalBlockAnswers[bId].type === 'link' && finalBlockAnswers[bId].textValue) {
          finalBlockAnswers[bId].textValue = ensureHttpUrl(finalBlockAnswers[bId].textValue);
        }
      });

      // Backward-compatible answers dictionary
      const legacyAnswers: Record<string, string> = {};
      Object.entries(finalBlockAnswers).forEach(([bId, ans]) => {
        if (ans.textValue) legacyAnswers[bId] = ans.textValue;
      });

      const payload: LkpdSubmissionPayload = {
        is_lkpd: true,
        lkpd_type: assignment.lkpd_type || 'modular',
        version: 3,
        blockAnswers: finalBlockAnswers,
        answers: legacyAnswers,
        submitted_device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      };

      const now = new Date().toISOString();
      const submissionRecord = {
        assignment_id: assignment.id,
        student_id: studentInfo.id,
        school_id: studentInfo.school_id || null,
        class_id: studentInfo.class_id || null,
        student_name: studentInfo.name || null,
        student_code: studentInfo.student_code || null,
        text_response: JSON.stringify(payload),
        file_url: primaryFileUrl,
        file_name: primaryFileName,
        file_type: primaryFileType,
        file_size: primaryFileSize,
        status: existingSubmission?.status === 'graded' ? 'graded' : 'submitted',
        submitted_at: existingSubmission?.submitted_at || now,
        updated_at: now
      };

      const client = supabaseAnon || supabase;
      const { data: upsertData, error: upsertErr } = await client
        .from('assignment_submissions')
        .upsert(submissionRecord, { onConflict: 'assignment_id,student_id' })
        .select()
        .single();

      if (upsertErr) {
        const { error: insErr } = await client
          .from('assignment_submissions')
          .insert(submissionRecord);
        if (insErr) throw insErr;
      }

      // Backup local storage
      try {
        const rawLocal = localStorage.getItem('eduverse_local_submissions');
        const localMap = rawLocal ? JSON.parse(rawLocal) : {};
        const key = `${assignment.id}_${studentInfo.id}`;
        localMap[key] = {
          ...submissionRecord,
          id: upsertData?.id || existingSubmission?.id || key
        };
        localStorage.setItem('eduverse_local_submissions', JSON.stringify(localMap));
      } catch (locErr) {
        console.warn('Local save failed:', locErr);
      }

      setSuccessMsg('Jawaban LKPD berhasil dikumpulkan!');
      setIsEditMode(false);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim tugas. Silakan periksa koneksi Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !assignment) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 8 }}
          className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 z-10"
        >
          {/* Header EduVerse: Bersih & Ringkas */}
          <div className="px-5 py-4 bg-white flex items-center justify-between shrink-0 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-block mb-1">
                LKPD Pembelajaran
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {assignment.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => { if (!submitting) onClose(); }}
              className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800 flex-1 bg-white">
            {/* Status alerts */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold">
                {successMsg}
              </div>
            )}

            {/* Banner Nilai Guru jika sudah dinilai */}
            {isGraded && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-700">Sudah Dinilai</div>
                  {existingSubmission?.feedback ? (
                    <p className="text-xs text-slate-600 italic">"{existingSubmission.feedback}"</p>
                  ) : (
                    <p className="text-xs text-slate-400">Lembar kerja telah selesai diperiksa guru.</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Nilai</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {existingSubmission?.score ?? '-'}
                  </div>
                </div>
              </div>
            )}

            {/* Petunjuk Awal Guru (Teks Singkat) */}
            {assignment.description && (
              <div className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed whitespace-pre-line">
                <span className="font-bold text-slate-900 block mb-1">Pengantar:</span>
                {assignment.description}
              </div>
            )}

            {/* Mode Terkirim / Pratinjau Jawaban */}
            {!isEditMode && existingSubmission && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md">
                    Jawaban Kamu Terkirim
                  </span>
                  {!isGraded && (
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer underline underline-offset-2"
                    >
                      Ubah Jawaban
                    </button>
                  )}
                </div>

                <div className="space-y-3.5">
                  {blocks.map((b, idx) => {
                    if (b.type === 'instruction') {
                      return (
                        <div key={b.id || idx} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 text-xs text-slate-800">
                          <span className="font-bold block text-amber-900 mb-0.5">{b.title}</span>
                          <p className="whitespace-pre-line">{b.description}</p>
                        </div>
                      );
                    }

                    const ans = blockAnswers[b.id];
                    return (
                      <div key={b.id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                        <span className="text-xs font-bold text-slate-900 block">
                          {idx + 1}. {b.title}
                        </span>

                        {b.responseType === 'link' ? (
                          ans?.textValue ? (
                            <a
                              href={ensureHttpUrl(ans.textValue)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                            >
                              <span>{ans.textValue}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Tidak ada tautan.</span>
                          )
                        ) : b.responseType === 'media' ? (
                          ans?.fileUrl ? (
                            <div className="pt-1">
                              {ans.fileType?.startsWith('image/') || ans.fileUrl.match(/\.(jpeg|jpg|png|webp|gif)/i) ? (
                                <img
                                  src={getOptimizedMediaUrl(ans.fileUrl)}
                                  alt={ans.fileName || 'Media'}
                                  onClick={() => setZoomUrl(ans.fileUrl!)}
                                  className="max-h-48 rounded-lg object-contain bg-slate-950 border border-slate-200 cursor-pointer"
                                />
                              ) : ans.fileType?.startsWith('audio/') || ans.fileUrl.match(/\.(mp3|wav|m4a|ogg)/i) ? (
                                <audio controls src={ans.fileUrl} className="w-full h-10 mt-1" />
                              ) : ans.fileType?.startsWith('video/') || ans.fileUrl.match(/\.(mp4|webm)/i) ? (
                                <video controls src={ans.fileUrl} className="max-h-56 rounded-lg w-full bg-slate-950 mt-1" />
                              ) : (
                                <a
                                  href={ans.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
                                >
                                  <span>Unduh Berkas: {ans.fileName || 'Dokumen'}</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Tidak ada berkas.</span>
                          )
                        ) : (
                          <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                            {ans?.textValue || <span className="text-slate-400 italic">Tidak diisi.</span>}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mode Form Pengerjaan (Edit / Pengumpulan) */}
            {isEditMode && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {blocks.map((block, index) => {
                  const num = index + 1;

                  // 1. Tipe Instruksi Saja
                  if (block.type === 'instruction') {
                    return (
                      <div key={block.id || index} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/90 text-xs text-slate-800 space-y-1">
                        <span className="font-bold text-amber-950 block">
                          {num}. {block.title}
                        </span>
                        {block.description && (
                          <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                            {block.description}
                          </p>
                        )}
                      </div>
                    );
                  }

                  // 2. Tipe Poin Pertanyaan
                  const ans = blockAnswers[block.id];
                  const local = localFiles[block.id];
                  const previewMedia = local?.previewUrl || (ans?.fileUrl ? getOptimizedMediaUrl(ans.fileUrl) : null);

                  return (
                    <div 
                      key={block.id || index} 
                      className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 focus-within:border-blue-500 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label className="text-xs font-bold text-slate-900 leading-snug">
                          {num}. {block.title}
                          {block.required !== false && <span className="text-rose-500 ml-1">*</span>}
                        </label>
                      </div>

                      {block.description && (
                        <p className="text-[11px] text-slate-500 whitespace-pre-line leading-relaxed">
                          {block.description}
                        </p>
                      )}

                      {/* Input Sesuai Format Respon */}
                      {block.responseType === 'link' ? (
                        /* Tipe Link */
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={ans?.textValue || ''}
                              onChange={(e) => handleTextChange(block.id, e.target.value, 'link')}
                              placeholder={block.placeholder || 'https://drive.google.com/... atau tautan Canva/dokumen'}
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-900 outline-none focus:border-blue-500 transition-colors font-medium"
                            />
                            {ans?.textValue && (
                              <a
                                href={ensureHttpUrl(ans.textValue)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 transition-colors"
                                title="Uji buka link"
                              >
                                <span>Cek</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : block.responseType === 'media' ? (
                        /* Tipe Media: Gambar / Audio / Video / Dokumen */
                        <div className="space-y-2">
                          <input
                            type="file"
                            ref={(el) => { fileInputRefs.current[block.id] = el; }}
                            accept={
                              block.mediaKind === 'image' ? 'image/*' :
                              block.mediaKind === 'audio' ? 'audio/*' :
                              block.mediaKind === 'video' ? 'video/*' :
                              block.mediaKind === 'document' ? '.pdf,.doc,.docx' : '*/*'
                            }
                            className="hidden"
                            onChange={(e) => handleFileSelect(block, e.target.files?.[0])}
                          />

                          {previewMedia ? (
                            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 relative">
                              {block.mediaKind === 'audio' || (local?.file?.type.startsWith('audio/') || ans?.fileType?.startsWith('audio/')) ? (
                                <div className="p-3 bg-slate-900 text-white flex items-center justify-between gap-2">
                                  <audio controls src={previewMedia} className="w-full h-8" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMedia(block.id)}
                                    className="p-1.5 text-rose-400 hover:text-rose-300"
                                    title="Hapus berkas"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : block.mediaKind === 'video' || (local?.file?.type.startsWith('video/') || ans?.fileType?.startsWith('video/')) ? (
                                <div>
                                  <video controls src={previewMedia} className="max-h-56 w-full object-contain bg-slate-950" />
                                  <div className="p-2 bg-slate-900 text-white text-[11px] flex items-center justify-between">
                                    <span className="truncate">{local?.file ? local.file.name : (ans?.fileName || 'Video')}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMedia(block.id)}
                                      className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                </div>
                              ) : block.mediaKind === 'document' ? (
                                <div className="p-3 bg-slate-900 text-white text-xs flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                                    <span className="truncate">{local?.file ? local.file.name : (ans?.fileName || 'Dokumen')}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMedia(block.id)}
                                    className="text-rose-400 hover:text-rose-300 font-bold"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <img
                                    src={previewMedia}
                                    alt="Foto Unggahan"
                                    className="w-full max-h-56 object-contain bg-slate-950"
                                  />
                                  <div className="p-2 bg-slate-900 text-white text-[11px] flex items-center justify-between">
                                    <span className="truncate text-slate-300">
                                      {local?.file ? local.file.name : (ans?.fileName || 'Foto terpilih')}
                                      {local?.compression && ` (${formatFileSize(local.compression.compressedSize)})`}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setZoomUrl(previewMedia)}
                                        className="text-slate-300 hover:text-white"
                                        title="Perbesar"
                                      >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveMedia(block.id)}
                                        className="text-rose-400 hover:text-rose-300 font-bold"
                                      >
                                        Ganti
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3.5 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex items-center justify-between gap-2">
                              <span className="text-xs text-slate-500">
                                {compressingBlockId === block.id 
                                  ? 'Memproses berkas...' 
                                  : block.mediaKind === 'image' 
                                  ? 'Ambil foto kamera atau unggah gambar' 
                                  : block.mediaKind === 'audio' 
                                  ? 'Unggah rekaman audio' 
                                  : block.mediaKind === 'video' 
                                  ? 'Unggah video' 
                                  : 'Pilih dokumen'}
                              </span>

                              <button
                                type="button"
                                disabled={compressingBlockId === block.id}
                                onClick={() => fileInputRefs.current[block.id]?.click()}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                              >
                                {block.mediaKind === 'image' ? 'Pilih / Foto' : 'Unggah'}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Tipe Teks / Esai */
                        <textarea
                          rows={2}
                          value={ans?.textValue || ''}
                          onChange={(e) => handleTextChange(block.id, e.target.value, 'text')}
                          placeholder={block.placeholder || 'Tuliskan jawaban kamu di sini...'}
                          className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed font-medium"
                        />
                      )}
                    </div>
                  );
                })}

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  {existingSubmission && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setIsEditMode(false)}
                      className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || compressingBlockId !== null}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Kirim Jawaban LKPD</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </motion.div>

        {/* Zoom Lightbox Modal */}
        {zoomUrl && (
          <div 
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setZoomUrl(null)}
          >
            <button
              onClick={() => setZoomUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={zoomUrl} 
              alt="Zoomed" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
            />
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
