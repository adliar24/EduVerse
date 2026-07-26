import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Clock, 
  Link2, 
  ExternalLink,
  Loader2,
  Users,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Material, Assignment } from '../../types';
import LinkPreviewCard from '../../components/LinkPreviewCard';

export default function MateriTugasSiswa() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'materials' | 'assignments'>('materials');
  const [studentInfo, setStudentInfo] = useState<any>(null);
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const studentSessionStr = localStorage.getItem('student_session');
      if (!studentSessionStr) return;
      
      const studentObj = JSON.parse(studentSessionStr);

      // Fetch student data securely from Supabase using ID
      const { data: studentDb, error: studentDbErr } = await supabase
        .from('students')
        .select('*, classes!students_class_id_fkey(name)')
        .eq('id', studentObj.id)
        .maybeSingle();

      if (studentDbErr || !studentDb) return;
      setStudentInfo(studentDb);

      const classId = studentDb.class_id || studentDb.classId || studentDb.idKelas;

      if (classId) {
        // Fetch materials and assignments for this class
        const [materialsRes, assignmentsRes] = await Promise.all([
          supabase.from('materials').select('*').eq('class_id', classId),
          supabase.from('assignments').select('*').eq('class_id', classId)
        ]);

        if (materialsRes.data) {
          // Filter: only public class target OR specifically targeted to this student ID
          const filteredM = (materialsRes.data as Material[]).filter(m => 
            m.target_type === 'class' || 
            (m.target_type === 'students' && (m.student_ids || []).includes(studentDb.id))
          );
          setMaterials(filteredM);
        }

        if (assignmentsRes.data) {
          const filteredA = (assignmentsRes.data as Assignment[]).filter(a => 
            a.target_type === 'class' || 
            (a.target_type === 'students' && (a.student_ids || []).includes(studentDb.id))
          );
          setAssignments(filteredA);
        }
      }
    } catch (err) {
      console.error('Error fetching student materials & assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered lists by search term
  const filteredMaterials = useMemo(() => {
    return materials
      .filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()) || m.description.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.created_at || b.createdAt || '').getTime() - new Date(a.created_at || a.createdAt || '').getTime());
  }, [materials, searchTerm]);

  const filteredAssignments = useMemo(() => {
    return assignments
      .filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.description.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.created_at || b.createdAt || '').getTime() - new Date(a.created_at || a.createdAt || '').getTime());
  }, [assignments, searchTerm]);

  return (
    <div className="space-y-6 pb-10 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-indigo-950 tracking-tight">Materi & Tugas Saya</h2>
          <p className="text-slate-500 mt-1 font-medium">Akses materi belajar dan periksa daftar tugas Anda.</p>
        </div>
      </div>

      {/* Info Banner */}
      {studentInfo && (
        <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-4xl">
          <div>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">Murid Terdaftar</span>
            <span className="font-bold text-lg text-indigo-950 block leading-tight">{studentInfo.name}</span>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">Kelas: {studentInfo.classes?.name || 'Tidak diketahui'}</span>
          </div>
          <div className="bg-[#3B66F5] text-white px-4 py-2.5 rounded-xl font-bold text-xs self-start sm:self-center">
            Kode Murid: {studentInfo.student_code}
          </div>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-2">
        <div className="flex gap-6">
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
            Tugas
            {assignments.length > 0 && (
              <span className="ml-2 bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {assignments.length}
              </span>
            )}
          </button>
        </div>
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder={`Cari ${activeTab === 'materials' ? 'materi' : 'tugas'}...`}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none focus:border-indigo-950 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main List Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-950 animate-spin" />
          <p className="text-slate-500 mt-2 font-medium">Memuat data...</p>
        </div>
      ) : activeTab === 'materials' ? (
        // MATERIALS VIEW
        filteredMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredMaterials.map((m) => (
              <div key={m.id} className="bg-gradient-to-br from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white p-4 rounded-2xl border border-white/20 shadow-md hover:scale-[1.01] transition-all flex flex-col justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider border border-white/10">
                      Materi Belajar
                    </span>
                    {m.target_type === 'students' && (
                      <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/10">
                        Khusus Anda
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-extrabold text-white leading-snug">{m.title}</h3>
                  <p className="text-white/85 text-xs sm:text-sm leading-relaxed whitespace-pre-line">{m.description}</p>
                </div>

                {m.link && (
                  <div className="border-t border-white/15 pt-3 mt-2">
                    <LinkPreviewCard url={m.link} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 max-w-4xl">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Tidak ada materi belajar.</p>
            <p className="text-xs text-slate-400 mt-1">Materi pelajaran yang dibagikan guru akan muncul di sini.</p>
          </div>
        )
      ) : (
        // ASSIGNMENTS VIEW
        filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAssignments.map((a) => {
              const hasDeadline = !!a.deadline;
              const deadlineDate = hasDeadline ? new Date(a.deadline!) : null;
              const isOverdue = deadlineDate ? deadlineDate.getTime() < Date.now() : false;
              
              return (
                <div key={a.id} className="bg-gradient-to-br from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white p-4 rounded-2xl border border-white/20 shadow-md hover:scale-[1.01] transition-all flex flex-col justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-white/20 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider border border-white/10">
                        Tugas Sekolah
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        {a.isGraded !== false && a.is_graded !== false ? (
                          <span className="bg-white/25 text-white text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/10">
                            Diberi Nilai
                          </span>
                        ) : (
                          <span className="bg-white/10 text-white/70 text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/5">
                            Tanpa Nilai
                          </span>
                        )}
                        {a.target_type === 'students' && (
                          <span className="bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-md border border-white/10">
                            Khusus Anda
                          </span>
                        )}
                        {hasDeadline ? (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                            isOverdue 
                              ? 'bg-rose-500/30 text-rose-100 border-rose-300/30' 
                              : 'bg-white/20 text-white border-white/10'
                          }`}>
                            {isOverdue ? 'Selesai' : 'Tersedia'}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md border bg-white/20 text-white border-white/10">
                            Tanpa Tenggat
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-base font-extrabold text-white leading-snug">{a.title}</h3>
                    <p className="text-white/85 text-xs sm:text-sm leading-relaxed whitespace-pre-line">{a.description}</p>
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
                      <div className="border-t border-slate-50 pt-2">
                        <LinkPreviewCard url={a.link} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 max-w-4xl">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-bold">Tidak ada tugas sekolah.</p>
            <p className="text-xs text-slate-400 mt-1">Tugas yang dibagikan guru akan muncul di sini.</p>
          </div>
        )
      )}
    </div>
  );
}
