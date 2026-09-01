import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { detectGenderFromName } from '../utils/genderDetection';
import DomainTileIcon from '../components/DomainTileIcon';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  X,
  ChevronRight,
  School,
  ArrowRight,
  Loader2,
  Download,
  Upload,
  BookOpen,
  ChevronDown,
  Copy,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useAlert } from '../context/AlertContext';
import { staggerContainer, staggerItem } from '../lib/animations';
import { useSchool } from '../context/SchoolContext';
import { getScopedState, addClass, deleteClassCascade, addStudent, deleteStudent, addClassesBulk, addStudentsBulk } from '../services/dbAttendance';
import { saveClass, deleteClass, saveStudent, deleteStudent as deleteStudentGrading } from '../services/dbGrading';
import { compareClassName } from '../constants';

const ELECTRIC_BLUE_GRADIENT = {
  bg: 'bg-gradient-to-br from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white border border-white/20 hover:scale-[1.01] transition-all shadow-xl shadow-[#3B66F5]/20',
  selectedBg: 'bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1E40AF] text-white border-white/40 shadow-[0_15px_35px_rgba(59,102,245,0.4)] scale-[1.02]',
  text: 'text-white',
  textMuted: 'text-blue-100/90',
  badge: 'bg-white/20 text-white border-white/10 rounded-full backdrop-blur-md',
  divider: 'border-white/10',
  btnEdit: 'text-white/80 hover:text-white hover:bg-white/15 rounded-full',
  btnDelete: 'text-white/80 hover:text-red-200 hover:bg-red-500/30 rounded-full',
  checkbox: 'border-white/30 text-[#3B66F5] focus:ring-offset-[#3B66F5]'
};

const CARD_STYLES = [
  ELECTRIC_BLUE_GRADIENT,
  ELECTRIC_BLUE_GRADIENT,
  ELECTRIC_BLUE_GRADIENT,
  ELECTRIC_BLUE_GRADIENT,
  ELECTRIC_BLUE_GRADIENT
];

