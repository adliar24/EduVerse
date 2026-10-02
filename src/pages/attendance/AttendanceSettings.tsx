import React, { Suspense, useState, useEffect, lazy } from 'react';
import { AppState, TeacherProfile } from '../types';
import { Button, Card, Modal } from '../../components/UI';
import { saveTeacherProfile } from '../../services/dbAttendance';
import { ScanFace, FileText, ShieldCheck, Clock, Bell, Save, HardDrive, Download, Upload, CheckCircle2 } from 'lucide-react';
import { exportEmergencyBackup, restoreEmergencyBackup } from '../../services/offlineVault';
import { getStorageEstimate, StorageEstimate } from '../../services/storagePersistence';
import { Header } from '../Layout';

const FaceBulkEnrollment = lazy(() => import('./FaceBulkEnrollment'));

interface Props {
  state: AppState;
  refresh: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}

export const AttendanceSettings: React.FC<Props> = ({ state, refresh, notify }) => {
  const [isFaceEnrollmentOpen, setIsFaceEnrollmentOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [lateEnabled, setLateEnabled] = useState(true);
  const [lateBuffer, setLateBuffer] = useState<string | number>(15);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifBuffer, setNotifBuffer] = useState<string | number>(5);

  // Storage and Vault states
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    getStorageEstimate().then(setStorageEstimate).catch(() => {});
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await exportEmergencyBackup();
      notify(`Cadangan berhasil diunduh (${res.filename})`, 'success');
    } catch (err: any) {
      notify('Gagal mengunduh berkas cadangan: ' + (err.message || err), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Pulihkan data dari berkas cadangan ini? Data lokal akan diperbarui.')) {
      e.target.value = '';
      return;
    }

    setIsRestoring(true);
    try {
      const res = await restoreEmergencyBackup(file);
      if (res.success) {
        notify(res.message, 'success');
        refresh();
      } else {
        notify(res.message, 'error');
      }
    } catch (err: any) {
      notify('Gagal memulihkan cadangan: ' + (err.message || err), 'error');
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (state.teacher) {
      setLateEnabled(state.teacher.lateSetting?.isEnabled ?? true);
      setLateBuffer(state.teacher.lateSetting?.bufferMinutes ?? 15);
      setNotifEnabled(!!state.teacher.notificationMinutes && state.teacher.notificationMinutes > 0);
      setNotifBuffer(state.teacher.notificationMinutes || 5);
    }
  }, [state.teacher]);

  const handleToggleNotif = async (e: React.MouseEvent) => {
    e.preventDefault();
    const newState = !notifEnabled;
    
    if (newState && 'Notification' in window) {
      if (Notification.permission === 'denied') {
        notify("Izin notifikasi telah di-BLOKIR oleh browser. Silakan aktifkan izin notifikasi di browser Anda.", "error");
        return;
      }

      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          notify("Izin notifikasi ditolak. Fitur pengingat tidak dapat diaktifkan.", "error");
          return;
        }
      }
    }
    
    setNotifEnabled(newState);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    let currentTeacher = state.teacher;

    if (!currentTeacher) {
      try {
        const { supabase } = await import('../../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const userMetadata = session.user.user_metadata;
          // Get school info
          const { data: schoolsRes } = await supabase
            .from('teacher_schools')
            .select('schools(name)')
            .eq('teacher_id', session.user.id);
            
          const schoolNames = (schoolsRes || [])
            .map((s: any) => s.schools?.name)
            .filter(Boolean);

          currentTeacher = {
            id: session.user.id,
            teacherName: userMetadata?.name || session.user.email?.split('@')[0] || 'Guru',
            schools: schoolNames.length > 0 ? schoolNames : ['Sekolah Belum Diatur'],
            currentSchoolIndex: 0,
            schoolYear: userMetadata?.schoolYear || '2025/2026',
            subjects: userMetadata?.subjects || ['UMUM'],
            customSubjects: [],
            lateSetting: {
              isEnabled: lateEnabled,
              bufferMinutes: lateBuffer === '' ? 15 : Number(lateBuffer)
            },
            notificationMinutes: notifEnabled ? (notifBuffer === '' ? 5 : Number(notifBuffer)) : 0,
            createdAt: new Date().toISOString()
          };
        } else {
          notify("Sesi login tidak ditemukan. Silakan login kembali.", "error");
          setSaving(false);
          return;
        }
      } catch (err: any) {
        console.error('Gagal memuat profil dari sesi:', err);
        notify("Gagal memuat profil: " + err.message, "error");
        setSaving(false);
        return;
      }
    }

    const updated: TeacherProfile = {
      ...currentTeacher,
      lateSetting: {
        isEnabled: lateEnabled,
        bufferMinutes: lateBuffer === '' ? 15 : Number(lateBuffer)
      },
      notificationMinutes: notifEnabled ? (notifBuffer === '' ? 5 : Number(notifBuffer)) : 0
    };

    try {
      await saveTeacherProfile(updated);
      notify("Pengaturan absensi berhasil disimpan", "success");
      refresh();
    } catch (err: any) {
      console.error('Gagal menyimpan setelan absensi:', err);
      notify("Gagal menyimpan pengaturan: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-full space-y-6">
      <Header 
        title="Pengaturan Absensi" 
        subtitle="Kelola setelan toleransi keterlambatan, notifikasi pengingat, dan data wajah siswa." 
      />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Late Settings Config */}
        <Card className="p-6 bg-white border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${lateEnabled ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-500'}`}>
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-indigo-955">Deteksi Terlambat Otomatis</span>
                <span className="block text-xs text-slate-400 mt-0.5 font-medium">Tandai terlambat jika lewat jam masuk kelas</span>
              </div>
            </div>
            {/* Custom Toggle Switch */}
            <button 
              type="button"
              onClick={() => setLateEnabled(!lateEnabled)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${lateEnabled ? 'bg-indigo-950' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${lateEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {lateEnabled && (
            <div className="pt-4 pl-12 border-t border-slate-100 mt-2">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-full md:w-1/2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Toleransi Waktu (Menit)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="60"
                    value={lateBuffer}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLateBuffer(val === '' ? '' : Number(val));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950"
                  />
                </div>
                <div className="flex-1 text-xs text-slate-400 font-medium leading-relaxed">
                  Siswa akan otomatis ditandai <span className="text-amber-600 font-bold">Terlambat</span> jika melakukan scan lewat dari {lateBuffer || 0} menit dari jam masuk kelas.
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Notification Config */}
        <Card className="p-6 bg-white border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${notifEnabled ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-indigo-955">Pengingat Jadwal Absensi</span>
                <span className="block text-xs text-slate-400 mt-0.5 font-medium">Aktifkan pengingat sistem sebelum kelas mengajar dimulai</span>
              </div>
            </div>
            <button 
              type="button"
              onClick={handleToggleNotif}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${notifEnabled ? 'bg-indigo-955' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${notifEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {notifEnabled && (
            <div className="pt-4 pl-12 border-t border-slate-100 mt-2">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="w-full md:w-1/2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Ingatkan Sebelum (Menit)</label>
                  <input 
                    type="number" 
                    min="1"
                    max="60"
                    value={notifBuffer}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNotifBuffer(val === '' ? '' : Number(val));
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950"
                  />
                </div>
                <div className="flex-1 text-xs text-slate-400 font-medium leading-relaxed">
                  Browser akan mengirim notifikasi pengingat {notifBuffer || 5} menit sebelum waktu absensi kelas yang terjadwal dimulai.
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Action Button to Save settings */}
        <Button 
          onClick={handleSaveSettings} 
          isLoading={saving}
          className="w-full !py-3.5 font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Simpan Pengaturan Absensi
        </Button>

        {/* Face Enrollment Action Card */}
        <Card className="p-6 bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              <ScanFace className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-indigo-950 text-lg">Manajemen Biometrik Wajah</h3>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">Daftarkan foto wajah siswa secara massal untuk absensi kamera otomatis.</p>
            </div>
          </div>

          <Button 
            onClick={() => setIsFaceEnrollmentOpen(true)} 
            variant="secondary"
            className="w-full !py-3 font-semibold text-sm border border-slate-200 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-900 border-indigo-100 hover:bg-indigo-100"
          >
            <ScanFace className="w-4 h-4" />
            Pendaftaran Wajah Massal (Bulk Enrollment)
          </Button>
        </Card>

        {/* Emergency Vault & Offline Durability Card */}
        <Card className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-[#3B66F5]">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Brankas Cadangan Mandiri</h3>
                <p className="text-slate-400 text-xs mt-0.5">Simpan dan pulihkan seluruh data kelas, siswa, presensi, & nilai secara lokal.</p>
              </div>
            </div>
            {storageEstimate?.persisted && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Penyimpanan Permanen
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 bg-[#3B66F5] hover:bg-blue-600 text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Membuat Cadangan...' : 'Unduh Cadangan Lengkap (.json)'}</span>
            </button>

            <label className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>{isRestoring ? 'Memulihkan...' : 'Pulihkan Data'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isRestoring}
                className="hidden"
              />
            </label>
          </div>
        </Card>

        {/* Privacy Policy and Terms Links */}
        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400 pt-4">
          <button onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-indigo-950 transition-colors flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Kebijakan Privasi
          </button>
          <span>•</span>
          <button onClick={() => setIsTermsModalOpen(true)} className="hover:text-indigo-950 transition-colors flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Syarat & Ketentuan
          </button>
        </div>
      </div>

      {/* FACE BULK ENROLLMENT MODAL */}
      <Modal 
        isOpen={isFaceEnrollmentOpen} 
        onClose={() => setIsFaceEnrollmentOpen(false)} 
        title="Pendaftaran Wajah Massal"
        size="3xl"
      >
        <Suspense fallback={<div className="py-8 text-center text-sm text-gray-500 animate-pulse">Memuat modul wajah...</div>}>
          <FaceBulkEnrollment 
            state={state} 
            notify={notify}
          />
        </Suspense>
      </Modal>

      {/* PRIVACY POLICY MODAL */}
      <Modal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} title="Kebijakan Privasi EduCheck">
        <div className="prose prose-sm max-w-none text-slate-600 space-y-4">
          <section>
            <h4 className="font-bold text-indigo-950">1. Pengumpulan Data</h4>
            <p>EduCheck mengumpulkan data profil guru, data siswa, dan data kehadiran untuk keperluan administrasi sekolah. Data wajah (biometrik) yang didaftarkan diolah secara lokal pada perangkat Anda.</p>
          </section>
          <section>
            <h4 className="font-bold text-indigo-950">2. Penyimpanan Data</h4>
            <p>Data Anda disimpan secara lokal menggunakan database IndexedDB dan dapat disinkronkan ke cloud menggunakan layanan Supabase jika Anda mengaktifkan fitur Sinkronisasi Cloud.</p>
          </section>
          <section>
            <h4 className="font-bold text-indigo-950">3. Keamanan</h4>
            <p>Kami berkomitmen untuk melindungi data Anda. Data biometrik disimpan dalam bentuk representasi numerik (embedding) yang tidak dapat dikembalikan menjadi gambar wajah asli.</p>
          </section>
        </div>
      </Modal>

      {/* TERMS OF SERVICE MODAL */}
      <Modal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} title="Syarat & Ketentuan">
        <div className="prose prose-sm max-w-none text-slate-600 space-y-4">
          <p>Dengan menggunakan aplikasi EduCheck, Anda setuju untuk:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Menggunakan aplikasi ini hanya untuk keperluan administrasi pendidikan yang sah.</li>
            <li>Menjaga kerahasiaan akun guru Anda.</li>
            <li>Bertanggung jawab penuh atas data siswa yang Anda masukkan ke dalam sistem.</li>
            <li>Tidak menyalahgunakan fitur pengenalan wajah untuk tujuan ilegal.</li>
          </ul>
          <p className="mt-4 font-semibold text-indigo-950">EduCheck disediakan "sebagaimana adanya" tanpa jaminan apa pun.</p>
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceSettings;
