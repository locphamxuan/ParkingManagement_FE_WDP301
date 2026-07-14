import type { ReactNode } from 'react';
import { Menu, X } from 'lucide-react';

/**
 * Drawer điều hướng cho viewport < lg — cả 3 sidebar đều `hidden lg:*` nên
 * mobile trước đây mất hẳn nav. Dùng kèm MobileNavButton (FAB mở drawer).
 */
export function MobileNavDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="absolute left-0 top-0 h-full w-[280px] max-w-[85vw] overflow-y-auto bg-card shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

/** Nút FAB mở drawer — chỉ hiện < lg. */
export function MobileNavButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open navigation"
      className="fixed bottom-5 left-5 z-30 rounded-full bg-primary p-3 text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95 lg:hidden"
    >
      <Menu size={20} />
    </button>
  );
}
