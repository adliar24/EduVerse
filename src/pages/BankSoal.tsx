import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3,
  BookOpen,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  HelpCircle,
  FileText,
  Download,
  Upload,
  FolderIcon,
  FolderPlus,
  ChevronDown,
  ChevronLeft,
  FolderOpen,
  FolderInput,
  CheckSquare,
  Square,
  Image as ImageIcon,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useRef } from 'react';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import { useAlert } from '../context/AlertContext';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { saveAs } from 'file-saver';
import { useSchool } from '../context/SchoolContext';

export default function BankSoal() {
  useDocumentTitle('Bank Soal');
  const { activeSchool } = useSchool();
  const [questions, setQuestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<any>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [movingToCategoryId, setMovingToCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQuestionIds, setEditingQuestionIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, currentCategoryId]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const importDropdownRef = useRef<HTMLDivElement>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setShowTemplateDropdown(false);
      }
      if (importDropdownRef.current && !importDropdownRef.current.contains(event.target as Node)) {
        setShowImportDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const [optionImageFiles, setOptionImageFiles] = useState<Record<string, File | null>>({
    A: null, B: null, C: null, D: null, E: null
  });
  const [optionImagePreviews, setOptionImagePreviews] = useState<Record<string, string | null>>({
    A: null, B: null, C: null, D: null, E: null
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [currentCategoryId]);

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
      console.error('Error fetching categories:', error);
    }
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase.from('questions')
        .select('id, question_text, question_type, correct_answer, category_id, image_url, created_at')
        .eq('teacher_id', user.id);
      
      if (currentCategoryId) {
        query = query.eq('category_id', currentCategoryId);
      }

      const { data: qData } = await query.order('created_at', { ascending: false });
      setQuestions(qData || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let finalImageUrl = formData.image_url;

      // Handle Image Upload if there's a new file
      if (imageFile) {
        setUploadingImage(true);
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
        setUploadingImage(false);
      }

      // Handle Option Image Uploads
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
          
          finalOptions[label as keyof typeof finalOptions].image_url = publicUrl;
        }
      }

      const questionData = {
        teacher_id: user.id,
        school_id: null,
        question_text: formData.question_text,
        question_type: formData.question_type,
        correct_answer: formData.correct_answer,
        category_id: formData.category_id || null,
        image_url: finalImageUrl
      };

      if (editingId) {
        // Update Soal
        const { error: updateError } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingId);

        if (updateError) throw updateError;

        if (formData.question_type === 'pilihan_ganda') {
          // Hapus opsi lama, lalu insert baru (cara paling gampang)
          await supabase.from('question_options').delete().eq('question_id', editingId);
          
          const optionsToInsert = Object.entries(finalOptions).map(([label, opt]: [string, any]) => ({
            question_id: editingId,
            option_label: label,
            option_text: opt.text,
            image_url: opt.image_url
          }));
          await supabase.from('question_options').insert(optionsToInsert);
        }
        showAlert({
          title: 'Berhasil',
          message: 'Soal berhasil diperbarui.',
          type: 'success'
        });
      } else {
        // Tambah Soal Baru
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
            option_text: opt.text,
            image_url: opt.image_url
          }));

          await supabase.from('question_options').insert(optionsToInsert);
        }
        showAlert({
          title: 'Berhasil',
          message: 'Soal baru berhasil ditambahkan.',
          type: 'success'
        });
      }

      closeModal();
      fetchData();
    } catch (error: any) {
      console.error('Error saving question:', error);
      showAlert({
        title: 'Gagal Menyimpan',
        message: error.message || 'Terjadi kesalahan saat menyimpan soal. Pastikan koneksi internet stabil dan semua field terisi.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (question: any) => {
    setEditingQuestionIds(prev => [...prev, question.id]);
    
    try {
      setEditingId(question.id);
      
      let newFormData = {
        question_text: question.question_text,
        question_type: question.question_type,
        category_id: question.category_id || '',
        correct_answer: question.correct_answer || '',
        image_url: question.image_url || '',
        options: { 
          A: { text: '', image_url: '' }, 
          B: { text: '', image_url: '' }, 
          C: { text: '', image_url: '' }, 
          D: { text: '', image_url: '' }, 
          E: { text: '', image_url: '' } 
        }
      };
      
      setImagePreview(question.image_url || null);
      setImageFile(null);
      setOptionImageFiles({ A: null, B: null, C: null, D: null, E: null });
      const newOptionPreviews: Record<string, string | null> = { A: null, B: null, C: null, D: null, E: null };

      if (question.question_type === 'pilihan_ganda') {
        const { data: optionsData } = await supabase
          .from('question_options')
          .select('*')
          .eq('question_id', question.id);

        if (optionsData) {
          optionsData.forEach(opt => {
            if (['A','B','C','D','E'].includes(opt.option_label)) {
              (newFormData.options as any)[opt.option_label] = {
                text: opt.option_text,
                image_url: opt.image_url || ''
              };
              newOptionPreviews[opt.option_label] = opt.image_url || null;
            }
          });
        }
      }
      
      setOptionImagePreviews(newOptionPreviews);
      setFormData(newFormData as any);
      setShowAddForm(true);
    } finally {
      setEditingQuestionIds(prev => prev.filter(id => id !== question.id));
    }
  };

  const handleDelete = async (id: string) => {
    showAlert({
      title: 'Hapus Soal?',
      message: 'Apakah Anda yakin ingin menghapus soal ini dari bank soal?',
      type: 'confirm',
      confirmText: 'Ya, Hapus',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('questions').delete().eq('id', id);
          if (error) throw error;
          fetchData();
          showAlert({
            title: 'Terhapus',
            message: 'Soal berhasil dihapus.',
            type: 'success'
          });
        } catch (error) {
          console.error('Error deleting question:', error);
          showAlert({
            title: 'Gagal',
            message: 'Gagal menghapus soal.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedQuestionIds.length === 0) return;
    
    showAlert({
      title: 'Hapus Soal Terpilih?',
      message: `Apakah Anda yakin ingin menghapus ${selectedQuestionIds.length} soal terpilih dari bank soal secara permanen?`,
      type: 'confirm',
      confirmText: 'Ya, Hapus Semua',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('questions')
            .delete()
            .in('id', selectedQuestionIds);
          
          if (error) throw error;
          
          showAlert({
            title: 'Terhapus',
            message: `${selectedQuestionIds.length} soal berhasil dihapus.`,
            type: 'success'
          });
          
          setSelectedQuestionIds([]);
          fetchData();
        } catch (error: any) {
          console.error('Error deleting questions:', error);
          showAlert({
            title: 'Gagal',
            message: 'Gagal menghapus soal terpilih.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleMoveQuestions = async () => {
    if (selectedQuestionIds.length === 0) return;
    
    try {
      const { error } = await supabase
        .from('questions')
        .update({ category_id: movingToCategoryId || null })
        .in('id', selectedQuestionIds);

      if (error) throw error;

      showAlert({
        title: 'Berhasil',
        message: `${selectedQuestionIds.length} soal berhasil dipindahkan.`,
        type: 'success'
      });
      
      setSelectedQuestionIds([]);
      setShowMoveModal(false);
      fetchData();
    } catch (error) {
      console.error('Error moving questions:', error);
      showAlert({
        title: 'Gagal',
        message: 'Gagal memindahkan soal.',
        type: 'error'
      });
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const folderName = (e.target as any).folderName.value;
      if (!folderName) return;

      const { error } = await supabase
        .from('categories')
        .insert([{
          name: folderName,
          teacher_id: user.id,
          parent_id: currentCategoryId,
          school_id: null
        }]);

      if (error) throw error;

      showAlert({
        title: 'Berhasil',
        message: 'Folder baru berhasil dibuat.',
        type: 'success'
      });
      setShowFolderForm(false);
      fetchCategories();
    } catch (error) {
      console.error('Error creating folder:', error);
      showAlert({
        title: 'Gagal',
        message: 'Gagal membuat folder.',
        type: 'error'
      });
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    
    try {
      const hasChildren = categories.some(c => c.parent_id === folderToDelete.id);
      const questionsInFolder = questions.some(q => q.category_id === folderToDelete.id);
      
      if (questionsInFolder) {
        showAlert({
          title: 'Tidak Bisa Dihapus',
          message: 'Folder masih memiliki soal di dalamnya. Pindahkan atau hapus soal terlebih dahulu.',
          type: 'warning'
        });
        setShowDeleteFolderModal(false);
        return;
      }
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', folderToDelete.id);
      
      if (error) throw error;
      
      if (currentCategoryId === folderToDelete.id) {
        setCurrentCategoryId(folderToDelete.parent_id || null);
      }
      
      showAlert({
        title: 'Berhasil',
        message: `Folder "${folderToDelete.name}" berhasil dihapus.`,
        type: 'success'
      });
      fetchCategories();
    } catch (error) {
      console.error('Error deleting folder:', error);
      showAlert({
        title: 'Gagal',
        message: 'Gagal menghapus folder.',
        type: 'error'
      });
    } finally {
      setShowDeleteFolderModal(false);
      setFolderToDelete(null);
    }
  };

  const openDeleteFolderModal = (folder: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderToDelete(folder);
    setShowDeleteFolderModal(true);
  };

  const closeModal = () => {
    setShowAddForm(false);
    setShowFolderForm(false);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
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
    setOptionImageFiles({ A: null, B: null, C: null, D: null, E: null });
    setOptionImagePreviews({ A: null, B: null, C: null, D: null, E: null });
  };

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

  const handleOptionImageChange = async (label: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
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
    } catch (err) {
      console.error('Error compressing option image:', err);
      // Fallback
      setOptionImageFiles(prev => ({ ...prev, [label]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setOptionImagePreviews(prev => ({ ...prev, [label]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
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
    } catch (err) {
      console.error('Error compressing image:', err);
      // Fallback
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getBreadcrumbs = () => {
    const crumbs = [];
    let current = categories.find(c => c.id === currentCategoryId);
    while (current) {
      crumbs.unshift(current);
      current = categories.find(c => c.id === current.parent_id);
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const currentCategory = categories.find(c => c.id === currentCategoryId);
  const subCategories = categories.filter(c => c.parent_id === currentCategoryId);

  const filteredQuestions = useMemo(() => 
    questions.filter(q => 
      q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
    ), [questions, searchTerm]
  );

  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);

  const handleDownloadTemplate = () => {
    const template = [
      {
        'Mata Pelajaran': 'Matematika',
        'Materi': 'Pecahan',
        'Pertanyaan': 'Hasil dari 1/2 + 1/4 adalah...',
        'Tipe': 'pilihan_ganda',
        'Jawaban Benar': 'A',
        'Opsi A': '3/4',
        'Opsi B': '1/4',
        'Opsi C': '2/4',
        'Opsi D': '1/6',
        'Opsi E': '3/6',
      },
      {
        'Mata Pelajaran': 'Bahasa Indonesia',
        'Materi': 'Pantun',
        'Pertanyaan': 'Sebutkan ciri-ciri pantun!',
        'Tipe': 'isian_singkat',
        'Jawaban Benar': 'Bersajak a-b-a-b, terdiri dari sampiran dan isi',
        'Opsi A': '',
        'Opsi B': '',
        'Opsi C': '',
        'Opsi D': '',
        'Opsi E': '',
      },
      {
        'Mata Pelajaran': 'IPA',
        'Materi': 'Ekosistem',
        'Pertanyaan': 'Contoh hewan pemakan segalanya (omnivora) adalah...',
        'Tipe': 'pilihan_ganda',
        'Jawaban Benar': 'D',
        'Opsi A': 'Harimau',
        'Opsi B': 'Sapi',
        'Opsi C': 'Kambing',
        'Opsi D': 'Ayam',
        'Opsi E': 'Zebra',
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template Soal");
    
    // Set column widths
    const maxWidths = [
      { wch: 25 }, // Mata Pelajaran
      { wch: 25 }, // Materi
      { wch: 50 }, // Pertanyaan
      { wch: 15 }, // Tipe
      { wch: 15 }, // Jawaban Benar
      { wch: 25 }, // Opsi A
      { wch: 25 }, // Opsi B
      { wch: 25 }, // Opsi C
      { wch: 25 }, // Opsi D
      { wch: 25 }, // Opsi E
    ];
    worksheet['!cols'] = maxWidths;

    XLSX.writeFile(workbook, "Template_Soal_EduTest.xlsx");
    showAlert({
      title: 'Berhasil!',
      message: 'Template soal berhasil diunduh.',
      type: 'success'
    });
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not found');

        if (!event.target?.result) {
          throw new Error('Gagal membaca file. Silakan coba lagi.');
        }

        const arrayBuffer = event.target.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        
        if (rawData.length < 2) {
          throw new Error('File tidak memiliki data. Pastikan ada header dan minimal 1 baris data.');
        }
        
        const headers = rawData[0].map((h: any) => String(h || '').trim());
        
        const subjectIdx = headers.findIndex(h => h === 'Mata Pelajaran');
        const topicIdx = headers.findIndex(h => h === 'Materi');
        const questionIdx = headers.findIndex(h => h === 'Pertanyaan');
        const typeIdx = headers.findIndex(h => h === 'Tipe');
        const answerIdx = headers.findIndex(h => h === 'Jawaban Benar');
        const optAIdx = headers.findIndex(h => h === 'Opsi A');
        const optBIdx = headers.findIndex(h => h === 'Opsi B');
        const optCIdx = headers.findIndex(h => h === 'Opsi C');
        const optDIdx = headers.findIndex(h => h === 'Opsi D');
        const optEIdx = headers.findIndex(h => h === 'Opsi E');
        
        if (questionIdx === -1) {
          throw new Error('Kolom "Pertanyaan" tidak ditemukan. Pastikan file sesuai dengan template.');
        }

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        let errorMessages: string[] = [];

        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          const questionText = String(row[questionIdx] || '').trim();
          
          if (!questionText) {
            const hasData = row.some(cell => cell !== null && cell !== undefined && cell !== '');
            if (hasData) skippedCount++;
            continue;
          }
          
          try {
            const subjectName = subjectIdx !== -1 ? String(row[subjectIdx] || '').trim() : '';
            const topicName = topicIdx !== -1 ? String(row[topicIdx] || '').trim() : '';
            const rawType = typeIdx !== -1 ? String(row[typeIdx] || '').trim().toLowerCase() : '';
            
            // Check if options are filled - if yes, treat as pilihan_ganda regardless of Tipe column
            const optA = optAIdx !== -1 ? String(row[optAIdx] || '').trim() : '';
            const optB = optBIdx !== -1 ? String(row[optBIdx] || '').trim() : '';
            const hasOptions = optA !== '' || optB !== '';
            
            // Determine question type
            let questionType = 'pilihan_ganda';
            if (rawType === 'isian_singkat' || rawType === 'essay' || rawType === 'short_answer') {
              questionType = 'isian_singkat';
            }
            
            const correctAnswer = answerIdx !== -1 ? String(row[answerIdx] || '').trim() : '';

            let finalCategoryId: string | null = null;

            if (subjectName) {
              const { data: subjectCat, error: catError } = await supabase
                .from('categories')
                .select('id')
                .eq('teacher_id', user.id)
                .eq('name', subjectName)
                .is('parent_id', null)
                .maybeSingle();

              if (catError) {
                console.error('Error finding subject:', catError);
              }

              let subjectId = subjectCat?.id;

              if (!subjectId) {
                const { data: newSubject, error: newSubjError } = await supabase
                  .from('categories')
                  .insert([{ 
                    name: subjectName, 
                    teacher_id: user.id,
                    school_id: null
                  }])
                  .select()
                  .single();
                if (newSubjError) {
                  console.error('Error creating subject:', newSubjError);
                }
                subjectId = newSubject?.id;
              }

              if (subjectId) {
                finalCategoryId = subjectId;
                if (topicName) {
                  const { data: topicCat } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('teacher_id', user.id)
                    .eq('name', topicName)
                    .eq('parent_id', subjectId)
                    .maybeSingle();

                  let topicId = topicCat?.id;

                  if (!topicId) {
                    const { data: newTopic, error: newTopicError } = await supabase
                      .from('categories')
                      .insert([{ 
                        name: topicName, 
                        teacher_id: user.id, 
                        parent_id: subjectId,
                        school_id: null
                      }])
                      .select()
                      .single();
                    if (newTopicError) {
                      console.error('Error creating topic:', newTopicError);
                    }
                    topicId = newTopic?.id;
                  }
                  if (topicId) finalCategoryId = topicId;
                }
              }
            }

            const { data: question, error: qError } = await supabase
              .from('questions')
              .insert([{
                teacher_id: user.id,
                school_id: null,
                question_text: questionText,
                question_type: questionType,
                correct_answer: questionType === 'pilihan_ganda' ? (correctAnswer.toUpperCase() || null) : (correctAnswer || null),
                category_id: finalCategoryId
              }])
              .select()
              .single();

            if (qError) {
              console.error('Error inserting question:', qError);
              errorMessages.push(`Baris ${i + 1}: ${qError.message}`);
              continue;
            }

            if (hasOptions && question) {
              const options = [
                { label: 'A', text: optA },
                { label: 'B', text: optB },
                { label: 'C', text: optCIdx !== -1 ? String(row[optCIdx] || '').trim() : '' },
                { label: 'D', text: optDIdx !== -1 ? String(row[optDIdx] || '').trim() : '' },
                { label: 'E', text: optEIdx !== -1 ? String(row[optEIdx] || '').trim() : '' },
              ].filter(opt => opt.text !== '');

              if (options.length > 0) {
                const optionsToInsert = options.map(opt => ({
                  question_id: question.id,
                  option_label: opt.label,
                  option_text: String(opt.text).trim()
                }));
                const { error: optError } = await supabase.from('question_options').insert(optionsToInsert);
                if (optError) {
                  console.error('Error inserting options:', optError);
                }
              }
            }
            successCount++;
          } catch (err: any) {
            console.error('Error importing row:', i + 1, err);
            errorMessages.push(`Baris ${i + 1}: ${err.message}`);
            errorCount++;
          }
        }

        let message = `${successCount} soal berhasil diimpor.`;
        if (skippedCount > 0) message += ` ${skippedCount} baris kosong dilewati.`;
        if (errorMessages.length > 0) {
          message += ` ${errorMessages.length} gagal. Cek console untuk detail.`;
          console.error('Import errors:', errorMessages);
        }
        
        showAlert({
          title: 'Impor Selesai',
          message: message.slice(0, 500),
          type: successCount > 0 ? 'success' : 'warning'
        });
        fetchData();
        fetchCategories();
      } catch (error: any) {
        console.error('Error in import process:', error);
        showAlert({
          title: 'Gagal',
          message: error.message || 'Gagal mengimpor file Excel.',
          type: 'error'
        });
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDownloadDocxTemplate = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "TEMPLATE IMPORT SOAL EDUTEST", bold: true, size: 40 }), // 20pt
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "PANDUAN FORMAT SOAL", bold: true, size: 28, underline: {} })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "1. Gunakan penomoran (1. 2. 3.) untuk setiap pertanyaan.", size: 24 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "2. Gunakan huruf (A. B. C. D. E.) untuk pilihan jawaban.", size: 24 }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "3. Tuliskan kunci jawaban dengan format 'Jawaban: [Kunci]'.", size: 24 }),
            ],
            spacing: { after: 400 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "CONTOH SOAL PILIHAN GANDA:", bold: true, size: 28, color: "2B6CB0" })],
            spacing: { after: 200 },
          }),
          new Paragraph({ children: [new TextRun({ text: "1. Apa ibukota negara Indonesia saat ini?", size: 24 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "A. Jakarta", size: 24 })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: "B. Nusantara", size: 24 })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: "C. Bandung", size: 24 })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: "D. Surabaya", size: 24 })], spacing: { after: 50 } }),
          new Paragraph({ children: [new TextRun({ text: "E. Medan", size: 24 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Jawaban: B", bold: true, size: 24, color: "38A169" })], spacing: { after: 400 } }),

          new Paragraph({
            children: [new TextRun({ text: "CONTOH SOAL ISIAN SINGKAT:", bold: true, size: 28, color: "2B6CB0" })],
            spacing: { after: 200 },
          }),
          new Paragraph({ children: [new TextRun({ text: "2. Siapa presiden pertama Republik Indonesia?", size: 24 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "Jawaban: Soekarno", bold: true, size: 24, color: "38A169" })], spacing: { after: 400 } }),

          new Paragraph({
            children: [new TextRun({ text: "Catatan: Jangan mengubah format titik (.) setelah nomor atau huruf agar sistem dapat membaca soal dengan benar.", italics: true, color: "E53E3E", size: 20 })],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Template_Soal_EduTest.docx");
    showAlert({ title: 'Berhasil', message: 'Template Word berhasil diunduh.', type: 'success' });
  };

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;

        // Simple Parser Logic
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const parsedQuestions: any[] = [];
        let currentQuestion: any = null;

        lines.forEach(line => {
          // Detect New Question (Starts with number followed by . or ))
          const qMatch = line.match(/^(\d+)[\.\)]\s*(.*)/);
          if (qMatch) {
            if (currentQuestion) parsedQuestions.push(currentQuestion);
            currentQuestion = {
              question_text: qMatch[2],
              question_type: 'isian_singkat',
              options: {},
              correct_answer: ''
            };
            return;
          }

          if (!currentQuestion) return;

          // Detect Options (A. B. C. D. E.)
          const optMatch = line.match(/^([A-E])[\.\)]\s*(.*)/i);
          if (optMatch) {
            currentQuestion.question_type = 'pilihan_ganda';
            const label = optMatch[1].toUpperCase();
            currentQuestion.options[label] = optMatch[2];
            return;
          }

          // Detect Answer
          const ansMatch = line.match(/^(Jawaban|Kunci|Ans|Answer):\s*(.*)/i);
          if (ansMatch) {
            currentQuestion.correct_answer = ansMatch[2].trim();
            return;
          }

          // Append to question text if it's a multiline question
          if (currentQuestion && !line.match(/^[A-E][\.\)]/i)) {
             currentQuestion.question_text += ' ' + line;
          }
        });

        if (currentQuestion) parsedQuestions.push(currentQuestion);

        if (parsedQuestions.length === 0) throw new Error("Format tidak dikenali. Gunakan template yang disediakan.");

        // Upload to Database
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found");

        let successCount = 0;
        for (const q of parsedQuestions) {
          const { data: question, error: qError } = await supabase
            .from('questions')
            .insert([{
              teacher_id: user.id,
              school_id: null,
              question_text: q.question_text,
              question_type: q.question_type,
              correct_answer: q.question_type === 'pilihan_ganda' ? (q.correct_answer?.toUpperCase() || null) : (q.correct_answer || null),
              category_id: currentCategoryId
            }])
            .select().single();
          
          if (qError) continue;

          if (q.question_type === 'pilihan_ganda' && question) {
            const opts = Object.entries(q.options).map(([label, text]) => ({
              question_id: question.id,
              option_label: label,
              option_text: text
            }));
            await supabase.from('question_options').insert(opts);
          }
          successCount++;
        }

        showAlert({ title: 'Impor Selesai', message: `${successCount} soal berhasil diimpor dari Word.`, type: 'success' });
        fetchData();
        fetchCategories();
      } catch (err: any) {
        showAlert({ title: 'Gagal', message: err.message, type: 'error' });
      } finally {
        setImporting(false);
        if (docxInputRef.current) docxInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-indigo-950 tracking-tight">Bank Soal</h2>
          <p className="text-slate-500 font-medium text-sm sm:text-base">Kelola dan organisir koleksi pertanyaan ujian Anda.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportExcel} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
          <input 
            type="file" 
            ref={docxInputRef} 
            onChange={handleImportDocx} 
            accept=".docx" 
            className="hidden" 
          />
          <div className="relative" ref={templateDropdownRef}>
            <button 
              onClick={() => {
                setShowTemplateDropdown(!showTemplateDropdown);
                setShowImportDropdown(false);
              }}
              className="bg-white text-indigo-900 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-slate-50"
            >
              <Download className="w-4 h-4" />
              Templat
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className={cn(
              "absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 transition-all z-50 overflow-hidden opacity-0 invisible",
              showTemplateDropdown && "opacity-100 visible"
            )}>
               <button 
                 onClick={() => {
                   handleDownloadTemplate();
                   setShowTemplateDropdown(false);
                 }}
                 className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-950 flex items-center gap-3"
               >
                 <Download className="w-4 h-4 text-emerald-500" />
                 Excel Template
               </button>
               <button 
                 onClick={() => {
                   handleDownloadDocxTemplate();
                   setShowTemplateDropdown(false);
                 }}
                 className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-950 flex items-center gap-3 border-t border-slate-50"
               >
                 <FileText className="w-4 h-4 text-blue-500" />
                 Word Template
               </button>
            </div>
          </div>

          <div className="relative" ref={importDropdownRef}>
            <button 
              onClick={() => {
                setShowImportDropdown(!showImportDropdown);
                setShowTemplateDropdown(false);
              }}
              className="bg-white text-indigo-900 border border-slate-200 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Mengimpor...' : 'Impor'}
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className={cn(
              "absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 transition-all z-50 overflow-hidden opacity-0 invisible",
              showImportDropdown && "opacity-100 visible"
            )}>
               <button 
                 onClick={() => {
                   fileInputRef.current?.click();
                   setShowImportDropdown(false);
                 }}
                 className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-950 flex items-center gap-3"
               >
                 <Upload className="w-4 h-4 text-emerald-500" />
                 Impor Excel
               </button>
               <button 
                 onClick={() => {
                    docxInputRef.current?.click();
                    setShowImportDropdown(false);
                 }}
                 className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-950 flex items-center gap-3 border-t border-slate-50"
               >
                 <FileText className="w-4 h-4 text-blue-500" />
                 Impor Word
               </button>
            </div>
          </div>

          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-950 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-200/50 transition-all hover:bg-indigo-900 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Tambah Baru
          </button>
        </div>
      </div>

      {/* Folder Selector & Actions */}
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <FolderIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select 
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-950/10 transition-all font-medium text-sm text-indigo-950 appearance-none cursor-pointer"
                value={currentCategoryId || ''}
                onChange={(e) => setCurrentCategoryId(e.target.value || null)}
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
                onClick={() => setShowFolderForm(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Tambah Folder Baru"
              >
                <FolderPlus className="w-4 h-4" /> Folder Baru
              </button>
              {currentCategoryId && (
                <button 
                  onClick={(e) => openDeleteFolderModal(categories.find(c => c.id === currentCategoryId), e)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Hapus Folder Aktif"
                >
                  <Trash2 className="w-4 h-4" /> Hapus Folder
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content - Breadcrumbs, Search, and Question List */}
      <div className="space-y-8">
          {/* Breadcrumbs & Navigation */}
          <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
            <button 
              onClick={() => setCurrentCategoryId(null)}
              className="text-slate-400 hover:text-indigo-950 transition-colors"
            >
              Semua Soal
            </button>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <button 
                  onClick={() => setCurrentCategoryId(crumb.id)}
                  className={cn(
                    "transition-colors",
                    idx === breadcrumbs.length - 1 ? "text-indigo-950" : "text-slate-400 hover:text-indigo-950"
                  )}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder={currentCategory ? `Cari di ${currentCategory.name}...` : "Cari berdasarkan teks pertanyaan..."}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Select All / Bulk Actions Indicator */}
          {filteredQuestions.length > 0 && (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3.5">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    const allVisibleIds = filteredQuestions.map(q => q.id);
                    const areAllSelected = allVisibleIds.every(id => selectedQuestionIds.includes(id));
                    if (areAllSelected) {
                      // Deselect all
                      setSelectedQuestionIds([]);
                    } else {
                      // Select all
                      setSelectedQuestionIds(allVisibleIds);
                    }
                  }}
                  className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-indigo-950 transition-colors"
                >
                  <div className={cn(
                    "w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
                    filteredQuestions.length > 0 && filteredQuestions.every(q => selectedQuestionIds.includes(q.id))
                      ? "bg-indigo-950 border-indigo-950 text-white"
                      : "border-slate-300 bg-white"
                  )}>
                    {filteredQuestions.length > 0 && filteredQuestions.every(q => selectedQuestionIds.includes(q.id)) && (
                      <Check className="w-4 h-4 stroke-[3]" />
                    )}
                  </div>
                  {filteredQuestions.length > 0 && filteredQuestions.every(q => selectedQuestionIds.includes(q.id)) 
                    ? "Batal Pilih Semua" 
                    : "Pilih Semua Soal"}
                </button>
              </div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Total: {filteredQuestions.length} Soal
              </span>
            </div>
          )}

          {/* Question List */}
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-[2rem]"></div>)
            ) : paginatedQuestions.length > 0 ? (
              paginatedQuestions.map((q, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={q.id} 
                  className={cn(
                    "bg-white border-2 rounded-[2rem] p-6 transition-all duration-500 hover:border-slate-350 group relative",
                    selectedQuestionIds.includes(q.id) 
                      ? "border-indigo-950 bg-slate-50/50 shadow-lg shadow-slate-100" 
                      : "border-slate-100"
                  )}
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-6">
                    <div className="flex-1 flex gap-5">
                      <div className="flex flex-col items-center gap-3">
                        <button 
                          onClick={() => {
                            if (selectedQuestionIds.includes(q.id)) {
                              setSelectedQuestionIds(prev => prev.filter(id => id !== q.id));
                            } else {
                              setSelectedQuestionIds(prev => [...prev, q.id]);
                            }
                          }}
                          className={cn(
                            "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer",
                            selectedQuestionIds.includes(q.id) 
                              ? "bg-indigo-950 border-indigo-950 text-white" 
                              : "border-slate-200 bg-white group-hover:border-slate-400 text-transparent"
                          )}
                        >
                          {selectedQuestionIds.includes(q.id) && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white border border-slate-100 text-slate-500">
                            {q.question_type.replace('_', ' ')}
                          </span>

                        </div>
                        {q.image_url && (
                          <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100 max-w-sm bg-slate-50 flex items-center justify-center">
                            <img src={q.image_url} alt="Question" className="max-w-full h-auto object-contain max-h-48 p-1" loading="lazy" />
                          </div>
                        )}
                        <p className="text-indigo-900 font-bold text-lg leading-snug group-hover:text-blue-900 transition-colors text-balance">{q.question_text}</p>
                        <div className="flex items-center gap-4 mt-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dibuat {new Date(q.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 shrink-0">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(q)}
                          disabled={editingQuestionIds.includes(q.id)}
                          className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 disabled:opacity-50 disabled:cursor-wait"
                        >
                          {editingQuestionIds.includes(q.id) ? (
                            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Edit3 className="w-5 h-5" />
                          )}
                        </button>
                        <button 
                          onClick={() => handleDelete(q.id)}
                          className="p-3 text-slate-400 rounded-xl hover-red transition-all border border-transparent group/delete"
                        >
                          <Trash2 className="w-5 h-5 transition-transform" />
                        </button>
                      </div>
                      <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                        <MoreHorizontal className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <HelpCircle className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-indigo-950 mb-2">Belum ada soal</h3>
                <p className="text-slate-400 font-medium max-w-xs mx-auto">Mulai bangun bank soal Anda dengan menambahkan pertanyaan pertama.</p>
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="mt-8 text-blue-600 font-bold hover:underline flex items-center gap-2 mx-auto"
                >
                  Tambah Soal Sekarang <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <span className="text-sm font-medium text-slate-500 px-4">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            )}
          </div>
        </div>

      {/* Modal Tambah Folder */}
      <AnimatePresence>
        {showFolderForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFolderForm(false)}
              className="absolute inset-0 bg-slate-900/40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 overflow-hidden border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-indigo-950">Buat Folder Baru</h3>
                <button onClick={() => setShowFolderForm(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <Plus className="w-6 h-6 rotate-45 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleCreateFolder} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Folder</label>
                  <input 
                    name="folderName"
                    type="text" 
                    autoFocus
                    required
                    placeholder={currentCategoryId ? "Contoh: Bab 1 - Aljabar" : "Contoh: Matematika"}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium text-slate-700"
                  />
                  <p className="text-[10px] text-slate-400 ml-1">
                    {currentCategoryId ? "Folder ini akan menjadi sub-folder dari " + currentCategory?.name : "Folder ini akan menjadi kategori utama (Mata Pelajaran)"}
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowFolderForm(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-indigo-950 hover:bg-indigo-900 transition-all shadow-lg shadow-slate-200"
                  >
                    Buat Folder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Folder Confirmation Modal */}
      <AnimatePresence>
        {showDeleteFolderModal && folderToDelete && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteFolderModal(false)}
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 overflow-hidden border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              
              <h3 className="text-xl font-bold text-indigo-950 text-center mb-2">Hapus Folder?</h3>
              <p className="text-slate-500 text-center mb-2">
                Anda yakin ingin menghapus folder <strong>"{folderToDelete.name}"</strong>?
              </p>
              
              {categories.some(c => c.parent_id === folderToDelete.id) && (
                <p className="text-amber-600 text-center text-sm mb-4 bg-amber-50 rounded-xl py-2 px-4">
                  Folder ini memiliki sub-folder di dalamnya
                </p>
              )}
              
              <p className="text-red-500 text-center text-sm mb-6">
                Semua sub-folder di dalamnya juga akan ikut dihapus.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowDeleteFolderModal(false);
                    setFolderToDelete(null);
                  }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleDeleteFolder}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Bar (Bulk Mode) */}
      <AnimatePresence>
        {selectedQuestionIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-40 bg-indigo-950 text-white px-4 py-3 md:px-8 md:py-4 rounded-2xl md:rounded-3xl shadow-2xl flex items-center gap-4 md:gap-8 backdrop-blur-xl border border-white/10 w-[92%] sm:w-auto justify-between sm:justify-start max-w-full md:max-w-2xl lg:max-w-4xl"
          >
            <div className="flex items-center gap-2 md:gap-4 border-r border-white/10 pr-3 md:pr-8 shrink-0">
              <div className="bg-blue-600 w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-xs md:text-sm">
                {selectedQuestionIds.length}
              </div>
              <span className="font-bold text-xs md:text-sm hidden sm:inline">Soal Terpilih</span>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-3 flex-1 sm:flex-initial justify-end sm:justify-start">
              <button 
                onClick={() => setShowMoveModal(true)}
                className="p-2 md:px-4 md:py-2.5 rounded-lg md:rounded-xl bg-white/10 hover:bg-white/20 transition-all font-bold text-xs md:text-sm flex items-center gap-2 text-white"
                title="Pindahkan ke Folder"
              >
                <FolderInput className="w-4 h-4" />
                <span className="hidden md:inline">Pindahkan</span>
              </button>
              <button 
                onClick={handleBulkDelete}
                className="p-2 md:px-4 md:py-2.5 rounded-lg md:rounded-xl bg-rose-600 hover:bg-rose-700 transition-all font-bold text-xs md:text-sm text-white shadow-md shadow-rose-950/20 flex items-center gap-2"
                title="Hapus Terpilih"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Hapus</span>
              </button>
              <button 
                onClick={() => setSelectedQuestionIds([])}
                className="p-2 md:px-4 md:py-2.5 rounded-lg md:rounded-xl hover:bg-white/5 transition-all font-bold text-xs md:text-sm text-slate-400 hover:text-white flex items-center gap-1"
                title="Batalkan"
              >
                <X className="w-4 h-4 md:hidden" />
                <span className="hidden md:inline">Batal</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Move to Folder */}
      <AnimatePresence>
        {showMoveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoveModal(false)}
              className="absolute inset-0 bg-slate-900/40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 overflow-hidden border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-indigo-950">Pindahkan {selectedQuestionIds.length} Soal</h3>
                <button onClick={() => setShowMoveModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <Plus className="w-6 h-6 rotate-45 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Pilih Folder Tujuan</label>
                  <select 
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-slate-700"
                    value={movingToCategoryId || ''}
                    onChange={(e) => setMovingToCategoryId(e.target.value)}
                  >
                    <option value="">Beranda (Semua Soal)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parent_id ? '　 ' : ''}📂 {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowMoveModal(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-slate-500 hover:bg-slate-50 transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleMoveQuestions}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    Pindahkan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Tambah Soal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                  <h3 className="text-2xl font-bold text-indigo-950">{editingId ? 'Edit Soal' : 'Tambah Soal Baru'}</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Lengkapi detail pertanyaan di bawah ini secara lengkap.</p>
                </div>
                <button onClick={closeModal} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-slate-200 bg-white shadow-sm">
                  <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Tipe Pertanyaan</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm sm:text-base text-slate-700 cursor-pointer"
                      value={formData.question_type}
                      onChange={(e) => setFormData({...formData, question_type: e.target.value})}
                    >
                      <option value="pilihan_ganda">Pilihan Ganda</option>
                      <option value="isian_singkat">Isian Singkat</option>
                      <option value="essay">Essay</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Pilih Folder</label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm sm:text-base text-slate-700 cursor-pointer"
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
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
                        <label className="cursor-pointer flex flex-col items-center gap-1.5 text-slate-400 hover:text-blue-500 transition-colors w-full h-full justify-center">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-xs font-bold">Pilih Gambar</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                      )}
                    </div>
                    <div className="flex-1 space-y-2 pt-1">
                      <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">Gunakan gambar untuk visualisasi pertanyaan. Pastikan gambar jelas, beresolusi baik, dan proporsional.</p>
                      <button 
                        type="button" 
                        onClick={() => document.getElementById('image-upload')?.click()}
                        className="text-xs sm:text-sm font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Ganti Gambar
                      </button>
                      <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Isi Pertanyaan</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base font-medium text-slate-700"
                    placeholder="Tuliskan pertanyaan Anda secara lengkap di sini..."
                    value={formData.question_text}
                    onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                  />
                </div>

                {formData.question_type === 'pilihan_ganda' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-sm font-bold text-slate-700">Opsi Jawaban</label>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pilih Jawaban Benar</span>
                    </div>
                    <div className="space-y-3.5">
                      {['A', 'B', 'C', 'D', 'E'].map((label) => (
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
                              value={(formData.options as any)[label].text}
                              onChange={(e) => setFormData({
                                ...formData, 
                                options: { 
                                  ...formData.options, 
                                  [label]: { ...(formData.options as any)[label], text: e.target.value }
                                }
                              })}
                            />
                            <button
                              type="button"
                              onClick={() => setFormData({...formData, correct_answer: label})}
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
                                          [label]: { ...(prev.options as any)[label], image_url: '' }
                                        }
                                      }));
                                    }}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/optimg:opacity-100 transition-opacity cursor-pointer"
                                  >
                                    <X className="w-4 h-4 text-white" />
                                  </button>
                                </>
                              ) : (
                                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-slate-300 hover:text-blue-500 transition-colors">
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
                                  onClick={() => (document.getElementById(`opt-img-${label}`) as HTMLInputElement)?.click()}
                                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                >
                                  Upload Gambar
                                </button>
                              )}
                              <input id={`opt-img-${label}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleOptionImageChange(label, e)} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.question_type === 'isian_singkat' && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Jawaban Benar</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm sm:text-base font-medium text-slate-700"
                      placeholder="Masukkan jawaban yang benar..."
                      value={formData.correct_answer}
                      onChange={(e) => setFormData({...formData, correct_answer: e.target.value})}
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer button-hover"
                  >
                    Batalkan
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white bg-indigo-950 hover:bg-indigo-900 transition-all shadow-lg shadow-slate-200 cursor-pointer button-hover"
                  >
                    Simpan Pertanyaan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
