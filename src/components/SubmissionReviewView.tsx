import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  Maximize2, 
  X, 
  Loader2, 
  Check, 
  ExternalLink,
  Download
} from 'lucide-react';
import { Assignment, AssignmentSubmission, Student, ClassEntity } from '../types';
import { supabase } from '../lib/supabase';
import { formatFileSize, getOptimizedMediaUrl } from '../utils/fileCompressor';
import { parseLkpdResponse, OBSERVATION_PRESETS } from '../utils/lkpdPresets';

interface SubmissionReviewViewProps {
  assignment: (Assignment & {
    ids?: string[];
    classIds?: string[];
    assignmentByClass?: Record<string, Assignment>;
  }) | null;
  classes: ClassEntity[];
  allStudents: Student[];
  onBack: () => void;
  onGradeSaved?: () => void;
}

export default function SubmissionReviewView({
  assignment,
  classes,
  allStudents,
  onBack,
  onGradeSaved
}: SubmissionReviewViewProps) {
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

  // Assigned classes for this assignment
  const assignedClasses = useMemo(() => {
    if (!assignment) return [];
    const cids: string[] = assignment.classIds && assignment.classIds.length > 0
      ? assignment.classIds
      : [assignment.class_id || (assignment as any).classId].filter(Boolean);

    if (cids.length === 0) {
      return classes;
    }

    const matched = classes.filter(c => cids.includes(c.id));
    if (matched.length === 0) {
      return cids.map(cid => ({ id: cid, name: `Kelas ${cid}` } as ClassEntity));
    }
    return matched;
  }, [assignment, classes]);

  const [selectedClassId, setSelectedClassId] = useState<string>('');

  useEffect(() => {
    if (assignedClasses.length > 0) {
      if (!selectedClassId || !assignedClasses.some(c => c.id === selectedClassId)) {
        setSelectedClassId(assignedClasses[0].id);
      }
    }
  }, [assignedClasses, selectedClassId]);

  // All assignment IDs belonging to this grouped assignment
  const allAssignmentIds = useMemo(() => {
    if (!assignment) return [];
    if (assignment.ids && Array.isArray(assignment.ids) && assignment.ids.length > 0) {
      return assignment.ids;
    }
    return assignment.id ? [assignment.id] : [];
  }, [assignment]);

  // Fetch submissions across all assignment IDs
  const fetchSubmissions = useCallback(async () => {
    if (allAssignmentIds.length === 0) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .in('assignment_id', allAssignmentIds);

      if (error) throw error;
      let subList = (data as AssignmentSubmission[]) || [];

      // Also merge local submissions if present
      try {
        const rawLocal = localStorage.getItem('eduverse_local_submissions');
        if (rawLocal) {
          const localMap = JSON.parse(rawLocal);
          const localItems = (Object.values(localMap) as AssignmentSubmission[]).filter(
            s => allAssignmentIds.includes(s.assignment_id)
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
  }, [allAssignmentIds]);

  useEffect(() => {
    if (allAssignmentIds.length > 0) {
      fetchSubmissions();
    }
  }, [allAssignmentIds, fetchSubmissions]);

  // Fallback cloud students query for selected class
  const [cloudClassStudents, setCloudClassStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (selectedClassId) {
      supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClassId)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setCloudClassStudents(data as Student[]);
          } else {
            setCloudClassStudents([]);
          }
        }, () => {});
    }
  }, [selectedClassId]);

  // Matcher for finding a student's submission
  const getSubForStudent = useCallback((student: Student | null | undefined): AssignmentSubmission | undefined => {
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

  // Combine students for selected class
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];

    const list: Student[] = [];
    const seenKeys = new Set<string>();

    const addStudentToList = (s: any) => {
      const sClassId = s.class_id || s.classId;
      if (sClassId && sClassId !== selectedClassId) return;

      const resolvedId = s.id || s.id_siswa || s.idSiswa || s.student_id || s.student_code || (s.name ? `student_${s.name}` : '');
      const codeKey = s.student_code ? `code_${s.student_code.toLowerCase()}` : '';
      const nameKey = s.name ? `name_${s.name.trim().toLowerCase()}` : '';

      if (resolvedId && seenKeys.has(resolvedId)) return;
      if (codeKey && seenKeys.has(codeKey)) return;
      if (nameKey && seenKeys.has(nameKey)) return;

      if (resolvedId) seenKeys.add(resolvedId);
      if (codeKey) seenKeys.add(codeKey);
      if (nameKey) seenKeys.add(nameKey);

      list.push({
        ...s,
        id: resolvedId,
        name: s.name || s.nama || 'Murid',
        student_code: s.student_code || s.nisn || '-'
      } as Student);
    };

    allStudents.filter(s => (s.class_id || (s as any).classId) === selectedClassId).forEach(addStudentToList);
    cloudClassStudents.forEach(addStudentToList);
    submissions.forEach(sub => {
      if (sub.class_id === selectedClassId) {
        addStudentToList({
          id: sub.student_id,
          name: sub.student_name || 'Murid',
          student_code: sub.student_code || '-',
          class_id: selectedClassId
        });
      }
    });

    return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allStudents, cloudClassStudents, submissions, selectedClassId]);

  // Auto-select first student when class or students change
  useEffect(() => {
    if (classStudents.length > 0) {
      if (!selectedStudentId || !classStudents.some(s => s.id === selectedStudentId)) {
        const firstSubmitted = classStudents.find(s => !!getSubForStudent(s));
        const chosen = firstSubmitted || classStudents[0];
        setSelectedStudentId(chosen.id || null);
      }
    } else {
      setSelectedStudentId(null);
    }
  }, [classStudents, selectedClassId, selectedStudentId, getSubForStudent]);

  // Selected student object
  const selectedStudent = useMemo(() => {
    if (!classStudents.length) return null;
    if (!selectedStudentId) return classStudents[0];
    return classStudents.find(s => 
      s.id === selectedStudentId || 
      (s as any).id_siswa === selectedStudentId ||
      (s as any).idSiswa === selectedStudentId ||
      s.student_code === selectedStudentId
    ) || classStudents[0];
  }, [classStudents, selectedStudentId]);

  // Selected submission object
  const selectedSubmission = useMemo(() => {
    return getSubForStudent(selectedStudent);
  }, [selectedStudent, getSubForStudent]);

  // Sync grading form
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

  // Exact per-class statistics for UI
  const totalMurid = classStudents.length;
  const submittedMuridList = useMemo(() => {
    return classStudents.filter(s => !!getSubForStudent(s));
  }, [classStudents, getSubForStudent]);
  const submittedCount = submittedMuridList.length;
  const gradedCount = useMemo(() => {
    return submittedMuridList.filter(s => {
      const sub = getSubForStudent(s);
      return sub?.status === 'graded' && sub?.score !== null && sub?.score !== undefined;
    }).length;
  }, [submittedMuridList, getSubForStudent]);

  // Filtered murid list
  const filteredStudents = useMemo(() => {
    return classStudents.filter(student => {
      const sName = student.name || '';
      const sCode = student.student_code || '';
      const matchesSearch = sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sCode.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const sub = getSubForStudent(student);
      if (filterTab === 'submitted') return !!sub;
      if (filterTab === 'unsubmitted') return !sub;
      if (filterTab === 'graded') return sub?.status === 'graded' && sub?.score !== null && sub?.score !== undefined;
      return true;
    });
  }, [classStudents, searchQuery, filterTab, getSubForStudent]);

  // Next and Previous student navigation
  const currentIndex = useMemo(() => {
    if (!selectedStudent) return -1;
    return filteredStudents.findIndex(s => s.id === selectedStudent.id);
  }, [filteredStudents, selectedStudent]);

  const handlePrevStudent = () => {
    if (currentIndex > 0) {
      setSelectedStudentId(filteredStudents[currentIndex - 1].id || null);
    }
  };

  const handleNextStudent = () => {
    if (currentIndex >= 0 && currentIndex < filteredStudents.length - 1) {
      setSelectedStudentId(filteredStudents[currentIndex + 1].id || null);
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !assignment) return;

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
      const targetAssignmentId = assignment.assignmentByClass?.[selectedClassId]?.id || assignment.id;

      const submissionPayload: any = {
        assignment_id: targetAssignmentId,
        student_id: selectedStudent.id,
        student_name: selectedStudent.name,
        student_code: selectedStudent.student_code || '-',
        school_id: assignment.school_id || null,
        class_id: selectedClassId || selectedStudent.class_id || null,
        score: numScore,
        feedback: feedbackInput.trim() || null,
        status: 'graded',
        text_response: selectedSubmission?.text_response || '[Penilaian Manual Guru]',
        link: selectedSubmission?.link || null,
        file_url: selectedSubmission?.file_url || null,
        file_name: selectedSubmission?.file_name || null,
        file_type: selectedSubmission?.file_type || null,
        file_size: selectedSubmission?.file_size || null,
        submitted_at: selectedSubmission?.submitted_at || new Date().toISOString(),
        graded_at: new Date().toISOString(),
        graded_by: user?.id || null,
        updated_at: new Date().toISOString()
      };

      if (selectedSubmission?.id) {
        submissionPayload.id = selectedSubmission.id;
      }

      const { data: upsertedRows, error } = await supabase
        .from('assignment_submissions')
        .upsert(submissionPayload, { onConflict: 'assignment_id,student_id' })
        .select();

      const finalSavedItem: AssignmentSubmission = (upsertedRows && upsertedRows[0]) 
        ? (upsertedRows[0] as AssignmentSubmission) 
        : { ...submissionPayload, id: selectedSubmission?.id || crypto.randomUUID() };

      if (error) {
        console.error('Supabase upsert error:', error);
        setGradeErrorMsg(`Gagal menyimpan: ${error.message}`);
      } else {
        setGradeSuccessMsg('Nilai & catatan berhasil disimpan!');
      }

      setSubmissions(prev => {
        const idx = prev.findIndex(s => 
          (finalSavedItem.id && s.id === finalSavedItem.id) || 
          (s.student_id === selectedStudent.id && allAssignmentIds.includes(s.assignment_id))
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...finalSavedItem };
          return next;
        } else {
          return [...prev, finalSavedItem];
        }
      });

      if (onGradeSaved) onGradeSaved();
      setTimeout(() => setGradeSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error saving grade:', err);
      setGradeErrorMsg(err.message || 'Gagal menyimpan nilai.');
    } finally {
      setSavingGrade(false);
    }
  };

  if (!assignment) return null;

  // LKPD data parser
  const parsedLkpd = useMemo(() => {
    if (!selectedSubmission?.text_response) return null;
    return parseLkpdResponse(selectedSubmission.text_response);
  }, [selectedSubmission]);

  const lkpdConfig = assignment.lkpd_config || OBSERVATION_PRESETS.art_elements;
  const aspects = lkpdConfig.aspects || OBSERVATION_PRESETS.art_elements.aspects;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar - Clean & Roomy */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Tugas</span>
          </button>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                {assignment.assignment_type === 'lkpd' ? 'LKPD Observasi' : 'Pemeriksaan Tugas'}
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-700">
                {submittedCount} / {totalMurid} Terkumpul ({gradedCount} Dinilai)
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {assignment.title}
            </h1>
          </div>
        </div>

        {/* Assigned Classes Filter if > 1 */}
        {assignedClasses.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
            {assignedClasses.map(cls => (
              <button
                key={cls.id}
                type="button"
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedClassId === cls.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main 2-Column Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Left Column: Student List (320px) */}
        <aside className={`w-full md:w-80 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col shrink-0 overflow-hidden ${
          mobileView === 'detail' ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Search & Tabs */}
          <div className="p-3.5 border-b border-slate-100 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari siswa atau NISN..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-400 transition-colors"
              />
            </div>

            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg text-[11px] font-medium text-slate-600 text-center">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`py-1 rounded-md transition-colors cursor-pointer ${filterTab === 'all' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('submitted')}
                className={`py-1 rounded-md transition-colors cursor-pointer ${filterTab === 'submitted' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Kumpul
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('graded')}
                className={`py-1 rounded-md transition-colors cursor-pointer ${filterTab === 'graded' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Dinilai
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('unsubmitted')}
                className={`py-1 rounded-md transition-colors cursor-pointer ${filterTab === 'unsubmitted' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'hover:text-slate-900'}`}
              >
                Belum
              </button>
            </div>
          </div>

          {/* Student Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                <span>Memuat data siswa...</span>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada siswa yang sesuai filter.
              </div>
            ) : (
              filteredStudents.map(student => {
                const sub = getSubForStudent(student);
                const isSelected = selectedStudent?.id === student.id;
                const isGraded = sub?.status === 'graded' && sub?.score !== null && sub?.score !== undefined;

                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(student.id || null);
                      setMobileView('detail');
                    }}
                    className={`w-full text-left p-3.5 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-900 text-white' 
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {student.name}
                      </p>
                      <p className={`text-[11px] truncate ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                        NISN: {student.student_code || '-'}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      {isGraded ? (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {sub?.score}
                        </span>
                      ) : sub ? (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-blue-400/20 text-blue-200' : 'bg-blue-50 text-blue-700'
                        }`}>
                          Terkirim
                        </span>
                      ) : (
                        <span className={`text-[10px] font-normal ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>
                          Belum
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Column: Submission Details & Grading Canvas (Flex-1) */}
        <main className={`flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}>
          {selectedStudent ? (
            <>
              {/* Detail Header & Prev/Next Nav */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    className="md:hidden text-slate-500 hover:text-slate-900 p-1"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-slate-900 truncate">
                      {selectedStudent.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      NISN: {selectedStudent.student_code || '-'}
                      {selectedSubmission?.submitted_at && (
                        <span> • Dikirim: {new Date(selectedSubmission.submitted_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Quick Prev / Next Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={currentIndex <= 0}
                    onClick={handlePrevStudent}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Siswa Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-400 font-medium px-1">
                    {currentIndex + 1} / {filteredStudents.length}
                  </span>
                  <button
                    type="button"
                    disabled={currentIndex >= filteredStudents.length - 1}
                    onClick={handleNextStudent}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    title="Siswa Selanjutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Work View */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {selectedSubmission ? (
                  <>
                    {/* Media / Photo Display */}
                    {selectedSubmission.file_url && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          Foto Objek Observasi
                        </span>
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-950 max-w-xl relative group">
                          {!imgLoadError ? (
                            <img
                              src={getOptimizedMediaUrl(selectedSubmission.file_url)}
                              alt="Foto Siswa"
                              className="w-full max-h-80 object-contain bg-slate-950"
                              onError={() => setImgLoadError(true)}
                            />
                          ) : (
                            <div className="p-8 text-center text-xs text-slate-400">
                              Gambar tidak dapat dimuat langsung.
                            </div>
                          )}
                          <div className="absolute bottom-3 right-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewImageUrl(getOptimizedMediaUrl(selectedSubmission.file_url!))}
                              className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-xs cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Perbesar</span>
                            </button>
                            <a
                              href={selectedSubmission.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs"
                              title="Buka Tab Baru"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* LKPD Parsed Content */}
                    {parsedLkpd ? (
                      <div className="space-y-5">
                        {parsedLkpd.object_name && (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                              Nama Objek yang Diamati
                            </span>
                            <p className="text-sm font-bold text-slate-900">
                              {parsedLkpd.object_name}
                            </p>
                          </div>
                        )}

                        <div className="space-y-3">
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                            Hasil Analisis Unsur Rupa
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {aspects.map(asp => (
                              <div key={asp.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                                <span className="text-xs font-bold text-slate-800 block">
                                  {asp.label}
                                </span>
                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                                  {parsedLkpd.answers?.[asp.id] || <span className="text-slate-400 italic">Tidak diisi</span>}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {parsedLkpd.reflection && (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                            <span className="text-xs font-bold text-slate-800 block">
                              Refleksi & Kesimpulan Estetika
                            </span>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                              {parsedLkpd.reflection}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Regular Assignment Response */
                      <div className="space-y-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          Jawaban Siswa
                        </span>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                          {selectedSubmission.text_response || 'Tidak ada teks jawaban.'}
                        </div>
                      </div>
                    )}

                    {/* Attached Link if any */}
                    {selectedSubmission.link && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          Tautan Tugas Siswa
                        </span>
                        <div>
                          <a
                            href={selectedSubmission.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2"
                          >
                            <span>{selectedSubmission.link}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Grading Form Panel */}
                    <div className="pt-6 border-t border-slate-200 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        Penilaian & Umpan Balik Guru
                      </h3>

                      {gradeSuccessMsg && (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                          {gradeSuccessMsg}
                        </div>
                      )}
                      {gradeErrorMsg && (
                        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                          {gradeErrorMsg}
                        </div>
                      )}

                      <form onSubmit={handleSaveGrade} className="space-y-3.5 max-w-xl">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 block">
                            Nilai (0 - 100)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            placeholder="Contoh: 88"
                            value={scoreInput}
                            onChange={e => setScoreInput(e.target.value)}
                            className="w-32 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-900 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 block">
                            Catatan & Masukan untuk Siswa (Opsional)
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Tuliskan catatan evaluasi atau apresiasi untuk siswa..."
                            value={feedbackInput}
                            onChange={e => setFeedbackInput(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition-colors resize-none leading-relaxed"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={savingGrade}
                          className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {savingGrade ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Menyimpan Nilai...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Simpan Nilai</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  /* Student has not submitted yet */
                  <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-sm font-semibold">
                      -
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800">
                        Belum Ada Pengumpulan
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {selectedStudent.name} belum mengirimkan jawaban atau foto observasi untuk tugas ini.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <form onSubmit={handleSaveGrade} className="space-y-3 text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                          Beri Nilai Manual:
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          placeholder="Nilai (0-100)"
                          value={scoreInput}
                          onChange={e => setScoreInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-900 outline-none"
                        />
                        <button
                          type="submit"
                          disabled={savingGrade}
                          className="w-full py-2 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-colors"
                        >
                          Simpan Nilai Manual
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-xs text-slate-400 m-auto">
              Pilih siswa di panel sebelah kiri untuk memeriksa tugas.
            </div>
          )}
        </main>
      </div>

      {/* Full Image Zoom Modal */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImageUrl(null)}
        >
          <button
            onClick={() => setPreviewImageUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img 
            src={previewImageUrl} 
            alt="Preview perbesaran" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
