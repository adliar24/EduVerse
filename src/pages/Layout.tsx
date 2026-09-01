import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Check, 
  ChevronLeft, 
  Home, 
  Users, 
  FileText, 
  User, 
  Settings,
  AlertCircle,
  Loader2,
  LogOut,
  Menu,
  ChevronRight,
  LayoutDashboard,
  Cloud,
  QrCode,
  ScanLine,
  Star,
  BarChart3,
  GraduationCap,
  Building2,
  ChevronDown,
  PlusCircle,
  UploadCloud,
  DownloadCloud
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import * as db from '../services/dbGrading';
import { TeacherProfile, School } from '../types';

// --- TOAST SYSTEM ---

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const ToastItem: React.FC<{ toast: Toast, onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const bgColors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-[#3B66F5]/50',
    warning: 'bg-amber-500'
  };

  return (
    <div className={`${bgColors[toast.type]} text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-enter mb-2 min-w-[200px]`}>
      {toast.type === 'success' && <Check size={18} strokeWidth={3} />}
      {toast.type === 'error' && <AlertCircle size={18} strokeWidth={3} />}
      <span className="text-[11px] font-black uppercase tracking-widest">{toast.message}</span>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-24 md:bottom-8 right-6 z-[99999] flex flex-col items-end pointer-events-none">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// --- KOMPONEN DASAR ---

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger', isLoading?: boolean }> = ({ 
  className = '', 
  variant = 'primary', 
  children, 
  isLoading,
  disabled,
  ...props 
}) => {
  const baseStyle = "btn-press inline-flex items-center justify-center rounded-xl font-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 tracking-wide";
  
  const variants = {
    primary: "bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white shadow-md shadow-[#3B66F5]/10 hover:shadow-lg border border-transparent",
    accent: "bg-accent text-[#1D4ED8] shadow-md shadow-amber-500/10 hover:shadow-lg border border-transparent",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm",
    outline: "border-2 border-[#3B66F5] text-[#3B66F5] hover:bg-[#3B66F5]/5",
    ghost: "text-slate-500 hover:bg-slate-50 hover:text-[#3B66F5]",
    danger: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 transition-all"
  };

  const sizes = "px-4 py-2 text-sm sm:text-[14px]";

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${sizes} ${className}`} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string, labelClassName?: string }> = ({ label, labelClassName, className = '', ...props }) => (
  <div className="w-full flex flex-col">
    {label && <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ml-1 ${labelClassName || 'text-slate-500'}`}>{label}</label>}
    <input 
      className={`w-full bg-white text-slate-700 border border-slate-200 rounded-xl px-4 py-3 focus:border-[#3B66F5] focus:ring-4 focus:ring-[#3B66F5]/5 outline-none transition-all duration-300 placeholder-slate-400 text-sm font-bold tracking-wide ${className}`}
      {...props} 
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, labelClassName?: string }> = ({ label, labelClassName, className = '', children, ...props }) => (
  <div className="w-full flex flex-col">
    {label && <label className={`block text-[11px] font-black uppercase tracking-widest mb-2 ml-1 ${labelClassName || 'text-slate-500'}`}>{label}</label>}
    <div className="relative">
      <select 
        className={`w-full bg-white text-slate-700 border border-slate-200 rounded-2xl px-5 py-3.5 appearance-none focus:border-[#3B66F5] focus:ring-4 focus:ring-[#3B66F5]/5 outline-none transition-all duration-300 text-sm font-bold tracking-wide ${className}`}
        {...props} 
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-5 text-slate-400">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  </div>
);

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    className={`bg-white rounded-[1.75rem] shadow-sm border border-slate-100 p-5 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-[#3B66F5] active:scale-[0.98]' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

export const Modal: React.FC<{ isOpen: boolean, onClose: () => void, title: React.ReactNode, children: React.ReactNode, fullScreen?: boolean }> = ({ isOpen, onClose, title, children, fullScreen = false }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.body.classList.remove('modal-open');
      }, 300);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen, shouldRender]);

  if (!shouldRender) return null;
  
  return createPortal(
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade'}`}
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-3xl w-full ${fullScreen ? 'max-w-4xl h-[90vh]' : 'max-w-lg'} shadow-2xl overflow-hidden ${isClosing ? 'animate-pop-out' : 'animate-pop'} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] px-6 py-4 flex justify-between items-center relative shrink-0">
          <div className="text-white font-black text-lg tracking-wide uppercase leading-tight">{title}</div>
          <button onClick={onClose} className="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors">✕</button>
        </div>
        <div className={`overflow-y-auto custom-scrollbar ${fullScreen ? 'flex-1' : 'max-h-[85vh]'}`}>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const PageTransition: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`animate-enter ${className}`}>
    {children}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`}></div>
);

const NAV_ITEMS = [
  { path: '/home', label: 'Beranda', icon: LayoutDashboard },
  { path: '/classes', label: 'Kelas', icon: Users },
  { path: '/point', label: 'Poin', icon: Star, isCenter: true },
  { path: '/reports', label: 'Laporan', icon: BarChart3 },
  { path: '/rapor', label: 'e-Rapor', icon: GraduationCap, secondary: true }, 
  { path: '/meetings', label: 'Nilai', icon: FileText, secondary: true },
  { path: '/profile', label: 'Profil', icon: User, secondary: true },
];

const SyncIndicator: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    return db.subscribeToSyncStatus(setIsSyncing);
  }, []);

  if (!isSyncing) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 animate-pulse transition-all">
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
      <span className="text-[10px] font-black uppercase tracking-tighter">Syncing</span>
    </div>
  );
};

export const Logo: React.FC<{ size?: 'sm' | 'lg' | 'xl', invert?: boolean, minimal?: boolean, className?: string }> = ({ size = 'lg', invert = false, minimal = false, className = '' }) => {
  const textSize = size === 'xl' ? 'text-4xl md:text-5xl' : (size === 'lg' ? 'text-xl' : 'text-lg');
  const boxSize = size === 'xl' ? 'w-16 h-16 md:w-20 md:h-20' : (size === 'lg' ? 'w-9 h-9' : 'w-8 h-8');
  const iconSize = size === 'xl' ? 'w-8 h-8 md:w-10 md:h-10' : (size === 'lg' ? 'w-6 h-6' : 'w-5 h-5');

  return (
    <div className={`inline-flex items-center gap-3 font-black tracking-tight ${textSize} ${className}`}>
      <div className={`relative flex items-center justify-center
        ${minimal ? 'bg-transparent' : (invert ? 'bg-white text-[#3B66F5]' : 'bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] text-white')}
        ${!minimal && 'rounded-xl shadow-lg'}
        transition-transform hover:scale-105 duration-500
        ${boxSize}
        ${minimal && invert ? 'text-white' : ''}
      `}>
        <Check strokeWidth={4} className={iconSize} />
      </div>
      <span className={`${invert ? 'text-white' : 'text-slate-800'}`}>Edu<span className={`${invert ? 'text-accent' : 'text-gradient-gold'}`}>Score</span></span>
    </div>
  );
};

export const SchoolPickerModal: React.FC<{ isOpen: boolean, onClose: () => void, profile: TeacherProfile | null, onSelect: (id: string) => void, onAdd: () => void }> = ({ isOpen, onClose, profile, onSelect, onAdd }) => {
  if (!isOpen || !profile) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pilih Sekolah">
      <div className="space-y-3">
        {profile.schools.map(school => (
          <div 
            key={school.id} 
            onClick={() => { onSelect(school.id); onClose(); }}
            className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${school.id === profile.activeSchoolId ? 'border-[#3B66F5] bg-[#3B66F5]/5 shadow-md shadow-blue-500/5' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
          >
            <div className="min-w-0">
              <h4 className="font-black text-slate-800 uppercase tracking-wide truncate">{school.nama}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-wider">TA {school.tahunAjaran} • {school.semester === '1' ? 'Ganjil' : 'Genap'} • KKM {school.kkmDefault}</p>
            </div>
            {school.id === profile.activeSchoolId && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] flex items-center justify-center text-white shrink-0">
                <Check size={18} strokeWidth={3} />
              </div>
            )}
          </div>
        ))}
        
        <button 
          onClick={() => { onAdd(); onClose(); }}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all font-black text-xs uppercase"
        >
          <PlusCircle size={18} />
          <span>Tambah Sekolah Baru</span>
        </button>
      </div>
    </Modal>
  );
};

export const Sidebar: React.FC<{ profile: TeacherProfile | null, refreshProfile: () => void }> = ({ profile: propProfile, refreshProfile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname.startsWith(path) && (path !== '/home' || location.pathname === '/home');
  const [localProfile, setLocalProfile] = useState<TeacherProfile | null>(propProfile);
  const profile = propProfile || localProfile;

  useEffect(() => {
    if (!propProfile) {
        db.getTeacherProfile().then(setLocalProfile).catch(() => {});
    }
  }, [propProfile]);

  const activeSchool = profile?.schools.find(s => s.id === profile.activeSchoolId);

  return (
    <aside className="hidden md:flex flex-col w-60 lg:w-64 fixed inset-y-0 left-0 bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#0F172A] z-[50] text-white md:rounded-r-[2rem] shadow-2xl border-r border-white/10">
      <div className="p-6 flex items-center gap-3 relative z-10 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-sm shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-white">EduVerse</span>
      </div>
      <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest px-4 mb-4 opacity-40">NAVIGASI</div>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-bold text-[14px] group relative tracking-wide ${
                active 
                ? 'bg-white/15 text-white shadow-md backdrop-blur-md' 
                : 'text-blue-100 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={18} className={`transition-colors ${active ? 'text-accent' : 'text-[#3B66F5]/70 group-hover:text-white'}`} strokeWidth={active ? 2.5 : 2} />
              {item.label}
              {active && <div className="ml-auto w-1.5 h-1.5 bg-accent rounded-full shadow-glow-gold"></div>}
            </Link>
          );
        })}
      </div>

      <div className="p-4 pb-10 border-t border-white/5 space-y-2">
        <button onClick={() => window.dispatchEvent(new Event('open-sync-modal'))}
          className="w-full bg-emerald-500/10 hover:bg-emerald-500 text-emerald-200 hover:text-white rounded-xl p-3 transition-all flex items-center justify-center gap-2 border border-emerald-500/20"
        >
          <Cloud size={16} />
          <span className="font-black text-[10px] uppercase">Cloud Sync</span>
        </button>
        <button onClick={() => {
          if (confirm("Anda yakin ingin keluar?")) {
            window.dispatchEvent(new Event('trigger_fluid_logout'));
          }
        }}
          className="w-full bg-red-500/30 hover:bg-red-600 text-red-400 hover:text-white rounded-xl p-3 transition-all flex items-center justify-center gap-2 border-none"
        >
          <LogOut size={16} />
          <span className="font-black text-[11px] uppercase">Keluar</span>
        </button>
      </div>

    </aside>
  );
};

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const isActive = (path: string) => location.pathname.startsWith(path);

  const mainNavItems = NAV_ITEMS.filter(item => !item.secondary);
  const regularNavItems = mainNavItems.filter(item => !item.isCenter);
  const moreNavItems = NAV_ITEMS.filter(item => item.secondary);

  return (
    <>
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/0 z-[50]">
      <div className="absolute inset-x-0 bottom-0 h-[80px] bg-gradient-to-r from-[#3B66F5] via-[#2563EB] to-[#1D4ED8] rounded-t-[2rem] shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] border-t border-white/10"></div>
      
      <div className="relative flex justify-around items-end pb-3 px-2 h-[80px]">
        {regularNavItems.slice(0, 2).map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`relative flex flex-col items-center py-2 px-1 w-full transition-all duration-300 ${isActive(item.path) ? 'text-white' : 'text-[#3B66F5]/70'}`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive(item.path) ? 'bg-white/20 backdrop-blur-md translate-y-[-2px]' : ''}`}>
              <item.icon size={18} strokeWidth={isActive(item.path) ? 2.5 : 2} className={`transition-all duration-500 ${isActive(item.path) ? 'text-accent' : 'opacity-60'}`} />
            </div>
            <span className={`text-[10px] font-black mt-1 tracking-widest transition-opacity ${isActive(item.path) ? 'opacity-100' : 'opacity-40'}`}>{item.label.toUpperCase()}</span>
          </Link>
        ))}

        <div className="relative -top-6 group">
          <Link to="/point">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-glow-gold transition-all duration-300 ${isActive('/point') ? 'bg-accent text-[#1D4ED8] scale-110' : 'bg-slate-800 text-accent border-4 border-slate-700'}`}>
              <Star size={32} strokeWidth={3} fill="currentColor" />
            </div>
          </Link>
        </div>

        {regularNavItems.slice(2).map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`relative flex flex-col items-center py-2 px-1 w-full transition-all duration-300 ${isActive(item.path) ? 'text-white' : 'text-[#3B66F5]/70'}`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive(item.path) ? 'bg-white/20 backdrop-blur-md translate-y-[-2px]' : ''}`}>
              <item.icon size={18} strokeWidth={isActive(item.path) ? 2.5 : 2} className={`transition-all duration-500 ${isActive(item.path) ? 'text-accent' : 'opacity-60'}`} />
            </div>
            <span className={`text-[10px] font-black mt-1 tracking-widest transition-opacity ${isActive(item.path) ? 'opacity-100' : 'opacity-40'}`}>{item.label.toUpperCase()}</span>
          </Link>
        ))}

        {/* More Button */}
        <button 
          onClick={() => setShowMore(true)}
          className={`relative flex flex-col items-center py-2 px-1 w-full transition-all duration-300 text-[#3B66F5]/70`}
        >
          <div className="p-1.5 rounded-xl transition-all duration-300">
            <Menu size={18} strokeWidth={2} className="opacity-60" />
          </div>
          <span className="text-[10px] font-black mt-1 tracking-widest opacity-40">LAINNYA</span>
        </button>
      </div>
    </nav>

    {/* More Menu Modal for Mobile */}
    <Modal isOpen={showMore} onClose={() => setShowMore(false)} title="Menu Utama">
       <div className="grid grid-cols-2 gap-4 pb-4">
          {moreNavItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={() => setShowMore(false)}
              className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${isActive(item.path) ? 'border-[#3B66F5] bg-[#3B66F5]/5 text-[#3B66F5] scale-[1.02]' : 'border-slate-100 bg-white text-slate-600 active:scale-95'}`}
            >
              <item.icon size={32} strokeWidth={isActive(item.path) ? 2.5 : 2} className={isActive(item.path) ? 'text-[#3B66F5]' : 'text-slate-400'} />
              <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}
          <button 
            onClick={() => {
              setShowMore(false);
              window.dispatchEvent(new Event('open-sync-modal'));
            }}
            className="p-6 rounded-3xl border-2 border-emerald-100 bg-emerald-50 text-emerald-600 flex flex-col items-center gap-3 active:scale-95 transition-all"
          >
            <Cloud size={32} strokeWidth={2} />
            <span className="font-black text-xs uppercase tracking-widest">Cloud Sync</span>
          </button>
          <button 
            onClick={() => {
              if (confirm("Anda yakin ingin keluar?")) {
                setShowMore(false);
                window.dispatchEvent(new Event('trigger_fluid_logout'));
              }
            }}
            className="p-6 rounded-3xl border-none bg-red-50 text-red-600 flex flex-col items-center gap-3 active:scale-95 transition-all"
          >
            <LogOut size={32} strokeWidth={2.5} />
            <span className="font-black text-[13px] uppercase tracking-widest">Keluar</span>
          </button>
       </div>
    </Modal>
    </>
  );
};

export const Header: React.FC<{ 
  title: string, 
  subtitle?: string, 
  backTo?: string, 
  rightAction?: React.ReactNode, 
  transparent?: boolean,
  profile?: TeacherProfile | null,
  refreshProfile?: () => void
}> = ({ title, subtitle, backTo, rightAction }) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 mt-0">
      <div className="flex flex-col gap-2">
        {backTo && (
          <Link to={backTo} className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-[#1D4ED8] transition-colors uppercase tracking-wider mb-0.5">
            <ChevronLeft size={14} strokeWidth={3} /> Kembali
          </Link>
        )}
        <div>
          <h2 className="text-3xl font-bold text-[#1D4ED8] tracking-tight leading-tight">{title}</h2>
          {subtitle && <p className="text-slate-500 font-medium mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1">{rightAction}</div>
    </header>
  );
};

export const Layout: React.FC<{ children: React.ReactNode, showNav?: boolean, profile?: TeacherProfile | null, refreshProfile?: () => void }> = ({ children }) => {
  return (
    <div className="w-full text-slate-700 selection:bg-[#3B66F5]/100/10 selection:text-[#3B66F5] animate-in fade-in duration-300">
      <main className="w-full">
        <div className="w-full max-w-[1440px] mx-auto pt-0 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
};
