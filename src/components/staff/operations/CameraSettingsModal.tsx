import { motion } from 'framer-motion';
import { Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type CameraRole } from '@/hooks/useCameraDevices';
import type { StaffOperations } from '@/hooks/staff/useStaffOperations';

export function CameraSettingsModal({ ops }: { ops: StaffOperations }) {
  const { cameraSettingsOpen, setCameraSettingsOpen, assignment, assign, devices, requestAndRefresh } = ops;
  if (!cameraSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Device</p>
            <h3 className="text-xl font-semibold text-foreground">Camera settings</h3>
          </div>
          <button
            type="button"
            onClick={() => setCameraSettingsOpen(false)}
            aria-label="Close camera settings"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          When you have multiple cameras (plate / portrait / QR), assign each role to its own device so
          they open together and capture the right image. On a single-webcam machine, all roles share one device.
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
          <p className="mt-3 text-[11px] text-amber-400">
            {typeof navigator !== 'undefined' && !navigator.mediaDevices
              ? 'The browser only exposes cameras on a secure origin — open this app over HTTPS or on localhost.'
              : 'No devices found — tap “Refresh” and grant the browser camera permission.'}
          </p>
        )}

        <div className="mt-5 flex justify-between gap-2">
          <Button type="button" variant="secondary" onClick={() => void requestAndRefresh()} className="gap-1.5 text-xs">
            <Settings size={13} /> Refresh list
          </Button>
          <Button onClick={() => setCameraSettingsOpen(false)} className="bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 text-xs">
            Done
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
