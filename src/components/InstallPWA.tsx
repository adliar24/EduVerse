import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Check, Share, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Check persistent localStorage flag if user already installed PWA on this device/browser
    const alreadyInstalledInStorage = localStorage.getItem('pwa_is_installed') === 'true';

    // 2. Check if app is currently running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.matchMedia('(display-mode: fullscreen)').matches 
      || (window.navigator as any).standalone === true;

    if (alreadyInstalledInStorage || isStandalone) {
      setIsInstalled(true);
      setShowBanner(false);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Check dismiss status from localStorage (show banner again after 3 days if dismissed)
    const lastDismissed = localStorage.getItem('pwa_banner_dismissed');
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    
    if (lastDismissed && now - parseInt(lastDismissed) < threeDays) {
      return;
    }

    // Handle Android / Chrome / Edge PWA prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    // Listen for browser native 'appinstalled' event (fires when installation completes)
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      localStorage.setItem('pwa_is_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show installation guide banner if not standalone and not installed
    if (iosDevice) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowBanner(false);
      setIsInstalled(true);
      localStorage.setItem('pwa_is_installed', 'true');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed', String(Date.now()));
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Floating Bottom-Right Banner Notification */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-2.5rem)] md:w-96 bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950 text-white rounded-2xl p-4 shadow-2xl border border-white/20 backdrop-blur-xl"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 flex items-center justify-center shrink-0 shadow-md border border-white/20">
              <img src="/logo.svg" alt="EduVerse" className="w-full h-full object-contain filter drop-shadow" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Aplikasi EduVerse
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-white leading-snug">Install EduVerse di HP/PC</h4>
              <p className="text-xs text-blue-200/90 font-medium mt-0.5 leading-relaxed">
                Akses cepat secepat aplikasi native, bisa tanpa kuota internet!
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between gap-2">
            <button
              onClick={handleDismiss}
              className="text-xs font-semibold text-blue-200 hover:text-white px-3 py-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              Nanti Saja
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span>Install Sekarang</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Modal Panduan Install iOS Safari */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-slate-800 relative overflow-hidden"
            >
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 p-2.5 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Install di iOS (iPhone/iPad)</h3>
                  <p className="text-xs text-slate-500 font-medium">Panduan singkat menambahkan ke Layar Utama</p>
                </div>
              </div>

              <div className="space-y-3 my-5">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs text-slate-700 font-medium leading-relaxed">
                    Buka menu <span className="font-bold text-blue-600">Bagikan / Share</span> di browser Safari (ikon persegi panah ke atas <Share className="w-3.5 h-3.5 inline mx-1 text-blue-600" />).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs text-slate-700 font-medium leading-relaxed">
                    Geser ke bawah dan pilih opsi <span className="font-bold text-slate-900">"Tambah ke Layar Utama"</span> / <span className="font-bold text-slate-900">"Add to Home Screen"</span> (<PlusSquare className="w-3.5 h-3.5 inline mx-1 text-slate-700" />).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs text-slate-700 font-medium leading-relaxed">
                    Tekan <span className="font-bold text-blue-600">"Tambah / Add"</span> di sudut kanan atas. Aplikasi EduVerse siap digunakan dari layar utama iPhone Anda!
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowIOSModal(false);
                  setShowBanner(false);
                  setIsInstalled(true);
                  localStorage.setItem('pwa_is_installed', 'true');
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-blue-600/25 cursor-pointer"
              >
                Saya Mengerti (Sudah Ditambahkan)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
