import React, { useEffect, useRef } from 'react';

export const FluidCanvas: React.FC<{ className?: string }> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;

    const setCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const handleResize = () => {
      if (!canvas) return;
      setCanvasSize();
      if (prefersReducedMotion) render();
    };

    setCanvasSize();
    window.addEventListener('resize', handleResize);

    // Multi-harmonic liquid fluid wave parameters spanning upper, center, and bottom using 4 brand colors
    let step = 0;
    const waves = [
      // 1. Emerald Green Liquid Crest (HIJAU)
      { 
        yRatio: 0.25, 
        amp1: 70, amp2: 45, amp3: 25,
        w1: 0.0035, w2: 0.0020, w3: 0.0060,
        s1: 0.012, s2: 0.009, s3: 0.015,
        colorStart: 'rgba(16, 185, 129, 0.52)', // Emerald Green
        colorEnd: 'rgba(20, 184, 166, 0.38)'    // Teal Green
      },
      // 2. Royal Blue Liquid Swell (BIRU)
      { 
        yRatio: 0.40, 
        amp1: 75, amp2: 45, amp3: 25,
        w1: 0.0038, w2: 0.0022, w3: 0.0065,
        s1: 0.011, s2: 0.013, s3: 0.014,
        colorStart: 'rgba(37, 99, 235, 0.50)',  // Royal Blue
        colorEnd: 'rgba(29, 78, 216, 0.38)'     // Sapphire Indigo
      },
      // 3. Amber Gold Liquid Flow (OREN)
      { 
        yRatio: 0.55, 
        amp1: 75, amp2: 45, amp3: 25,
        w1: 0.0036, w2: 0.0025, w3: 0.0060,
        s1: 0.013, s2: 0.010, s3: 0.015,
        colorStart: 'rgba(245, 158, 11, 0.50)', // Amber Gold
        colorEnd: 'rgba(234, 88, 12, 0.38)'     // Vibrant Orange
      },
      // 4. Coral Red Liquid Swell (MERAH)
      { 
        yRatio: 0.70, 
        amp1: 75, amp2: 45, amp3: 25,
        w1: 0.0035, w2: 0.0022, w3: 0.0065,
        s1: 0.012, s2: 0.011, s3: 0.014,
        colorStart: 'rgba(244, 63, 94, 0.50)',  // Coral Rose
        colorEnd: 'rgba(225, 29, 72, 0.38)'     // Crimson Red
      },
      // 5. Deep Royal Blue & Emerald Blend
      { 
        yRatio: 0.85, 
        amp1: 75, amp2: 45, amp3: 25,
        w1: 0.0037, w2: 0.0024, w3: 0.0060,
        s1: 0.011, s2: 0.012, s3: 0.015,
        colorStart: 'rgba(30, 58, 138, 0.58)',  // Deep Royal Blue
        colorEnd: 'rgba(5, 150, 105, 0.40)'     // Deep Emerald Blend
      },
      // 6. Surface Liquid Highlight (Pure White & Amber Sparkle)
      { 
        yRatio: 0.95, 
        amp1: 70, amp2: 40, amp3: 20,
        w1: 0.0035, w2: 0.0021, w3: 0.0065,
        s1: 0.013, s2: 0.010, s3: 0.016,
        colorStart: 'rgba(255, 255, 255, 0.30)', // Translucent White
        colorEnd: 'rgba(251, 191, 36, 0.22)'     // Amber Crest Highlight
      }
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep atmospheric dark gradient base so 4 fluid colors glow vividly
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#0F172A');    // Slate 900
      bgGradient.addColorStop(0.35, '#1E1B4B'); // Indigo 950
      bgGradient.addColorStop(0.7, '#172554');  // Blue 950
      bgGradient.addColorStop(1, '#0F172A');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      step += 1;

      // Draw compound multi-harmonic fluid waves with 4-color linear gradients
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 8) {
          const y =
            height * wave.yRatio +
            Math.sin(x * wave.w1 + step * wave.s1) * wave.amp1 +
            Math.cos(x * wave.w2 - step * wave.s2) * wave.amp2 +
            Math.sin(x * wave.w3 + step * wave.s3) * wave.amp3;

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

      // Ambient 4-color glowing radial light pulse
      const pulseX = width * 0.5 + Math.sin(step * 0.01) * 100;
      const pulseY = height * 0.4 + Math.cos(step * 0.015) * 80;
      const radialGradient = ctx.createRadialGradient(pulseX, pulseY, 50, pulseX, pulseY, Math.max(width, height) * 0.6);
      radialGradient.addColorStop(0, 'rgba(59, 130, 246, 0.20)');  // Blue center glow
      radialGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.15)'); // Emerald ambient aura
      radialGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      if (prefersReducedMotion) return;

      if (!document.hidden) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        setTimeout(() => {
          animationFrameId = requestAnimationFrame(render);
        }, 300);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
    />
  );
};

export default FluidCanvas;
