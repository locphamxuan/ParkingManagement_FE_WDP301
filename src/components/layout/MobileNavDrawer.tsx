import type { ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

const MOBILE_NAV_TRIGGER_ID = 'portal-mobile-navigation-trigger';

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
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 lg:hidden" />
        <Dialog.Content
          className="fixed left-0 top-0 z-50 h-dvh w-[292px] max-w-[88vw] overflow-y-auto bg-white shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-left data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left lg:hidden"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById(MOBILE_NAV_TRIGGER_ID)?.focus();
          }}
        >
          <Dialog.Title className="sr-only">Portal navigation</Dialog.Title>
          <Dialog.Description className="sr-only">
            Navigate between the available workspace sections.
          </Dialog.Description>
          <Dialog.Close
            aria-label="Close navigation"
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <X size={18} />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Nút FAB mở drawer — chỉ hiện < lg. */
export function MobileNavButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      id={MOBILE_NAV_TRIGGER_ID}
      type="button"
      onClick={onOpen}
      aria-label="Open navigation"
      className="fixed bottom-5 left-5 z-30 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/70 bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_14px_32px_rgba(37,99,235,0.25)] transition-transform hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 lg:hidden"
    >
      <Menu size={20} />
    </button>
  );
}
