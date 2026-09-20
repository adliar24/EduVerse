import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Clock, 
  ExternalLink,
  Zap,
  Eye,
  Award,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Assignment, AssignmentSubmission } from '../types';
import { supabase } from '../lib/supabase';
import { compressImageFile, formatFileSize, uploadSubmissionFile, CompressionResult } from '../utils/fileCompressor';

interface StudentSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  studentInfo: any;
  existingSubmission: AssignmentSubmission | null;
  onSuccess: () => void;
}

export default function StudentSubmissionModal({
  isOpen,
  onClose,
  assignment,
  studentInfo,
  existingSubmission,
  onSuccess
}: StudentSubmissionModalProps) {
  const [textResponse, setTextResponse] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && assignment) {
      setErrorMsg(null);
      if (existingSubmission) {
        setTextResponse(existingSubmission.text_response || '');
      } else {
        setTextResponse('');
      }
      setSelectedFile(null);
      setCompressionResult(null);
    }
  }, [isOpen, assignment, existingSubmission]);

  if (!isOpen || !assignment) return null;

  const hasDeadline = !!assignment.deadline;
  const deadlineDate = hasDeadline ? new Date(assignment.deadline!) : null;
  const isOverdue = deadlineDate ? deadlineDate.getTime() < Date.now() : false;
  const isGraded = existingSubmission?.status === 'graded' && existingSubmission?.score !== null && existingSubmission?.score !== undefined;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    // Limit maximum raw file size to 25MB
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('Ukuran berkas terlalu besar. Maksimal 25 MB.');
      return;
    }

    if (file.type.startsWith('image/')) {
      setIsCompressing(true);
      try {
        const result = await compressImageFile(file, 1800, 0.78);
        setCompressionResult(result);
        setSelectedFile(result.file);
      } catch (err: any) {
        console.error('Compression failed, falling back to original:', err);
        setSelectedFile(file);
        setCompressionResult({
          file,
          originalSize: file.size,
          compressedSize: file.size,
          reductionPercentage: 0,
          previewUrl: URL.createObjectURL(file)
        });
      } finally {
        setIsCompressing(false);
      }
    } else if (file.type === 'application/pdf') {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Berkas PDF maksimal 10 MB.');
        return;
      }
      setSelectedFile(file);
      setCompressionResult(null);
    } else {
      setErrorMsg('Format berkas tidak didukung. Mohon unggah Gambar (JPG/PNG) atau PDF.');
    }
  };

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null);
    setCompressionResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentInfo?.id || !assignment?.id) return;

    if (!textResponse.trim() && !selectedFile && !existingSubmission?.file_url) {
      setErrorMsg('Silakan tulis jawaban tugas atau lampirkan berkas (gambar/PDF).');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      let finalFileUrl = existingSubmission?.file_url || null;
      let finalFileName = existingSubmission?.file_name || null;
      let finalFileType = existingSubmission?.file_type || null;
      let finalFileSize = existingSubmission?.file_size || null;

      // If student selected a new file, upload it
      if (selectedFile) {
        const folderPath = `${studentInfo.school_id || 'school'}/${assignment.id}`;
        finalFileUrl = await uploadSubmissionFile(selectedFile, folderPath);
        finalFileName = selectedFile.name;
        finalFileType = selectedFile.type;
        finalFileSize = selectedFile.size;
      }

      const submissionPayload: Partial<AssignmentSubmission> = {
        assignment_id: assignment.id,
        student_id: studentInfo.id,
        school_id: studentInfo.school_id || null,
        class_id: studentInfo.class_id || assignment.class_id || null,
        student_name: studentInfo.name || 'Siswa',
        student_code: studentInfo.student_code || '',
        text_response: textResponse.trim() || undefined,
        file_url: finalFileUrl,
        file_name: finalFileName,
        file_type: finalFileType,
        file_size: finalFileSize,
        submitted_at: new Date().toISOString(),
        status: isGraded ? 'graded' : (isOverdue ? 'late' : 'submitted'),
        updated_at: new Date().toISOString()
      };

      const { error: upsertErr } = await supabase
        .from('assignment_submissions')
        .upsert(submissionPayload, { onConflict: 'assignment_id,student_id' });

      if (upsertErr) {
        throw upsertErr;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error submitting assignment:', err);
      setErrorMsg(err.message || 'Gagal mengirimkan tugas. Pastikan koneksi stabil.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-r from-indigo-50/70 via-white to-blue-50/70">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Lembar Pengumpulan
              </span>
              {hasDeadline && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  <Clock className="w-3 h-3" />
                  {isOverdue ? 'Tenggat Terlewat' : `Tenggat: ${deadlineDate?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 leading-snug">
              {assignment.title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Graded Feedback Banner (If already graded by teacher) */}
          {isGraded && (
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Tugas Telah Dinilai Guru
                </span>
                <span className="text-xl font-black text-emerald-700 bg-white px-3 py-1 rounded-xl shadow-xs border border-emerald-200">
                  {existingSubmission.score} <span className="text-xs font-bold text-slate-400">/ 100</span>
                </span>
              </div>
              {existingSubmission.feedback && (
                <div className="mt-2 text-xs text-emerald-900 bg-white/80 p-3 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-1 font-bold text-emerald-800 mb-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Catatan Guru:
                  </div>
                  <p className="whitespace-pre-line">{existingSubmission.feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Assignment Instructions / Description */}
          {assignment.description && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Petunjuk Pengerjaan Guru:
              </span>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {assignment.description}
              </p>
              {assignment.link && (
                <div className="pt-2">
                  <a 
                    href={assignment.link.startsWith('http') ? assignment.link : `https://${assignment.link}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    <span>Buka Tautan Materi / Lampiran Guru</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Text Response Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Jawaban Tertulis / Catatan Jawaban</span>
              <span className="text-[10px] font-semibold text-slate-400">(Opsional jika sudah melampirkan berkas)</span>
            </label>
            <textarea
              rows={4}
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              placeholder="Tuliskan jawaban tugas Anda di sini, penjelasan jawaban, atau catatan pengerjaan..."
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all resize-y"
            />
          </div>

          {/* File Upload Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Lampiran Berkas (Foto Buku / Gambar / PDF)</span>
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Auto-Compressed Max 1800px
              </span>
            </label>

            {/* Hidden native input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="hidden"
            />

            {/* If a new file is chosen */}
            {selectedFile ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {selectedFile.type.startsWith('image/') ? (
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {compressionResult?.previewUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewModalOpen(true)}
                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
                        title="Lihat Pratinjau"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveSelectedFile}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Hapus Berkas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Compression Efficiency Chip for Images */}
                {compressionResult && compressionResult.reductionPercentage > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200/60">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                    <span>
                      Foto terkompresi otomatis: {formatFileSize(compressionResult.originalSize)} ➔ {formatFileSize(compressionResult.compressedSize)} (Hemat {compressionResult.reductionPercentage}%)
                    </span>
                  </div>
                )}
              </div>
            ) : existingSubmission?.file_url ? (
              /* If there is an existing submitted file from previous submission */
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    {existingSubmission.file_type?.startsWith('image/') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {existingSubmission.file_name || 'Berkas Terlampir'}
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Berkas sudah tersimpan di server
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={existingSubmission.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 text-indigo-700 text-xs font-bold rounded-xl shadow-2xs hover:bg-slate-50 transition-all inline-flex items-center gap-1"
                  >
                    <span>Buka</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Ganti Berkas
                  </button>
                </div>
              </div>
            ) : (
              /* Dropzone button to trigger file select */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                {isCompressing ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    <p className="text-xs font-bold text-indigo-900">Mengompresi foto tugas Anda...</p>
                    <p className="text-[11px] text-slate-400">Menjaga tulisan tetap jelas & hemat ukuran</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 mx-auto rounded-2xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Klik untuk Ambil Foto / Pilih Dokumen
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Mendukung Foto Lembar Tugas (JPG/PNG) & Dokumen PDF (Maks 10 MB)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submission Timing Notes */}
          {existingSubmission && (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Terakhir dikumpulkan: {new Date(existingSubmission.submitted_at || '').toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="submit"
              disabled={submitting || isCompressing}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirimkan Tugas...</span>
                </>
              ) : (
                <span>{existingSubmission ? 'Perbarui Pengumpulan' : 'Kirim Tugas Sekarang'}</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Image Preview Sub-Modal */}
      {previewModalOpen && compressionResult?.previewUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2">
            <button
              onClick={() => setPreviewModalOpen(false)}
              className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-xl hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={compressionResult.previewUrl} 
              alt="Preview Berkas" 
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-lg" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
