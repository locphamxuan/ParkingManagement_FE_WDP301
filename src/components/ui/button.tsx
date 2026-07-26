import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex min-w-0 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-[transform,background-color,border-color,color,box-shadow,filter] duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px',
  {
    variants: {
      variant: {
        default:
          'border border-primary/80 bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-[0_8px_20px_hsl(var(--app-primary)/0.22)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_12px_26px_hsl(var(--app-primary)/0.28)]',
        secondary:
          'border border-border bg-secondary text-secondary-foreground shadow-sm hover:border-primary/20 hover:bg-muted',
        ghost: 'border border-transparent bg-transparent text-foreground hover:bg-muted',
        danger:
          'border border-red-500/80 bg-red-500 text-white shadow-[0_8px_18px_hsl(var(--app-danger)/0.18)] hover:-translate-y-0.5 hover:bg-red-600 hover:brightness-105',
        outline:
          'border border-border bg-card/80 text-foreground shadow-sm hover:border-primary/30 hover:bg-primary/5 hover:text-primary',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-11 px-4',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
