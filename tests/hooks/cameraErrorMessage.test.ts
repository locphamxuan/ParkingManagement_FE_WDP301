import { describe, expect, it } from 'vitest';
import { cameraErrorMessage } from '@/hooks/useCameraStream';

// jsdom exposes no navigator.mediaDevices by default, which is exactly the
// insecure-origin case staff hit on a LAN dev URL — assert it first, then
// install a stub so the per-error-name branches can be checked.
describe('cameraErrorMessage', () => {
  it('flags an origin where the browser exposes no camera API at all', () => {
    expect(cameraErrorMessage(new Error('boom'), 'plate')).toContain('insecure origin');
  });

  it('maps getUserMedia failures to the action that fixes them', () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve({} as MediaStream) },
    });

    const named = (name: string) => cameraErrorMessage(Object.assign(new Error(name), { name }), 'QR');

    expect(named('NotAllowedError')).toContain('permission denied');
    expect(named('NotFoundError')).toContain('No camera detected');
    expect(named('NotReadableError')).toContain('in use by another app');
    expect(named('OverconstrainedError')).toContain('Camera settings');
    expect(named('WeirdVendorError')).toContain('QR camera');
  });
});
