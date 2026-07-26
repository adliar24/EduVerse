import React, { useEffect, useRef } from 'react';

export const FluidCanvas: React.FC<{ className?: string }> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Multi-harmonic liquid fluid wave parameters spanning upper, center, and bottom
    let step = 0;
    const waves = [
      // 1. Upper Rolling Liquid Crests
      { 
        yRatio: 0.28, 
        amp1: 50, amp2: 30, amp3: 20,
        w1: 0.006, w2: 0.003, w3: 0.012,
        s1: 0.016, s2: 0.011, s3: 0.022,
        color: 'rgba(59, 102, 245, 0.45)' // Electric Royal Blue
      },
      // 2. Upper-Mid Liquid Swell
      { 
        yRatio: 0.42, 
        amp1: 70, amp2: 45, amp3: 25,
        w1: 0.005, w2: 0.002, w3: 0.009,
        s1: 0.012, s2: 0.015, s3: 0.019,
        color: 'rgba(56, 189, 248, 0.38)' // Sky Cyan
      },
      // 3. Center Liquid Flow
      { 
        yRatio: 0.58, 
        amp1: 85, amp2: 50, amp3: 30,
        w1: 0.004, w2: 0.008, w3: 0.003,
        s1: 0.014, s2: 0.009, s3: 0.017,
        color: 'rgba(37, 99, 235, 0.40)' // Sapphire Blue
      },
      // 4. Lower-Mid Rolling Deep Swell
      { 
        yRatio: 0.74, 
        amp1: 75, amp2: 40, amp3: 20,
        w1: 0.006, w2: 0.004, w3: 0.010,
        s1: 0.018, s2: 0.012, s3: 0.024,
        color: 'rgba(96, 165, 250, 0.32)' // Soft Cyan Blue
      },
      // 5. Deep Base Fluid Flow
      { 
        yRatio: 0.86, 
        amp1: 55, amp2: 35, amp3: 18,
        w1: 0.008, w2: 0.005, w3: 0.014,
        s1: 0.021, s2: 0.016, s3: 0.028,
        color: 'rgba(37, 99, 235, 0.50)' // Deep Sapphire Base
      },
      // 6. Surface Liquid Foam Highlight
      { 
        yRatio: 0.93, 
        amp1: 40, amp2: 25, amp3: 15,
        w1: 0.012, w2: 0.007, w3: 0.018,
        s1: 0.026, s2: 0.020, s3: 0.032,
        color: 'rgba(255, 255, 255, 0.22)' // Pure White Crest Highlight
      }
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Rich 3D Electric Blue gradient backdrop
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#1E40AF');
      bgGradient.addColorStop(0.4, '#1D4ED8');
      bgGradient.addColorStop(0.8, '#2563EB');
      bgGradient.addColorStop(1, '#3B66F5');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      step += 1;

      // Draw compound multi-harmonic fluid waves
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

        ctx.fillStyle = wave.color;
        ctx.fill();
      });

      // Ambient radial light pulse
      const pulseX = width * 0.5 + Math.sin(step * 0.01) * 100;
      const pulseY = height * 0.4 + Math.cos(step * 0.015) * 80;
      const radialGradient = ctx.createRadialGradient(pulseX, pulseY, 50, pulseX, pulseY, Math.max(width, height) * 0.6);
      radialGradient.addColorStop(0, 'rgba(129, 140, 248, 0.25)');
      radialGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGradient;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
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
