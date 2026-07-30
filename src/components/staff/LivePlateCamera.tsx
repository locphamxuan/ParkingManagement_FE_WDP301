import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ScanLine, Loader2, AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { staffApi } from '@/services/staff/staffApi';
import { videoConstraintFor } from '@/hooks/useCameraDevices';
import { normalizePlate, isValidVietnamPlate } from '@/utils/plate';

export interface PlateScanResult {
  plateNumber: string;
  brand: string | null;
  /** Vehicle kind auto-detected by the AI camera (car | motorcycle | null). */
  vehicleType: 'car' | 'motorcycle' | null;
  /** The captured frame (base64 data-URL) — stored to DB as the plate image. */
  plateImage: string;
}

/** Imperative handle: grab the current camera frame as a base64 data-URL. */
export interface LiveCameraHandle {
  capture: () => string | null;
}

interface LivePlateCameraProps {
  onDetected: (result: PlateScanResult) => void;
  /** Called right before each scan attempt starts — parent can use this to clear stale plate state. */
  onScanStart?: () => void;
  /** Disable the capture button while the parent is busy. */
  busy?: boolean;
  /** Physical camera device assigned to this role (when multiple cameras are available). */
  deviceId?: string;
  /** Selected building — required by the backend scope check on /scan. */
  buildingId?: string;
}

/**
 * Camera 2 — always-on license-plate camera. The live feed is shown immediately.
 * "Capture & recognize" sends the current frame to the AI scan and returns the
 * recognized plate + captured image. Also supports uploading a file image.
 */
export const LivePlateCamera = forwardRef<LiveCameraHandle, LivePlateCameraProps>(function LivePlateCamera(
  { onDetected, onScanStart, busy = false, deviceId, buildingId },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraintFor(deviceId, 'environment') });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => undefined);
            setActive(true);
          };
          videoRef.current.play().catch(() => undefined);
        }
        setError(null);
      } catch (err) {
        if (!cancelled) setError('Cannot access the plate camera. Please grant permission.');
      }
    })();

    return () => {
      cancelled = true;
      const s = (videoRef.current?.srcObject as MediaStream | null) ?? stream;
      s?.getTracks().forEach((t) => t.stop());
    };
  }, [deviceId]);

  const captureFrame = (): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const MAX_W = 1280;
    const scale = Math.min(1, MAX_W / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  useImperativeHandle(ref, () => ({ capture: () => captureFrame() }), []);

  const runScan = async (dataUrl: string, isRetry = false) => {
    if (!buildingId) {
      setError('Select a building before scanning a vehicle.');
      return;
    }
    // The API validates an image data URL (`data:image/jpeg;base64,...`), not a
    // bare base64 payload.  Keep the prefix produced by canvas/FileReader so
    // camera capture and uploaded images follow the exact same contract.
    const res = await staffApi.scanVehicle(dataUrl, buildingId);
    const data = (res as { data?: { plateNumber?: string; brand?: string | null; vehicleType?: 'car' | 'motorcycle' | null } })?.data;
    // Normalize and validate the AI result — reject garbage / non-VN-format strings
    const raw = data?.plateNumber ?? '';
    const normalized = normalizePlate(raw);
    const plateNumber = isValidVietnamPlate(normalized) ? normalized : '';
    const brand = data?.brand ?? null;
    // Vehicle kind detected by the AI camera (authoritative over the plate-format heuristic).
    const vehicleType = data?.vehicleType === 'motorcycle' ? 'motorcycle' : data?.vehicleType === 'car' ? 'car' : null;

    if (!plateNumber && !isRetry) {
      // Auto-retry once after 500ms
      await new Promise((r) => setTimeout(r, 500));
      const retryUrl = captureFrame();
      if (retryUrl) {
        return runScan(retryUrl, true);
      }
    }

    onDetected({ plateNumber, brand, vehicleType, plateImage: dataUrl });
    if (plateNumber) {
      setSuccess(`Plate: ${plateNumber}${brand ? ` · ${brand}` : ''}`);
      setTimeout(() => setSuccess(null), 2500);
    } else {
      setError('Could not read the plate — please enter it manually or upload an image.');
    }
  };

  const handleCapture = async () => {
    setError(null);
    setSuccess(null);
    onScanStart?.();
    const dataUrl = captureFrame();
    if (!dataUrl) {
      setError('Camera is not ready. Please try again.');
      return;
    }
    setProcessing(true);
    try {
      await runScan(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plate recognition error');
    } finally {
      setProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    onScanStart?.();
    setProcessing(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await runScan(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image processing error');
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/40 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <ScanLine size={15} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">Camera 2 · Plate scan</p>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-white/10 bg-black/60">
        <style>{`
          @keyframes laserScan {
            0% { top: 0%; }
            50% { top: 100%; }
            100% { top: 0%; }
          }
          .laser-scanner-line {
            position: absolute;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.85) 50%, transparent);
            box-shadow: 0 0 8px rgba(16, 185, 129, 0.8), 0 0 15px rgba(16, 185, 129, 0.4);
            animation: laserScan 2.8s ease-in-out infinite;
            pointer-events: none;
            z-index: 10;
          }
          .laser-scanner-line-active {
            background: linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.95) 50%, transparent);
            box-shadow: 0 0 12px rgba(249, 115, 22, 0.9), 0 0 22px rgba(249, 115, 22, 0.6);
            animation: laserScan 1.2s ease-in-out infinite;
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
          <>
            {/* Corner brackets */}
            <div className="pointer-events-none absolute inset-0 border-2 border-emerald-400/30 rounded-lg">
              <div className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-emerald-400" />
              <div className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-emerald-400" />
              <div className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-emerald-400" />
            </div>
            {/* Yellow plate guide box */}
            <div
              className="pointer-events-none absolute border-2 border-yellow-400/80 rounded"
              style={{ left: '15%', right: '15%', top: '35%', bottom: '35%' }}
            >
              <span className="absolute -top-5 left-0 right-0 text-center text-[10px] text-yellow-400 font-medium">
                Align the plate here
              </span>
            </div>
            <div className={processing ? 'laser-scanner-line laser-scanner-line-active' : 'laser-scanner-line'} />
          </>
        )}
        {!active && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-emerald-400" />
          </div>
        )}
        {error && !active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-3 text-center">
            <p className="text-xs text-rose-300">{error}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCapture}
          disabled={!active || processing || busy}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
        >
          {processing ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
          Capture &amp; recognize
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={processing || busy}
          title="Upload a plate image from your device"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-card hover:text-foreground disabled:opacity-60"
        >
          <Upload size={15} />
          Upload
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-400">
          <CheckCircle2 size={14} className="shrink-0" /> <span>{success}</span>
        </div>
      )}
      {error && active && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-400">
          <AlertCircle size={14} className="mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
});
