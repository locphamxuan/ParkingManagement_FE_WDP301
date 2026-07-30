import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { QrCode, Loader2, CheckCircle2 } from 'lucide-react';
import jsQR from 'jsqr';
import type { LiveCameraHandle } from '@/components/staff/LivePlateCamera';
import { useCameraStream, captureVideoFrame } from '@/hooks/useCameraStream';
import { CameraErrorOverlay } from '@/components/staff/CameraErrorOverlay';

interface LiveQRCameraProps {
  /** Fired when a QR is decoded (account ID or vehicle PLT- token). */
  onResult: (code: string) => void;
  /** Pause detection (e.g. while a result modal is open). */
  paused?: boolean;
  /** Physical camera device assigned to the QR role. */
  deviceId?: string;
}

// Detection budget: decoding every frame at full sensor resolution starves the
// other two live feeds on the same machine, which is what made cameras stall.
const DETECT_INTERVAL_MS = 120;
const DETECT_MAX_WIDTH = 800;

/**
 * Camera 2 — always-on QR camera (account / vehicle). The live feed is shown
 * immediately and scans continuously. When a QR is found it also captures the
 * current frame as the driver portrait (saved to DB at check-in). Also exposes
 * an imperative capture() so the parent can grab the portrait at check-in even
 * without a QR scan.
 */
export const LiveQRCamera = forwardRef<LiveCameraHandle, LiveQRCameraProps>(function LiveQRCamera(
  { onResult, paused = false, deviceId },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [flash, setFlash] = useState(false);
  const { videoRef, active, error, retry } = useCameraStream({ deviceId, facing: 'environment', role: 'QR' });

  // Held in refs so the detection loop never restarts (and never fires a stale
  // handler that captured an empty building id from the first render).
  const onResultRef = useRef(onResult);
  const pausedRef = useRef(paused);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useImperativeHandle(ref, () => ({
    capture: () => captureVideoFrame(videoRef.current, canvasRef.current),
  }), [videoRef]);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let lastDetect = 0;
    let lastHit = 0;
    const work = document.createElement('canvas');
    const ctx = work.getContext('2d', { willReadFrequently: true });

    const scan = (now: number) => {
      raf = requestAnimationFrame(scan);
      const video = videoRef.current;
      if (!ctx || !video || video.videoWidth === 0) return;
      if (pausedRef.current || now - lastDetect < DETECT_INTERVAL_MS) return;
      lastDetect = now;

      const scale = Math.min(1, DETECT_MAX_WIDTH / video.videoWidth);
      work.width = Math.round(video.videoWidth * scale);
      work.height = Math.round(video.videoHeight * scale);
      ctx.drawImage(video, 0, 0, work.width, work.height);
      const frame = ctx.getImageData(0, 0, work.width, work.height);
      const code = jsQR(frame.data, frame.width, frame.height);

      // Debounce so the same QR doesn't fire repeatedly.
      if (code?.data && now - lastHit > 2500) {
        lastHit = now;
        setFlash(true);
        setTimeout(() => setFlash(false), 600);
        onResultRef.current(code.data);
      }
    };

    raf = requestAnimationFrame(scan);
    return () => cancelAnimationFrame(raf);
  }, [active, videoRef]);

  return (
    <div className="rounded-xl border border-border bg-card/40 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <QrCode size={15} className="text-sky-400" />
        <p className="text-sm font-semibold text-foreground">Camera 2 · QR scan (account / vehicle)</p>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-black/60">
        <style>{`
          @keyframes qrScan {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          .qr-scanner-line {
            position: absolute;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.8) 50%, transparent);
            box-shadow: 0 0 6px rgba(56, 189, 248, 0.8), 0 0 10px rgba(56, 189, 248, 0.4);
            animation: qrScan 2.2s ease-in-out infinite;
            pointer-events: none;
          }
        `}</style>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${active ? 'block' : 'hidden'}`}
        />
        {active && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-32 w-32">
              <div className="absolute inset-0 overflow-hidden rounded-lg">
                {!paused && <div className="qr-scanner-line" />}
              </div>
              <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-sky-400 rounded-tl-lg" />
              <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-sky-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-sky-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-sky-400 rounded-br-lg" />
            </div>
          </div>
        )}
        {flash && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/25 backdrop-blur-sm">
            <CheckCircle2 size={56} className="text-emerald-400" />
          </div>
        )}
        {!active && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-sky-400" />
          </div>
        )}
        {error && <CameraErrorOverlay message={error} onRetry={retry} />}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        {paused ? 'Scanning paused…' : 'Point the QR into the frame — the system recognizes it automatically'}
      </p>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
});
