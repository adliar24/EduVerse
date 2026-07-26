import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, Camera, ChevronDown, BookOpen, Download, 
  Upload, Trash2, LogOut, TrendingUp, Zap, 
  Library, ChevronRight, Edit2, PlusCircle, 
  AlertTriangle, Database, FileJson, CheckCircle2, 
  Loader2, Pencil
} from 'lucide-react';
import { 
  TeacherProfile, School
} from '../../types';
import * as db from '../../services/dbGrading';
import { supabase } from '../../services/supabase';
import { 
  Button, Modal,
  Header, Layout, PageTransition, useToast, Card, Select
} from '../Layout';

const YEAR_OPTIONS = ["2023/2024", "2024/2025", "2025/2026"];

interface ProfileScreenProps {
  profile: TeacherProfile;
  onUpdate: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile: initialProfile, onUpdate }) => {
  const [profile, setProfile] = useState<TeacherProfile>(initialProfile);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'full' | 'master'>('full');
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isAddSchoolMode, setIsAddSchoolMode] = useState(false);
  const [isTransferMode, setIsTransferMode] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [schoolForm, setSchoolForm] = useState({ nama: '', tahunAjaran: YEAR_OPTIONS[0], semester: '1', kkm: 75 });
  const [transferForm, setTransferForm] = useState({ from: '', to: '' });

  const handleUpdatePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const img = new Image();
        img.onload = async () => {
           const canvas = document.createElement('canvas');
           const size = 300;
           canvas.width = size;
           canvas.height = size;
           const ctx = canvas.getContext('2d');
           if (!ctx) return;
           
           const aspect = img.width / img.height;
           let sw, sh, sx, sy;
           if (aspect > 1) {
             sh = img.height;
             sw = img.height;
             sx = (img.width - sw) / 2;
             sy = 0;
           } else {
             sw = img.width;
             sh = img.width;
             sx = 0;
             sy = (img.height - sh) / 2;
           }
           ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
           const base64 = canvas.toDataURL('image/jpeg', 0.8);
           
           try {
             const updated = { ...profile, fotoUrl: base64 };
             await db.saveTeacherProfile(updated);
             setProfile(updated);
          } catch (err: any) {
             alert("Gagal mengupdate foto profil: " + err.message);
          }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const processBackup = async (mode: 'full' | 'master') => {
    const data = await db.createBackup(mode);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const fileName = `eduscore_backup_${mode}_${new Date().toISOString().split('T')[0]}.json`;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    setIsBackupModalOpen(false);
  };

  const triggerRestore = (mode: 'full' | 'master') => {
    setRestoreMode(mode);
    setIsRestoreModalOpen(false);
    setTimeout(() => {
        backupInputRef.current?.click();
    }, 100);
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const confirmMessage = restoreMode === 'full' 
       ? "PERINGATAN: Semua data (Profil, Siswa, Nilai) saat ini akan DIHAPUS dan digantikan dengan isi backup. Lanjutkan?"
       : "PERINGATAN: Semua data saat ini akan DIHAPUS. Sistem hanya akan memulihkan Profil, Kelas, dan Siswa dari backup (Nilai akan dikosongkan). Lanjutkan?";

    if(!confirm(confirmMessage)) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = await db.restoreBackup(json, restoreMode);
        if (success) { 
          showToast("Backup berhasil dipulihkan", "success"); 
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err) { showToast("Gagal membaca file backup.", "error"); }
    };
    reader.readAsText(file);
  };

  const handleResetApplication = async () => {
    if (confirm("BAHAYA! Semua data (Kelas, Siswa, Nilai) akan dihapus total. Lanjutkan?")) {
      const req = indexedDB.deleteDatabase('EduScoreDB');
      req.onsuccess = () => {
        localStorage.clear();
        window.location.href = "/";
      };
    }
  };

  const handleLogout = async () => {
    if (confirm("Anda yakin ingin keluar?")) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  const handleAddSchool = async () => {
    if (!schoolForm.nama.trim()) {
      showToast("Nama sekolah wajib diisi.", "warning");
      return;
    }
    const newSchool: School = {
      id: crypto.randomUUID(),
      nama: schoolForm.nama,
      tahunAjaran: schoolForm.tahunAjaran,
      semester: schoolForm.semester,
      kkmDefault: schoolForm.kkm,
      createdAt: new Date().toISOString()
    };
    if (editingSchoolId) {
      const updatedSchools = profile.schools.map(s => s.id === editingSchoolId ? { ...s, ...newSchool } : s);
      const updatedProfile = { ...profile, schools: updatedSchools };
      await db.saveSchool({ ...profile.schools.find(s => s.id === editingSchoolId)!, ...newSchool });
      await db.saveTeacherProfile(updatedProfile);
      setProfile(updatedProfile);
    } else {
      const updatedProfile = { 
        ...profile, 
        schools: [...profile.schools, newSchool],
        activeSchoolId: newSchool.id
      };
      await db.saveSchool(newSchool);
      await db.saveTeacherProfile(updatedProfile);
      setProfile(updatedProfile);
    }
    
    setIsSchoolModalOpen(false);
    setSchoolForm({ nama: '', tahunAjaran: YEAR_OPTIONS[0], semester: '1', kkm: 75 });
    setIsAddSchoolMode(false);
    setEditingSchoolId(null);
    showToast(editingSchoolId ? "Data sekolah diperbarui" : "Sekolah baru ditambahkan");
    if (onUpdate) onUpdate();
  };

  const handleEditSchool = (school: School) => {
    setEditingSchoolId(school.id);
    setSchoolForm({ nama: school.nama, tahunAjaran: school.tahunAjaran, semester: school.semester, kkm: school.kkmDefault });
    setIsAddSchoolMode(true);
  };

  const handleSelectSchool = async (schoolId: string) => {
    if (!profile) return;
    if (schoolId === profile.activeSchoolId) {
      setIsSchoolModalOpen(false);
      return;
    }
    
    setIsProcessing(true);
    try {
      const updatedProfile = { ...profile, activeSchoolId: schoolId };
      await db.saveTeacherProfile(updatedProfile);
      
      setIsSchoolModalOpen(false);
      setIsProcessing(false);
      
      setProfile(updatedProfile);
      if (onUpdate) {
          onUpdate();
      }
    } catch (err: any) {
      showToast("Gagal mengganti sekolah: " + err.message, "error");
      setIsProcessing(false);
    }
  };

  const handleTransferData = async () => {
    if (!transferForm.from || !transferForm.to) {
        alert("Pilih sekolah asal dan tujuan.");
        return;
    }
    if (transferForm.from === transferForm.to) {
        alert("Sekolah asal dan tujuan tidak boleh sama.");
        return;
    }
    
    if (!confirm("PERINGATAN: Semua data (Kelas, Siswa, Nilai) dari sekolah asal akan dipindahkan ke sekolah tujuan. Tindakan ini tidak dapat dibatalkan. Lanjutkan?")) return;
    
    setIsProcessing(true);
    try {
        await db.transferDataBetweenSchools(transferForm.from, transferForm.to);
        showToast("Berhasil memindahkan data!");
        setIsTransferMode(false);
        setIsSchoolModalOpen(false);
        if (onUpdate) onUpdate();
    } catch (err: any) {
        showToast("Gagal memindahkan data: " + err.message, "error");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDeleteSchool = async (schoolId: string) => {
    if (!profile) return;
    if (profile.schools.length <= 1) {
      showToast("Minimal harus ada satu sekolah.", "warning");
      return;
    }
    if (!confirm("Yakin hapus sekolah ini? Semua data kelas, siswa, dan nilai di sekolah ini akan dihapus!")) return;
    
    const updatedSchools = profile.schools.filter(s => s.id !== schoolId);
    const newActiveId = profile.activeSchoolId === schoolId ? updatedSchools[0].id : profile.activeSchoolId;
    const updatedProfile = { ...profile, schools: updatedSchools, activeSchoolId: newActiveId };
    
    await db.deleteSchool(schoolId);
    await db.saveTeacherProfile(updatedProfile);
    setProfile(updatedProfile);
  };

  if (!profile) return <Layout><div className="flex items-center justify-center p-40"><Loader2 className="animate-spin text-[#3B66F5]" size={60}/></div></Layout>;

  return (
    <Layout>
      <PageTransition className="space-y-8">
        
        {/* === MOBILE VIEW ONLY (New Design) === */}
        <div className="md:hidden space-y-5 pb-20 pt-6">
            <div className="px-2 mb-2">
                <h1 className="font-black text-2xl text-[#1D4ED8] uppercase tracking-wide leading-tight">Profil Guru</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pengaturan & Pemeliharaan Data</p>
            </div>

            <div className="bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] rounded-[2.5rem] p-8 text-white relative shadow-2xl overflow-hidden flex flex-col items-center text-center isolate">
                <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-white/5 rounded-full blur-[60px] pointer-events-none -z-10" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[60px] pointer-events-none -z-10" />
                
                <Link to="/setup" className="absolute right-6 top-[28%] -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors z-20 backdrop-blur-sm">
                    <Pencil size={18} className="text-white" />
                </Link>

                <div className="relative group mb-4">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-28 h-28 rounded-full border-4 border-white/10 bg-white/10 flex items-center justify-center cursor-pointer overflow-hidden relative z-10"
                    >
                        {profile.fotoUrl ? (
                            <img src={profile.fotoUrl} alt="Profil" className="w-full h-full object-cover" />
                        ) : (
                            <User size={48} className="text-white/40" />
                        )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpdatePhoto} />
                </div>

                <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">{profile.namaGuru}</h2>
                <button onClick={() => setIsSchoolModalOpen(true)} className="text-blue-200 font-bold text-sm uppercase tracking-wide mb-6 hover:text-white flex items-center gap-1">
                  {profile.schools.find(s => s.id === profile.activeSchoolId)?.nama || 'Pilih Sekolah'}
                  <ChevronDown size={14} />
                </button>

                <div className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 px-4 mb-8 backdrop-blur-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/90">
                        {profile.schools.find(s => s.id === profile.activeSchoolId)?.tahunAjaran || profile.tahunAjaran} • Semester {profile.schools.find(s => s.id === profile.activeSchoolId)?.semester === '1' ? 'Ganjil' : 'Genap'}
                    </div>
                </div>

                <div className="w-full border-t border-white/10 pt-6 mb-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200/60 mb-3">Mata Pelajaran Diampu</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {profile.subjects.map(sub => (
                            <span key={sub} className="px-3 py-1.5 rounded-lg bg-blue-900/30 border border-blue-400/20 text-[10px] font-black uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
                                <BookOpen size={12} className="opacity-70" /> {sub}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="bg-accent text-[#1D4ED8] rounded-[2rem] w-24 h-24 flex flex-col items-center justify-center shadow-lg shadow-amber-500/20 z-20">
                    <span className="text-[10px] font-black uppercase tracking-widest mb-0.5 opacity-60">KKM</span>
                    <span className="text-4xl font-black leading-none tracking-tighter">
                      {profile.schools.find(s => s.id === profile.activeSchoolId)?.kkmDefault || profile.kkmDefault}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 px-1 mt-1">
                <button onClick={() => setIsBackupModalOpen(true)} className="bg-white rounded-full p-4 border border-slate-100 shadow-sm flex flex-col items-center justify-center aspect-square gap-2 active:scale-95 transition-transform">
                    <div className="text-[#3B66F5]"><Download size={20} strokeWidth={2.5}/></div>
                    <div className="text-center leading-tight">
                        <div className="font-black text-xs text-slate-800 uppercase">Cadangkan</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Data Lokal</div>
                    </div>
                </button>
                <button onClick={() => setIsRestoreModalOpen(true)} className="bg-white rounded-full p-4 border border-slate-100 shadow-sm flex flex-col items-center justify-center aspect-square gap-2 active:scale-95 transition-transform">
                    <div className="text-amber-500"><Upload size={20} strokeWidth={2.5}/></div>
                    <div className="text-center leading-tight">
                        <div className="font-black text-xs text-slate-800 uppercase">Pulihkan</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Dari JSON</div>
                    </div>
                    <input type="file" ref={backupInputRef} className="hidden" accept=".json" onChange={handleRestoreBackup} />
                </button>
                <button onClick={handleResetApplication} className="bg-white rounded-full p-4 border border-slate-100 shadow-sm flex flex-col items-center justify-center aspect-square gap-2 active:scale-95 transition-transform">
                    <div className="text-red-500"><Trash2 size={20} strokeWidth={2.5}/></div>
                    <div className="text-center leading-tight">
                        <div className="font-black text-xs text-slate-800 uppercase">Reset</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Hapus Semua</div>
                    </div>
                </button>
                <button onClick={handleLogout} className="bg-white rounded-full p-4 border border-slate-100 shadow-sm flex flex-col items-center justify-center aspect-square gap-2 active:scale-95 transition-transform">
                    <div className="text-red-500"><LogOut size={20} strokeWidth={2.5}/></div>
                    <div className="text-center leading-tight">
                        <div className="font-black text-xs text-slate-800 uppercase tracking-wide">Keluar</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logout Akun</div>
                    </div>
                </button>
            </div>

            <div className="space-y-3 px-1">
                 <Link to="/grading-settings" className="w-full bg-white rounded-full p-5 border border-slate-100 shadow-sm flex items-center gap-5 active:scale-95 transition-transform">
                    <div className="w-12 h-12 rounded-2xl bg-[#3B66F5]/5 text-[#3B66F5] flex items-center justify-center shrink-0">
                        <TrendingUp size={22} />
                    </div>
                    <div className="text-left flex-1">
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Bobot Penilaian</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Formatif & Sumatif Settings</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                </Link>
                <Link to="/point-templates" className="w-full bg-white rounded-full p-5 border border-slate-100 shadow-sm flex items-center gap-5 active:scale-95 transition-transform">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Zap size={22} />
                    </div>
                    <div className="text-left flex-1">
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Pengaturan Poin</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Kelola Pengaturan Poin Kilat</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                </Link>
                <Link to="/tp-manager" className="w-full bg-white rounded-full p-5 border border-slate-100 shadow-sm flex items-center gap-5 active:scale-95 transition-transform">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Library size={22} />
                    </div>
                    <div className="text-left flex-1">
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Tujuan Pembelajaran</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Master Capaian & TP</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                </Link>
            </div>
        </div>

        {/* === DESKTOP VIEW ONLY === */}
        <div className="hidden md:block space-y-6">
            <div className="bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 md:gap-10 isolate">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative shrink-0 group">
                    <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 bg-white/10 flex items-center justify-center cursor-pointer overflow-hidden relative z-10 hover:border-accent/50 transition-colors shadow-lg"
                    style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
                    >
                    {profile.fotoUrl ? (
                        <img src={profile.fotoUrl} alt="Profil" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                        <User size={48} className="text-white/40" />
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                        <Camera className="text-white drop-shadow-md" size={24} />
                    </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpdatePhoto} />
                </div>

                <div className="flex-1 text-center md:text-left min-w-0">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-1.5 flex-wrap">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight leading-tight whitespace-normal">{profile.namaGuru}</h1>
                        <Link to="/setup" className="p-1.5 bg-white/10 rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-all">
                            <Edit2 size={16} />
                        </Link>
                    </div>
                    <button onClick={() => setIsSchoolModalOpen(true)} className="text-blue-100 font-bold text-base md:text-lg uppercase tracking-wide opacity-80 mb-4 hover:text-white flex items-center gap-1">
                        {profile.schools.find(s => s.id === profile.activeSchoolId)?.nama || 'Pilih Sekolah'}
                        <ChevronDown size={16} />
                    </button>
                    
                    <div className="inline-flex px-4 py-2 rounded-lg bg-white/15 border border-white/10 backdrop-blur-md mb-6">
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-50">
                        TA {profile.schools.find(s => s.id === profile.activeSchoolId)?.tahunAjaran || profile.tahunAjaran} • Semester {profile.schools.find(s => s.id === profile.activeSchoolId)?.semester === '1' ? 'Ganjil' : 'Genap'}
                    </span>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                    <p className="text-[8px] font-black uppercase tracking-widest text-blue-200 mb-2">Mata Pelajaran</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                        {profile.subjects.map(sub => (
                            <span key={sub} className="px-2.5 py-1.5 rounded-lg bg-blue-900/40 border border-blue-400/30 text-[9px] font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
                                <BookOpen size={10} className="opacity-70" /> {sub}
                            </span>
                        ))}
                    </div>
                    </div>
                </div>

                <div className="w-full md:w-auto bg-gradient-gold rounded-[1.75rem] p-6 md:p-8 text-center shadow-lg shadow-amber-500/20 shrink-0 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-[40px] pointer-events-none translate-x-10 -translate-y-10"></div>
                    <div className="relative z-10">
                        <div className="text-[#1D4ED8]/60 font-black text-[10px] uppercase tracking-widest mb-0.5">KKM</div>
                        <div className="text-6xl md:text-7xl font-black text-[#1D4ED8] leading-none tracking-tighter group-hover:scale-105 transition-transform duration-300">{profile.kkmDefault}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/grading-settings" className="bg-white rounded-full p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-[#3B66F5] transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-[#3B66F5]/5 text-[#3B66F5] flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <TrendingUp size={24} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-wide truncate">Bobot Penilaian</h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Formatif & Sumatif</p>
                    </div>
                    <ChevronRight className="ml-auto text-slate-300 group-hover:text-[#3B66F5] shrink-0" size={16} />
                </Link>

                <Link to="/point-templates" className="bg-white rounded-full p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-amber-500 transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <Zap size={24} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-wide truncate">Pengaturan Poin</h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Kelola Poin Kilat</p>
                    </div>
                    <ChevronRight className="ml-auto text-slate-300 group-hover:text-amber-500 shrink-0" size={16} />
                </Link>

                <Link to="/tp-manager" className="bg-white rounded-full p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-emerald-500 transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                        <Library size={24} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-wide truncate">Pengaturan TP</h4>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Master Capaian</p>
                    </div>
                    <ChevronRight className="ml-auto text-slate-300 group-hover:text-emerald-500 shrink-0" size={16} />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <button onClick={() => setIsBackupModalOpen(true)} className="bg-white rounded-full p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:border-[#3B66F5]/30 hover:-translate-y-1 transition-all group flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#3B66F5]/5 text-[#3B66F5] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                    <Download size={24} strokeWidth={2.5} />
                </div>
                <h3 className="font-black text-slate-800 text-[13px] uppercase tracking-wide mb-1">Cadangkan</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Data Lokal</p>
                </button>

                <button onClick={() => setIsRestoreModalOpen(true)} className="bg-white rounded-full p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:border-amber-200 hover:-translate-y-1 transition-all group flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                    <Upload size={24} strokeWidth={2.5} />
                </div>
                <h3 className="font-black text-slate-800 text-[13px] uppercase tracking-wide mb-1">Pulihkan</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dari JSON</p>
                <input type="file" ref={backupInputRef} className="hidden" accept=".json" onChange={handleRestoreBackup} />
                </button>

                <button onClick={handleResetApplication} className="bg-white rounded-full p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:border-red-200 hover:-translate-y-1 transition-all group flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                    <Trash2 size={24} strokeWidth={2.5} />
                </div>
                <h3 className="font-black text-slate-800 text-[13px] uppercase tracking-wide mb-1">Reset</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Hapus Semua Data</p>
                </button>

                <button onClick={handleLogout} className="bg-white rounded-full p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:border-red-200 hover:-translate-y-1 transition-all group flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                    <LogOut size={24} strokeWidth={2.5} />
                </div>
                <h3 className="font-black text-slate-800 text-[13px] uppercase tracking-wide mb-1">Keluar</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Logout Akun</p>
                </button>
            </div>
        </div>

        {/* MODALS */}
        <Modal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} title="Pilih Jenis Backup">
           <div className="py-2 space-y-4">
              <div className="text-center mb-6">
                 <p className="text-sm text-slate-500 font-medium">Silakan pilih data yang ingin Anda simpan ke perangkat ini.</p>
              </div>
              <button 
                onClick={() => processBackup('full')}
                className="w-full bg-[#3B66F5]/5 hover:bg-[#3B66F5]/10 border border-[#3B66F5]/20 hover:border-[#3B66F5]/30 rounded-full p-6 flex items-center gap-5 transition-all group text-left relative overflow-hidden"
              >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#3B66F5] shadow-sm shrink-0">
                     <Database size={32} strokeWidth={2.5} />
                  </div>
                  <div className="relative z-10">
                     <h4 className="font-black text-slate-800 text-lg uppercase tracking-wide group-hover:text-[#3B66F5] transition-colors">Backup Lengkap</h4>
                     <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed max-w-[200px]">Semua data termasuk Profil, Kelas, Siswa, <strong className="text-[#3B66F5]">Nilai & Poin</strong>.</p>
                  </div>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <CheckCircle2 className="text-[#3B66F5]" size={24} />
                  </div>
              </button>
              <button 
                onClick={() => processBackup('master')}
                className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-100 hover:border-amber-200 rounded-full p-6 flex items-center gap-5 transition-all group text-left relative overflow-hidden"
              >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                     <FileJson size={32} strokeWidth={2.5} />
                  </div>
                  <div className="relative z-10">
                     <h4 className="font-black text-slate-800 text-lg uppercase tracking-wide group-hover:text-amber-700 transition-colors">Data Master Saja</h4>
                     <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed max-w-[200px]">Hanya simpan <strong className="text-amber-600">Profil, Kelas & Siswa</strong>. (Tanpa nilai)</p>
                  </div>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <CheckCircle2 className="text-amber-600" size={24} />
                  </div>
              </button>
           </div>
        </Modal>

        <Modal isOpen={isRestoreModalOpen} onClose={() => setIsRestoreModalOpen(false)} title="Pilih Jenis Restore">
           <div className="py-2 space-y-4">
              <div className="flex items-start gap-4 p-4 bg-red-50 rounded-2xl border border-red-100 mb-6">
                 <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                 <p className="text-xs font-bold text-red-600 leading-relaxed">
                    Perhatian: Proses restore akan <span className="underline decoration-2 underline-offset-2">menghapus semua data</span> yang ada saat ini sebelum memuat data baru dari file backup.
                 </p>
              </div>
              <button 
                onClick={() => triggerRestore('full')}
                className="w-full bg-[#3B66F5]/5 hover:bg-[#3B66F5]/10 border border-[#3B66F5]/20 hover:border-[#3B66F5]/30 rounded-full p-6 flex items-center gap-5 transition-all group text-left relative overflow-hidden"
              >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#3B66F5] shadow-sm shrink-0">
                     <Database size={32} strokeWidth={2.5} />
                  </div>
                  <div className="relative z-10">
                     <h4 className="font-black text-slate-800 text-lg uppercase tracking-wide group-hover:text-[#3B66F5] transition-colors">Restore Lengkap</h4>
                     <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed max-w-[200px]">Timpa semua data dengan isi file backup (Profil, Siswa, Nilai, dll).</p>
                  </div>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <CheckCircle2 className="text-[#3B66F5]" size={24} />
                  </div>
              </button>
              <button 
                onClick={() => triggerRestore('master')}
                className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-100 hover:border-amber-200 rounded-full p-6 flex items-center gap-5 transition-all group text-left relative overflow-hidden"
              >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                     <FileJson size={32} strokeWidth={2.5} />
                  </div>
                  <div className="relative z-10">
                     <h4 className="font-black text-slate-800 text-lg uppercase tracking-wide group-hover:text-amber-700 transition-colors">Restore Data Master</h4>
                     <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed max-w-[200px]">Reset Nilai. Hanya pulihkan <strong className="text-amber-600">Profil, Kelas & Siswa</strong>.</p>
                  </div>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <CheckCircle2 className="text-amber-600" size={24} />
                  </div>
              </button>
           </div>
         </Modal>

        <Modal 
           isOpen={isSchoolModalOpen} 
           onClose={() => { 
              if (isProcessing) return;
              setIsSchoolModalOpen(false); 
              setIsAddSchoolMode(false); 
              setIsTransferMode(false);
              setEditingSchoolId(null);
           }} 
           title={editingSchoolId ? "Edit Sekolah" : isAddSchoolMode ? "Tambah Sekolah" : isTransferMode ? "Pindahkan Data" : "Pilih Sekolah"}
        >
           {isProcessing ? (
             <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-[#3B66F5] mb-4" size={40} />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sedang Memproses...</p>
             </div>
           ) : isTransferMode ? (
             <div className="py-2 space-y-4">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl mb-4">
                   <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
                      Pilih sekolah asal data dan sekolah tujuan. Semua data akademik akan dipindahkan.
                   </p>
                </div>
                <div>
                   <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Pindahkan Dari (Asal)</label>
                   <select 
                      value={transferForm.from} 
                      onChange={e => setTransferForm({...transferForm, from: e.target.value})}
                      className="w-full p-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-800 focus:border-[#3B66F5] focus:outline-none bg-white"
                   >
                      <option value="">Pilih Sekolah Asal</option>
                      {profile.schools.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Pindahkan Ke (Tujuan)</label>
                   <select 
                      value={transferForm.to} 
                      onChange={e => setTransferForm({...transferForm, to: e.target.value})}
                      className="w-full p-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-800 focus:border-[#3B66F5] focus:outline-none bg-white"
                   >
                      <option value="">Pilih Sekolah Tujuan</option>
                      {profile.schools.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                   </select>
                </div>
                <div className="flex gap-3 pt-4">
                   <button onClick={() => setIsTransferMode(false)} className="flex-1 py-4 rounded-full border-2 border-slate-200 font-black text-slate-500 uppercase text-sm">Batal</button>
                   <button onClick={handleTransferData} className="flex-1 py-4 rounded-full bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white font-black uppercase text-sm shadow-glow">Proses Pindah</button>
                </div>
             </div>
           ) : !isAddSchoolMode ? (
             <div className="py-2 space-y-3">
                {profile.schools.map(school => {
                  const isActive = school.id === profile.activeSchoolId;
                  return (
                    <div 
                      key={school.id} 
                      className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${isActive ? 'border-[#3B66F5] bg-[#3B66F5]/5 ring-1 ring-[#3B66F5]/20' : 'border-slate-100 hover:border-slate-200'}`}
                      onClick={() => handleSelectSchool(school.id)}
                    >
                       <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-black uppercase ${isActive ? 'text-[#3B66F5]' : 'text-slate-800'}`}>{school.nama}</h4>
                            {isActive && <div className="px-1.5 py-0.5 bg-[#3B66F5]/10 text-[#3B66F5] text-[7px] font-black rounded uppercase tracking-tighter">Aktif</div>}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-1">TA {school.tahunAjaran} • Semester {school.semester === '1' ? 'Ganjil' : 'Genap'} • KKM {school.kkmDefault}</p>
                       </div>
                       <div className="flex items-center gap-1">
                           <button 
                              onClick={(e) => { e.stopPropagation(); handleEditSchool(school); }}
                              className="p-2 text-slate-400 hover:text-[#3B66F5] transition-colors"
                           >
                              <Edit2 size={18} />
                           </button>
                           {!isActive && (
                               <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeleteSchool(school.id); }}
                                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                               >
                                  <Trash2 size={18} />
                               </button>
                           )}
                           {isActive && <CheckCircle2 className="text-[#3B66F5] shrink-0 ml-2" size={24} />}
                       </div>
                    </div>
                  );
                })}
                <div className="flex gap-3 mt-6">
                    <button onClick={() => setIsAddSchoolMode(true)} className="flex-1 bg-[#3B66F5]/10 hover:bg-[#3B66F5]/20 border border-[#3B66F5]/20 rounded-full p-4 flex items-center justify-center gap-2 transition-all">
                       <PlusCircle className="text-[#3B66F5]" size={20} />
                       <span className="font-black text-[#3B66F5] uppercase text-[10px]">Tambah</span>
                    </button>
                </div>
             </div>
           ) : (
             <div className="py-2 space-y-4">
                <div>
                   <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Nama Sekolah</label>
                   <input type="text" value={schoolForm.nama} onChange={e => setSchoolForm({...schoolForm, nama: e.target.value})} 
                          className="w-full p-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-800 focus:border-[#3B66F5] focus:outline-none" placeholder="Nama Sekolah" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Tahun Ajaran</label>
                      <select value={schoolForm.tahunAjaran} onChange={e => setSchoolForm({...schoolForm, tahunAjaran: e.target.value})}
                              className="w-full p-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-800 focus:border-[#3B66F5] focus:outline-none bg-white">
                         {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">Semester</label>
                      <select value={schoolForm.semester} onChange={e => setSchoolForm({...schoolForm, semester: e.target.value})}
                              className="w-full p-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-800 focus:border-[#3B66F5] focus:outline-none bg-white">
                         <option value="1">Ganjil</option>
                         <option value="2">Genap</option>
                      </select>
                   </div>
                </div>
                <div>
                   <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">KKM Default</label>
                   <input type="number" value={schoolForm.kkm} onChange={e => setSchoolForm({...schoolForm, kkm: parseInt(e.target.value) || 75})}
                          className="w-full p-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-800 focus:border-[#3B66F5] focus:outline-none" />
                </div>
                <div className="flex gap-3 pt-2">
                   <button onClick={() => { setIsAddSchoolMode(false); setEditingSchoolId(null); }} className="flex-1 py-4 rounded-full border-2 border-slate-200 font-black text-slate-500 uppercase text-sm">Batal</button>
                   <button onClick={handleAddSchool} className="flex-1 py-4 rounded-full bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white font-black uppercase text-sm">
                       {editingSchoolId ? "Simpan Perubahan" : "Simpan"}
                   </button>
                </div>
             </div>
           )}
        </Modal>

      </PageTransition>
    </Layout>
  );
};
