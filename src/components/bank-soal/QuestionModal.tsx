import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Image as ImageIcon, 
  Check, 
  Plus, 
  Trash2, 
  Loader2 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../context/AlertContext';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  questionToEdit?: any | null;
  categories: any[];
  currentCategoryId?: string | null;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  questionToEdit,
  categories,
  currentCategoryId
}) => {
  const { showAlert } = useAlert();
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'pilihan_ganda',
    category_id: '',
    correct_answer: '',
    options: {
      A: { text: '', image_url: '' },
      B: { text: '', image_url: '' },
      C: { text: '', image_url: '' },
      D: { text: '', image_url: '' },
      E: { text: '', image_url: '' }
    },
    image_url: ''
  });

  const [matchingPairs, setMatchingPairs] = useState<{ id: string; left: string; right: string }[]>([
    { id: '1', left: '', right: '' },
    { id: '2', left: '', right: '' },
    { id: '3', left: '', right: '' },
  ]);

  const [optionImageFiles, setOptionImageFiles] = useState<Record<string, File | null>>({
    A: null, B: null, C: null, D: null, E: null
  });
  const [optionImagePreviews, setOptionImagePreviews] = useState<Record<string, string | null>>({
    A: null, B: null, C: null, D: null, E: null
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Initialize or reset form state when modal opens or question changes
  useEffect(() => {
    if (!isOpen) return;

    if (questionToEdit) {
      // Pre-fill editing data
      const q = questionToEdit;
      const initialFormData = {
        question_text: q.question_text || '',
        question_type: q.question_type || 'pilihan_ganda',
        category_id: q.category_id || '',
        correct_answer: q.correct_answer || '',
        image_url: q.image_url || '',
        options: {
          A: { text: '', image_url: '' },
          B: { text: '', image_url: '' },
          C: { text: '', image_url: '' },
          D: { text: '', image_url: '' },
          E: { text: '', image_url: '' }
        }
      };

      setImagePreview(q.image_url || null);
      setImageFile(null);
      setOptionImageFiles({ A: null, B: null, C: null, D: null, E: null });

      const newPreviews: Record<string, string | null> = { A: null, B: null, C: null, D: null, E: null };

      if (q.question_type === 'pilihan_ganda') {
        let optionsData = Array.isArray(q.question_options) && q.question_options.length > 0
          ? q.question_options
          : null;

        if (Array.isArray(optionsData)) {
          optionsData.forEach((opt: any) => {
            const label = String(opt?.option_label || '').trim().toUpperCase();
            if (['A', 'B', 'C', 'D', 'E'].includes(label)) {
              (initialFormData.options as any)[label] = {
                text: opt?.option_text || '',
                image_url: opt?.image_url || ''
              };
              newPreviews[label] = opt?.image_url || null;
            }
          });
        } else if (q.id) {
          // Fallback fetch if question_options was not preloaded
          supabase
            .from('question_options')
            .select('*')
            .eq('question_id', q.id)
            .then(({ data }) => {
              if (data && data.length > 0) {
                setFormData(prev => {
                  const updatedOptions = { ...prev.options };
                  const updatedPreviews: Record<string, string | null> = { A: null, B: null, C: null, D: null, E: null };
                  data.forEach((opt: any) => {
                    const label = String(opt?.option_label || '').trim().toUpperCase();
                    if (['A', 'B', 'C', 'D', 'E'].includes(label)) {
                      (updatedOptions as any)[label] = {
                        text: opt?.option_text || '',
                        image_url: opt?.image_url || ''
                      };
                      updatedPreviews[label] = opt?.image_url || null;
                    }
                  });
                  setOptionImagePreviews(updatedPreviews);
                  return { ...prev, options: updatedOptions };
                });
              }
            })
            .catch(err => console.warn('Could not fetch options:', err));
        }
      } else if (q.question_type === 'menjodohkan') {
        try {
          const parsed = JSON.parse(q.correct_answer || '[]');
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMatchingPairs(parsed);
          } else {
            setMatchingPairs([
              { id: '1', left: '', right: '' },
              { id: '2', left: '', right: '' },
              { id: '3', left: '', right: '' },
            ]);
          }
        } catch {
          setMatchingPairs([
            { id: '1', left: '', right: '' },
            { id: '2', left: '', right: '' },
            { id: '3', left: '', right: '' },
          ]);
        }
      }

      setOptionImagePreviews(newPreviews);
      setFormData(initialFormData);
    } else {
      // New question mode
      setFormData({
        question_text: '',
        question_type: 'pilihan_ganda',
        category_id: currentCategoryId || '',
        correct_answer: '',
        image_url: '',
        options: {
          A: { text: '', image_url: '' },
          B: { text: '', image_url: '' },
          C: { text: '', image_url: '' },
          D: { text: '', image_url: '' },
          E: { text: '', image_url: '' }
        }
      });
      setImageFile(null);
      setImagePreview(null);
      setOptionImageFiles({ A: null, B: null, C: null, D: null, E: null });
      setOptionImagePreviews({ A: null, B: null, C: null, D: null, E: null });
      setMatchingPairs([
        { id: '1', left: '', right: '' },
        { id: '2', left: '', right: '' },
        { id: '3', left: '', right: '' },
      ]);
    }
  }, [isOpen, questionToEdit, currentCategoryId]);

  const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.6): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert({
        title: 'File Terlalu Besar',
        message: 'Ukuran gambar maksimal adalah 5MB.',
        type: 'error'
      });
      return;
    }

    try {
      const compressed = await compressImage(file);
      setImageFile(compressed);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    } catch {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOptionImageChange = async (label: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert({
        title: 'File Terlalu Besar',
        message: 'Ukuran gambar maksimal adalah 5MB.',
        type: 'error'
      });
      return;
    }

    try {
      const compressed = await compressImage(file);
      setOptionImageFiles(prev => ({ ...prev, [label]: compressed }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setOptionImagePreviews(prev => ({ ...prev, [label]: reader.result as string }));
      };
      reader.readAsDataURL(compressed);
    } catch {
      setOptionImageFiles(prev => ({ ...prev, [label]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setOptionImagePreviews(prev => ({ ...prev, [label]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi autentikasi tidak ditemukan. Silakan login kembali.');

      let finalImageUrl = formData.image_url;

      // Upload main question image if new file selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('question-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('question-images')
          .getPublicUrl(fileName);
        
        finalImageUrl = publicUrl;
      }

      // Upload option images if selected
      const finalOptions = { ...formData.options };
      for (const label of ['A', 'B', 'C', 'D', 'E']) {
        const file = optionImageFiles[label];
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/options/${Date.now()}_${label}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('question-images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('question-images')
            .getPublicUrl(fileName);
          
          (finalOptions as any)[label].image_url = publicUrl;
        }
      }

      let finalCorrectAnswer = formData.correct_answer;
      if (formData.question_type === 'menjodohkan') {
        const validPairs = matchingPairs.filter(p => p.left.trim() || p.right.trim());
        if (validPairs.length === 0) {
          throw new Error('Minimal harus ada 1 pasangan premis dan jawaban untuk soal Menjodohkan.');
        }
        finalCorrectAnswer = JSON.stringify(validPairs);
      }

      const questionData = {
        teacher_id: user.id,
        school_id: null,
        question_text: formData.question_text,
        question_type: formData.question_type,
        correct_answer: finalCorrectAnswer,
        category_id: formData.category_id || null,
        image_url: finalImageUrl
      };

      if (questionToEdit?.id) {
        // Update question
        const { error: updateError } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', questionToEdit.id);

        if (updateError) throw updateError;

        if (formData.question_type === 'pilihan_ganda') {
          await supabase.from('question_options').delete().eq('question_id', questionToEdit.id);
          
          const optionsToInsert = Object.entries(finalOptions).map(([label, opt]: [string, any]) => ({
            question_id: questionToEdit.id,
            option_label: label,
            option_text: opt?.text?.trim() || `Pilihan ${label}`,
            image_url: opt?.image_url || null
          }));
          await supabase.from('question_options').insert(optionsToInsert);
        }

        showAlert({
          title: 'Berhasil',
          message: 'Soal berhasil diperbarui.',
          type: 'success'
        });
      } else {
        // Insert new question
        const { data: question, error: qError } = await supabase
          .from('questions')
          .insert([questionData])
          .select()
          .single();

        if (qError) throw qError;

        if (formData.question_type === 'pilihan_ganda') {
          const optionsToInsert = Object.entries(finalOptions).map(([label, opt]: [string, any]) => ({
            question_id: question.id,
            option_label: label,
            option_text: opt?.text?.trim() || `Pilihan ${label}`,
            image_url: opt?.image_url || null
          }));

          await supabase.from('question_options').insert(optionsToInsert);
        }

        showAlert({
          title: 'Berhasil',
          message: 'Soal baru berhasil ditambahkan.',
          type: 'success'
        });
      }

      onClose();
      onSuccess();
    } catch (error: any) {
      console.error('Error saving question:', error);
      showAlert({
        title: 'Gagal Menyimpan',
        message: error.message || 'Terjadi kesalahan saat menyimpan soal. Pastikan semua field terisi.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          {/* Pure Dark Backdrop without heavy backdrop-filter blur for 60fps smoothness */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 z-10"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#1D4ED8]">
                  {questionToEdit ? 'Edit Soal' : 'Tambah Soal Baru'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Lengkapi detail pertanyaan di bawah ini secara lengkap.
                </p>
              </div>
              <button 
                type="button"
                onClick={onClose} 
                className="p-2.5 hover:bg-slate-50 rounded-full transition-colors cursor-pointer border border-slate-200 bg-white shadow-sm"
              >
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSave} className="p-6 sm:p-8 overflow-y-auto space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Tipe Pertanyaan</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm sm:text-base text-slate-700 cursor-pointer"
                    value={formData.question_type}
                    onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                  >
                    <option value="pilihan_ganda">Pilihan Ganda</option>
                    <option value="menjodohkan">Menjodohkan / Sambung Kata (TKA Drag & Drop)</option>
                    <option value="essay">Essay / Uraian</option>
                    <option value="isian_singkat">Isian Singkat</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Pilih Folder</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm sm:text-base text-slate-700 cursor-pointer"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Tanpa Folder</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parent_id ? '　 ' : ''}📂 {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lampiran Gambar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-bold text-slate-700">Lampiran Gambar (Opsional)</label>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Max 5MB (Kompres Otomatis)</span>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="relative group/img w-28 h-28 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all hover:border-blue-400 shrink-0">
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                        <button 
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, image_url: '' }));
                          }}
                          className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-1.5 text-slate-400 hover:text-[#3B66F5] transition-colors w-full h-full justify-center">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-xs font-bold">Pilih Gambar</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 pt-1">
                    <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                      Gunakan gambar untuk visualisasi pertanyaan. Pastikan gambar jelas, beresolusi baik, dan proporsional.
                    </p>
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('modal-image-upload')?.click()}
                      className="text-xs sm:text-sm font-bold text-[#3B66F5] hover:underline cursor-pointer"
                    >
                      Ganti Gambar
                    </button>
                    <input id="modal-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                </div>
              </div>

              {/* Isi Pertanyaan */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Isi Pertanyaan</label>
                <textarea 
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base font-medium text-slate-700"
                  placeholder="Tuliskan pertanyaan Anda secara lengkap di sini..."
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                />
              </div>

              {/* Pilihan Ganda Options */}
              {formData.question_type === 'pilihan_ganda' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-sm font-bold text-slate-700">Opsi Jawaban</label>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pilih Jawaban Benar</span>
                  </div>
                  <div className="space-y-3.5">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map((label) => (
                      <div key={label} className="space-y-3.5 p-5 rounded-2xl border border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-4 group">
                          <div className={cn(
                            "w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm transition-all shrink-0",
                            formData.correct_answer === label ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-200 text-slate-500"
                          )}>
                            {label}
                          </div>
                          <input 
                            type="text" 
                            required
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base font-medium text-slate-700"
                            placeholder={`Teks opsi ${label}`}
                            value={(formData.options as any)?.[label]?.text || ''}
                            onChange={(e) => setFormData({
                              ...formData, 
                              options: { 
                                ...formData.options, 
                                [label]: { ...((formData.options as any)?.[label] || {}), text: e.target.value }
                              }
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, correct_answer: label })}
                            className={cn(
                              "w-5 h-5 rounded-full border transition-all flex items-center justify-center shrink-0 cursor-pointer bg-white",
                              formData.correct_answer === label ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 hover:border-blue-500"
                            )}
                          >
                            {formData.correct_answer === label && <Check className="w-3 h-3 text-white stroke-[3]" />}
                          </button>
                        </div>
                        
                        {/* Option Image Upload */}
                        <div className="flex items-center gap-4 ml-14">
                          <div className="relative group/optimg w-14 h-14 bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden transition-all hover:border-blue-300">
                            {optionImagePreviews[label] ? (
                              <>
                                <img src={optionImagePreviews[label]!} className="w-full h-full object-cover" alt="Preview" />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setOptionImageFiles(prev => ({ ...prev, [label]: null }));
                                    setOptionImagePreviews(prev => ({ ...prev, [label]: null }));
                                    setFormData(prev => ({
                                      ...prev,
                                      options: {
                                        ...prev.options,
                                        [label]: { ...((prev.options as any)?.[label] || {}), image_url: '' }
                                      }
                                    }));
                                  }}
                                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/optimg:opacity-100 transition-opacity cursor-pointer"
                                >
                                  <X className="w-4 h-4 text-white" />
                                </button>
                              </>
                            ) : (
                              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-slate-300 hover:text-[#3B66F5] transition-colors">
                                <ImageIcon className="w-5 h-5" />
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleOptionImageChange(label, e)} />
                              </label>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-slate-400 font-medium">Gambar opsional opsi {label}</p>
                            {!optionImagePreviews[label] && (
                              <button 
                                type="button" 
                                onClick={() => (document.getElementById(`modal-opt-img-${label}`) as HTMLInputElement)?.click()}
                                className="text-xs font-bold text-[#3B66F5] hover:underline cursor-pointer"
                              >
                                Upload Gambar
                              </button>
                            )}
                            <input id={`modal-opt-img-${label}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleOptionImageChange(label, e)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Menjodohkan Pairs */}
              {formData.question_type === 'menjodohkan' && (
                <div className="space-y-4 p-6 rounded-2xl border border-indigo-100 bg-indigo-50/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-indigo-950">Pasangan Menjodohkan (TKA)</h4>
                      <p className="text-xs text-slate-500 font-medium">Tuliskan pasangan Kolom Kiri (Premis) dan Kolom Kanan (Jawaban Benar).</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMatchingPairs(prev => [...prev, { id: Date.now().toString(), left: '', right: '' }])}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Pasangan
                    </button>
                  </div>

                  <div className="space-y-3">
                    {matchingPairs.map((pair, idx) => (
                      <div key={pair.id || idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <input
                            type="text"
                            required
                            placeholder={`Pernyataan / Premis Kiri ${idx + 1}`}
                            value={pair.left}
                            onChange={(e) => {
                              const newPairs = [...matchingPairs];
                              newPairs[idx].left = e.target.value;
                              setMatchingPairs(newPairs);
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-indigo-500"
                          />
                        </div>
                        <span className="text-indigo-400 font-bold text-sm">➔</span>
                        <div className="flex-1">
                          <input
                            type="text"
                            required
                            placeholder={`Pasangan Benar Kanan ${idx + 1}`}
                            value={pair.right}
                            onChange={(e) => {
                              const newPairs = [...matchingPairs];
                              newPairs[idx].right = e.target.value;
                              setMatchingPairs(newPairs);
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-indigo-500"
                          />
                        </div>
                        {matchingPairs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setMatchingPairs(prev => prev.filter((_, i) => i !== idx))}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                            title="Hapus Pasangan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Essay Guidelines */}
              {formData.question_type === 'essay' && (
                <div className="space-y-2 p-5 rounded-2xl border border-amber-200/80 bg-amber-50/40">
                  <label className="text-sm font-bold text-amber-950 ml-1">Pedoman / Kunci Jawaban Essay (Opsional)</label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-medium text-slate-700"
                    placeholder="Masukkan kata kunci atau penjelasan jawaban yang diharapkan sebagai acuan penilaian guru..."
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                  />
                  <p className="text-[11px] text-amber-800 font-medium">Soal essay akan dinilai oleh guru saat memeriksa hasil ujian siswa.</p>
                </div>
              )}

              {/* Isian Singkat Answer */}
              {formData.question_type === 'isian_singkat' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Jawaban Benar</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base font-medium text-slate-700"
                    placeholder="Masukkan jawaban yang benar..."
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button 
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-full font-bold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer button-hover disabled:opacity-50"
                >
                  Batalkan
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-full font-bold text-sm text-white bg-[#3B66F5] hover:bg-[#2563EB] transition-all shadow-lg shadow-[#3B66F5]/25 cursor-pointer button-hover flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Pertanyaan'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default QuestionModal;
