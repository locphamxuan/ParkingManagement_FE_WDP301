import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Car, Bike, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { LongTermPackage } from '@/services/user/userApi';
import { isCarPackage, fmtMoney, categoryLabels } from '@/pages/user/packageBookingHelper';
import type { CategoryColorSet } from '@/pages/user/packageBookingHelper';

interface PackageCardProps {
  pkg: LongTermPackage;
  isSelected: boolean;
  isLocked: boolean;
  isDisabled: boolean;
  cat: 'weekly' | 'monthly' | 'yearly';
  colors: CategoryColorSet;
  onClick: () => void;
}

export function PackageCard({ pkg, isSelected, isLocked, isDisabled, cat, colors, onClick }: PackageCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Generate unique properties for each glitter particle once
  const particles = useMemo(() => {
    return Array.from({ length: 16 }).map((_, i) => {
      const size = 3 + Math.random() * 4;
      const left = Math.random() * 100;
      const delay = Math.random() * 1.5;
      const duration = 1.2 + Math.random() * 1.8;
      const type = i % 3 === 0 ? 'star' : i % 3 === 1 ? 'diamond' : 'circle';
      return { id: i, size, left, delay, duration, type };
    });
  }, []);

  const lockedTooltip = isDisabled
    ? 'Choose a vehicle type before selecting a package.'
    : isLocked
    ? (isCarPackage(pkg)
        ? 'This package is for cars. You have selected motorcycle.'
        : 'This package is for motorcycles. You have selected car.')
    : undefined;

  return (
    <button
      type="button"
      disabled={isDisabled || isLocked}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={lockedTooltip}
      className={`relative rounded-2xl border p-4 text-left transition-all duration-300 ${
        isDisabled || isLocked
          ? 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed'
          : isSelected
            ? `${colors.borderSelected} ${colors.bgSelected} ${colors.shadowSelected} scale-[1.04]`
            : `${colors.borderNormal} ${colors.bgNormal} ${colors.borderHover} ${colors.bgHover} ${colors.shadowHover} hover:scale-[1.02]`
      }`}
    >
      {(isDisabled || isLocked) && (
        <span className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
          <Lock size={11} /> {isDisabled ? 'Choose vehicle' : 'Incompatible'}
        </span>
      )}

      {/* Glitter particles shown on hover (only if not locked) */}
      {!isDisabled && !isLocked && isHovered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0">
          {particles.map((p) => {
            let color = 'bg-amber-400';
            if (colors.glitterColors) {
              color = colors.glitterColors[p.id % colors.glitterColors.length];
            }

            const style: React.CSSProperties = {
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              top: '-10px',
            };

            let shapeClass = 'rounded-full';
            if (p.type === 'star') {
              shapeClass = '';
              style.clipPath =
                'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
            } else if (p.type === 'diamond') {
              shapeClass = '';
              style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
            }

            return <span key={p.id} className={`glitter-particle ${color} ${shapeClass}`} style={style} />;
          })}
        </div>
      )}

      {/* Floating Ribbon / Badge */}
      <span
        className={`absolute -top-2.5 ${isDisabled || isLocked ? 'left-4' : 'right-4'} rounded-full bg-gradient-to-r ${colors.accent} px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white shadow-[0_0_12px_rgba(251,191,36,0.15)] z-10`}
      >
        {cat === 'weekly' ? 'Saver' : cat === 'monthly' ? 'Popular' : 'Best value'}
      </span>
      <span className={`text-[9px] font-black uppercase tracking-wider ${colors.text} relative z-10`}>
        {categoryLabels[cat]}
      </span>
      <h4
        className="relative z-10 mt-1 flex items-center gap-1.5 text-sm font-extrabold text-slate-900 transition-colors"
      >
        {isCarPackage(pkg) ? (
          <Car size={15} className={`${colors.text} shrink-0`} />
        ) : (
          <Bike size={15} className={`${colors.text} shrink-0`} />
        )}
        <span>{pkg.name}</span>
      </h4>
      <p className="relative z-10 mt-1 text-xs text-slate-500">{pkg.durationDays} days</p>
      {pkg.description && (
        <p className="relative z-10 mt-1.5 border-t border-slate-200 pt-1.5 text-[10px] italic leading-relaxed text-slate-500">
          {pkg.description}
        </p>
      )}
      <p
        className={`mt-2 text-lg font-black ${colors.text} relative z-10 transition-all duration-300 ${
          isSelected ? 'drop-shadow-[0_0_10px_rgba(0,0,0,0.2)] scale-105 origin-left' : ''
        }`}
      >
        {fmtMoney(pkg.price)}
      </p>
      <span
        className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold relative z-10 ${
          isSelected ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600'
        }`}
      >
        <ShieldCheck size={10} /> Fixed slot
      </span>
      {isSelected && (
        <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className="absolute right-3 top-3 z-20">
          <CheckCircle2 size={18} className={`${colors.text} drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]`} />
        </motion.div>
      )}
    </button>
  );
}
