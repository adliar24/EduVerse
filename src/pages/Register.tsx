import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, BookOpen, Loader2, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '../lib/utils';

import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Register() {
  useDocumentTitle('Daftar Akun');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    password: '',
    confirmPassword: '',
    role: 'guru' as 'guru' | 'siswa'
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            subject: formData.role === 'guru' ? formData.subject : 'Siswa',
            role: formData.role
          }
        }
      });

      if (authError) throw authError;

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError('Email ini sudah terdaftar. Silakan gunakan email lain atau langsung login.');
        setLoading(false);
        return;
      }

      alert('Registrasi berhasil! Silakan login untuk masuk ke dashboard.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Side - Visual/Marketing */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-950 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white/10 backdrop-blur-lg w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-white/20">
              <Sparkles className="text-white w-8 h-8" />
            </div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Bergabung dengan <span className="text-blue-400">EduTest</span>
            </h1>
            <p className="text-slate-400 text-xl leading-relaxed mb-10">
              Mulai perjalanan Anda dalam menciptakan pengalaman ujian digital yang lebih baik untuk semua.
            </p>
            
            <div className="space-y-6">
              {[
                { label: 'Pendaftaran Cepat & Mudah', icon: ShieldCheck },
                { label: 'Akses Fitur Premium Gratis', icon: Sparkles },
                { label: 'Dukungan Komunitas Belajar', icon: User }
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-4 text-slate-300">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50/50 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md py-12"
        >
          <div className="mb-10">
            <div className="lg:hidden bg-indigo-950 w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-lg">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold text-indigo-950 tracking-tight">Buat Akun Baru</h2>
            <p className="text-slate-500">Lengkapi data di bawah untuk memulai</p>
          </div>

          {/* Role Selector */}
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
            <button 
              onClick={() => setFormData({...formData, role: 'guru'})}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                formData.role === 'guru' ? "bg-white text-indigo-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Sebagai Guru
            </button>
            <button 
              onClick={() => setFormData({...formData, role: 'siswa'})}
              className={cn(
                "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                formData.role === 'siswa' ? "bg-white text-indigo-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Sebagai Siswa
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Nama Lengkap</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    required
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                    placeholder="Nama Anda"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  {formData.role === 'guru' ? 'Mata Pelajaran' : 'Kelas'}
                </label>
                <div className="relative group">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    required
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                    placeholder={formData.role === 'guru' ? "Matematika" : "XII IPA 1"}
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="email" 
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                  placeholder="nama@sekolah.sch.id"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="password" 
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Konfirmasi Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="password" 
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white py-4 rounded-2xl font-bold hover:brightness-110 active:scale-[0.98] transition-all border border-white/10 shadow-xl shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Daftar Sekarang
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-200 text-center">
            <p className="text-slate-500 font-medium">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">Masuk Sekarang</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
