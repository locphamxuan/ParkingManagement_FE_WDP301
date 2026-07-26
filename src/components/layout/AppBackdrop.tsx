import { cn } from '@/utils/cn';

interface AppBackdropProps {
  variant?: 'workspace' | 'midnight';
  className?: string;
}

/**
 * Shared decorative depth layer. It stays isolated from page content so portal
 * pages can keep their existing layout and interaction behavior.
 */
export function AppBackdrop({ variant = 'workspace', className }: AppBackdropProps) {
  return (
    <div
      className={cn('app-backdrop', `app-backdrop--${variant}`, className)}
      aria-hidden="true"
    >
      <span className="app-backdrop__grid" />
      <span className="app-backdrop__orb app-backdrop__orb--one" />
      <span className="app-backdrop__orb app-backdrop__orb--two" />
      <span className="app-backdrop__beam" />
    </div>
  );
}
