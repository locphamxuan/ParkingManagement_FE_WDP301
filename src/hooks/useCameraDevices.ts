import { useCallback, useEffect, useState } from 'react';

/**
 * Manages physical camera device assignment for each role on the staff screen:
 *  - 'plate'    → license-plate scanner camera
 *  - 'portrait' → driver portrait camera
 *  - 'qr'       → QR code scanner camera
 *
 * In production with 2–3 USB cameras, each role gets a unique deviceId so all
 * cameras can stream simultaneously. On a laptop with one webcam all roles share
 * the same device. The assignment is persisted in localStorage across sessions.
 */
export type CameraRole = 'plate' | 'portrait' | 'qr';

export type CameraAssignment = Partial<Record<CameraRole, string>>;

const STORAGE_KEY = 'pbms.staffCameraDevices';

const readAssignment = (): CameraAssignment => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as CameraAssignment;
  } catch (_err) {
    return {};
  }
};

/**
 * Builds a `video` constraint for getUserMedia: prefers the assigned deviceId;
 * falls back to facingMode (rear camera for plate/QR, front camera for portrait).
 */
export const videoConstraintFor = (
  deviceId: string | undefined,
  fallbackFacing: 'user' | 'environment' = 'environment',
): MediaTrackConstraints =>
  deviceId ? { deviceId: { ideal: deviceId } } : { facingMode: fallbackFacing };

export function useCameraDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [assignment, setAssignment] = useState<CameraAssignment>(readAssignment);

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === 'videoinput'));
    } catch (_err) {
      /* ignore */
    }
  }, []);

  // Device labels are only available after camera permission is granted — request once then enumerate.
  const requestAndRefresh = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      s.getTracks().forEach((t) => t.stop());
    } catch (_err) {
      /* permission denied — still try to enumerate (labels may be empty) */
    }
    await refresh();
  }, [refresh]);

  const assign = useCallback((role: CameraRole, deviceId: string) => {
    setAssignment((prev) => {
      const next = { ...prev, [role]: deviceId || undefined };
      if (!deviceId) delete next[role];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (_err) {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    void refresh();
    const handler = () => void refresh();
    navigator.mediaDevices?.addEventListener?.('devicechange', handler);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', handler);
  }, [refresh]);

  return { devices, assignment, assign, refresh, requestAndRefresh };
}
