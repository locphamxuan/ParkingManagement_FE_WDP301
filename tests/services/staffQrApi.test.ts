import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { staffApi } from '@/services/staff/staffApi';

/**
 * Mọi endpoint tra cứu QR của staff phải kèm ?building=<id> — BE từ chối với
 * 400 BUILDING_REQUIRED nếu thiếu, và nếu FE "quên" gửi thì staff sẽ thấy dữ
 * liệu ngoài tòa đang trực.
 */
const fetchMock = vi.fn();

const lastUrl = () => String(fetchMock.mock.calls.at(-1)?.[0]);

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: {} }),
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('staff QR lookups are building-scoped', () => {
  it('resolveQr sends the selected building', async () => {
    await staffApi.resolveQr('PLT-abc123', 'bld-1');

    expect(lastUrl()).toContain('/staff/users/resolve-qr/PLT-abc123');
    expect(lastUrl()).toContain('building=bld-1');
  });

  it('resolveQr url-encodes the scanned token', async () => {
    await staffApi.resolveQr('PLT-a b/c', 'bld-1');

    expect(lastUrl()).toContain('/staff/users/resolve-qr/PLT-a%20b%2Fc');
    expect(lastUrl()).toContain('building=bld-1');
  });

  it('lookupPlateQr sends the selected building', async () => {
    await staffApi.lookupPlateQr('PLT-abc123', 'bld-2');

    expect(lastUrl()).toContain('/staff/users/lookup-plate-qr/PLT-abc123');
    expect(lastUrl()).toContain('building=bld-2');
  });

  it('lookupUserQr sends the selected building', async () => {
    await staffApi.lookupUserQr('64b000000000000000000001', 'bld-3');

    expect(lastUrl()).toContain('/staff/users/lookup-qr/64b000000000000000000001');
    expect(lastUrl()).toContain('building=bld-3');
  });
});
