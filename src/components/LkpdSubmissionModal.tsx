import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  ImageIcon, 
  Loader2, 
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Assignment, AssignmentSubmission } from '../types';
import { supabase, supabaseAnon } from '../lib/supabase';
import { compressImageFile, formatFileSize, uploadSubmissionFile, getOptimizedMediaUrl, CompressionResult } from '../utils/fileCompressor';
import { OBSERVATION_PRESETS, parseLkpdResponse, LkpdSubmissionPayload, LkpdAspect } from '../utils/lkpdPresets';

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
  // Determine LKPD Configuration
  const lkpdConfig = React.useMemo(() => {
    if (assignment?.lkpd_config && assignment.lkpd_config.aspects) {
      return assignment.lkpd_config;
    }
    const presetKey = assignment?.lkpd_config?.preset || 'art_elements';
    return OBSERVATION_PRESETS[presetKey] || OBSERVATION_PRESETS.art_elements;
  }, [assignment]);

  // Form States
  const [objectName, setObjectName] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reflection, setReflection] = useState('');
  
  // Media State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Status & Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Native input refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Populate data when modal opens or submission changes
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    if (existingSubmission) {
      const parsed = parseLkpdResponse(existingSubmission.text_response);
      if (parsed) {
        setObjectName(parsed.object_name || '');
        setAnswers(parsed.answers || {});
        setReflection(parsed.reflection || '');
      } else {
        setObjectName('');
        setAnswers({});
        setReflection(existingSubmission.text_response || '');
      }

      setExistingFileUrl(existingSubmission.file_url || null);
      setPreviewUrl(existingSubmission.file_url ? getOptimizedMediaUrl(existingSubmission.file_url) : null);
      setSelectedFile(null);
      setCompressionResult(null);

      const isGraded = existingSubmission.status === 'graded' || existingSubmission.score !== null;
      setIsEditMode(!isGraded && !existingSubmission.id);
    } else {
      setObjectName('');
      setAnswers({});
      setReflection('');
      setExistingFileUrl(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setCompressionResult(null);
      setIsEditMode(true);
    }
  }, [isOpen, existingSubmission, assignment]);

  // Handle Photo selection & compression
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsCompressing(true);

    try {
      const result = await compressImageFile(file, 1800, 0.82);
      setSelectedFile(result.file);
      setCompressionResult(result);
      setPreviewUrl(result.previewUrl);
    } catch (err: any) {
      console.error('Gagal kompresi foto:', err);
      setErrorMsg('Gagal memproses foto. Silakan coba pilih foto lain.');
    } finally {
      setIsCompressing(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setCompressionResult(null);
    setExistingFileUrl(null);
    setPreviewUrl(null);
  };

  const handleAnswerChange = (aspectId: string, val: string) => {
    setAnswers(prev => ({
      ...prev,
      [aspectId]: val
    }));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment || !studentInfo) return;

    if (!previewUrl && !selectedFile && !existingFileUrl) {
      setErrorMsg('Harap ambil atau unggah foto objek observasi.');
      return;
    }
    if (!objectName.trim()) {
      setErrorMsg('Harap tuliskan nama objek yang diobservasi.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      let finalFileUrl = existingFileUrl;
      let finalFileName = existingSubmission?.file_name || null;
      let finalFileType = existingSubmission?.file_type || null;
      let finalFileSize = existingSubmission?.file_size || null;

      if (selectedFile) {
        const folder = `lkpd_${studentInfo.school_id || 'general'}/${assignment.id}/${studentInfo.id}`;
        const uploadedUrl = await uploadSubmissionFile(selectedFile, folder);
        finalFileUrl = uploadedUrl;
        finalFileName = selectedFile.name;
        finalFileType = selectedFile.type;
        finalFileSize = selectedFile.size;
      }

      const payload: LkpdSubmissionPayload = {
        is_lkpd: true,
        lkpd_type: assignment.lkpd_type || 'observation',
        preset_id: lkpdConfig.id || 'art_elements',
        object_name: objectName.trim(),
        answers,
        reflection: reflection.trim(),
        submitted_device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        version: 2
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
        file_url: finalFileUrl,
        file_name: finalFileName,
        file_type: finalFileType,
        file_size: finalFileSize,
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
        console.warn('Upsert fallback:', upsertErr);
        const { error: insErr } = await client
          .from('assignment_submissions')
          .insert(submissionRecord);
        if (insErr) throw insErr;
      }

      // Local storage backup
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

      setSuccessMsg('Hasil observasi LKPD berhasil terkirim!');
      setIsEditMode(false);
      setTimeout(() => {
        onSuccess();
      }, 700);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal mengirim LKPD. Silakan periksa koneksi internet Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !assignment) return null;

  const isGraded = existingSubmission?.status === 'graded' || (existingSubmission?.score !== null && existingSubmission?.score !== undefined);
  const aspects: LkpdAspect[] = lkpdConfig.aspects || OBSERVATION_PRESETS.art_elements.aspects;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => { if (!submitting) onClose(); }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.98, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.98, opacity: 0, y: 8 }}
          className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 z-10"
        >
          {/* Header - EduVerse Theme */}
          <div className="px-5 py-4 bg-white flex items-center justify-between shrink-0 border-b border-indigo-100">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#1D4ED8] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full inline-block mb-1">
                {lkpdConfig.name || 'LKPD Observasi Lapangan'}
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
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-800 flex-1 bg-white">
            {/* Status alerts */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium">
                {successMsg}
              </div>
            )}

            {/* Graded Banner (Minimalist) */}
            {isGraded && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-emerald-700">Sudah Dinilai</div>
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

            {/* Teacher Guidance / Description (Quiet, clean text) */}
            {assignment.description && (
              <div className="text-xs sm:text-sm text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                <span className="font-semibold text-slate-800 block mb-1">Petunjuk Guru:</span>
                {assignment.description}
              </div>
            )}

            {/* VIEW MODE: When already submitted & not editing */}
            {!isEditMode && existingSubmission && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md">
                    Jawaban Terkirim
                  </span>
                  {!isGraded && (
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer underline underline-offset-2"
                    >
                      Ubah Jawaban
                    </button>
                  )}
                </div>

                {/* Submitted Photo */}
                {previewUrl && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-700 block">Foto Objek</span>
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 relative group">
                      <img 
                        src={previewUrl} 
                        alt="Foto Objek Observasi" 
                        className="w-full max-h-72 object-contain bg-slate-950"
                      />
                      <button
                        type="button"
                        onClick={() => setIsZoomOpen(true)}
                        className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-xs cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Perbesar</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Object Name */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Nama Objek</span>
                  <p className="text-sm font-semibold text-slate-900">{objectName || '-'}</p>
                </div>

                {/* Aspects Answers */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Hasil Analisis Unsur Rupa
                  </h4>
                  <div className="space-y-3">
                    {aspects.map(asp => (
                      <div key={asp.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-xs font-bold text-slate-800 block">
                          {asp.label}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                          {answers[asp.id] || <span className="text-slate-400 italic">Belum diisi.</span>}
                        </p>
                      </div>
                    ))}
                  </div>

                  {reflection && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-xs font-bold text-slate-800 block">
                        Refleksi & Kesimpulan
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {reflection}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EDIT / SUBMISSION FORM */}
            {isEditMode && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. PHOTO CAPTURE */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-900 block">
                    1. Foto Objek Observasi <span className="text-rose-500">*</span>
                  </label>

                  <input 
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <input 
                    type="file"
                    ref={galleryInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />

                  {previewUrl ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 relative">
                      <img 
                        src={previewUrl} 
                        alt="Preview Foto" 
                        className="w-full max-h-64 object-contain bg-slate-950"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsZoomOpen(true)}
                          className="p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
                          title="Perbesar"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-2.5 py-1 rounded-md bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-medium transition-colors cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                      <div className="p-2 bg-slate-900 text-white text-[11px] flex items-center justify-between">
                        <span className="truncate text-slate-300">
                          {selectedFile ? selectedFile.name : 'Foto terpilih'}
                        </span>
                        {compressionResult && (
                          <span className="text-slate-400">
                            {formatFileSize(compressionResult.compressedSize)}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 text-center space-y-3">
                      <p className="text-xs text-slate-500">
                        {isCompressing ? 'Sedang memproses foto...' : 'Ambil foto objek langsung atau pilih dari galeri.'}
                      </p>

                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={isCompressing}
                          onClick={() => cameraInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-[#3B66F5]/20 cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Buka Kamera HP</span>
                        </button>

                        <button
                          type="button"
                          disabled={isCompressing}
                          onClick={() => galleryInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span>Pilih Galeri</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. OBJECT NAME */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 block">
                    2. Nama Objek yang Diobservasi <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Relief Dinding Gerbang, Patung Sekolah, Pohon Cemara"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#3B66F5] focus:ring-2 focus:ring-[#3B66F5]/20 transition-all"
                    value={objectName}
                    onChange={(e) => setObjectName(e.target.value)}
                  />
                </div>

                {/* 3. ASPECTS OF ART */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-black text-slate-900 block uppercase tracking-wider">
                    3. Analisis Unsur Seni Rupa
                  </label>

                  <div className="space-y-3">
                    {aspects.map((asp) => (
                      <div 
                        key={asp.id} 
                        className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 focus-within:border-[#3B66F5] focus-within:ring-2 focus-within:ring-[#3B66F5]/20 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1D4ED8]">
                            {asp.label}
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          placeholder={asp.helperText ? `${asp.helperText}` : `Deskripsikan unsur ${asp.label.toLowerCase()} pada objek...`}
                          className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#3B66F5] transition-colors resize-none leading-relaxed"
                          value={answers[asp.id] || ''}
                          onChange={(e) => handleAnswerChange(asp.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. REFLECTION */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-black text-slate-900 block uppercase tracking-wider">
                    4. Refleksi & Kesimpulan Estetika
                  </label>
                  <textarea
                    rows={2}
                    placeholder={lkpdConfig.reflectionPrompt || 'Tuliskan kesan keindahan dan alasan kamu memilih objek ini...'}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#3B66F5] focus:ring-2 focus:ring-[#3B66F5]/20 transition-all resize-none leading-relaxed"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                  />
                </div>

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
                      className="px-4 py-2 rounded-full text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || isCompressing}
                      className="bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#3B66F5]/25 border border-white/10 cursor-pointer disabled:opacity-50"
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

        {/* Full Image Zoom Modal */}
        {isZoomOpen && previewUrl && (
          <div 
            className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setIsZoomOpen(false)}
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewUrl} 
              alt="Zoomed preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
            />
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
