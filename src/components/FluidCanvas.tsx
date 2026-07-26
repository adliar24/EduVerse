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

    // Wave parameters for liquid fluid motion across top, center, and bottom
    let step = 0;
    const waves = [
      // Upper & middle swells
      { yRatio: 0.45, amplitude: 65, wavelength: 0.007, speed: 0.015, color: 'rgba(59, 102, 245, 0.4)' },   // Electric Royal Blue
      { yRatio: 0.55, amplitude: 85, wavelength: 0.005, speed: 0.012, color: 'rgba(37, 99, 235, 0.35)' },    // Sapphire Blue
      { yRatio: 0.65, amplitude: 55, wavelength: 0.009, speed: 0.018, color: 'rgba(56, 189, 248, 0.3)' },      // Sky Cyan
      
      // Bottom flowing liquid waves
      { yRatio: 0.80, amplitude: 75, wavelength: 0.006, speed: 0.014, color: 'rgba(37, 99, 235, 0.45)' },    // Deep Sapphire Base
      { yRatio: 0.88, amplitude: 45, wavelength: 0.011, speed: 0.022, color: 'rgba(96, 165, 250, 0.35)' },   // Soft Blue Base
      { yRatio: 0.94, amplitude: 35, wavelength: 0.015, speed: 0.025, color: 'rgba(255, 255, 255, 0.15)' }    // White Highlight Crest
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
            height * wave.yRatio +
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
