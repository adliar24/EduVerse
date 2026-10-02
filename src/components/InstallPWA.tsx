import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Hook to manage PWA installation state and trigger
 */
export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Check if app is running as standalone installed window
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || window.matchMedia('(display-mode: fullscreen)').matches
        || (window.navigator as any).standalone === true
        || document.referrer.includes('android-app://');
      setIsStandalone(standalone);
      return standalone;
    };

    const standalone = checkStandalone();
    const installedFlag = localStorage.getItem('pwa_is_installed') === 'true';

    if (standalone || installedFlag) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // 3. Check early captured beforeinstallprompt or attach listener
    if ((window as any).deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPWAInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as any).deferredPWAInstallPrompt = null;
      localStorage.setItem('pwa_is_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    const promptToUse = deferredPrompt || (window as any).deferredPWAInstallPrompt;

    if (!promptToUse) {
      // Fallback instruction if browser hasn't fired beforeinstallprompt yet
      alert('Untuk memasang EduVerse di Chrome/Edge: Klik menu browser (titik tiga ⋮ di pojok kanan atas browser) lalu pilih "Instal EduVerse" atau "Tambahkan ke Layar Utama".');
      return;
    }

    promptToUse.prompt();
    const { outcome } = await promptToUse.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      localStorage.setItem('pwa_is_installed', 'true');
    }
    setDeferredPrompt(null);
    (window as any).deferredPWAInstallPrompt = null;
  };

  return {
    canInstall: !isStandalone && !isInstalled,
    isStandalone,
    isInstalled,
    isIOS,
    showIOSModal,
    setShowIOSModal,
    triggerInstall,
  };
}

interface InstallPWAButtonProps {
  className?: string;
  variant?: 'header' | 'sidebar' | 'pill';
}

/**
 * Permanent Install Button:
 * Visible in Chrome/browser when not yet installed.
 * Completely hidden when app is running as an installed standalone PWA!
 */
export const InstallPWAButton: React.FC<InstallPWAButtonProps> = ({ 
  className = '', 
  variant = 'header' 
}) => {
  const { canInstall, isIOS, showIOSModal, setShowIOSModal, triggerInstall } = usePWA();

  // If already installed or opened in standalone mode, hide button completely!
  if (!canInstall) return null;

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={triggerInstall}
          type="button"
          title="Pasang aplikasi EduVerse ke laptop/HP Anda"
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#3B66F5]/10 hover:bg-[#3B66F5]/15 text-[#3B66F5] border border-blue-200/60 rounded-full text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-2xs ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-[#3B66F5]" />
          <span className="hidden sm:inline">Pasang Aplikasi</span>
          <span className="sm:hidden">Pasang</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          onClick={triggerInstall}
          type="button"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/15 ${className}`}
        >
          <Download className="w-4 h-4 text-blue-200" />
          <span>Pasang Aplikasi EduVerse</span>
        </button>
      )}

      {/* iOS Safari Guide Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-slate-800 relative"
            >
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B66F5] flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pasang di iPhone / iPad</h3>
                  <p className="text-[11px] text-slate-400">Tambahkan ke Layar Utama</p>
                </div>
              </div>

              <div className="space-y-2.5 my-4 text-xs text-slate-600">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl">
                  <span className="font-bold text-[#3B66F5]">1.</span>
                  <span>Ketuk tombol <Share className="w-3.5 h-3.5 inline text-[#3B66F5] mx-1" /> <strong>Bagikan</strong> di Safari.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl">
                  <span className="font-bold text-[#3B66F5]">2.</span>
                  <span>Pilih <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-1" /> <strong>Tambah ke Layar Utama</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl">
                  <span className="font-bold text-[#3B66F5]">3.</span>
                  <span>Ketuk <strong>Tambah</strong> di kanan atas. Selesai!</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full bg-[#3B66F5] hover:bg-blue-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
              >
                Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// Default export alias for compatibility
export const InstallPWA: React.FC = () => {
  return null; // Replaced by InstallPWAButton integrated directly in Navbar/Sidebar
};