export default function KelolaKelas() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'classes' | 'schedules' | 'settings'>('classes');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ name: '', subject: '' });
  const [submitting, setSubmitting] = useState(false);
  const isMountedRef = useRef(true);
  const { showAlert } = useAlert();
  const { activeSchool } = useSchool();
  
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const subjectRef = useRef<HTMLDivElement>(null);

  const generateStudentCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchClasses();
    fetchTeacherSubjects();
    return () => { isMountedRef.current = false; };
  }, [activeSchool]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subjectRef.current && !subjectRef.current.contains(event.target as Node)) {
        setSubjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showForm || showStudents || showAddStudentForm) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showForm, showStudents, showAddStudentForm]);

  const fetchTeacherSubjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let subjectsList: any[] = [];

      // 1. Fetch from Supabase cloud teacher_subjects
      if (user) {
        const { data: teacherSubjectsData } = await supabase
          .from('teacher_subjects')
          .select('subject_id, subjects(*)')
          .eq('teacher_id', user.id);
        
        if (teacherSubjectsData && teacherSubjectsData.length > 0) {
          subjectsList = teacherSubjectsData
            .map(ts => ts.subjects as any)
            .filter(Boolean);
        }
      }

      // 2. Fallback to local IndexedDB teacher profile subjects if cloud is empty
      if (subjectsList.length === 0) {
        try {
          const { getTeacherProfile } = await import('../services/dbGrading');
          const localProfile = await getTeacherProfile();
          if (localProfile?.subjects && Array.isArray(localProfile.subjects) && localProfile.subjects.length > 0) {
            subjectsList = localProfile.subjects.map((s: any, idx: number) => 
              typeof s === 'string' ? { id: `subj_${idx}`, name: s } : s
            );
          }
        } catch (e) {
          console.warn('Local profile subjects fetch warning:', e);
        }
      }

      // Deduplicate by name
      const uniqueSubjects = subjectsList.filter((subject, index, self) => 
        subject && subject.name && index === self.findIndex(s => s && s.name && s.name.toLowerCase() === subject.name.toLowerCase())
      );

      // If teacher has assigned subjects in profile, set ONLY those exact subjects!
      if (uniqueSubjects.length > 0) {
        setTeacherSubjects(uniqueSubjects);
      } else {
        // Fallback default if profile has not selected any subjects yet
        setTeacherSubjects([
          { id: 'subj_1', name: 'Matematika' },
          { id: 'subj_2', name: 'Bahasa Indonesia' },
          { id: 'subj_3', name: 'Bahasa Inggris' },
          { id: 'subj_4', name: 'Fisika' },
          { id: 'subj_5', name: 'Kimia' },
          { id: 'subj_6', name: 'Biologi' },
          { id: 'subj_7', name: 'Umum' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      setTeacherSubjects([{ id: 'default_umum', name: 'Umum' }]);
    }
  };

  const DEFAULT_CLASS_SUBJECTS: Record<string, string> = {
    "X-A": "Seni Rupa",
    "X-B": "Seni Rupa",
    "X-C": "Seni Rupa",
    "X-D": "Seni Rupa",
    "X-E": "Seni Rupa",
    "X-F": "Informatika",
    "X-G": "Informatika",
    "X-H": "Informatika",
    "X-I": "Informatika",
    "X-J": "Informatika",
    "X-K": "Informatika",
    "XI-A": "PKWU",
    "XI-B": "PKWU",
    "XI-C": "PKWU",
    "XI-D": "PKWU",
    "XI-E": "PKWU",
    "XI-F": "PKWU",
    "XI-G": "PKWU",
    "XI-H": "Seni Rupa"
  };

  const getSubjectOverrides = (): Record<string, string> => {
    try {
      if (typeof window !== 'undefined') {
        return JSON.parse(localStorage.getItem('class_subject_overrides') || '{}');
      }
      return {};
    } catch { return {}; }
  };

  const setSubjectOverride = (classId: string, subject: string) => {
    try {
      if (typeof window !== 'undefined' && classId) {
        const map = getSubjectOverrides();
        map[classId] = subject;
        localStorage.setItem('class_subject_overrides', JSON.stringify(map));
      }
    } catch (e) { console.warn(e); }
  };

  const resolveSubjectForClass = (classId: string, className: string, rawSubj?: string, rawMapel?: string): string => {
    const overrides = getSubjectOverrides();
    if (overrides[classId]) return overrides[classId];

    const normName = (className || '').trim().toUpperCase();
    if (DEFAULT_CLASS_SUBJECTS[normName]) {
      return DEFAULT_CLASS_SUBJECTS[normName];
    }

    if (rawSubj && rawSubj !== 'Umum') return rawSubj;
    if (rawMapel && rawMapel !== 'Umum') return rawMapel;

    return 'Umum';
  };

  const getDeletedClassIds = (): string[] => {
    try {
      if (typeof window !== 'undefined') {
        return JSON.parse(localStorage.getItem('deleted_class_ids') || '[]');
      }
      return [];
    } catch { return []; }
  };

  const addDeletedClassId = (classId: string) => {
    try {
      if (typeof window !== 'undefined' && classId) {
        const list = getDeletedClassIds();
        if (!list.includes(classId)) {
          list.push(classId);
          localStorage.setItem('deleted_class_ids', JSON.stringify(list));
        }
      }
    } catch (e) { console.warn(e); }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const deletedIds = new Set(getDeletedClassIds());
      
      // 1. Load classes from local IndexedDB first (instant load)
      const localState = await getScopedState(['classes', 'students']);
      let dbClasses = localState.classes || [];
      
      const { SEED_CLASSES } = await import('../services/excelDataSeed');
      const classMap = new Map<string, any>();
      
      if (SEED_CLASSES && SEED_CLASSES.length > 0) {
        SEED_CLASSES.forEach(sc => {
          const id = String(sc.id || sc.idKelas);
          if (!deletedIds.has(id)) {
            const className = sc.name || sc.namaKelas;
            const key = className ? className.trim().toUpperCase() : id;
            const subj = resolveSubjectForClass(id, className, sc.subject, sc.mapel);
            classMap.set(key, { ...sc, id, idKelas: id, subject: subj, mapel: subj });
          }
        });
      }

      dbClasses.forEach(lc => {
        const id = String(lc.id || lc.idKelas || lc.id_kelas || '');
        const className = lc.name || lc.namaKelas;
        const key = className ? className.trim().toUpperCase() : id;
        if (id && !deletedIds.has(id)) {
          const existing = classMap.get(key) || classMap.get(id) || {};
          const finalName = className || existing.name;
          const subj = resolveSubjectForClass(id, finalName, lc.subject, lc.mapel);
          classMap.set(key, { ...existing, ...lc, id: existing.id || id, idKelas: existing.id || id, name: finalName, namaKelas: finalName, subject: subj, mapel: subj });
        }
      });

      let localClasses = Array.from(classMap.values());
      
      const healClassesList = async (list: any[]) => {
        let changed = false;
        const healed = await Promise.all(list.map(async (c) => {
          const cId = String(c.id || c.idKelas || c.id_kelas);
          const cName = c.name || c.namaKelas;
          const subj = resolveSubjectForClass(cId, cName, c.subject, c.mapel);
          const cSchoolId = c.school_id || c.schoolId;

          if (!cSchoolId && activeSchool?.id && activeSchool.id !== 'legacy') {
            changed = true;
            const updated = {
              ...c,
              subject: subj,
              mapel: subj,
              school_id: activeSchool.id,
              schoolId: activeSchool.id
            };
            await addClass(updated as any);
            await saveClass({
              idKelas: cId,
              teacherId: c.teacher_id || c.teacherId,
              schoolId: activeSchool.id,
              namaKelas: cName,
              mapel: subj
            } as any);
            return updated;
          }
          return { ...c, subject: subj, mapel: subj };
        }));
        return { list: healed, changed };
      };

      const firstClassHeal = await healClassesList(localClasses);
      if (firstClassHeal.changed) {
        localClasses = firstClassHeal.list;
      }

      // Always show all classes (never filter out master or user classes)
      const filterClassList = (list: any[]) => list;

      localClasses = filterClassList(localClasses);
      
      // Multi-fallback function to accurately count students per class
      const countStudents = (c: any, studentsList: any[]) => {
        const classId = String(c.id || c.idKelas || c.id_kelas || '');
        const className = String(c.name || c.namaKelas || c.nama_kelas || '').trim().toUpperCase();
        return studentsList.filter(s => {
          const sClassId = String(s.classId || s.class_id || s.idKelas || '');
          if (classId && sClassId && classId === sClassId) return true;
          const sClassName = String(s.className || s.namaKelas || s.class_name || (s.classes ? (s.classes.name || s.classes.nama_kelas) : '')).trim().toUpperCase();
          if (className && sClassName && className === sClassName) return true;
          return false;
        }).length;
      };

      // Manually count students per class locally (merging SEED_STUDENTS for 100% accuracy)
      const { SEED_STUDENTS } = await import('../services/excelDataSeed');
      const studentMap = new Map<string, any>();
      if (SEED_STUDENTS && SEED_STUDENTS.length > 0) {
        SEED_STUDENTS.forEach(ss => {
          const id = String(ss.id || ss.idSiswa);
          studentMap.set(id, ss);
        });
      }
      (localState.students || []).forEach(ls => {
        const id = String(ls.id || ls.idSiswa || ls.id_siswa || '');
        if (id) studentMap.set(id, { ...(studentMap.get(id) || {}), ...ls });
      });
      const localStudents = Array.from(studentMap.values());

      const mappedClasses = localClasses.map(c => {
        const classId = String(c.id || c.idKelas || c.id_kelas);
        const className = c.name || c.namaKelas;
        const studentCount = countStudents(c, localStudents);
        const subj = resolveSubjectForClass(classId, className, c.subject, c.mapel);
        return {
          ...c,
          id: classId,
          idKelas: classId,
          name: className,
          subject: subj,
          mapel: subj,
          students: [{ count: studentCount }]
        };
      });
      
      if (isMountedRef.current) {
        setClasses(mappedClasses);
      }
      
      // 2. Fetch from Supabase in background to update local DB and sync
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const { syncService } = await import('../services/sync');
          await syncService.pullFromCloud();
          
          const updatedLocalState = await getScopedState(['classes', 'students']);
          let syncDbClasses = updatedLocalState.classes || [];
          const syncClassMap = new Map<string, any>();
          
          if (SEED_CLASSES && SEED_CLASSES.length > 0) {
            SEED_CLASSES.forEach(sc => {
              const id = String(sc.id || sc.idKelas);
              const className = sc.name || sc.namaKelas;
              const key = className ? className.trim().toUpperCase() : id;
              const subj = resolveSubjectForClass(id, className, sc.subject, sc.mapel);
              syncClassMap.set(key, { ...sc, id, idKelas: id, subject: subj, mapel: subj });
            });
          }

          syncDbClasses.forEach(lc => {
            const id = String(lc.id || lc.idKelas || lc.id_kelas || '');
            const className = lc.name || lc.namaKelas;
            const key = className ? className.trim().toUpperCase() : id;
            if (id) {
              const existing = syncClassMap.get(key) || syncClassMap.get(id) || {};
              const finalName = className || existing.name;
              const subj = resolveSubjectForClass(id, finalName, lc.subject, lc.mapel);
              syncClassMap.set(key, { ...existing, ...lc, id: existing.id || id, idKelas: existing.id || id, name: finalName, namaKelas: finalName, subject: subj, mapel: subj });
            }
          });

          let updatedClasses = Array.from(syncClassMap.values());
          
          const secondClassHeal = await healClassesList(updatedClasses);
          if (secondClassHeal.changed) {
            updatedClasses = secondClassHeal.list;
          }

          updatedClasses = filterClassList(updatedClasses);
          
          const syncStudentMap = new Map<string, any>();
          if (SEED_STUDENTS && SEED_STUDENTS.length > 0) {
            SEED_STUDENTS.forEach(ss => {
              const id = String(ss.id || ss.idSiswa);
              syncStudentMap.set(id, ss);
            });
          }
          (updatedLocalState.students || []).forEach(ls => {
            const id = String(ls.id || ls.idSiswa || ls.id_siswa || '');
            if (id) syncStudentMap.set(id, { ...(syncStudentMap.get(id) || {}), ...ls });
          });
          const updatedStudents = Array.from(syncStudentMap.values());

          const remappedClasses = updatedClasses.map(c => {
            const classId = String(c.id || c.idKelas || c.id_kelas);
            const className = c.name || c.namaKelas;
            const studentCount = countStudents(c, updatedStudents);
            const subj = resolveSubjectForClass(classId, className, c.subject, c.mapel);
            return {
              ...c,
              id: classId,
              idKelas: classId,
              name: className,
              subject: subj,
              mapel: subj,
              students: [{ count: studentCount }]
            };
          });
          
          if (isMountedRef.current) {
            setClasses(remappedClasses);
          }
        } catch (syncErr) {
          console.warn('Background sync classes failed:', syncErr);
        }
      }
    } catch (error) { 
      console.error('Error fetching classes:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  const fetchClassStudents = async (classId: string, targetCls?: any) => {
    setLoadingStudents(true);
    try {
      const clsObj = targetCls || selectedClass;
      const targetClassName = (clsObj?.name || clsObj?.namaKelas || '').trim().toUpperCase();

      // 1. Load students locally first with SEED_STUDENTS fallback
      const localState = await getScopedState(['students']);
      const { SEED_STUDENTS } = await import('../services/excelDataSeed');
      const studentMap = new Map<string, any>();
      if (SEED_STUDENTS && SEED_STUDENTS.length > 0) {
        SEED_STUDENTS.forEach(ss => {
          const id = String(ss.id || ss.idSiswa);
          studentMap.set(id, ss);
        });
      }
      (localState.students || []).forEach(ls => {
        const id = String(ls.id || ls.idSiswa || ls.id_siswa || '');
        if (id) studentMap.set(id, { ...(studentMap.get(id) || {}), ...ls });
      });
      const allLocalStudents = Array.from(studentMap.values());

      const classStudentsLocal = allLocalStudents.filter(s => {
        const sClassId = String(s.classId || (s as any).class_id || (s as any).idKelas || '');
        if (classId && sClassId && classId === sClassId) return true;
        if (targetClassName) {
          const sClassName = String(s.className || s.namaKelas || s.class_name || (s.classes ? (s.classes.name || s.classes.nama_kelas) : '')).trim().toUpperCase();
          if (sClassName && sClassName === targetClassName) return true;
        }
        return false;
      });
      const sortedLocal = [...classStudentsLocal].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));
      
      if (isMountedRef.current) {
        setClassStudents(sortedLocal.map(s => ({
          ...s,
          class_id: s.classId || (s as any).class_id || (s as any).idKelas || classId
        })));
      }

      // 2. Fetch from Supabase and update local database
      if (activeSchool?.id && activeSchool.id !== 'legacy') {
        const { data, error } = await supabase
          .from('students')
          .select('id, name, nisn, student_code, class_id, teacher_id, created_at, school_id, password, gender')
          .or(`class_id.eq.${classId},id_kelas.eq.${classId}`)
          .order('name', { ascending: true });
          
        if (error) throw error;
        if (isMountedRef.current && data && data.length > 0) {
          for (const s of data) {
            await addStudent({
              id: s.id,
              teacher_id: s.teacher_id,
              school_id: s.school_id,
              schoolId: s.school_id,
              classId: s.class_id,
              class_id: s.class_id,
              name: s.name,
              student_code: s.student_code,
              password: s.password || 'murid19',
              gender: s.gender,
              createdAt: s.created_at
            } as any);
            await saveStudent({
              idSiswa: s.id,
              teacherId: s.teacher_id,
              schoolId: (s as any).school_id,
              idKelas: s.class_id,
              nama: s.name,
              student_code: s.student_code,
              password: (s as any).password || 'murid19',
              gender: s.gender
            } as any);
          }
          
          const updatedState = await getScopedState(['students']);
          const updatedStudents = updatedState.students || [];
          const classStudentsUpdated = updatedStudents.filter(s => {
            const sClassId = String(s.classId || (s as any).class_id || (s as any).idKelas || '');
            if (classId && sClassId && classId === sClassId) return true;
            if (targetClassName) {
              const sClassName = String(s.className || s.namaKelas || s.class_name || (s.classes ? (s.classes.name || s.classes.nama_kelas) : '')).trim().toUpperCase();
              if (sClassName && sClassName === targetClassName) return true;
            }
            return false;
          });
          const sortedUpdated = [...classStudentsUpdated].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' }));
          
          if (isMountedRef.current && sortedUpdated.length > 0) {
            setClassStudents(sortedUpdated.map(s => ({
              ...s,
              class_id: s.classId || (s as any).class_id || (s as any).idKelas || classId
            })));
          }
        }
      }
    } catch (error) { 
      console.error('Error fetching students:', error); 
    } finally { 
      setLoadingStudents(false); 
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !selectedClass) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (editingStudentId) {
        const { data: updatedStudent, error } = await supabase.from('students').update({ name: newStudentName }).eq('id', editingStudentId).select().single();
        if (error) throw error;
        
        if (updatedStudent) {
          await addStudent({
            id: updatedStudent.id,
            teacher_id: updatedStudent.teacher_id,
            school_id: updatedStudent.school_id,
            schoolId: updatedStudent.school_id,
            classId: updatedStudent.class_id,
            class_id: updatedStudent.class_id,
            name: updatedStudent.name,
            student_code: updatedStudent.student_code,
            password: updatedStudent.password || 'murid19',
            createdAt: updatedStudent.created_at
          } as any);
          await saveStudent({
            idSiswa: updatedStudent.id,
            teacherId: updatedStudent.teacher_id,
            schoolId: updatedStudent.school_id,
            idKelas: updatedStudent.class_id,
            nama: updatedStudent.name,
            student_code: updatedStudent.student_code,
            password: updatedStudent.password || 'murid19'
          } as any);
        }
        showAlert({ title: 'Berhasil', message: 'Nama murid berhasil diperbarui.', type: 'success' });
      } else {
        const { data: newStudent, error } = await supabase.from('students').insert([{ 
          name: newStudentName, 
          class_id: selectedClass.id, 
          teacher_id: user?.id, 
          school_id: activeSchool?.id === 'legacy' ? null : activeSchool?.id,
          student_code: generateStudentCode(),
          password: 'murid19'
        }]).select().single();
        if (error) throw error;

        if (newStudent) {
          await addStudent({
            id: newStudent.id,
            teacher_id: newStudent.teacher_id,
            school_id: newStudent.school_id,
            schoolId: newStudent.school_id,
            classId: newStudent.class_id,
            class_id: newStudent.class_id,
            name: newStudent.name,
            student_code: newStudent.student_code,
            password: newStudent.password || 'murid19',
            createdAt: newStudent.created_at
          } as any);
          await saveStudent({
            idSiswa: newStudent.id,
            teacherId: newStudent.teacher_id,
            schoolId: newStudent.school_id,
            idKelas: newStudent.class_id,
            nama: newStudent.name,
            student_code: newStudent.student_code,
            password: newStudent.password || 'murid19'
          } as any);
        }
        showAlert({ title: 'Berhasil', message: 'Murid berhasil ditambahkan.', type: 'success' });
      }
      setShowAddStudentForm(false);
      setNewStudentName('');
      setEditingStudentId(null);
      fetchClassStudents(selectedClass.id);
      fetchClasses();
    } catch (error: any) { showAlert({ title: 'Gagal', message: error.message, type: 'error' }); }
    finally { setSubmitting(false); }
  };

  const handleDeleteStudent = async (id: string) => {
    showAlert({
      title: 'Hapus Murid?', message: 'Data murid akan terhapus secara permanen.', type: 'confirm', confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('students').delete().eq('id', id);
          if (error) throw error;

          await deleteStudent(id);
          await deleteStudentGrading(id);

          fetchClassStudents(selectedClass.id);
          fetchClasses(); 
          showAlert({ title: 'Terhapus', message: 'Murid berhasil dihapus.', type: 'success' });
        } catch (error: any) { showAlert({ title: 'Gagal', message: error.message, type: 'error' }); }
      }
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showAlert({ title: 'Disalin!', message: 'Kode unik berhasil disalin.', type: 'success' });
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const template = [
      { 'Nama Lengkap': 'Ahmad Fauzi', 'Jenis Kelamin': 'L' },
      { 'Nama Lengkap': 'Siti Aminah', 'Jenis Kelamin': 'P' }
    ];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Murid");
    XLSX.writeFile(workbook, `Template_Murid_${selectedClass?.name || 'Kelas'}.xlsx`);
  };

  const handleExportExcel = async () => {
    const { default: XLSXStyle } = await import('xlsx-js-style');
    if (!selectedClass) return;
    if (classStudents.length === 0) {
      showAlert({ title: 'Kosong', message: 'Tidak ada data murid untuk diekspor.', type: 'warning' });
      return;
    }

    const header = ['NAMA LENGKAP', 'KODE UNIK'];
    const rows = classStudents.map(s => [s.name, s.student_code || '-']);

    const worksheet = XLSXStyle.utils.aoa_to_sheet([header, ...rows]);

    // Auto-fit column widths
    const maxNameLen = Math.max(
      header[0].length,
      ...rows.map(r => String(r[0] || '').length)
    );
    const maxCodeLen = Math.max(
      header[1].length,
      ...rows.map(r => String(r[1] || '').length)
    );

    worksheet['!cols'] = [
      { wch: Math.max(maxNameLen + 3, 18) },
      { wch: Math.max(maxCodeLen + 3, 14) }
    ];

    // Set row heights
    worksheet['!rows'] = [
      { hpt: 28 }, // Header row height (spacious & premium)
      ...rows.map(() => ({ hpt: 22 })) // Data row heights
    ];

    // Apply styles (borders, bg colors, alignment)
    const range = XLSXStyle.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let r = range.s.r; r <= range.e.r; ++r) {
      for (let c = range.s.c; c <= range.e.c; ++c) {
        const cellRef = XLSXStyle.utils.encode_cell({ r, c });
        if (!worksheet[cellRef]) continue;

        if (r === 0) {
          // Header Row Style
          worksheet[cellRef].s = {
            fill: {
              fgColor: { rgb: "1E1B4B" } // Premium Indigo bg
            },
            font: {
              name: "Segoe UI",
              sz: 11,
              bold: true,
              color: { rgb: "FFFFFF" } // White text
            },
            alignment: {
              horizontal: "center",
              vertical: "center"
            },
            border: {
              top: { style: "thin", color: { rgb: "312E81" } },
              bottom: { style: "medium", color: { rgb: "0F172A" } },
              left: { style: "thin", color: { rgb: "312E81" } },
              right: { style: "thin", color: { rgb: "312E81" } }
            }
          };
        } else {
          // Data Row Style
          worksheet[cellRef].s = {
            font: {
              name: "Segoe UI",
              sz: 10
            },
            alignment: {
              vertical: "center",
              horizontal: c === 1 ? "center" : "left" // Center align code, left align name
            },
            border: {
              top: { style: "thin", color: { rgb: "E2E8F0" } },
              bottom: { style: "thin", color: { rgb: "E2E8F0" } },
              left: { style: "thin", color: { rgb: "E2E8F0" } },
              right: { style: "thin", color: { rgb: "E2E8F0" } }
            }
          };
        }
      }
    }

    const workbook = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(workbook, worksheet, "Data Murid");
    XLSXStyle.writeFile(workbook, `Data_Murid_${selectedClass.name}.xlsx`.replace(/\s+/g, '_'));
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClass) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!event.target?.result) {
          throw new Error('Gagal membaca file. Silakan coba lagi.');
        }
        
        const XLSX = await import('xlsx');
        const arrayBuffer = event.target.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
        
        if (rawData.length < 2) {
          throw new Error('File tidak memiliki data. Pastikan ada header dan minimal 1 baris data.');
        }
        
        // Find header row dynamically (within the first 12 rows)
        let headerRowIdx = -1;
        let nameIdx = -1;
        let genderIdx = -1;
        let nisnIdx = -1;

        for (let r = 0; r < Math.min(rawData.length, 12); r++) {
          const row = rawData[r];
          if (!row || !Array.isArray(row)) continue;
          
          const rowHeaders = row.map((h: any) => String(h || '').trim().toLowerCase());
          const nIdx = rowHeaders.findIndex(h => 
            h === 'nama lengkap' || h === 'nama siswa' || h === 'nama murid' || 
            h === 'nama' || h === 'name' || h === 'student name' || h === 'peserta didik'
          );
          
          if (nIdx !== -1) {
            headerRowIdx = r;
            nameIdx = nIdx;
            genderIdx = rowHeaders.findIndex(h => 
              h === 'jenis kelamin' || h === 'gender' || h === 'l/p' || 
              h === 'jk' || h === 'jenis_kelamin' || h.includes('kelamin')
            );
            nisnIdx = rowHeaders.findIndex(h => 
              h === 'nisn' || h === 'nis' || h === 'nis/nisn' || h === 'no induk' || h === 'nomor induk'
            );
            break;
          }
        }
        
        if (nameIdx === -1) {
          throw new Error('Kolom Nama ("Nama Lengkap" / "Nama Siswa" / "Nama") tidak ditemukan dalam 10 baris pertama file Excel.');
        }
        
        // Pre-fetch all existing students in this class and all student codes to avoid 409 Conflict
        const { data: existingClassStudents } = await supabase
          .from('students')
          .select('id, name, student_code, gender, nisn, class_id')
          .eq('class_id', selectedClass.id);

        const existingMap = new Map<string, any>();
        (existingClassStudents || []).forEach(s => {
          if (s.name) existingMap.set(s.name.trim().toLowerCase(), s);
        });

        const { data: codeRows } = await supabase
          .from('students')
          .select('student_code')
          .not('student_code', 'is', null);

        const usedCodes = new Set<string>();
        (codeRows || []).forEach(r => {
          if (r.student_code) usedCodes.add(String(r.student_code).toUpperCase());
        });

        const generateUniqueStudentCode = () => {
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
          for (let attempt = 0; attempt < 50; attempt++) {
            let code = '';
            for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
            if (!usedCodes.has(code)) {
              usedCodes.add(code);
              return code;
            }
          }
          const fallback = 'S' + Math.random().toString(36).substring(2, 7).toUpperCase();
          usedCodes.add(fallback);
          return fallback;
        };

        let successCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let errorMessages: string[] = [];
        
        for (let i = headerRowIdx + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || !Array.isArray(row)) continue;
          
          const rawName = String(row[nameIdx] || '').trim();
          // Filter out header echoes, numbers-only or title rows
          if (!rawName || rawName.toLowerCase() === 'nama' || rawName.toLowerCase() === 'nama lengkap') {
            const hasData = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
            if (hasData) skippedCount++;
            continue;
          }
          
          try {
            const rawGender = genderIdx !== -1 ? String(row[genderIdx] || '').trim().toUpperCase() : '';
            let genderVal: 'M' | 'F' | null = null;
            if (['L', 'M', 'LAKI', 'LAKI-LAKI', 'PRIA', 'MALE'].includes(rawGender)) genderVal = 'M';
            else if (['P', 'F', 'PEREMPUAN', 'WANITA', 'FEMALE'].includes(rawGender)) genderVal = 'F';
            if (!genderVal) genderVal = detectGenderFromName(rawName);

            const nisnVal = nisnIdx !== -1 ? String(row[nisnIdx] || '').trim() : null;

            const existingStudent = existingMap.get(rawName.toLowerCase());

            if (existingStudent) {
              // Update existing student instead of duplicate insert to avoid 409 Conflict
              const updatePayload: any = {};
              if (genderVal && !existingStudent.gender) updatePayload.gender = genderVal;
              if (nisnVal && !existingStudent.nisn) updatePayload.nisn = nisnVal;

              if (Object.keys(updatePayload).length > 0) {
                await supabase.from('students').update(updatePayload).eq('id', existingStudent.id);
              }

              // Sync local state
              await addStudent({
                id: existingStudent.id,
                teacher_id: user?.id,
                school_id: activeSchool?.id === 'legacy' ? null : activeSchool?.id,
                schoolId: activeSchool?.id === 'legacy' ? null : activeSchool?.id,
                classId: selectedClass.id,
                class_id: selectedClass.id,
                name: existingStudent.name,
                student_code: existingStudent.student_code,
                password: 'murid19',
                gender: genderVal || existingStudent.gender
              } as any);

              await saveStudent({
                idSiswa: existingStudent.id,
                teacherId: user?.id,
                schoolId: activeSchool?.id === 'legacy' ? null : activeSchool?.id,
                idKelas: selectedClass.id,
                nama: existingStudent.name,
                student_code: existingStudent.student_code,
                password: 'murid19'
              } as any);

              updatedCount++;
            } else {
              // Insert brand new student with unique student_code
              const newId = crypto.randomUUID();
              const studentCode = generateStudentCode();
              let studentRecord: any = null;

              if (user?.id) {
                try {
                  const { data: newStudent, error: insertError } = await supabase.from('students').insert([{ 
                    id: newId,
                    name: rawName, 
                    class_id: selectedClass.id, 
                    teacher_id: user.id, 
                    school_id: activeSchool?.id === 'legacy' ? null : (activeSchool?.id || null),
                    student_code: studentCode,
                    password: 'murid19',
                    gender: genderVal,
                    nisn: nisnVal || null
                  }]).select().single();

                  if (!insertError && newStudent) {
                    studentRecord = newStudent;
                  } else if (insertError) {
                    console.warn('Cloud student insert warning:', insertError);
                  }
                } catch (cloudErr) {
                  console.warn('Cloud insert error:', cloudErr);
                }
              }

              studentRecord = studentRecord || {
                id: newId,
                teacher_id: user?.id || 'teacher_local',
                school_id: activeSchool?.id === 'legacy' ? null : (activeSchool?.id || null),
                schoolId: activeSchool?.id === 'legacy' ? null : (activeSchool?.id || null),
                classId: selectedClass.id,
                class_id: selectedClass.id,
                name: rawName,
                student_code: studentCode,
                password: 'murid19',
                gender: genderVal,
                nisn: nisnVal || null,
                createdAt: new Date().toISOString()
              };

              await addStudent({
                id: studentRecord.id,
                teacher_id: studentRecord.teacher_id,
                school_id: studentRecord.school_id,
                schoolId: studentRecord.school_id,
                classId: studentRecord.class_id,
                class_id: studentRecord.class_id,
                name: studentRecord.name,
                student_code: studentRecord.student_code,
                password: studentRecord.password || 'murid19',
                gender: studentRecord.gender,
                createdAt: studentRecord.created_at || studentRecord.createdAt
              } as any);

              await saveStudent({
                idSiswa: studentRecord.id,
                teacherId: studentRecord.teacher_id,
                schoolId: studentRecord.school_id,
                idKelas: studentRecord.class_id,
                nama: studentRecord.name,
                student_code: studentRecord.student_code,
                password: studentRecord.password || 'murid19',
                gender: studentRecord.gender
              } as any);

              successCount++;
              existingMap.set(rawName.toLowerCase(), studentRecord);
            }
          } catch (rowErr: any) {
            console.error('Error on row', i + 1, rowErr);
            errorMessages.push(`Baris ${i + 1}: ${rowErr.message}`);
          }
        }
        
        let message = '';
        if (successCount > 0 && updatedCount > 0) {
          message = `Berhasil menambahkan ${successCount} murid baru dan memperbarui ${updatedCount} murid yang sudah terdaftar di kelas ${selectedClass.name}.`;
        } else if (successCount > 0) {
          message = `Berhasil menambahkan ${successCount} murid baru ke kelas ${selectedClass.name}.`;
        } else if (updatedCount > 0) {
          message = `Semua ${updatedCount} murid sudah terdaftar di kelas ${selectedClass.name} dan data telah diselaraskan.`;
        } else {
          message = `Tidak ada data murid yang berhasil ditambahkan.`;
        }

        if (skippedCount > 0) message += ` (${skippedCount} baris kosong dilewati)`;
        if (errorMessages.length > 0) {
          message += ` [${errorMessages.length} gagal diproses, cek log console]`;
        }
        
        showAlert({ 
          title: successCount > 0 || updatedCount > 0 ? 'Impor Selesai' : 'Gagal Impor', 
          message: message.slice(0, 500), 
          type: successCount > 0 || updatedCount > 0 ? 'success' : 'error' 
        });
        
        fetchClassStudents(selectedClass.id);
        fetchClasses();
      } catch (err: any) { 
        console.error('Import error:', err);
        showAlert({ title: 'Gagal Impor', message: err.message || 'Terjadi kesalahan saat mengimpor.', type: 'error' }); 
      }
      finally { 
        setImporting(false); 
        if (fileInputRef.current) fileInputRef.current.value = ''; 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleGenerateCodes = async () => {
    if (!selectedClass) return;
    showAlert({
      title: 'Generate Username?', message: 'Murid yang belum memiliki username akan mendapatkan username baru.', type: 'confirm', confirmText: 'Ya, Generate',
      onConfirm: async () => {
        try {
          const updates = classStudents.filter(s => !s.student_code).map(s => ({ id: s.id, student_code: generateStudentCode() }));
          if (updates.length === 0) { showAlert({ title: 'Info', message: 'Semua murid sudah memiliki username.', type: 'info' }); return; }
          for (const s of updates) { 
            const { data: updatedStudent } = await supabase.from('students').update({ student_code: s.student_code }).eq('id', s.id).select().single(); 
            if (updatedStudent) {
              await addStudent({
                id: updatedStudent.id,
                teacher_id: updatedStudent.teacher_id,
                classId: updatedStudent.class_id,
                name: updatedStudent.name,
                student_code: updatedStudent.student_code,
                password: updatedStudent.password || 'murid19',
                createdAt: updatedStudent.created_at
              } as any);
              await saveStudent({
                idSiswa: updatedStudent.id,
                teacherId: updatedStudent.teacher_id,
                schoolId: updatedStudent.school_id,
                idKelas: updatedStudent.class_id,
                nama: updatedStudent.name,
                student_code: updatedStudent.student_code,
                password: updatedStudent.password || 'murid19'
              } as any);
            }
          }
          fetchClassStudents(selectedClass.id);
          showAlert({ title: 'Berhasil', message: 'Username berhasil dibuat.', type: 'success' });
        } catch (error: any) { showAlert({ title: 'Gagal', message: error.message, type: 'error' }); }
      }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updatedName = formData.name?.trim() || 'Kelas';
      const updatedSubject = formData.subject?.trim() || 'Umum';
      const targetSchoolId = activeSchool?.id && activeSchool.id !== 'legacy' ? activeSchool.id : 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7';
      const teacherId = user?.id || '91c05fb7-bd6c-413e-a8dd-4f320824332e';

      if (editingId) {
        setSubjectOverride(editingId, updatedSubject);

        // Try Cloud update safely
        try {
          const { error } = await supabase
            .from('classes')
            .update({ name: updatedName, subject: updatedSubject })
            .eq('id', editingId);
          if (error) console.warn('Cloud update class warning:', error.message);
        } catch (cloudErr) {
          console.warn('Cloud update class failed:', cloudErr);
        }

        // Always save locally in IndexedDB (dbAttendance & dbGrading)
        await addClass({
          id: editingId,
          idKelas: editingId,
          teacher_id: teacherId,
          school_id: targetSchoolId,
          schoolId: targetSchoolId,
          name: updatedName,
          namaKelas: updatedName,
          subject: updatedSubject,
          mapel: updatedSubject
        } as any);

        await saveClass({
          idKelas: editingId,
          teacherId: teacherId,
          schoolId: targetSchoolId,
          namaKelas: updatedName,
          mapel: updatedSubject
        } as any);

        showAlert({ title: 'Berhasil', message: 'Mata pelajaran / data kelas berhasil diperbarui.', type: 'success' });
      } else {
        const newClassId = `class_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let newCls: any = null;

        try {
          const { data, error } = await supabase.from('classes').insert([{ 
            name: updatedName, 
            subject: updatedSubject, 
            teacher_id: teacherId,
            school_id: targetSchoolId
          }]).select().maybeSingle();
          if (error) console.warn('Cloud insert class warning:', error.message);
          newCls = data;
        } catch (cloudErr) {
          console.warn('Cloud insert class failed:', cloudErr);
        }

        const finalClassId = newCls?.id || newClassId;
        setSubjectOverride(finalClassId, updatedSubject);

        await addClass({
          id: finalClassId,
          idKelas: finalClassId,
          teacher_id: teacherId,
          school_id: targetSchoolId,
          schoolId: targetSchoolId,
          name: updatedName,
          namaKelas: updatedName,
          subject: updatedSubject,
          mapel: updatedSubject
        } as any);

        await saveClass({
          idKelas: finalClassId,
          teacherId: teacherId,
          schoolId: targetSchoolId,
          namaKelas: updatedName,
          mapel: updatedSubject
        } as any);

        showAlert({ title: 'Berhasil', message: 'Kelas baru berhasil ditambahkan.', type: 'success' });
      }

      setShowForm(false);
      setFormData({ name: '', subject: '' });
      setEditingId(null);
      await fetchClasses();
    } catch (error: any) { 
      console.error('Error saving class:', error);
      showAlert({ title: 'Gagal', message: error.message || 'Terjadi kesalahan saat menyimpan kelas.', type: 'error' }); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleEdit = (cls: any) => { setEditingId(cls.id); setFormData({ name: cls.name, subject: cls.subject || '' }); setShowForm(true); };

  const handleDelete = async (cls: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const studentCount = cls.students?.[0]?.count || 0;
    const hasStudents = studentCount > 0;

    showAlert({
      title: 'Hapus Kelas?',
      message: hasStudents
        ? `Menghapus kelas ini juga akan menghapus seluruh murid (${studentCount} murid) yang berada di dalam kelas ini. Apakah Anda yakin ingin melanjutkan?`
        : 'Apakah Anda yakin ingin menghapus kelas ini?',
      type: 'confirm',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          if (hasStudents) {
            // Delete all students in the class first
            const { error: studentDeleteError } = await supabase
              .from('students')
              .delete()
              .eq('class_id', cls.id);
            if (studentDeleteError) throw studentDeleteError;
          }

          // Delete the class
          const { error: classDeleteError } = await supabase
            .from('classes')
            .delete()
            .eq('id', cls.id);
          if (classDeleteError) throw classDeleteError;

          // Delete locally
          addDeletedClassId(cls.id);
          await deleteClassCascade(cls.id);
          await deleteClass(cls.id);

          fetchClasses();
          showAlert({ title: 'Terhapus', message: 'Kelas berhasil dihapus.', type: 'success' });
        } catch (error: any) {
          showAlert({ title: 'Gagal', message: error.message, type: 'error' });
        }
      }
    });
  };

  const viewClass = (cls: any) => { setSelectedClass(cls); fetchClassStudents(cls.id, cls); setShowStudents(true); };

  const filteredClasses = classes
    .filter(c => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => compareClassName(a.name || '', b.name || ''));

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1D4ED8] tracking-tight">Kelola Kelas</h2>
          <p className="text-slate-500 mt-1 font-medium">Manajemen daftar kelas dan mata pelajaran.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({ name: '', subject: '' }); setShowForm(true); }}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-600/25 cursor-pointer border border-white/10"
        >
          <Plus className="w-4 h-4" />
          Tambah Kelas Baru
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input 
          type="text" 
          placeholder="Cari nama kelas..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] transition-all text-sm font-medium text-slate-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Class Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-2xl"></div>)
        ) : filteredClasses.length > 0 ? (
          filteredClasses.map((cls, index) => {
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                key={cls.id}
                onClick={() => viewClass(cls)}
                className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-lg shadow-blue-600/25 border border-white/20 hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-10 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <School className="w-24 h-24 text-white" />
                </div>

                <div className="flex justify-between items-start gap-3 relative z-10">
                  <div className="bg-white/20 p-3 rounded-2xl text-white backdrop-blur-md border border-white/20 shrink-0">
                    <School className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-extrabold uppercase tracking-tight text-white truncate">{cls.name}</h3>
                    <p className="font-bold text-[11px] uppercase tracking-wider text-sky-200 mb-2">{cls.subject || 'Belum Ada Mapel'}</p>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 border border-white/20 text-white rounded-full inline-flex backdrop-blur-md">
                      <Users className="w-3.5 h-3.5 text-white" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">{cls.students?.[0]?.count || 0} Murid</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        const cId = String(cls.id || cls.idKelas);
                        const cName = cls.name || cls.namaKelas || 'Kelas';
                        try {
                          const QRCode = (await import('qrcode')).default;
                          const canvas = document.createElement('canvas');
                          canvas.width = 600;
                          canvas.height = 800;
                          const ctx = canvas.getContext('2d');
                          if (!ctx) return;

                          ctx.fillStyle = "#ffffff";
                          ctx.fillRect(0, 0, 600, 800);

                          const grd = ctx.createLinearGradient(0, 0, 600, 0);
                          grd.addColorStop(0, "#4C1D95");
                          grd.addColorStop(1, "#7C3AED");
                          ctx.fillStyle = grd;
                          ctx.fillRect(0, 0, 600, 160);

                          ctx.fillStyle = "#ffffff";
                          ctx.font = "bold 34px 'Inter', sans-serif";
                          ctx.textAlign = "center";
                          ctx.fillText("QR CODE ABSENSI KELAS", 300, 75);

                          ctx.font = "500 18px 'Inter', sans-serif";
                          ctx.fillStyle = "#E9D5FF";
                          ctx.fillText(activeSchool?.name || "SMAN 19 BANDUNG", 300, 115);

                          const qrDataUrl = await QRCode.toDataURL(`CLASS_QR:${cId}`, { width: 380, margin: 1 });
                          const qrImg = new Image();
                          qrImg.src = qrDataUrl;
                          await new Promise(r => qrImg.onload = r);
                          ctx.drawImage(qrImg, 110, 220, 380, 380);

                          ctx.fillStyle = "#F5F3FF";
                          ctx.fillRect(50, 640, 500, 100);
                          ctx.strokeStyle = "#DDD6FE";
                          ctx.lineWidth = 2;
                          ctx.strokeRect(50, 640, 500, 100);

                          ctx.fillStyle = "#4C1D95";
                          ctx.font = "bold 36px 'Inter', sans-serif";
                          ctx.fillText(`KELAS ${cName.toUpperCase()}`, 300, 690);

                          ctx.fillStyle = "#6B7280";
                          ctx.font = "bold 14px 'Inter', sans-serif";
                          ctx.fillText("Scan via Aplikasi EduVerse • Jam 06.30 - 06.45 WIB", 300, 722);

                          const dataUrl = canvas.toDataURL('image/png');
                          const link = document.createElement('a');
                          link.href = dataUrl;
                          link.download = `POSTER_QR_KELAS_${cName.replace(/\s+/g, '_')}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          showAlert({ title: 'Berhasil', message: `Poster QR Code Kelas ${cName} berhasil diunduh.`, type: 'success' });
                        } catch (qrErr) {
                          showAlert({ title: 'Gagal', message: 'Gagal membuat QR Code Kelas.', type: 'error' });
                        }
                      }} 
                      className="p-2 rounded-full text-white/80 hover:text-amber-200 hover:bg-white/20 transition-colors"
                      title="Cetak Poster QR Kelas"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(cls); }} 
                      className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                      title="Edit Kelas"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(cls, e)} 
                      className="p-2 rounded-full text-white/80 hover:text-rose-200 hover:bg-rose-500/30 transition-colors"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-white/15 flex items-center justify-between relative z-10">
                  <span className="text-xs font-bold text-sky-100 group-hover:text-white transition-colors">Kelola Murid & Absensi</span>
                  <div className="bg-white/20 text-white p-1.5 rounded-full group-hover:translate-x-1 transition-all border border-white/20 backdrop-blur-md">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center">
            <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-5">
              <School className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-[#1D4ED8] mb-2">Belum Ada Kelas</h3>
            <p className="text-slate-400 text-sm font-medium max-w-sm text-center">Mulai kelola kelas Anda dengan menambahkan kelas pertama.</p>
            <button onClick={() => setShowForm(true)} className="mt-6 px-6 py-3 bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white rounded-full font-semibold text-sm flex items-center gap-2 hover:brightness-110 border border-white/10 transition-all">
              <Plus className="w-4 h-4" />
              Tambah Sekarang
            </button>
          </div>
        )}
      </div>

      {/* Students Management Modal */}
      <AnimatePresence>
        {showStudents && selectedClass && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 lg:pl-[200px]">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowStudents(false)} 
              className="absolute inset-0 bg-[#1D4ED8]/30 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }}
              className="relative w-full h-full sm:h-auto sm:max-w-3xl bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-screen sm:max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-6 sm:p-8 pb-4 shrink-0 flex items-start justify-between border-b border-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-[#1D4ED8]">Kelola Murid — {selectedClass.name}</h3>
                  <p className="text-slate-400 text-sm mt-0.5">Daftar murid dan manajemen akun/username ujian.</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="bg-[#3B66F5]/10 text-[#3B66F5] px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border border-[#3B66F5]/20/50">
                      {selectedClass.subject || 'Mata Pelajaran'}
                    </span>
                    <span className="bg-slate-50 text-slate-400 px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border border-slate-100">
                      {classStudents.length} Murid
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowStudents(false)} className="p-2 bg-slate-50 text-slate-400 hover:text-[#1D4ED8] hover:bg-slate-100 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Toolbar */}
              <div className="px-6 sm:px-8 py-3 flex flex-wrap items-center gap-2 shrink-0 border-b border-slate-50">
                <button onClick={handleDownloadTemplate} className="px-3.5 py-2 bg-white text-slate-600 border border-slate-200 rounded-full font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-all">
                  <Download className="w-3.5 h-3.5 text-[#3B66F5]" /> Template
                </button>
                <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="px-3.5 py-2 bg-white text-slate-600 border border-slate-200 rounded-full font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-all disabled:opacity-50">
                  {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-[#3B66F5]" />} Impor Excel
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
                <button onClick={handleExportExcel} className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition-all">
                  <Download className="w-3.5 h-3.5" /> Ekspor Excel
                </button>
                <button onClick={() => { setEditingStudentId(null); setNewStudentName(''); setShowAddStudentForm(true); }} className="px-4 py-2 bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white rounded-full font-semibold text-xs flex items-center gap-1.5 hover:brightness-110 border border-white/10 transition-all active:scale-95 shadow-sm">
                  <Plus className="w-4 h-4" /> Tambah Murid
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="px-6 sm:px-8 py-4">
                {loadingStudents ? (
                  <div className="py-16 flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1D4ED8] opacity-20" />
                    <p className="mt-3 text-slate-300 text-xs font-medium">Memuat data murid...</p>
                  </div>
                ) : classStudents.length > 0 ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-100 overflow-x-auto bg-white custom-scrollbar">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-12">No</th>
                            <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-left">Nama Murid</th>
                            <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center w-16">L/P</th>
                            <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center w-36">Username</th>
                            <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center w-24">Status</th>
                            <th className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right w-24">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {classStudents.map((s, idx) => (
                            <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-center text-sm font-medium text-slate-300">{idx + 1}</td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-[#1D4ED8] text-sm group-hover:text-[#3B66F5] transition-colors">{s.name}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {s.gender === 'M' || s.gender === 'L' ? (
                                  <span className="bg-[#3B66F5]/5 text-blue-700 px-2 py-0.5 rounded text-[10px] font-extrabold border border-[#3B66F5]/20">L</span>
                                ) : s.gender === 'F' || s.gender === 'P' ? (
                                  <span className="bg-pink-50 text-pink-700 px-2 py-0.5 rounded text-[10px] font-extrabold border border-pink-100">P</span>
                                ) : (
                                  <span className="text-slate-300 text-xs font-semibold">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {s.student_code ? (
                                  <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-md">
                                    <span className="font-mono font-semibold text-xs text-[#3B66F5] tracking-wider">{s.student_code}</span>
                                    <button onClick={() => copyCode(s.student_code)} className="p-0.5 text-slate-400 hover:text-[#3B66F5] transition-colors" title="Salin Kode">
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-300 italic">Belum Ada</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase text-green-500">
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Aktif
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => { setEditingStudentId(s.id); setNewStudentName(s.name); setShowAddStudentForm(true); }}
                                    className="p-1.5 text-[#3B66F5] hover:text-indigo-800 hover:bg-[#3B66F5]/10/80 rounded-lg transition-all" title="Edit Murid"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDeleteStudent(s.id)} className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-full transition-all" title="Hapus Murid">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-center sm:text-left">
                        <p className="font-semibold text-[#1D4ED8] text-sm">Otomatisasi Username Murid</p>
                        <p className="text-slate-400 text-xs mt-0.5">Buat username untuk murid yang belum punya secara otomatis.</p>
                      </div>
                      <button onClick={handleGenerateCodes} className="px-4 py-2.5 bg-white border border-slate-200 text-[#1D4ED8] rounded-full font-semibold text-xs hover:bg-[#3B66F5] hover:text-white transition-all active:scale-95 flex items-center gap-1.5">
                        Buat Username Massal <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-7 h-7 text-slate-200" />
                    </div>
                    <h4 className="text-base font-bold text-[#1D4ED8]">Belum Ada Murid</h4>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto mt-1">Klik "Tambah Murid" atau gunakan fitur "Impor Excel".</p>
                  </div>
                )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Student Form Modal */}
      <AnimatePresence>
        {showAddStudentForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddStudentForm(false)} className="absolute inset-0 bg-indigo-900/30 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
              <h3 className="text-lg font-bold text-[#1D4ED8] mb-5">{editingStudentId ? 'Edit Nama Murid' : 'Tambah Murid Manual'}</h3>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Lengkap Murid</label>
                  <input type="text" autoFocus required placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-[#3B66F5] text-sm font-medium text-[#1D4ED8]"
                    value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddStudentForm(false)} className="flex-1 py-3 text-sm font-medium text-slate-400 hover:bg-slate-50 rounded-full transition-all">Batal</button>
                  <button type="submit" disabled={submitting} className="flex-[2] bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white py-3 rounded-full font-semibold text-sm hover:brightness-110 border border-white/10 transition-all shadow-sm flex items-center justify-center">
                    {submitting ? 'Menyimpan...' : editingStudentId ? 'Perbarui Murid' : 'Simpan Murid'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Class Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-[#1D4ED8]/30 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-7">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-[#3B66F5]/10 p-2.5 rounded-xl">
                    <School className="w-5 h-5 text-[#3B66F5]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1D4ED8]">{editingId ? 'Edit Kelas' : 'Kelas Baru'}</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Kelas</label>
                  <input name="name" type="text" autoFocus required placeholder="Contoh: XII - IPA 1"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] transition-all font-medium text-sm text-[#1D4ED8]"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mata Pelajaran</label>
                  <div className="relative" ref={subjectRef}>
                    <div className="flex items-center gap-2">
                      <input name="subject" type="text" required placeholder="Pilih atau ketik mata pelajaran..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] transition-all font-medium text-sm text-[#1D4ED8]"
                        value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        onFocus={() => setSubjectDropdownOpen(true)}
                      />
                      <button
                        type="button"
                        onClick={() => setSubjectDropdownOpen(!subjectDropdownOpen)}
                        className="px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <ChevronDown className={cn("w-4 h-4 transition-transform", subjectDropdownOpen && "rotate-180")} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {subjectDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-52 overflow-y-auto divide-y divide-slate-100"
                        >
                          {teacherSubjects.map(subject => (
                            <button
                              key={subject.id || subject.name}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, subject: subject.name });
                                setSubjectDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left cursor-pointer",
                                formData.subject === subject.name && "bg-blue-50/60 font-bold"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <BookOpen className="w-4 h-4 text-[#3B66F5]" />
                                <span className="text-slate-700 text-sm font-semibold">{subject.name}</span>
                              </div>
                              {formData.subject === subject.name && (
                                <div className="w-4 h-4 rounded-full bg-[#1D4ED8] flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-full font-medium text-sm text-slate-400 hover:bg-slate-50 transition-all">Batal</button>
                  <button type="submit" disabled={submitting} className="flex-[2] py-3 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] hover:brightness-110 border border-white/10 transition-all shadow-sm flex items-center justify-center gap-2">
                    {submitting ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'} {!submitting && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
