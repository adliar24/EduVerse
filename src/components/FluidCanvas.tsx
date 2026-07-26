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

    // Wave parameters for liquid fluid motion
    let step = 0;
    const waves = [
      { amplitude: 60, wavelength: 0.008, speed: 0.015, color: 'rgba(59, 102, 245, 0.45)' },   // Electric Royal Blue
      { amplitude: 80, wavelength: 0.005, speed: 0.012, color: 'rgba(37, 99, 235, 0.35)' },    // Sapphire Blue
      { amplitude: 50, wavelength: 0.01, speed: 0.02, color: 'rgba(56, 189, 248, 0.3)' },      // Sky Cyan
      { amplitude: 90, wavelength: 0.004, speed: 0.008, color: 'rgba(96, 165, 250, 0.25)' }   // Soft Blue
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep Electric Blue gradient backdrop
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#1D4ED8');
      bgGradient.addColorStop(0.5, '#2563EB');
      bgGradient.addColorStop(1, '#3B66F5');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      step += 1;

      // Draw fluid waves
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 10) {
          const y =
            height * 0.5 +
            Math.sin(x * wave.wavelength + step * wave.speed) * wave.amplitude +
            Math.cos(x * wave.wavelength * 0.5 + step * wave.speed * 0.7) * (wave.amplitude * 0.5);

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
