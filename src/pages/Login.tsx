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

      setIsRedirecting(true);
      navigate('/student/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa kembali kode murid dan password Anda.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative bg-slate-950 font-sans overflow-hidden">
      {/* 60fps Fluid Loop Canvas Animation */}
      <FluidCanvas />

      {/* Redirecting Overlay */}
      <AnimatePresence>
        {isRedirecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-indigo-950/90 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center text-white"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-full shadow-2xl shadow-indigo-600/30 border border-white/20">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight">Menyiapkan Dashboard</h3>
                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Selamat datang kembali...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Panel - Branding & Abstract Geometric Motif */}
      <div className="hidden lg:flex lg:w-1/2 p-16 flex-col justify-between text-white relative z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-white/15 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center border border-white/20 shrink-0 shadow-lg">
            <GraduationCap className="text-white w-8 h-8" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tracking-tight text-white">EduVerse</span>
          </div>
        </div>

        <div className="my-auto py-8 relative max-w-lg">
          <h1 className="text-4xl lg:text-[42px] font-black leading-[1.15] tracking-tight text-white mb-4 text-center lg:text-left">
            Aplikasi Manajemen Kelas &{' '}
            <span className="text-cyan-300">Presensi Digital Terpadu</span>
          </h1>
          <p className="text-indigo-100/90 text-base leading-relaxed font-medium text-center lg:text-left">
            Kelola absensi murid (QR & Wajah), buku nilai, rekapitulasi, dan perangkat mengajar Anda secara terpadu.
          </p>
        </div>

        <div className="text-xs text-indigo-200/60 font-medium">
          &copy; {new Date().getFullYear()} EduVerse. Dikelola Secara Mandiri.
        </div>
      </div>

      {/* Right Panel - Interactive Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-3 py-6 sm:p-8 lg:p-24 overflow-y-auto relative z-10">
        {/* Mobile Header Branding (Fixed Top Layer on mobile <lg) */}
        <div className="lg:hidden absolute top-10 sm:top-14 left-0 right-0 z-20 flex flex-col items-center text-center text-white space-y-1">
          <div className="bg-white/15 backdrop-blur-md p-2 rounded-2xl border border-white/20 shadow-xl inline-flex items-center justify-center">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
            <span className="text-2xl font-black tracking-tight text-white">EduVerse</span>
          </div>
          <p className="text-[11px] text-indigo-100/90 font-medium max-w-xs">Aplikasi Manajemen Kelas & Presensi Digital</p>
        </div>

        <div className="relative z-30 w-full max-w-[340px] sm:max-w-md mx-auto bg-white/98 backdrop-blur-2xl p-5 sm:p-8 rounded-3xl shadow-2xl border border-white/80 min-h-[390px] sm:min-h-[410px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {view === 'selection' && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 my-auto"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">Pilih Peran Anda</h2>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">Selamat datang di EduVerse. Silakan pilih kategori peran Anda untuk masuk.</p>
                </div>

                <div className="grid gap-3 pt-1">
                  {/* Teacher Option */}
                  <button
                    onClick={() => setView('login')}
                    className="group flex items-center gap-3.5 p-4 bg-white border border-slate-200 rounded-full text-left hover:border-[#3B66F5] hover:shadow-lg hover:shadow-[#3B66F5]/10 transition-all duration-300 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#3B66F5] group-hover:bg-[#3B66F5] group-hover:text-white transition-colors shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-900 mb-0.5">Saya Guru / Admin</h3>
                      <p className="text-slate-500 text-xs font-medium leading-snug">Masuk ke dashboard untuk mengelola ujian, absensi, dan rekapitulasi nilai.</p>
                    </div>
                  </button>

                  {/* Student Option */}
                  <button
                    onClick={() => setView('student-login')}
                    className="group flex items-center gap-3.5 p-4 bg-white border border-slate-200 rounded-full text-left hover:border-[#3B66F5] hover:shadow-lg hover:shadow-[#3B66F5]/10 transition-all duration-300 active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#3B66F5] group-hover:bg-[#3B66F5] group-hover:text-white transition-colors shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-900 mb-0.5">Saya Murid</h3>
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
                  className="inline-flex items-center gap-1.5 text-slate-400 font-bold text-[11px] hover:text-[#3B66F5] transition-colors mb-5 group"
                >
                  <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  Kembali ke Pilihan
                </button>

                <div className="mb-5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">Selamat Datang, Guru</h2>
                  <p className="text-slate-500 font-medium text-xs">Masuk untuk mengelola ujian, absensi, dan pengolahan nilai murid.</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-red-600 text-xs font-bold"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-0.5">Email Akun</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-[#3B66F5] transition-colors" />
                      <input type="email" required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-[#3B66F5] focus:ring-2 focus:ring-[#3B66F5]/20 transition-all font-semibold text-xs sm:text-sm"
                        placeholder="Masukkan email Anda" value={email} onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-0.5">
                      <label className="text-xs font-bold text-slate-700">Password</label>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-[#3B66F5] transition-colors" />
                      <input type="password" required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-[#3B66F5] focus:ring-2 focus:ring-[#3B66F5]/20 transition-all font-semibold text-xs sm:text-sm"
                        placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white py-3 rounded-full font-bold text-xs sm:text-sm hover:scale-[1.01] active:scale-[0.98] transition-all shadow-lg shadow-[#3B66F5]/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer"
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
                  className="inline-flex items-center gap-1.5 text-slate-400 font-bold text-[11px] hover:text-[#3B66F5] transition-colors mb-5 group"
                >
                  <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  Kembali ke Pilihan
                </button>

                <div className="mb-5">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">Selamat Datang, Murid</h2>
                  <p className="text-slate-500 font-medium text-xs">Masuk menggunakan Kode Murid (Username) dan password dari guru.</p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-red-600 text-xs font-bold"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleStudentLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-0.5">Username (Kode Murid)</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-[#3B66F5] transition-colors" />
                      <input type="text" required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-[#3B66F5] focus:ring-2 focus:ring-[#3B66F5]/20 transition-all font-semibold text-xs sm:text-sm"
                        placeholder="Contoh: exz815" value={studentCode} onChange={(e) => setStudentCode(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 ml-0.5">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-[#3B66F5] transition-colors" />
                      <input type="password" required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:bg-white focus:border-[#3B66F5] focus:ring-2 focus:ring-[#3B66F5]/20 transition-all font-semibold text-xs sm:text-sm"
                        placeholder="••••••••" value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white py-3 rounded-full font-bold text-xs sm:text-sm hover:scale-[1.01] active:scale-[0.98] transition-all shadow-lg shadow-[#3B66F5]/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer"
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



