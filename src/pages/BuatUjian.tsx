import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Settings, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Zap,
  Check,
  FolderIcon,
  ChevronDown,
  X,
  Shield,
  ShieldOff,
  WifiOff,
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { useAlert } from '../context/AlertContext';
import { useSchool } from '../context/SchoolContext';
import { generateExamCode, cn } from '../lib/utils';
import { staggerContainer, staggerItem } from '../lib/animations';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { id } from 'date-fns/locale';

import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function BuatUjian() {
  useDocumentTitle('Buat Ujian Baru');
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { activeSchool } = useSchool();
  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerTime, setPickerTime] = useState({ hours: 8, minutes: 0 });

  const [formData, setFormData] = useState({
    title: '',
    duration: 60,
    randomized: true,
    start_time: '',
    end_time: '',
    is_active: false,
    show_score: true,
    strict_mode: true,
    offline_mode: false,
    qr_submission: false,
    strict_limit: 3
  });

  useEffect(() => {
    fetchQuestions();
    fetchCategories();
  }, [selectedCategoryId, activeSchool]);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('teacher_id', user.id)
        .order('name');
      setCategories(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('questions')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      
      if (selectedCategoryId) {
        query = query.eq('category_id', selectedCategoryId);
      }
      const { data } = await query.limit(500);
      setQuestions(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelectAll = () => {
    const visibleQuestionIds = questions.map(q => q.id);
    const areAllSelected = visibleQuestionIds.every(id => selectedQuestions.includes(id));

    if (areAllSelected) {
      setSelectedQuestions(prev => prev.filter(id => !visibleQuestionIds.includes(id)));
    } else {
      setSelectedQuestions(prev => {
        const newSelection = [...prev];
        visibleQuestionIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const areAllQuestionsSelected = questions.length > 0 && questions.every(q => selectedQuestions.includes(q.id));

  const handleCreateExam = async () => {
    if (selectedQuestions.length === 0) {
      showAlert({ title: 'Peringatan', message: 'Pilih minimal 1 soal!', type: 'warning' });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const examCode = generateExamCode();
      const bypassCode = examCode;

      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert([{
          teacher_id: user.id,
          title: formData.title,
          exam_code: examCode,
          duration: formData.duration,
          total_questions: selectedQuestions.length,
          random_question: formData.randomized,
          random_answer: formData.randomized,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          is_active: formData.is_active,
          show_score: formData.show_score,
          strict_mode: formData.strict_mode,
          offline_mode: formData.offline_mode,
          qr_submission: formData.qr_submission,
          strict_limit: formData.strict_limit,
          bypass_code: bypassCode,
          school_id: activeSchool?.id === 'legacy' ? null : activeSchool?.id
        }])
        .select()
        .single();

      if (examError) throw examError;

      // Deduplicate selected questions to prevent double options
      const uniqueQuestionIds = [...new Set(selectedQuestions)];
      
      const examQuestions = uniqueQuestionIds.map(qId => ({
        exam_id: exam.id,
        question_id: qId
      }));

      await supabase.from('exam_questions').insert(examQuestions);
      
      showAlert({
        title: 'Berhasil!',
        message: `Ujian berhasil diterbitkan dan siap dikerjakan.`,
        type: 'success',
        onConfirm: () => navigate('/daftar-ujian')
      });
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes('qr_submission') || error?.code === '42703') {
        showAlert({
          title: 'Kolom Database Belum Ada',
          message: 'Fitur ini membutuhkan kolom baru di database Supabase Anda.\n\nSilakan masuk ke Dashboard Supabase -> SQL Editor, lalu jalankan perintah berikut:\n\nALTER TABLE public.exams ADD COLUMN IF NOT EXISTS qr_submission BOOLEAN DEFAULT FALSE;',
          type: 'error'
        });
      } else {
        showAlert({
          title: 'Gagal',
          message: 'Terjadi kesalahan saat menerbitkan ujian: ' + (error?.message || 'Terjadi kesalahan sistem.'),
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'Pengaturan Ujian', icon: Settings },
    { id: 2, label: 'Pilih Pertanyaan', icon: BookOpen }
  ];

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-indigo-950 tracking-tight">Buat Ujian Baru</h2>
        <p className="text-slate-500 font-medium mt-1">Konfigurasi ujian Anda dan pilih soal terbaik.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 px-2 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 sm:gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg",
                step >= s.id ? "bg-[#3B66F5] text-white shadow-slate-200" : "bg-white border-2 border-slate-100 text-slate-300"
              )}>
                {step > s.id ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 whitespace-nowrap",
                step >= s.id ? "text-indigo-950" : "text-slate-300"
              )}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="h-0.5 w-8 sm:w-12 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: step > s.id ? '100%' : '0%' }}
                  className="h-full bg-indigo-950"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-3">
                <label className="text-sm font-bold text-slate-700 ml-1">Judul Ujian</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Ujian Tengah Semester Matematika Kelas X"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm text-indigo-900"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 ml-1">Durasi (Menit)</label>
                <div className="relative group">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none z-10" />
                  <input 
                    type="number" 
                    className="w-full pl-10 pr-8 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm text-indigo-900"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 ml-1">Waktu Mulai (Opsional)</label>
                <button 
                  type="button"
                  onClick={() => setShowDatePicker(true)}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm text-slate-500 text-left flex items-center justify-between cursor-pointer hover:border-blue-300"
                >
                  <span className={formData.start_time ? "text-indigo-900" : ""}>
                    {formData.start_time 
                      ? format(new Date(formData.start_time), "dd MMMM yyyy, HH:mm")
                      : "Ketuk Disini"}
                  </span>
                  <Calendar className="w-4 h-4 text-blue-500" />
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="bg-indigo-950 p-1.5 rounded-lg">
                  <LayoutGrid className="text-white w-3 h-3" />
                </div>
                <h4 className="font-bold text-indigo-950 text-sm tracking-tight">Konfigurasi Tambahan</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={cn(
                  "flex items-center gap-4 p-6 rounded-3xl border-2 transition-all cursor-pointer group",
                  formData.randomized ? "border-indigo-950 bg-slate-50" : "border-slate-100 bg-white hover:border-slate-200"
                )}>
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    formData.randomized ? "bg-indigo-950 border-indigo-950" : "border-slate-200 group-hover:border-slate-400"
                  )}>
                    {formData.randomized && <Check className="text-white w-4 h-4" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={formData.randomized}
                    onChange={(e) => setFormData({...formData, randomized: e.target.checked})}
                  />
                  <div>
                    <p className="text-sm font-bold text-indigo-950">Acak Soal & Jawaban</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Urutan soal dan pilihan jawaban diacak.</p>
                  </div>
                </label>
                <label className={cn(
                  "flex items-center gap-4 p-6 rounded-3xl border-2 transition-all cursor-pointer group",
                  formData.show_score ? "border-indigo-950 bg-slate-50" : "border-slate-100 bg-white hover:border-slate-200"
                )}>
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    formData.show_score ? "bg-indigo-950 border-indigo-950" : "border-slate-200 group-hover:border-slate-400"
                  )}>
                    {formData.show_score && <Check className="text-white w-4 h-4" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={formData.show_score}
                    onChange={(e) => setFormData({...formData, show_score: e.target.checked})}
                  />
                  <div>
                    <p className="text-sm font-bold text-indigo-950">Tampilkan Nilai</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Siswa dapat melihat skor mereka setelah selesai.</p>
                  </div>
                </label>
                <div className="md:col-span-2 space-y-4">
                  <label className={cn(
                    "flex items-center gap-4 p-6 rounded-3xl border-2 transition-all cursor-pointer group w-full",
                    formData.strict_mode ? "border-indigo-950 bg-slate-50" : "border-slate-100 bg-white hover:border-slate-200"
                  )}>
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      formData.strict_mode ? "bg-indigo-950 border-indigo-950" : "border-slate-200 group-hover:border-slate-400"
                    )}>
                      {formData.strict_mode && <Check className="text-white w-4 h-4" />}
                    </div>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={formData.strict_mode}
                      onChange={(e) => setFormData({...formData, strict_mode: e.target.checked})}
                    />
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-indigo-950">Proteksi Ketat (Anti-Kecurangan)</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">Blokir copas dan pantau apabila siswa membuka tab baru.</p>
                      </div>
                      {formData.strict_mode ? <Shield className="w-6 h-6 text-indigo-950" /> : <ShieldOff className="w-6 h-6 text-slate-300" />}
                    </div>
                  </label>

                  {formData.strict_mode && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-50 p-6 rounded-3xl border border-indigo-950/20 space-y-3"
                    >
                      <p className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Batas Maksimal Toleransi Keluar Tab:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: '1x (Langsung Blokir)', value: 1 },
                          { label: '2x (1x Peringatan)', value: 2 },
                          { label: '3x (2x Peringatan)', value: 3 },
                          { label: 'Tanpa Batas', value: 0 }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, strict_limit: opt.value })}
                            className={cn(
                              "py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center",
                              formData.strict_limit === opt.value
                                ? "bg-[#3B66F5] text-white border-indigo-950 shadow-sm"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
                <label className={cn(
                  "flex items-center gap-4 p-6 rounded-3xl border-2 transition-all cursor-pointer group md:col-span-2",
                  formData.offline_mode ? "border-indigo-950 bg-slate-50" : "border-slate-100 bg-white hover:border-slate-200"
                )}>
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    formData.offline_mode ? "bg-indigo-950 border-indigo-950" : "border-slate-200 group-hover:border-slate-400"
                  )}>
                    {formData.offline_mode && <Check className="text-white w-4 h-4" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={formData.offline_mode}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFormData({
                        ...formData,
                        offline_mode: isChecked,
                        qr_submission: isChecked ? formData.qr_submission : false
                      });
                    }}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-indigo-950">Mode Offline (Hemat Kuota)</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Siswa hanya butuh internet di awal untuk unduh soal dan di akhir untuk mengirim jawaban.</p>
                    </div>
                    <WifiOff className={cn("w-6 h-6", formData.offline_mode ? "text-indigo-950" : "text-slate-300")} />
                  </div>
                </label>
                <label className={cn(
                  "flex items-center gap-4 p-6 rounded-3xl border-2 transition-all cursor-pointer group md:col-span-2",
                  formData.qr_submission ? "border-indigo-950 bg-slate-50" : "border-slate-100 bg-white hover:border-slate-200"
                )}>
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    formData.qr_submission ? "bg-indigo-950 border-indigo-950" : "border-slate-200 group-hover:border-slate-400"
                  )}>
                    {formData.qr_submission && <Check className="text-white w-4 h-4" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={formData.qr_submission}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFormData({
                        ...formData,
                        qr_submission: isChecked,
                        offline_mode: isChecked ? true : formData.offline_mode
                      });
                    }}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-indigo-950">Mode QR Code (Pengumpulan Manual)</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">Siswa menyelesaikan ujian dalam bentuk QR Code. Guru memindai hasil untuk merekap nilai.</p>
                    </div>
                    <QrCode className={cn("w-6 h-6", formData.qr_submission ? "text-indigo-950" : "text-slate-300")} />
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-10">
              <button 
                onClick={() => setStep(2)}
                disabled={!formData.title}
                className="w-full bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white py-3 px-6 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all border border-white/10 shadow-lg shadow-slate-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                Lanjut Pilih Pertanyaan
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 shrink-0">
                <div className="bg-blue-50 w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Soal Terpilih</p>
                  <p className="text-2xl sm:text-3xl font-bold text-indigo-950 tracking-tight">{selectedQuestions.length}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto md:flex-1 md:justify-end">
                <div className="relative w-full sm:max-w-xs">
                  <FolderIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select 
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-sm text-indigo-950 appearance-none cursor-pointer"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                  >
                    <option value="">📁 Semua Folder</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parent_id ? '　 ' : ''}📂 {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    type="button"
                    onClick={handleToggleSelectAll}
                    disabled={questions.length === 0}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm text-indigo-950 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {areAllQuestionsSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  </button>
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>
                  <button 
                    onClick={handleCreateExam}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] hover:brightness-110 transition-all border border-white/10 shadow-lg shadow-slate-200/50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Terbitkan</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <motion.div 
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 gap-4"
              >
                {questions.map((q, index) => (
                  <motion.label 
                    variants={staggerItem}
                    whileHover="hover"
                whileTap="tap"
                key={q.id}
                  className={cn(
                    "flex items-start gap-6 p-6 rounded-[2rem] border-2 transition-all cursor-pointer group",
                    selectedQuestions.includes(q.id) 
                      ? "border-indigo-950 bg-slate-50/50 shadow-lg shadow-slate-100" 
                      : "border-slate-100 bg-white hover:border-slate-300"
                  )}
                >
                  <div className={cn(
                    "mt-1 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                    selectedQuestions.includes(q.id) ? "bg-indigo-950 border-indigo-950" : "border-slate-200 group-hover:border-slate-400"
                  )}>
                    {selectedQuestions.includes(q.id) && <Check className="text-white w-4 h-4" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={selectedQuestions.includes(q.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuestions([...selectedQuestions, q.id]);
                      } else {
                        setSelectedQuestions(selectedQuestions.filter(id => id !== q.id));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white border border-slate-100 text-slate-500">
                        {q.question_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-indigo-900 font-bold text-lg leading-snug">{q.question_text}</p>
                  </div>
                </motion.label>
                ))}
              </motion.div>
              {questions.length === 0 && (
                <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                  <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-indigo-950 mb-2">Bank Soal Kosong</h3>
                  <p className="text-slate-400 font-medium max-w-xs mx-auto">Anda perlu menambahkan soal ke Bank Soal terlebih dahulu sebelum membuat ujian.</p>
                  <button 
                    onClick={() => navigate('/bank-soal')}
                    className="mt-8 text-blue-600 font-bold hover:underline flex items-center gap-2 mx-auto"
                  >
                    Ke Bank Soal Sekarang <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date Picker Modal */}
      <AnimatePresence>
        {showDatePicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDatePicker(false)}
          >
            <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-indigo-950">Pilih Waktu Mulai</h3>
                <button 
                  onClick={() => setShowDatePicker(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => setPickerDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <span className="font-bold text-indigo-950">
                  {format(pickerDate, "MMMM yyyy", { locale: id })}
                </span>
                <button 
                  onClick={() => setPickerDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                  <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1 mb-6">
                {eachDayOfInterval({
                  start: startOfWeek(startOfMonth(pickerDate)),
                  end: endOfWeek(endOfMonth(pickerDate))
                }).map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, pickerDate);
                  const isSelected = formData.start_time && isSameDay(day, new Date(formData.start_time));
                  const isToday = isSameDay(day, new Date());
                  const isPast = day < new Date(new Date().setHours(0,0,0,0)) && !isToday;

                  return (
                    <button
                      key={idx}
                      onClick={() => !isPast && setPickerDate(day)}
                      disabled={isPast}
                      className={cn(
                        "p-2 rounded-xl text-sm font-medium transition-all relative",
                        !isCurrentMonth && "text-slate-200",
                        isCurrentMonth && !isPast && "text-slate-700 hover:bg-blue-50",
                        isPast && "text-slate-200 cursor-not-allowed",
                        isSelected && "bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white hover:brightness-110",
                        isToday && !isSelected && "bg-blue-50 text-blue-600 font-bold"
                      )}
                    >
                      {format(day, "d")}
                      {isToday && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Time Picker */}
              <div className="border-t border-slate-100 pt-4 mb-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">Pilih Waktu</label>
                <div className="flex items-center gap-3">
                  <select 
                    value={pickerTime.hours}
                    onChange={(e) => setPickerTime(prev => ({ ...prev, hours: parseInt(e.target.value) }))}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-center font-bold text-indigo-950 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span className="text-slate-400 font-bold">:</span>
                  <select 
                    value={pickerTime.minutes}
                    onChange={(e) => setPickerTime(prev => ({ ...prev, minutes: parseInt(e.target.value) }))}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-center font-bold text-indigo-950 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                  >
                    {[0, 15, 30, 45].map(m => (
                      <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setFormData(prev => ({ ...prev, start_time: '' }));
                    setShowDatePicker(false);
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Hapus
                </button>
                <button 
                  onClick={() => {
                    const selectedDate = new Date(pickerDate);
                    selectedDate.setHours(pickerTime.hours, pickerTime.minutes, 0, 0);
                    setFormData(prev => ({ ...prev, start_time: selectedDate.toISOString().slice(0, 16) }));
                    setShowDatePicker(false);
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-[#3B66F5] hover:bg-[#2563EB] transition-all shadow-lg shadow-[#3B66F5]/25"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
