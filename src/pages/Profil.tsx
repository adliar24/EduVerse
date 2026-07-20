import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Camera,
  Loader2,
  CheckCircle2,
  Mail,
  BookOpen,
  ChevronRight,
  LogOut,
  Trash2,
  AlertTriangle,
  School,
  Building2,
  Plus,
  X,
  Check,
  ChevronDown,
  Calendar,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useRef } from 'react';
import { cn } from '../lib/utils';
import { useAlert } from '../context/AlertContext';
import { useSchool } from '../context/SchoolContext';

const SUBJECT_LEVELS = ['UMUM'];

const ACADEMIC_YEARS = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    years.push(`${i}/${i + 1}`);
  }
  return years;
};

const SEMESTERS = ['Ganjil', 'Genap'];

import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Profil() {
  useDocumentTitle('Profil Saya');
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentCode, setStudentCode] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const { showAlert } = useAlert();
  const { refreshSchools, setActiveSchool } = useSchool();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    email: '',
    role: 'guru'
  });

  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [availableSchools, setAvailableSchools] = useState<any[]>([]);
  
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolAddress, setNewSchoolAddress] = useState('');
  const [newCustomSubject, setNewCustomSubject] = useState('');
  const [newCustomSubjectLevel, setNewCustomSubjectLevel] = useState('UMUM');
  
  const [schoolDropdownOpen, setSchoolDropdownOpen] = useState(false);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('SEMUA');
  
  const schoolRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();

    const handleClickOutside = (event: MouseEvent) => {
      if (schoolRef.current && !schoolRef.current.contains(event.target as Node)) {
        setSchoolDropdownOpen(false);
      }
      if (subjectRef.current && !subjectRef.current.contains(event.target as Node)) {
        setSubjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    try {
      const studentSessionStr = localStorage.getItem('student_session');
      if (studentSessionStr) {
        const studentObj = JSON.parse(studentSessionStr);
        const { data: studentDb, error: dbErr } = await supabase
          .from('students')
          .select('*, classes!students_class_id_fkey(name), schools(name)')
          .eq('id', studentObj.id)
          .maybeSingle();

        if (studentDb) {
          setProfile({
            id: studentDb.id,
            role: 'siswa',
            email: studentDb.student_code,
            user_metadata: { role: 'siswa', name: studentDb.name }
          });
          setFormData({
            name: studentDb.name,
            subject: studentDb.classes?.name || 'Belum ada kelas',
            email: studentDb.student_code,
            role: 'siswa'
          });
          setSchoolName(studentDb.schools?.name || 'EDUVERSE ACADEMY');
          setStudentCode(studentDb.student_code);
          setStudentPassword(studentDb.password || 'murid19');
          setLoading(false);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const userMetadata = user.user_metadata;
      setProfile(user);
      setFormData({
        name: userMetadata?.name || '',
        subject: userMetadata?.subject || '',
        email: user.email || '',
        role: userMetadata?.role || 'guru'
      });

      // Load subjects and schools
      const [subjectsRes, schoolsRes, teacherSchoolsRes, teacherSubjectsRes] = await Promise.all([
        supabase.from('subjects').select('*').order('level, name'),
        supabase.from('schools').select('*').order('name'),
        supabase.from('teacher_schools').select('school_id, academic_year, semester, schools(id, name, address)').eq('teacher_id', user.id),
        supabase.from('teacher_subjects').select('subject_id').eq('teacher_id', user.id)
      ]);

      if (subjectsRes.data) {
        const uniqueSubjects = subjectsRes.data.filter((subject, index, self) => 
          index === self.findIndex(s => s.name.toLowerCase() === subject.name.toLowerCase())
        );
        setAllSubjects(uniqueSubjects);
      }
      if (schoolsRes.data) setAvailableSchools(schoolsRes.data);

      if (teacherSchoolsRes.data && teacherSchoolsRes.data.length > 0) {
        const schoolIds = teacherSchoolsRes.data.map(s => s.school_id);
        setSelectedSchoolIds(schoolIds);
        
        // Extract school objects from the join
        const linkedSchools = teacherSchoolsRes.data
          .map(ts => {
            const s = (ts as any).schools;
            return Array.isArray(s) ? s[0] : s;
          })
          .filter(Boolean);
          
        setSchools(linkedSchools);
        
        if (teacherSchoolsRes.data[0].academic_year) {
          setAcademicYear(teacherSchoolsRes.data[0].academic_year);
        }
        if (teacherSchoolsRes.data[0].semester) {
          setSemester(teacherSchoolsRes.data[0].semester);
        }
      }

      if (teacherSubjectsRes.data) {
        const subjectIds = [...new Set(teacherSubjectsRes.data.map(s => s.subject_id))];
        setSelectedSubjectIds(subjectIds);
        const filteredSubjects = (subjectsRes.data || []).filter(s => subjectIds.includes(s.id));
        const uniqueFilteredSubjects = filteredSubjects.filter((subject, index, self) => 
          index === self.findIndex(s => s.name.toLowerCase() === subject.name.toLowerCase())
        );
        setSubjects(uniqueFilteredSubjects);
      }
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleAddSchool = async () => {
    if (!newSchoolName.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: newSchool, error: schoolError } = await supabase
        .from('schools')
        .insert({ 
          name: newSchoolName.trim(), 
          address: newSchoolAddress.trim() || null
        })
        .select()
        .single();

      if (schoolError) throw schoolError;

      if (newSchool) {
        setAvailableSchools(prev => [...prev, newSchool]);
        setSelectedSchoolIds(prev => [...prev, newSchool.id]);
        setSchools(prev => [...prev, newSchool]);
        
        await supabase
          .from('teacher_schools')
          .insert({ 
            teacher_id: user.id, 
            school_id: newSchool.id,
            academic_year: academicYear || null,
            semester: semester || null
          });

        // Update global school context
        await refreshSchools();
        await setActiveSchool(newSchool);
      }
      setNewSchoolName('');
      setNewSchoolAddress('');
      setSchoolDropdownOpen(false);
      showAlert({ title: 'Berhasil', message: 'Sekolah baru berhasil ditambahkan dan diaktifkan.', type: 'success' });
    } catch (error: any) {
      console.error('Error adding school:', error);
      showAlert({ title: 'Gagal', message: 'Gagal menambah sekolah baru.', type: 'error' });
    }
  };

  const handleToggleSchool = async (school: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (selectedSchoolIds.includes(school.id)) {
        await supabase
          .from('teacher_schools')
          .delete()
          .eq('teacher_id', user.id)
          .eq('school_id', school.id);

        setSelectedSchoolIds(selectedSchoolIds.filter(id => id !== school.id));
        setSchools(schools.filter(s => s.id !== school.id));

        // Sync with global context
        await refreshSchools();
      } else {
        await supabase
          .from('teacher_schools')
          .insert({ 
            teacher_id: user.id, 
            school_id: school.id,
            academic_year: academicYear || null,
            semester: semester || null
          });
          
        setSelectedSchoolIds([...selectedSchoolIds, school.id]);
        setSchools([...schools, school]);

        // Sync with global context
        await refreshSchools();
      }
    } catch (error) {
      console.error('Error toggling school:', error);
    }
  };

  const handleRemoveSchool = async (schoolId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('teacher_schools')
        .delete()
        .eq('teacher_id', user.id)
        .eq('school_id', schoolId);

      setSelectedSchoolIds(selectedSchoolIds.filter(id => id !== schoolId));
      setSchools(schools.filter(s => s.id !== schoolId));
    } catch (error) {
      console.error('Error removing school:', error);
    }
  };

  const handleAddCustomSubject = async () => {
    if (!newCustomSubject.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: newSubject, error } = await supabase
        .from('subjects')
        .insert({ 
          name: newCustomSubject.trim(), 
          level: newCustomSubjectLevel,
          is_custom: true
        })
        .select()
        .single();

      if (error) throw error;
      if (newSubject) {
        setAllSubjects(prev => [...prev, newSubject]);
        setSelectedSubjectIds(prev => [...prev, newSubject.id]);
        setSubjects(prev => [...prev, newSubject]);
        await supabase.from('teacher_subjects').insert({ teacher_id: user.id, subject_id: newSubject.id });
      }
      setNewCustomSubject('');
    } catch (error: any) {
      console.error('Error adding custom subject:', error);
    }
  };

  const handleToggleSubject = async (subject: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (selectedSubjectIds.includes(subject.id)) {
        await supabase
          .from('teacher_subjects')
          .delete()
          .eq('teacher_id', user.id)
          .eq('subject_id', subject.id);
          
        setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== subject.id));
        setSubjects(subjects.filter(s => s.id !== subject.id));
      } else {
        await supabase
          .from('teacher_subjects')
          .insert({ teacher_id: user.id, subject_id: subject.id });
          
        setSelectedSubjectIds([...selectedSubjectIds, subject.id]);
        setSubjects([...subjects, subject]);
      }
    } catch (error) {
      console.error('Error toggling subject:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.role === 'siswa') {
      if (!formData.name.trim() || !studentCode.trim() || !studentPassword.trim()) {
        showAlert({ title: 'Gagal', message: 'Nama, Username (Kode Siswa), dan Password tidak boleh kosong.', type: 'warning' });
        return;
      }
      setSaving(true);
      try {
        const { error } = await supabase
          .from('students')
          .update({
            name: formData.name.trim(),
            student_code: studentCode.trim(),
            password: studentPassword.trim()
          })
          .eq('id', profile.id);

        if (error) throw error;

        // Update localStorage session
        const sessionStr = localStorage.getItem('student_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          localStorage.setItem('student_session', JSON.stringify({
            ...session,
            name: formData.name.trim(),
            student_code: studentCode.trim()
          }));
          window.dispatchEvent(new Event('student_session_change'));
        }

        showAlert({ title: 'Berhasil', message: 'Profil Anda berhasil diperbarui.', type: 'success' });
        window.location.reload();
      } catch (err: any) {
        console.error(err);
        showAlert({ title: 'Gagal', message: err.message || 'Gagal memperbarui profil.', type: 'error' });
      } finally {
        setSaving(false);
      }
      return;
    }

    if (formData.role === 'guru' && (selectedSchoolIds.length === 0 || selectedSubjectIds.length === 0 || !academicYear || !semester)) {
      showAlert({ title: 'Data Belum Lengkap', message: 'Mohon lengkapi Sekolah, Mata Pelajaran, Tahun Ajaran, dan Semester.', type: 'warning' });
      return;
    }

    setSaving(true);
    try {
      // Update Auth Metadata
      const { error } = await supabase.auth.updateUser({ 
        data: { 
          name: formData.name, 
          academic_year: academicYear,
          semester: semester
        } 
      });
      if (error) throw error;

      // Update Profile table
      await supabase.from('profiles').update({ name: formData.name }).eq('id', profile.id);

      // Update teacher_schools with academic year and semester for all selected schools
      for (const schoolId of selectedSchoolIds) {
        await supabase
          .from('teacher_schools')
          .update({ academic_year: academicYear, semester: semester })
          .eq('teacher_id', profile.id)
          .eq('school_id', schoolId);
      }

      showAlert({ title: 'Berhasil!', message: 'Profil Anda telah diperbarui.', type: 'success' });
    } catch (error) {
      showAlert({ title: 'Gagal', message: 'Gagal memperbarui profil.', type: 'error' });
    } finally { setSaving(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleResetData = async () => {
    showAlert({
      title: 'Hapus Semua Data?',
      message: 'Semua data Anda akan dihapus permanen: kelas, siswa, bank soal, ujian, dan hasil. Tindakan ini tidak dapat dibatalkan!',
      type: 'confirm',
      confirmText: 'Ya, Hapus Semua',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const userId = user.id;

          const { data: exams } = await supabase.from('exams').select('id').eq('teacher_id', userId);
          if (exams && exams.length > 0) {
            const examIds = exams.map(e => e.id);
            await supabase.from('participants').select('id').in('exam_id', examIds).then(async ({ data: participants }) => {
              if (participants) {
                const participantIds = participants.map(p => p.id);
                await supabase.from('answers').delete().in('participant_id', participantIds);
              }
            });
            await supabase.from('exam_questions').delete().in('exam_id', examIds);
            await supabase.from('participants').delete().in('exam_id', examIds);
            await supabase.from('exams').delete().in('id', examIds);
          }

          const { data: questions } = await supabase.from('questions').select('id').eq('teacher_id', userId);
          if (questions && questions.length > 0) {
            const questionIds = questions.map(q => q.id);
            await supabase.from('question_options').delete().in('question_id', questionIds);
            await supabase.from('questions').delete().in('id', questionIds);
          }

          await supabase.from('categories').delete().eq('teacher_id', userId);
          await supabase.from('students').delete().eq('teacher_id', userId);
          await supabase.from('classes').delete().eq('teacher_id', userId);
          await supabase.from('teacher_schools').delete().eq('teacher_id', userId);
          await supabase.from('teacher_subjects').delete().eq('teacher_id', userId);
          
          await supabase.from('profiles').update({ is_profile_completed: false }).eq('id', userId);
          await supabase.auth.updateUser({ data: { is_profile_completed: false } });

          await supabase.auth.signOut();
          navigate('/login');
          
        } catch (error) {
          console.error('Error resetting data:', error);
          showAlert({ title: 'Gagal', message: 'Gagal menghapus data. Silakan coba lagi.', type: 'error' });
        }
      }
    });
  };

  const downloadStudentCard = async () => {
    try {
      setSaving(true);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context error");

      const width = 640;
      const height = 1011;
      canvas.width = width;
      canvas.height = height;

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Header Gradient
      const grd = ctx.createLinearGradient(0, 0, width, 0);
      grd.addColorStop(0, "#1e3a8a"); // Blue / Indigo-900
      grd.addColorStop(1, "#3b82f6"); // Blue-500
      
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, 280);
      ctx.bezierCurveTo(width, 280, width / 2, 360, 0, 280); 
      ctx.lineTo(0, 0);
      ctx.fill();

      // Dot matrix dots
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      for(let i=0; i<width; i+=40) {
        for(let j=0; j<300; j+=40) {
          ctx.beginPath();
          ctx.arc(i, j, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }


      // Class badge right
      const classText = formData.subject || "KELAS";
      ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
      const mapelMetrics = ctx.measureText(classText);
      const mapelW = mapelMetrics.width + 40; 
      const mapelH = 44;
      const mapelX = width - mapelW - 30;
      const mapelY = 30;

      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(mapelX, mapelY, mapelW, mapelH, 22);
      } else {
        ctx.rect(mapelX, mapelY, mapelW, mapelH);
      }
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(classText, mapelX + (mapelW/2), mapelY + 29);

      // School Name
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 32px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(schoolName.toUpperCase(), width / 2, 135);

      // QR Box
      const qrBoxSize = 360;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 220;

      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;
      
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 40);
      } else {
        ctx.rect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
      }
      ctx.fill();
      
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Load and Draw QR code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=ABSEN:${profile.id}`;
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = qrUrl;
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
      });

      const qrSize = 280;
      const qrPadding = (qrBoxSize - qrSize) / 2;
      ctx.drawImage(qrImg, qrBoxX + qrPadding, qrBoxY + qrPadding, qrSize, qrSize);

      // Student Name
      const textStartY = qrBoxY + qrBoxSize + 80;
      ctx.fillStyle = "#111827"; 
      ctx.font = "bold 44px 'Plus Jakarta Sans', sans-serif";
      
      let fontSize = 44;
      let nameWidth = ctx.measureText(formData.name).width;
      const maxTextWidth = width - 100;
      
      while (nameWidth > maxTextWidth && fontSize > 20) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
        nameWidth = ctx.measureText(formData.name).width;
      }
      
      ctx.fillText(formData.name, width / 2, textStartY);

      // Footer details (Tahun Ajaran centered)
      // Divider line
      ctx.strokeStyle = "#f3f4f6"; 
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, height - 120);
      ctx.lineTo(width - 80, height - 120);
      ctx.stroke();

      // Footer labels
      ctx.textAlign = "center";
      ctx.fillStyle = "#9ca3af"; 
      ctx.font = "500 16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("TAHUN AJARAN", width / 2, height - 80);

      // Footer values
      ctx.fillStyle = "#374151"; 
      ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(academicYear || "2026/2027", width / 2, height - 50);

      // Bottom bar color block
      const bottomGrd = ctx.createLinearGradient(0, height - 15, width, 0);
      bottomGrd.addColorStop(0, "#1e3a8a");
      bottomGrd.addColorStop(1, "#3b82f6");
      ctx.fillStyle = bottomGrd;
      ctx.fillRect(0, height - 15, width, 15);

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `KARTU_${formData.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showAlert({ title: 'Berhasil', message: 'Kartu Pelajar berhasil diunduh.', type: 'success' });
    } catch (err) {
      console.error(err);
      showAlert({ title: 'Gagal Mengunduh', message: 'Terjadi kesalahan saat mengunduh Kartu Pelajar.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStudentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = studentCode.trim();
    if (cleanCode.length < 6) {
      showAlert({ title: 'Username Terlalu Pendek', message: 'Username (Kode Siswa) minimal 6 karakter.', type: 'warning' });
      return;
    }
    if (studentPassword.length < 4) {
      showAlert({ title: 'Password Terlalu Pendek', message: 'Password minimal 4 karakter.', type: 'warning' });
      return;
    }
    setSaving(true);
    try {
      // Check if username is already taken by another student
      const { data: existingStudent, error: checkErr } = await supabase
        .from('students')
        .select('id')
        .eq('student_code', cleanCode)
        .neq('id', profile.id)
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (existingStudent) {
        showAlert({ title: 'Username Sudah Digunakan', message: 'Username (Kode Siswa) sudah dipakai oleh siswa lain. Silakan pilih kode lain.', type: 'warning' });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('students')
        .update({ 
          student_code: cleanCode,
          password: studentPassword 
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      // Update local storage session info
      const studentSessionStr = localStorage.getItem('student_session');
      if (studentSessionStr) {
        const studentObj = JSON.parse(studentSessionStr);
        studentObj.student_code = cleanCode;
        localStorage.setItem('student_session', JSON.stringify(studentObj));
        window.dispatchEvent(new Event('student_session_change'));
      }

      showAlert({ title: 'Berhasil!', message: 'Username dan Password Anda telah berhasil diperbarui.', type: 'success' });
    } catch (err: any) {
      console.error(err);
      showAlert({ 
        title: 'Gagal', 
        message: 'Gagal memperbarui profil akun. Silakan jalankan perintah SQL Migrasi di Supabase SQL Editor Anda untuk menambahkan kolom password dan kebijakan RLS (lihat petunjuk).', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 bg-slate-200 rounded-2xl"></div>
      <div className="space-y-3">
        {[1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-200 rounded-xl"></div>)}
      </div>
    </div>
  );

  if (formData.role === 'siswa') {
    return (
      <div className="space-y-6 pb-10 font-sans">
        <div>
          <h2 className="text-3xl font-bold text-indigo-950 tracking-tight">Kartu Pelajar Saya</h2>
          <p className="text-slate-500 font-medium mt-1">Gunakan QR Code Anda untuk absensi kehadiran atau pengumpulan poin prestasi secara instan.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
          {/* Left Column: Portrait Card (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col items-center gap-6 w-full">
            {/* HTML Preview of Portrait Student Card (EduCheck Style - Blue Gradient) */}
            <div className="w-[320px] h-[505.5px] bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden relative select-none shrink-0">
              {/* Card Header Background */}
              <div className="absolute top-0 inset-x-0 h-[140px] bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] rounded-b-[50%_20px] z-0 overflow-hidden">
                {/* Dot Matrix overlay */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
              </div>

              {/* Class badge right */}
              <div className="absolute right-[15px] top-[15px] z-10 text-white font-bold text-[10px] bg-white/20 border border-white/40 px-4 py-1.5 rounded-full uppercase">
                {formData.subject}
              </div>

              {/* School Name */}
              <div className="absolute top-[67.5px] inset-x-4 z-10 text-center text-white font-black tracking-wide text-base uppercase truncate">
                {schoolName || "EDUVERSE ACADEMY"}
              </div>

              {/* QR Box Container (centered, y = 110px, size = 180px) */}
              <div className="absolute left-[70px] top-[110px] w-[180px] h-[180px] bg-white p-5 rounded-[2rem] shadow-xl border border-slate-50 z-10 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ABSEN:${profile.id}`}
                  alt="Student QR Code"
                  className="w-[140px] h-[140px] block"
                />
              </div>

              {/* Student Name (y = 330px) */}
              <div className="absolute top-[330px] inset-x-4 z-10 text-center">
                <h3 className={cn(
                  "font-black text-[#111827] leading-tight break-words max-w-[280px] mx-auto",
                  formData.name.length > 20 ? "text-lg" : "text-[22px]"
                )}>
                  {formData.name}
                </h3>
              </div>

              {/* Divider Line (y = 445.5px) */}
              <div className="absolute top-[445.5px] inset-x-[40px] h-[1.5px] bg-[#f3f4f6] z-10" />

              {/* Footer (y = 460px) */}
              <div className="absolute top-[457px] inset-x-6 z-10 text-center">
                <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">TAHUN AJARAN</p>
                <p className="text-[10px] font-bold text-slate-700 uppercase mt-0.5">{academicYear || "2026/2027"}</p>
              </div>

              {/* Bottom Bar */}
              <div className="absolute bottom-0 inset-x-0 h-[7.5px] bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6]" />
            </div>

            <button 
              onClick={downloadStudentCard}
              disabled={saving}
              className="w-[320px] bg-indigo-950 text-white py-4 rounded-2xl font-bold text-sm hover:bg-indigo-900 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Unduh Kartu Pelajar (PNG)
            </button>
          </div>

          {/* Right Column: Settings & Forms (col-span-7) */}
          <div className="lg:col-span-7 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-slate-100 shadow-sm p-8 sm:p-10 space-y-8 w-full">
            <div>
              <h3 className="text-2xl font-black text-indigo-950 tracking-tight">Pengaturan Akun Pelajar</h3>
              <p className="text-sm text-slate-400 mt-1 font-medium">Ubah Username (Kode Siswa) dan Password Anda di sini. Data akan otomatis disinkronkan ke portal Admin.</p>
            </div>

            <form onSubmit={handleUpdateStudentProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-0.5">Username (Kode Siswa)</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text"
                      required
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 transition-all text-sm font-bold text-slate-800 tracking-wider"
                      value={studentCode}
                      onChange={(e) => setStudentCode(e.target.value)}
                      placeholder="Contoh: exz815"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-0.5">Password Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="password"
                      required
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/50 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 transition-all text-sm font-bold text-slate-800"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      placeholder="Masukkan password baru..."
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-indigo-950 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-indigo-900 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan Akun'}
                </button>
              </div>
            </form>

            <div className="pt-8 border-t border-slate-100">
              <h4 className="text-sm font-bold text-indigo-950 mb-3">Aksi Sesi</h4>
              <button 
                onClick={() => showAlert({
                  title: 'Yakin Ingin Keluar?', 
                  message: 'Sesi Anda akan berakhir dan Anda harus login kembali.', 
                  type: 'confirm', 
                  confirmText: 'Ya, Keluar', 
                  onConfirm: handleLogout
                })}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-rose-600 active:scale-[0.98] transition-all font-bold text-sm border border-dashed border-slate-200"
              >
                <LogOut className="w-4 h-4" />
                Keluar Sesi Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold text-indigo-950 tracking-tight">Profil Saya</h2>
        <p className="text-slate-500 font-medium mt-1">Kelola informasi profil dan detail akun Anda.</p>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
        <div className="h-32 bg-indigo-950 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-transparent opacity-50" />
          <div className="absolute -bottom-10 left-8">
            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg">
              <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 relative group overflow-hidden">
                <User className="w-8 h-8" />
                <button className="absolute inset-0 bg-indigo-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white backdrop-blur-sm">
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pt-16 pb-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-indigo-950">Informasi Dasar</h3>
              <p className="text-sm text-slate-400 mt-0.5">Perbarui data diri Anda untuk keperluan identitas dalam sistem.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input type="text"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 transition-all text-sm font-medium text-slate-700"
                      value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Masukkan nama lengkap"
                    />
                  </div>
                </div>

                {formData.role === 'guru' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alamat Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                      <input type="email" disabled
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-medium"
                        value={formData.email}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username (Kode Siswa)</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input type="text"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 transition-all text-sm font-medium text-slate-700 uppercase"
                          value={studentCode} onChange={(e) => setStudentCode(e.target.value)}
                          placeholder="Contoh: ABCXYZ"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password Baru</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input type="password"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 transition-all text-sm font-medium text-slate-700"
                          value={studentPassword} onChange={(e) => setStudentPassword(e.target.value)}
                          placeholder="Masukkan password baru"
                        />
                      </div>
                    </div>
                  </>
                )}

                {formData.role === 'guru' ? (
                  <>
                    <div className="md:col-span-2 space-y-3 pt-2">
                       <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Tahun Ajaran & Semester
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <select
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 transition-all text-sm font-medium text-slate-700 appearance-none"
                          >
                            <option value="">Pilih Tahun Ajaran</option>
                            {ACADEMIC_YEARS().map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                          <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 transition-all text-sm font-medium text-slate-700 appearance-none"
                          >
                            <option value="">Pilih Semester</option>
                            {SEMESTERS.map(sem => (
                              <option key={sem} value={sem}>{sem}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-3 pt-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <School className="w-4 h-4" />
                        Sekolah
                      </label>

                      {schools.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {schools.map(school => (
                            <span key={school.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
                              <Building2 className="w-3 h-3" />
                              {school.name}
                              <button type="button" onClick={() => handleRemoveSchool(school.id)} className="hover:text-red-500 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-3">
                        <div className="relative" ref={schoolRef}>
                          <button type="button" onClick={(e) => { e.preventDefault(); setSchoolDropdownOpen(!schoolDropdownOpen); }}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 transition-all text-sm font-medium text-slate-700"
                          >
                            <span className={cn("truncate", selectedSchoolIds.length === 0 && "text-slate-400")}>
                              {selectedSchoolIds.length === 1 
                                ? availableSchools.find(s => s.id === selectedSchoolIds[0])?.name 
                                : selectedSchoolIds.length > 1 
                                  ? `${selectedSchoolIds.length} sekolah dipilih` 
                                  : 'Cari/Pilih sekolah yang ada...'}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", schoolDropdownOpen && "rotate-180")} />
                          </button>

                          <AnimatePresence>
                            {schoolDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-64 overflow-y-auto p-1"
                              >
                                {availableSchools.length === 0 ? (
                                  <div className="px-4 py-3 text-sm text-slate-400 text-center italic">Belum ada sekolah terdaftar. Silakan tambah manual di bawah.</div>
                                ) : (
                                  availableSchools.map(school => (
                                    <button key={school.id} type="button" onClick={() => handleToggleSchool(school)}
                                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left rounded-lg"
                                    >
                                      <div className={cn(
                                        "w-4 h-4 rounded-md border-2 flex items-center justify-center transition-colors shrink-0",
                                        selectedSchoolIds.includes(school.id) ? "bg-indigo-950 border-indigo-950" : "border-slate-300"
                                      )}>
                                        {selectedSchoolIds.includes(school.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                      </div>
                                      <span className="font-semibold text-indigo-950 text-sm truncate">{school.name}</span>
                                    </button>
                                  ))
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tambah Sekolah Baru</p>
                          <input type="text" value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 text-sm"
                            placeholder="Nama sekolah..."
                          />
                          <input type="text" value={newSchoolAddress} onChange={(e) => setNewSchoolAddress(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 text-sm"
                            placeholder="Alamat sekolah (opsional)..."
                          />
                          <button type="button" onClick={handleAddSchool} disabled={!newSchoolName.trim()}
                            className="w-full px-4 py-2.5 bg-indigo-950 text-white rounded-xl hover:bg-indigo-900 disabled:opacity-50 transition-colors shadow-sm font-medium text-sm"
                          >
                            + Tambah & Pilih
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-3 pt-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Mata Pelajaran {selectedSubjectIds.length > 0 && (
                          <span className="text-[10px] font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full lowercase">
                            {selectedSubjectIds.length} dipilih
                          </span>
                        )}
                      </label>

                      {subjects.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {subjects.map(subject => (
                            <span key={subject.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                              <BookOpen className="w-3 h-3" />
                              {subject.name}
                              <button type="button" onClick={() => handleToggleSubject(subject)} className="hover:text-red-500 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="relative" ref={subjectRef}>
                        <button type="button" onClick={(e) => { e.preventDefault(); setSubjectDropdownOpen(!subjectDropdownOpen); }}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 transition-all text-sm font-medium text-slate-700"
                        >
                          <span className={cn("truncate", subjects.length === 0 && "text-slate-400")}>
                            {subjects.length === 1 
                              ? subjects[0].name 
                              : subjects.length > 1 
                                ? `${subjects.length} mata pelajaran dipilih` 
                                : 'Pilih mata pelajaran...'}
                          </span>
                          <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", subjectDropdownOpen && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                          {subjectDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-64 overflow-y-auto p-1"
                            >
                              {allSubjects.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-slate-400 text-center italic">Tidak ada mata pelajaran.</div>
                              ) : (
                                allSubjects.map(subject => (
                                  <button key={subject.id} type="button" onClick={() => handleToggleSubject(subject)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left rounded-lg"
                                  >
                                    <div className={cn(
                                      "w-4 h-4 rounded-md border-2 flex items-center justify-center transition-colors shrink-0",
                                      selectedSubjectIds.includes(subject.id) ? "bg-indigo-950 border-indigo-950" : "border-slate-300"
                                    )}>
                                      {selectedSubjectIds.includes(subject.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <span className="font-semibold text-indigo-950 text-sm truncate">{subject.name}</span>
                                  </button>
                                ))
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>


                      <div className="flex gap-2 items-center">
                        <input
                          type="text" value={newCustomSubject} onChange={(e) => setNewCustomSubject(e.target.value)}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-950/10 focus:border-indigo-950 text-sm"
                          placeholder="Tambah mata pelajaran manual..."
                        />
                        <button type="button" onClick={handleAddCustomSubject} disabled={!newCustomSubject.trim()}
                          className="px-4 py-2.5 bg-indigo-950 text-white rounded-xl hover:bg-indigo-900 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Kelas
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input type="text" disabled
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-medium"
                        value={formData.subject}
                        placeholder="Belum ada kelas"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button type="submit" disabled={saving}
                  className="bg-indigo-950 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-900 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Perubahan'}
                </button>
              </div>
            </form>

            <div className="pt-6 mt-6 border-t border-slate-100/50">
              <h3 className="text-base font-bold text-indigo-950 mb-3">Aksi Lanjutan</h3>
              <div className="space-y-3">
                {formData.role === 'guru' && (
                  <button 
                    onClick={handleResetData}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 active:scale-[0.98] transition-all font-semibold text-sm border border-red-100 group"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Semua Data
                  </button>
                )}
                <button 
                  onClick={() => showAlert({
                    title: 'Yakin Ingin Keluar?', message: 'Sesi Anda akan berakhir dan harus login kembali.', type: 'confirm', confirmText: 'Ya, Keluar', onConfirm: handleLogout
                  })}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-slate-500 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] transition-all font-semibold text-sm border border-transparent group"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar Sesi Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
