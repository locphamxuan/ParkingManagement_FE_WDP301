import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ParkedRejectModalProps {
  open: boolean;
  reason: string;
  setReason: (v: string) => void;
  onClose: () => void;
  onReject: () => void;
}

export function ParkedRejectModal({ open, reason, setReason, onClose, onReject }: ParkedRejectModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-400">Reject exit</p>
            <h3 className="text-xl font-semibold text-foreground">Rejection reason</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rejection dialog"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Reason for rejecting exit..."
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-rose-500/50"
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose} className="text-xs">Cancel</Button>
          <Button onClick={onReject} disabled={!reason.trim()} className="bg-rose-500 text-white hover:bg-rose-400 text-xs disabled:opacity-60">
            Confirm rejection
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
