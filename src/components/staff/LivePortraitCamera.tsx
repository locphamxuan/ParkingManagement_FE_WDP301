import { forwardRef, useImperativeHandle, useRef } from 'react';
import { UserSquare, Loader2 } from 'lucide-react';
import type { LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { useCameraStream, captureVideoFrame } from '@/hooks/useCameraStream';
import { CameraErrorOverlay } from '@/components/staff/CameraErrorOverlay';

interface LivePortraitCameraProps {
  /** Pause stream rendering (kept for API parity; portrait cam always on). */
  paused?: boolean;
  /** Physical camera device assigned to the portrait role. */
  deviceId?: string;
}

/**
 * PORTRAIT camera (separate) — always-on front camera that only shows the live
 * feed. No scanning. The parent grabs a frame via capture() at check-in to store
 * the driver portrait (so staff can compare the person at check-out).
 */
export const LivePortraitCamera = forwardRef<LiveCameraHandle, LivePortraitCameraProps>(
  function LivePortraitCamera({ deviceId }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { videoRef, active, error, retry } = useCameraStream({ deviceId, facing: 'user', role: 'portrait' });

    // Downscale to max 1280px wide (same as the plate camera) to keep the
    // portrait snapshot a light payload when stored at check-in/check-out.
    useImperativeHandle(ref, () => ({
      capture: () => captureVideoFrame(videoRef.current, canvasRef.current),
    }), [videoRef]);

    return (
      <div className="rounded-xl border border-border bg-card/40 p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <UserSquare size={15} className="text-violet-400" />
          <p className="text-sm font-semibold text-foreground">Camera 1 · Driver portrait</p>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-black/60">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover ${active ? 'block' : 'hidden'}`}
          />
          {active && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-36 w-28 rounded-[40%] border-2 border-dashed border-violet-400/50" />
            </div>
          )}
          {!active && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-violet-400" />
            </div>
          )}
          {error && <CameraErrorOverlay message={error} onRetry={retry} />}
        </div>

        <p className="text-center text-[11px] text-muted-foreground">The portrait photo is taken at check-in to verify when picking up the vehicle.</p>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  },
);
