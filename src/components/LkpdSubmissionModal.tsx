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
  Maximize2, 
  Info,
  Edit3,
  Palette,
  FileCheck
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

  // Form States (No location field per user requirement)
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

      // If already graded, cannot edit. If not graded and has submission, default to view mode
      const isGraded = existingSubmission.status === 'graded' || existingSubmission.score !== null;
      setIsEditMode(!isGraded && !existingSubmission.id);
    } else {
      // New submission
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

    // Validation
    if (!previewUrl && !selectedFile && !existingFileUrl) {
      setErrorMsg('Harap ambil atau unggah foto objek yang diobservasi.');
      return;
    }
    if (!objectName.trim()) {
      setErrorMsg('Harap isi nama objek atau benda yang kamu amati.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      let finalFileUrl = existingFileUrl;
      let finalFileName = existingSubmission?.file_name || null;
      let finalFileType = existingSubmission?.file_type || null;
      let finalFileSize = existingSubmission?.file_size || null;

      // 1. Upload new photo if selected
      if (selectedFile) {
        const folder = `lkpd_${studentInfo.school_id || 'general'}/${assignment.id}/${studentInfo.id}`;
        const uploadedUrl = await uploadSubmissionFile(selectedFile, folder);
        finalFileUrl = uploadedUrl;
        finalFileName = selectedFile.name;
        finalFileType = selectedFile.type;
        finalFileSize = selectedFile.size;
      }

      // 2. Prepare structured JSON response without location
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

      setSuccessMsg('Hasil observasi LKPD berhasil disimpan dan dikirim!');
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
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
          onClick={() => { if (!submitting) onClose(); }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-300 z-10"
        >
          {/* Header - High Contrast Dark Navy */}
          <div className="px-5 py-4 sm:px-6 sm:py-4.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 block">
                  LKPD Observasi • {lkpdConfig.name || 'Seni Rupa'}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug break-words">
                  {assignment.title}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { if (!submitting) onClose(); }}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0 ml-2"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 text-slate-900 flex-1 bg-white">
            {/* Alert / Notification */}
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-xs font-semibold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span className="break-words leading-relaxed">{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2.5 text-xs font-semibold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span className="break-words leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Teacher Evaluation Banner (If graded) */}
            {isGraded && (
              <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-900">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span>Sudah Dinilai Guru</span>
                  </div>
                  {existingSubmission?.feedback ? (
                    <div className="bg-white p-3 rounded-lg border border-emerald-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase block mb-0.5">Catatan & Masukan Guru:</span>
                      <p className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed break-words whitespace-pre-line">
                        "{existingSubmission.feedback}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-700 font-medium">Guru telah memeriksa dan memberikan penilaian pada lembar kerja ini.</p>
                  )}
                </div>
                <div className="text-right shrink-0 bg-white px-3.5 py-2 rounded-xl border border-emerald-200 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Nilai</div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700">
                    {existingSubmission?.score ?? '-'}
                  </div>
                </div>
              </div>
            )}

            {/* Petunjuk Pengerjaan Tugas */}
            {assignment.description && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Petunjuk Guru:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line break-words">
                  {assignment.description}
                </p>
              </div>
            )}

            {/* VIEW MODE: When already submitted & not editing */}
            {!isEditMode && existingSubmission && (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      Jawaban Terkirim
                    </span>
                    {existingSubmission.submitted_at && (
                      <span className="text-xs text-slate-600 font-medium">
                        Dikirim: {new Date(existingSubmission.submitted_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
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
                      className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Jawaban
                    </button>
                  )}
                </div>

                {/* Submitted Photo Preview */}
                {previewUrl && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                      Foto Objek Observasi:
                    </label>
                    <div className="rounded-xl overflow-hidden border border-slate-300 bg-slate-900 relative">
                      <img 
                        src={previewUrl} 
                        alt="Foto Objek Observasi" 
                        className="w-full max-h-72 object-contain bg-slate-950"
                      />
                      <div className="p-3 bg-slate-900 text-white flex items-center justify-between gap-2">
                        <span className="text-xs font-bold truncate">
                          {objectName || 'Objek Observasi'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsZoomOpen(true)}
                          className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold flex items-center gap-1"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Perbesar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Object Name */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Nama Objek / Benda:
                  </span>
                  <p className="text-sm font-bold text-slate-900 break-words">
                    {objectName || '-'}
                  </p>
                </div>

                {/* 6 Elements Analysis Display */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Hasil Analisis 6 Unsur Seni Rupa:
                  </h4>
                  <div className="space-y-2.5">
                    {aspects.map(asp => (
                      <div key={asp.id} className="p-3.5 rounded-xl bg-white border border-slate-300 space-y-1">
                        <span className="text-xs font-bold text-blue-900 block">
                          {asp.label}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line break-words font-medium">
                          {answers[asp.id] || <span className="text-slate-400 italic">Belum diisi.</span>}
                        </p>
                      </div>
                    ))}
                  </div>

                  {reflection && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 space-y-1">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                        Refleksi & Kesimpulan Siswa:
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line break-words font-medium">
                        {reflection}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EDIT / SUBMISSION FORM */}
            {isEditMode && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. PHOTO CAPTURE */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>1. Foto Objek di Sekitar Sekolah</span>
                      <span className="text-rose-600 font-bold">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Wajib difoto
                    </span>
                  </div>

                  {/* Hidden inputs */}
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
                    <div className="rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-950 relative">
                      <img 
                        src={previewUrl} 
                        alt="Preview Foto Observasi" 
                        className="w-full max-h-64 object-contain bg-slate-950"
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsZoomOpen(true)}
                          className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors"
                          title="Perbesar"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="p-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                          title="Hapus Foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-2.5 bg-slate-900 text-white text-xs flex items-center justify-between gap-2 border-t border-slate-800">
                        <span className="truncate text-slate-300">
                          {selectedFile ? selectedFile.name : 'Foto tersimpan'}
                        </span>
                        {compressionResult && (
                          <span className="text-emerald-400 font-bold shrink-0 text-[11px]">
                            Ukuran: {formatFileSize(compressionResult.compressedSize)}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl bg-slate-50/60 text-center space-y-3 transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 mx-auto flex items-center justify-center">
                        {isCompressing ? (
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        ) : (
                          <Camera className="w-6 h-6" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-sm font-bold text-slate-900">
                          {isCompressing ? 'Sedang memproses foto...' : 'Ambil Foto Objek Langsung'}
                        </h5>
                        <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                          Gunakan kamera HP untuk memotret objek yang sedang kamu amati di lingkungan sekolah.
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                        <button
                          type="button"
                          disabled={isCompressing}
                          onClick={() => cameraInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Buka Kamera HP</span>
                        </button>

                        <button
                          type="button"
                          disabled={isCompressing}
                          onClick={() => galleryInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <ImageIcon className="w-4 h-4 text-slate-600" />
                          <span>Pilih dari Galeri</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. OBJECT NAME (Location field removed per user requirement) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <span>2. Nama Objek / Benda yang Diobservasi</span>
                    <span className="text-rose-600 font-bold">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Relief Dinding Gerbang, Patung Lambang Sekolah, Pohon Cemara Kipas"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 transition-colors"
                    value={objectName}
                    onChange={(e) => setObjectName(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-600">
                    Tuliskan nama jelas dari benda atau sudut karya seni rupa yang kamu amati.
                  </p>
                </div>

                {/* 3. 6 ELEMENTS OF ART (UNSUR-UNSUR RUPA) */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-blue-600" />
                        <span>3. Analisis 6 Unsur Seni Rupa</span>
                      </label>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Jelaskan hasil pengamatanmu pada masing-masing unsur rupa di bawah ini:
                      </p>
                    </div>
                    <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg shrink-0">
                      {aspects.length} Unsur Rupa
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {aspects.map((asp, idx) => (
                      <div 
                        key={asp.id} 
                        className="p-4 rounded-xl bg-white border border-slate-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 space-y-2 transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            {asp.label}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            Unsur {idx + 1} dari {aspects.length}
                          </span>
                        </div>
                        {asp.helperText && (
                          <p className="text-xs text-slate-700 leading-relaxed break-words bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            💡 <span className="font-semibold text-slate-900">Panduan:</span> {asp.helperText}
                          </p>
                        )}
                        <textarea
                          rows={3}
                          placeholder={asp.placeholder || 'Tuliskan hasil pengamatanmu untuk unsur ini...'}
                          className="w-full p-3 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 transition-colors resize-none leading-relaxed"
                          value={answers[asp.id] || ''}
                          onChange={(e) => handleAnswerChange(asp.id, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. REFLECTION */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span>4. Refleksi & Kesimpulan Estetika</span>
                  </label>
                  <p className="text-xs text-slate-700 leading-relaxed break-words">
                    {lkpdConfig.reflectionPrompt || 'Mengapa kamu memilih objek ini dan apa kesan keindahan yang kamu rasakan?'}
                  </p>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Saya memilih objek ini karena perpaduan unsur bentuk dan teksturnya sangat unik serta harmonis..."
                    className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 transition-colors resize-none leading-relaxed"
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                  {existingSubmission && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setIsEditMode(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || isCompressing}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyimpan & Mengirim...</span>
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
