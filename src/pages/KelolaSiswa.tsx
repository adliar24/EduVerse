import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { detectGenderFromName } from '../utils/genderDetection';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Download,
  Upload,
  X,
  User,
  Filter,
  Loader2,
  Copy,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import XLSXStyle from 'xlsx-js-style';
import { cn } from '../lib/utils';
import { useAlert } from '../context/AlertContext';
import { useSchool } from '../context/SchoolContext';
import { getFullState, addClass, addStudent, deleteStudent } from '../services/dbAttendance';
import { saveClass, saveStudent, deleteStudent as deleteStudentGrading } from '../services/dbGrading';

export default function KelolaSiswa() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showAlert } = useAlert();
  const { activeSchool } = useSchool();
  const isMountedRef = useRef(true);

  const [formData, setFormData] = useState({ name: '', class_id: '', student_code: '', password: '', gender: '' });

  // 1. Generator Fungsi di Paling Atas (Mencegah Hoisting Error)
  const generateStudentCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => { isMountedRef.current = false; };
  }, [activeSchool]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass]);

  useEffect(() => {
    if (showForm) {
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
  }, [showForm]);

  const fetchData = async () => {    
    setLoading(true);
    setError(null);
    try {
      // 1. Load from local IndexedDB & merge with SEED_STUDENTS and SEED_CLASSES
      const localState = await getFullState(true);
      const { SEED_STUDENTS, SEED_CLASSES } = await import('../services/excelDataSeed');

      const classMap = new Map<string, any>();
      if (SEED_CLASSES && SEED_CLASSES.length > 0) {
        SEED_CLASSES.forEach(sc => {
          const id = String(sc.id || sc.idKelas);
          classMap.set(id, { ...sc, id, idKelas: id, school_id: 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7', schoolId: 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7' });
        });
      }
      (localState.classes || []).forEach(lc => {
        const id = String(lc.id || lc.idKelas || lc.id_kelas || '');
        if (id) {
          const existing = classMap.get(id) || {};
          classMap.set(id, { ...existing, ...lc, id, idKelas: id, school_id: 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7', schoolId: 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7' });
        }
      });
      let localClasses = Array.from(classMap.values());

      const studentMap = new Map<string, any>();
      if (SEED_STUDENTS && SEED_STUDENTS.length > 0) {
        SEED_STUDENTS.forEach(ss => {
          const id = String(ss.id || ss.idSiswa);
          studentMap.set(id, { ...ss, id, idSiswa: id, school_id: 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7', schoolId: 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7' });
        });
      }
      (localState.students || []).forEach(ls => {
        const id = String(ls.id || ls.idSiswa || ls.id_siswa || '');
        if (id) {
          const existing = studentMap.get(id) || {};
          studentMap.set(id, { ...existing, ...ls, id, idSiswa: id, school_id: 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7', schoolId: 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7' });
        }
      });
      let localStudents = Array.from(studentMap.values());

      const CLASS_ID_MAP: Record<string, string> = {
        "00000000-0000-4000-8000-000009ad812f": "X-A",
        "00000000-0000-4000-8000-00002da5570c": "X-D",
        "00000000-0000-4000-8000-000071080c55": "X-E",
        "00000000-0000-4000-8000-00000fb56fb6": "X-F",
        "00000000-0000-4000-8000-0000519d2ce9": "X-G",
        "00000000-0000-4000-8000-00004d103678": "X-H",
        "00000000-0000-4000-8000-000014426627": "X-I",
        "00000000-0000-4000-8000-0000759502c6": "X-J",
        "00000000-0000-4000-8000-00002918609b": "X-K",
        "00000000-0000-4000-8000-000018e27fd9": "XI-B",
        "00000000-0000-4000-8000-000048701cc6": "XI-C",
        "00000000-0000-4000-8000-0000563d469b": "XI-D",
        "00000000-0000-4000-8000-00000b155604": "XI-E",
        "00000000-0000-4000-8000-00006c67f2a3": "XI-F",
        "00000000-0000-4000-8000-0000324570be": "XI-G"
      };

      const findClassForStudent = (s: any, classesList: any[]) => {
        const studentClassId = s.classId || s.class_id || s.idKelas;
        const studentClassName = (s.className || s.namaKelas || s.class_name || s.classes?.name || s.classes?.nama_kelas)?.trim()?.toUpperCase();

        if (studentClassId) {
          const matchById = classesList.find(c => {
            const cId = c.id || c.idKelas || c.id_kelas || c.classId;
            return cId && String(cId) === String(studentClassId);
          });
          if (matchById) return matchById;
          
          if (CLASS_ID_MAP[studentClassId]) {
            return { id: studentClassId, idKelas: studentClassId, name: CLASS_ID_MAP[studentClassId], namaKelas: CLASS_ID_MAP[studentClassId] };
          }
        }

        if (studentClassName) {
          const matchByName = classesList.find(c => {
            const cName = (c.name || c.namaKelas || c.nama_kelas)?.trim()?.toUpperCase();
            return cName && String(cName) === String(studentClassName);
          });
          if (matchByName) return matchByName;
          
          return { id: studentClassId || 'legacy', idKelas: studentClassId || 'legacy', name: studentClassName, namaKelas: studentClassName };
        }

        return null;
      };

      const healStudentsList = async (list: any[], classesList: any[]) => {
        let changed = false;
        const healed = await Promise.all(list.map(async (s) => {
          const classId = s.classId || s.class_id || s.idKelas;
          let foundSchoolId = s.school_id || s.schoolId;
          if (!foundSchoolId && classId) {
            const cls = findClassForStudent(s, classesList);
            if (cls) foundSchoolId = cls.school_id || cls.schoolId;
          }
          if (!foundSchoolId && activeSchool?.id && activeSchool.id !== 'legacy') {
            foundSchoolId = activeSchool.id;
          }
          if (foundSchoolId && (s.school_id !== foundSchoolId || s.schoolId !== foundSchoolId || !s.classId || !s.class_id)) {
            changed = true;
            const updated = {
              ...s,
              school_id: foundSchoolId,
              schoolId: foundSchoolId,
              classId: classId || s.classId || s.class_id,
              class_id: classId || s.class_id || s.classId,
              idKelas: classId || s.idKelas || s.classId
            };
            await addStudent(updated as any);
            await saveStudent({
              idSiswa: s.id || s.idSiswa,
              idKelas: classId || s.classId || s.class_id,
              schoolId: foundSchoolId,
              nama: s.name || s.nama,
              nisn: s.nisn || '',
              gender: s.gender || 'L'
            } as any);
            return updated;
          }
          return s;
        }));
        return { list: healed, changed };
      };

      // Auto-heal local students missing school_id
      const firstHeal = await healStudentsList(localStudents, localClasses);
      if (firstHeal.changed) {
        localStudents = firstHeal.list;
      }

      // Filter by active school (never drop records belonging to current teacher)
      const { data: { user } } = await supabase.auth.getUser();
      if (activeSchool?.id) {
        if (activeSchool.id === 'legacy') {
          const validLegacyClassIds = new Set(localClasses.filter(c => !c.school_id && !c.schoolId).map(c => c.id || c.idKelas || c.id_kelas).filter(Boolean));
          localClasses = localClasses.filter(c => !(c as any).school_id && !(c as any).schoolId);
          localStudents = localStudents.filter(s => {
            const sTeacherId = s.teacher_id || s.teacherId || s.user_id;
            const sSchoolId = s.school_id || s.schoolId;
            const sClassId = s.classId || s.class_id || s.idKelas;
            if (user?.id && sTeacherId === user.id) return true;
            return !sSchoolId || (sClassId && validLegacyClassIds.has(sClassId));
          });
        } else {
          localClasses = localClasses.filter(c => {
            const cTeacherId = (c as any).teacher_id || (c as any).teacherId || (c as any).user_id;
            const cSchoolId = (c as any).school_id || (c as any).schoolId;
            if (user?.id && cTeacherId === user.id) return true;
            return !cSchoolId || cSchoolId === activeSchool.id || cSchoolId === 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7';
          });
          const validClassIds = new Set(localClasses.map(c => c.id || c.idKelas || c.id_kelas).filter(Boolean));
          localStudents = localStudents.filter(s => {
            const sTeacherId = s.teacher_id || s.teacherId || s.user_id;
            const sSchoolId = s.school_id || s.schoolId;
            const sClassId = s.classId || s.class_id || s.idKelas;
            if (user?.id && sTeacherId === user.id) return true;
            return !sSchoolId || sSchoolId === activeSchool.id || sSchoolId === 'fe3939e2-1abd-4028-b7a3-1b49a8c3c9a7' || (sClassId && validClassIds.has(sClassId));
          });
        }
      }

      // Map classes.name for students
      const mappedLocalStudents = localStudents.map(s => {
        const cls = findClassForStudent(s, localClasses);
        const resolvedClassId = s.classId || s.class_id || s.idKelas || (cls ? (cls.id || cls.idKelas) : null);
        const resolvedClassName = cls ? (cls.name || cls.namaKelas) : (s.className || s.namaKelas || s.class_name || s.classes?.name || s.classes?.nama_kelas || null);
        return {
          ...s,
          class_id: resolvedClassId,
          classId: resolvedClassId,
          idKelas: resolvedClassId,
          className: resolvedClassName,
          namaKelas: resolvedClassName,
          classes: resolvedClassName ? { name: resolvedClassName } : null
        };
      });

      if (isMountedRef.current) {
        setStudents(mappedLocalStudents);
        setClasses(localClasses.map(c => ({
          ...c,
          id: c.id || c.idKelas || c.id_kelas,
          name: c.name || c.namaKelas
        })));
        setSelectedStudentIds([]);
      }

      // 2. Background Pull from Supabase Cloud to update local databases and sync
      if (user) {
        try {
          const { syncService } = await import('../services/sync');
          await syncService.pullFromCloud();
          
          const updatedLocalState = await getFullState(true);
          let updatedStudents = updatedLocalState.students || [];
          let updatedClasses = updatedLocalState.classes || [];

          // Auto-heal updated students missing school_id
          const secondHeal = await healStudentsList(updatedStudents, updatedClasses);
          if (secondHeal.changed) {
            updatedStudents = secondHeal.list;
          }

          if (activeSchool?.id) {
            if (activeSchool.id === 'legacy') {
              const validLegacyClassIds = new Set(updatedClasses.filter(c => !c.school_id && !c.schoolId).map(c => c.id || c.idKelas || c.id_kelas).filter(Boolean));
              updatedClasses = updatedClasses.filter(c => !(c as any).school_id && !(c as any).schoolId);
              updatedStudents = updatedStudents.filter(s => {
                const sTeacherId = s.teacher_id || s.teacherId || s.user_id;
                const sSchoolId = s.school_id || s.schoolId;
                const sClassId = s.classId || s.class_id || s.idKelas;
                if (user?.id && sTeacherId === user.id) return true;
                return !sSchoolId || (sClassId && validLegacyClassIds.has(sClassId));
              });
            } else {
              updatedClasses = updatedClasses.filter(c => {
                const cTeacherId = (c as any).teacher_id || (c as any).teacherId || (c as any).user_id;
                const cSchoolId = (c as any).school_id || (c as any).schoolId;
                if (user?.id && cTeacherId === user.id) return true;
                return !cSchoolId || cSchoolId === activeSchool.id;
              });
              const validClassIds = new Set(updatedClasses.map(c => c.id || c.idKelas || c.id_kelas).filter(Boolean));
              updatedStudents = updatedStudents.filter(s => {
                const sTeacherId = s.teacher_id || s.teacherId || s.user_id;
                const sSchoolId = s.school_id || s.schoolId;
                const sClassId = s.classId || s.class_id || s.idKelas;
                if (user?.id && sTeacherId === user.id) return true;
                return !sSchoolId || sSchoolId === activeSchool.id || (sClassId && validClassIds.has(sClassId));
              });
            }
          }

          const remappedStudents = updatedStudents.map(s => {
            const cls = findClassForStudent(s, updatedClasses);
            const resolvedClassId = s.classId || s.class_id || s.idKelas || (cls ? (cls.id || cls.idKelas) : null);
            const resolvedClassName = cls ? (cls.name || cls.namaKelas) : (s.className || s.namaKelas || s.class_name || s.classes?.name || s.classes?.nama_kelas || null);
            return {
              ...s,
              class_id: resolvedClassId,
              classId: resolvedClassId,
              idKelas: resolvedClassId,
              className: resolvedClassName,
              namaKelas: resolvedClassName,
              classes: resolvedClassName ? { name: resolvedClassName } : null
            };
          });

          if (isMountedRef.current) {
            setStudents(remappedStudents);
            setClasses(updatedClasses.map(c => ({
              ...c,
              id: c.id || c.idKelas || c.id_kelas,
              name: c.name || c.namaKelas
            })));
          }
        } catch (syncErr) {
          console.warn('Background pull failed:', syncErr);
        }
      }
    } catch (err: any) {
      console.error('Error fetching local/remote data:', err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      
      if (editingId) {
        const { data: updatedStudent, error } = await supabase.from('students').update({ 
          name: formData.name, 
          class_id: formData.class_id || null,
          student_code: formData.student_code.trim() || null,
          password: formData.password.trim() || 'murid19',
          gender: formData.gender || null
        }).eq('id', editingId).select().single();
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
            gender: updatedStudent.gender,
            createdAt: updatedStudent.created_at
          } as any);
          await saveStudent({
            idSiswa: updatedStudent.id,
            teacherId: updatedStudent.teacher_id,
            schoolId: updatedStudent.school_id,
            idKelas: updatedStudent.class_id,
            nama: updatedStudent.name,
            student_code: updatedStudent.student_code,
            password: updatedStudent.password || 'murid19',
            gender: updatedStudent.gender
          } as any);
        }
        showAlert({ title: 'Berhasil', message: 'Data murid diperbarui.', type: 'success' });
      } else {
        if (!activeSchool?.id) {
          throw new Error('Pilih sekolah terlebih dahulu di header.');
        }

        const targetClassId = formData.class_id || (classes.length > 0 ? (classes[0].id || classes[0].idKelas) : null);
        const { data: newStudent, error } = await supabase.from('students').insert([{ 
          teacher_id: user.id, 
          school_id: activeSchool.id,
          name: formData.name, 
          class_id: targetClassId,
          student_code: formData.student_code.trim() || generateStudentCode(),
          password: formData.password.trim() || 'murid19',
          gender: formData.gender || null
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
            gender: newStudent.gender,
            createdAt: newStudent.created_at
          } as any);
          await saveStudent({
            idSiswa: newStudent.id,
            teacherId: newStudent.teacher_id,
            schoolId: newStudent.school_id,
            idKelas: newStudent.class_id,
            nama: newStudent.name,
            student_code: newStudent.student_code,
            password: newStudent.password || 'murid19',
            gender: newStudent.gender
          } as any);
        }
        showAlert({ title: 'Berhasil', message: 'Murid baru ditambahkan.', type: 'success' });
      }
      
      setShowForm(false);
      setFormData({ name: '', class_id: '', student_code: '', password: '', gender: '' });
      setEditingId(null);
      await fetchData();
    } catch (err: any) { 
      console.error('Error saving student:', err);
      showAlert({ title: 'Gagal', message: err.message || 'Terjadi kesalahan saat menyimpan data.', type: 'error' }); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleToggleGender = async (student: any) => {
    let nextGender: 'M' | 'F' | null = null;
    if (!student.gender) nextGender = 'M';
    else if (student.gender === 'M' || student.gender === 'L') nextGender = 'F';
    else nextGender = null;

    const genderLabel = nextGender === 'M' ? 'Laki-laki (L)' : nextGender === 'F' ? 'Perempuan (P)' : 'Kosong (-)';

    showAlert({
      title: 'Ubah Jenis Kelamin?',
      message: `Apakah Anda yakin ingin mengubah jenis kelamin ${student.name} menjadi ${genderLabel}?`,
      type: 'confirm',
      confirmText: 'Ya, Ubah',
      onConfirm: async () => {
        try {
          const { data: updatedStudent, error } = await supabase.from('students').update({ 
            gender: nextGender
          }).eq('id', student.id).select().single();
          if (error) throw error;
          
          if (updatedStudent) {
            await addStudent({
              ...student,
              gender: nextGender
            } as any);
            await saveStudent({
              idSiswa: student.id,
              teacherId: student.teacher_id || student.teacherId,
              schoolId: student.school_id || student.schoolId,
              idKelas: student.class_id,
              nama: student.name,
              student_code: student.student_code,
              password: student.password || 'murid19',
              gender: nextGender
            } as any);
          }
          
          setStudents(prev => prev.map(s => s.id === student.id ? { ...s, gender: nextGender } : s));
          showAlert({ title: 'Berhasil', message: 'Jenis kelamin berhasil diubah.', type: 'success' });
        } catch (err) {
          console.error(err);
          showAlert({ title: 'Gagal', message: 'Gagal memperbarui jenis kelamin.', type: 'error' });
        }
      }
    });
  };

  const handleDelete = async (id: string) => {
    showAlert({
      title: 'Hapus Murid?', message: 'Data murid akan terhapus secara permanen.', type: 'confirm', confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('students').delete().eq('id', id);
          if (error) throw error;
          
          await deleteStudent(id);
          await deleteStudentGrading(id);
          
          if (isMountedRef.current) {
            setSelectedStudentIds(prev => prev.filter(item => item !== id));
            fetchData();
          }
          showAlert({ title: 'Terhapus', message: 'Murid berhasil dihapus.', type: 'success' });
        } catch (error: any) { if (isMountedRef.current) showAlert({ title: 'Gagal', message: error.message, type: 'error' }); }
      }
    });
  };

  const handleResetPassword = async (id: string, name: string) => {
    showAlert({
      title: 'Reset Password',
      message: `Apakah Anda yakin ingin me-reset password ${name} kembali ke default (murid19)?`,
      type: 'confirm',
      confirmText: 'Ya, Reset',
      onConfirm: async () => {
        try {
          const { data: updatedStudent, error } = await supabase
            .from('students')
            .update({ password: 'murid19' })
            .eq('id', id)
            .select()
            .single();

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
          showAlert({ title: 'Berhasil', message: `Password ${name} telah di-reset ke murid19.`, type: 'success' });
          fetchData();
        } catch (err: any) {
          console.error(err);
          showAlert({ title: 'Gagal', message: 'Gagal me-reset password.', type: 'error' });
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedStudentIds.length === 0) return;
    showAlert({
      title: 'Hapus Murid Terpilih?',
      message: `Apakah Anda yakin ingin menghapus ${selectedStudentIds.length} murid terpilih secara permanen?`,
      type: 'confirm',
      confirmText: 'Ya, Hapus Semua',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('students').delete().in('id', selectedStudentIds);
          if (error) throw error;

          for (const id of selectedStudentIds) {
            await deleteStudent(id);
            await deleteStudentGrading(id);
          }

          if (isMountedRef.current) {
            setSelectedStudentIds([]);
            fetchData();
          }
          showAlert({ title: 'Terhapus', message: 'Murid terpilih berhasil dihapus.', type: 'success' });
        } catch (error: any) {
          if (isMountedRef.current) showAlert({ title: 'Gagal', message: error.message, type: 'error' });
        }
      }
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showAlert({ title: 'Disalin!', message: 'Kode unik berhasil disalin.', type: 'success' });
  };

  const handleExportExcel = () => {
    if (selectedClass === 'all') {
      showAlert({ title: 'Pilih Kelas', message: 'Silakan filter berdasarkan kelas tertentu terlebih dahulu.', type: 'warning' });
      return;
    }
    if (filteredStudents.length === 0) {
      showAlert({ title: 'Kosong', message: 'Tidak ada data murid untuk diekspor.', type: 'warning' });
      return;
    }

    const className = classes.find(c => c.id === selectedClass)?.name || 'Kelas';
    const header = ['NAMA LENGKAP', 'JENIS KELAMIN', 'KODE UNIK'];
    const rows = filteredStudents.map(s => [
      s.name, 
      s.gender === 'M' || s.gender === 'L' ? 'L' : s.gender === 'F' || s.gender === 'P' ? 'P' : '-',
      s.student_code || '-'
    ]);

    const worksheet = XLSXStyle.utils.aoa_to_sheet([header, ...rows]);
    
    // Auto-fit column widths
    const maxNameLen = Math.max(
      header[0].length,
      ...rows.map(r => String(r[0] || '').length)
    );
    const maxCodeLen = Math.max(
      header[2].length,
      ...rows.map(r => String(r[2] || '').length)
    );
    
    worksheet['!cols'] = [
      { wch: Math.max(maxNameLen + 3, 18) },
      { wch: 15 },
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
              horizontal: c > 0 ? "center" : "left" // Center align gender & code, left align name
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
    XLSXStyle.writeFile(workbook, `Data_Murid_${className}.xlsx`.replace(/\s+/g, '_'));
  };

  const handleDownloadTemplate = () => {
    const template = [
      { 'Nama Lengkap': 'Ahmad Fauzi', 'Nama Kelas': 'XII IPA 1', 'Jenis Kelamin': 'L' },
      { 'Nama Lengkap': 'Siti Aminah', 'Nama Kelas': 'XII IPA 1', 'Jenis Kelamin': 'P' }
    ];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Murid");
    XLSX.writeFile(workbook, "Template_Import_Murid.xlsx");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSchool?.id) return;
    
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Session expired');
        
        if (!event.target?.result) throw new Error('Gagal membaca file.');
        
        const arrayBuffer = event.target.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
        
        if (rawData.length < 2) throw new Error('File tidak memiliki data.');
        
        const headers = rawData[0].map((h: any) => String(h || '').trim());
        const nameIdx = headers.findIndex(h => h === 'Nama Lengkap');
        const classIdx = headers.findIndex(h => h === 'Nama Kelas');
        const genderIdx = headers.findIndex(h => ['Jenis Kelamin', 'Gender', 'L/P', 'Jenis_Kelamin'].includes(h));
        
        if (nameIdx === -1) throw new Error('Kolom "Nama Lengkap" tidak ditemukan.');
        
        let successCount = 0;
        let errorMessages: string[] = [];
        
        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          const name = String(row[nameIdx] || '').trim();
          if (!name) continue;
          
          try {
            const className = classIdx !== -1 ? String(row[classIdx] || '').trim() : '';
            let classId: string | null = null;
            if (className) {
              const cls = classes.find(c => c.name.toLowerCase() === className.toLowerCase());
              if (cls) { classId = cls.id; }
              else {
                const { data: newCls } = await supabase.from('classes').insert([{ 
                  name: className, 
                  teacher_id: user.id,
                  school_id: activeSchool?.id === 'legacy' ? null : activeSchool?.id
                }]).select().single();
                
                if (newCls) { 
                  classId = newCls.id; 
                  setClasses(prev => [...prev, newCls]); 
                  
                  // Save class locally
                  await addClass({
                    id: newCls.id,
                    teacher_id: newCls.teacher_id,
                    school_id: newCls.school_id,
                    name: newCls.name,
                    subject: newCls.subject || 'Seni Rupa',
                    created_at: newCls.created_at
                  } as any);
                  await saveClass({
                    idKelas: newCls.id,
                    teacherId: newCls.teacher_id,
                    schoolId: newCls.school_id,
                    namaKelas: newCls.name,
                    mapel: newCls.subject || 'Seni Rupa'
                  } as any);
                }
              }
            }
            
            const rawGender = genderIdx !== -1 ? String(row[genderIdx] || '').trim().toUpperCase() : '';
            let genderVal: 'M' | 'F' | null = null;
            if (['L', 'M', 'LAKI', 'LAKI-LAKI', 'MALE', 'MAN', 'PRIA'].includes(rawGender)) {
              genderVal = 'M';
            } else if (['P', 'F', 'PEREMPUAN', 'FEMALE', 'WOMAN', 'WANITA'].includes(rawGender)) {
              genderVal = 'F';
            }
            if (!genderVal) genderVal = detectGenderFromName(name);

            const existingStudent = students.find(s => s.name.toLowerCase() === name.toLowerCase() && s.class_id === classId);
            let studentData = null;
            
            if (existingStudent) {
              const { data, error } = await supabase.from('students').update({ 
                gender: genderVal
              }).eq('id', existingStudent.id).select().single();
              if (error) throw error;
              studentData = data;
            } else {
              const { data, error } = await supabase.from('students').insert([{ 
                teacher_id: user.id, 
                school_id: activeSchool?.id === 'legacy' ? null : activeSchool?.id,
                name, 
                class_id: classId,
                student_code: generateStudentCode(),
                password: 'murid19',
                gender: genderVal
              }]).select().single();
              if (error) throw error;
              studentData = data;
            }

            if (studentData) {
              await addStudent({
                id: studentData.id,
                teacher_id: studentData.teacher_id,
                school_id: studentData.school_id,
                schoolId: studentData.school_id,
                classId: studentData.class_id,
                class_id: studentData.class_id,
                name: studentData.name,
                student_code: studentData.student_code,
                password: studentData.password || 'murid19',
                gender: studentData.gender,
                createdAt: studentData.created_at
              } as any);
              await saveStudent({
                idSiswa: studentData.id,
                teacherId: studentData.teacher_id,
                schoolId: studentData.school_id,
                idKelas: studentData.class_id,
                nama: studentData.name,
                student_code: studentData.student_code,
                password: studentData.password || 'murid19',
                gender: studentData.gender
              } as any);
            }
            successCount++;
          } catch (rowErr: any) {
            errorMessages.push(`Baris ${i + 1}: ${rowErr.message}`);
          }
        }
        
        showAlert({ 
          title: 'Impor Selesai', 
          message: `${successCount} murid berhasil diimpor.`, 
          type: successCount > 0 ? 'success' : 'error' 
        });
        if (isMountedRef.current) fetchData();
      } catch (err: any) { 
        if (isMountedRef.current) showAlert({ title: 'Gagal Impor', message: err.message, type: 'error' }); 
      } finally { 
        if (isMountedRef.current) setImporting(false); 
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredStudents = useMemo(() => {
    const list = students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClass === 'all' || s.class_id === selectedClass;
      return matchesSearch && matchesClass;
    });
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));
  }, [students, searchTerm, selectedClass]);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#1D4ED8] tracking-tight">Kelola Murid</h2>
          <p className="text-slate-500 mt-1 font-medium">Daftar nama murid untuk rekapitulasi data pengerjaan ujian.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleDownloadTemplate} className="bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" /> Template
          </button>
          <button onClick={handleExportExcel} className="bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-emerald-100 transition-all border border-emerald-100">
            <Download className="w-4 h-4" /> Ekspor Excel
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="bg-[#3B66F5]/10 text-indigo-700 px-4 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-indigo-100 transition-all border border-[#3B66F5]/20">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Impor Murid
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
          {selectedStudentIds.length > 0 && (
            <button onClick={handleBulkDelete} className="bg-rose-50 text-rose-700 px-4 py-2.5 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-rose-100 transition-all border border-rose-100">
              <Trash2 className="w-4 h-4" /> Hapus Terpilih ({selectedStudentIds.length})
            </button>
          )}
          <button onClick={() => { setEditingId(null); setFormData({ name: '', class_id: '', student_code: '', password: '', gender: '' }); setShowForm(true); }}
            className="bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-slate-200/50 active:scale-[0.98] border border-white/10"
          >
            <Plus className="w-4 h-4" /> Tambah Murid
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input type="text" placeholder="Cari berdasarkan nama murid..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] transition-all text-sm font-medium text-slate-700"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <select className="w-full pl-10 pr-8 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] appearance-none bg-white text-sm font-medium text-slate-700 transition-all cursor-pointer"
            value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">Semua Kelas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 w-12 text-center">
                  <input type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#3B66F5]/20 cursor-pointer"
                    checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudentIds.includes(s.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const newSelections = [...selectedStudentIds];
                        paginatedStudents.forEach(s => {
                          if (!newSelections.includes(s.id)) newSelections.push(s.id);
                        });
                        setSelectedStudentIds(newSelections);
                      } else {
                        const paginatedIds = paginatedStudents.map(s => s.id);
                        setSelectedStudentIds(selectedStudentIds.filter(id => !paginatedIds.includes(id)));
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Data Murid</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">L/P</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Kelas</th>
                <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-lg w-full"></div></td>
                  </tr>
                ))
              ) : filteredStudents.length > 0 ? (
                paginatedStudents.map((s, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                    key={s.id} className={cn("hover:bg-slate-50/50 transition-all group", selectedStudentIds.includes(s.id) && "bg-[#3B66F5]/10/30 hover:bg-[#3B66F5]/10/40")}
                  >
                    <td className="px-6 py-4 w-12 text-center">
                      <input type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-[#1D4ED8] focus:ring-[#3B66F5]/20 cursor-pointer"
                        checked={selectedStudentIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds([...selectedStudentIds, s.id]);
                          } else {
                            setSelectedStudentIds(selectedStudentIds.filter(id => id !== s.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#3B66F5]/10 text-[#3B66F5] flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-[#1D4ED8] text-sm">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleGender(s)}
                        title="Klik cepat untuk ubah L/P"
                        className="hover:scale-105 active:scale-95 transition-all outline-none"
                      >
                        {s.gender === 'M' || s.gender === 'L' ? (
                          <span className="bg-[#3B66F5]/5 text-blue-700 px-2.5 py-1 rounded-md text-xs font-black border border-[#3B66F5]/30/60 cursor-pointer">L</span>
                        ) : s.gender === 'F' || s.gender === 'P' ? (
                          <span className="bg-pink-50 text-pink-700 px-2.5 py-1 rounded-md text-xs font-black border border-pink-200/60 cursor-pointer">P</span>
                        ) : (
                          <span className="bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 px-2.5 py-1 rounded-md text-xs font-black border border-slate-200/60 cursor-pointer">-</span>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#3B66F5]/10 text-indigo-700 px-2.5 py-1 rounded-md font-mono font-semibold text-xs tracking-wider">{s.student_code || '-'}</span>
                        {s.student_code && (
                          <button onClick={() => copyCode(s.student_code)} className="p-1 text-slate-400 hover:text-[#3B66F5] transition-colors">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 font-semibold text-xs border border-slate-200 whitespace-nowrap">{s.classes?.name || s.className || s.namaKelas || s.class_name || s.classes?.nama_kelas || 'Tanpa Kelas'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleResetPassword(s.id, s.name)} 
                          title="Reset Password ke murid19"
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingId(s.id); setFormData({ name: s.name, class_id: s.class_id || '', student_code: s.student_code || '', password: s.password || 'murid19', gender: s.gender || '' }); setShowForm(true); }}
                          className="p-2 text-slate-400 hover:text-[#1D4ED8] hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 text-sm font-medium">
                    Tidak ada murid ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredStudents.length > ITEMS_PER_PAGE && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            <span className="text-xs font-semibold text-slate-500">
              Menampilkan {Math.min(filteredStudents.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)} - {Math.min(filteredStudents.length, currentPage * ITEMS_PER_PAGE)} dari {filteredStudents.length} murid
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Sebelumnya
              </button>
              <span className="text-xs font-bold text-slate-700 px-2">
                Halaman {currentPage} dari {Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredStudents.length / ITEMS_PER_PAGE), prev + 1))}
                disabled={currentPage === Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowForm(false)} className="absolute inset-0 bg-[#1D4ED8]/30 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 10 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-7">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#1D4ED8]">{editingId ? 'Edit Data Murid' : 'Tambah Murid Baru'}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                  <input type="text" required placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] text-sm font-medium text-[#1D4ED8]"
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pilih Kelas</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] text-sm font-medium text-[#1D4ED8]"
                    value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  >
                    <option value="">Tanpa Kelas</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jenis Kelamin</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] text-sm font-medium text-[#1D4ED8]"
                    value={formData.gender || ''} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="M">Laki-laki (L)</option>
                    <option value="F">Perempuan (P)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</label>
                  <input type="text" placeholder={editingId ? "Masukkan username" : "Kosongkan untuk generate otomatis"}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] text-sm font-medium text-[#1D4ED8] font-mono tracking-wider"
                    value={formData.student_code} onChange={(e) => setFormData({ ...formData, student_code: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                  <input type="text" placeholder="Kosongkan untuk default 'murid19'"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] text-sm font-medium text-[#1D4ED8] font-mono"
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 text-sm font-medium text-slate-400 hover:bg-slate-50 rounded-full transition-all">Batal</button>
                  <button type="submit" disabled={submitting} className="flex-[2] bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-110 shadow-sm active:scale-[0.98] transition-all border border-white/10">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Perbarui Data' : 'Simpan Murid'}
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
