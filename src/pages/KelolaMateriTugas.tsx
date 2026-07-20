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
  const [formType, setFormType] = useState<'material' | 'assignment'>('material');
  
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formTargetType, setFormTargetType] = useState<'class' | 'students'>('class');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  // Class selection for filtering list
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

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

  // Filter students by selected class for targeting
  const targetClassStudents = useMemo(() => {
    return students
      .filter(s => s.classId === formClassId || (s as any).class_id === formClassId)
      .filter(s => (s.name || '').toLowerCase().includes(studentSearchTerm.toLowerCase()))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [students, formClassId, studentSearchTerm]);

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
    setFormType(type);
    setFormTitle('');
    setFormDesc('');
    setFormLink('');
    setFormDeadline('');
    setFormClassId(classes[0]?.id || '');
    setFormTargetType('class');
    setSelectedStudentIds([]);
    setStudentSearchTerm('');
    setShowModal(true);
  };

  const handleOpenEditModal = (item: any, type: 'material' | 'assignment') => {
    setEditingId(item.id);
    setFormType(type);
    setFormTitle(item.title);
    setFormDesc(item.description);
    setFormLink(item.link || '');
    if (type === 'assignment') {
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
    setFormClassId(item.classId || item.class_id || classes[0]?.id || '');
    setFormTargetType(item.targetType || item.target_type || 'class');
    setSelectedStudentIds(item.studentIds || item.student_ids || []);
    setStudentSearchTerm('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim() || !formClassId) {
      showAlert({ title: 'Input Tidak Lengkap', message: 'Harap lengkapi judul, deskripsi, dan kelas target.', type: 'warning' });
      return;
    }

    if (formTargetType === 'students' && selectedStudentIds.length === 0) {
      showAlert({ title: 'Siswa Belum Dipilih', message: 'Harap pilih minimal satu siswa jika memilih target Siswa Tertentu.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User session expired. Silakan login kembali.');

      const activeSchoolId = activeSchool?.id === 'legacy' ? null : (activeSchool?.id || null);
      const uuid = editingId || uuidv4();

      if (formType === 'material') {
        const payload = {
          id: uuid,
          teacher_id: user.id,
          school_id: activeSchoolId,
          class_id: formClassId,
          title: formTitle.trim(),
          description: formDesc.trim(),
          link: formLink.trim() || null,
          target_type: formTargetType,
          student_ids: formTargetType === 'students' ? selectedStudentIds : [],
        };

        // 1. Save directly to cloud
        const { error } = await supabase
          .from('materials')
          .upsert(payload);

        if (error) throw error;

        // 2. Save locally
        await addMaterial({
          id: uuid,
          teacherId: user.id,
          teacher_id: user.id,
          schoolId: activeSchoolId,
          school_id: activeSchoolId,
          classId: formClassId,
          class_id: formClassId,
          title: formTitle.trim(),
          description: formDesc.trim(),
          link: formLink.trim() || null,
          targetType: formTargetType,
          target_type: formTargetType,
          studentIds: formTargetType === 'students' ? selectedStudentIds : [],
          student_ids: formTargetType === 'students' ? selectedStudentIds : [],
          created_at: new Date().toISOString()
        });
      } else {
        const deadlineISO = formDeadline ? new Date(formDeadline).toISOString() : null;
        const payload = {
          id: uuid,
          teacher_id: user.id,
          school_id: activeSchoolId,
          class_id: formClassId,
          title: formTitle.trim(),
          description: formDesc.trim(),
          link: formLink.trim() || null,
          deadline: deadlineISO,
          target_type: formTargetType,
          student_ids: formTargetType === 'students' ? selectedStudentIds : [],
        };

        // 1. Save directly to cloud
        const { error } = await supabase
          .from('assignments')
          .upsert(payload);

        if (error) throw error;

        // 2. Save locally
        await addAssignment({
          id: uuid,
          teacherId: user.id,
          teacher_id: user.id,
          schoolId: activeSchoolId,
          school_id: activeSchoolId,
          classId: formClassId,
          class_id: formClassId,
          title: formTitle.trim(),
          description: formDesc.trim(),
          link: formLink.trim() || null,
          deadline: deadlineISO || undefined,
          targetType: formTargetType,
          target_type: formTargetType,
          studentIds: formTargetType === 'students' ? selectedStudentIds : [],
          student_ids: formTargetType === 'students' ? selectedStudentIds : [],
          created_at: new Date().toISOString()
        });
      }

      showAlert({ 
        title: 'Berhasil Disimpan', 
        message: `${formType === 'material' ? 'Materi' : 'Tugas'} berhasil disimpan dan disinkronkan ke cloud.`, 
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

  const handleDelete = (id: string, title: string, type: 'material' | 'assignment') => {
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
            .eq('id', id);

          if (error) throw error;

          // 2. Delete locally
          if (type === 'material') {
            await deleteMaterial(id);
          } else {
            await deleteAssignment(id);
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

  // Filter lists based on selected class filter
  const filteredMaterialsList = useMemo(() => {
    return materials
      .filter(m => selectedClassFilter === 'all' || m.classId === selectedClassFilter || (m as any).class_id === selectedClassFilter)
      .sort((a, b) => new Date(b.created_at || b.createdAt || '').getTime() - new Date(a.created_at || a.createdAt || '').getTime());
  }, [materials, selectedClassFilter]);

  const filteredAssignmentsList = useMemo(() => {
    return assignments
      .filter(a => selectedClassFilter === 'all' || a.classId === selectedClassFilter || (a as any).class_id === selectedClassFilter)
      .sort((a, b) => new Date(b.created_at || b.createdAt || '').getTime() - new Date(a.created_at || a.createdAt || '').getTime());
  }, [assignments, selectedClassFilter]);

  return (
    <div className="space-y-6 pb-10 font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-indigo-950 tracking-tight">Materi & Tugas</h2>
          <p className="text-slate-500 mt-1 font-medium">Buat dan kelola materi pelajaran serta lembar tugas siswa.</p>
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
            Tugas Siswa
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
              const cls = classes.find(c => c.id === m.classId || (c as any).class_id === m.classId);
              return (
                <div key={m.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-md">
                        {cls?.name || 'Semua Kelas'}
                      </span>
                      {m.target_type === 'students' && (
                        <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-100">
                          <Users className="w-3.5 h-3.5" />
                          {m.student_ids?.length || 0} Siswa
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-indigo-950 leading-snug">{m.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 whitespace-pre-line">{m.description}</p>
                  </div>

                  <div className="border-t border-slate-50 pt-4 flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      {m.link && (
                        <a 
                          href={m.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Link2 className="w-3.5 h-3.5" /> Buka Materi <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleOpenEditModal(m, 'material')}
                        className="p-2 text-slate-400 hover:text-indigo-950 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Materi"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(m.id, m.title, 'material')}
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
              const cls = classes.find(c => c.id === a.classId || (c as any).class_id === a.classId);
              
              // Deadline check
              const hasDeadline = !!a.deadline;
              const deadlineDate = hasDeadline ? new Date(a.deadline!) : null;
              const isOverdue = deadlineDate ? deadlineDate.getTime() < Date.now() : false;
              
              return (
                <div key={a.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1 rounded-md">
                        {cls?.name || 'Semua Kelas'}
                      </span>
                      <div className="flex gap-1">
                        {a.target_type === 'students' && (
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-100">
                            <Users className="w-3.5 h-3.5" />
                            {a.student_ids?.length || 0} Siswa
                          </span>
                        )}
                        {hasDeadline && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                            isOverdue 
                              ? 'bg-rose-50 text-rose-700 border-rose-100' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {isOverdue ? 'Selesai' : 'Aktif'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-indigo-950 leading-snug">{a.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 whitespace-pre-line">{a.description}</p>
                  </div>

                  <div className="space-y-3 mt-2">
                    {hasDeadline && (
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
                    )}

                    <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {a.link && (
                          <a 
                            href={a.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Link2 className="w-3.5 h-3.5" /> Lampiran Tugas <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => handleOpenEditModal(a, 'assignment')}
                          className="p-2 text-slate-400 hover:text-indigo-950 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Tugas"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(a.id, a.title, 'assignment')}
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
              className="bg-white rounded-[2.5rem] p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto relative z-10 shadow-2xl border border-slate-100"
            >
              <h3 className="text-2xl font-black text-indigo-950 mb-6 tracking-tight">
                {editingId ? 'Edit' : 'Tambah'} {formType === 'material' ? 'Materi Pelajaran' : 'Tugas Siswa'}
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
                    <div className="space-y-1">
                      <label className="text-[13px] font-bold text-slate-700 ml-0.5">Tenggat Waktu (Deadline)</label>
                      <input 
                        type="datetime-local" 
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-950 text-sm font-semibold text-slate-800 transition-colors"
                        value={formDeadline}
                        onChange={(e) => setFormDeadline(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                  <div className="space-y-1">
                    <label className="text-[13px] font-bold text-slate-700 ml-0.5">Target Kelas</label>
                    <select 
                      value={formClassId}
                      onChange={(e) => {
                        setFormClassId(e.target.value);
                        setSelectedStudentIds([]);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-950 text-sm font-semibold text-slate-800 transition-colors cursor-pointer bg-white"
                    >
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
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
                        Siswa Tertentu
                      </label>
                    </div>
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
                        <h4 className="text-xs font-black text-indigo-950 uppercase tracking-widest">Pilih Siswa Target ({selectedStudentIds.length})</h4>
                        <div className="relative max-w-[200px]">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                          <input 
                            type="text" 
                            placeholder="Cari siswa..."
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
                                <span className="truncate pr-2">{student.name}</span>
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
