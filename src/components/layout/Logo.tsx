import pbmsMark from '@/assets/pbms-mark-professional.png';

interface LogoProps {
  /** 'mark' = icon only (favicon-style square). 'full' = icon + wordmark. */
  variant?: 'mark' | 'full';
  /** Pixel size of the square mark. */
  size?: number;
  /** Subtitle line under the wordmark (full variant only). Pass false to hide it. */
  tagline?: string | false;
  className?: string;
}

/**
 * PBMS brand mark: a bold parking "P" paired with a segmented digital lane.
 * The shared component keeps the same identity across public and portal views.
 */
export function Logo({ variant = 'full', size = 36, tagline = 'Parking Space', className = '' }: LogoProps) {
  const mark = (
    <img
      src={pbmsMark}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className="shrink-0 rounded-[28%] shadow-[0_0_18px_rgba(6,182,212,0.32)] transition-transform duration-300 group-hover:scale-105"
    />
  );

  if (variant === 'mark') {
    return <span className={className}>{mark}</span>;
  }

  return (
    <span className={`flex items-center gap-2.5 group ${className}`}>
      {mark}
      <span className="hidden sm:block leading-tight">
        <strong className="block text-sm font-black tracking-[0.02em] bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
          PBMS
        </strong>
        {tagline && (
          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-extrabold block">
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}
