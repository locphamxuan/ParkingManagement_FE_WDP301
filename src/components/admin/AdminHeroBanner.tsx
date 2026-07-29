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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-3xl border border-blue-400/25 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-7 text-white shadow-xl ${className}`}
    >
      {/* Crystal Bevel Top Border */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      {/* Ambient Glow Orbs */}
      <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.22),transparent_70%)] pointer-events-none blur-2xl animate-pulse" />
      <div className="absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_70%)] pointer-events-none blur-2xl" />

      {/* Horizontal Cyber Shimmer Line */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        <div className="w-full h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent absolute top-1/2 cyber-shimmer" />
      </div>

      <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
        <div className="flex items-start gap-4">
          {icon ? (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-md shadow-md">
              {icon}
            </span>
          ) : null}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg bg-white/10 border border-white/20 text-[9px] font-black uppercase tracking-widest text-blue-200 font-mono shadow-sm mb-2">
              {badge}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
              {title}
            </h1>
            <p className="mt-1.5 max-w-xl text-xs font-semibold text-blue-100/80 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {rightElement ? <div className="shrink-0">{rightElement}</div> : null}
      </div>
    </motion.section>
  );
}
