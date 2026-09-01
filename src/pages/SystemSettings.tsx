import React, { useState, useEffect, useRef } from 'react';
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
  Save,
  MapPin,
  QrCode,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Card, Modal, ConfirmModal } from '../components/UI';
import { cn } from '../lib/utils';
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
  const [userRole, setUserRole] = useState<string>('guru');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Super Admin Location Settings State
  const [lat, setLat] = useState<string>('-6.914744');
  const [lng, setLng] = useState<string>('107.609810');
  const [radius, setRadius] = useState<number>(150);
  const [isSavingGps, setIsSavingGps] = useState(false);

  useEffect(() => {
    // Check current auth user & role
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user || null;
      setUser(u);
      if (u) {
        const role = u.user_metadata?.role || 'guru';
        setUserRole(role);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user || null;
      setUser(u);
      if (u) {
        const role = u.user_metadata?.role || 'guru';
        setUserRole(role);
      }
    });

    // Load School GPS config
    loadSchoolGpsSettings();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeSchool]);

  const loadSchoolGpsSettings = async () => {
    const localLat = localStorage.getItem('school_lat') || '-6.914744';
    const localLng = localStorage.getItem('school_lng') || '107.609810';
    const localRadius = localStorage.getItem('school_radius') || '150';

    setLat(localLat);
    setLng(localLng);
    setRadius(parseInt(localRadius));

    if (activeSchool?.id) {
      try {
        const { data } = await supabase
          .from('schools')
          .select('latitude, longitude, radius_meters')
          .eq('id', activeSchool.id)
          .maybeSingle();

        if (data) {
          if (data.latitude) {
            setLat(String(data.latitude));
            localStorage.setItem('school_lat', String(data.latitude));
          }
          if (data.longitude) {
            setLng(String(data.longitude));
            localStorage.setItem('school_lng', String(data.longitude));
          }
          if (data.radius_meters) {
            setRadius(data.radius_meters);
            localStorage.setItem('school_radius', String(data.radius_meters));
          }
        }
      } catch (e) {
        console.warn("School GPS fetch notice:", e);
      }
    }
  };

  const handleSaveGpsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGps(true);
    try {
      localStorage.setItem('school_lat', lat.trim());
      localStorage.setItem('school_lng', lng.trim());
      localStorage.setItem('school_radius', String(radius));

      if (activeSchool?.id && activeSchool.id !== 'legacy') {
        await supabase
          .from('schools')
          .update({
            latitude: parseFloat(lat.trim()),
            longitude: parseFloat(lng.trim()),
            radius_meters: radius
          })
          .eq('id', activeSchool.id);
      }

      showAlert({
        title: 'Berhasil Disimpan',
        message: `Koordinat GPS (${lat}, ${lng}) dan radius ${radius}m berhasil diperbarui untuk seluruh murid.`,
        type: 'success'
      });
    } catch (err: any) {
      showAlert({
        title: 'Gagal',
        message: err.message || 'Gagal menyimpan pengaturan lokasi GPS.',
        type: 'error'
      });
    } finally {
      setIsSavingGps(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      showAlert({ title: 'Gagal', message: 'Browser Anda tidak mendukung Geolocation.', type: 'error' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        showAlert({ title: 'Lokasi Terdeteksi', message: 'Koordinat GPS terkini berhasil dipasang.', type: 'success' });
      },
      (err) => {
        showAlert({ title: 'Gagal', message: `Gagal mengambil lokasi: ${err.message}`, type: 'error' });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSyncToCloud = async () => {
    if (!user) return;
    setIsSyncing(true);
    try {
      const syncService = await loadSyncService();
      await syncService.syncDrive();
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
          const syncService = await loadSyncService();
          await syncService.pullFromCloud();
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

      showAlert({ title: 'Backup Berhasil', message: 'File cadangan (.json) berhasil diunduh.', type: 'success' });
    } catch (err: any) {
      console.error(err);
      showAlert({ title: 'Backup Gagal', message: 'Gagal membuat file cadangan sistem.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E40AF] text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-widest px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-blue-200 border border-white/20">
            ⚙️ Konfigurasi Sistem & GPS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">Pengaturan Sistem & Lokasi</h1>
          <p className="text-slate-100/90 text-xs sm:text-sm font-medium mt-1">
            Kelola sinkronisasi cloud, lokasi GPS sekolah, dan cadangan database.
          </p>
        </div>
      </div>

      {/* Super Admin Section - Location */}
      {userRole === 'guru' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-blue-100/80 shadow-tactile space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-blue-100/80">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-bold shadow-sm">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Koordinat & Radius GPS Sekolah (Khusus Super Admin)</h3>
                <p className="text-xs text-slate-500 font-medium">Batas lokasi radius murid diperbolehkan presensi mandiri.</p>
              </div>
            </div>

            <form onSubmit={handleSaveGpsSettings} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 ml-0.5">Latitude (Lintang)</label>
                  <input
                    type="text"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-blue-100 bg-blue-50/40 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold text-xs sm:text-sm"
                    placeholder="-6.914744"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 ml-0.5">Longitude (Bujur)</label>
                  <input
                    type="text"
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-blue-100 bg-blue-50/40 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold text-xs sm:text-sm"
                    placeholder="107.609810"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 ml-0.5">Radius Maksimal (Meter)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={2000}
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value) || 150)}
                    className="w-full px-4 py-3 rounded-2xl border border-blue-100 bg-blue-50/40 outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all font-semibold text-xs sm:text-sm"
                    placeholder="150"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-full transition-all flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Deteksi Lokasi Saya Sekarang</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingGps}
                  className="px-6 py-3 bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] text-white font-extrabold text-xs rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingGps ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Lokasi GPS Sekolah</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Backup & Cloud Sync Actions */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-blue-100/80 shadow-tactile space-y-6">
        <div className="flex items-center gap-3.5 pb-4 border-b border-blue-100/80">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-sm">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Sinkronisasi Cloud & Cadangan Data</h3>
            <p className="text-xs text-slate-500 font-medium">Cadangkan database atau lakukan sinkronisasi real-time ke cloud Supabase.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={handleSyncToCloud}
            disabled={isSyncing || !user}
            className="p-5 rounded-3xl bg-blue-50/50 border border-blue-100 hover:border-[#2563EB] text-left transition-all group flex flex-col justify-between cursor-pointer disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center mb-3 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
              <RefreshCw className={cn("w-5 h-5", isSyncing && "animate-spin")} />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Upload ke Cloud</h4>
              <p className="text-xs text-slate-500 mt-1">Kirim seluruh data lokal ke database Supabase</p>
            </div>
          </button>

          <button
            onClick={handlePullFromCloud}
            disabled={isSyncing || !user}
            className="p-5 rounded-3xl bg-blue-50/50 border border-blue-100 hover:border-blue-600 text-left transition-all group flex flex-col justify-between cursor-pointer disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Tarik dari Cloud</h4>
              <p className="text-xs text-slate-500 mt-1">Perbarui database lokal dengan data cloud terbaru</p>
            </div>
          </button>

          <button
            onClick={handleBackupToFile}
            className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100 hover:border-emerald-600 text-left transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Unduh Backup JSON</h4>
              <p className="text-xs text-slate-500 mt-1">Simpan cadangan lokal ke file berkas terenkripsi</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
