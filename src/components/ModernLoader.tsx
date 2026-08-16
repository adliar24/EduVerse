import React from 'react';
import { motion } from 'framer-motion';

export default function ModernLoader() {
  return (
    <div className="fixed inset-0 bg-[#0F172A] flex flex-col items-center justify-center overflow-hidden z-[99999]">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"
          style={{ transform: 'translateZ(0)', willChange: 'opacity' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse"
          style={{ transform: 'translateZ(0)', willChange: 'opacity' }}
        />
      </div>

      {/* Fluid / Organic Loader */}
      <div className="relative w-28 h-28 flex items-center justify-center z-10">
        {/* Outer glowing pulsing ring */}
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.06, 1],
          }}
          transition={{
            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
          className="absolute inset-0 rounded-[2.5rem] border-2 border-indigo-400/40 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.25)]"
        />

        {/* Middle reverse-rotating morphing ring */}
        <motion.div
          animate={{
            rotate: -360,
            scale: [1, 0.94, 1],
          }}
          transition={{
            rotate: { duration: 6, repeat: Infinity, ease: "linear" },
            scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
          }}
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
          className="absolute w-[75%] h-[75%] rounded-3xl border-2 border-blue-400/40 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
        />

        {/* Inner solid glowing fluid ball */}
        <motion.div
          animate={{
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{ transform: 'translateZ(0)', willChange: 'transform' }}
          className="absolute w-[40%] h-[40%] rounded-2xl bg-white shadow-[0_0_20px_rgba(255,255,255,0.7)] flex items-center justify-center"
        >
          {/* A tiny accent circle in the center */}
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
        </motion.div>
      </div>

      <p className="mt-8 text-slate-300 font-bold text-xs tracking-wider uppercase animate-pulse">Memuat EduVerse...</p>
    </div>
  );
}
