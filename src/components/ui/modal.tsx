import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onOpenChange, title, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-stone-950/60 backdrop-blur-md transition-all duration-300 animate-fadeIn" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 text-white p-6 shadow-2xl backdrop-blur-xl animate-modalFadeIn focus:outline-none'
          )}
        >
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title className="text-lg font-black tracking-tight text-white font-sans">{title}</Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/20">
              <X size={16} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
