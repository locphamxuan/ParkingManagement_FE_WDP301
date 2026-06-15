import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 text-sm text-white placeholder-slate-400 outline-none transition focus:border-orange-500 focus:ring-1 focus:ring-orange-500',
        className
      )}
      {...props}
    />
  );
}
