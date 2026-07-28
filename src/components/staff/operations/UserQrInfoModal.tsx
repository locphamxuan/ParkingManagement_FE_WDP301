import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StaffOperations } from '@/hooks/staff/useStaffOperations';

export function UserQrInfoModal({ ops }: { ops: StaffOperations }) {
  const { userQrInfo, setUserQrInfo } = ops;
  if (!userQrInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Scanned account</p>
            <h3 className="text-lg font-semibold text-foreground">{userQrInfo.fullName}</h3>
          </div>
          <button
            type="button"
            onClick={() => setUserQrInfo(null)}
            aria-label="Close scanned account dialog"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Active long-term packages in this building
        </div>
        {userQrInfo.activePackages.length === 0 ? (
          <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            This guest has no active long-term packages.
          </p>
        ) : (
          <div className="space-y-2">
            {userQrInfo.activePackages.map((pkg) => (
              <div key={pkg.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-400">{pkg.name}</span>
                  {pkg.code && (
                    <span className="rounded-md border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-500">{pkg.code}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Plate: <strong className="text-foreground font-mono">{pkg.plateNumber}</strong>
                  {pkg.endDate && (
                    <span className="ml-2 text-slate-500">
                      · Expires: {new Date(pkg.endDate).toLocaleDateString('en-US')}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        <Button onClick={() => setUserQrInfo(null)} className="mt-5 w-full" variant="secondary">
          Close
        </Button>
      </motion.div>
    </div>
  );
}
