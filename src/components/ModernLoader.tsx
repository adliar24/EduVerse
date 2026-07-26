import React from 'react';
import { motion } from 'framer-motion';

export default function ModernLoader() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center overflow-hidden z-[99999]">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.25, 0.9, 1],
            x: [0, 40, -30, 0],
            y: [0, -50, 40, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#3B66F5]/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 0.85, 1.15, 1],
            x: [0, -40, 30, 0],
            y: [0, 40, -40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#2563EB]/20 rounded-full blur-[140px]"
        />
      </div>

      {/* Fluid / Organic Loader */}
      <div className="relative w-32 h-32 flex items-center justify-center z-10">
        {/* Outer glowing pulsing ring */}
        <motion.div
          animate={{
            rotate: 360,
            borderRadius: ["42% 58% 70% 30% / 45% 45% 55% 55%", "70% 30% 52% 48% / 60% 40% 60% 40%", "42% 58% 70% 30% / 45% 45% 55% 55%"]
          }}
          transition={{
            rotate: { duration: 12, repeat: Infinity, ease: "linear" },
            borderRadius: { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute inset-0 border border-[#3B66F5]/40 bg-gradient-to-tr from-[#3B66F5]/10 to-[#2563EB]/10 shadow-[0_0_40px_rgba(59,102,245,0.3)]"
        />

        {/* Middle reverse-rotating morphing ring */}
        <motion.div
          animate={{
            rotate: -360,
            borderRadius: ["50% 50% 30% 70% / 50% 60% 40% 50%", "30% 70% 70% 30% / 50% 30% 70% 50%", "50% 50% 30% 70% / 50% 60% 40% 50%"]
          }}
          transition={{
            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
            borderRadius: { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute w-[80%] h-[80%] border border-[#2563EB]/50 bg-gradient-to-bl from-[#3B66F5]/10 to-[#1D4ED8]/10 shadow-[0_0_30px_rgba(59,102,245,0.3)]"
        />

        {/* Inner solid glowing fluid ball */}
        <motion.div
          animate={{
            scale: [0.92, 1.08, 0.92],
            borderRadius: ["60% 40% 50% 50% / 40% 60% 50% 50%", "40% 60% 50% 50% / 60% 40% 50% 50%", "60% 40% 50% 50% / 40% 60% 50% 50%"]
          }}
          transition={{
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            borderRadius: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute w-[45%] h-[45%] bg-gradient-to-br from-[#60A5FA] via-[#3B66F5] to-[#1D4ED8] shadow-[0_0_25px_rgba(59,102,245,0.6)] flex items-center justify-center"
        >
          {/* A tiny accent circle in the center */}
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-pulse" />
        </motion.div>
      </div>
    </div>
  );
}
