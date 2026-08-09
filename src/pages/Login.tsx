import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Loader2, AlertCircle, ArrowRight, User, ChevronLeft, Shield, Database, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import FluidCanvas from '../components/FluidCanvas';

import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Login() {
  useDocumentTitle('Masuk');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [view, setView] = useState<'selection' | 'login' | 'student-login'>('selection');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      const userRole = data.user?.user_metadata?.role || 'guru';
      if (userRole !== 'guru') {
        await supabase.auth.signOut();
        throw new Error(`Akses ditolak. Akun ini terdaftar sebagai ${userRole}.`);
      }
      
      setIsRedirecting(true);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa kembali email dan password Anda.');
      setLoading(false);
    }
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .ilike('student_code', studentCode.trim())
        .eq('password', studentPassword)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        throw new Error('Username (Kode Murid) atau Password salah.');
      }

      localStorage.setItem('student_session', JSON.stringify({
        id: data.id,
        student_code: data.student_code,
        name: data.name,
        class_id: data.class_id,
        school_id: data.school_id,
        gender: data.gender
      }));
      window.dispatchEvent(new Event('student_session_change'));

      setIsRedirecting(true);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa kembali kode murid dan password Anda.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative bg-gradient-to-br from-[#2E0854] via-[#4C1D95] to-[#3B0764] font-sans overflow-hidden">
      {/* 60fps Fluid Loop Canvas Animation */}
      <FluidCanvas />

      {/* Redirecting Overlay */}
      <AnimatePresence>
        {isRedirecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[#2E0854]/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="w-20 h-20 bg-gradient-to-tr from-[#7C3AED] to-[#C084FC] rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/50 border border-white/20 animate-pulse">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-white mb-2">Menyiapkan Ruang Belajar...</h3>
                <p className="text-purple-200/90 text-sm font-medium">Menghubungkan ke server EduVerse...</p>
              </div>
              <Loader2 className="w-8 h-8 text-purple-300 animate-spin" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 lg:p-16 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-xl inline-flex items-center justify-center">
            <GraduationCap className="text-white w-8 h-8" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-white">EduVerse</span>
          </div>
        </div>

        <div className="my-auto py-8 relative max-w-lg">
          <h1 className="text-4xl lg:text-[42px] font-black leading-[1.15] tracking-tight text-white mb-4 text-center lg:text-left">
            Solusi Edukasi Terpadu &{' '}
            <span className="text-purple-300">Kemudahan Mengajar Guru</span>
          </h1>
          <p className="text-purple-100/90 text-base leading-relaxed font-medium text-center lg:text-left">
            EduVerse dirancang untuk membantu dan memudahkan guru dalam mengelola pembelajaran, presensi, hingga penilaian secara praktis dan efisien.
          </p>
        </div>

        <div className="text-xs text-purple-200/60 font-medium">
          &copy; {new Date().getFullYear()} EduVerse. Dikelola Secara Mandiri.
        </div>
      </div>

      {/* Right Panel - Interactive Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 py-8 sm:p-8 lg:p-24 overflow-y-auto relative z-10">
        {/* Mobile Header Branding */}
        <div className="lg:hidden absolute top-8 sm:top-12 left-0 right-0 z-20 flex flex-col items-center text-center text-white space-y-1">
          <div className="bg-white/15 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 shadow-xl inline-flex items-center justify-center">
            <GraduationCap className="text-white w-7 h-7" />
          </div>
          <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
            <span className="text-2xl font-black tracking-tight text-white">EduVerse</span>
          </div>
          <p className="text-[11px] text-purple-100/90 font-medium max-w-xs">Solusi Cerdas & Kemudahan Mengajar Guru</p>
        </div>

        <div className="relative z-30 w-full max-w-[340px] sm:max-w-md mx-auto bg-white/98 backdrop-blur-2xl p-6 sm:p-9 rounded-[2.5rem] shadow-purple-glow border border-white/80 min-h-[400px] sm:min-h-[430px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {view === 'selection' && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="space-y-5 my-auto"
              >
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Pilih Peran Anda</h2>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">Selamat datang di EduVerse. Silakan pilih kategori peran Anda untuk masuk.</p>
                </div>

                <div className="grid gap-3.5 pt-1">
                  {/* Teacher Option */}
                  <button
                    onClick={() => setView('login')}
                    className="group flex items-center gap-4 p-4 bg-purple-50/50 border border-purple-100 rounded-3xl text-left hover:border-[#6D28D9] hover:bg-purple-50/80 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 active:scale-[0.98] cursor-pointer"
                  >
                    <div className="w-11 h-11 bg-[#6D28D9]/10 rounded-2xl flex items-center justify-center text-[#6D28D9] group-hover:bg-[#6D28D9] group-hover:text-white transition-all shrink-0 shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-extrabold text-slate-900 mb-0.5">Saya Guru / Admin</h3>
                      <p className="text-slate-500 text-xs font-medium leading-snug">Masuk ke dashboard untuk mengelola ujian, absensi, dan rekapitulasi nilai.</p>
                    </div>
                  </button>

                  {/* Student Option */}
                  <button
                    onClick={() => setView('student-login')}
                    className="group flex items-center gap-4 p-4 bg-purple-50/50 border border-purple-100 rounded-3xl text-left hover:border-[#6D28D9] hover:bg-purple-50/80 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 active:scale-[0.98] cursor-pointer"
                  >
                    <div className="w-11 h-11 bg-[#6D28D9]/10 rounded-2xl flex items-center justify-center text-[#6D28D9] group-hover:bg-[#6D28D9] group-hover:text-white transition-all shrink-0 shadow-sm">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-extrabold text-slate-900 mb-0.5">Saya Murid</h3>
                      <p className="text-slate-500 text-xs font-medium leading-snug">Masuk ke halaman ujian digital atau akses dashboard mandiri murid.</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'login' && (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="my-auto"
              >
                <button 
                  onClick={() => setView('selection')}
                  className="inline-flex items-center gap-1.5 text-purple-600 font-bold text-[11px] hover:text-[#6D28D9] transition-colors mb-5 group cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  Kembali ke Pilihan
                </button>

                <div className="mb-5">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Selamat Datang, Guru</h2>
                  <p className="text-slate-500 font-medium text-xs">Masuk untuk mengelola ujian, absensi, dan pengolahan nilai murid.</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-red-600 text-xs font-bold"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 ml-0.5">Email Akun</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4 group-focus-within:text-[#6D28D9] transition-colors" />
                      <input type="email" required
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-purple-100 bg-purple-50/40 outline-none focus:bg-white focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/20 transition-all font-semibold text-xs sm:text-sm"
                        placeholder="Masukkan email Anda" value={email} onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-0.5">
                      <label className="text-xs font-extrabold text-slate-700">Password</label>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4 group-focus-within:text-[#6D28D9] transition-colors" />
                      <input type="password" required
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-purple-100 bg-purple-50/40 outline-none focus:bg-white focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/20 transition-all font-semibold text-xs sm:text-sm"
                        placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-[#5B21B6] via-[#6D28D9] to-[#7C3AED] text-white py-3.5 rounded-full font-extrabold text-xs sm:text-sm hover:scale-[1.01] active:scale-[0.98] transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer border border-white/20"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Masuk Sekarang <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {view === 'student-login' && (
              <motion.div
                key="student-login-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="my-auto"
              >
                <button 
                  onClick={() => setView('selection')}
                  className="inline-flex items-center gap-1.5 text-purple-600 font-bold text-[11px] hover:text-[#6D28D9] transition-colors mb-5 group cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  Kembali ke Pilihan
                </button>

                <div className="mb-5">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Selamat Datang, Murid</h2>
                  <p className="text-slate-500 font-medium text-xs">Masuk menggunakan Kode Murid (Username) dan password dari guru.</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-red-600 text-xs font-bold"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 ml-0.5">Username (Kode Murid)</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4 group-focus-within:text-[#6D28D9] transition-colors" />
                      <input type="text" required
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-purple-100 bg-purple-50/40 outline-none focus:bg-white focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/20 transition-all font-semibold text-xs sm:text-sm"
                        placeholder="Contoh: exz815" value={studentCode} onChange={(e) => setStudentCode(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 ml-0.5">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 w-4 h-4 group-focus-within:text-[#6D28D9] transition-colors" />
                      <input type="password" required
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-purple-100 bg-purple-50/40 outline-none focus:bg-white focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/20 transition-all font-semibold text-xs sm:text-sm"
                        placeholder="••••••••" value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-[#5B21B6] via-[#6D28D9] to-[#7C3AED] text-white py-3.5 rounded-full font-extrabold text-xs sm:text-sm hover:scale-[1.01] active:scale-[0.98] transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer border border-white/20"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Masuk Sekarang <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
