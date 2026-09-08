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
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';
import { useAlert } from '../context/AlertContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { saveAs } from 'file-saver';
import { useSchool } from '../context/SchoolContext';
import QuestionModal from '../components/bank-soal/QuestionModal';

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
  const [questionToEdit, setQuestionToEdit] = useState<any | null>(null);
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
        .select('id, question_text, question_type, correct_answer, category_id, image_url, created_at, question_options(id, option_label, option_text, image_url)')
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

  const handleEdit = (question: any) => {
    setQuestionToEdit(question);
    setShowAddForm(true);
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
    setQuestionToEdit(null);
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

  const selectedSet = useMemo(() => new Set(selectedQuestionIds), [selectedQuestionIds]);

  const areAllQuestionsSelected = useMemo(() => {
    if (filteredQuestions.length === 0) return false;
    return filteredQuestions.every(q => selectedSet.has(q.id));
  }, [filteredQuestions, selectedSet]);

  const paginatedQuestions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);

  const handleDownloadTemplate = async () => {
    const XLSX = await import('xlsx');
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
        const XLSX = await import('xlsx');
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
    const { Document, Packer, Paragraph, TextRun } = await import('docx');
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "TEMPLATE IMPORT SOAL EDUVERSE", bold: true, size: 36, color: "1D4ED8" }),
            ],
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "PANDUAN FORMAT SOAL & GAMBAR", bold: true, size: 26, underline: {} })],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "1. Penomoran Soal: Gunakan format nomor (1. 2. 3.) di awal setiap soal.", size: 22 }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "2. Pilihan Ganda: Gunakan huruf kapital (A. B. C. D. E.) untuk opsi jawaban.", size: 22 }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "3. Kunci Jawaban: Tuliskan 'Jawaban: [Huruf]' atau 'Kunci: [Huruf]'.", size: 22 }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ 
                text: "4. DUKUNGAN GAMBAR (OTOMATIS): Anda dapat langsung Paste / Sisipkan gambar di bawah pertanyaan atau pada pilihan jawaban. Sistem akan otomatis mendeteksi dan mengompresnya agar ringan diakses siswa.", 
                bold: true, 
                size: 22, 
                color: "0D9488" 
              }),
            ],
            spacing: { after: 300 },
          }),

          new Paragraph({
            children: [new TextRun({ text: "CONTOH SOAL DENGAN GAMBAR PERTANYAAN:", bold: true, size: 24, color: "2B6CB0" })],
            spacing: { after: 120 },
          }),
          new Paragraph({ children: [new TextRun({ text: "1. Perhatikan gambar berikut! Komponen perangkat keras ini berfungsi sebagai...", size: 22 })], spacing: { after: 60 } }),
          new Paragraph({ children: [new TextRun({ text: "[ Sisipkan / Paste Gambar Pertanyaan Di Sini ]", italics: true, color: "64748B", size: 20 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "A. Pemroses Utama (CPU)", size: 22 })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "B. Media Penyimpanan", size: 22 })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "C. Perangkat Keluaran", size: 22 })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "D. Perangkat Masukan", size: 22 })], spacing: { after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: "Jawaban: A", bold: true, size: 22, color: "16A34A" })], spacing: { after: 300 } }),

          new Paragraph({
            children: [new TextRun({ text: "CONTOH SOAL DENGAN GAMBAR DI PILIHAN JAWABAN:", bold: true, size: 24, color: "2B6CB0" })],
            spacing: { after: 120 },
          }),
          new Paragraph({ children: [new TextRun({ text: "2. Manakah dari gambar di bawah ini yang merupakan modul RAM?", size: 22 })], spacing: { after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: "A. [ Paste Gambar Opsi A ]", size: 22 })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "B. [ Paste Gambar Opsi B ]", size: 22 })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "C. [ Paste Gambar Opsi C ]", size: 22 })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "D. [ Paste Gambar Opsi D ]", size: 22 })], spacing: { after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: "Jawaban: C", bold: true, size: 22, color: "16A34A" })], spacing: { after: 300 } }),

          new Paragraph({
            children: [new TextRun({ text: "CONTOH SOAL TANPA GAMBAR (STANDAR):", bold: true, size: 24, color: "2B6CB0" })],
            spacing: { after: 120 },
          }),
          new Paragraph({ children: [new TextRun({ text: "3. Struktur data yang menerapkan prinsip FIFO (First In, First Out) adalah...", size: 22 })], spacing: { after: 60 } }),
          new Paragraph({ children: [new TextRun({ text: "A. Stack", size: 22 })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "B. Queue", size: 22 })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "C. Tree", size: 22 })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "D. Graph", size: 22 })], spacing: { after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: "Jawaban: B", bold: true, size: 22, color: "16A34A" })], spacing: { after: 200 } }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Template_Soal_EduVerse.docx");
    showAlert({ title: 'Berhasil', message: 'Template Word EduVerse berhasil diunduh.', type: 'success' });
  };

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const { default: mammoth } = await import('mammoth');
        
        // Extract HTML with embedded base64 images
        const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
        const html = htmlResult.value || '';
        const rawText = html.replace(/<[^>]*>/g, ' ');

        // Parse HTML into semantic item list with images
        const tokenRegex = /<(p|li|td|th)(?:[^>]*)>([\s\S]*?)<\/\1>/gi;
        let match;
        const items: { text: string; images: string[] }[] = [];

        while ((match = tokenRegex.exec(html)) !== null) {
          const content = match[2];
          const imgMatches = [...content.matchAll(/<img[^>]+src="([^">]+)"/gi)].map(m => m[1]);
          const text = content.replace(/<img[^>]*>/gi, '').replace(/<.*?>/g, ' ').replace(/\s+/g, ' ').trim();
          if (text || imgMatches.length > 0) {
            items.push({ text, images: imgMatches });
          }
        }

        const hasNumberedQuestions = items.some(it => /^\d+[\.\)]\s+/.test(it.text));
        let parsedQuestions: any[] = [];

        if (hasNumberedQuestions) {
          let currentQ: any = null;
          let currentOptionLabel: string | null = null;

          items.forEach(it => {
            const qMatch = it.text.match(/^(\d+)[\.\)]\s*(.*)/);
            if (qMatch) {
              if (currentQ && currentQ.question_text) parsedQuestions.push(currentQ);
              currentQ = {
                question_text: qMatch[2],
                question_type: 'pilihan_ganda',
                image_url: it.images[0] || null,
                options: {},
                correct_answer: ''
              };
              currentOptionLabel = null;
              return;
            }

            if (!currentQ) return;

            // Check if this item is an image belonging to current question before options
            if (it.images.length > 0 && Object.keys(currentQ.options).length === 0 && !currentOptionLabel && !it.text.match(/^[A-E][\.\)]/i)) {
              if (!currentQ.image_url) currentQ.image_url = it.images[0];
            }

            // Check for Option A-E
            const optMatch = it.text.match(/^([A-E])[\.\)]\s*(.*)/i);
            if (optMatch) {
              const label = optMatch[1].toUpperCase();
              currentOptionLabel = label;
              currentQ.options[label] = {
                text: optMatch[2] || `Pilihan ${label}`,
                image_url: it.images[0] || null
              };
              return;
            }

            // If previous item was an option and this item is an image
            if (currentOptionLabel && it.images.length > 0 && currentQ.options[currentOptionLabel]) {
              if (!currentQ.options[currentOptionLabel].image_url) {
                currentQ.options[currentOptionLabel].image_url = it.images[0];
                if (it.text && currentQ.options[currentOptionLabel].text === `Pilihan ${currentOptionLabel}`) {
                  currentQ.options[currentOptionLabel].text = it.text;
                }
              }
            }

            // Check Answer Key
            const ansMatch = it.text.match(/^(?:Kunci\s+Jawaban|Kunci|Jawaban|Ans|Answer):\s*([A-E])/i);
            if (ansMatch) {
              currentQ.correct_answer = ansMatch[1].toUpperCase();
              currentOptionLabel = null;
              return;
            }

            const simpleAns = it.text.match(/^(?:Kunci\s+Jawaban|Kunci|Jawaban|Ans|Answer):\s*(.*)/i);
            if (simpleAns) {
              const letter = simpleAns[1].match(/([A-E])/i);
              currentQ.correct_answer = letter ? letter[1].toUpperCase() : simpleAns[1].trim();
              currentOptionLabel = null;
              return;
            }

            if (it.text.startsWith('Pembahasan:')) {
              currentOptionLabel = null;
              return;
            }

            // Multiline question text
            if (Object.keys(currentQ.options).length === 0 && !it.text.match(/^[A-E][\.\)]/i)) {
              currentQ.question_text += ' ' + it.text;
              if (it.images[0] && !currentQ.image_url) currentQ.image_url = it.images[0];
            }
          });

          if (currentQ && currentQ.question_text) parsedQuestions.push(currentQ);
        } else {
          // Unnumbered format (e.g. raw ASAT exam document)
          const headerIdx = items.findIndex(it => /DAFTAR SOAL|SOAL PILIHAN GANDA/i.test(it.text));
          const contentItems = headerIdx !== -1 ? items.slice(headerIdx + 1) : items;

          let currentQText = '';
          let currentQImg: string | null = null;
          let currentOpts: any[] = [];

          for (let i = 0; i < contentItems.length; i++) {
            const it = contentItems[i];

            const keyMatch = it.text.match(/^(?:Kunci\s+Jawaban|Kunci|Jawaban|Ans|Answer):\s*([A-E])/i);
            if (keyMatch) {
              const key = keyMatch[1].toUpperCase();

              if (currentQText && currentOpts.length >= 2) {
                const optMap: Record<string, { text: string; image_url: string | null }> = {};
                const labels = ['A', 'B', 'C', 'D', 'E'];
                currentOpts.slice(0, 5).forEach((opt, idx) => {
                  const label = opt.label || labels[idx];
                  optMap[label] = {
                    text: opt.text.replace(/^[A-E][\.\)]\s*/i, '') || `Pilihan ${label}`,
                    image_url: opt.image_url || null
                  };
                });

                parsedQuestions.push({
                  question_text: currentQText,
                  question_type: 'pilihan_ganda',
                  image_url: currentQImg,
                  options: optMap,
                  correct_answer: key
                });
              }

              currentQText = '';
              currentQImg = null;
              currentOpts = [];
              continue;
            }

            if (it.text.startsWith('Pembahasan:')) continue;

            if (!currentQText) {
              currentQText = it.text;
              if (it.images.length > 0) currentQImg = it.images[0];
            } else {
              if (it.images.length > 0 && (!it.text || /^\d+$/.test(it.text)) && currentOpts.length === 0) {
                currentQImg = it.images[0];
              } else {
                const optLabelMatch = it.text.match(/^([A-E])[\.\)]/i);
                if (optLabelMatch) {
                  currentOpts.push({
                    label: optLabelMatch[1].toUpperCase(),
                    text: it.text.replace(/^[A-E][\.\)]\s*/i, '') || `Pilihan ${optLabelMatch[1].toUpperCase()}`,
                    image_url: it.images[0] || null
                  });
                } else {
                  if (currentOpts.length > 0 && it.images.length > 0 && !currentOpts[currentOpts.length - 1].image_url && !it.text) {
                    currentOpts[currentOpts.length - 1].image_url = it.images[0];
                  } else {
                    currentOpts.push({
                      text: it.text,
                      image_url: it.images[0] || null
                    });
                  }
                }
              }
            }
          }
        }

        if (parsedQuestions.length === 0) throw new Error("Format tidak dikenali. Pastikan soal memiliki nomor (1. ) atau kunci jawaban (Jawaban: A).");

        // Automatically compress all extracted images to optimize database size and speed
        for (const q of parsedQuestions) {
          if (q.image_url) {
            q.image_url = await compressBase64Image(q.image_url, 800, 800, 0.7);
          }
          if (q.options) {
            for (const optKey of Object.keys(q.options)) {
              if (q.options[optKey]?.image_url) {
                q.options[optKey].image_url = await compressBase64Image(q.options[optKey].image_url, 800, 800, 0.7);
              }
            }
          }
        }

        // Upload to Database
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found");

        // Detect or fallback category
        let targetCategoryId = currentCategoryId;
        if (!targetCategoryId) {
          const headerMatch = rawText.match(/Mata\s*Pelajaran[\s:\n]+([^\n\r]+)/i);
          const detectedSubject = headerMatch ? headerMatch[1].trim() : null;
          if (detectedSubject) {
            const { data: subjectCat } = await supabase
              .from('categories')
              .select('id')
              .eq('teacher_id', user.id)
              .eq('name', detectedSubject)
              .is('parent_id', null)
              .maybeSingle();
            
            if (subjectCat) {
              targetCategoryId = subjectCat.id;
            } else {
              const { data: newSubject } = await supabase
                .from('categories')
                .insert([{ name: detectedSubject, teacher_id: user.id, school_id: null }])
                .select().single();
              if (newSubject) targetCategoryId = newSubject.id;
            }
          }
        }

        let successCount = 0;
        for (const q of parsedQuestions) {
          const cleanAns = q.correct_answer ? (q.correct_answer.match(/([A-E])/i)?.[1]?.toUpperCase() || q.correct_answer) : null;
          const { data: question, error: qError } = await supabase
            .from('questions')
            .insert([{
              teacher_id: user.id,
              school_id: null,
              question_text: q.question_text,
              question_type: q.question_type || 'pilihan_ganda',
              correct_answer: q.question_type === 'pilihan_ganda' ? cleanAns : (q.correct_answer || null),
              image_url: q.image_url || null,
              category_id: targetCategoryId
            }])
            .select().single();
          
          if (qError) {
            console.error('Error inserting question:', qError);
            continue;
          }

          if (q.question_type === 'pilihan_ganda' && question && q.options) {
            const opts = Object.entries(q.options).map(([label, optVal]: [string, any]) => {
              const textStr = typeof optVal === 'string' ? optVal : (optVal?.text || '');
              return {
                question_id: question.id,
                option_label: label,
                option_text: textStr.trim() || `Pilihan ${label}`,
                image_url: typeof optVal === 'object' ? (optVal?.image_url || null) : null
              };
            });
            await supabase.from('question_options').insert(opts);
          }
          successCount++;
        }

        showAlert({ 
          title: 'Impor Selesai', 
          message: `${successCount} soal berhasil diimpor dari Word (termasuk kompresi gambar otomatis).`, 
          type: 'success' 
        });
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
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1D4ED8] tracking-tight">Bank Soal</h2>
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
              className="bg-white text-[#1D4ED8] border border-slate-200 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-slate-50"
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
                 className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#1D4ED8] flex items-center gap-3"
               >
                 <Download className="w-4 h-4 text-emerald-500" />
                 Excel Template
               </button>
               <button 
                 onClick={() => {
                   handleDownloadDocxTemplate();
                   setShowTemplateDropdown(false);
                 }}
                 className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#1D4ED8] flex items-center gap-3 border-t border-slate-50"
               >
                 <FileText className="w-4 h-4 text-[#3B66F5]" />
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
              className="bg-white text-[#1D4ED8] border border-slate-200 px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
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
                 className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#1D4ED8] flex items-center gap-3"
               >
                 <Upload className="w-4 h-4 text-emerald-500" />
                 Impor Excel
               </button>
               <button 
                 onClick={() => {
                    docxInputRef.current?.click();
                    setShowImportDropdown(false);
                 }}
                 className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#1D4ED8] flex items-center gap-3 border-t border-slate-50"
               >
                 <FileText className="w-4 h-4 text-[#3B66F5]" />
                 Impor Word
               </button>
            </div>
          </div>

          <button 
            onClick={() => { setQuestionToEdit(null); setShowAddForm(true); }}
            className="bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-200/50 border border-white/10 transition-all hover:brightness-110 active:scale-[0.98]"
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
                className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-[#3B66F5]/15 transition-all font-medium text-sm text-[#1D4ED8] appearance-none cursor-pointer"
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
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm text-[#3B66F5] bg-[#3B66F5]/5 hover:bg-[#3B66F5]/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
              className="text-slate-400 hover:text-[#1D4ED8] transition-colors"
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
                    idx === breadcrumbs.length - 1 ? "text-[#1D4ED8]" : "text-slate-400 hover:text-[#1D4ED8]"
                  )}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-[#3B66F5] transition-colors" />
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
                    if (areAllQuestionsSelected) {
                      setSelectedQuestionIds([]);
                    } else {
                      setSelectedQuestionIds(filteredQuestions.map(q => q.id));
                    }
                  }}
                  className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-[#1D4ED8] transition-colors"
                >
                  <div className={cn(
                    "w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
                    areAllQuestionsSelected
                      ? "bg-[#1D4ED8] border-[#3B66F5] text-white"
                      : "border-slate-300 bg-white"
                  )}>
                    {areAllQuestionsSelected && (
                      <Check className="w-4 h-4 stroke-[3]" />
                    )}
                  </div>
                  {areAllQuestionsSelected
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
              paginatedQuestions.map((q) => {
                const isSelected = selectedSet.has(q.id);
                return (
                  <div 
                    key={q.id} 
                    className={cn(
                      "bg-white border-2 rounded-[2rem] p-6 transition-all duration-200 hover:border-slate-350 group relative",
                      isSelected 
                        ? "border-[#3B66F5] bg-slate-50/50 shadow-md shadow-slate-100" 
                        : "border-slate-100"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-6">
                      <div className="flex-1 flex gap-5">
                        <div className="flex flex-col items-center gap-3">
                          <button 
                            onClick={() => {
                              if (isSelected) {
                                setSelectedQuestionIds(prev => prev.filter(id => id !== q.id));
                              } else {
                                setSelectedQuestionIds(prev => [...prev, q.id]);
                              }
                            }}
                            className={cn(
                              "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer",
                              isSelected 
                                ? "bg-[#1D4ED8] border-[#3B66F5] text-white" 
                                : "border-slate-200 bg-white group-hover:border-slate-400 text-transparent"
                            )}
                          >
                            {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                          </button>
                        </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                            q.question_type === 'menjodohkan' ? "bg-indigo-50 border-indigo-200 text-indigo-700" :
                            q.question_type === 'essay' ? "bg-amber-50 border-amber-200 text-amber-700" :
                            "bg-white border-slate-100 text-slate-500"
                          )}>
                            {q.question_type === 'menjodohkan' ? 'Menjodohkan (TKA)' : q.question_type.replace('_', ' ')}
                          </span>
                        </div>
                        {q.image_url && (
                          <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100 max-w-sm bg-slate-50 flex items-center justify-center">
                            <img src={q.image_url} alt="Question" className="max-w-full h-auto object-contain max-h-48 p-1" loading="lazy" />
                          </div>
                        )}
                        <p className="text-[#1D4ED8] font-bold text-lg leading-snug group-hover:text-blue-900 transition-colors text-balance">{q.question_text}</p>

                        {/* Options Display for Pilihan Ganda */}
                        {q.question_type === 'pilihan_ganda' && q.question_options && q.question_options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                            {q.question_options
                              .slice()
                              .sort((a: any, b: any) => (a.option_label || '').localeCompare(b.option_label || ''))
                              .map((opt: any) => {
                                const isCorrect = q.correct_answer?.toUpperCase() === opt.option_label?.toUpperCase();
                                return (
                                  <div
                                    key={opt.id || opt.option_label}
                                    className={cn(
                                      "p-2.5 rounded-xl border flex items-start gap-2.5 transition-all text-xs",
                                      isCorrect 
                                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-950 font-medium" 
                                        : "bg-slate-50/70 border-slate-200/70 text-slate-700"
                                    )}
                                  >
                                    <span className={cn(
                                      "w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5",
                                      isCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                                    )}>
                                      {opt.option_label}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <span className="break-words line-clamp-2">{opt.option_text}</span>
                                      {opt.image_url && (
                                        <div className="mt-1.5 rounded-lg overflow-hidden border border-slate-200 bg-white max-w-[140px]">
                                          <img src={opt.image_url} alt={`Opsi ${opt.option_label}`} className="w-full h-auto max-h-24 object-contain p-1" loading="lazy" />
                                        </div>
                                      )}
                                    </div>
                                    {isCorrect && (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        {/* Display for Menjodohkan */}
                        {q.question_type === 'menjodohkan' && (
                          <div className="mt-4 p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100 text-xs">
                            <p className="font-bold text-indigo-950 mb-2">Pasangan Menjodohkan (TKA):</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {(() => {
                                try {
                                  const pairs = JSON.parse(q.correct_answer || '[]');
                                  if (Array.isArray(pairs)) {
                                    return pairs.map((p: any, pIdx: number) => (
                                      <div key={p.id || pIdx} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                                        <span className="font-medium text-slate-800 flex-1 truncate">{p.left}</span>
                                        <span className="text-indigo-400 font-bold">➔</span>
                                        <span className="font-bold text-indigo-700 flex-1 truncate text-right">{p.right}</span>
                                      </div>
                                    ));
                                  }
                                } catch (e) {}
                                return <span className="text-slate-500 italic">Format pasangan tersimpan</span>;
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Display for Essay */}
                        {q.question_type === 'essay' && (
                          <div className="mt-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-950">
                            <span className="font-bold">Pedoman / Kunci Jawaban: </span>
                            <span className="text-slate-700">{q.correct_answer || 'Penilaian manual oleh guru.'}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dibuat {new Date(q.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 shrink-0">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(q)}
                          className="p-3 text-slate-400 hover:text-[#3B66F5] hover:bg-[#3B66F5]/5 rounded-xl transition-all border border-transparent hover:border-[#3B66F5]/20 cursor-pointer"
                          title="Edit Soal"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(q.id)}
                          className="p-3 text-slate-400 rounded-xl hover-red transition-all border border-transparent group/delete cursor-pointer"
                          title="Hapus Soal"
                        >
                          <Trash2 className="w-5 h-5 transition-transform" />
                        </button>
                      </div>
                      <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                        <MoreHorizontal className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
            ) : (
              <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <HelpCircle className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-[#1D4ED8] mb-2">Belum ada soal</h3>
                <p className="text-slate-400 font-medium max-w-xs mx-auto">Mulai bangun bank soal Anda dengan menambahkan pertanyaan pertama.</p>
                <button 
                  onClick={() => { setQuestionToEdit(null); setShowAddForm(true); }}
                  className="mt-8 text-[#3B66F5] font-bold hover:underline flex items-center gap-2 mx-auto cursor-pointer"
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
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showFolderForm && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setShowFolderForm(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 overflow-hidden border border-slate-100 z-10 will-change-transform transform-gpu"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-[#1D4ED8]">Buat Folder Baru</h3>
                  <button onClick={() => setShowFolderForm(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
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
                      className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] hover:brightness-110 border border-white/10 transition-all shadow-lg shadow-[#3B66F5]/25"
                    >
                      Buat Folder
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Delete Folder Confirmation Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showDeleteFolderModal && folderToDelete && (
            <div 
              className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
              onClick={() => setShowDeleteFolderModal(false)}
            >
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 overflow-hidden border border-slate-100 z-10 will-change-transform transform-gpu"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                
                <h3 className="text-xl font-bold text-[#1D4ED8] text-center mb-2">Hapus Folder?</h3>
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
        </AnimatePresence>,
        document.body
      )}

      {/* Floating Action Bar (Bulk Mode) */}
      <AnimatePresence>
        {selectedQuestionIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-40 bg-[#1D4ED8] text-white px-4 py-3 md:px-8 md:py-4 rounded-2xl md:rounded-3xl shadow-2xl flex items-center gap-4 md:gap-8 border border-blue-400/30 w-[92%] sm:w-auto justify-between sm:justify-start max-w-full md:max-w-2xl lg:max-w-4xl"
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
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showMoveModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setShowMoveModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 overflow-hidden border border-slate-100 z-10 will-change-transform transform-gpu"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-[#1D4ED8]">Pindahkan {selectedQuestionIds.length} Soal</h3>
                  <button onClick={() => setShowMoveModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
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
                      className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#685ECC] via-[#5C53D4] to-[#4F46E5] shadow-lg shadow-[#5C53D4]/25 hover:scale-[1.02] border border-white/10 transition-all"
                    >
                      Pindahkan
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Modal Tambah / Edit Soal */}
      <QuestionModal
        isOpen={showAddForm}
        onClose={closeModal}
        onSuccess={fetchData}
        questionToEdit={questionToEdit}
        categories={categories}
        currentCategoryId={currentCategoryId}
      />
    </div>
  );
}
