import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, AlertTriangle, Info
} from 'lucide-react';
import { 
  TeacherProfile, DEFAULT_WEIGHTS
} from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Header, Layout, PageTransition, Card
} from '../Layout';

export const GradingSettingsScreen: React.FC = () => {
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        db.getTeacherProfile().then(p => {
            if (p) {
                setProfile(p);
                setWeights(p.weights || DEFAULT_WEIGHTS);
            }
        });
    }, []);

    const handleSave = async () => {
        if (!profile) return;
        const total = weights.formatif + weights.sumatif + weights.pts + weights.pas;
        if (total !== 100) {
            alert(`Total bobot harus 100%. Saat ini: ${total}%`);
            return;
        }

        setIsSaving(true);
        try {
            await db.saveTeacherProfile({ ...profile, weights });
            alert("Pengaturan bobot berhasil disimpan!");
            navigate('/profile');
        } catch (err) {
            alert("Gagal menyimpan: " + err);
        } finally {
            setIsSaving(false);
        }
    };

    if (!profile) return <Layout><div className="flex items-center justify-center p-40"><Loader2 className="animate-spin text-primary" size={60}/></div></Layout>;

    return (
        <Layout>
            <Header 
                title="Pengaturan Nilai" 
                subtitle="Tentukan persentase kontribusi nilai akhir" 
            />

            <div className="max-w-4xl mx-auto">
                <PageTransition className="space-y-6 mt-8">
                    <Card className="p-8 rounded-3xl border border-slate-100 shadow-sm">
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nilai Formatif (%)</label>
                                    <input 
                                        type="number" 
                                        value={weights.formatif} 
                                        onChange={e => setWeights({...weights, formatif: Number(e.target.value)})}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-black text-slate-700 outline-none focus:border-primary transition-all text-xl"
                                    />
                                    <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase">Aktivitas harian, tugas, partisipasi</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nilai Sumatif (%)</label>
                                    <input 
                                        type="number" 
                                        value={weights.sumatif} 
                                        onChange={e => setWeights({...weights, sumatif: Number(e.target.value)})}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-black text-slate-700 outline-none focus:border-primary transition-all text-xl"
                                    />
                                    <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase">Ulangan harian / tes materi</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nilai PTS (%)</label>
                                    <input 
                                        type="number" 
                                        value={weights.pts} 
                                        onChange={e => setWeights({...weights, pts: Number(e.target.value)})}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-black text-slate-700 outline-none focus:border-primary transition-all text-xl"
                                    />
                                    <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase">Penilaian Tengah Semester</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nilai PAS (%)</label>
                                    <input 
                                        type="number" 
                                        value={weights.pas} 
                                        onChange={e => setWeights({...weights, pas: Number(e.target.value)})}
                                        className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl px-5 font-black text-slate-700 outline-none focus:border-primary transition-all text-xl"
                                    />
                                    <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase">Penilaian Akhir Semester</p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Akumulasi</span>
                                    <div className={`text-3xl font-black ${weights.formatif + weights.sumatif + weights.pts + weights.pas === 100 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {weights.formatif + weights.sumatif + weights.pts + weights.pas}%
                                    </div>
                                </div>
                                {weights.formatif + weights.sumatif + weights.pts + weights.pas !== 100 && (
                                    <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-xl animate-pulse">
                                        <AlertTriangle size={16} />
                                        <span className="text-[10px] font-black uppercase">Harus 100%</span>
                                    </div>
                                )}
                            </div>

                            <Button 
                                onClick={handleSave} 
                                disabled={isSaving || weights.formatif + weights.sumatif + weights.pts + weights.pas !== 100}
                                isLoading={isSaving}
                                className="w-full py-5 uppercase tracking-widest font-black"
                            >
                                Simpan Pengaturan
                            </Button>
                        </div>
                    </Card>

                    <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4">
                        <Info className="text-primary shrink-0 mt-1" size={20} />
                        <div>
                            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wide mb-1">Tips Pembobotan</h4>
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase opacity-80">
                                Dalam Kurikulum Merdeka, porsi Formatif disarankan lebih besar untuk mendukung penilaian proses. Namun Anda bebas mengatur sesuai kebijakan sekolah.
                            </p>
                        </div>
                    </div>
                </PageTransition>
            </div>
        </Layout>
    );
};
