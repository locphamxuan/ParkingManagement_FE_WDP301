import { Bell } from 'lucide-react';
import AdminUserDropdown from './AdminUserDropdown';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  title: string;
  email: string;
  onLogout: () => void;
  fullName?: string;
  role?: string;
  showNotification?: boolean;
  /** Hide search bar (default false) */
  hideSearch?: boolean;
  /** Show compact profile (unused — kept for API compat) */
  compactProfile?: boolean;
}

export function Navbar({ title, email, onLogout, fullName, role, showNotification = true }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-sky-100 bg-white/90 px-6 py-3.5 backdrop-blur-xl shadow-xs transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-sky-600 font-mono">OPERATIONS SYSTEM</p>
          <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 bg-clip-text text-transparent mt-0.5 inline-block w-fit">
            {title}
          </h1>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          {showNotification && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 rounded-full border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground shadow-sm px-4 transition-all"
            >
              <Bell size={14} className="text-muted-foreground" />
              <span className="hidden sm:inline font-medium text-xs">Notifications</span>
            </Button>
          )}

          <AdminUserDropdown
            email={email}
            onLogout={onLogout}
            fullName={fullName}
            role={role}
          />
        </div>
      </div>
    </header>
  );
}
