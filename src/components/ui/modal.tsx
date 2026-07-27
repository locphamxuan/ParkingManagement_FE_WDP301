import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  
  // legacy/alternative props
  isOpen?: boolean;
  onClose?: () => void;
}

export function Modal({ open, onOpenChange, title, children, isOpen, onClose }: ModalProps) {
  const finalOpen = open ?? isOpen ?? false;
  const finalOnOpenChange = onOpenChange ?? ((o) => { if (!o && onClose) onClose(); });

  return (
    <Dialog.Root open={finalOpen} onOpenChange={finalOnOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/68 backdrop-blur-sm transition-opacity duration-200 animate-fadeIn" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 max-h-[88svh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-foreground shadow-[0_28px_80px_rgba(2,6,23,0.32)] animate-modalFadeIn focus:outline-none sm:p-6'
          )}
        >
          {title ? (
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-border/70 pb-4">
              <Dialog.Title className="text-lg font-extrabold tracking-tight text-foreground">{title}</Dialog.Title>
              <Dialog.Close
                aria-label="Close dialog"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <X size={17} />
              </Dialog.Close>
            </div>
          ) : (
            <>
              <Dialog.Title className="sr-only">Modal Dialog</Dialog.Title>
              <Dialog.Close
                aria-label="Close dialog"
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <X size={17} />
              </Dialog.Close>
            </>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
