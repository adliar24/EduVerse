import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BookOpen, 
  FileText, 
  Plus, 
  Calendar, 
  Clock, 
  Trash2, 
  Edit3, 
  Users, 
  Search, 
  Link2, 
  ExternalLink,
  ChevronLeft,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '../context/AlertContext';
import { useSchool } from '../context/SchoolContext';
import { getFullState, addMaterial, deleteMaterial, addAssignment, deleteAssignment } from '../services/dbAttendance';
import { ClassEntity, Student, Material, Assignment } from '../types';
import { v4 as uuidv4 } from 'uuid';
import LinkPreviewCard from '../components/LinkPreviewCard';

export default function KelolaMateriTugas() {
  const { showAlert } = useAlert();
  const { activeSchool } = useSchool();
  const isMountedRef = useRef(true);

  // States
  const [activeTab, setActiveTab] = useState<'materials' | 'assignments'>('materials');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Form States
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingGroupIds, setEditingGroupIds] = useState<string[]>([]);
  const [formType, setFormType] = useState<'material' | 'assignment'>('material');
  
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formIsGraded, setFormIsGraded] = useState(true);
  const [formClassId, setFormClassId] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [formTargetType, setFormTargetType] = useState<'class' | 'students'>('class');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Class selection for filtering list
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  
  // Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Clear selection when tab or filter changes
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, selectedClassFilter]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [showModal]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => {
      isMountedRef.current = false;
    };
  }, [activeSchool]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Load local state
      const localState = await getFullState(true);
      let localClasses = localState.classes || [];
      let localStudents = localState.students || [];
      let localMaterials = (localState as any).materials || [];
      let localAssignments = (localState as any).assignments || [];

      // Filter by school scope
      if (activeSchool?.id) {
        if (activeSchool.id === 'legacy') {
          localClasses = localClasses.filter(c => !(c as any).school_id && !(c as any).schoolId);
          localStudents = localStudents.filter(s => !(s as any).school_id && !s.schoolId);
          localMaterials = localMaterials.filter((m: any) => !m.school_id && !m.schoolId);
          localAssignments = localAssignments.filter((a: any) => !a.school_id && !a.schoolId);
        } else {
          localClasses = localClasses.filter(c => (c as any).school_id === activeSchool.id || (c as any).schoolId === activeSchool.id);
          localStudents = localStudents.filter(s => (s as any).school_id === activeSchool.id || s.schoolId === activeSchool.id);
          localMaterials = localMaterials.filter((m: any) => m.school_id === activeSchool.id || m.schoolId === activeSchool.id);
          localAssignments = localAssignments.filter((a: any) => a.school_id === activeSchool.id || a.schoolId === activeSchool.id);
        }
      }

      if (isMountedRef.current) {
        setClasses(localClasses);
        setStudents(localStudents);
        setMaterials(localMaterials);
        setAssignments(localAssignments);
        if (localClasses.length > 0 && !formClassId) {
          setFormClassId(localClasses[0].id);
        }
      }

      // Background pull from Supabase Cloud to update local databases
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const { syncService } = await import('../services/sync');
          await syncService.pullFromCloud();
          
          const freshState = await getFullState(true);
          let freshClasses = freshState.classes || [];
          let freshStudents = freshState.students || [];
          let freshMaterials = (freshState as any).materials || [];
          let freshAssignments = (freshState as any).assignments || [];

          if (activeSchool?.id) {
            if (activeSchool.id === 'legacy') {
              freshClasses = freshClasses.filter(c => !(c as any).school_id && !(c as any).schoolId);
              freshStudents = freshStudents.filter(s => !(s as any).school_id && !s.schoolId);
              freshMaterials = freshMaterials.filter((m: any) => !m.school_id && !m.schoolId);
              freshAssignments = freshAssignments.filter((a: any) => !a.school_id && !a.schoolId);
            } else {
              freshClasses = freshClasses.filter(c => (c as any).school_id === activeSchool.id || (c as any).schoolId === activeSchool.id);
              freshStudents = freshStudents.filter(s => (s as any).school_id === activeSchool.id || s.schoolId === activeSchool.id);
              freshMaterials = freshMaterials.filter((m: any) => m.school_id === activeSchool.id || m.schoolId === activeSchool.id);
              freshAssignments = freshAssignments.filter((a: any) => a.school_id === activeSchool.id || a.schoolId === activeSchool.id);
            }
          }

          if (isMountedRef.current) {
            setClasses(freshClasses);
            setStudents(freshStudents);
            setMaterials(freshMaterials);
            setAssignments(freshAssignments);
          }
        } catch (syncErr) {
          console.warn('Background pull failed:', syncErr);
        }
      }
    } catch (err) {
      console.error('Error fetching materials and assignments data:', err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  // Filter students by selected classes for targeting
  const targetClassStudents = useMemo(() => {
    const activeClassIds = selectedClassIds.length > 0 ? selectedClassIds : (formClassId && formClassId !== 'all' ? [formClassId] : []);
    return students
      .filter(s => activeClassIds.length === 0 || activeClassIds.includes(s.classId || (s as any).class_id || ''))
      .filter(s => (s.name || '').toLowerCase().includes(studentSearchTerm.toLowerCase()))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [students, formClassId, selectedClassIds, studentSearchTerm]);

  // Handle student select/deselect in the target checklist
  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const handleOpenCreateModal = (type: 'material' | 'assignment') => {
    setEditingId(null);
    setEditingGroupIds([]);
    setFormType(type);
    setFormTitle('');
    setFormDesc('');
    setFormLink('');
    setFormDeadline('');
    setFormIsGraded(true);
    setFormClassId(classes[0]?.id || 'all');
    setSelectedClassIds([]);
    setFormTargetType('class');
    setSelectedStudentIds([]);
    setStudentSearchTerm('');
    setShowModal(true);
  };

  const handleOpenEditModal = (item: any, type: 'material' | 'assignment') => {
    setEditingId(item.id);
    setEditingGroupIds(item.ids || [item.id]);
    setFormType(type);
    setFormTitle(item.title);
    setFormDesc(item.description);
    setFormLink(item.link || '');
    if (type === 'assignment') {
      setFormIsGraded(item.isGraded !== false && item.is_graded !== false);
      // Format deadline to yyyy-MM-ddThh:mm
      if (item.deadline) {
        const d = new Date(item.deadline);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        setFormDeadline(`${year}-${month}-${date}T${hours}:${minutes}`);
      } else {
        setFormDeadline('');
      }
    }
    const itemClassIds = item.classIds || (item.classId || item.class_id ? [item.classId || item.class_id] : []);
    setFormClassId(itemClassIds.length > 0 ? itemClassIds[0] : 'all');
    setSelectedClassIds(itemClassIds);
    setFormTargetType(item.targetType || item.target_type || 'class');
    setSelectedStudentIds(item.studentIds || item.student_ids || []);
    setStudentSearchTerm('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim()) {
      showAlert({ title: 'Input Tidak Lengkap', message: 'Harap lengkapi judul dan deskripsi.', type: 'warning' });
      return;
    }

    const effectiveClassIds = selectedClassIds.length > 0
      ? selectedClassIds
      : (formClassId && formClassId !== 'all' ? [formClassId] : []);

    if (effectiveClassIds.length === 0) {
      showAlert({ title: 'Kelas Belum Dipilih', message: 'Harap pilih minimal satu kelas target.', type: 'warning' });
      return;
    }

    if (formTargetType === 'students' && selectedStudentIds.length === 0) {
      showAlert({ title: 'Murid Belum Dipilih', message: 'Harap pilih minimal satu murid jika memilih target Murid Tertentu.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User session expired. Silakan login kembali.');

      const activeSchoolId = activeSchool?.id === 'legacy' ? null : (activeSchool?.id || null);

      // Map class_id to the existing DB record ID
      const classToRecordIdMap: { [classId: string]: string } = {};
      if (editingId && editingGroupIds.length > 0) {
        const list = formType === 'material' ? materials : assignments;
        editingGroupIds.forEach(gid => {
          const rec = list.find(r => r.id === gid);
          if (rec) {
            const cid = rec.classId || (rec as any).class_id;
            if (cid) {
              classToRecordIdMap[cid] = gid;
            }
          }
        });
      }

      const classesToDelete = Object.keys(classToRecordIdMap).filter(cid => !effectiveClassIds.includes(cid));
      const classesToUpsert = effectiveClassIds;

      const tableName = formType === 'material' ? 'materials' : 'assignments';

      // 1. Delete records for classes that were deselected
      if (classesToDelete.length > 0) {
        const idsToDelete = classesToDelete.map(cid => classToRecordIdMap[cid]);
        const { error: deleteErr } = await supabase
          .from(tableName)
          .delete()
          .in('id', idsToDelete);
        if (deleteErr) throw deleteErr;

        for (const id of idsToDelete) {
          if (formType === 'material') {
            await deleteMaterial(id);
          } else {
            await deleteAssignment(id);
          }
        }
      }

      // 2. Upsert (insert or update) records for classes in classesToUpsert
      if (formType === 'material') {
        for (const classId of classesToUpsert) {
          const uuid = classToRecordIdMap[classId] || uuidv4();
          const payload = {
            id: uuid,
            teacher_id: user.id,
            school_id: activeSchoolId,
            class_id: classId,
            title: formTitle.trim(),
            description: formDesc.trim(),
            link: formLink.trim() || null,
            target_type: formTargetType,
            student_ids: formTargetType === 'students' ? selectedStudentIds.filter(sid => {
              const s = students.find(st => st.id === sid);
              return s && (s.classId === classId || (s as any).class_id === classId);
            }) : [],
          };

          const { error } = await supabase.from('materials').upsert(payload);
          if (error) throw error;

          await addMaterial({
            id: uuid,
            teacherId: user.id,
            teacher_id: user.id,
            schoolId: activeSchoolId,
            school_id: activeSchoolId,
            classId: classId,
            class_id: classId,
            title: formTitle.trim(),
            description: formDesc.trim(),
            link: formLink.trim() || null,
            targetType: formTargetType,
            target_type: formTargetType,
            studentIds: payload.student_ids,
            student_ids: payload.student_ids,
            created_at: new Date().toISOString()
          });
        }
      } else {
        const deadlineISO = formDeadline ? new Date(formDeadline).toISOString() : null;
        for (const classId of classesToUpsert) {
          const uuid = classToRecordIdMap[classId] || uuidv4();
          const payload = {
            id: uuid,
            teacher_id: user.id,
            school_id: activeSchoolId,
            class_id: classId,
            title: formTitle.trim(),
            description: formDesc.trim(),
            link: formLink.trim() || null,
            deadline: deadlineISO,
            target_type: formTargetType,
            student_ids: formTargetType === 'students' ? selectedStudentIds.filter(sid => {
              const s = students.find(st => st.id === sid);
              return s && (s.classId === classId || (s as any).class_id === classId);
            }) : [],
            is_graded: formIsGraded,
          };

          const { error } = await supabase.from('assignments').upsert(payload);
          if (error) throw error;

          await addAssignment({
            id: uuid,
            teacherId: user.id,
            teacher_id: user.id,
            schoolId: activeSchoolId,
            school_id: activeSchoolId,
            classId: classId,
            class_id: classId,
            title: formTitle.trim(),
            description: formDesc.trim(),
            link: formLink.trim() || null,
            deadline: deadlineISO || undefined,
            targetType: formTargetType,
            target_type: formTargetType,
            studentIds: payload.student_ids,
            student_ids: payload.student_ids,
            isGraded: formIsGraded,
            is_graded: formIsGraded,
            created_at: new Date().toISOString()
          });
        }
      }

      showAlert({ 
        title: 'Berhasil Disimpan', 
        message: `${formType === 'material' ? 'Materi' : 'Tugas'} berhasil diposting ke ${effectiveClassIds.length} kelas.`, 
        type: 'success' 
      });
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      showAlert({ title: 'Gagal Menyimpan', message: err.message || 'Terjadi kesalahan pada database.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (ids: string[], title: string, type: 'material' | 'assignment') => {
    showAlert({
      title: 'Hapus Data?',
      message: `Apakah Anda yakin ingin menghapus ${type === 'material' ? 'materi' : 'tugas'} "${title}" secara permanen?`,
      type: 'confirm',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          const tableName = type === 'material' ? 'materials' : 'assignments';
          
          // 1. Delete from Cloud
          const { error } = await supabase
            .from(tableName)
            .delete()
            .in('id', ids);

          if (error) throw error;

          // 2. Delete locally
          for (const id of ids) {
            if (type === 'material') {
              await deleteMaterial(id);
            } else {
              await deleteAssignment(id);
            }
          }

          showAlert({ title: 'Terhapus', message: 'Data berhasil dihapus dari cloud dan penyimpanan lokal.', type: 'success' });
          fetchData();
        } catch (err: any) {
          console.error(err);
          showAlert({ title: 'Gagal Menghapus', message: err.message || 'Gagal menghapus data.', type: 'error' });
        }
      }
    });
  };

  // Filter and group lists based on selected class filter
  const filteredMaterialsList = useMemo(() => {
    const groups: { [key: string]: any } = {};
    materials.forEach(m => {
      const classId = m.classId || (m as any).class_id;
      const key = `${(m.title || '').trim()}_${(m.description || '').trim()}_${m.link || ''}_${m.target_type || m.targetType || ''}`;
      if (!groups[key]) {
        groups[key] = {
          id: m.id,
          ids: [m.id],
          classIds: classId ? [classId] : [],
          title: m.title,
          description: m.description,
          link: m.link,
          target_type: m.target_type || m.targetType,
          student_ids: m.student_ids || m.studentIds || [],
          created_at: m.created_at || m.createdAt
        };
      } else {
        groups[key].ids.push(m.id);
        if (classId && !groups[key].classIds.includes(classId)) {
          groups[key].classIds.push(classId);
        }
        if (new Date(m.created_at || m.createdAt || 0) > new Date(groups[key].created_at || 0)) {
          groups[key].created_at = m.created_at || m.createdAt;
        }
      }
    });

    return Object.values(groups)
      .filter((g: any) => {
        if (selectedClassFilter === 'all') return true;
        return g.classIds.includes(selectedClassFilter);
      })
      .sort((a: any, b: any) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  }, [materials, selectedClassFilter]);

  const filteredAssignmentsList = useMemo(() => {
    const groups: { [key: string]: any } = {};
    assignments.forEach(a => {
      const classId = a.classId || (a as any).class_id;
      const key = `${(a.title || '').trim()}_${(a.description || '').trim()}_${a.link || ''}_${a.target_type || a.targetType || ''}_${a.is_graded || a.isGraded || false}_${a.deadline || ''}`;
      if (!groups[key]) {
        groups[key] = {
          id: a.id,
          ids: [a.id],
          classIds: classId ? [classId] : [],
          title: a.title,
          description: a.description,
          link: a.link,
          target_type: a.target_type || a.targetType,
          student_ids: a.student_ids || a.studentIds || [],
          is_graded: a.is_graded !== false && a.isGraded !== false,
          isGraded: a.is_graded !== false && a.isGraded !== false,
          deadline: a.deadline,
          created_at: a.created_at || a.createdAt
        };
      } else {
        groups[key].ids.push(a.id);
        if (classId && !groups[key].classIds.includes(classId)) {
          groups[key].classIds.push(classId);
        }
        if (new Date(a.created_at || a.createdAt || 0) > new Date(groups[key].created_at || 0)) {
          groups[key].created_at = a.created_at || a.createdAt;
        }
      }
    });

    return Object.values(groups)
      .filter((g: any) => {
        if (selectedClassFilter === 'all') return true;
        return g.classIds.includes(selectedClassFilter);
      })
      .sort((a: any, b: any) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  }, [assignments, selectedClassFilter]);

  const currentActiveList = useMemo(() => {
    return activeTab === 'materials' ? filteredMaterialsList : filteredAssignmentsList;
  }, [activeTab, filteredMaterialsList, filteredAssignmentsList]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allActiveIds = currentActiveList.map(item => item.id);
    const allSelected = allActiveIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !allActiveIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const newSelection = [...prev];
        allActiveIds.forEach(id => {
          if (!newSelection.includes(id)) newSelection.push(id);
        });
        return newSelection;
      });
    }
  };

  const handleDeleteBulk = (idsToDelete: string[], isAll: boolean) => {
    if (idsToDelete.length === 0) return;

    // Convert representation IDs to all DB IDs
    const dbIdsToDelete = idsToDelete.flatMap(repId => {
      const group = currentActiveList.find(item => item.id === repId);
      return group ? (group.ids || [group.id]) : [repId];
    });
    
    const typeLabel = activeTab === 'materials' ? 'materi' : 'tugas';
    const message = isAll
      ? `Apakah Anda yakin ingin menghapus SEMUA ${typeLabel} (${dbIdsToDelete.length} data) yang tampil saat ini secara permanen?`
      : `Apakah Anda yakin ingin menghapus ${dbIdsToDelete.length} ${typeLabel} terpilih secara permanen?`;

    showAlert({
      title: isAll ? 'Hapus Semua Data?' : 'Hapus Data Terpilih?',
      message: message,
      type: 'confirm',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          const tableName = activeTab === 'materials' ? 'materials' : 'assignments';
          
          // 1. Delete from Cloud
          const { error } = await supabase
            .from(tableName)
            .delete()
            .in('id', dbIdsToDelete);

          if (error) throw error;

          // 2. Delete locally
          for (const id of dbIdsToDelete) {
            if (activeTab === 'materials') {
              await deleteMaterial(id);
            } else {
              await deleteAssignment(id);
            }
          }

          showAlert({ title: 'Terhapus', message: `${dbIdsToDelete.length} data berhasil dihapus dari cloud dan penyimpanan lokal.`, type: 'success' });
          setSelectedIds([]);
          fetchData();
        } catch (err: any) {
          console.error(err);
          showAlert({ title: 'Gagal Menghapus', message: err.message || 'Gagal menghapus data.', type: 'error' });
        }
      }
    });
  };

  return (
    <div className="space-y-6 pb-10 font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-indigo-950 tracking-tight">Materi & Tugas</h2>
          <p className="text-slate-500 mt-1 font-medium">Buat dan kelola materi pelajaran serta lembar tugas murid.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleOpenCreateModal('material')}
            className="bg-white text-indigo-950 border border-slate-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 text-blue-600" /> Tambah Materi
          </button>
          <button 
            onClick={() => handleOpenCreateModal('assignment')}
            className="bg-indigo-950 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-900 active:scale-[0.98] transition-all shadow-lg shadow-slate-200/50"
          >
            <Plus className="w-4 h-4 text-white" /> Tambah Tugas
          </button>
        </div>
      </div>

      {/* Tabs & Class Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-2">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('materials')}
            className={`font-black text-lg pb-2.5 border-b-2 transition-all relative ${
              activeTab === 'materials' 
                ? 'text-indigo-950 border-indigo-950' 
                : 'text-slate-400 border-transparent hover:text-indigo-950'
            }`}
          >
            Materi Pelajaran
            {materials.length > 0 && (
              <span className="ml-2 bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {materials.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('assignments')}
            className={`font-black text-lg pb-2.5 border-b-2 transition-all relative ${
              activeTab === 'assignments' 
                ? 'text-indigo-950 border-indigo-950' 
                : 'text-slate-400 border-transparent hover:text-indigo-950'
            }`}
          >
            Tugas Murid
            {assignments.length > 0 && (
              <span className="ml-2 bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {assignments.length}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter Kelas:</span>
          <select 
            value={selectedClassFilter} 
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-indigo-950 outline-none cursor-pointer"
          >
            <option value="all">Semua Kelas</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {!loading && currentActiveList.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input 
                type="checkbox"
                checked={currentActiveList.length > 0 && currentActiveList.every(item => selectedIds.includes(item.id))}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
              Pilih Semua ({currentActiveList.length} item)
            </label>
            {selectedIds.length > 0 && (
              <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-100">
                {selectedIds.length} Terpilih
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                onClick={() => handleDeleteBulk(selectedIds.filter(id => currentActiveList.some(item => item.id === id)), false)}
                className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Terpilih
              </button>
            )}
            <button
              onClick={() => handleDeleteBulk(currentActiveList.map(item => item.id), true)}
              className="bg-white text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-[0.98]"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Hapus Semua
            </button>
          </div>
        </div>
      )}

      {/* Main List Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-950 animate-spin" />
          <p className="text-slate-500 mt-2 font-medium">Memuat data...</p>
        </div>
      ) : activeTab === 'materials' ? (
        // MATERIALS LIST
        filteredMaterialsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMaterialsList.map((m) => {
              return (
                <div key={m.id} className={`bg-white p-6 rounded-2xl border transition-all flex flex-col justify-between gap-4 relative group ${
                  selectedIds.includes(m.id) ? 'border-indigo-950 shadow-md bg-indigo-50/10' : 'border-slate-100 shadow-sm hover:shadow-md'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(m.id)}
                          onChange={() => handleToggleSelect(m.id)}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        {(m.classIds || []).map((cid: string) => {
                          const cls = classes.find(c => c.id === cid);
                          return (
                            <span key={cid} className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-md">
                              {cls?.name || 'Semua Kelas'}
                            </span>
                          );
                        })}
                      </div>
                      {m.target_type === 'students' && (
                        <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-100">
                          <Users className="w-3.5 h-3.5" />
                          {m.student_ids?.length || 0} Murid
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-indigo-950 leading-snug">{m.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 whitespace-pre-line">{m.description}</p>
                  </div>

                  {m.link && (
                    <div className="border-t border-slate-50 pt-3 mt-2">
                      <LinkPreviewCard url={m.link} />
                    </div>
                  )}

                  <div className="border-t border-slate-50 pt-3 flex items-center justify-end mt-1">
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleOpenEditModal(m, 'material')}
                        className="p-2 text-slate-400 hover:text-indigo-950 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Materi"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(m.ids || [m.id], m.title, 'material')}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Materi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Belum ada materi pelajaran.</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol di atas untuk membagikan materi pertama Anda.</p>
          </div>
        )
      ) : (
        // ASSIGNMENTS LIST
        filteredAssignmentsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignmentsList.map((a) => {
              // Deadline check
              const hasDeadline = !!a.deadline;
              const deadlineDate = hasDeadline ? new Date(a.deadline!) : null;
              const isOverdue = deadlineDate ? deadlineDate.getTime() < Date.now() : false;
              
              return (
                <div key={a.id} className={`bg-white p-6 rounded-2xl border transition-all flex flex-col justify-between gap-4 relative group ${
                  selectedIds.includes(a.id) ? 'border-indigo-950 shadow-md bg-indigo-50/10' : 'border-slate-100 shadow-sm hover:shadow-md'
                }`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(a.id)}
                          onChange={() => handleToggleSelect(a.id)}
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        {(a.classIds || []).map((cid: string) => {
                          const cls = classes.find(c => c.id === cid);
                          return (
                            <span key={cid} className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-md">
                              {cls?.name || 'Semua Kelas'}
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {a.isGraded !== false && a.is_graded !== false ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                            Diberi Nilai
                          </span>
                        ) : (
                          <span className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200/60">
                            Tanpa Nilai
                          </span>
                        )}
                        {a.target_type === 'students' && (
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-100">
                            <Users className="w-3.5 h-3.5" />
                            {a.student_ids?.length || 0} Murid
                          </span>
                        )}
                        {hasDeadline ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                            isOverdue 
                              ? 'bg-rose-50 text-rose-700 border-rose-100' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {isOverdue ? 'Selesai' : 'Aktif'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border bg-emerald-50 text-emerald-700 border-emerald-100">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            Tanpa Tenggat
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-indigo-950 leading-snug">{a.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 whitespace-pre-line">{a.description}</p>
                  </div>

                  <div className="space-y-3 mt-2">
                    {hasDeadline ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <Calendar className="w-4 h-4 text-indigo-900" />
                        Tenggat: <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold'}>
                          {new Date(a.deadline!).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        Tenggat: <span className="font-bold">Tanpa Tenggat</span>
                      </div>
                    )}

                    {a.link && (
                      <div className="pt-2">
                        <LinkPreviewCard url={a.link} />
                      </div>
                    )}

                    <div className="border-t border-slate-50 pt-3 flex items-center justify-end">
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => handleOpenEditModal(a, 'assignment')}
                          className="p-2 text-slate-400 hover:text-indigo-950 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Tugas"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(a.ids || [a.id], a.title, 'assignment')}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Tugas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Belum ada tugas belajar.</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol di atas untuk membuat tugas pertama Anda.</p>
          </div>
        )
      )}

      {/* Creation/Editing Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => { if (!submitting) setShowModal(false); }}
            />
            {/* Panel */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar relative z-10 shadow-2xl border border-slate-100"
            >
              <div className="p-8">
                <h3 className="text-2xl font-black text-indigo-950 mb-6 tracking-tight">
                  {editingId ? 'Edit' : 'Tambah'} {formType === 'material' ? 'Materi Pelajaran' : 'Tugas Murid'}
                </h3>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-slate-700 ml-0.5">Judul {formType === 'material' ? 'Materi' : 'Tugas'}</label>
                  <input 
                    type="text" 
                    required 
                    placeholder={`Masukkan judul ${formType === 'material' ? 'materi' : 'tugas'}...`}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-950 text-sm font-semibold text-slate-800 transition-colors"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[13px] font-bold text-slate-700 ml-0.5">Deskripsi / Instruksi</label>
                  <textarea 
                    required 
                    rows={4}
                    placeholder={`Tulis penjelasan materi atau deskripsi petunjuk pengerjaan tugas...`}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-950 text-sm font-semibold text-slate-800 transition-colors resize-none"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[13px] font-bold text-slate-700 ml-0.5">Tautan Luar (Google Drive, dll)</label>
                    <input 
                      type="url" 
                      placeholder="https://drive.google.com/..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-950 text-sm font-semibold text-slate-800 transition-colors"
                      value={formLink}
                      onChange={(e) => setFormLink(e.target.value)}
                    />
                  </div>

                  {formType === 'assignment' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[13px] font-bold text-slate-700 ml-0.5">Tenggat Waktu (Deadline) (Opsional)</label>
                        <input 
                          type="datetime-local" 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-950 text-sm font-semibold text-slate-800 transition-colors"
                          value={formDeadline}
                          onChange={(e) => setFormDeadline(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[13px] font-bold text-slate-700 ml-0.5">Penilaian</label>
                        <div className="flex gap-4 py-2.5">
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                            <input 
                              type="radio" 
                              name="is_graded" 
                              checked={formIsGraded === true} 
                              onChange={() => setFormIsGraded(true)}
                            />
                            Diberi Nilai
                          </label>
                          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                            <input 
                              type="radio" 
                              name="is_graded" 
                              checked={formIsGraded === false} 
                              onChange={() => setFormIsGraded(false)}
                            />
                            Tugas Tanpa Nilai
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t border-slate-50 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-bold text-slate-700 ml-0.5">Target Kelas</label>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedClassIds.length === classes.length) {
                            setSelectedClassIds([]);
                          } else {
                            setSelectedClassIds(classes.map(c => c.id));
                          }
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        {selectedClassIds.length === classes.length ? 'Batal Pilih Semua' : 'Pilih Semua Kelas'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {classes.map(c => {
                        const isChecked = selectedClassIds.includes(c.id);
                        const studentCount = students.filter(s => s.classId === c.id || (s as any).class_id === c.id).length;
                        return (
                          <button
                            type="button"
                            key={c.id}
                            onClick={() => {
                              setSelectedClassIds(prev =>
                                isChecked ? prev.filter(id => id !== c.id) : [...prev, c.id]
                              );
                            }}
                            className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                              isChecked
                                ? 'bg-indigo-950 border-indigo-950 text-white shadow-md'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span className="truncate pr-2">
                              {c.name}
                              <span className={`block text-[10px] font-semibold ${isChecked ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {studentCount} siswa
                              </span>
                            </span>
                            {isChecked && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                    {selectedClassIds.length > 0 && (
                      <p className="text-[11px] font-bold text-indigo-600 ml-0.5">
                        {selectedClassIds.length} kelas dipilih
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1 border-t border-slate-50 pt-4">
                  <label className="text-[13px] font-bold text-slate-700 ml-0.5">Target Penerima</label>
                    <div className="flex gap-4 py-2.5">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name="target_type" 
                          checked={formTargetType === 'class'} 
                          onChange={() => setFormTargetType('class')}
                        />
                        Seluruh Kelas
                      </label>
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                        <input 
                          type="radio" 
                          name="target_type" 
                          checked={formTargetType === 'students'} 
                          onChange={() => setFormTargetType('students')}
                        />
                        Murid Tertentu
                      </label>
                    </div>
                </div>

                {/* Target Checklist specific students */}
                <AnimatePresence>
                  {formTargetType === 'students' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest">Pilih Murid Target ({selectedStudentIds.length})</h4>
                        <div className="relative max-w-[200px]">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                          <input 
                            type="text" 
                            placeholder="Cari murid..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-indigo-950 text-xs font-bold text-slate-700"
                            value={studentSearchTerm}
                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      {targetClassStudents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                          {targetClassStudents.map(student => {
                            const isChecked = selectedStudentIds.includes(student.id!);
                            const studentClassId = student.classId || (student as any).class_id;
                            const studentClass = classes.find(c => c.id === studentClassId);
                            const classLabel = studentClass ? ` (${studentClass.name})` : '';
                            return (
                              <button
                                type="button"
                                key={student.id}
                                onClick={() => handleToggleStudent(student.id!)}
                                className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                                  isChecked 
                                    ? 'bg-indigo-950 border-indigo-950 text-white shadow-md' 
                                    : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200'
                                }`}
                              >
                                <span className="truncate pr-2">{student.name}{classLabel}</span>
                                {isChecked && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-200">
                          <p className="text-xs font-bold text-slate-400">Tidak ada siswa ditemukan.</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                  <button 
                    type="button" 
                    disabled={submitting}
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 rounded-xl font-bold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="bg-indigo-950 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-900 active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Postingan'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
