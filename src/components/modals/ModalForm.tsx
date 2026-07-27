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
      <div className="flex flex-col gap-4 max-h-[75vh]">
        <div className="flex-1 overflow-y-auto text-foreground text-sm leading-relaxed pr-1.5 pb-2 custom-scrollbar">
          {children}
        </div>
        <div className="flex justify-end gap-2.5 border-t border-border pt-4 mt-1 shrink-0">
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-5 py-2 font-bold text-xs transition-all duration-200"
          >Cancel</Button>
          <Button 
            onClick={onSubmit}
            className="rounded-xl px-5 py-2 font-bold text-xs bg-primary text-primary-foreground hover:brightness-110 shadow-md shadow-primary/10 transition-all duration-200 hover:scale-[1.01]"
          >Save</Button>
        </div>
      </div>
    </Modal>
  );
}
