import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { normalizePlate } from '@/utils/plate';
import type { StaffOperations } from '@/hooks/staff/useStaffOperations';

export function RejectCheckInModal({ ops }: { ops: StaffOperations }) {
  const { rejectOpen, setRejectOpen, rejectReason, setRejectReason, plateNumber, onReject } = ops;
  if (!rejectOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-400">Reject entry</p>
            <h3 className="text-xl font-semibold text-foreground">Rejection reason</h3>
          </div>
          <button onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="text-muted-foreground hover:text-foreground transition">✕</button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Plate <strong className="text-foreground font-mono">{normalizePlate(plateNumber) || plateNumber || '—'}</strong>. The system will send a notification with the reason to the guest account (if the plate is registered).
        </p>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          placeholder="E.g. Registered as a motorcycle but actually a car; vehicle details do not match..."
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-rose-500/50"
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => { setRejectOpen(false); setRejectReason(''); }} className="text-xs">Cancel</Button>
          <Button onClick={onReject} disabled={!rejectReason.trim()} className="bg-rose-500 text-white hover:bg-rose-400 text-xs disabled:opacity-60">
            Confirm rejection
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
