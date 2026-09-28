import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  Send, 
  Sparkles, 
  MapPin, 
  Compass, 
  Maximize2, 
  Info,
  Edit3,
  Calendar,
  Clock,
  ArrowRight
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
  const [location, setLocation] = useState('');
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
        setLocation(parsed.location || '');
        setAnswers(parsed.answers || {});
        setReflection(parsed.reflection || '');
      } else {
        setObjectName('');
        setLocation('');
        setAnswers({});
        setReflection(existingSubmission.text_response || '');
      }

      setExistingFileUrl(existingSubmission.file_url || null);
      setPreviewUrl(existingSubmission.file_url ? getOptimizedMediaUrl(existingSubmission.file_url) : null);
      setSelectedFile(null);
      setCompressionResult(null);

      // If already graded, cannot edit. If not graded, default to view mode with edit button
      const isGraded = existingSubmission.status === 'graded' || existingSubmission.score !== null;
      setIsEditMode(!isGraded && !existingSubmission.id);
    } else {
      // New submission
      setObjectName('');
      setLocation('');
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
      const result = await compressImageFile(file, 1800, 0.8);

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

    // Validation
    if (!previewUrl && !selectedFile && !existingFileUrl) {
      setErrorMsg('Harap ambil atau unggah foto objek yang diobservasi.');
      return;
    }
    if (!objectName.trim()) {
      setErrorMsg('Harap isi nama objek atau benda yang kamu amati.');
      return;
    }
    if (!location.trim()) {
      setErrorMsg('Harap isi titik lokasi objek tersebut di lingkungan sekolah.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      let finalFileUrl = existingFileUrl;
      let finalFileName = existingSubmission?.file_name || null;
      let finalFileType = existingSubmission?.file_type || null;
      let finalFileSize = existingSubmission?.file_size || null;

      // 1. Upload new photo if changed
      if (selectedFile) {
        const folder = `lkpd_${studentInfo.school_id || 'general'}/${assignment.id}/${studentInfo.id}`;
        const uploadedUrl = await uploadSubmissionFile(selectedFile, folder);
        finalFileUrl = uploadedUrl;
        finalFileName = selectedFile.name;
        finalFileType = selectedFile.type;
        finalFileSize = selectedFile.size;
      }

      // 2. Prepare structured JSON response
      const payload: LkpdSubmissionPayload = {
        is_lkpd: true,
        lkpd_type: assignment.lkpd_type || 'observation',
        preset_id: lkpdConfig.id || 'art_elements',
        object_name: objectName.trim(),
        location: location.trim(),
        answers,
        reflection: reflection.trim(),
        submitted_device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        version: 1
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

      // 3. Upsert to Supabase
      const client = supabaseAnon || supabase;
      const { data: upsertData, error: upsertErr } = await client
        .from('assignment_submissions')
        .upsert(submissionRecord, { onConflict: 'assignment_id,student_id' })
        .select()
        .single();

      if (upsertErr) {
        console.warn('Upsert failed, trying direct insert fallback:', upsertErr);
        const { error: insErr } = await client
          .from('assignment_submissions')
          .insert(submissionRecord);
        if (insErr) throw insErr;
      }

      // 4. Save to local storage cache for offline reliability
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

      setSuccessMsg('Hasil observasi LKPD berhasil dikirim!');
      setIsEditMode(false);
      setTimeout(() => {
        onSuccess();
      }, 800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal mengirim LKPD. Pastikan koneksi internet stabil.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !assignment) return null;

  const isGraded = existingSubmission?.status === 'graded' || (existingSubmission?.score !== null && existingSubmission?.score !== undefined);
  const aspects: LkpdAspect[] = lkpdConfig.aspects || OBSERVATION_PRESETS.art_elements.aspects;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
          onClick={() => { if (!submitting) onClose(); }}
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative bg-white rounded-3xl sm:rounded-[2.2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 z-10"
        >
          {/* Header */}
          <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-100" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">
                  LKPD Interaktif • {lkpdConfig.name || 'Observasi'}
                </span>
                <h3 className="text-base sm:text-lg font-black leading-snug truncate max-w-[280px] sm:max-w-md">
                  {assignment.title}
                </h3>
              </div>
            </div>
            <button
              onClick={() => { if (!submitting) onClose(); }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 text-slate-800 flex-1">
            {/* Alert / Notification */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Graded Summary Banner (if already reviewed by teacher) */}
            {isGraded && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Sudah Dinilai Guru</span>
                  </div>
                  {existingSubmission?.feedback ? (
                    <p className="text-xs text-slate-700 italic bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                      "{existingSubmission.feedback}"
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">Guru telah memeriksa hasil observasimu.</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Nilai</div>
                  <div className="text-3xl font-black text-emerald-600">
                    {existingSubmission?.score ?? '-'}
                  </div>
                </div>
              </div>
            )}

            {/* Petunjuk Guru */}
            {assignment.description && (
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  <span>Petunjuk Pengerjaan</span>
                </div>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {assignment.description}
                </p>
              </div>
            )}

            {/* Read-Only Summary Mode (When submitted and not in edit mode) */}
            {!isEditMode && existingSubmission && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Jawaban Terkirim
                    </span>
                    {existingSubmission.submitted_at && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(existingSubmission.submitted_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  {!isGraded && (
                    <button
                      type="button"
                      onClick={() => setIsEditMode(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold border border-amber-200 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Jawaban
                    </button>
                  )}
                </div>

                {/* Submitted Photo Preview */}
                {previewUrl && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
                    <img 
                      src={previewUrl} 
                      alt="Foto Objek Observasi" 
                      className="w-full max-h-72 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                      <div className="text-white">
                        <div className="text-sm font-black">{objectName || 'Objek Observasi'}</div>
                        <div className="text-xs text-amber-200 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{location || 'Lingkungan Sekolah'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Answers Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Hasil Analisis Unsur / Aspek:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {aspects.map(asp => (
                      <div key={asp.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                        <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide block">
                          {asp.label}
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                          {answers[asp.id] || <span className="text-slate-400 italic">Tidak ada keterangan.</span>}
                        </p>
                      </div>
                    ))}
                  </div>

                  {reflection && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1">
                      <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide block">
                        Refleksi Siswa:
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {reflection}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interactive Edit/Submission Form */}
            {isEditMode && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. PHOTO CAPTURE & UPLOAD */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>1. Foto Objek di Lingkungan Sekolah</span>
                    <span className="text-rose-500">*</span>
                  </label>

                  {/* Hidden file inputs for Camera & Gallery */}
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
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group">
                      <img 
                        src={previewUrl} 
                        alt="Preview Observasi" 
                        className="w-full max-h-64 object-cover"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsZoomOpen(true)}
                          className="p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-xs transition-colors"
                          title="Perbesar Foto"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors"
                          title="Hapus / Foto Ulang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-3 bg-slate-900/90 text-white text-[11px] flex items-center justify-between">
                        <span className="truncate">
                          {selectedFile ? selectedFile.name : 'Foto tersimpan'}
                        </span>
                        {compressionResult && (
                          <span className="text-emerald-400 font-bold ml-2 shrink-0">
                            Terkonversi: {formatFileSize(compressionResult.compressedSize)} (Hemat {compressionResult.reductionPercentage}%)
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 border-2 border-dashed border-amber-300 rounded-2xl bg-amber-50/40 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                        {isCompressing ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <Camera className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-800">
                          {isCompressing ? 'Sedang mengompres foto...' : 'Ambil Foto Objek Observasi'}
                        </h5>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                          Jepret langsung objek di sekolah menggunakan kamera smartphone atau pilih dari galeri.
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isCompressing}
                          onClick={() => cameraInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Buka Kamera</span>
                        </button>

                        <button
                          type="button"
                          disabled={isCompressing}
                          onClick={() => galleryInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all flex items-center gap-1.5"
                        >
                          <ImageIcon className="w-4 h-4 text-slate-500" />
                          <span>Pilih Galeri</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. OBJECT NAME & LOCATION */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-slate-700 flex items-center gap-1">
                      <span>Nama Objek / Benda</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Contoh: Relief Dinding, Patung Elang, Daun Palem"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 transition-colors"
                      value={objectName}
                      onChange={(e) => setObjectName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-bold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>Titik Lokasi di Sekolah</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Contoh: Taman Depan Lab Biologi, Koridor Lt.2"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500 transition-colors"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                </div>

                {/* 3. ASPECTS ANALYSIS (UNSUR RUPA / ASPEK) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-amber-500" />
                      <span>3. Analisis Unsur-Unsur Rupa / Karakteristik</span>
                    </label>
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                      {aspects.length} Poin Analisis
                    </span>
                  </div>

                  <div className="space-y-3">
                    {aspects.map((asp) => (
                      <div 
                        key={asp.id} 
                        className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 focus-within:border-amber-400 focus-within:bg-white transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800">
                            {asp.label}
                          </span>
                        </div>
                        {asp.helperText && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            💡 {asp.helperText}
                          </p>
                        )}
                        <textarea
                          rows={2}
                          placeholder={asp.placeholder || 'Tuliskan hasil pengamatanmu...'}
                          className="w-full p-2.5 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 transition-colors resize-none"
                          value={answers[asp.id] || ''}
                          onChange={(e) => handleAnswerChange(asp.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. REFLECTION */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>4. Refleksi / Kesimpulan Pengamatan</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    {lkpdConfig.reflectionPrompt || 'Tuliskan alasan memilih objek ini serta kesan estetika/keindahannya.'}
                  </p>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Saya memilih objek ini karena perpaduan warna dan teksturnya sangat unik..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 transition-colors resize-none"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                  />
                </div>

                {/* Submit Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  {existingSubmission && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setIsEditMode(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                    >
                      Batal Edit
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition-colors"
                    >
                      Tutup
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || isCompressing}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Mengirim LKPD...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Jawaban LKPD</span>
                        </>
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
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/40"
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
