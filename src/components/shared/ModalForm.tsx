import type { ReactNode } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ModalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
}

export function ModalForm({ open, onOpenChange, title, children, onSubmit }: ModalFormProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title}>
      <div className="grid gap-5">
        <div className="text-white text-sm leading-relaxed [&_input]:bg-slate-800 [&_input]:text-white [&_input]:border-slate-700 [&_select]:bg-slate-800 [&_select]:text-white [&_select]:border-slate-700 [&_textarea]:bg-slate-800 [&_textarea]:text-white">{children}</div>
        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-5 py-2 text-xs text-gray-400 hover:text-white transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            className="rounded-xl px-5 py-2 font-bold text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/10 transition-all duration-200 hover:scale-[1.01]"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
