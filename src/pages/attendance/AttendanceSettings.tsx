import React, { Suspense, useState, useEffect, lazy } from 'react';
import { AppState, TeacherProfile } from '../types';
import { Button, Card, Modal } from '../../components/UI';
import { saveTeacherProfile } from '../../services/dbAttendance';
import { ScanFace, FileText, ShieldCheck, Clock, Bell, Save } from 'lucide-react';
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
    if (!state.teacher) {
      notify("Data profil guru belum dimuat. Silakan reload halaman.", "error");
      return;
    }

    setSaving(true);
    const updated: TeacherProfile = {
      ...state.teacher,
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
