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
        background: 'linear-gradient(90deg, #003B73 0%, #0056B3 30%, #0080FF 60%, #38BDF8 85%, #90E0EF 100%)',
        boxShadow: '0 20px 60px -12px rgba(0, 86, 179, 0.45), 0 8px 24px -6px rgba(0, 0, 0, 0.12)',
      }}
    >
      {/* Crystal Bevel Top Border */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

      {/* Bottom Reflection */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Ambient Glow Orb — Right (Soft light sky blue) */}
      <div
        className="absolute -right-16 -top-16 h-72 w-72 rounded-full pointer-events-none animate-pulse"
        style={{
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%)',
          filter: 'blur(24px)',
        }}
      />

      {/* Ambient Glow Orb — Left (Vibrant rich blue) */}
      <div
        className="absolute -left-10 -bottom-10 h-56 w-56 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,128,255,0.35) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Subtle Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'repeating-linear-gradient(60deg, transparent, transparent 40px, rgba(255,255,255,0.9) 40px, rgba(255,255,255,0.9) 41px)',
          }}
        />
      </div>

      {/* Bright Horizontal Shimmer */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div className="flex items-start gap-4">
          {icon ? (
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 16px rgba(0,59,115,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
            >
              {icon}
            </span>
          ) : null}
          <div>
            {/* Badge Chip */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.18em] text-blue-50 font-mono shadow-sm mb-2.5"
              style={{
                background: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.28)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-200 shadow-[0_0_6px_rgba(165,243,252,0.9)]" />
              {badge}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-[1.7rem] leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              {title}
            </h1>
            <p className="mt-2 max-w-xl text-[0.72rem] font-semibold text-blue-50/90 leading-relaxed">
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
