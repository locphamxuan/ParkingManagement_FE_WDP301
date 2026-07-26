import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'app-card rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-[0_14px_36px_rgba(15,23,42,0.07)] transition-[border-color,box-shadow,transform] duration-200 hover:border-primary/20 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pb-3 md:p-6 md:pb-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-bold tracking-[-0.025em] text-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0 md:p-6 md:pt-0', className)} {...props} />;
}
