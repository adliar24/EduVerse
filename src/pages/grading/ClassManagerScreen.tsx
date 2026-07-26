import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, ChevronRight, Library, AlertCircle } from 'lucide-react';
import { ClassData } from '../../types';
import * as db from '../../services/dbGrading';
import { 
  Button, Input, Select, Card, Modal,
  Header, Layout, PageTransition, useToast
} from '../Layout';
import { useTeacherProfile, useClasses } from '../../services/hooks';

export const ClassManagerScreen: React.FC = () => {
  const { showToast } = useToast();
  const { profile } = useTeacherProfile();
  const { classes, refreshClasses } = useClasses(profile?.activeSchoolId);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClass, setNewClass] = useState({ namaKelas: '', mapel: '' });
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });

  const handleAddClass = async () => {
    if (!newClass.namaKelas.trim()) {
      showToast("Nama Kelas wajib diisi.", "warning");
      return;
    }
    if (!newClass.mapel) {
      showToast("Silakan pilih Mata Pelajaran.", "warning");
      return;
    }

    const schoolId = profile?.activeSchoolId || '';
    
    try {
      if (editingClass) {
        await db.saveClass({ ...editingClass, ...newClass });
        showToast("Data kelas diperbarui");
      } else {
        const id = crypto.randomUUID();
        await db.saveClass({ idKelas: id, schoolId, ...newClass });
        showToast("Kelas baru ditambahkan");
      }
      
      refreshClasses();
      setIsModalOpen(false);
      setNewClass({ namaKelas: '', mapel: '' });
      setEditingClass(null);
    } catch (err: any) {
      showToast("Gagal menyimpan kelas: " + err.message, "error");
    }
  };

  const handleEditClass = (cls: ClassData) => {
    setEditingClass(cls);
    setNewClass({ namaKelas: cls.namaKelas, mapel: cls.mapel });
    setIsModalOpen(true);
  };

  const confirmDeleteClass = (id: string) => {
    setDeleteConfirmation({ isOpen: true, id });
  };

  const executeDeleteClass = async () => {
    if (deleteConfirmation.id) {
      try {
        await db.deleteClass(deleteConfirmation.id);
        showToast("Kelas berhasil dihapus");
        refreshClasses();
        setDeleteConfirmation({ isOpen: false, id: null });
      } catch (err: any) {
        showToast("Gagal menghapus kelas: " + err.message, "error");
      }
    }
  };

  return (
    <Layout>
      <Header title="Daftar Kelas" subtitle="Manajemen Ruang Belajar & Mapel" />
      
      <div className="px-6 mt-6 mb-8 md:hidden">
        <Button onClick={() => setIsModalOpen(true)} variant="accent" className="w-full h-14 shadow-glow-gold uppercase tracking-widest text-[11px] font-black flex items-center justify-center border-2 border-white/20">
            <Plus size={20} className="mr-2" strokeWidth={3} /> Kelas Baru
        </Button>
      </div>

      <div className="hidden md:flex justify-end mb-6">
         <Button onClick={() => setIsModalOpen(true)} variant="accent" className="px-6 py-3 shadow-glow-gold uppercase tracking-widest text-[11px] font-black">
            <Plus size={18} className="mr-2" strokeWidth={3} /> Kelas Baru
        </Button>
      </div>

      <PageTransition className="mt-4 grid gap-4 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0 ? (
          <div className="col-span-full py-32 text-center opacity-40">
            <div className="bg-slate-100 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-slate-300 shadow-inner"><Library size={48}/></div>
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Belum Ada Kelas</h3>
          </div>
        ) : (
          classes.map(cls => (
            <React.Fragment key={cls.idKelas}>
                <Link to={`/classes/${cls.idKelas}`} className="md:hidden block group">
                    <div className="bg-white rounded-2xl p-4 border-2 !border-amber-400 flex items-center justify-between shadow-sm active:scale-95 transition-all relative overflow-hidden">
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-[#3B66F5]/5 text-[#3B66F5] flex items-center justify-center font-black text-lg border border-[#3B66F5]/20 shadow-inner group-hover:bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] group-hover:text-white transition-colors">
                                {cls.namaKelas.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-[13px] uppercase tracking-wide group-hover:text-[#3B66F5] transition-colors">{cls.namaKelas}</h3>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{cls.mapel}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 relative z-10">
                             <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClass(cls); }} className="p-2 text-slate-400 hover:text-[#3B66F5] transition-colors">
                                <Edit2 size={16} />
                             </button>
                             <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); confirmDeleteClass(cls.idKelas); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                             </button>
                             <ChevronRight size={18} className="text-slate-300 group-hover:text-[#3B66F5] group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </Link>

                <Card className="hidden md:block p-6 group relative overflow-hidden border-2 !border-amber-400 shadow-sm hover:shadow-xl hover:!border-amber-500 transition-all hover:-translate-y-1 bg-white">
                    <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                        <button onClick={() => handleEditClass(cls)} className="p-2 text-slate-400 hover:text-[#3B66F5] transition-colors">
                            <Edit2 size={16}/>
                        </button>
                        <button onClick={() => confirmDeleteClass(cls.idKelas)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                    <div className="flex flex-col h-full">
                        <div className="mb-6">
                            <h3 className="text-2xl font-black text-slate-800 mb-1 truncate uppercase tracking-tight">{cls.namaKelas}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{cls.mapel}</p>
                        </div>
                        <Link to={`/classes/${cls.idKelas}`} className="mt-auto">
                            <Button variant="secondary" className="w-full text-[9px] font-black uppercase tracking-widest py-3 hover:bg-[#3B66F5]/5 hover:text-[#3B66F5] hover:border-[#3B66F5]/20 transition-all">
                                Detail Siswa <ChevronRight size={14} className="ml-2" />
                            </Button>
                        </Link>
                    </div>
                </Card>
            </React.Fragment>
          ))
        )}
      </PageTransition>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingClass(null); setNewClass({ namaKelas: '', mapel: '' }); }} title={editingClass ? "Edit Nama Kelas" : "Tambah Kelas Baru"}>
        <div className="space-y-8 py-2">
          <Input 
            autoFocus
            label="NAMA KELAS" 
            placeholder="Contoh: 8-B atau X-TKJ" 
            value={newClass.namaKelas} 
            onChange={e => setNewClass({...newClass, namaKelas: e.target.value})} 
          />
          <Select 
            label="MATA PELAJARAN (WAJIB)" 
            value={newClass.mapel} 
            onChange={e => setNewClass({...newClass, mapel: e.target.value})}
          >
            <option value="">-- Pilih Mapel Diampu --</option>
            {profile?.subjects.map((sub: string) => (
              <option key={sub} value={sub}>{sub.toUpperCase()}</option>
            ))}
          </Select>
          <div className="pt-4">
            <Button onClick={handleAddClass} className="w-full py-5 font-black uppercase tracking-widest text-xs">
                {editingClass ? "SIMPAN PERUBAHAN" : "SIMPAN DATA KELAS"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteConfirmation.isOpen} onClose={() => setDeleteConfirmation({ isOpen: false, id: null })} title="Hapus Kelas?">
        <div className="py-2 text-center space-y-6">
           <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-4 animate-pop">
              <AlertCircle size={40} />
           </div>
           <div>
              <h3 className="text-xl font-black text-slate-800 uppercase mb-2">Peringatan Keras</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                 Tindakan ini akan <strong>MENGHAPUS PERMANEN</strong> kelas beserta seluruh <strong>Siswa</strong> dan <strong>Riwayat Nilai</strong> di dalamnya.
              </p>
           </div>
           <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setDeleteConfirmation({ isOpen: false, id: null })} className="flex-1 !py-4">Batal</Button>
              <Button variant="danger" onClick={executeDeleteClass} className="flex-1 !py-4 shadow-lg shadow-red-500/20">Ya, Hapus Permanen</Button>
           </div>
        </div>
      </Modal>
    </Layout>
  );
};
