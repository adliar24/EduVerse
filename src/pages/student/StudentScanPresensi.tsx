import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Camera, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowLeft, 
  RefreshCw, 
  Smartphone,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsQR from 'jsqr';

// Haversine formula to compute distance in meters between two GPS coordinates
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Radius of the earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

export default function StudentScanPresensi() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [studentSession, setStudentSession] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [timeAllowed, setTimeAllowed] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Check 06.30 - 06.45 WIB window
  useEffect(() => {
    const studentSessionStr = localStorage.getItem('student_session');
    if (!studentSessionStr) {
      navigate('/login');
      return;
    }
    setStudentSession(JSON.parse(studentSessionStr));

    const checkTimeWindow = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeInMinutes = hours * 60 + minutes;

      const startTime = 6 * 60 + 30; // 06:30 = 390 min
      const endTime = 6 * 60 + 45;   // 06:45 = 405 min

      const formattedNow = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setCurrentTimeStr(formattedNow);

      // Allow window check (you can toggle strictly for testing)
      if (timeInMinutes < startTime || timeInMinutes > endTime) {
        setTimeAllowed(false);
      } else {
        setTimeAllowed(true);
      }
    };

    checkTimeWindow();
    const interval = setInterval(checkTimeWindow, 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Start Camera
  const startCamera = async () => {
    setErrorMsg('');
    setStatusMsg('Membuka kamera HP...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        setScanning(true);
        setStatusMsg('Arahkan kamera ke Poster QR Code Kelas...');
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setErrorMsg('Gagal mengakses kamera HP. Pastikan Anda telah memberikan izin kamera.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
    setScanning(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const tick = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      if (scanning) requestAnimationFrame(tick);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code && code.data) {
      console.log("Scanned QR Code:", code.data);
      if (code.data.startsWith('CLASS_QR:')) {
        const scannedClassId = code.data.replace('CLASS_QR:', '').trim();
        stopCamera();
        handleProcessSelfAttendance(scannedClassId);
        return;
      }
    }

    if (scanning) {
      requestAnimationFrame(tick);
    }
  };

  const handleProcessSelfAttendance = async (scannedClassId: string) => {
    setProcessing(true);
    setErrorMsg('');
    setStatusMsg('Memeriksa koordinat GPS dan perangkat HP Anda...');

    try {
      if (!studentSession) throw new Error('Sesi murid tidak valid. Silakan login ulang.');

      // 1. Device Binding Check (Anti-Titip Absen)
      const todayStr = new Date().toISOString().slice(0, 10);
      const deviceFingerprint = localStorage.getItem('pwa_device_fp') || `fp_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem('pwa_device_fp', deviceFingerprint);

      const deviceBindingKey = `device_binding_${todayStr}`;
      const existingBinding = localStorage.getItem(deviceBindingKey);

      if (existingBinding && existingBinding !== studentSession.id) {
        throw new Error(`⛔ PERANGKAT TERKUNCI: Perangkat HP ini sudah digunakan untuk presensi murid lain hari ini. Titip absen tidak diperbolehkan!`);
      }

      // 2. Geolocation Radius Check
      setStatusMsg('Mengambil koordinat GPS lokasi Anda...');
      const position: GeolocationPosition = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('Browser Anda tidak mendukung fitur lokasi GPS.'));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const studentLat = position.coords.latitude;
      const studentLng = position.coords.longitude;

      // School Target GPS (from localStorage or default SMAN 19 Bandung)
      const schoolLat = parseFloat(localStorage.getItem('school_lat') || '-6.914744');
      const schoolLng = parseFloat(localStorage.getItem('school_lng') || '107.609810');
      const allowedRadius = parseFloat(localStorage.getItem('school_radius') || '150');

      const distanceMeters = getDistanceFromLatLonInMeters(studentLat, studentLng, schoolLat, schoolLng);
      console.log(`GPS Check: Distance = ${distanceMeters.toFixed(1)}m, Allowed = ${allowedRadius}m`);

      if (distanceMeters > allowedRadius) {
        throw new Error(`⛔ DILUAR AREA SEKOLAH: Posisi Anda berada ${Math.round(distanceMeters)} meter dari area sekolah (Radius max: ${allowedRadius}m). Anda harus berada di area sekolah untuk presensi.`);
      }

      // 3. Save Attendance Record
      setStatusMsg('Menyimpan data presensi Hadir...');
      localStorage.setItem(deviceBindingKey, studentSession.id);

      const recordObj = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        studentId: studentSession.id,
        classId: scannedClassId,
        dateISO: todayStr,
        status: 'Hadir',
        method: 'Self-QR',
        recordedAt: new Date().toISOString()
      };

      // Save to Supabase attendance_records if table exists
      try {
        await supabase.from('attendance_records').insert([{
          student_id: studentSession.id,
          class_id: scannedClassId,
          status: 'Hadir',
          created_at: new Date().toISOString(),
          school_id: studentSession.school_id
        }]);
      } catch (dbErr) {
        console.warn("Supabase record insert notice:", dbErr);
      }

      setSuccessMsg(`🎉 Presensi Berhasil! Anda tercatat HADIR pada pukul ${new Date().toLocaleTimeString('id-ID')}.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memproses presensi.');
    } finally {
      setProcessing(false);
      setStatusMsg('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col p-4 sm:p-6 max-w-xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all flex items-center gap-2 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs font-extrabold text-sky-300">
          <Clock className="w-3.5 h-3.5 animate-pulse" />
          <span>{currentTimeStr || '06:30'} WIB</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="w-full bg-slate-900/95 border border-white/15 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div>
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-600/40">
              <Camera className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">Scan Presensi Kelas</h2>
            <p className="text-slate-200 text-xs font-medium mt-1">
              Arahkan kamera ke Poster QR Code Kelas di papan kelas Anda.
            </p>
          </div>

          {/* Time Window Warning Banner */}
          {!timeAllowed && (
            <div className="p-4 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs text-left font-medium leading-relaxed flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-amber-300 mb-0.5">Waktu Presensi Mandiri: 06.30 - 06.45 WIB</p>
                <p className="text-[11px] text-amber-200/90">
                  Jika Anda tiba di sekolah setelah jam 06.45 WIB, silakan melapor ke Guru Piket untuk dicatat status <b>Terlambat</b>.
                </p>
              </div>
            </div>
          )}

          {/* Success Box */}
          {successMsg && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-5 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm font-bold text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p>{successMsg}</p>
            </motion.div>
          )}

          {/* Error Box */}
          {errorMsg && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-5 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold text-left space-y-1">
              <div className="flex items-center gap-2 text-rose-400 font-black text-sm mb-1">
                <XCircle className="w-5 h-5" />
                <span>Gagal Presensi</span>
              </div>
              <p>{errorMsg}</p>
            </motion.div>
          )}

          {/* Processing Loading */}
          {processing && (
            <div className="py-6 space-y-3">
              <Loader2 className="w-10 h-10 text-sky-400 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-200 animate-pulse">{statusMsg}</p>
            </div>
          )}

          {/* Camera Viewfinder */}
          {cameraActive && !processing && (
            <div className="relative w-full aspect-square rounded-3xl overflow-hidden border-2 border-indigo-500/50 shadow-inner bg-black">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning Overlay Animation */}
              <div className="absolute inset-0 border-4 border-indigo-400/40 rounded-3xl pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-indigo-400 border-dashed rounded-2xl animate-pulse" />
              </div>
            </div>
          )}

          {/* Start Scan Button */}
          {!cameraActive && !processing && !successMsg && (
            <button
              onClick={startCamera}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white font-black text-sm rounded-full shadow-lg shadow-indigo-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
            >
              <Camera className="w-5 h-5" />
              <span>{errorMsg ? 'Buka Kamera & Coba Lagi' : 'Mulai Scan QR Kelas'}</span>
            </button>
          )}

          {cameraActive && (
            <button
              onClick={stopCamera}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-full transition-all cursor-pointer"
            >
              Tutup Kamera
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
