import React, { useState, useRef, useEffect } from 'react';
import { Student, BulkCertificateData, CertificateGrade, CertificateThemeColor } from '../../types/tools';
import { AWARD_AREAS, generateCertificateMessage } from '../../utils/tools/certificateHelpers';
import { robustSaveAs } from '../../utils/tools/exporters';
import InputSection from './InputSection';
import { 
  Award, 
  Crown, 
  Star, 
  ThumbsUp, 
  Download, 
  Printer, 
  Users, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  Palette, 
  Check, 
  Type, 
  Share2, 
  RotateCcw, 
  Edit3, 
  MoveHorizontal, 
  MoveVertical,
  Trash2,
  FileText
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';

const COLOR_THEMES: Record<CertificateThemeColor, { gradient: string; text: string; ring: string; iconBg: string; shadow: string }> = {
  emerald: { 
    gradient: 'from-emerald-400 via-emerald-500 to-teal-700', 
    text: 'text-emerald-700', 
    ring: 'ring-emerald-100',
    iconBg: 'bg-emerald-50',
    shadow: 'shadow-emerald-500/30'
  },
  blue: { 
    gradient: 'from-blue-400 via-indigo-500 to-indigo-700', 
    text: 'text-indigo-700',
    ring: 'ring-blue-100',
    iconBg: 'bg-[#3B66F5]/5',
    shadow: 'shadow-blue-500/30'
  },
  yellow: { 
    gradient: 'from-yellow-300 via-amber-400 to-orange-600', 
    text: 'text-amber-700',
    ring: 'ring-yellow-100',
    iconBg: 'bg-yellow-50',
    shadow: 'shadow-amber-500/30'
  },
  purple: { 
    gradient: 'from-fuchsia-400 via-purple-500 to-violet-800', 
    text: 'text-purple-700',
    ring: 'ring-purple-100',
    iconBg: 'bg-purple-50',
    shadow: 'shadow-purple-500/30'
  },
  pink: { 
    gradient: 'from-pink-400 via-rose-500 to-rose-700', 
    text: 'text-rose-700',
    ring: 'ring-pink-100',
    iconBg: 'bg-pink-50',
    shadow: 'shadow-pink-500/30'
  },
  red: { 
    gradient: 'from-red-400 via-red-500 to-rose-800', 
    text: 'text-red-800',
    ring: 'ring-red-100',
    iconBg: 'bg-red-50',
    shadow: 'shadow-red-500/30'
  },
  orange: { 
    gradient: 'from-orange-400 via-orange-500 to-red-600', 
    text: 'text-orange-800',
    ring: 'ring-orange-100',
    iconBg: 'bg-orange-50',
    shadow: 'shadow-orange-500/30'
  },
  cyan: { 
    gradient: 'from-cyan-400 via-cyan-500 to-blue-700', 
    text: 'text-cyan-800',
    ring: 'ring-cyan-100',
    iconBg: 'bg-cyan-50',
    shadow: 'shadow-cyan-500/30'
  },
  slate: { 
    gradient: 'from-slate-400 via-slate-600 to-slate-800', 
    text: 'text-slate-800',
    ring: 'ring-slate-100',
    iconBg: 'bg-slate-50',
    shadow: 'shadow-slate-500/30'
  },
};

type Orientation = 'portrait' | 'landscape';

const CertificateGenerator: React.FC = () => {
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  
  // Unified List of Recipients
  const [recipients, setRecipients] = useState<BulkCertificateData[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [checkedIndices, setCheckedIndices] = useState<Set<number>>(new Set());

  // Global Settings
  const [globalTeacherName, setGlobalTeacherName] = useState<string>('');
  const [globalDate, setGlobalDate] = useState<string>(
    new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  );

  // Bulk Processing State
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, type: '' });
  
  // UI states
  const [previewScale, setPreviewScale] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const certificateRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const DIMENSIONS = {
    portrait: { w: 400, h: 640 },
    landscape: { w: 640, h: 400 }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update scale when orientation changes or mounted
  useEffect(() => {
    if (!previewContainerRef.current) return;

    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.offsetWidth;
        const targetWidth = orientation === 'portrait' ? 400 : 640;
        const availableWidth = containerWidth - 48; 
        const scale = Math.min(1, Math.max(0.1, availableWidth / targetWidth));
        setPreviewScale(scale);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    resizeObserver.observe(previewContainerRef.current);
    updateScale();

    return () => resizeObserver.disconnect();
  }, [orientation, mounted, recipients.length]);

  // Handle addition of new students from InputSection (Excel, Manual, or Class Selection)
  const handleStudentsLoaded = (newStudents: Student[]) => {
    const mapped: BulkCertificateData[] = newStudents.map(student => {
      const grade: CertificateGrade = 'B';
      const themeColor: CertificateThemeColor = 'emerald';
      return {
        studentName: student.name || '',
        studentClass: student.classId || '',
        grade,
        themeColor,
        gradeDisplay: 'Baik',
        awardArea: 'Partisipasi Aktif',
        specificQuote: '',
        generatedMessage: generateCertificateMessage(grade, student.name || '', 'Partisipasi Aktif', ''),
      };
    });

    setRecipients(prev => {
      const startIdx = prev.length;
      const next = [...prev, ...mapped];

      // Auto-check new items
      setCheckedIndices(current => {
        const updated = new Set(current);
        for (let i = startIdx; i < next.length; i++) {
          updated.add(i);
        }
        return updated;
      });

      return next;
    });

    if (recipients.length === 0 && mapped.length > 0) {
      setActiveIndex(0);
    } else if (mapped.length > 0) {
      setActiveIndex(recipients.length);
    }
  };

  const handleReset = () => {
    setRecipients([]);
    setActiveIndex(0);
    setCheckedIndices(new Set());
  };

  const handleRemoveRecipient = (idxToRemove: number) => {
    setRecipients(prev => {
      const next = prev.filter((_, i) => i !== idxToRemove);
      
      // Adjust active index
      if (activeIndex >= next.length && next.length > 0) {
        setActiveIndex(next.length - 1);
      } else if (next.length === 0) {
        setActiveIndex(0);
      }
      
      return next;
    });

    setCheckedIndices(current => {
      const updated = new Set<number>();
      current.forEach(idx => {
        if (idx < idxToRemove) {
          updated.add(idx);
        } else if (idx > idxToRemove) {
          updated.add(idx - 1); // shift down index
        }
      });
      return updated;
    });
  };

  const handleToggleCheck = (idx: number) => {
    setCheckedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleToggleCheckAll = () => {
    if (checkedIndices.size === recipients.length) {
      setCheckedIndices(new Set());
    } else {
      const all = new Set<number>();
      recipients.forEach((_, i) => all.add(i));
      setCheckedIndices(all);
    }
  };

  // Helper to update fields of active recipient
  const updateActiveRecipient = (field: keyof BulkCertificateData, value: any) => {
    setRecipients(prev => {
      if (prev.length === 0 || !prev[activeIndex]) return prev;
      const next = [...prev];
      const updatedItem = { ...next[activeIndex], [field]: value };
      
      // Regenerate message if relevant fields change
      if (field === 'grade' || field === 'studentName' || field === 'awardArea' || field === 'specificQuote') {
        updatedItem.generatedMessage = generateCertificateMessage(
          updatedItem.grade,
          updatedItem.studentName,
          updatedItem.awardArea,
          updatedItem.specificQuote
        );
      }

      next[activeIndex] = updatedItem;
      return next;
    });
  };

  const handleGradeChange = (grade: CertificateGrade) => {
    let defaultColor: CertificateThemeColor = 'emerald';
    let defaultText = 'Baik';

    if (grade === 'A') {
      defaultColor = 'blue';
      defaultText = 'Sangat Baik';
    } else if (grade === 'S') {
      defaultColor = 'yellow';
      defaultText = 'Luar Biasa';
    }

    setRecipients(prev => {
      if (prev.length === 0 || !prev[activeIndex]) return prev;
      const next = [...prev];
      const updatedItem = { 
        ...next[activeIndex], 
        grade, 
        themeColor: defaultColor, 
        gradeDisplay: defaultText 
      };

      updatedItem.generatedMessage = generateCertificateMessage(
        grade,
        updatedItem.studentName,
        updatedItem.awardArea,
        updatedItem.specificQuote
      );

      next[activeIndex] = updatedItem;
      return next;
    });
  };

  const captureHighQuality = async (
    element: HTMLElement, 
    mimeType: string = 'image/png', 
    quality: number = 1.0
  ): Promise<string> => {
    const currentDim = DIMENSIONS[orientation];
    
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.transform = 'none';
    clone.style.margin = '0';
    clone.style.position = 'fixed';
    clone.style.top = '-10000px';
    clone.style.left = '-10000px';
    clone.style.zIndex = '-9999';
    clone.style.width = `${currentDim.w}px`; 
    clone.style.height = `${currentDim.h}px`;

    document.body.appendChild(clone);

    try {
      await document.fonts.ready;
      const canvas = await html2canvas(clone, { 
        scale: 2.5, 
        useCORS: true,
        backgroundColor: null,
        logging: false,
        width: currentDim.w,
        height: currentDim.h,
        windowWidth: currentDim.w,
        windowHeight: currentDim.h
      });
      return canvas.toDataURL(mimeType, quality);
    } catch (error) {
      console.error("Capture failed:", error);
      throw error;
    } finally {
      document.body.removeChild(clone);
    }
  };

  const processBulkItems = async (
    onItemProcessed: (imgData: string, item: BulkCertificateData, index: number) => Promise<void>,
    mimeType: string = 'image/png',
    quality: number = 1.0
  ) => {
    const checkedItems = recipients.filter((_, i) => checkedIndices.has(i));
    if (checkedItems.length === 0 || !certificateRef.current) return;
    
    const originalIndex = activeIndex;
    
    try {
      let count = 0;
      for (let i = 0; i < recipients.length; i++) {
        if (!checkedIndices.has(i)) continue;
        const item = recipients[i];
        
        setActiveIndex(i);
        await new Promise(resolve => setTimeout(resolve, 200)); 
        
        if (certificateRef.current) {
          const imgData = await captureHighQuality(certificateRef.current, mimeType, quality);
          await onItemProcessed(imgData, item, count);
        }
        
        count++;
        setBulkProgress(prev => ({ ...prev, current: count }));
      }
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setActiveIndex(originalIndex);
    }
  };

  const processBulkPDF = async () => {
    const checkedCount = checkedIndices.size;
    if (checkedCount === 0) {
      alert("Pilih minimal satu penerima.");
      return;
    }

    setIsProcessingBulk(true);
    setBulkProgress({ current: 0, total: checkedCount, type: 'PDF' });
    try {
      const pdf = new jsPDF(orientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let imgWidth, imgHeight;
      if (orientation === 'landscape') {
        imgWidth = 280;
        imgHeight = (400/640) * imgWidth;
      } else {
        imgWidth = 140;
        imgHeight = (640/400) * imgWidth;
      }
      
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      await processBulkItems(async (imgData, item, index) => {
        if (index > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
      }, 'image/jpeg', 0.85);

      pdf.save('Sertifikat-Gabungan.pdf');
    } catch (error) {
      alert("Gagal memproses PDF.");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const processBulkZIP = async () => {
    const checkedCount = checkedIndices.size;
    if (checkedCount === 0) {
      alert("Pilih minimal satu penerima.");
      return;
    }

    setIsProcessingBulk(true);
    setBulkProgress({ current: 0, total: checkedCount, type: 'ZIP' });
    try {
      const zip = new JSZip();
      const folder = zip.folder("Sertifikat_PNG");
      await processBulkItems(async (imgData, item, index) => {
        const base64Data = imgData.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
        const safeName = item.studentName.replace(/[^a-zA-Z0-9 ]/g, '_').trim();
        const fileName = `Sertifikat-${safeName || 'Siswa'}-${index + 1}.png`;
        folder?.file(fileName, base64Data, { base64: true });
      }, 'image/png', 1.0);
      const content = await zip.generateAsync({ type: "blob" });
      robustSaveAs(content, 'Sertifikat-Massal.zip');
    } catch (error) {
      console.error(error);
      alert("Gagal memproses ZIP.");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!certificateRef.current || recipients.length === 0) return;
    setIsGenerating(true);
    try {
      const activeRecipient = recipients[activeIndex];
      const image = await captureHighQuality(certificateRef.current, 'image/png');
      const a = document.createElement("a");
      a.href = image;
      a.download = `Sertifikat-${activeRecipient.studentName || 'Siswa'}.png`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 100);
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh gambar.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!certificateRef.current || recipients.length === 0) return;
    setIsGenerating(true);
    try {
      const activeRecipient = recipients[activeIndex];
      const imgData = await captureHighQuality(certificateRef.current, 'image/jpeg', 0.85);
      const pdf = new jsPDF(orientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let imgWidth, imgHeight;
      if (orientation === 'landscape') {
        imgWidth = 280;
        imgHeight = (400/640) * imgWidth;
      } else {
        imgWidth = 140;
        imgHeight = (640/400) * imgWidth;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;
      
      pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
      pdf.save(`Sertifikat-${activeRecipient.studentName || 'Siswa'}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareToWhatsApp = async () => {
    if (!certificateRef.current || recipients.length === 0) return;
    setIsGenerating(true);
    try {
      const activeRecipient = recipients[activeIndex];
      const dataUrl = await captureHighQuality(certificateRef.current, 'image/png');
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `Sertifikat-${activeRecipient.studentName || 'siswa'}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Sertifikat Penghargaan',
          text: `Selamat kepada ${activeRecipient.studentName} atas pencapaiannya!`,
        });
      } else {
        try {
          const clipboardItem = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([clipboardItem]);
          alert("Gambar telah disalin ke Clipboard! \n\nSilakan buka WhatsApp Web dan tekan Paste (Ctrl+V) di chat.");
        } catch (clipErr) {
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `Sertifikat-${activeRecipient.studentName || 'Siswa'}.png`;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => document.body.removeChild(link), 100);
          alert("Perangkat tidak mendukung share. Gambar diunduh, silakan kirim manual.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Gagal memproses gambar untuk dibagikan.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Safe checks for previewed item
  const activeRecipient: BulkCertificateData | undefined = recipients[activeIndex];
  
  const currentGradeConfig = activeRecipient
    ? ({
        B: { icon: ThumbsUp, label: 'Certificate of Excellence' },
        A: { icon: Star, label: 'Certificate of Achievement' },
        S: { icon: Crown, label: 'Certificate of Mastery' }
      }[activeRecipient.grade] || { icon: ThumbsUp, label: 'Certificate of Excellence' })
    : { icon: ThumbsUp, label: 'Certificate of Excellence' };

  const themeStyle = activeRecipient
    ? (COLOR_THEMES[activeRecipient.themeColor || 'emerald'] || COLOR_THEMES.emerald)
    : COLOR_THEMES.emerald;

  const ThemeIcon = currentGradeConfig.icon;
  const isCustomAward = activeRecipient && !AWARD_AREAS.filter(a => a !== 'Lainnya').includes(activeRecipient.awardArea);

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Input & List */}
        <div className="lg:col-span-5 space-y-6 w-full">
          
          {/* Main Input Source Section */}
          <InputSection 
            onStudentsLoaded={handleStudentsLoaded} 
            currentCount={recipients.length}
            title="Tambah Penerima"
            colorTheme="blue"
            showClassSelector={true}
          />

          {/* Antrean Penerima (Queue list) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1D4ED8]" />
                <h3 className="font-bold text-[#3B66F5] text-sm">
                  Antrean Penerima ({recipients.length})
                </h3>
              </div>
              {recipients.length > 0 && (
                <button 
                  onClick={handleReset} 
                  className="text-xs text-red-650 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-red-600" /> Bersihkan Semua
                </button>
              )}
            </div>

            <div className="p-4 space-y-3">
              {recipients.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                  Antrean kosong. Tambahkan siswa dari kelas, manual, atau Excel di atas.
                </div>
              ) : (
                <>
                  {/* Select All Checkbox */}
                  <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 pb-2">
                    <input 
                      type="checkbox"
                      checked={checkedIndices.size === recipients.length && recipients.length > 0}
                      onChange={handleToggleCheckAll}
                      className="w-4 h-4 rounded text-[#1D4ED8] focus:ring-[#3B66F5]/20 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-500">Pilih Semua untuk Ekspor Massal</span>
                  </div>

                  {/* Scrollable Recipient List */}
                  <div className="max-h-[250px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {recipients.map((rec, i) => {
                      const isActive = i === activeIndex;
                      const isChecked = checkedIndices.has(i);
                      return (
                        <div 
                          key={i} 
                          onClick={() => setActiveIndex(i)}
                          className={`
                            group flex items-center justify-between p-2 rounded-xl border text-sm transition-all cursor-pointer
                            ${isActive 
                              ? 'bg-[#3B66F5]/5 border-[#3B66F5] text-[#3B66F5] font-bold shadow-sm' 
                              : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 truncate min-w-0" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCheck(i)}
                              className="w-4 h-4 rounded text-[#1D4ED8] focus:ring-[#3B66F5]/20 cursor-pointer"
                            />
                            <div className="truncate text-left">
                              <span className="font-semibold text-slate-800 truncate block">{rec.studentName}</span>
                              <span className="text-[10px] text-slate-400 font-medium tracking-wide block">{rec.studentClass || 'Tanpa Kelas'}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                              rec.grade === 'S' 
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                                : rec.grade === 'A' 
                                  ? 'bg-[#3B66F5]/5 text-blue-700 border-[#3B66F5]/30' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {rec.gradeDisplay || rec.grade}
                            </span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRemoveRecipient(i); }}
                              className="p-1 rounded text-slate-400 hover:text-red-650 hover:bg-slate-200 group-hover:opacity-100 transition-all cursor-pointer"
                              title="Hapus dari antrean"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* General Shared Settings */}
                  <div className="pt-4 mt-2 border-t border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pengaturan Bersama</h4>
                    
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Orientasi Hasil Unduh</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setOrientation('portrait')}
                          className={`py-1.5 px-3 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            orientation === 'portrait'
                              ? 'border-[#3B66F5] bg-[#3B66F5]/10 text-[#3B66F5] font-bold shadow-sm'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <MoveVertical className="w-3.5 h-3.5" /> Portrait
                        </button>
                        <button
                          onClick={() => setOrientation('landscape')}
                          className={`py-1.5 px-3 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            orientation === 'landscape'
                              ? 'border-[#3B66F5] bg-[#3B66F5]/10 text-[#3B66F5] font-bold shadow-sm'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          <MoveHorizontal className="w-3.5 h-3.5" /> Landscape
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-550 block mb-1">NAMA GURU TANDA TANGAN</label>
                        <input 
                          type="text" 
                          value={globalTeacherName}
                          onChange={(e) => setGlobalTeacherName(e.target.value)}
                          placeholder="Nama Guru"
                          className="w-full p-2 text-xs border border-slate-350 rounded-md focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] bg-white text-slate-800 transition-colors outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-550 block mb-1">TANGGAL SURAT</label>
                        <input 
                          type="text" 
                          value={globalDate}
                          onChange={(e) => setGlobalDate(e.target.value)}
                          placeholder="13 Juli 2026"
                          className="w-full p-2 text-xs border border-slate-350 rounded-md focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] bg-white text-slate-800 transition-colors outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bulk Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex justify-between items-center text-xs text-slate-650 font-semibold mb-1">
                      <span>Penerima Terpilih untuk Ekspor:</span>
                      <span className="font-bold text-[#3B66F5]">{checkedIndices.size} Siswa</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={processBulkPDF}
                        disabled={isProcessingBulk || checkedIndices.size === 0}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-slate-350 text-slate-850 font-bold rounded-full hover:bg-slate-50 shadow-sm disabled:opacity-40 transition-all text-xs cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-slate-550" />
                        PDF Gabungan ({checkedIndices.size})
                      </button>
                      <button
                        onClick={processBulkZIP}
                        disabled={isProcessingBulk || checkedIndices.size === 0}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] disabled:bg-slate-200 text-white font-bold rounded-full hover:brightness-110 shadow-md disabled:opacity-40 transition-all text-xs cursor-pointer border border-white/10"
                      >
                        <Package className="w-4 h-4 text-white" />
                        ZIP PNG ({checkedIndices.size})
                      </button>
                    </div>

                    {isProcessingBulk && (
                      <div className="animate-in fade-in pt-2">
                        <div className="flex justify-between text-[10px] text-slate-600 mb-1 font-semibold">
                          <span>Membuat Berkas {bulkProgress.type}...</span>
                          <span>{bulkProgress.current} / {bulkProgress.total}</span>
                        </div>
                        <div className="w-full bg-slate-205 rounded-full h-1.5">
                          <div 
                            className="bg-[#3B66F5] h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Preview & Detail Editor */}
        <div className="lg:col-span-7 flex flex-col items-center pb-8 w-full">
          {!activeRecipient ? (
            /* EMPTY STATE */
            <div className="bg-white rounded-3xl p-12 border border-slate-200 w-full flex flex-col items-center justify-center min-h-[500px] text-center shadow-md">
              <div className="w-20 h-20 rounded-2xl bg-[#3B66F5]/10 border border-[#3B66F5]/20 flex items-center justify-center mb-6">
                <Award className="w-10 h-10 text-[#3B66F5]" />
              </div>
              <h3 className="text-xl font-bold text-[#3B66F5] mb-2">Editor Pratinjau Sertifikat</h3>
              <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                Pilih atau tambahkan penerima di sebelah kiri untuk melihat desain pratinjau sertifikat, menyesuaikan tema warna, grade penghargaan, dan mengunduh berkas.
              </p>
            </div>
          ) : (
            /* PREVIEW & EDITOR ACTIVE STATE */
            <div className="w-full flex flex-col items-center gap-6">
              
              {/* Outer Preview Box */}
              <div className="bg-slate-100/60 p-4 sm:p-6 rounded-xl border border-slate-200 w-full flex flex-col items-center min-h-[460px] overflow-hidden relative">
                
                <div className="w-full flex justify-between items-center mb-3 max-w-[640px] px-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span>Pratinjau: {activeRecipient.studentName}</span>
                  <span className="font-mono">Penerima #{activeIndex + 1}</span>
                </div>

                {/* === MASTER LAYOUT START === */}
                <div className="relative w-full flex justify-center flex-1 items-center">
                  <div 
                    className="origin-top transition-transform duration-300 animate-in zoom-in-95"
                    style={{ transform: `scale(${previewScale})` }}
                  >
                    <div 
                      ref={certificateRef}
                      className="relative shadow-2xl overflow-hidden flex-shrink-0 flex flex-col select-none bg-white text-slate-800 border border-slate-100"
                      style={{ 
                        width: `${DIMENSIONS[orientation].w}px`,
                        height: `${DIMENSIONS[orientation].h}px`,
                        fontFamily: "'Outfit', sans-serif" 
                      }} 
                    >
                      {orientation === 'portrait' ? (
                        /* --- PORTRAIT LAYOUT --- */
                        <>
                          <div className={`w-full h-[180px] bg-gradient-to-br ${themeStyle.gradient} relative p-6 flex flex-col justify-between overflow-hidden`}>
                            <div className="absolute top-[-30px] left-[-30px] w-40 h-40 bg-white opacity-10 rounded-full pointer-events-none"></div>
                            <div className="absolute bottom-[-30px] right-[-20px] w-32 h-32 bg-black opacity-5 rounded-full pointer-events-none"></div>

                            <div className="flex justify-between items-start z-10 relative">
                              <h1 className="text-4xl font-black text-white uppercase tracking-tight leading-none drop-shadow-sm">
                                {activeRecipient.gradeDisplay || activeRecipient.grade}
                              </h1>
                              <div className="text-right text-white/90">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">Certificate</p>
                                <p className="text-[8px] uppercase tracking-wider opacity-80">of Appreciation</p>
                              </div>
                            </div>
                          </div>

                          <div className="relative -mt-12 flex justify-center z-20">
                            <div className="w-24 h-24 rounded-full bg-white p-1.5 shadow-lg">
                              <div className={`w-full h-full rounded-full ${themeStyle.iconBg} flex items-center justify-center border border-slate-100`}>
                                <ThemeIcon className={`w-10 h-10 ${themeStyle.text}`} strokeWidth={1.5} />
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 px-8 pt-4 pb-8 flex flex-col items-center text-center">
                            <div className="flex items-center gap-2 mb-6 opacity-40">
                              <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${themeStyle.gradient}`}></div>
                              <div className={`h-1.5 w-2 rounded-full bg-slate-300`}></div>
                              <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${themeStyle.gradient}`}></div>
                            </div>

                            <h2 className="text-3xl font-black text-slate-800 leading-tight mb-2">
                              {activeRecipient.studentName || "Nama Siswa"}
                            </h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-8">
                              {activeRecipient.studentClass || "Kelas"}
                            </p>

                            <div className="mb-4 flex justify-center items-center">
                              <h3 className={`text-sm font-bold uppercase tracking-widest ${themeStyle.text} leading-none mt-[1px]`}>
                                {activeRecipient.awardArea}
                              </h3>
                            </div>

                            <div className="flex-1 flex items-center justify-center">
                              <p className="text-sm text-slate-500 italic font-medium leading-relaxed">
                                "{activeRecipient.generatedMessage}"
                              </p>
                            </div>

                            <div className="w-full mt-auto flex flex-col items-center gap-2 pb-2">
                              <div className="flex flex-col items-center mb-4">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Tanggal</p>
                                <p className="text-sm font-bold text-slate-800">{activeRecipient.date || globalDate}</p>
                              </div>
                              
                              <div className="flex flex-col items-center w-72 relative pt-2">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">Guru Kelas</p>
                                <div className="w-full text-center">
                                  <p className="text-sm font-bold text-slate-800">{activeRecipient.teacherName || globalTeacherName || "Nama Guru"}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* --- LANDSCAPE LAYOUT --- */
                        <div className="flex w-full h-full">
                          <div className={`w-[200px] h-full bg-gradient-to-b ${themeStyle.gradient} relative p-6 flex flex-col justify-between`}>
                            <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-white opacity-10 rounded-full pointer-events-none"></div>
                            <div className="absolute bottom-[20px] right-[-40px] w-32 h-32 bg-black opacity-5 rounded-full pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col items-center">
                              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm p-1 shadow-lg mb-4">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                  <ThemeIcon className={`w-10 h-10 ${themeStyle.text}`} strokeWidth={1.5} />
                                </div>
                              </div>
                              <h1 className="text-3xl font-black text-white text-center uppercase leading-none drop-shadow-sm">
                                {activeRecipient.gradeDisplay || activeRecipient.grade}
                              </h1>
                            </div>

                            <div className="relative z-10 flex flex-col items-center justify-end flex-1 pb-6">
                              <div className="text-center w-full border-t border-white/20 pt-4 mx-4">
                                <p className="text-xs font-bold text-white uppercase tracking-[0.15em] leading-relaxed">
                                  Certificate
                                </p>
                                <p className="text-[10px] font-medium text-white/70 uppercase tracking-widest">
                                  of Appreciation
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 p-10 flex flex-col relative">
                            <div className="absolute top-10 right-10 opacity-5 pointer-events-none">
                              <Award className="w-64 h-64 text-slate-900" />
                            </div>

                            <div className="flex justify-between items-start mb-8">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Diberikan Kepada</span>
                                <h2 className="text-4xl font-black text-slate-800 leading-tight">
                                  {activeRecipient.studentName || "Nama Siswa"}
                                </h2>
                                <p className="text-sm font-semibold text-slate-500 mt-1">
                                  {activeRecipient.studentClass || "Kelas"}
                                </p>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${themeStyle.iconBg} ${themeStyle.text}`}>
                                  {activeRecipient.awardArea}
                                </span>
                              </div>
                            </div>

                            <div className="flex-1 border-l-4 border-slate-100 pl-6 flex items-center">
                              <p className="text-base text-slate-600 italic font-medium leading-relaxed max-w-md">
                                "{activeRecipient.generatedMessage}"
                              </p>
                            </div>

                            <div className="mt-8 flex justify-between items-end border-t border-slate-100 pt-4">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Tanggal</p>
                                <p className="text-sm font-bold text-slate-800">{activeRecipient.date || globalDate}</p>
                              </div>
                              <div className="flex flex-col items-end min-w-[200px]">
                                <div className="mb-4 h-8"></div>
                                <p className="text-sm font-bold text-slate-800 border-t border-slate-300 pt-2 w-full text-right">{activeRecipient.teacherName || globalTeacherName || "Nama Guru"}</p>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Guru Kelas</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* === MASTER LAYOUT END === */}

              </div>

              {/* Single Export Toolbar (Under Preview) */}
              <div className="w-full grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl shadow-inner">
                <button
                  onClick={handleShareToWhatsApp}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-green-550 hover:bg-green-600 text-white text-xs font-bold rounded-full shadow-sm transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-white" /> WhatsApp
                </button>
                <button
                  onClick={handleDownloadImage}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-350 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-full shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> Unduh PNG
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] hover:brightness-110 border border-white/10 text-white text-xs font-bold rounded-full shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-white" /> Unduh PDF
                </button>
              </div>

              {/* Editor Panel for Current Recipient */}
              <div className="bg-white rounded-2xl border border-slate-200 w-full p-6 text-left shadow-sm space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Edit3 className="w-5 h-5 text-[#3B66F5]" />
                  <h3 className="font-bold text-[#3B66F5] text-sm">Sesuaikan Detail Penerima Aktif</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-550 block mb-1">NAMA SISWA</label>
                    <input 
                      type="text" 
                      value={activeRecipient.studentName}
                      onChange={(e) => updateActiveRecipient('studentName', e.target.value)}
                      placeholder="Budi Santoso"
                      className="w-full p-2 border border-slate-350 rounded-md focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] bg-white text-slate-800 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-550 block mb-1">KELAS / JURUSAN</label>
                    <input 
                      type="text" 
                      value={activeRecipient.studentClass}
                      onChange={(e) => updateActiveRecipient('studentClass', e.target.value)}
                      placeholder="XII IPA 1"
                      className="w-full p-2 border border-slate-350 rounded-md focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] bg-white text-slate-800 text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Grade Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-550 block mb-2">TINGKAT PENGHARGAAN (GRADE)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleGradeChange('B')}
                      className={`p-2 rounded-lg border-2 flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        activeRecipient.grade === 'B' 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold' 
                          : 'border-slate-200 text-slate-500 hover:border-emerald-250'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-[10px]">Baik</span>
                    </button>
                    <button
                      onClick={() => handleGradeChange('A')}
                      className={`p-2 rounded-lg border-2 flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        activeRecipient.grade === 'A' 
                          ? 'border-blue-600 bg-[#3B66F5]/5 text-blue-700 font-bold' 
                          : 'border-slate-200 text-slate-500 hover:border-blue-250'
                      }`}
                    >
                      <Star className="w-4 h-4 text-[#3B66F5]" />
                      <span className="text-[10px]">Sangat Baik</span>
                    </button>
                    <button
                      onClick={() => handleGradeChange('S')}
                      className={`p-2 rounded-lg border-2 flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        activeRecipient.grade === 'S' 
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700 font-bold' 
                          : 'border-slate-200 text-slate-500 hover:border-yellow-250'
                      }`}
                    >
                      <Crown className="w-4 h-4 text-yellow-600" />
                      <span className="text-[10px]">Luar Biasa</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-100">
                  {/* Custom Teks Grade */}
                  <div>
                    <label className="text-xs font-bold text-slate-550 block mb-1">TEKS TAMPILAN GRADE</label>
                    <input 
                      type="text" 
                      value={activeRecipient.gradeDisplay || activeRecipient.grade}
                      onChange={(e) => updateActiveRecipient('gradeDisplay', e.target.value)}
                      placeholder="Baik, TOP, A+"
                      className="w-full p-2 border border-slate-350 rounded-md focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] bg-white text-slate-800 text-sm outline-none"
                    />
                  </div>

                  {/* Color Themes */}
                  <div>
                    <label className="text-xs font-bold text-slate-550 block mb-1.5">TEMA WARNA (GRADASI)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(COLOR_THEMES) as CertificateThemeColor[]).map((c) => {
                        const style = COLOR_THEMES[c];
                        const isSelected = activeRecipient.themeColor === c;
                        return (
                          <button
                            key={c}
                            onClick={() => updateActiveRecipient('themeColor', c)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all bg-gradient-to-br ${style.gradient} ${isSelected ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'opacity-80 hover:opacity-100'} cursor-pointer`}
                            title={c}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" strokeWidth={3} />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Award Area Details */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-bold text-slate-550 block mb-1">AREA PENGHARGAAN</label>
                    <div className="space-y-2">
                      <select 
                        value={isCustomAward ? 'Lainnya' : activeRecipient.awardArea}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'Lainnya') {
                            updateActiveRecipient('awardArea', '');
                          } else {
                            updateActiveRecipient('awardArea', val);
                          }
                        }}
                        className="w-full p-2 border border-slate-350 rounded-md focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] bg-white text-slate-800 text-sm outline-none cursor-pointer"
                      >
                        {AWARD_AREAS.filter(a => a !== 'Lainnya').map(area => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                        <option value="Lainnya">Kustom / Lainnya...</option>
                      </select>

                      {isCustomAward && (
                        <div className="animate-in fade-in slide-in-from-top-1">
                          <div className="relative">
                            <Edit3 className="absolute left-3 top-2.5 w-4 h-4 text-[#3B66F5]" />
                            <input 
                              type="text"
                              value={activeRecipient.awardArea === 'Lainnya' ? '' : activeRecipient.awardArea}
                              onChange={(e) => updateActiveRecipient('awardArea', e.target.value)}
                              placeholder="Ketik judul penghargaan..."
                              className="w-full pl-9 p-2 border border-indigo-300 rounded-md focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] bg-[#3B66F5]/10 text-slate-850 text-sm outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-550 block mb-1">ALASAN SPESIFIK / KUTIPAN KHUSUS</label>
                    <textarea 
                      value={activeRecipient.specificQuote}
                      onChange={(e) => updateActiveRecipient('specificQuote', e.target.value)}
                      placeholder="Contoh: berhasil memecahkan soal tersulit..."
                      rows={3}
                      className="w-full p-2 border border-slate-350 rounded-md focus:ring-2 focus:ring-[#3B66F5]/15 focus:border-[#3B66F5] text-sm bg-white text-slate-850 outline-none resize-none"
                    />
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CertificateGenerator;
