import { AlertCircle, RefreshCcw } from 'lucide-react';

/** Shown over a dead camera feed so staff can read the cause and reopen it. */
export function CameraErrorOverlay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 p-3 text-center">
      <AlertCircle size={20} className="text-rose-300" />
      <p className="text-xs text-rose-200">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/20"
      >
        <RefreshCcw size={12} /> Retry
      </button>
    </div>
  );
}
