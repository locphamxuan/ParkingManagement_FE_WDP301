import React from 'react';
import { cn } from '@/utils/cn';

interface LicensePlateProps {
  plateNumber: string;
  className?: string;
  style?: React.CSSProperties;
}

export function LicensePlate({ plateNumber, className, style }: LicensePlateProps) {
  const formatted = plateNumber ? plateNumber.toUpperCase().trim() : '';

  return (
    <div
      className={cn(
        "relative flex h-8 items-center justify-center rounded-md font-mono text-[11px] font-black tracking-wider shrink-0 select-none overflow-hidden px-5 border border-slate-700",
        className
      )}
      style={{
        background: 'linear-gradient(to bottom, #ffffff 0%, #f1f5f9 100%)',
        boxShadow: '0 3px 8px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        color: '#0f172a',
        ...style,
      }}
    >
      {/* Realistic embossed inner frame border */}
      <div
        className="absolute inset-[1.5px] rounded-[3px] border pointer-events-none"
        style={{ borderColor: 'rgba(15,23,42,0.15)' }}
      />

      {/* Realistic screw dot left */}
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-2 h-2 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 border border-slate-400 shadow-inner">
        <div className="w-[1px] h-[5px] bg-slate-500 rotate-45" />
      </div>

      {/* Realistic screw dot right */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-2 h-2 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 border border-slate-400 shadow-inner">
        <div className="w-[1px] h-[5px] bg-slate-500 -rotate-45" />
      </div>

      {/* Plate text */}
      <span className="font-extrabold text-slate-800 tracking-wider relative z-10 px-1">
        {formatted}
      </span>
    </div>
  );
}
