import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="fixed top-2.5 inset-x-0 flex justify-center z-[9999] pointer-events-none px-4">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            key="offline-pill"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white border border-slate-700/80 shadow-md backdrop-blur-md text-xs"
          >
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-amber-300">Mode Offline</span>
            <span className="text-slate-300 text-[11px] hidden sm:inline">• Fitur lokal & absensi tetap aktif</span>
          </motion.div>
        )}

        {isOnline && showReconnected && (
          <motion.div
            key="online-pill"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white border border-emerald-500/40 shadow-md backdrop-blur-md text-xs"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-emerald-400">Kembali Online</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
