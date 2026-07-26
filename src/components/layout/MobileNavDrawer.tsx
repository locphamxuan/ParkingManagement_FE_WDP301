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
      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="absolute left-0 top-0 h-full w-[292px] max-w-[88vw] overflow-y-auto bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
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
      className="fixed bottom-5 left-5 z-30 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/70 bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_14px_32px_rgba(37,99,235,0.25)] transition-transform hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:hidden"
    >
      <Menu size={20} />
    </button>
  );
}
