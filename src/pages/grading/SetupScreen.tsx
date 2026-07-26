import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, ChevronLeft, Camera, ChevronDown, Plus, X
} from 'lucide-react';
import { TeacherProfile, PRESET_MAPEL, DEFAULT_WEIGHTS } from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Input, Select,
  Logo, PageTransition
} from '../Layout';

const YEAR_OPTIONS = ["2025/2026", "2026/2027", "2027/2028", "2028/2029", "2029/2030", "2030/2031"];

export const SetupScreen: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    namaGuru: '', sekolah: '', tahunAjaran: YEAR_OPTIONS[0], semester: '1', kkm: 75, fotoUrl: '' as string | undefined
  });
  const [selectedMapels, setSelectedMapels] = useState<string[]>([]);
  const [customMapel, setCustomMapel] = useState('');

  const sortedMapels = [...PRESET_MAPEL].sort();

  useEffect(() => {
    db.getTeacherProfile().then(profile => {
      if (profile) {
        setIsEditing(true);
        const activeSchool = profile.schools.find(s => s.id === profile.activeSchoolId);
        setFormData({ 
          namaGuru: profile.namaGuru, 
          sekolah: activeSchool?.nama || '', 
          tahunAjaran: activeSchool?.tahunAjaran || profile.tahunAjaran,
          semester: activeSchool?.semester || profile.semester || '1', 
          kkm: activeSchool?.kkmDefault || profile.kkmDefault, 
          fotoUrl: profile.fotoUrl 
        });
        setSelectedMapels(profile.subjects);
      }
    });
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > 400) { h = Math.round(h * (400 / w)); w = 400; }
          if (h > 400) { w = Math.round(w * (400 / h)); h = 400; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          setFormData(prev => ({ ...prev, fotoUrl: canvas.toDataURL('image/jpeg', 0.7) }));
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleSubject = (subject: string) => {
    if (!subject) return;
    setSelectedMapels(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleAddCustomSubject = () => {
    if (customMapel.trim() && !selectedMapels.includes(customMapel.trim())) {
      setSelectedMapels([...selectedMapels, customMapel.trim()]);
      setCustomMapel('');
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.namaGuru.trim() || selectedMapels.length === 0) {
      alert("Nama Guru dan minimal satu Mata Pelajaran wajib diisi.");
      return;
    }
    
    const existing = await db.getTeacherProfile();
    const schoolId = existing?.activeSchoolId || crypto.randomUUID();
    const newSchool = {
      id: schoolId,
      nama: formData.sekolah,
      tahunAjaran: formData.tahunAjaran,
      semester: formData.semester,
      kkmDefault: formData.kkm,
      createdAt: new Date().toISOString()
    };
    
    const schools = existing?.schools || [];
    const existingSchoolIndex = schools.findIndex(s => s.id === schoolId);
    if (existingSchoolIndex >= 0) {
      schools[existingSchoolIndex] = newSchool;
    } else {
      schools.push(newSchool);
    }

    const profileToSave: TeacherProfile = {
      id: 'profile',
      namaGuru: formData.namaGuru,
      schools: schools,
      activeSchoolId: schoolId,
      tahunAjaran: formData.tahunAjaran,
      semester: formData.semester,
      kkmDefault: formData.kkm,
      fotoUrl: formData.fotoUrl,
      nip: existing?.nip || '',
      modeCepatDefault: existing?.modeCepatDefault ?? true,
      bintangAktif: existing?.bintangAktif ?? true,
      konversiBintangAktif: existing?.konversiBintangAktif ?? false,
      konversiBintangRate: existing?.konversiBintangRate ?? 10,
      konversiBintangMaxBonus: existing?.konversiBintangMaxBonus ?? 5,
      subjects: selectedMapels,
      weights: existing?.weights || DEFAULT_WEIGHTS
    };
    
    try {
      await db.saveSchool(newSchool);
      await db.saveTeacherProfile(profileToSave);
      if (onSuccess) onSuccess();
      navigate(isEditing ? '/profile' : '/home');
    } catch (err: any) {
      alert("Gagal menyimpan profil: " + err.message + "\nCoba hapus foto atau gunakan ukuran yang lebih kecil.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-6 relative">
      {isEditing && (
        <button 
          onClick={() => navigate('/profile')} 
          className="absolute top-6 left-6 z-50 w-11 h-11 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#3B66F5] transition-all active:scale-90"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <PageTransition className="max-w-2xl mx-auto w-full">
        <div className="mb-10 text-center">
          <Logo size="lg" />
          <h2 className="text-3xl font-black text-slate-800 tracking-wide mt-6 uppercase">
            {isEditing ? 'Ubah Profil' : 'Lengkapi Profil Guru'}
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium italic">Data untuk laporan hasil belajar otomatis.</p>
        </div>

        <div className="bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] p-8 md:p-12 rounded-[2.5rem] shadow-2xl space-y-10 relative overflow-hidden">
          <div className="flex flex-col items-center gap-6 relative z-10">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-36 h-36 rounded-full border-4 border-white/10 shadow-lg cursor-pointer overflow-hidden flex items-center justify-center group z-10 bg-white/10 isolate"
              style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
            >
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500"></div>
              
              {formData.fotoUrl ? (
                <img src={formData.fotoUrl} alt="Profil" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:opacity-40" />
              ) : (
                <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
                   <User size={64} className="text-blue-200/50" strokeWidth={1.5} />
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-all duration-300 backdrop-blur-[2px]">
                 <Camera size={32} className="text-white drop-shadow-md scale-75 group-hover:scale-100 transition-transform duration-300" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </div>

          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            <Input label="NAMA LENGKAP" labelClassName="text-blue-100" placeholder="Nama Lengkap & Gelar" value={formData.namaGuru} onChange={e => setFormData({...formData, namaGuru: e.target.value})} className="!bg-white/10 !border-white/10 !text-white !placeholder-[#3B66F5]/60" />
            <Input label="NAMA SEKOLAH" labelClassName="text-blue-100" placeholder="Nama Sekolah Tempat Mengajar" value={formData.sekolah} onChange={e => setFormData({...formData, sekolah: e.target.value})} className="!bg-white/10 !border-white/10 !text-white !placeholder-[#3B66F5]/60" />
            
            <Select label="TAHUN AJARAN" labelClassName="text-blue-100" value={formData.tahunAjaran} onChange={e => setFormData({...formData, tahunAjaran: e.target.value})} className="!bg-white/10 !border-white/10 !text-white">
              {YEAR_OPTIONS.map(year => <option key={year} value={year} className="text-slate-800">{year}</option>)}
            </Select>

            <div className="grid grid-cols-2 gap-4">
                 <Select label="SEMESTER" labelClassName="text-blue-100" value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})} className="!bg-white/10 !border-white/10 !text-white">
                    <option value="1" className="text-slate-800">Ganjil (1)</option>
                    <option value="2" className="text-slate-800">Genap (2)</option>
                </Select>
                <Input label="KKM STANDAR" labelClassName="text-blue-100" type="number" value={formData.kkm} onChange={e => setFormData({...formData, kkm: Number(e.target.value)})} className="!bg-white/10 !border-white/10 !text-white" />
            </div>
          </div>

          <div className="relative z-10 border-t border-white/10 pt-10">
            <label className="block text-[10px] font-black text-blue-200 uppercase tracking-widest mb-5 ml-1">Mata Pelajaran Diampu</label>
            
            <div className="flex flex-wrap gap-3 mb-8">
              {selectedMapels.length === 0 ? (
                <div className="w-full text-center py-4 bg-white/5 rounded-2xl border border-dashed border-white/10 text-blue-200/40 text-[10px] font-bold uppercase tracking-widest">Belum ada mapel dipilih</div>
              ) : (
                selectedMapels.map(subject => (
                  <span key={subject} className="px-5 py-2.5 rounded-xl text-xs font-black bg-white/15 text-white border border-white/10 flex items-center gap-3 shadow-sm hover:bg-white/20 transition-colors uppercase tracking-wide">
                    {subject} <X size={14} className="cursor-pointer hover:text-red-300 transition-colors" onClick={() => handleToggleSubject(subject)} />
                  </span>
                ))
              )}
            </div>

            <div className="flex flex-col md:grid md:grid-cols-[1fr_1fr_auto] gap-4">
              <div className="relative group">
                <select 
                  value="" 
                  onChange={(e) => handleToggleSubject(e.target.value)} 
                  className="w-full h-[56px] bg-white/10 text-white border border-white/10 rounded-2xl px-5 appearance-none outline-none focus:bg-white/20 focus:border-white/30 transition-all font-bold cursor-pointer"
                >
                  <option value="" className="text-slate-500 bg-white">+ Pilih Mapel Preset</option>
                  {sortedMapels.map(s => (
                    <option key={s} value={s} className="text-slate-800 bg-white font-bold">{s}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 group-hover:text-white transition-colors">
                  <ChevronDown size={20} strokeWidth={3} />
                </div>
              </div>

              <input 
                placeholder="Atau Ketik Mapel Baru..." 
                value={customMapel} 
                onChange={e => setCustomMapel(e.target.value)} 
                className="w-full h-[56px] bg-white/10 text-white border border-white/10 rounded-2xl px-5 outline-none focus:bg-white/20 focus:border-white/30 transition-all font-bold placeholder-[#3B66F5]/40" 
              />

              <button 
                type="button"
                onClick={handleAddCustomSubject} 
                className="h-[56px] w-full md:w-[56px] bg-accent text-[#1D4ED8] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-glow-gold flex items-center justify-center border border-transparent"
                title="Tambah"
              >
                <Plus size={28} strokeWidth={4} />
              </button>
            </div>

          </div>

          <Button 
            variant="accent" 
            className="w-full py-5 text-lg shadow-xl mt-6 font-black uppercase tracking-widest bg-accent !bg-none border-none" 
            onClick={handleSaveProfile}
          >
            Simpan Profil Guru
          </Button>
        </div>
      </PageTransition>
    </div>
  );
};
