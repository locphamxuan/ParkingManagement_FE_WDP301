import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

const badgeVariants = cva('inline-flex min-h-6 items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]', {
  variants: {
    variant: {
      default: 'bg-primary/15 text-primary ring-1 ring-inset ring-primary/20',
      success: 'bg-success/10 text-success ring-1 ring-inset ring-success/20',
      warning: 'bg-warning/12 text-warning ring-1 ring-inset ring-warning/20',
      danger: 'bg-danger/10 text-danger ring-1 ring-inset ring-danger/20',
      muted: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
