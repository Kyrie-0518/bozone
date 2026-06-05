import React, { useEffect, useRef } from 'react';

const colors = ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d', '#fef3c7', '#fde68a'];

class Particle {
  x = 0; y = 0; size = 0; speedX = 0; speedY = 0;
  color = ''; opacity = 0; pulse = 0; drift = 0;

  constructor(w: number, h: number) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.size = Math.random() * 2.5 + 0.5;
    this.speedX = Math.random() * 0.3 - 0.15;
    this.speedY = Math.random() * 0.3 - 0.15;
    this.opacity = Math.random() * 0.2 + 0.04;
    this.pulse = Math.random() * Math.PI * 2;
    this.drift = Math.random() * 0.002 + 0.0005;
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update(w: number, h: number, t: number) {
    this.x += this.speedX + Math.sin(t * this.drift + this.pulse) * 0.15;
    this.y += this.speedY + Math.cos(t * this.drift + this.pulse) * 0.15;
    if (this.x > w + 20) this.x = -20; else if (this.x < -20) this.x = w + 20;
    if (this.y > h + 20) this.y = -20; else if (this.y < -20) this.y = h + 20;
  }

  draw(ctx: CanvasRenderingContext2D, t: number) {
    const glow = Math.sin(t * 0.001 + this.pulse) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity * (0.6 + glow * 0.4);
    ctx.shadowBlur = this.size * 4;
    ctx.shadowColor = this.color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
}

export default function MagicalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let id: number;
    let w = 0, h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const init = () => {
      particles = [];
      const count = Math.min(200, Math.floor((w * h) / 10000));
      for (let i = 0; i < count; i++) particles.push(new Particle(w, h));
    };

    const animate = (t: number) => {
      // Warm parchment gradient
      const grad = ctx.createRadialGradient(w * 0.3, h * 0.3, w * 0.05, w / 2, h / 2, Math.max(w, h));
      grad.addColorStop(0, '#faf6f0');
      grad.addColorStop(0.4, '#f5efe5');
      grad.addColorStop(0.8, '#ede5d8');
      grad.addColorStop(1, '#e5dccd');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      particles.forEach((p) => { p.update(w, h, t); p.draw(ctx, t); });
      id = requestAnimationFrame(animate);
    };

    const handleResize = () => { resize(); init(); };
    window.addEventListener('resize', handleResize);
    resize(); init();
    id = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}
