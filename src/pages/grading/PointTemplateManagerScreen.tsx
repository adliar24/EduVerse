import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Zap, TrendingUp, TrendingDown, Edit2, Trash2, ArrowLeft, Save
} from 'lucide-react';
import { TeacherProfile, PointTemplate } from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Input, Modal,
  Header, Layout, PageTransition, useToast
} from '../Layout';

export const PointTemplateManagerScreen: React.FC<{ profile: TeacherProfile | null, refreshProfile: () => void }> = ({ profile, refreshProfile }) => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [templates, setTemplates] = useState<PointTemplate[]>([]);
    const [activeListTab, setActiveListTab] = useState<'positive' | 'negative'>('positive');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<PointTemplate | null>(null);
    const [formData, setFormData] = useState({ title: '', amount: '', type: 'positive' as 'positive' | 'negative' });
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });

    const loadData = useCallback(async () => {
        if (!profile?.activeSchoolId) return;
        const pts = await db.getPointTemplates(profile.activeSchoolId);
        setTemplates(pts);
    }, [profile?.activeSchoolId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async () => {
        if (!formData.title.trim() || !formData.amount) {
            showToast("Judul dan jumlah poin wajib diisi.", "warning");
            return;
        }

        const schoolId = profile?.activeSchoolId || '';
        const amountNum = Math.abs(Number(formData.amount));
        const finalAmount = formData.type === 'positive' ? amountNum : -amountNum;

        const template: PointTemplate = {
            id: editingTemplate?.id || crypto.randomUUID(),
            schoolId,
            title: formData.title.trim(),
            amount: finalAmount,
            type: formData.type
        };

        try {
            await db.savePointTemplate(template);
            showToast(editingTemplate ? "Template diperbarui!" : "Template ditambahkan!", "success");
            setIsModalOpen(false);
            setEditingTemplate(null);
            setFormData({ title: '', amount: '', type: 'positive' });
            loadData();
        } catch (err) {
            console.error(err);
            showToast("Gagal menyimpan template.", "error");
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.id) return;
        try {
            await db.deletePointTemplate(deleteConfirm.id);
            showToast("Template dihapus.", "success");
            setDeleteConfirm({ isOpen: false, id: null });
            loadData();
        } catch (err) {
            console.error(err);
            showToast("Gagal menghapus template.", "error");
        }
    };

    const openEdit = (t: PointTemplate) => {
        setEditingTemplate(t);
        setFormData({
            title: t.title,
            amount: Math.abs(t.amount).toString(),
            type: t.type
        });
        setIsModalOpen(true);
    };

    return (
        <Layout>
            <Header 
                title="Pengaturan Poin" 
                subtitle="Atur daftar poin kilat untuk reward & sanksi"
                leftElement={
                    <button onClick={() => navigate('/home')} className="p-2 -ml-2 text-slate-400 hover:text-primary transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                }
            />

            <PageTransition>
                <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-6 md:pt-0">
                    <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 md:p-8 rounded-[3rem] border border-slate-100 shadow-sm gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-600 shadow-inner">
                                <Zap size={32} />
                            </div>
                            <div>
                                <h2 className="font-black text-slate-800 text-xl uppercase tracking-tight">Daftar Poin Kilat</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{templates.length} Pengaturan Tersimpan</p>
                            </div>
                        </div>
                        <Button 
                            onClick={() => { setEditingTemplate(null); setFormData({ title: '', amount: '', type: 'positive' }); setIsModalOpen(true); }}
                            className="w-full md:w-auto !px-10 !py-4 bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] hover:brightness-110 border-none shadow-xl shadow-[#3B66F5]/25 text-xs font-black uppercase tracking-widest"
                        >
                            Tambah Baru <Plus size={18} className="ml-2" />
                        </Button>
                    </div>

                    <div className="sticky top-4 z-30 flex bg-slate-100/80 backdrop-blur-md p-1.5 rounded-[2.5rem] shadow-inner border border-slate-200/50">
                        <button 
                            onClick={() => setActiveListTab('positive')}
                            className={`flex-1 py-4 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3 ${
                                activeListTab === 'positive' ? 'bg-white text-emerald-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <TrendingUp size={activeListTab === 'positive' ? 20 : 18} /> 
                            <span>Reward <span className="hidden sm:inline">(Positif)</span></span>
                        </button>
                        <button 
                            onClick={() => setActiveListTab('negative')}
                            className={`flex-1 py-4 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3 ${
                                activeListTab === 'negative' ? 'bg-white text-red-600 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <TrendingDown size={activeListTab === 'negative' ? 20 : 18} /> 
                            <span>Sanksi <span className="hidden sm:inline">(Negatif)</span></span>
                        </button>
                    </div>

                    <div className="animate-enter min-h-[400px]">
                        {activeListTab === 'positive' ? (
                            <div className="space-y-4">
                                {templates.filter(t => t.type === 'positive').length === 0 ? (
                                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] py-24 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <TrendingUp className="text-slate-200" size={40} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">Belum ada template reward positif yang dibuat</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {templates.filter(t => t.type === 'positive').map(t => (
                                            <div key={t.id} className="bg-white p-5 md:p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner shrink-0">
                                                        +{t.amount}
                                                    </div>
                                                    <div className="min-w-0 pr-2">
                                                        <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-tight">{t.title}</h4>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5 shrink-0">
                                                    <button onClick={() => openEdit(t)} className="w-8 h-8 bg-slate-50 text-slate-400 hover:text-primary rounded-full transition-all flex items-center justify-center"><Edit2 size={14} /></button>
                                                    <button onClick={() => setDeleteConfirm({ isOpen: true, id: t.id })} className="w-8 h-8 bg-slate-50 text-slate-400 hover:text-red-500 rounded-full transition-all flex items-center justify-center"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {templates.filter(t => t.type === 'negative').length === 0 ? (
                                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] py-24 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <TrendingDown className="text-slate-200" size={40} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">Belum ada template sanksi negatif yang dibuat</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {templates.filter(t => t.type === 'negative').map(t => (
                                            <div key={t.id} className="bg-white p-5 md:p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-red-200 transition-all">
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner shrink-0">
                                                        {t.amount}
                                                    </div>
                                                    <div className="min-w-0 pr-2">
                                                        <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-tight">{t.title}</h4>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5 shrink-0">
                                                    <button onClick={() => openEdit(t)} className="w-8 h-8 bg-slate-50 text-slate-400 hover:text-primary rounded-full transition-all flex items-center justify-center"><Edit2 size={14} /></button>
                                                    <button onClick={() => setDeleteConfirm({ isOpen: true, id: t.id })} className="w-8 h-8 bg-slate-50 text-slate-400 hover:text-red-500 rounded-full transition-all flex items-center justify-center"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </PageTransition>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTemplate ? "Edit Template" : "Tambah Template"}>
                <div className="py-2 space-y-6">
                    <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
                        <button 
                            onClick={() => setFormData({...formData, type: 'positive'})}
                            className={`py-3 rounded-full font-black text-[10px] uppercase transition-all ${formData.type === 'positive' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            Positif (+)
                        </button>
                        <button 
                            onClick={() => setFormData({...formData, type: 'negative'})}
                            className={`py-3 rounded-full font-black text-[10px] uppercase transition-all ${formData.type === 'negative' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            Negatif (-)
                        </button>
                    </div>
                    <Input label="JUDUL TEMPLATE" placeholder="Misal: Membersihkan Kelas, Terlambat..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    <Input label="JUMLAH POIN" type="number" placeholder="Masukkan angka..." value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    <Button onClick={handleSave} className={`w-full py-4 font-black uppercase ${formData.type === 'positive' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                        Simpan Template <Save size={18} className="ml-2" />
                    </Button>
                </div>
            </Modal>

            <Modal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, id: null })} title="Hapus Template">
                <div className="py-4 text-center space-y-6">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner"><Trash2 size={40} /></div>
                    <div><p className="text-slate-600 font-bold">Apakah Anda yakin ingin menghapus template ini?</p></div>
                    <div className="flex gap-4">
                        <Button variant="secondary" onClick={() => setDeleteConfirm({ isOpen: false, id: null })} className="flex-1">Batal</Button>
                        <Button onClick={handleDelete} className="flex-1 !bg-red-500 !text-white">Ya, Hapus</Button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};
