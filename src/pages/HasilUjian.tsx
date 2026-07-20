import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import XLSXStyle from 'xlsx-js-style';
import { 
  Search, 
  Download, 
  Filter, 
  User, 
  Calendar,
  ChevronRight,
  Trophy,
  Clock,
  GraduationCap,
  ChevronDown,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  CheckCircle,
  XCircle as XCircleIcon,
  Loader2,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { cn } from '../lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSchool } from '../context/SchoolContext';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';

export default function HasilUjian({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const location = useLocation();
  const initialExamId = location.state?.examId || 'all';

  const { activeSchool } = useSchool();
  const [results, setResults] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>(initialExamId);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('terbaru');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [participantAnswers, setParticipantAnswers] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchClasses();
    fetchResults();
  }, [selectedExam, selectedSession, selectedClass, activeSchool]);

  const fetchSessions = async (examId: string) => {
    const { data } = await supabase
      .from('exam_sessions')
      .select('id, class_name, started_at')
      .eq('exam_id', examId)
      .order('started_at', { ascending: false });
    setSessions(data || []);
  };

  const fetchExams = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from('exams')
      .select('id, title')
      .eq('teacher_id', user.id);

    if (activeSchool?.id) {
      if (activeSchool.id === 'legacy') {
        query = query.is('school_id', null);
      } else {
        query = query.eq('school_id', activeSchool.id);
      }
    }

    const { data } = await query;
    setExams(data || []);
  };

  const handleExamChange = (examId: string) => {
    setSelectedExam(examId);
    setSelectedSession('all');
  };

  useEffect(() => {
    if (selectedExam !== 'all') {
      fetchSessions(selectedExam);
    } else {
      setSessions([]);
    }
  }, [selectedExam]);

  const fetchClasses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from('classes')
      .select('id, name')
      .eq('teacher_id', user.id);
    
    if (activeSchool?.id) {
      if (activeSchool.id === 'legacy') {
        query = query.is('school_id', null);
      } else {
        query = query.eq('school_id', activeSchool.id);
      }
    }

    const { data } = await query.order('name');
    setClasses(data || []);
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let examsQuery = supabase
        .from('exams')
        .select('id')
        .eq('teacher_id', user.id);

      if (activeSchool?.id) {
        if (activeSchool.id === 'legacy') {
          examsQuery = examsQuery.is('school_id', null);
        } else {
          examsQuery = examsQuery.eq('school_id', activeSchool.id);
        }
      }

      const { data: teacherExams } = await examsQuery;

      const examIds = teacherExams?.map(e => e.id) || [];
      
      if (examIds.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('participants')
        .select(`
          id,
          name,
          class,
          exam_id,
          session_id,
          score,
          status,
          start_time,
          end_time,
          exams (
            title
          ),
          exam_sessions (
            class_name
          )
        `)
        .in('exam_id', examIds)
        .order('end_time', { ascending: false });

      if (selectedExam !== 'all') {
        query = query.eq('exam_id', selectedExam);
      }

      if (selectedSession !== 'all') {
        query = query.eq('session_id', selectedSession);
      }

      if (selectedClass !== 'all') {
        query = query.eq('class', selectedClass);
      }

      const { data } = await query;
      setResults(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (participant: any) => {
    setSelectedResult(participant);
    setShowDetailModal(true);
    setLoadingDetail(true);
    setParticipantAnswers([]); // Reset first
    try {
      // Fetch all questions for this exam
      const { data: examQuestions, error: eqError } = await supabase
        .from('exam_questions')
        .select(`
          id,
          question_id,
          questions (
            *,
            question_options (*)
          )
        `)
        .eq('exam_id', participant.exam_id || participant.exams?.id);

      if (eqError) throw eqError;

      // Fetch the participant's answers
      const { data: participantDbAnswers, error: ansError } = await supabase
        .from('answers')
        .select(`
          *,
          questions(*),
          question_options(*)
        `)
        .eq('participant_id', participant.id);

      if (ansError) throw ansError;

      const fullAnswers = (examQuestions || []).map((eq: any) => {
        const question = eq.questions || {};
        if (!question.id) return null;
        
        // Find answer
        const ans = (participantDbAnswers || []).find((a: any) => a.question_id === question.id);
        
        // selected option
        let selectedOption = null;
        if (ans && question.question_type === 'pilihan_ganda' && ans.option_id) {
           selectedOption = Array.isArray(ans.question_options) 
             ? ans.question_options.find((opt: any) => opt.id === ans.option_id) 
             : ans.question_options;
        }

        // full correct answer
        let fullCorrectAnswerText = "-";
        if (question.question_type === 'pilihan_ganda') {
           const options = Array.isArray(question.question_options) ? question.question_options : (question.question_options ? [question.question_options] : []);
           const correctOpt = options.find((o: any) => o.option_label === question.correct_answer);
           if (correctOpt) {
             fullCorrectAnswerText = `${correctOpt.option_text}`;
           } else {
             fullCorrectAnswerText = question.correct_answer || '-';
           }
        } else {
           fullCorrectAnswerText = question.correct_answer || '-';
        }

        return {
          id: ans?.id || `unanswered-${question.id}`,
          question_id: question.id,
          questions: question,
          option_id: ans?.option_id || null,
          answer_text: ans?.answer_text || null,
          is_correct: ans ? ans.is_correct : false,
          selected_option: selectedOption || null,
          full_correct_answer_text: fullCorrectAnswerText,
          is_answered: !!ans
        };
      }).filter(Boolean);

      setParticipantAnswers(fullAnswers);
    } catch (error) {
      console.error('Error fetching detail:', error);
      setParticipantAnswers([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredResults = useMemo(() => {
    const searchWords = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);

    const temp = results.filter(r => {
      if (searchWords.length === 0) return true;
      const nameLower = r.name ? r.name.toLowerCase() : '';
      const classLower = r.class ? r.class.toLowerCase() : '';
      return searchWords.every(word => 
        nameLower.includes(word) || classLower.includes(word)
      );
    });

    temp.sort((a, b) => {
      if (sortBy === 'terbaru') {
        const timeA = new Date(a.end_time || a.start_time).getTime();
        const timeB = new Date(b.end_time || b.start_time).getTime();
        return timeB - timeA;
      } else if (sortBy === 'terlama') {
        const timeA = new Date(a.end_time || a.start_time).getTime();
        const timeB = new Date(b.end_time || b.start_time).getTime();
        return timeA - timeB;
      } else if (sortBy === 'a-z') {
        return a.name.localeCompare(b.name, 'id');
      } else if (sortBy === 'z-a') {
        return b.name.localeCompare(a.name, 'id');
      }
      return 0;
    });

    return temp;
  }, [results, searchTerm, sortBy]);

  const exportToExcel = () => {
    const headers = ['NAMA SISWA', 'KELAS', 'UJIAN', 'NILAI', 'WAKTU SELESAI'];
    const rows = filteredResults.map(r => [
      r.name,
      r.class,
      r.exams?.title || '-',
      Math.round(r.score),
      new Date(r.end_time || r.start_time).toLocaleString('id-ID')
    ]);

    const worksheet = XLSXStyle.utils.aoa_to_sheet([headers, ...rows]);

    // Auto-fit column widths
    const maxNameLen = Math.max(headers[0].length, ...rows.map(r => String(r[0] || '').length));
    const maxClassLen = Math.max(headers[1].length, ...rows.map(r => String(r[1] || '').length));
    const maxExamLen = Math.max(headers[2].length, ...rows.map(r => String(r[2] || '').length));
    const maxScoreLen = Math.max(headers[3].length, ...rows.map(r => String(r[3] || '').length));
    const maxTimeLen = Math.max(headers[4].length, ...rows.map(r => String(r[4] || '').length));

    worksheet['!cols'] = [
      { wch: Math.max(maxNameLen + 3, 18) },
      { wch: Math.max(maxClassLen + 3, 12) },
      { wch: Math.max(maxExamLen + 3, 20) },
      { wch: Math.max(maxScoreLen + 3, 10) },
      { wch: Math.max(maxTimeLen + 3, 20) }
    ];

    // Set row heights
    worksheet['!rows'] = [
      { hpt: 28 }, // Header row height (spacious & premium)
      ...rows.map(() => ({ hpt: 22 })) // Data row heights
    ];

    // Apply styles (borders, bg colors, alignment)
    const range = XLSXStyle.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let r = range.s.r; r <= range.e.r; ++r) {
      for (let c = range.s.c; c <= range.e.c; ++c) {
        const cellRef = XLSXStyle.utils.encode_cell({ r, c });
        if (!worksheet[cellRef]) continue;

        if (r === 0) {
          // Header Row Style
          worksheet[cellRef].s = {
            fill: {
              fgColor: { rgb: "1E1B4B" } // Premium Indigo bg
            },
            font: {
              name: "Segoe UI",
              sz: 11,
              bold: true,
              color: { rgb: "FFFFFF" } // White text
            },
            alignment: {
              horizontal: "center",
              vertical: "center"
            },
            border: {
              top: { style: "thin", color: { rgb: "312E81" } },
              bottom: { style: "medium", color: { rgb: "0F172A" } },
              left: { style: "thin", color: { rgb: "312E81" } },
              right: { style: "thin", color: { rgb: "312E81" } }
            }
          };
        } else {
          // Data Row Style
          worksheet[cellRef].s = {
            font: {
              name: "Segoe UI",
              sz: 10
            },
            alignment: {
              vertical: "center",
              horizontal: c === 1 || c === 3 || c === 4 ? "center" : "left" // Center align Class, Score, Time
            },
            border: {
              top: { style: "thin", color: { rgb: "E2E8F0" } },
              bottom: { style: "thin", color: { rgb: "E2E8F0" } },
              left: { style: "thin", color: { rgb: "E2E8F0" } },
              right: { style: "thin", color: { rgb: "E2E8F0" } }
            }
          };
        }
      }
    }

    const workbook = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(workbook, worksheet, "Hasil Ujian");
    XLSXStyle.writeFile(workbook, `Hasil_Ujian_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const generatePDF = () => {
    const doc = new jsPDF() as any;
    const selectedExamData = exams.find(e => e.id === selectedExam);
    const selectedSessionData = sessions.find(s => s.id === selectedSession);
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(27, 20, 100);
    doc.text('Laporan Hasil Ujian', 14, 25);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Aplikasi: EduTest Professional`, 14, 32);

    let offset = 37;
    if (selectedExamData) {
      doc.text(`Ujian: ${selectedExamData.title}`, 14, offset);
      offset += 5;
    }
    if (selectedSessionData) {
      doc.text(`Sesi: ${selectedSessionData.class_name} (${new Date(selectedSessionData.started_at).toLocaleDateString('id-ID')})`, 14, offset);
      offset += 5;
    }

    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, offset);
    
    const tableStartY = offset + 8;

    const tableData = filteredResults.map((res, index) => [
      index + 1,
      res.name,
      res.class || res.exam_sessions?.class_name || '-',
      res.exams?.title || '-',
      Math.round(res.score || 0),
      res.status === 'completed' ? 'Selesai' : 'Sedang Mengerjakan'
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['No', 'Nama Siswa', 'Kelas', 'Ujian', 'Nilai', 'Status']],
      body: tableData,
      headStyles: { 
        fillColor: [27, 20, 100], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold', 
        halign: 'center',
        valign: 'middle'
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      styles: { 
        fontSize: 9, 
        cellPadding: 5, 
        lineWidth: 0.1, 
        lineColor: [200, 200, 200],
        valign: 'middle'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 25 },
        3: { cellWidth: 'auto' },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
        5: { halign: 'center', cellWidth: 35 }
      },
      margin: { top: tableStartY },
    });

    doc.save(`Hasil_Ujian_EduTest_${new Date().getTime()}.pdf`);
  };

  return (
    <div className={cn(isEmbedded ? "space-y-6" : "space-y-10 pb-20")}>
      {!isEmbedded && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-indigo-950 tracking-tight">Hasil Ujian</h2>
            <p className="text-slate-500 font-medium mt-1">Laporan lengkap performa siswa pada setiap sesi ujian.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={generatePDF}
              className="bg-white border-2 border-slate-200 text-indigo-950 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-xl shadow-slate-100 active:scale-[0.98]"
            >
              <Download className="w-5 h-5 text-indigo-600" />
              PDF
            </button>
            <button 
              onClick={exportToExcel}
              className="bg-indigo-950 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-900 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
            >
              <FileSpreadsheet className="w-5 h-5" />
              Excel
            </button>
          </div>
        </div>
      )}
      
      {isEmbedded && (
        <button 
          id="btn-export-hasil"
          onClick={exportToExcel}
          className="hidden"
        />
      )}

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-950 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama siswa atau kelas..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-4 focus:ring-indigo-950/5 focus:border-indigo-950 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[280px] group">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-950 transition-colors" />
          <select 
            className="w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-950/5 focus:border-indigo-950 appearance-none bg-white font-bold text-slate-700 transition-all cursor-pointer"
            value={selectedExam}
            onChange={(e) => handleExamChange(e.target.value)}
          >
            <option value="all">Semua Ujian</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
        </div>
        {selectedExam !== 'all' && sessions.length > 0 && (
          <div className="relative min-w-[200px] group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-950 transition-colors" />
            <select 
              className="w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-950/5 focus:border-indigo-950 appearance-none bg-white font-bold text-slate-700 transition-all cursor-pointer"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="all">Semua Sesi</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>{s.class_name} - {new Date(s.started_at).toLocaleDateString('id-ID')}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          </div>
        )}
        <div className="relative min-w-[200px] group">
          <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-950 transition-colors" />
          <select 
            className="w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-950/5 focus:border-indigo-950 appearance-none bg-white font-bold text-slate-700 transition-all cursor-pointer"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">Semua Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
        </div>
        <div className="relative min-w-[200px] group">
          <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-950 transition-colors" />
          <select 
            className="w-full pl-12 pr-10 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-950/5 focus:border-indigo-950 appearance-none bg-white font-bold text-slate-700 transition-all cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="terbaru">Terbaru</option>
            <option value="terlama">Terlama</option>
            <option value="a-z">Nama A-Z</option>
            <option value="z-a">Nama Z-A</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Siswa & Kelas</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Ujian</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Skor Akhir</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Waktu Selesai</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1,2,3,4,5,6].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-6"><div className="h-10 bg-slate-100 rounded-xl w-full"></div></td>
                  </tr>
                ))
              ) : filteredResults.length > 0 ? (
                filteredResults.map((result, index) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    key={result.id} 
                    onClick={() => fetchDetail(result)}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-indigo-950 flex items-center justify-center font-bold text-sm shadow-inner group-hover:bg-white transition-colors">
                          {result.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-indigo-950 leading-none">{result.name}</p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">{result.class}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span className="text-sm font-bold text-slate-700 line-clamp-1">{result.exams?.title}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-indigo-950">{Math.round(result.score)}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Poin</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest",
                        result.score >= 75 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                        result.score >= 50 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                        "bg-rose-50 text-rose-600 border border-rose-100"
                      )}>
                        {result.score >= 75 ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                         result.score >= 50 ? <AlertCircle className="w-3.5 h-3.5" /> : 
                         <XCircle className="w-3.5 h-3.5" />}
                        {result.score >= 75 ? 'Lulus' : result.score >= 50 ? 'Remedial' : 'Gagal'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{new Date(result.end_time || result.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1">{new Date(result.end_time || result.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-3 text-slate-300 group-hover:text-indigo-950 group-hover:bg-white rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                      <Trophy className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-bold text-indigo-950 mb-2">Belum ada hasil</h3>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto">
                      Hasil ujian akan muncul di sini setelah siswa menyelesaikan ujian mereka.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {showDetailModal && selectedResult && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDetailModal(false)}
                className="absolute inset-0 bg-indigo-950/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
              >
                <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-indigo-950">Detail Jawaban: {selectedResult.name}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">Kelas: {selectedResult.class} | Skor: {selectedResult.score}</p>
                  </div>
                  <button 
                    onClick={() => setShowDetailModal(false)} 
                    className="p-2 hover:bg-white rounded-xl transition-all shadow-sm active:scale-95 group"
                  >
                    <XCircleIcon className="w-6 h-6 text-slate-400 group-hover:text-rose-500 transition-colors" />
                  </button>
                </div>

                <div className="p-4 sm:p-8 overflow-y-auto space-y-6 custom-scrollbar flex-1 bg-white">
                  {loadingDetail ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="w-12 h-12 text-indigo-950 animate-spin" />
                      <p className="text-slate-500 font-medium mt-4">Memuat data jawaban...</p>
                    </div>
                  ) : participantAnswers.length > 0 ? (
                    <div className="space-y-4">
                      {participantAnswers.map((answer, i) => (
                        <div key={answer.id} className="p-5 sm:p-7 rounded-[2rem] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                          <div className="flex items-start gap-4 mb-5">
                            <div className="bg-indigo-950 text-white w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg shadow-indigo-950/20">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-indigo-950 font-bold text-lg leading-snug">{answer.questions?.question_text || 'Soal tidak ditemukan'}</p>
                              {answer.questions?.image_url && (
                                <div className="mt-4 rounded-2xl overflow-hidden border border-slate-100 max-w-md bg-white shadow-sm">
                                  <img src={answer.questions.image_url} alt="Question" className="w-full h-auto object-contain max-h-60" />
                                </div>
                              )}
                              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                                {answer.questions?.question_type?.replace('_', ' ') || 'N/A'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={cn(
                              "p-4 rounded-2xl border",
                              !answer.is_answered ? "bg-slate-50 border-slate-200" :
                              answer.is_correct ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                            )}>
                              <p className={cn(
                                "text-[10px] font-black uppercase tracking-widest mb-1",
                                !answer.is_answered ? "text-slate-400" :
                                answer.is_correct ? "text-emerald-500" : "text-rose-500"
                              )}>Jawaban Siswa</p>
                              <p className={cn(
                                "font-bold text-base",
                                !answer.is_answered ? "text-slate-400" :
                                answer.is_correct ? "text-emerald-700" : "text-rose-700"
                              )}>
                                {!answer.is_answered 
                                  ? 'Tidak dijawab' 
                                  : (answer.questions?.question_type === 'pilihan_ganda' 
                                    ? (answer.selected_option ? `${answer.selected_option.option_text}` : (answer.option_id ? 'Opsi ID: ' + answer.option_id : '-')) 
                                    : (answer.answer_text || '-'))}
                              </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Kunci Jawaban</p>
                              <p className="font-bold text-indigo-950 text-base">{answer.full_correct_answer_text}</p>
                            </div>
                          </div>
                          
                          <div className="mt-5 flex items-center gap-2">
                            {!answer.is_answered ? (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold">
                                <AlertCircle className="w-3.5 h-3.5" /> Kosong
                              </div>
                            ) : answer.is_correct ? (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-600 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Benar
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-100 text-rose-600 text-xs font-bold">
                                <XCircleIcon className="w-3.5 h-3.5" /> Salah
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                      <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold">Tidak ada soal yang ditemukan.</p>
                    </div>
                  )}
                </div>
                
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className="px-8 py-3 bg-indigo-950 text-white rounded-xl font-bold hover:bg-indigo-900 transition-all shadow-lg shadow-indigo-950/20 active:scale-95"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
