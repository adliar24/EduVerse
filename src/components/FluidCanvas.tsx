import React, { useEffect, useRef } from 'react';

export const FluidCanvas: React.FC<{ className?: string }> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let isRunning = true;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;

    const setCanvasSize = () => {
      // Use 1.0 DPR for smooth ambient background waves without GPU memory bloat or micro-stuttering
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    const handleResize = () => {
      if (!canvas) return;
      setCanvasSize();
      if (prefersReducedMotion) render();
    };

    setCanvasSize();
    window.addEventListener('resize', handleResize);

    // Optimized harmonic liquid fluid wave parameters
    let step = 0;
    const waves = [
      // 1. Emerald & Teal Crest
      { 
        yRatio: 0.28, 
        amp1: 50, amp2: 30,
        w1: 0.0032, w2: 0.0018,
        s1: 0.010, s2: 0.008,
        colorStart: 'rgba(16, 185, 129, 0.45)',
        colorEnd: 'rgba(20, 184, 166, 0.30)'
      },
      // 2. Royal Indigo & Blue Swell
      { 
        yRatio: 0.46, 
        amp1: 55, amp2: 35,
        w1: 0.0035, w2: 0.0020,
        s1: 0.009, s2: 0.011,
        colorStart: 'rgba(37, 99, 235, 0.42)',
        colorEnd: 'rgba(79, 70, 229, 0.32)'
      },
      // 3. Amber Gold & Orange Flow
      { 
        yRatio: 0.65, 
        amp1: 55, amp2: 30,
        w1: 0.0034, w2: 0.0022,
        s1: 0.011, s2: 0.009,
        colorStart: 'rgba(245, 158, 11, 0.42)',
        colorEnd: 'rgba(234, 88, 12, 0.28)'
      },
      // 4. Deep Navy & Emerald Blend
      { 
        yRatio: 0.84, 
        amp1: 50, amp2: 25,
        w1: 0.0036, w2: 0.0021,
        s1: 0.010, s2: 0.010,
        colorStart: 'rgba(15, 23, 42, 0.55)',
        colorEnd: 'rgba(5, 150, 105, 0.32)'
      }
    ];

    const render = () => {
      if (!isRunning) return;

      // Dark background fill
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#0F172A');
      bgGradient.addColorStop(0.4, '#1E1B4B');
      bgGradient.addColorStop(0.8, '#172554');
      bgGradient.addColorStop(1, '#0F172A');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      step += 1;

      // Draw fluid waves with smooth step increments
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, height);

        const xStep = 18; // Optimized step size for buttery 60fps performance
        for (let x = 0; x <= width + xStep; x += xStep) {
          const y =
            height * wave.yRatio +
            Math.sin(x * wave.w1 + step * wave.s1) * wave.amp1 +
            Math.cos(x * wave.w2 - step * wave.s2) * wave.amp2;

          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const waveGradient = ctx.createLinearGradient(0, 0, width, 0);
        waveGradient.addColorStop(0, wave.colorStart);
        waveGradient.addColorStop(1, wave.colorEnd);

        ctx.fillStyle = waveGradient;
        ctx.fill();
      });

      // Subtle ambient glowing light pulse
      const pulseX = width * 0.5 + Math.sin(step * 0.008) * 80;
      const pulseY = height * 0.45 + Math.cos(step * 0.012) * 60;
      const radialGradient = ctx.createRadialGradient(pulseX, pulseY, 60, pulseX, pulseY, Math.max(width, height) * 0.5);
      radialGradient.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
      radialGradient.addColorStop(0.6, 'rgba(16, 185, 129, 0.10)');
      radialGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      if (prefersReducedMotion) return;

      if (!document.hidden) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        setTimeout(() => {
          if (isRunning) animationFrameId = requestAnimationFrame(render);
        }, 500);
      }
    };

    render();

    const handleVisibilityChange = () => {
      if (!document.hidden && isRunning) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed inset-0 pointer-events-none z-0 transform-gpu ${className}`}
      style={{ transform: 'translateZ(0)', willChange: 'transform' }}
    />
  );
};

export default FluidCanvas;
