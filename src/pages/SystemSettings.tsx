import React, { useState, useEffect, useRef, Suspense } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Database, 
  Cloud, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Loader2, 
  User, 
  ShieldAlert,
  Save
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from './Layout';
import { Button, Card, Modal, ConfirmModal } from '../components/UI';
import { useAlert } from '../context/AlertContext';
import { useSchool } from '../context/SchoolContext';
import { getFullState, initDB, resetAllData } from '../services/dbAttendance';
import { createBackup, restoreBackup, resetGradingDB, syncLocalToCloud, syncCloudToLocal } from '../services/dbGrading';

const loadSyncService = async () => {
  const { syncService } = await import('../services/sync');
  return syncService;
};

export default function SystemSettings() {
  const { showAlert } = useAlert();
  const { refreshSchools, activeSchool } = useSchool();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check PWA installer availability
    const handleInstallable = (e: any) => {
      if (e.detail) setCanInstall(true);
    };
    window.addEventListener('pwa-installable', handleInstallable);
    
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setCanInstall(false);
    }

    // Get current auth user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      subscription.unsubscribe();
    };
  }, []);

  const handleInstallApp = async () => {
    const win = window as any;
    if (win.deferredPrompt) {
      win.deferredPrompt.prompt();
      const { outcome } = await win.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setCanInstall(false);
        win.deferredPrompt = null;
      }
    }
  };

  const handleSyncToCloud = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      // 1. Sync Attendance Database
      const syncService = await loadSyncService();
      await syncService.syncDrive();

      // 2. Sync Grading Database
      await syncLocalToCloud();
      await syncCloudToLocal();

      showAlert({
        title: 'Berhasil',
        message: 'Seluruh data aplikasi (Absensi & Nilai) berhasil disinkronkan ke Cloud.',
        type: 'success'
      });
      await refreshSchools();
    } catch (err: any) {
      console.error(err);
      showAlert({
        title: 'Gagal Sinkronisasi',
        message: err.message || 'Terjadi kesalahan saat menyinkronkan data.',
        type: 'error'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    if (!user) return;
    showAlert({
      title: 'Tarik Data dari Cloud?',
      message: 'Ini akan mengunduh data terbaru dari Cloud dan menimpa database lokal Anda jika terdapat konflik. Lanjutkan?',
      type: 'confirm',
      confirmText: 'Ya, Tarik Data',
      onConfirm: async () => {
        setIsSyncing(true);
        try {
          // 1. Pull Attendance
          const syncService = await loadSyncService();
          await syncService.pullFromCloud();

          // 2. Pull Grading
          await syncCloudToLocal();

          showAlert({
            title: 'Berhasil',
            message: 'Database lokal berhasil diperbarui dengan data dari Cloud.',
            type: 'success'
          });
          await refreshSchools();
        } catch (err: any) {
          console.error(err);
          showAlert({
            title: 'Gagal',
            message: err.message || 'Gagal memuat data dari Cloud.',
            type: 'error'
          });
        } finally {
          setIsSyncing(false);
        }
      }
    });
  };

  const handleBackupToFile = async () => {
    try {
      const attendanceData = await getFullState();
      const gradingData = await createBackup('full');

      const backupObj = {
        app: 'EduVerse',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        attendance: attendanceData,
        grading: gradingData
      };

      const json = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `EduVerse_FullBackup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showAlert({
        title: 'Backup Berhasil',
        message: 'File cadangan (.json) berhasil diunduh.',
        type: 'success'
      });
    } catch (err: any) {
      console.error(err);
      showAlert({
        title: 'Backup Gagal',
        message: 'Gagal membuat file cadangan sistem.',
        type: 'error'
      });
    }
  };

  const handleRestoreFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);

        if (data.app !== 'EduVerse') {
          throw new Error('Format file tidak dikenal. Harus berupa file backup EduVerse.');
        }

        showAlert({
          title: 'Pulihkan Sistem?',
          message: 'Ini akan menimpa seluruh database lokal (Absensi & Nilai) dengan data dari file backup. Tindakan ini tidak dapat dibatalkan. Lanjutkan?',
          type: 'confirm',
          confirmText: 'Ya, Pulihkan',
          onConfirm: async () => {
            try {
              // 1. Restore Attendance
              if (data.attendance) {
                const db = await initDB();
                const tx = db.transaction(
                  ['teacher', 'classes', 'students', 'sessions', 'records', 'schedules', 'events', 'cancellations'],
                  'readwrite'
                );
                
                const targetSchoolId = activeSchool?.id;
                
                if (data.attendance.teacher) await tx.objectStore('teacher').put(data.attendance.teacher);
                if (data.attendance.classes && Array.isArray(data.attendance.classes)) {
                  for (const c of data.attendance.classes) {
                    if (targetSchoolId) {
                      c.school_id = targetSchoolId;
                      c.schoolId = targetSchoolId;
                    }
                    await tx.objectStore('classes').put(c);
                  }
                }
                if (data.attendance.students && Array.isArray(data.attendance.students)) {
                  for (const s of data.attendance.students) {
                    if (targetSchoolId) {
                      s.school_id = targetSchoolId;
                      s.schoolId = targetSchoolId;
                    }
                    await tx.objectStore('students').put(s);
                  }
                }
                if (data.attendance.sessions && Array.isArray(data.attendance.sessions)) {
                  for (const s of data.attendance.sessions) {
                    if (targetSchoolId) {
                      s.school_id = targetSchoolId;
                      s.schoolId = targetSchoolId;
                    }
                    await tx.objectStore('sessions').put(s);
                  }
                }
                if (data.attendance.records && Array.isArray(data.attendance.records)) {
                  for (const r of data.attendance.records) {
                    if (targetSchoolId) {
                      r.school_id = targetSchoolId;
                      r.schoolId = targetSchoolId;
                    }
                    await tx.objectStore('records').put(r);
                  }
                }
                if (data.attendance.schedules && Array.isArray(data.attendance.schedules)) {
                  for (const s of data.attendance.schedules) {
                    if (targetSchoolId) {
                      s.school_id = targetSchoolId;
                      s.schoolId = targetSchoolId;
                    }
                    await tx.objectStore('schedules').put(s);
                  }
                }
                if (data.attendance.events && Array.isArray(data.attendance.events)) {
                  for (const ev of data.attendance.events) {
                    if (targetSchoolId) {
                      ev.school_id = targetSchoolId;
                      ev.schoolId = targetSchoolId;
                    }
                    await tx.objectStore('events').put(ev);
                  }
                }
                if (data.attendance.cancellations && Array.isArray(data.attendance.cancellations)) {
                  for (const c of data.attendance.cancellations) {
                    if (targetSchoolId) {
                      c.school_id = targetSchoolId;
                      c.schoolId = targetSchoolId;
                    }
                    await tx.objectStore('cancellations').put(c);
                  }
                }
                await tx.done;
              }

              // 2. Restore Grading
              if (data.grading) {
                await restoreBackup(data.grading, 'full');
              }

              // 3. Auto-push restored data to Supabase Cloud
              try {
                const { syncService } = await import('../services/sync');
                if (syncService.isConfigured()) {
                  const user = await syncService.getUser();
                  if (user) {
                    await syncService.pushToCloud();
                    const { syncLocalToCloud } = await import('../services/dbGrading');
                    await syncLocalToCloud();
                  }
                }
              } catch (syncErr) {
                console.error("Auto sync after restore failed:", syncErr);
              }

              showAlert({
                title: 'Berhasil',
                message: 'Pemulihan data selesai. Data telah disinkronkan ke Cloud dan sistem akan dimuat ulang.',
                type: 'success'
              });
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            } catch (restoreErr: any) {
              console.error("Restore error in database transaction:", restoreErr);
              showAlert({
                title: 'Gagal Memulihkan',
                message: restoreErr.message || 'Gagal menyimpan data ke IndexedDB. Periksa konsol browser.',
                type: 'error'
              });
            }
          }
        });
      } catch (err: any) {
        console.error(err);
        showAlert({
          title: 'Gagal Pulihkan',
          message: err.message || 'File tidak valid atau rusak.',
          type: 'error'
        });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = async () => {
    try {
      // Clear databases
      await resetAllData();
      await resetGradingDB();
      // Sign out from Supabase
      await supabase.auth.signOut();
      localStorage.removeItem('student_session');
      window.dispatchEvent(new Event('student_session_change'));

      showAlert({
        title: 'Sistem Direset',
        message: 'Seluruh database telah dibersihkan. Kembali ke halaman login.',
        type: 'success'
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err: any) {
      console.error(err);
      showAlert({
        title: 'Gagal Reset',
        message: 'Gagal membersihkan database.',
        type: 'error'
      });
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold text-indigo-950 tracking-tight">Cadangan & Pemulihan</h2>
        <p className="text-slate-500 font-medium mt-1">Kelola pencadangan dan pemulihan data sistem EduVerse secara manual.</p>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Local Backup Card */}
        <Card className="p-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-indigo-950 text-lg">Pencadangan File Lokal</h3>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">Ekspor dan impor database secara manual melalui file JSON.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              onClick={handleBackupToFile}
              variant="secondary"
              className="w-full !py-3 font-semibold text-sm border border-slate-200 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4 text-indigo-950" />
              Unduh Backup (.json)
            </Button>

            <div>
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleRestoreFromFile} 
                className="hidden" 
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                className="w-full !py-3 font-semibold text-sm border border-slate-200 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-indigo-950" />
                Pulihkan dari File (.json)
              </Button>
            </div>
          </div>
        </Card>

        {/* PWA Installer */}
        {canInstall && (
          <Card className="p-6 bg-indigo-50/50 border border-indigo-100 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-indigo-950">Instal Aplikasi EduVerse</h4>
                <p className="text-slate-500 text-sm mt-0.5">Jalankan EduVerse sebagai aplikasi desktop/mobile mandiri.</p>
              </div>
              <Button onClick={handleInstallApp} className="shadow-none text-xs font-semibold px-4 py-2">
                Instal Sekarang
              </Button>
            </div>
          </Card>
        )}

        {/* Reset System Card */}
        <Card className="p-6 bg-rose-50 border border-rose-100 shadow-none">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className="text-rose-600 bg-rose-100 p-2 rounded-xl h-fit">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-rose-950">Zona Bahaya</h4>
                <p className="text-rose-800/80 text-sm mt-0.5">Reset aplikasi akan menghapus seluruh data absensi, nilai, kelas, dan profil guru secara permanen.</p>
              </div>
            </div>
            <Button 
              variant="danger" 
              onClick={() => setIsResetModalOpen(true)} 
              className="text-xs font-semibold px-4 py-2"
            >
              Reset Semua Data
            </Button>
          </div>
        </Card>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal 
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
        title="Konfirmasi Reset Total"
        description="Apakah Anda yakin ingin menghapus seluruh data di aplikasi ini secara permanen? Semua data kelas, siswa, absensi, dan nilai akan hilang."
        confirmText="Ya, Hapus Semua"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
