import { useCallback, useEffect, useRef, useState } from 'react';
import { videoConstraintFor } from '@/hooks/useCameraDevices';

/**
 * Turns a getUserMedia failure into a message that tells staff what to actually
 * do. Without this every failure looked like "grant permission", which is wrong
 * for the common cases (camera busy, unplugged, or an insecure origin).
 */
export const cameraErrorMessage = (err: unknown, role: string): string => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return 'The browser blocks cameras on an insecure origin. Open the app over HTTPS or on localhost.';
  }
  switch ((err as { name?: string })?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'Camera permission denied. Allow camera access for this site, then retry.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera detected. Plug one in, then retry.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'The camera is in use by another app or tab. Close it, then retry.';
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'The assigned camera is unavailable. Pick another device in “Camera settings”.';
    case 'AbortError':
      return 'The camera stopped unexpectedly. Retry to reopen it.';
    default:
      return `Cannot open the ${role} camera. Check the connection, then retry.`;
  }
};

// A busy / missing / over-constrained device still works with the browser default,
// so retry once with a plain video request before showing staff an error.
const RECOVERABLE = new Set([
  'OverconstrainedError',
  'ConstraintNotSatisfiedError',
  'NotFoundError',
  'DevicesNotFoundError',
  'NotReadableError',
  'TrackStartError',
]);

interface UseCameraStreamOptions {
  /** Physical device assigned to this role, if any. */
  deviceId?: string;
  /** Fallback lens when no device is assigned. */
  facing?: 'user' | 'environment';
  /** Role name used in the fallback error message. */
  role: string;
}

/**
 * Opens (and reliably tears down) the live camera feed for one role. Shared by
 * the plate / QR / portrait cameras so all three recover the same way.
 */
export function useCameraStream({ deviceId, facing = 'environment', role }: UseCameraStreamOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  const retry = useCallback(() => setRetryTick((n) => n + 1), []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    setActive(false);
    setError(null);

    const openStream = async () => {
      const media = navigator.mediaDevices;
      if (!media?.getUserMedia) throw new Error('CAMERA_UNSUPPORTED');
      try {
        return await media.getUserMedia({ video: videoConstraintFor(deviceId, facing) });
      } catch (err) {
        if (!RECOVERABLE.has((err as { name?: string })?.name ?? '')) throw err;
        return media.getUserMedia({ video: true });
      }
    };

    (async () => {
      try {
        stream = await openStream();
        const video = videoRef.current;
        if (cancelled || !video) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        const markActive = () => {
          if (!cancelled) setActive(true);
        };
        video.onloadedmetadata = () => {
          video.play().catch(() => undefined);
          markActive();
        };
        video.play().catch(() => undefined);
        // Metadata can already be there when the element is reused across renders,
        // in which case `onloadedmetadata` never fires again.
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) markActive();
      } catch (err) {
        if (cancelled) return;
        setActive(false);
        setError(cameraErrorMessage(err, role));
      }
    })();

    return () => {
      cancelled = true;
      const video = videoRef.current;
      const opened = (video?.srcObject as MediaStream | null) ?? stream;
      opened?.getTracks().forEach((t) => t.stop());
      if (video) {
        video.onloadedmetadata = null;
        video.srcObject = null;
      }
    };
  }, [deviceId, facing, role, retryTick]);

  return { videoRef, active, error, retry };
}

/** Draws the current frame to `canvas`, downscaled, and returns a JPEG data URL. */
export function captureVideoFrame(
  video: HTMLVideoElement | null,
  canvas: HTMLCanvasElement | null,
  maxWidth = 1280,
): string | null {
  if (!video || !canvas || video.videoWidth === 0) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const scale = Math.min(1, maxWidth / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}
