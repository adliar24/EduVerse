import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Download,
  School
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Assignment, AssignmentSubmission, Student, ClassEntity } from '../types';
import { supabase } from '../lib/supabase';
import { formatFileSize, getOptimizedMediaUrl } from '../utils/fileCompressor';

interface SubmissionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: (Assignment & {
    ids?: string[];
    classIds?: string[];
    assignmentByClass?: Record<string, Assignment>;
  }) | null;
  classes: ClassEntity[];
  allStudents: Student[];
  onGradeSaved?: () => void;
}

export default function SubmissionReviewModal({
  isOpen,
  onClose,
  assignment,
  classes,
  allStudents,
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

  // Selected active class tab in review modal
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  useEffect(() => {
    if (isOpen && assignedClasses.length > 0) {
      if (!selectedClassId || !assignedClasses.some(c => c.id === selectedClassId)) {
        setSelectedClassId(assignedClasses[0].id);
      }
    }
  }, [isOpen, assignedClasses]);

  // All assignment IDs belonging to this grouped assignment
  const allAssignmentIds = useMemo(() => {
    if (!assignment) return [];
    if (assignment.ids && Array.isArray(assignment.ids) && assignment.ids.length > 0) {
      return assignment.ids;
    }
    return assignment.id ? [assignment.id] : [];
  }, [assignment]);

  // Fetch submissions across all assignment IDs
  useEffect(() => {
    if (isOpen && allAssignmentIds.length > 0) {
      setMobileView('list');
      fetchSubmissions();
    }
  }, [isOpen, allAssignmentIds]);

  const fetchSubmissions = async () => {
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
  };

  // Fallback cloud students query for selected class
  const [cloudClassStudents, setCloudClassStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (isOpen && selectedClassId) {
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
        })
        .catch(() => {});
    }
  }, [isOpen, selectedClassId]);

  // Robust matcher for finding a student's submission
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

  // Combine murid strictly for selected class
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

    // 1. Students from allStudents belonging to selected class
    allStudents.filter(s => (s.class_id || (s as any).classId) === selectedClassId).forEach(addStudentToList);

    // 2. Cloud class students
    cloudClassStudents.forEach(addStudentToList);

    // 3. Submissions with this class_id
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
      const firstSubmitted = classStudents.find(s => !!getSubForStudent(s));
      const chosen = firstSubmitted || classStudents[0];
      setSelectedStudentId(chosen.id || null);
    } else {
      setSelectedStudentId(null);
    }
  }, [classStudents, selectedClassId]);

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

  // Filtered murid list for current tab & search
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

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

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
      const submissionId = selectedSubmission?.id || crypto.randomUUID();

      // Resolve the actual assignment id for this student's class
      const targetAssignmentId = assignment.assignmentByClass?.[selectedClassId]?.id 
        || assignment.id;

      const submissionPayload: AssignmentSubmission = {
        id: submissionId,
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

      // 1. Upsert to Supabase
      const { error } = await supabase
        .from('assignment_submissions')
        .upsert(submissionPayload);

      if (error) {
        console.warn('Supabase upsert error:', error);
      }

      // 2. Also save to localStorage for offline / fallback
      try {
        const localKey = 'eduverse_local_submissions';
        const rawLocal = localStorage.getItem(localKey);
        const localMap = rawLocal ? JSON.parse(rawLocal) : {};
        const compositeKey = `${targetAssignmentId}_${selectedStudent.id}`;
        localMap[compositeKey] = submissionPayload;
        localStorage.setItem(localKey, JSON.stringify(localMap));
      } catch (locErr) {
        console.warn('LocalStorage save error:', locErr);
      }

      // 3. Immediately update in-memory state
      setSubmissions(prev => {
        const idx = prev.findIndex(s => 
          (submissionId && s.id === submissionId) || 
          (s.student_id === selectedStudent.id && allAssignmentIds.includes(s.assignment_id))
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...submissionPayload };
          return next;
        } else {
          return [...prev, submissionPayload];
        }
      });

      setGradeSuccessMsg('Nilai & catatan murid berhasil disimpan!');
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

  if (!isOpen || !assignment) return null;

  const activeClassObj = assignedClasses.find(c => c.id === selectedClassId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[85vh] max-h-[640px] my-auto overflow-hidden"
      >
        {/* Compact Header */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/70 via-white to-blue-50/70 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              {mobileView === 'detail' && (
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-1 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors cursor-pointer mr-0.5"
                  title="Kembali ke Daftar Murid"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <span className="bg-gradient-to-r from-[#1D4ED8] to-[#3B66F5] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs">
                Pemeriksaan Tugas Murid
              </span>
              {activeClassObj && (
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200/80">
                  {activeClassObj.name}
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {assignment.title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pilihan Kelas (Class Selector Tabs) */}
        {assignedClasses.length > 0 && (
          <div className="px-4 py-2 bg-slate-50/90 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0 select-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1 shrink-0 flex items-center gap-1">
              <School className="w-3.5 h-3.5 text-indigo-500" />
              Kelas:
            </span>
            <div className="flex items-center gap-1.5">
              {assignedClasses.map(cls => {
                const isActive = selectedClassId === cls.id;
                // Students of this class
                const countStudents = allStudents.filter(s => (s.class_id || (s as any).classId) === cls.id).length;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      setSelectedClassId(cls.id);
                      setMobileView('list');
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      isActive 
                        ? 'bg-[#1D4ED8] text-white shadow-xs' 
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{cls.name}</span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {countStudents} Murid
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Compact Sub-Header: Accurate Stats & Filter Tabs */}
        <div className="px-4 py-2 bg-indigo-50/30 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs shrink-0">
          {/* Exact Stats Counters */}
          <div className="flex items-center gap-3 sm:gap-4 font-bold text-slate-600 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Terkumpul: <b className="text-slate-900">{submittedCount}</b>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Belum: <b className="text-slate-900">{unsubmittedCount}</b>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#1D4ED8]"></span>
              Dinilai: <b className="text-slate-900">{gradedCount}</b>
            </span>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 bg-white p-0.5 rounded-xl border border-slate-200 text-[10px] overflow-x-auto max-w-full">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterTab === 'all' ? 'bg-[#1D4ED8] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua ({totalMurid})
            </button>
            <button
              onClick={() => setFilterTab('submitted')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterTab === 'submitted' ? 'bg-[#1D4ED8] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Sudah Kumpul ({submittedCount})
            </button>
            <button
              onClick={() => setFilterTab('unsubmitted')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterTab === 'unsubmitted' ? 'bg-[#1D4ED8] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Belum ({unsubmittedCount})
            </button>
            <button
              onClick={() => setFilterTab('graded')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterTab === 'graded' ? 'bg-[#1D4ED8] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Dinilai ({gradedCount})
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Murid List */}
          <div className={`${mobileView === 'detail' ? 'hidden md:flex' : 'flex'} w-full md:w-60 lg:w-64 border-r border-slate-100 flex-col shrink-0 bg-slate-50/40 overflow-hidden`}>
            {/* Search Box */}
            <div className="p-2 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama murid..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* List of Murid */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mb-2" />
                  <span>Memuat murid...</span>
                </div>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const sub = getSubForStudent(student);
                  const isSelected = selectedStudent && (
                    student.id === selectedStudent.id ||
                    (student.student_code && student.student_code === selectedStudent.student_code)
                  );
                  const isGraded = sub?.status === 'graded' && sub?.score !== null && sub?.score !== undefined;

                  return (
                    <button
                      key={student.id || student.student_code || student.name}
                      onClick={() => {
                        setSelectedStudentId(student.id || null);
                        setMobileView('detail');
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                        isSelected 
                          ? 'bg-[#1D4ED8] text-white shadow-xs' 
                          : 'hover:bg-slate-100/80 text-slate-700 bg-white border border-slate-200/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          {student.name}
                        </p>
                        <p className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {student.student_code && student.student_code !== '-' ? `NIS: ${student.student_code}` : 'Murid'}
                        </p>
                      </div>

                      {/* Status Indicator */}
                      <div className="shrink-0 flex items-center gap-1">
                        {isGraded ? (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                            isSelected ? 'bg-white text-[#1D4ED8]' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {sub.score}
                          </span>
                        ) : sub ? (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            <Check className="w-2.5 h-2.5" />
                            Kumpul
                          </span>
                        ) : (
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                            isSelected ? 'bg-blue-900/40 text-blue-200' : 'bg-slate-100 text-slate-400'
                          }`}>
                            Belum
                          </span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 md:hidden ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-10 text-center text-xs text-slate-400 font-semibold px-2">
                  {totalMurid === 0 ? 'Belum ada data murid di kelas ini.' : 'Tidak ada murid yang sesuai filter.'}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Submission Details & Grading */}
          <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col overflow-y-auto p-3.5 sm:p-5 custom-scrollbar bg-white`}>
            {/* Mobile Back Button */}
            <div className="md:hidden flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Daftar Murid</span>
              </button>
              {selectedStudent && (
                <span className="text-xs font-bold text-slate-700 truncate max-w-[180px]">
                  {selectedStudent.name}
                </span>
              )}
            </div>

            {selectedStudent ? (
              <div className="space-y-4 max-w-2xl">
                {/* Student Info & Submission State Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D4ED8]">
                      Hasil Pengerjaan Murid
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                      {selectedStudent.name}
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {activeClassObj ? `${activeClassObj.name} • ` : ''}NIS: {selectedStudent.student_code || '-'}
                    </p>
                  </div>

                  <div>
                    {selectedSubmission ? (
                      <div className="flex flex-col items-end">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                          selectedSubmission.status === 'late'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {selectedSubmission.status === 'late' ? 'Terkumpul (Terlambat)' : 'Terkumpul Tepat Waktu'}
                        </span>
                        {selectedSubmission.submitted_at && (
                          <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(selectedSubmission.submitted_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        Belum Mengumpulkan
                      </span>
                    )}
                  </div>
                </div>

                {/* If Not Submitted Online: Show Manual Grading Notice */}
                {!selectedSubmission && (
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-800">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold">Murid belum mengumpulkan secara online</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Anda dapat memberikan nilai dan catatan langsung secara manual di bawah ini (misal: tugas diserahkan offline / di kelas).
                      </p>
                    </div>
                  </div>
                )}

                {/* If Submitted: Show Submitted Content (Text, Link, Files) */}
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
                    <div className="space-y-4">
                      {/* Text Answer */}
                      {cleanTextResponse ? (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Jawaban Teks Murid</span>
                          </label>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs leading-relaxed whitespace-pre-line font-medium select-text">
                            {cleanTextResponse}
                          </div>
                        </div>
                      ) : !resolvedLink && !selectedSubmission.file_url ? (
                        <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-400 italic">
                          Tidak ada catatan teks tertulis.
                        </div>
                      ) : null}

                      {/* Attached External Link */}
                      {resolvedLink && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-violet-600" />
                            <span>Tautan Tugas Murid (Link)</span>
                          </label>
                          <div className="p-3 bg-gradient-to-r from-violet-50/70 via-indigo-50/50 to-blue-50/70 rounded-xl border border-violet-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Globe className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-slate-800 truncate select-all">
                                  {resolvedLink}
                                </p>
                                <p className="text-[10px] text-slate-500">Google Drive / Canva / Dokumen Eksternal</p>
                              </div>
                            </div>
                            <a
                              href={resolvedLink.startsWith('http') ? resolvedLink : `https://${resolvedLink}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-all flex items-center justify-center gap-1 shrink-0 active:scale-95 cursor-pointer"
                            >
                              <span>Buka Tautan</span>
                              <ExternalLink className="w-3 h-3" />
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
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                              {isImageFile ? (
                                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-rose-600" />
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
                              <div className="bg-slate-900/5 p-2.5 rounded-xl border border-slate-200 space-y-2">
                                <div className="relative max-h-56 sm:max-h-64 overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center p-1.5">
                                  {!imgLoadError ? (
                                    <img
                                      src={displayImageUrl}
                                      alt={selectedSubmission.file_name || 'Foto Tugas Murid'}
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        if (target.src.includes('weserv.nl') && selectedSubmission.file_url) {
                                          target.src = selectedSubmission.file_url;
                                        } else {
                                          setImgLoadError(true);
                                        }
                                      }}
                                      className="max-h-48 sm:max-h-56 w-auto object-contain rounded-md shadow-2xs"
                                    />
                                  ) : (
                                    <div className="p-4 text-center space-y-1">
                                      <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                                      <p className="text-xs font-bold text-slate-700">Foto Tugas Tersimpan di Cloud</p>
                                      <p className="text-[10px] text-slate-500 max-w-sm">
                                        {selectedSubmission.file_name || 'Foto Tugas Murid'}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Compact Action Buttons */}
                                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5 border-t border-slate-200/60">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImageUrl(displayImageUrl)}
                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Perbesar</span>
                                  </button>
                                  <a
                                    href={displayImageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    referrerPolicy="no-referrer"
                                    download={selectedSubmission.file_name || 'tugas-murid.jpg'}
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow-2xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Buka Tab Baru</span>
                                  </a>
                                  <a
                                    href={displayImageUrl}
                                    download={selectedSubmission.file_name || 'tugas-murid.jpg'}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Unduh</span>
                                  </a>
                                </div>
                              </div>
                            ) : (
                              /* PDF Document Card */
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs font-bold text-slate-800 truncate">
                                      {selectedSubmission.file_name || 'Dokumen PDF Tugas'}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
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
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                                >
                                  <span>Buka / Unduh PDF</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                {/* Compact Teacher Grading & Feedback Form (Always available for selected student) */}
                <form onSubmit={handleSaveGrade} className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#1D4ED8]" />
                      <h4 className="text-xs font-bold text-slate-800">
                        {selectedSubmission ? 'Penilaian Guru' : 'Input Nilai Manual'}
                      </h4>
                    </div>
                    {selectedSubmission?.score !== null && selectedSubmission?.score !== undefined && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Nilai Tersimpan: {selectedSubmission.score}
                      </span>
                    )}
                  </div>

                  {/* Alerts */}
                  {gradeSuccessMsg && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{gradeSuccessMsg}</span>
                    </div>
                  )}
                  {gradeErrorMsg && (
                    <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{gradeErrorMsg}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
                    <div className="w-full sm:w-28 space-y-1 shrink-0">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Nilai (0 - 100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={scoreInput}
                        onChange={(e) => setScoreInput(e.target.value)}
                        placeholder="0 - 100"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100"
                      />
                    </div>

                    <div className="flex-1 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        Catatan / Evaluasi untuk Murid
                      </label>
                      <input
                        type="text"
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Tuliskan catatan atau masukan pengerjaan..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingGrade}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 h-[34px]"
                    >
                      {savingGrade ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Simpan Nilai</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
                <Users className="w-7 h-7 mb-2 text-slate-300" />
                <p className="text-xs font-bold">Pilih murid di panel kiri untuk memeriksa jawaban.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Full Photo Zoom Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-70 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden p-2 flex flex-col items-center">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImageUrl} 
              alt="Foto Diperbesar" 
              referrerPolicy="no-referrer"
              className="max-h-[82vh] w-auto mx-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
