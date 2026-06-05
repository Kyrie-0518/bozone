import React, { useState, useRef } from 'react';

interface CardContainerProps {
  children: React.ReactNode;
}

export default function CardContainer({ children }: CardContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setRotate({ x: (y - cy) / 25, y: (cx - x) / 25 });
    containerRef.current.style.setProperty('--mx', `${(x / rect.width) * 100}%`);
    containerRef.current.style.setProperty('--my', `${(y / rect.height) * 100}%`);
  };

  const handleMouseLeave = () => setRotate({ x: 0, y: 0 });

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
        transition: 'transform 0.15s ease-out',
      }}
      className="group relative w-full rounded-[10px] shadow-[0_4px_24px_rgba(28,25,23,0.08)] transition-shadow duration-500 hover:shadow-[0_8px_32px_rgba(217,119,6,0.12)]"
    >
      {/* Glare spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-[10px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: 'radial-gradient(circle at var(--mx, 50%) var(--my, 50%), rgba(217,119,6,0.06) 0%, transparent 60%)',
        }}
      />
      {/* White card */}
      <div className="relative z-0 rounded-[10px] border border-[#e8e5e0] bg-white px-8 py-8 sm:px-12">
        {children}
      </div>
    </div>
  );
}
