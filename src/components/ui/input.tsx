import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-xl border border-border bg-card/90 px-3.5 text-sm font-medium text-foreground shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-muted-foreground/70 hover:border-primary/25 focus:border-primary/45 focus:bg-card focus:ring-4 focus:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
}
