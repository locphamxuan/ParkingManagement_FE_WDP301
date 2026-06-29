import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { normalizePlate } from '@/utils/plate';
import type { CameraRole } from '@/hooks/useCameraDevices';

interface CameraSettingsModalProps {
  open: boolean;
  onClose: () => void;
  assignment: Record<string, string | null | undefined>;
  assign: (role: CameraRole, deviceId: string) => void;
  devices: Array<{ deviceId: string; label?: string }>;
  onRefresh: () => void;
}

export function CameraSettingsModal({ open, onClose, assignment, assign, devices, onRefresh }: CameraSettingsModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Devices</p>
            <h3 className="text-xl font-semibold text-foreground">Camera settings</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">✕</button>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          When multiple cameras are available (plate / portrait / QR), assign each role to a separate device
          so they can all open simultaneously and capture the correct image. On a single-webcam machine all roles share the same device.
        </p>

        <div className="space-y-3">
          {([
            { role: 'plate' as CameraRole, label: 'Camera 1 · Plate' },
            { role: 'qr' as CameraRole, label: 'Camera 2 · QR' },
            { role: 'portrait' as CameraRole, label: 'Camera 3 · Portrait' },
          ]).map(({ role, label }) => (
            <div key={role} className="grid gap-1.5">
              <label className="text-xs font-semibold text-foreground">{label}</label>
              <select
                value={assignment[role] ?? ''}
                onChange={(e) => assign(role, e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
              >
                <option value="">— Auto (default) —</option>
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {devices.length === 0 && (
          <p className="mt-3 text-[11px] text-amber-600">
            No devices found — press "Refresh" and grant camera permission in the browser.
          </p>
        )}

        <div className="mt-5 flex justify-between gap-2">
          <Button type="button" variant="secondary" onClick={() => void onRefresh()} className="gap-1.5 text-xs">
            <Settings size={13} /> Refresh list
          </Button>
          <Button onClick={onClose} className="bg-gradient-to-r from-sky-500 to-amber-400 text-slate-950 hover:brightness-110 text-xs">
            Done
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

interface RejectCheckInModalProps {
  open: boolean;
  onClose: () => void;
  reason: string;
  setReason: (v: string) => void;
  plateNumber: string;
  onConfirm: () => void;
}

export function RejectCheckInModal({ open, onClose, reason, setReason, plateNumber, onConfirm }: RejectCheckInModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-600">Reject entry</p>
            <h3 className="text-xl font-semibold text-foreground">Rejection reason</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">✕</button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Plate <strong className="text-foreground font-mono">{normalizePlate(plateNumber) || plateNumber || '—'}</strong>. The system will send a notification with the reason to the customer's account (if the plate is registered).</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Registered a motorcycle but it is actually a car; vehicle info does not match..."
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-rose-500/50"
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose} className="text-xs">Cancel</Button>
          <Button onClick={onConfirm} disabled={!reason.trim()} className="bg-rose-500 text-slate-800 hover:bg-rose-400 text-xs disabled:opacity-60">Confirm rejection</Button>
        </div>
      </motion.div>
    </div>
  );
}
