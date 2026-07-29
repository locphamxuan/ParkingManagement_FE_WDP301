import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AdminHeroBannerProps {
  badge: string;
  title: string;
  description: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
  className?: string;
}

export function AdminHeroBanner({
  badge,
  title,
  description,
  icon,
  rightElement,
  className = '',
}: AdminHeroBannerProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-3xl p-7 text-white shadow-2xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, #0052D4 0%, #1a6fe8 30%, #4364F7 65%, #2979ff 100%)',
        boxShadow: '0 20px 60px -12px rgba(0, 82, 212, 0.55), 0 8px 24px -6px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Crystal Bevel Top Border */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Bottom Reflection */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      {/* Ambient Glow Orb — Right */}
      <div
        className="absolute -right-16 -top-16 h-72 w-72 rounded-full pointer-events-none animate-pulse"
        style={{
          background: 'radial-gradient(circle at center, rgba(99,179,237,0.28) 0%, transparent 70%)',
          filter: 'blur(24px)',
        }}
      />

      {/* Ambient Glow Orb — Left */}
      <div
        className="absolute -left-10 -bottom-10 h-56 w-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.12) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Diagonal Shimmer Lines */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'repeating-linear-gradient(60deg, transparent, transparent 40px, rgba(255,255,255,0.8) 40px, rgba(255,255,255,0.8) 41px)',
          }}
        />
      </div>

      {/* Bright Horizontal Shimmer */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/18 to-transparent pointer-events-none" />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div className="flex items-start gap-4">
          {icon ? (
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 16px rgba(0,82,212,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              {icon}
            </span>
          ) : null}
          <div>
            {/* Badge Chip */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.18em] text-blue-100 font-mono shadow-sm mb-2.5"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.22)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(103,232,249,0.9)]" />
              {badge}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-[1.7rem] leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
              {title}
            </h1>
            <p className="mt-2 max-w-xl text-[0.72rem] font-semibold text-blue-100/85 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {rightElement ? (
          <div className="shrink-0 xl:pl-4">{rightElement}</div>
        ) : null}
      </div>
    </motion.section>
  );
}
