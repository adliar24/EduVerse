import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Library, Loader2
} from 'lucide-react';
import { 
  TeacherProfile, LearningObjective
} from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Header, Layout, PageTransition, Modal, Input, Select
} from '../Layout';

export const TPManagerScreen: React.FC = () => {
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [allTP, setAllTP] = useState<LearningObjective[]>([]);
    const [selectedMapel, setSelectedMapel] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingTP, setEditingTP] = useState<LearningObjective | null>(null);
    const [formData, setFormData] = useState({ kode: '', deskripsi: '' });

    useEffect(() => {
        db.getTeacherProfile().then(p => {
            if (p) {
                setProfile(p);
                if (p.subjects.length > 0) setSelectedMapel(p.subjects[0]);
            }
        });
        db.getLearningObjectives().then(setAllTP);
    }, []);

    const filteredTP = allTP.filter(lo => lo.mapel === selectedMapel);

    const handleSaveTP = async () => {
        if (!formData.kode || !formData.deskripsi || !selectedMapel) {
            alert("Harap isi kode dan deskripsi TP.");
            return;
        }

        const activeSchoolId = (await db.getTeacherProfile())?.activeSchoolId || '';
        const lo: LearningObjective = {
            id: editingTP ? editingTP.id : crypto.randomUUID(),
            schoolId: editingTP?.schoolId || activeSchoolId,
            mapel: selectedMapel,
            kode: formData.kode,
            deskripsi: formData.deskripsi
        };

        await db.saveLearningObjective(lo);
        const updated = await db.getLearningObjectives();
        setAllTP(updated);
        setIsAddOpen(false);
        setEditingTP(null);
        setFormData({ kode: '', deskripsi: '' });
    };

    const handleDeleteTP = async (id: string) => {
        if (confirm("Hapus Tujuan Pembelajaran ini?")) {
            await db.deleteLearningObjective(id);
            const updated = await db.getLearningObjectives();
            setAllTP(updated);
        }
    };

    const openEdit = (lo: LearningObjective) => {
        setEditingTP(lo);
        setFormData({ kode: lo.kode, deskripsi: lo.deskripsi });
        setIsAddOpen(true);
    };

    if (!profile) return <Layout><div className="flex items-center justify-center p-40"><Loader2 className="animate-spin text-[#3B66F5]" size={60}/></div></Layout>;

    return (
        <Layout>
            <Header 
                title="Tujuan Pembelajaran (TP)" 
                subtitle="Manajemen Capaian Kompetensi per Mapel" 
                backTo="/profile" 
            />

            <PageTransition className="space-y-6 mt-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <Select 
                            label="Pilih Mata Pelajaran" 
                            value={selectedMapel} 
                            onChange={e => setSelectedMapel(e.target.value)}
                        >
                            {profile.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                    </div>
                    <button 
                        onClick={() => { setEditingTP(null); setFormData({ kode: '', deskripsi: '' }); setIsAddOpen(true); }}
                        className="w-full md:w-auto px-6 h-14 bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all self-end"
                    >
                        <Plus size={18} strokeWidth={3} /> Tambah TP Baru
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTP.length > 0 ? (
                        filteredTP.map(lo => (
                            <div key={lo.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col group hover:border-emerald-200 transition-all hover:shadow-md">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                        {lo.kode}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(lo)} className="p-2 text-slate-400 hover:text-[#3B66F5] transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteTP(lo.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4 flex-1">
                                    {lo.deskripsi}
                                </p>
                                <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                    Sumber: Lokal
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                            <Library size={48} className="opacity-20 mb-4" />
                            <p className="font-black text-xs uppercase tracking-widest opacity-40">Belum ada TP untuk mapel ini</p>
                        </div>
                    )}
                </div>

                <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingTP ? "Ubah TP" : "Tambah TP Baru"}>
                    <div className="space-y-6 py-2">
                        <Input 
                            label="Kode TP" 
                            placeholder="Contoh: TP 1.1 atau 12.1" 
                            value={formData.kode} 
                            onChange={e => setFormData({...formData, kode: e.target.value})} 
                        />
                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deskripsi Tujuan Pembelajaran</label>
                             <textarea 
                                value={formData.deskripsi} 
                                onChange={e => setFormData({...formData, deskripsi: e.target.value})}
                                rows={4}
                                placeholder="Tujuan yang ingin dicapai siswa..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-bold text-slate-700 outline-none focus:border-[#3B66F5] transition-all resize-none text-sm leading-relaxed"
                             />
                             <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase">Tuliskan kompetensi inti yang dinilai (Akan masuk e-Rapor)</p>
                        </div>
                        <Button 
                            onClick={handleSaveTP} 
                            className="w-full py-5 uppercase tracking-widest font-black"
                        >
                            {editingTP ? "Simpan Perubahan" : "Simpan TP"}
                        </Button>
                    </div>
                </Modal>
            </PageTransition>
        </Layout>
    );
};
