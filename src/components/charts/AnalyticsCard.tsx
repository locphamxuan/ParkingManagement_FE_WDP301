import { useRef } from 'react';
import { motion, useMotionValue, useMotionTemplate, useSpring, useTransform } from 'framer-motion';
import styles from '@/styles/modules/AnalyticsCard.module.css';

interface AnalyticsCardProps {
  label: string;
  value: string;
  delta: string;
  index?: number;
  icon?: React.ReactNode;
}

export function AnalyticsCard({ label, value, delta, index = 0, icon }: AnalyticsCardProps) {
  const isPositive = !delta.includes('-');
  const ref = useRef<HTMLDivElement>(null);

  // Configuration settings for different card themes
  const cardThemes = [
    {
      glowRight: 'bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.22),transparent_70%)]',
      glowLeft: 'bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.15),transparent_70%)]',
      iconBox: 'bg-blue-500/10 border-blue-500/20 text-blue-500 group-hover:bg-blue-500 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(59,130,246,0.3)]',
      valueText: 'from-slate-900 via-blue-950 to-indigo-900 group-hover:from-blue-700 group-hover:to-indigo-850',
      bottomLine: 'from-blue-500/0 via-blue-500/60 to-blue-500/0',
      borderHover: 'hover:border-blue-500/35 hover:shadow-[0_20px_40px_rgba(59,130,246,0.12)]',
    },
    {
      glowRight: 'bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.22),transparent_70%)]',
      glowLeft: 'bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.15),transparent_70%)]',
      iconBox: 'bg-purple-500/10 border-purple-500/20 text-purple-500 group-hover:bg-purple-500 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(139,92,246,0.3)]',
      valueText: 'from-slate-900 via-purple-950 to-violet-900 group-hover:from-purple-700 group-hover:to-violet-850',
      bottomLine: 'from-purple-500/0 via-purple-500/60 to-purple-500/0',
      borderHover: 'hover:border-purple-500/35 hover:shadow-[0_20px_40px_rgba(139,92,246,0.12)]',
    },
    {
      glowRight: 'bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.22),transparent_70%)]',
      glowLeft: 'bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.15),transparent_70%)]',
      iconBox: 'bg-amber-500/10 border-amber-500/20 text-amber-600 group-hover:bg-amber-500 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(245,158,11,0.3)]',
      valueText: 'from-slate-900 via-amber-950 to-orange-900 group-hover:from-amber-700 group-hover:to-orange-850',
      bottomLine: 'from-amber-500/0 via-amber-500/60 to-amber-500/0',
      borderHover: 'hover:border-amber-500/35 hover:shadow-[0_20px_40px_rgba(245,158,11,0.12)]',
    },
    {
      glowRight: 'bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),transparent_70%)]',
      glowLeft: 'bg-[radial-gradient(circle_at_center,rgba(5,150,105,0.15),transparent_70%)]',
      iconBox: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]',
      valueText: 'from-slate-900 via-emerald-950 to-teal-900 group-hover:from-emerald-700 group-hover:to-teal-850',
      bottomLine: 'from-emerald-500/0 via-emerald-500/60 to-emerald-500/0',
      borderHover: 'hover:border-emerald-500/35 hover:shadow-[0_20px_40px_rgba(16,185,129,0.12)]',
    },
  ];

  const theme = cardThemes[index % cardThemes.length];

  // Mouse-tracking motion values for 3D parallax tilt
  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);
  const springX = useSpring(rawX, { stiffness: 160, damping: 22 });
  const springY = useSpring(rawY, { stiffness: 160, damping: 22 });
  const rotateY = useTransform(springX, [0, 1], [-10, 10]);
  const rotateX = useTransform(springY, [0, 1], [9, -9]);
  // Vệt loé sáng (specular) chạy theo con trỏ → tăng cảm giác chiều sâu 3D.
  const glareX = useTransform(springX, [0, 1], ['0%', '100%']);
  const glareY = useTransform(springY, [0, 1], ['0%', '100%']);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.28), transparent 55%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width);
    rawY.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    rawX.set(0.5);
    rawY.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15, delay: index * 0.07 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '900px',
      }}
    >
      <div className={`h-full relative overflow-hidden rounded-2xl p-6 glass-premium shadow-2xl transition-all duration-500 group cursor-default ${theme.borderHover}`}>
        
        {/* Dynamic corner neon spot glow — shifts on hover */}
        <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${theme.glowRight} pointer-events-none transition-all duration-500 group-hover:scale-150 group-hover:opacity-75`} />
        <div className={`absolute -left-6 -bottom-6 h-16 w-16 rounded-full ${theme.glowLeft} pointer-events-none group-hover:scale-125 transition-all duration-500`} />
        
        {/* Content elevated with preserve-3d for floating layering effect */}
        <div className={`relative z-10 ${styles.preserve3d}`}>

          {/* Top row: label + optional icon */}
          <div className={`flex items-center justify-between mb-3 ${styles.layerZ8}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">
              {label}
            </p>
            {icon && (
              <div className={`w-8.5 h-8.5 rounded-xl border flex items-center justify-center transition-all duration-300 ${theme.iconBox}`}>
                {icon}
              </div>
            )}
          </div>

          {/* Main value — elevated forward with parallax depth */}
          <div className={styles.layerZ28}>
            <h3 className={`text-4xl font-extrabold tracking-tight bg-gradient-to-r ${theme.valueText} bg-clip-text text-transparent transition-all duration-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.05)]`}>
              {value}
            </h3>
          </div>

          {/* Delta badge */}
          <div className={`mt-4 flex items-center gap-2 ${styles.layerZ10}`}>
            <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase font-mono border ${
              isPositive 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                : 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
            }`}>
              <span>{isPositive ? '▲' : '▼'}</span>
              {delta}
            </span>
            <span className="text-[10px] font-bold text-slate-500">vs last month</span>
          </div>
        </div>

        {/* Neon bottom accent line — visible on hover */}
        <div className={`absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r ${theme.bottomLine} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

        {/* Ambient micro-grid texture overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.015)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none rounded-2xl" />

        {/* Vệt loé sáng chạy theo nghiêng — lớp trên cùng, hoà trộn mềm */}
        <motion.div
          className={`absolute inset-0 rounded-2xl pointer-events-none mix-blend-soft-light ${styles.layerZ40}`}
          style={{ background: glare }}
        />
      </div>
    </motion.div>
  );
}
