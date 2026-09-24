import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon, 
  Award, 
  Loader2, 
  Save, 
  Eye, 
  Users, 
  Check, 
  ChevronRight,
  ChevronLeft,
  Link2,
  Globe,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Assignment, AssignmentSubmission, Student } from '../types';
import { supabase } from '../lib/supabase';
import { formatFileSize, getOptimizedMediaUrl } from '../utils/fileCompressor';

interface SubmissionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  studentsInClass: Student[];
  onGradeSaved?: () => void;
}

export default function SubmissionReviewModal({
  isOpen,
  onClose,
  assignment,
  studentsInClass,
  onGradeSaved
}: SubmissionReviewModalProps) {
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [filterTab, setFilterTab] = useState<'all' | 'submitted' | 'unsubmitted' | 'graded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Grading form state
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeSuccessMsg, setGradeSuccessMsg] = useState<string | null>(null);
  const [gradeErrorMsg, setGradeErrorMsg] = useState<string | null>(null);

  // Full image preview
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [imgLoadError, setImgLoadError] = useState(false);

  useEffect(() => {
    if (isOpen && assignment?.id) {
      setMobileView('list');
      fetchSubmissions();
    }
  }, [isOpen, assignment?.id]);

  const fetchSubmissions = async () => {
    if (!assignment?.id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('assignment_id', assignment.id);

      if (error) throw error;
      let subList = (data as AssignmentSubmission[]) || [];

      // Also merge local submissions if present in browser
      try {
        const rawLocal = localStorage.getItem('eduverse_local_submissions');
        if (rawLocal) {
          const localMap = JSON.parse(rawLocal);
          const localItems = (Object.values(localMap) as AssignmentSubmission[]).filter(
            s => s.assignment_id === assignment.id
          );
          const existingIds = new Set(subList.map(s => s.student_id));
          localItems.forEach(l => {
            if (!existingIds.has(l.student_id)) {
              subList.push(l);
            }
          });
        }
      } catch {
        // ignore
      }

      setSubmissions(subList);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fallback cloud students for assignment class
  const [cloudClassStudents, setCloudClassStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (isOpen && assignment?.class_id) {
      supabase
        .from('students')
        .select('*')
        .eq('class_id', assignment.class_id)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setCloudClassStudents(data as Student[]);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, assignment?.class_id]);

  // Robust matcher for finding a student's submission across all possible ID / code / name variants
  const getSubForStudent = React.useCallback((student: Student | null | undefined): AssignmentSubmission | undefined => {
    if (!student) return undefined;
    const sId = student.id;
    const sCode = student.student_code?.trim().toLowerCase();
    const sIdSiswa = (student as any).id_siswa;
    const sIdAlt = (student as any).idSiswa;
    const sName = (student.name || (student as any).nama)?.trim().toLowerCase();

    return submissions.find(sub => {
      if (sId && sub.student_id === sId) return true;
      if (sIdSiswa && sub.student_id === sIdSiswa) return true;
      if (sIdAlt && sub.student_id === sIdAlt) return true;
      if (sCode && sub.student_code && sub.student_code.trim().toLowerCase() === sCode) return true;
      if (sName && sub.student_name && sub.student_name.trim().toLowerCase() === sName) return true;
      return false;
    });
  }, [submissions]);

  // Combine students: props + cloud class students + anyone who submitted
  const combinedStudents = React.useMemo(() => {
    const list: Student[] = [];
    const seenKeys = new Set<string>();

    const addStudentToList = (s: any) => {
      const resolvedId = s.id || s.id_siswa || s.idSiswa || s.student_id || s.student_code || (s.name ? `student_${s.name}` : '');
      const codeKey = s.student_code ? `code_${s.student_code.toLowerCase()}` : '';
      const nameKey = s.name ? `name_${s.name.trim().toLowerCase()}` : '';

      if (resolvedId && seenKeys.has(resolvedId)) return;
      if (codeKey && seenKeys.has(codeKey)) return;

      if (resolvedId) seenKeys.add(resolvedId);
      if (codeKey) seenKeys.add(codeKey);
      if (nameKey) seenKeys.add(nameKey);

      list.push({
        ...s,
        id: resolvedId,
        name: s.name || s.nama || 'Siswa',
        student_code: s.student_code || s.nisn || '-'
      } as Student);
    };

    // 1. Add students from props
    studentsInClass.forEach(addStudentToList);

    // 2. Add students from cloud class query
    cloudClassStudents.forEach(addStudentToList);

    // 3. Guarantee EVERY student who submitted is included
    submissions.forEach(sub => {
      addStudentToList({
        id: sub.student_id,
        name: sub.student_name || 'Siswa',
        student_code: sub.student_code || '-',
        class_id: sub.class_id || assignment?.class_id || '',
        school_id: sub.school_id || assignment?.school_id || ''
      });
    });

    return list;
  }, [studentsInClass, cloudClassStudents, submissions, assignment]);

  // Auto-select first student (preferring one who already submitted)
  useEffect(() => {
    if (combinedStudents.length > 0 && !selectedStudentId) {
      const firstSubmitted = combinedStudents.find(s => !!getSubForStudent(s));
      const chosen = firstSubmitted || combinedStudents[0];
      setSelectedStudentId(chosen.id || null);
    }
  }, [combinedStudents, selectedStudentId, getSubForStudent]);

  // Resolve selected student
  const selectedStudent = React.useMemo(() => {
    if (!combinedStudents.length) return null;
    if (!selectedStudentId) return combinedStudents[0];
    return combinedStudents.find(s => 
      s.id === selectedStudentId || 
      (s as any).id_siswa === selectedStudentId ||
      (s as any).idSiswa === selectedStudentId ||
      s.student_code === selectedStudentId
    ) || combinedStudents[0];
  }, [combinedStudents, selectedStudentId]);

  // Resolve selected submission
  const selectedSubmission = React.useMemo(() => {
    return getSubForStudent(selectedStudent);
  }, [selectedStudent, getSubForStudent]);

  // Sync grading form when selected student or submission changes
  useEffect(() => {
    if (selectedSubmission) {
      setScoreInput(selectedSubmission.score !== null && selectedSubmission.score !== undefined ? String(selectedSubmission.score) : '');
      setFeedbackInput(selectedSubmission.feedback || '');
    } else {
      setScoreInput('');
      setFeedbackInput('');
    }
    setGradeSuccessMsg(null);
    setGradeErrorMsg(null);
    setImgLoadError(false);
  }, [selectedStudent, selectedSubmission]);

  if (!isOpen || !assignment) return null;

  // Filter students
  const filteredStudents = combinedStudents.filter(student => {
    const sName = student.name || '';
    const sCode = student.student_code || '';
    const matchesSearch = sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    const sub = getSubForStudent(student);
    if (filterTab === 'submitted') return !!sub;
    if (filterTab === 'unsubmitted') return !sub;
    if (filterTab === 'graded') return sub?.status === 'graded' && sub.score !== null;
    return true;
  });

  const totalStudents = combinedStudents.length;
  const submittedCount = submissions.length;
  const gradedCount = submissions.filter(s => s.status === 'graded' && s.score !== null).length;

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedSubmission?.id) return;

    const numScore = parseFloat(scoreInput);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      setGradeErrorMsg('Nilai harus berupa angka antara 0 hingga 100.');
      return;
    }

    try {
      setSavingGrade(true);
      setGradeErrorMsg(null);
      setGradeSuccessMsg(null);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          score: numScore,
          feedback: feedbackInput.trim() || null,
          status: 'graded',
          graded_at: new Date().toISOString(),
          graded_by: user?.id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      setGradeSuccessMsg('Nilai & catatan berhasil disimpan!');
      await fetchSubmissions();
      if (onGradeSaved) onGradeSaved();

      setTimeout(() => {
        setGradeSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error saving grade:', err);
      setGradeErrorMsg(err.message || 'Gagal menyimpan nilai.');
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/65 backdrop-blur-sm overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col h-[94vh] sm:h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              {mobileView === 'detail' && (
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors cursor-pointer mr-1"
                  title="Kembali ke Daftar Murid"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <span className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                Pemeriksaan Tugas
              </span>
              <span className="text-xs font-bold text-slate-500 truncate">
                {submittedCount} dari {totalStudents} Siswa Mengumpulkan ({gradedCount} Dinilai)
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              {assignment.title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Header Stats Strip */}
        <div className="px-4 sm:px-6 py-2.5 bg-indigo-50/40 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap text-xs font-bold text-slate-600 shrink-0">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Terkumpul: <b className="text-slate-900">{submittedCount}</b>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Belum: <b className="text-slate-900">{totalStudents - submittedCount}</b>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              Dinilai: <b className="text-slate-900">{gradedCount}</b>
            </span>
          </div>

          {/* Quick Filter tabs */}
          <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] overflow-x-auto max-w-full">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${filterTab === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Semua ({totalStudents})
            </button>
            <button
              onClick={() => setFilterTab('submitted')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${filterTab === 'submitted' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Mengumpulkan ({submittedCount})
            </button>
            <button
              onClick={() => setFilterTab('graded')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${filterTab === 'graded' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Dinilai ({gradedCount})
            </button>
            <button
              onClick={() => setFilterTab('unsubmitted')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${filterTab === 'unsubmitted' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Belum ({totalStudents - submittedCount})
            </button>
          </div>
        </div>

        {/* Main Content: Two Columns with Mobile View Switching */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Student List */}
          <div className={`${mobileView === 'detail' ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-slate-100 flex-col shrink-0 bg-slate-50/30 overflow-hidden`}>
            {/* Search input */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari murid..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mb-2" />
                  <span>Memuat data pengumpulan...</span>
                </div>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const sub = getSubForStudent(student);
                  const isSelected = selectedStudent && (
                    student.id === selectedStudent.id ||
                    (student.student_code && student.student_code === selectedStudent.student_code)
                  );
                  const isGraded = sub?.status === 'graded' && sub?.score !== null;

                  return (
                    <button
                      key={student.id || student.student_code || student.name}
                      onClick={() => {
                        setSelectedStudentId(student.id || null);
                        setMobileView('detail');
                      }}
                      className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                          : 'hover:bg-slate-100 text-slate-700 bg-white border border-slate-200/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          {student.name}
                        </p>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {student.student_code ? `NIS: ${student.student_code}` : 'No NIS'}
                        </p>
                      </div>

                      {/* Right Status Indicator */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isGraded ? (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-white text-indigo-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            Nilai: {sub.score}
                          </span>
                        ) : sub ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isSelected ? 'bg-indigo-500 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            <Check className="w-3 h-3" />
                            Terkumpul
                          </span>
                        ) : (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-indigo-700 text-indigo-200' : 'bg-slate-100 text-slate-400'
                          }`}>
                            Belum
                          </span>
                        )}
                        <ChevronRight className={`w-4 h-4 md:hidden ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 font-semibold">
                  Tidak ada murid yang sesuai filter.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Submission Details & Grading */}
          <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-white`}>
            {/* Mobile Back Button to return to list */}
            <div className="md:hidden flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Daftar Murid</span>
              </button>
              {selectedStudent && (
                <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">
                  {selectedStudent.name}
                </span>
              )}
            </div>

            {selectedStudent ? (
              <div className="space-y-6 max-w-3xl">
                {/* Student Info & Submission State Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Lembar Jawaban Murid</span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">{selectedStudent.name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">NIS: {selectedStudent.student_code || '-'}</p>
                  </div>

                  <div>
                    {selectedSubmission ? (
                      <div className="flex flex-col items-end">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border ${
                          selectedSubmission.status === 'late'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {selectedSubmission.status === 'late' ? 'Dikumpulkan (Terlambat)' : 'Dikumpulkan Tepat Waktu'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(selectedSubmission.submitted_at).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        Belum Mengumpulkan
                      </span>
                    )}
                  </div>
                </div>

                {/* If Not Submitted Yet */}
                {!selectedSubmission && (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                    <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">Murid belum mengirimkan tugas</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Hasil pekerjaan murid akan otomatis muncul di halaman ini setelah mereka mengumpulkan via portal siswa.
                    </p>
                  </div>
                )}

                {/* If Submitted: Show Content */}
                {selectedSubmission && (() => {
                  const resolvedLink = selectedSubmission.link || (() => {
                    if (!selectedSubmission.text_response) return null;
                    const match = selectedSubmission.text_response.match(/\[Tautan Tugas\]:\s*(\S+)/i);
                    return match ? match[1] : null;
                  })();

                  const cleanTextResponse = selectedSubmission.text_response
                    ? selectedSubmission.text_response.replace(/\[Tautan Tugas\]:\s*\S+/i, '').trim()
                    : null;

                  return (
                    <div className="space-y-6">
                      {/* Text Answer */}
                      {cleanTextResponse ? (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-600" />
                            <span>Jawaban Tertulis Siswa</span>
                          </label>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium select-text">
                            {cleanTextResponse}
                          </div>
                        </div>
                      ) : !resolvedLink && !selectedSubmission.file_url ? (
                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-400 italic">
                          Tidak ada catatan teks tertulis.
                        </div>
                      ) : null}

                      {/* Attached External Link (Google Drive, Canva, Docs, Figma, etc.) */}
                      {resolvedLink && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Link2 className="w-4 h-4 text-violet-600" />
                            <span>Tautan Tugas Siswa (Link)</span>
                          </label>
                          <div className="p-4 bg-gradient-to-r from-violet-50/70 via-indigo-50/50 to-blue-50/70 rounded-2xl border border-violet-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Globe className="w-5 h-5" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-800 truncate select-all">
                                  {resolvedLink}
                                </p>
                                <p className="text-[11px] text-slate-500">Tautan Eksternal Tugas (Google Drive / Canva / Dokumen)</p>
                              </div>
                            </div>
                            <a
                              href={resolvedLink.startsWith('http') ? resolvedLink : `https://${resolvedLink}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                            >
                              <span>Buka Tautan</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Attached File (Image / PDF) */}
                      {selectedSubmission.file_url && (() => {
                        const isImageFile = 
                          selectedSubmission.file_type?.startsWith('image/') || 
                          selectedSubmission.file_url.startsWith('data:image/') ||
                          selectedSubmission.file_url.match(/\.(jpeg|jpg|png|webp|gif)/i) ||
                          selectedSubmission.file_name?.match(/\.(jpeg|jpg|png|webp|gif)/i);

                        const displayImageUrl = getOptimizedMediaUrl(
                          selectedSubmission.file_url,
                          selectedSubmission.file_type,
                          selectedSubmission.file_name
                        );

                        return (
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              {isImageFile ? (
                                <ImageIcon className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <FileText className="w-4 h-4 text-rose-600" />
                              )}
                              <span>Berkas Lampiran Tugas</span>
                              {selectedSubmission.file_size && (
                                <span className="text-[10px] font-normal text-slate-400">
                                  ({formatFileSize(selectedSubmission.file_size)})
                                </span>
                              )}
                            </label>

                            {/* Image Preview */}
                            {isImageFile ? (
                              <div className="bg-slate-900/5 p-4 rounded-2xl border border-slate-200 space-y-3">
                                <div className="relative max-h-96 overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center min-h-[180px] p-2">
                                  {!imgLoadError ? (
                                    <img
                                      src={displayImageUrl}
                                      alt={selectedSubmission.file_name || 'Foto Tugas Siswa'}
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        if (target.src.includes('weserv.nl') && selectedSubmission.file_url) {
                                          target.src = selectedSubmission.file_url;
                                        } else {
                                          setImgLoadError(true);
                                        }
                                      }}
                                      className="max-h-80 w-auto object-contain rounded-lg shadow-sm"
                                    />
                                  ) : (
                                    <div className="p-6 text-center space-y-2">
                                      <ImageIcon className="w-10 h-10 text-slate-400 mx-auto" />
                                      <p className="text-xs font-bold text-slate-700">Foto Tugas Tersimpan di Cloud</p>
                                      <p className="text-[11px] text-slate-500 max-w-sm">
                                        {selectedSubmission.file_name || 'Foto Tugas Murid'}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Always Visible Action Buttons (Desktop & Mobile) */}
                                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 border-t border-slate-200/60">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImageUrl(displayImageUrl)}
                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>Perbesar Foto</span>
                                  </button>
                                  <a
                                    href={displayImageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    referrerPolicy="no-referrer"
                                    download={selectedSubmission.file_name || 'tugas-siswa.jpg'}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    <span>Buka di Tab Baru</span>
                                  </a>
                                  <a
                                    href={displayImageUrl}
                                    download={selectedSubmission.file_name || 'tugas-siswa.jpg'}
                                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Unduh Foto</span>
                                  </a>
                                </div>
                              </div>
                            ) : (
                              /* PDF Document Card */
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6" />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs font-bold text-slate-800 truncate">
                                      {selectedSubmission.file_name || 'Dokumen PDF Tugas'}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                      Format PDF {selectedSubmission.file_size ? `• ${formatFileSize(selectedSubmission.file_size)}` : ''}
                                    </p>
                                  </div>
                                </div>

                                <a
                                  href={selectedSubmission.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  referrerPolicy="no-referrer"
                                  download={selectedSubmission.file_name || 'dokumen-tugas.pdf'}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                                >
                                  <span>Buka / Unduh Dokumen PDF</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Teacher Grading & Feedback Form */}
                      <form onSubmit={handleSaveGrade} className="pt-4 border-t border-slate-100 space-y-4">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-indigo-600" />
                          <h4 className="text-sm font-bold text-slate-800">Penilaian Guru</h4>
                        </div>

                        {/* Success / Error Alerts */}
                        {gradeSuccessMsg && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{gradeSuccessMsg}</span>
                          </div>
                        )}
                        {gradeErrorMsg && (
                          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>{gradeErrorMsg}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div className="sm:col-span-1 space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">
                              Nilai (0 - 100)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="any"
                              value={scoreInput}
                              onChange={(e) => setScoreInput(e.target.value)}
                              placeholder="Contoh: 90"
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                            />
                          </div>

                          <div className="sm:col-span-3 space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">
                              Catatan / Evaluasi untuk Siswa
                            </label>
                            <input
                              type="text"
                              value={feedbackInput}
                              onChange={(e) => setFeedbackInput(e.target.value)}
                              placeholder="Tuliskan apresiasi, koreksi, atau masukan pengerjaan..."
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            disabled={savingGrade}
                            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {savingGrade ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Menyimpan...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span>Simpan Nilai & Catatan</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                <Users className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs font-bold">Pilih murid di panel kiri untuk memeriksa jawaban.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Full Photo Zoom Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="relative max-w-4xl max-h-[92vh] bg-slate-900 rounded-3xl overflow-hidden p-2 flex flex-col items-center">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-2.5 rounded-full transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImageUrl} 
              alt="Foto Diperbesar" 
              referrerPolicy="no-referrer"
              className="max-h-[85vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
