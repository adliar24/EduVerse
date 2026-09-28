import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  School,
  Sparkles,
  ChevronDown,
  User,
  Clock,
  Award,
  ArrowRight
} from 'lucide-react';
import { Assignment, AssignmentSubmission, Student, ClassEntity } from '../types';
import { supabase } from '../lib/supabase';
import { getOptimizedMediaUrl } from '../utils/fileCompressor';
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

const STUDENTS_PER_PAGE = 7;

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
  const [studentPage, setStudentPage] = useState(1);
  
  // Grading form state
  const [scoreInput, setScoreInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeSuccessMsg, setGradeSuccessMsg] = useState<string | null>(null);
  const [gradeErrorMsg, setGradeErrorMsg] = useState<string | null>(null);

  // Full image preview
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [imgLoadError, setImgLoadError] = useState(false);

  // Ref for scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

      // Merge local submissions backup if available
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

  // Reset page when filter or class changes
  useEffect(() => {
    setStudentPage(1);
  }, [selectedClassId, filterTab, searchQuery]);

  // Auto-select first student when class changes
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
  const unsubmittedCount = Math.max(0, totalMurid - submittedCount);
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

  // Pagination calculations
  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
  const paginatedStudents = useMemo(() => {
    const startIndex = (studentPage - 1) * STUDENTS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + STUDENTS_PER_PAGE);
  }, [filteredStudents, studentPage]);

  // Next and Previous student navigation (across all filtered students)
  const currentIndex = useMemo(() => {
    if (!selectedStudent) return -1;
    return filteredStudents.findIndex(s => s.id === selectedStudent.id);
  }, [filteredStudents, selectedStudent]);

  // Scroll to absolute top on initial view mount and lock outer layout scroll
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // Lock outer layout scroll so ONLY the student answer board scrolls
    const layoutMain = document.querySelector('main.h-screen') as HTMLElement | null;
    if (layoutMain) {
      layoutMain.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const prevOverflowY = layoutMain.style.overflowY;
      layoutMain.style.overflowY = 'hidden';
      return () => {
        layoutMain.style.overflowY = prevOverflowY;
      };
    }
  }, []);

  // Smooth scroll ONLY the student answer board to top whenever student changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedStudentId]);

  const handlePrevStudent = useCallback(() => {
    if (currentIndex > 0) {
      const prevStudent = filteredStudents[currentIndex - 1];
      setSelectedStudentId(prevStudent.id || null);
      const prevTargetPage = Math.floor((currentIndex - 1) / STUDENTS_PER_PAGE) + 1;
      if (prevTargetPage !== studentPage) {
        setStudentPage(prevTargetPage);
      }
    }
  }, [currentIndex, filteredStudents, studentPage]);

  const handleNextStudent = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < filteredStudents.length - 1) {
      const nextStudent = filteredStudents[currentIndex + 1];
      setSelectedStudentId(nextStudent.id || null);
      const nextTargetPage = Math.floor((currentIndex + 1) / STUDENTS_PER_PAGE) + 1;
      if (nextTargetPage !== studentPage) {
        setStudentPage(nextTargetPage);
      }
    }
  }, [currentIndex, filteredStudents, studentPage]);

  // Global Keyboard shortcuts: Arrow Left (Prev) & Arrow Right (Next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStudent();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextStudent();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevStudent, handleNextStudent]);

  const handleSaveGrade = async (e?: React.FormEvent, andGoNext: boolean = false) => {
    if (e) e.preventDefault();
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
        setGradeSuccessMsg('Nilai & umpan balik berhasil disimpan!');
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

      // If user chose "Save and Go Next", seamlessly jump to next student
      if (andGoNext) {
        if (currentIndex < filteredStudents.length - 1) {
          handleNextStudent();
        } else {
          setGradeSuccessMsg('Nilai tersimpan! Ini adalah murid terakhir di daftar.');
        }
      }

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
    <div className="flex flex-col h-[calc(100dvh-5.5rem)] lg:h-[calc(100dvh-8rem)] font-sans gap-3.5 sm:gap-4 overflow-hidden">
      {/* Header Bar - EduVerse Theme */}
      <div className="shrink-0 bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 border border-indigo-100 shadow-md shadow-[#3B66F5]/5 space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1D4ED8] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Daftar Tugas</span>
              </button>

              <span className="bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                {assignment.assignment_type === 'lkpd' ? 'LKPD Observasi Lapangan' : 'Tugas Murid'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1D4ED8] tracking-tight truncate">
              {assignment.title}
            </h1>
          </div>

          {/* Controls: Class Selector Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 bg-indigo-50/70 p-1.5 rounded-2xl border border-indigo-200/80">
              <School className="w-4 h-4 text-[#1D4ED8] ml-2 shrink-0" />
              <span className="text-xs font-bold text-slate-600 hidden sm:inline">Pilih Kelas:</span>
              <div className="relative inline-flex items-center">
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="pl-3 pr-8 py-1.5 sm:py-2 rounded-xl bg-white border border-indigo-200 text-xs sm:text-sm font-bold text-[#1D4ED8] focus:ring-2 focus:ring-[#3B66F5] focus:border-[#3B66F5] shadow-2xs cursor-pointer appearance-none outline-none"
                >
                  {assignedClasses.map(cls => {
                    const countInCls = allStudents.filter(s => (s.class_id || (s as any).classId) === cls.id).length;
                    return (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {countInCls > 0 ? `(${countInCls} Murid)` : ''}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-[#1D4ED8] absolute right-2.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick KPI Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Murid</span>
            <span className="text-sm sm:text-base font-black text-slate-800">{totalMurid}</span>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#1D4ED8] uppercase">Terkumpul</span>
            <span className="text-sm sm:text-base font-black text-[#1D4ED8]">{submittedCount}</span>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">Sudah Dinilai</span>
            <span className="text-sm sm:text-base font-black text-emerald-700">{gradedCount}</span>
          </div>
          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase">Belum Kumpul</span>
            <span className="text-sm sm:text-base font-black text-amber-700">{unsubmittedCount}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 sm:gap-5 overflow-hidden">
        {/* Left Column: Student List (Stationary & Always in View) */}
        <aside className={`w-full lg:w-80 xl:w-96 bg-white rounded-2xl sm:rounded-3xl border border-indigo-100 shadow-md shadow-[#3B66F5]/5 flex flex-col shrink-0 h-full overflow-hidden ${
          mobileView === 'detail' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Search Box */}
          <div className="p-3.5 border-b border-slate-100 space-y-2.5 bg-gradient-to-b from-indigo-50/40 to-white shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari nama murid..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-indigo-200/80 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#3B66F5] focus:ring-1 focus:ring-[#3B66F5] shadow-2xs transition-all"
              />
            </div>

            {/* Filter Tabs Styled Like EduVerse */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-indigo-50/80 rounded-xl text-xs font-bold text-slate-600 text-center">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${filterTab === 'all' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'hover:text-[#1D4ED8]'}`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('submitted')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${filterTab === 'submitted' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'hover:text-[#1D4ED8]'}`}
              >
                Kumpul
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('graded')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${filterTab === 'graded' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'hover:text-[#1D4ED8]'}`}
              >
                Dinilai
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('unsubmitted')}
                className={`py-1.5 rounded-lg transition-all cursor-pointer ${filterTab === 'unsubmitted' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'hover:text-[#1D4ED8]'}`}
              >
                Belum
              </button>
            </div>
          </div>

          {/* Student Items List (Paginated) */}
          <div className="divide-y divide-slate-100 flex-1 min-h-0 overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#1D4ED8]" />
                <span className="font-semibold text-slate-600">Memuat data pengumpulan...</span>
              </div>
            ) : paginatedStudents.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Tidak ada murid yang sesuai filter pencarian.
              </div>
            ) : (
              paginatedStudents.map((student, idx) => {
                const sub = getSubForStudent(student);
                const isSelected = selectedStudent?.id === student.id;
                const isGraded = sub?.status === 'graded' && sub?.score !== null && sub?.score !== undefined;
                const globalIdx = (studentPage - 1) * STUDENTS_PER_PAGE + idx + 1;

                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(student.id || null);
                      setMobileView('detail');
                    }}
                    className={`w-full text-left p-3.5 sm:p-4 transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white shadow-md shadow-[#3B66F5]/20' 
                        : 'hover:bg-indigo-50/50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-indigo-100 text-[#1D4ED8]'
                      }`}>
                        {globalIdx}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {student.name}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isGraded ? (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full ${
                          isSelected ? 'bg-white text-emerald-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <Award className="w-3 h-3" />
                          {sub?.score}
                        </span>
                      ) : sub ? (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#1D4ED8] border border-blue-200'
                        }`}>
                          Terkumpul
                        </span>
                      ) : (
                        <span className={`text-[11px] font-semibold ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                          Belum
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 shrink-0">
            <span className="text-[11px] text-slate-500 font-semibold">
              Hal {studentPage} dari {totalStudentPages} ({filteredStudents.length} murid)
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={studentPage <= 1}
                onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer text-xs"
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={studentPage >= totalStudentPages}
                onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer text-xs"
              >
                Next →
              </button>
            </div>
          </div>
        </aside>

        {/* Right Column: Submission Details & Grading Canvas */}
        <main 
          id="review-work-canvas" 
          className={`flex-1 min-h-0 w-full h-full bg-white rounded-2xl sm:rounded-3xl border border-indigo-100 shadow-md shadow-[#3B66F5]/5 flex flex-col overflow-hidden ${
            mobileView === 'list' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {selectedStudent ? (
            <>
              {/* FIXED STUDENT HEADER - NEVER SCROLLS OUT OF VIEW */}
              <div className="shrink-0 bg-white/95 backdrop-blur-md p-4 sm:p-5 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    className="lg:hidden text-[#1D4ED8] bg-blue-50 p-2 rounded-xl border border-blue-200"
                    title="Kembali ke Daftar Murid"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#3B66F5] to-[#1D4ED8] text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                    <User className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-extrabold text-[#1D4ED8] truncate">
                        {selectedStudent.name}
                      </h2>
                      {selectedSubmission?.status === 'graded' && selectedSubmission?.score !== null && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black px-2.5 py-0.5 rounded-full">
                          Nilai: {selectedSubmission.score}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-2 flex-wrap">
                      {selectedSubmission?.submitted_at ? (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          Dikirim: {new Date(selectedSubmission.submitted_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Belum mengumpulkan</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Quick Prev / Next Student Buttons (Sticky & Keyboard shortcut hint) */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    disabled={currentIndex <= 0}
                    onClick={handlePrevStudent}
                    title="Navigasi ke murid sebelumnya (atau tekan panah kiri pada keyboard)"
                    className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-[#1D4ED8] font-bold text-xs flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>

                  <span className="text-xs font-black text-[#1D4ED8] bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-xl">
                    {currentIndex + 1} / {filteredStudents.length}
                  </span>

                  <button
                    type="button"
                    disabled={currentIndex >= filteredStudents.length - 1}
                    onClick={handleNextStudent}
                    title="Navigasi ke murid selanjutnya (atau tekan panah kanan pada keyboard)"
                    className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-[#1D4ED8] font-bold text-xs flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer"
                  >
                    <span className="hidden sm:inline">Selanjutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* PAPAN JAWABAN MURID - HANYA INI YANG SCROLL */}
              <div 
                ref={scrollContainerRef}
                className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 space-y-7 custom-scrollbar"
              >
                {selectedSubmission ? (
                  <>
                    {/* Media / Photo Display */}
                    {selectedSubmission.file_url && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wider block">
                          Foto Objek yang Diobservasi
                        </span>
                        <div className="rounded-2xl overflow-hidden border-2 border-indigo-100 bg-slate-950 max-w-xl relative group shadow-sm">
                          {!imgLoadError ? (
                            <img
                              src={getOptimizedMediaUrl(selectedSubmission.file_url)}
                              alt="Foto Siswa"
                              className="w-full max-h-84 object-contain bg-slate-950"
                              onError={() => setImgLoadError(true)}
                            />
                          ) : (
                            <div className="p-10 text-center text-xs text-slate-400">
                              Gambar tidak dapat dimuat langsung.
                            </div>
                          )}
                          <div className="absolute bottom-3 right-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewImageUrl(getOptimizedMediaUrl(selectedSubmission.file_url!))}
                              className="px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs cursor-pointer shadow-md"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Perbesar Foto</span>
                            </button>
                            <a
                              href={selectedSubmission.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-xl bg-black/70 hover:bg-black text-white backdrop-blur-xs shadow-md"
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
                      <div className="space-y-6">
                        {parsedLkpd.object_name && (
                          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 space-y-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                              Nama Objek / Benda
                            </span>
                            <p className="text-base font-extrabold text-[#1D4ED8]">
                              {parsedLkpd.object_name}
                            </p>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                              Hasil Analisis 6 Unsur Seni Rupa
                            </span>
                            <span className="text-xs font-bold text-[#1D4ED8] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                              {aspects.length} Unsur Rupa
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {aspects.map((asp, idx) => (
                              <div key={asp.id} className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 shadow-2xs space-y-1.5 transition-colors">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-[#1D4ED8]">
                                    {idx + 1}. {asp.label}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                                  {parsedLkpd.answers?.[asp.id] || <span className="text-slate-400 italic">Tidak diisi oleh murid.</span>}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {parsedLkpd.reflection && (
                          <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                              Refleksi & Kesimpulan Estetika Murid
                            </span>
                            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                              "{parsedLkpd.reflection}"
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Regular Assignment Response */
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-[#1D4ED8] uppercase tracking-wider">
                          Jawaban Teks Murid
                        </span>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-medium">
                          {selectedSubmission.text_response || 'Tidak ada teks jawaban.'}
                        </div>
                      </div>
                    )}

                    {/* Attached Link if any */}
                    {selectedSubmission.link && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                          Tautan Eksternal:
                        </span>
                        <div>
                          <a
                            href={selectedSubmission.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2"
                          >
                            <span>{selectedSubmission.link}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Bottom Grading Panel with "Save & Next Student" Superpower */}
                    <div className="pt-6 border-t border-slate-200 space-y-4 bg-gradient-to-b from-indigo-50/20 to-indigo-50/50 -mx-5 -mb-7 p-5 sm:p-7 rounded-b-3xl">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-wider text-[#1D4ED8] flex items-center gap-2">
                          <Award className="w-4 h-4 text-[#1D4ED8]" />
                          <span>Form Penilaian & Umpan Balik Guru</span>
                        </h3>
                        {selectedSubmission?.graded_at && (
                          <span className="text-[11px] font-semibold text-slate-500">
                            Terakhir dinilai: {new Date(selectedSubmission.graded_at).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>

                      {gradeSuccessMsg && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{gradeSuccessMsg}</span>
                        </div>
                      )}
                      {gradeErrorMsg && (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-bold">
                          {gradeErrorMsg}
                        </div>
                      )}

                      <form onSubmit={e => handleSaveGrade(e, false)} className="space-y-4 max-w-2xl">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800">
                              Nilai (0 - 100) <span className="text-rose-500">*</span>
                            </label>
                            {/* Quick score buttons */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {[75, 80, 85, 90, 95, 100].map(val => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setScoreInput(String(val))}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#1D4ED8] text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            required
                            placeholder="Contoh: 85"
                            value={scoreInput}
                            onChange={e => setScoreInput(e.target.value)}
                            className="w-36 px-4 py-2.5 rounded-xl border border-indigo-200 bg-white text-base font-black text-[#1D4ED8] outline-none focus:border-[#3B66F5] focus:ring-2 focus:ring-[#3B66F5]/20 shadow-2xs transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-800">
                            Catatan & Masukan untuk Murid (Opsional)
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Tuliskan apresiasi atau saran perbaikan untuk lembar kerja murid ini..."
                            value={feedbackInput}
                            onChange={e => setFeedbackInput(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#3B66F5] focus:ring-2 focus:ring-[#3B66F5]/20 transition-all resize-none leading-relaxed"
                          />
                        </div>

                        {/* Action Buttons: Save & Next vs Save Current vs Bottom Nav */}
                        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Primary Action: Simpan & Lanjut Murid Berikutnya */}
                            <button
                              type="button"
                              disabled={savingGrade}
                              onClick={() => handleSaveGrade(undefined, true)}
                              className="bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#3B66F5]/25 border border-white/10 cursor-pointer disabled:opacity-50"
                            >
                              {savingGrade ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              <span>Simpan & Lanjut Murid Berikutnya →</span>
                            </button>

                            {/* Secondary Action: Simpan Nilai Saja */}
                            <button
                              type="submit"
                              disabled={savingGrade}
                              className="px-4 py-2.5 rounded-full bg-white hover:bg-slate-100 text-[#1D4ED8] border border-indigo-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Simpan Saja
                            </button>
                          </div>

                          {/* Bottom Navigation Buttons */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              disabled={currentIndex <= 0}
                              onClick={handlePrevStudent}
                              className="px-3 py-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-slate-700 font-bold text-xs flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Prev</span>
                            </button>
                            <button
                              type="button"
                              disabled={currentIndex >= filteredStudents.length - 1}
                              onClick={handleNextStudent}
                              className="px-3 py-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-slate-700 font-bold text-xs flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </>
                ) : (
                  /* Student has not submitted yet */
                  <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto text-xl font-bold">
                      !
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-slate-800">
                        Murid Belum Mengumpulkan Tugas
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        {selectedStudent.name} belum mengirimkan jawaban atau foto observasi untuk tugas ini.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 text-left bg-indigo-50/40 p-4.5 rounded-2xl border border-indigo-100">
                      <span className="text-xs font-bold text-[#1D4ED8] uppercase block mb-2">
                        Beri Nilai Manual Offline:
                      </span>
                      <form onSubmit={e => handleSaveGrade(e, false)} className="space-y-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          placeholder="Nilai (0-100)"
                          value={scoreInput}
                          onChange={e => setScoreInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-900 outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={savingGrade}
                            onClick={() => handleSaveGrade(undefined, true)}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white font-bold text-xs hover:brightness-110 transition-all shadow-sm"
                          >
                            Simpan & Lanjut →
                          </button>
                          <button
                            type="submit"
                            disabled={savingGrade}
                            className="px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                          >
                            Simpan
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-xs text-slate-400 m-auto">
              Pilih murid di panel sebelah kiri untuk memeriksa tugas.
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
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img 
            src={previewImageUrl} 
            alt="Preview perbesaran foto" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
