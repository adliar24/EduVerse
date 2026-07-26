import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Save, Plus, X, Calendar, 
  Activity, Settings2, Info, ChevronLeft, Target
} from 'lucide-react';
import { Meeting, LearningObjective, AssessmentCategory, PRESET_ACTIVITIES } from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Input, Select, Card, Modal,
  Header, Layout, PageTransition, useToast
} from '../Layout';
import { useTeacherProfile, useClasses } from '../../services/hooks';

export const CreateMeetingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { profile: teacherProfile } = useTeacherProfile();
  const { classes } = useClasses(teacherProfile?.activeSchoolId);
  const [learningObjectives, setLearningObjectives] = useState<LearningObjective[]>([]);
  const [selectedMapel, setSelectedMapel] = useState('');
  
  const [formData, setFormData] = useState<Partial<Meeting>>({
    tanggal: new Date().toISOString().slice(0, 10),
    urutanKe: 1,
    activityType: PRESET_ACTIVITIES[0].name,
    assessmentCategory: PRESET_ACTIVITIES[0].category as AssessmentCategory,
    aspekPenilaian: 'Pengetahuan',
    idTP: ''
  });

  useEffect(() => {
    const loadData = async () => {
      const schoolId = teacherProfile?.activeSchoolId || null;
      if (teacherProfile) setFormData(prev => ({ ...prev, semester: teacherProfile.semester }));
      setLearningObjectives(await db.getLearningObjectives(undefined, schoolId || undefined));
    };
    if (teacherProfile) loadData();
  }, [teacherProfile]);

  const filteredTP = useMemo(() => {
      if (!selectedMapel) return [];
      return learningObjectives.filter(lo => lo.mapel === selectedMapel);
  }, [selectedMapel, learningObjectives]);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const clsId = e.target.value;
      const cls = classes.find(c => c.idKelas === clsId);
      setFormData({ ...formData, idKelas: clsId });
      setSelectedMapel(cls?.mapel || '');
  };

  const handleSubmit = async () => {
    if (!formData.idKelas || !formData.materi) {
      showToast("Mohon lengkapi data kelas dan materi.", "warning");
      return;
    }

    const profile = await db.getTeacherProfile();
    const schoolId = profile?.activeSchoolId || '';
    const activityName = `${formData.activityType} - ${formData.materi}`;
    const cls = classes.find(c => c.idKelas === formData.idKelas);
    
    try {
      const id = crypto.randomUUID();
      await db.saveMeeting({
        ...formData,
        idPertemuan: id,
        schoolId,
        mapel: cls?.mapel || '',
        activityName,
        tanggal: formData.tanggal || new Date().toISOString(),
        urutanKe: Number(formData.urutanKe) || 1,
        semester: profile?.semester || '1'
      } as Meeting);
      
      showToast("Pertemuan berhasil dibuat");
      navigate(`/grading/score/${id}`);
    } catch (err: any) {
      showToast("Gagal membuat pertemuan: " + err.message, "error");
    }
  };

  return (
    <Layout>
      <Header title="Pertemuan Baru" subtitle="Setup Aktivitas & Penilaian" backTo="/grading" />
      
      <PageTransition className="max-w-3xl mx-auto py-6">
         <Card className="p-8 md:p-12 shadow-2xl border-2 border-blue-50 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[5rem] -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="space-y-10 relative z-10">
               {/* 1. KELAS & MATERI */}
               <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <Save size={20} strokeWidth={2.5}/>
                     </div>
                     <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Identitas Pembelajaran</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                     <Select label="Pilih Kelas" value={formData.idKelas} onChange={handleClassChange}>
                        <option value="">-- Pilih Kelas --</option>
                        {classes.map(c => <option key={c.idKelas} value={c.idKelas}>{c.namaKelas} ({c.mapel})</option>)}
                     </Select>
                     <Input 
                        label="Topik / Materi Utama" 
                        placeholder="Misal: Trigonometri, Descriptive Text..." 
                        value={formData.materi} 
                        onChange={e => setFormData({...formData, materi: e.target.value})} 
                     />
                  </div>
               </section>

               <hr className="border-slate-100" />

               {/* 2. KONFIGURASI PENILAIAN */}
               <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
                        <Settings2 size={20} strokeWidth={2.5}/>
                     </div>
                     <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Konfigurasi Penilaian</h3>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                     <Select 
                        label="Kategori Penilaian" 
                        value={formData.activityType} 
                        onChange={e => {
                           const type = e.target.value;
                           const preset = PRESET_ACTIVITIES.find(p => p.name === type);
                           setFormData({
                              ...formData, 
                              activityType: type, 
                              assessmentCategory: (preset?.category || 'Formatif') as AssessmentCategory
                           });
                        }}
                     >
                        {PRESET_ACTIVITIES.map(p => <option key={p.name} value={p.name}>{p.name} ({p.category})</option>)}
                     </Select>

                     <Select 
                        label="Aspek" 
                        value={formData.aspekPenilaian} 
                        onChange={e => setFormData({...formData, aspekPenilaian: e.target.value as any})}
                     >
                        <option value="Pengetahuan">Pengetahuan</option>
                        <option value="Keterampilan">Keterampilan</option>
                        <option value="Sikap">Sikap</option>
                     </Select>

                     <Input 
                        label="Pertemuan Ke-" 
                        type="number" 
                        value={formData.urutanKe} 
                        onChange={e => setFormData({...formData, urutanKe: Number(e.target.value)})} 
                     />
                  </div>

                  <div className="pt-2">
                     <Select 
                        label="Tujuan Pembelajaran (TP) Terkait" 
                        value={formData.idTP} 
                        onChange={e => setFormData({...formData, idTP: e.target.value})}
                        className="!bg-slate-50 border-none"
                     >
                        <option value="">-- Pilih TP (Opsional untuk deskripsi rapor) --</option>
                        {filteredTP.map(lo => <option key={lo.id} value={lo.id}>{lo.kode}: {lo.deskripsi}</option>)}
                     </Select>
                     {selectedMapel && filteredTP.length === 0 && (
                        <p className="text-[10px] text-red-400 font-bold mt-2 ml-1 uppercase">* Belum ada TP untuk mapel {selectedMapel}. Setup di e-Rapor.</p>
                     )}
                  </div>
               </section>

               <hr className="border-slate-100" />

               {/* 3. WAKTU */}
               <section className="space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Calendar size={20} strokeWidth={2.5}/>
                     </div>
                     <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Waktu Pelaksanaan</h3>
                  </div>
                  <Input type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
               </section>

                <div className="pt-8 flex flex-col md:flex-row gap-4">
                   <Button variant="secondary" onClick={() => navigate('/grading')} className="flex-1 !py-5 text-xs uppercase tracking-widest font-black cursor-pointer">Batal</Button>
                   <Button onClick={handleSubmit} className="flex-[2] !py-5 text-xs uppercase tracking-widest font-black shadow-glow cursor-pointer">Mulai Input Nilai</Button>
                </div>
            </div>
         </Card>
      </PageTransition>
    </Layout>
  );
};
