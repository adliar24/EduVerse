import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Camera,
  Link2,
  Globe,
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Clock, 
  ExternalLink,
  Eye, 
  Award, 
  MessageSquare,
  Send,
  Sparkles,
  Plus,
  Paperclip,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Assignment, AssignmentSubmission } from '../types';
import { supabase, supabaseAnon } from '../lib/supabase';
import { deleteFileFromAppwrite } from '../lib/appwrite';
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
  
  // Link state
  const [linkUrl, setLinkUrl] = useState('');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkInputVal, setLinkInputVal] = useState('');

  // Attachment menu state
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isExistingFileRemoved, setIsExistingFileRemoved] = useState(false);

  // Hidden native inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close attach menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };
    if (isAttachMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAttachMenuOpen]);

  useEffect(() => {
    if (isOpen && assignment) {
      setErrorMsg(null);
      setIsAttachMenuOpen(false);
      setIsLinkModalOpen(false);
      setIsExistingFileRemoved(false);

      if (existingSubmission) {
        setTextResponse(existingSubmission.text_response || '');
        setLinkUrl(existingSubmission.link || '');
        setLinkInputVal(existingSubmission.link || '');
      } else {
        setTextResponse('');
        setLinkUrl('');
        setLinkInputVal('');
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
    setIsAttachMenuOpen(false);

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
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = linkInputVal.trim();
    if (!cleaned) {
      setLinkUrl('');
      setIsLinkModalOpen(false);
      return;
    }
    // Auto prepend https:// if missing
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = `https://${cleaned}`;
    }
    setLinkUrl(cleaned);
    setIsLinkModalOpen(false);
  };

  const handleRemoveLink = () => {
    setLinkUrl('');
    setLinkInputVal('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentInfo?.id || !assignment?.id) return;

    const hasText = textResponse.trim().length > 0;
    const hasNewFile = !!selectedFile;
    const hasNewLink = linkUrl.trim().length > 0;
    const hasOldFile = !!existingSubmission?.file_url && !isExistingFileRemoved;
    const hasOldLink = !!existingSubmission?.link;

    if (!hasText && !hasNewFile && !hasNewLink && !hasOldFile && !hasOldLink) {
      setErrorMsg('Silakan ketik jawaban, lampirkan foto/PDF, atau sertakan tautan link tugas.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      let finalFileUrl = (!isExistingFileRemoved ? existingSubmission?.file_url : null) || null;
      let finalFileName = (!isExistingFileRemoved ? existingSubmission?.file_name : null) || null;
      let finalFileType = (!isExistingFileRemoved ? existingSubmission?.file_type : null) || null;
      let finalFileSize = (!isExistingFileRemoved ? existingSubmission?.file_size : null) || null;

      // If student selected a new file, upload it (with automatic Base64 Data URL fallback)
      if (selectedFile) {
        // Automatically delete previous file from Appwrite to keep storage quota clean
        if (existingSubmission?.file_url && existingSubmission.file_url.includes('appwrite')) {
          deleteFileFromAppwrite(existingSubmission.file_url).catch(() => {});
        }

        const schoolFolder = studentInfo.school_id || assignment.school_id || 'school';
        const folderPath = `${schoolFolder}/${assignment.id}`;
        finalFileUrl = await uploadSubmissionFile(selectedFile, folderPath);
        finalFileName = selectedFile.name;
        finalFileType = selectedFile.type;
        finalFileSize = selectedFile.size;
      } else if (isExistingFileRemoved && existingSubmission?.file_url) {
        // If student removed old file without choosing a new one, clean up from Appwrite
        if (existingSubmission.file_url.includes('appwrite')) {
          deleteFileFromAppwrite(existingSubmission.file_url).catch(() => {});
        }
      }

      const submissionPayload: Partial<AssignmentSubmission> = {
        assignment_id: assignment.id,
        student_id: studentInfo.id,
        school_id: studentInfo.school_id || assignment.school_id || null,
        class_id: studentInfo.class_id || assignment.class_id || null,
        student_name: studentInfo.name || studentInfo.nama || 'Siswa',
        student_code: studentInfo.student_code || studentInfo.nisn || '',
        text_response: textResponse.trim() || undefined,
        link: linkUrl.trim() || null,
        file_url: finalFileUrl,
        file_name: finalFileName,
        file_type: finalFileType,
        file_size: finalFileSize,
        submitted_at: new Date().toISOString(),
        status: isGraded ? 'graded' : (isOverdue ? 'late' : 'submitted'),
        updated_at: new Date().toISOString()
      };

      // 1. Immediate local storage backup so student work is NEVER lost
      const localKey = 'eduverse_local_submissions';
      try {
        const rawLocal = localStorage.getItem(localKey);
        const localMap = rawLocal ? JSON.parse(rawLocal) : {};
        const compositeKey = `${assignment.id}_${studentInfo.id}`;
        localMap[compositeKey] = {
          ...submissionPayload,
          id: existingSubmission?.id || localMap[compositeKey]?.id || `sub_${Date.now()}`
        };
        localStorage.setItem(localKey, JSON.stringify(localMap));
      } catch (locErr) {
        console.warn('Could not cache submission in local storage:', locErr);
      }

      // 2. Dual client cloud upload (try supabaseAnon first for pure anon role, then supabase)
      let savedToCloud = false;
      let cloudError: any = null;
      let cloudSavedId: string | null = null;
      const clients = [supabaseAnon, supabase];

      const saveWithPayload = async (payloadToSave: any) => {
        let lastErr = null;
        for (const client of clients) {
          try {
            // First check if a record actually exists in Supabase cloud for this student + assignment
            const { data: cloudRow, error: checkErr } = await client
              .from('assignment_submissions')
              .select('id')
              .eq('assignment_id', assignment.id)
              .eq('student_id', studentInfo.id)
              .maybeSingle();

            if (checkErr) {
              lastErr = checkErr;
              continue;
            }

            if (cloudRow?.id) {
              const { data: updData, error: updErr } = await client
                .from('assignment_submissions')
                .update(payloadToSave)
                .eq('id', cloudRow.id)
                .select();

              if (!updErr && updData && updData.length > 0) {
                return { success: true, id: cloudRow.id, error: null };
              }
              if (updErr) lastErr = updErr;
            } else {
              const insertPayload = { ...payloadToSave };
              delete insertPayload.id;
              const { data: insData, error: insErr } = await client
                .from('assignment_submissions')
                .insert(insertPayload)
                .select();

              if (!insErr && insData && insData.length > 0) {
                return { success: true, id: insData[0].id, error: null };
              }
              if (insErr) lastErr = insErr;
            }
          } catch (e: any) {
            lastErr = e;
          }
        }
        return { success: false, id: null, error: lastErr };
      };

      // Attempt 1: Standard payload
      const res1 = await saveWithPayload(submissionPayload);
      if (res1.success) {
        savedToCloud = true;
        cloudSavedId = res1.id;
      } else {
        cloudError = res1.error;
      }

      // Attempt 2: Resilient Schema Fallback if 'link' column is missing in Supabase (PGRST204)
      if (!savedToCloud && cloudError) {
        const isMissingLinkCol = cloudError.code === 'PGRST204' || 
          cloudError.message?.toLowerCase().includes("'link' column") ||
          cloudError.message?.toLowerCase().includes("column \"link\"");

        if (isMissingLinkCol) {
          console.warn("Column 'link' not yet created in Supabase table. Auto-retrying with embedded text_response...");
          const retryPayload = { ...submissionPayload };
          if (retryPayload.link) {
            retryPayload.text_response = (retryPayload.text_response ? retryPayload.text_response + '\n\n' : '') + `[Tautan Tugas]: ${retryPayload.link}`;
          }
          delete retryPayload.link;

          const res2 = await saveWithPayload(retryPayload);
          if (res2.success) {
            savedToCloud = true;
            cloudSavedId = res2.id;
            cloudError = null;
          } else {
            cloudError = res2.error;
          }
        }
      }

      // Synchronize local storage entry with actual cloud ID
      if (savedToCloud && cloudSavedId) {
        try {
          const rawLocal = localStorage.getItem(localKey);
          if (rawLocal) {
            const localMap = JSON.parse(rawLocal);
            const compositeKey = `${assignment.id}_${studentInfo.id}`;
            if (localMap[compositeKey]) {
              localMap[compositeKey].id = cloudSavedId;
              localStorage.setItem(localKey, JSON.stringify(localMap));
            }
          }
        } catch {
          // ignore
        }
      }

      if (!savedToCloud && cloudError) {
        console.warn('Cloud submission could not be completed:', cloudError);
        const isTableMissing = cloudError.code === 'PGRST205' || 
          (cloudError.message?.toLowerCase().includes('relation') && cloudError.message?.toLowerCase().includes('assignment_submissions'));

        if (isTableMissing) {
          setErrorMsg('Tugas Anda telah tersimpan secara lokal di perangkat ini. Namun, tabel database "assignment_submissions" belum dibuat di Supabase Cloud. Mohon minta Guru/Admin untuk menjalankan SQL migrasi "add_assignment_submissions.sql" di Supabase SQL Editor.');
          onSuccess();
          return;
        }

        throw new Error(cloudError.message || 'Gagal menyimpan ke server');
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

  const hasAnyContent = textResponse.trim().length > 0 || !!selectedFile || linkUrl.trim().length > 0 || !!existingSubmission?.file_url || !!existingSubmission?.link;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
      {/* Hidden Native File Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={pdfInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/80">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Lembar Tugas Siswa
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
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Graded Feedback Banner (If already graded by teacher) */}
          {isGraded && (
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl shadow-xs">
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

          {/* Teacher Assignment Instructions & Material Reference */}
          {assignment.description && (
            <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Petunjuk Pengerjaan Guru:
              </span>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {assignment.description}
              </p>
              {assignment.link && (
                <div className="pt-1.5">
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

          {/* ========================================================= */}
          {/* AI CHAT-STYLE SUBMISSION WORKSPACE (Prompt Box ala ChatGPT) */}
          {/* ========================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Jawaban & Lampiran Tugas</span>
                <span className="text-[10px] font-normal text-slate-400">(Teks, Foto Kamera, PDF, atau Link)</span>
              </label>
              {existingSubmission && (
                <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Pernah dikumpulkan
                </span>
              )}
            </div>

            {/* The Floating AI Prompt Container */}
            <div className="relative bg-slate-50/70 hover:bg-white focus-within:bg-white border-2 border-slate-200/90 hover:border-indigo-300 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-100/60 rounded-3xl p-3 sm:p-4 transition-all shadow-xs flex flex-col">
              
              {/* Attachment Preview Chips Row (Inside Chat Input) */}
              <div className="flex flex-wrap items-center gap-2 mb-2 empty:hidden">
                {/* 1. Newly Selected File Chip */}
                {selectedFile && (
                  <div className="flex items-center gap-2 bg-indigo-50/90 text-indigo-900 border border-indigo-200/80 px-3 py-1.5 rounded-2xl text-xs max-w-full">
                    {selectedFile.type.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold truncate max-w-[160px] sm:max-w-[220px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-indigo-500 font-mono">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                    {compressionResult?.previewUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewModalOpen(true)}
                        className="p-1 hover:bg-indigo-100 rounded-lg text-indigo-600 cursor-pointer"
                        title="Lihat Pratinjau Foto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveSelectedFile}
                      className="p-1 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Berkas"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 2. Existing File from Cloud Chip (if not replaced and not removed) */}
                {existingSubmission?.file_url && !selectedFile && !isExistingFileRemoved && (
                  <div className="flex items-center gap-2 bg-slate-100 text-slate-800 border border-slate-300 px-3 py-1.5 rounded-2xl text-xs max-w-full">
                    {existingSubmission.file_type?.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span className="font-semibold truncate max-w-[160px] sm:max-w-[200px]">
                      {existingSubmission.file_name || 'Berkas Terlampir'}
                    </span>
                    <a
                      href={existingSubmission.file_url}
                      target="_blank"
                      rel="noreferrer"
                      referrerPolicy="no-referrer"
                      className="p-1 hover:bg-slate-200 text-indigo-600 rounded-lg cursor-pointer"
                      title="Buka Berkas"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer pl-1"
                    >
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsExistingFileRemoved(true)}
                      className="p-1 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Berkas Ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 3. External Link Chip */}
                {linkUrl && (
                  <div className="flex items-center gap-2 bg-violet-50 text-violet-900 border border-violet-200 px-3 py-1.5 rounded-2xl text-xs max-w-full">
                    <Globe className="w-4 h-4 text-violet-600 shrink-0" />
                    <span className="font-semibold truncate max-w-[160px] sm:max-w-[220px]">
                      {linkUrl}
                    </span>
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 hover:bg-violet-100 text-violet-600 rounded-lg cursor-pointer"
                      title="Tes Buka Tautan"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={handleRemoveLink}
                      className="p-1 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Tautan"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Text Area (Spacious Chat Input) */}
              <textarea
                ref={textareaRef}
                rows={4}
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                placeholder="Tuliskan jawaban tugas Anda di sini, ketik penjelasan, atau klik tombol (+) di bawah untuk melampirkan foto kamera, gambar galeri, dokumen PDF, atau tautan (Google Drive / Canva)..."
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none resize-none min-h-[90px] leading-relaxed"
              />

              {/* Bottom Action Bar inside Prompt Box */}
              <div className="pt-3 mt-1 border-t border-slate-200/60 flex items-center justify-between gap-2">
                {/* Left Side: Plus Button & Quick Shortcuts */}
                <div className="flex items-center gap-2 relative" ref={attachMenuRef}>
                  {/* The Plus (+) Button with Rotating Animation */}
                  <button
                    type="button"
                    onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                      isAttachMenuOpen
                        ? 'bg-indigo-600 text-white rotate-45 scale-105'
                        : 'bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300'
                    }`}
                    title="Tambah Lampiran (Kamera, Galeri, Dokumen, Link)"
                  >
                    <Plus className="w-5 h-5 transition-transform" />
                  </button>

                  {/* Popover Attachment Menu */}
                  <AnimatePresence>
                    {isAttachMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-12 left-0 w-64 bg-white/98 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-2 z-40 space-y-1"
                      >
                        <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Pilih Jenis Lampiran
                        </div>

                        {/* 1. Kamera Langsung */}
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors text-left cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-tight">Ambil Foto (Kamera)</p>
                            <p className="text-[10px] text-slate-400">Jepret langsung lembar tugas</p>
                          </div>
                        </button>

                        {/* 2. Galeri Foto */}
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors text-left cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-tight">Galeri Gambar</p>
                            <p className="text-[10px] text-slate-400">Pilih berkas JPG, PNG, WebP</p>
                          </div>
                        </button>

                        {/* 3. Dokumen PDF */}
                        <button
                          type="button"
                          onClick={() => pdfInputRef.current?.click()}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition-colors text-left cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-rose-100 group-hover:bg-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-tight">Dokumen PDF</p>
                            <p className="text-[10px] text-slate-400">Unggah berkas lembar PDF</p>
                          </div>
                        </button>

                        {/* 4. Tautan Link */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsAttachMenuOpen(false);
                            setIsLinkModalOpen(true);
                          }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-violet-50 text-slate-700 hover:text-violet-700 transition-colors text-left cursor-pointer group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-violet-100 group-hover:bg-violet-200 text-violet-600 flex items-center justify-center shrink-0">
                            <Link2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-tight">Tautan Link</p>
                            <p className="text-[10px] text-slate-400">Google Drive, Canva, Docs, dll</p>
                          </div>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Desktop Quick Badges (Optional fast shortcuts) */}
                  <div className="hidden sm:flex items-center gap-1.5 pl-1 text-[11px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 hover:text-emerald-600 transition-colors"
                      title="Ambil Kamera"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                      title="Galeri Gambar"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
                      title="Dokumen PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLinkModalOpen(true)}
                      className="p-1.5 hover:bg-slate-200/60 rounded-lg text-slate-500 hover:text-violet-600 transition-colors"
                      title="Sematkan Link"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Side: Send / Submit Button (Ala AI Chat Send Icon) */}
                <button
                  type="submit"
                  disabled={submitting || isCompressing || !hasAnyContent}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-indigo-200/70 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengirimkan...</span>
                    </>
                  ) : (
                    <>
                      <span>{existingSubmission ? 'Perbarui Tugas' : 'Kirim Tugas'}</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submission Timing Notes */}
          {existingSubmission && (
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 px-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Terakhir dikirim: {new Date(existingSubmission.submitted_at || '').toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}
        </form>
      </motion.div>

      {/* ========================================================= */}
      {/* LINK INPUT MODAL / DIALOG */}
      {/* ========================================================= */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Sematkan Tautan Tugas</h4>
                  <p className="text-[11px] text-slate-400">Google Drive, Canva, Docs, Figma, dll.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  URL / Alamat Link
                </label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 bg-slate-50/50">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={linkInputVal}
                    onChange={(e) => setLinkInputVal(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    autoFocus
                    className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                  <span>Pastikan setelan link dapat diakses oleh siapa saja (publik/bukan privat) agar guru dapat melihatnya.</span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Terapkan Tautan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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
