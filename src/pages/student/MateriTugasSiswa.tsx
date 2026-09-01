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
  Search,
  RotateCw,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Material, Assignment } from '../../types';
import LinkPreviewCard from '../../components/LinkPreviewCard';

export default function MateriTugasSiswa() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'materials' | 'assignments'>('materials');
  const [studentInfo, setStudentInfo] = useState<any>(null);
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setErrorMsg(null);

      const studentSessionStr = localStorage.getItem('student_session');
      if (!studentSessionStr) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const studentObj = JSON.parse(studentSessionStr);

      // Fetch student data securely from Supabase using ID to ensure fresh class and profile
      const { data: studentDb, error: studentDbErr } = await supabase
        .from('students')
        .select('*, classes!students_class_id_fkey(name)')
        .eq('id', studentObj.id)
        .maybeSingle();

      if (studentDbErr) {
        throw studentDbErr;
      }

      if (!studentDb) {
        setErrorMsg('Data profil siswa tidak ditemukan di server.');
        return;
      }

      // Keep student_session updated with latest DB state
      localStorage.setItem('student_session', JSON.stringify({
        ...studentObj,
        id: studentDb.id,
        student_code: studentDb.student_code,
        name: studentDb.name,
        class_id: studentDb.class_id,
        school_id: studentDb.school_id,
        gender: studentDb.gender
      }));

      setStudentInfo(studentDb);

      const classId = studentDb.class_id || studentDb.classId || studentDb.idKelas || studentObj.class_id;

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
    } catch (err: any) {
      console.error('Error fetching student materials & assignments:', err);
      setErrorMsg(err.message || 'Gagal memuat materi & tugas terbaru.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        <button
          onClick={() => fetchStudentData(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-indigo-950 rounded-xl font-bold text-xs border border-slate-200 shadow-sm transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto cursor-pointer"
          title="Tarik data terbaru dari guru"
        >
          <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
          <span>{refreshing ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-red-700 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
          <button 
            onClick={() => fetchStudentData(true)}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

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
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-500 mt-3 font-semibold text-sm">Memuat materi & tugas terbaru...</p>
        </div>
      ) : activeTab === 'materials' ? (
        // MATERIALS VIEW
        filteredMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMaterials.map((m) => {
              const isYoutube = m.link && (m.link.includes('youtu.be') || m.link.includes('youtube.com'));
              const isDrive = m.link && (m.link.includes('drive.google.com') || m.link.includes('docs.google.com'));

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={m.id} 
                  className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200/70 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        Materi Belajar
                      </span>
                      {m.target_type === 'students' && (
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/70 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Khusus Anda
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                      {m.title}
                    </h3>
                    
                    {m.description && (
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line line-clamp-3">
                        {m.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    {m.link ? (
                      <div className="space-y-2">
                        {/* High-visibility Action Button (CTA) */}
                        <a
                          href={m.link.startsWith('http') ? m.link : `https://${m.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all cursor-pointer"
                        >
                          {isYoutube ? '🎥 Tonton Video Materi' : isDrive ? '📂 Buka Dokumen / Drive' : '🚀 Buka Materi Belajar'}
                          <ExternalLink className="w-4 h-4 ml-0.5" />
                        </a>

                        {/* Embedded Link Preview */}
                        <div className="pt-1">
                          <LinkPreviewCard url={m.link} />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs font-semibold text-slate-400">
                        Materi Berupa Teks / Instruksi Guru
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-4xl">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-3 border border-indigo-100">
              <BookOpen className="w-7 h-7" />
            </div>
            <p className="text-slate-700 font-bold text-base">Tidak ada materi belajar.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Materi pelajaran yang dibagikan oleh guru untuk kelas Anda akan muncul di sini secara otomatis.
            </p>
          </div>
        )
      ) : (
        // ASSIGNMENTS VIEW
        filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAssignments.map((a) => {
              const hasDeadline = !!a.deadline;
              const deadlineDate = hasDeadline ? new Date(a.deadline!) : null;
              const isOverdue = deadlineDate ? deadlineDate.getTime() < Date.now() : false;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={a.id} 
                  className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/70 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        Tugas Sekolah
                      </span>
                      
                      <div className="flex gap-1.5 flex-wrap">
                        {hasDeadline && (
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isOverdue 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {isOverdue ? 'Lewat Tenggat' : 'Tersedia'}
                          </span>
                        )}
                        {a.target_type === 'students' && (
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/70 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            Khusus Anda
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                      {a.title}
                    </h3>
                    
                    {a.description && (
                      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line line-clamp-3">
                        {a.description}
                      </p>
                    )}
                  </div>
 
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    {/* Deadline info strip */}
                    {hasDeadline ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <Clock className={`w-4 h-4 ${isOverdue ? 'text-rose-500' : 'text-indigo-600'}`} />
                        <span>Tenggat: <b className={isOverdue ? 'text-rose-600' : 'text-slate-800'}>
                          {new Date(a.deadline!).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </b></span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>Tenggat: <b>Tanpa Batas Waktu</b></span>
                      </div>
                    )}

                    {/* High-visibility Action Button (CTA) */}
                    {a.link ? (
                      <div className="space-y-2">
                        <a
                          href={a.link.startsWith('http') ? a.link : `https://${a.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all cursor-pointer"
                        >
                          <span>📝 Buka & Kerjakan Lembar Tugas</span>
                          <ExternalLink className="w-4 h-4 ml-0.5" />
                        </a>

                        <div className="pt-1">
                          <LinkPreviewCard url={a.link} />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs font-semibold text-slate-400">
                        Instruksi Pengumpulan Diberitahukan di Kelas
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm max-w-4xl">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-3 border border-indigo-100">
              <FileText className="w-7 h-7" />
            </div>
            <p className="text-slate-700 font-bold text-base">Tidak ada tugas sekolah.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tugas yang dibagikan oleh guru untuk kelas Anda akan muncul di sini.
            </p>
          </div>
        )
      )}
    </div>
  );
}
