import React, { useState, useEffect } from 'react';
import { TeacherProfile } from '../types';
import { Button } from '../../components/UI';
import { saveTeacherProfile } from '../../services/dbAttendance';
import { v4 as uuidv4 } from 'uuid';
import { Clock, Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  initialData?: TeacherProfile | null;
  onComplete: () => void;
}

export const Setup: React.FC<Props> = ({ initialData, onComplete }) => {
  const [loading, setLoading] = useState(false);
  
  // Late Settings
  const [lateEnabled, setLateEnabled] = useState(initialData?.lateSetting?.isEnabled ?? true);
  const [lateBuffer, setLateBuffer] = useState<string | number>(initialData?.lateSetting?.bufferMinutes ?? 15);

  // Notification Settings
  const [notifEnabled, setNotifEnabled] = useState(!!initialData?.notificationMinutes && initialData.notificationMinutes > 0);
  const [notifBuffer, setNotifBuffer] = useState<string | number>(initialData?.notificationMinutes || 5);

  // Autoload profile details from Supabase if not available in IndexedDB
  const [resolvedProfileDetails, setResolvedProfileDetails] = useState({
    name: initialData?.teacherName || '',
    schools: initialData?.schools || [],
    schoolYear: initialData?.schoolYear || '2025/2026',
    subjects: initialData?.subjects || ['UMUM']
  });

  useEffect(() => {
    if (!initialData) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
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

          setResolvedProfileDetails({
            name: userMetadata?.name || session.user.email?.split('@')[0] || 'Guru',
            schools: schoolNames.length > 0 ? schoolNames : ['SMAN 19 Bandung'],
            schoolYear: userMetadata?.schoolYear || '2025/2026',
            subjects: userMetadata?.subjects || ['UMUM']
          });
        }
      });
    }
  }, [initialData]);

  const handleToggleNotif = async (e: React.MouseEvent) => {
    e.preventDefault();
    const newState = !notifEnabled;
    
    if (newState && 'Notification' in window) {
      if (Notification.permission === 'denied') {
        alert("Izin notifikasi telah di-BLOKIR oleh browser.\n\nSilakan izinkan notifikasi di browser Anda.");
        return;
      }

      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert("Izin notifikasi ditolak. Fitur pengingat tidak dapat diaktifkan.");
          return;
        }
      }
    }
    
    setNotifEnabled(newState);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    const profile: TeacherProfile = {
      id: initialData?.id || uuidv4(),
      teacherName: resolvedProfileDetails.name,
      schools: resolvedProfileDetails.schools,
      currentSchoolIndex: initialData?.currentSchoolIndex || 0,
      schoolYear: resolvedProfileDetails.schoolYear,
      subjects: resolvedProfileDetails.subjects,
      customSubjects: initialData?.customSubjects || [],
      lateSetting: {
        isEnabled: lateEnabled,
        bufferMinutes: lateBuffer === '' ? 15 : Number(lateBuffer)
      },
      notificationMinutes: notifEnabled ? (notifBuffer === '' ? 5 : Number(notifBuffer)) : 0,
      createdAt: initialData?.createdAt || new Date().toISOString()
    };

    try {
      await saveTeacherProfile(profile);
      setLoading(false);
      onComplete();
    } catch (err: any) {
      console.error('Gagal menyimpan setelan absensi:', err);
      alert("Terjadi kesalahan saat menyimpan: " + err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      {/* Late Settings Config */}
      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${lateEnabled ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-500'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-indigo-950">Deteksi Terlambat Otomatis</span>
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
          <div className="pt-4 pl-12 border-t border-slate-200/50 mt-2">
            <div className="flex items-center gap-4">
              <div className="w-1/2">
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
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                />
              </div>
              <div className="flex-1 text-xs text-slate-400 font-medium leading-relaxed">
                Siswa akan otomatis ditandai <span className="text-amber-600 font-bold">Terlambat</span> jika melakukan scan lewat dari {lateBuffer || 0} menit dari jam masuk.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Config */}
      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${notifEnabled ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-indigo-950">Pengingat Jadwal Absensi</span>
              <span className="block text-xs text-slate-400 mt-0.5 font-medium">Aktifkan pengingat sistem sebelum kelas mengajar dimulai</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={handleToggleNotif}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out ${notifEnabled ? 'bg-indigo-950' : 'bg-gray-300'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${notifEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {notifEnabled && (
          <div className="pt-4 pl-12 border-t border-slate-200/50 mt-2">
            <div className="flex items-center gap-4">
              <div className="w-1/2">
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
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                />
              </div>
              <div className="flex-1 text-xs text-slate-400 font-medium leading-relaxed">
                Browser akan mengirim notifikasi pengingat {notifBuffer || 5} menit sebelum waktu absensi kelas yang terjadwal.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100">
        <Button type="submit" isLoading={loading} className="w-full !py-3.5 text-sm font-bold shadow-sm">
          Simpan Setelan Absensi
        </Button>
      </div>
    </form>
  );
};

export default Setup;
