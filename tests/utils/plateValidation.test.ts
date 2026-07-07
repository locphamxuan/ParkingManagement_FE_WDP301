import { describe, it, expect } from 'vitest';
import { validatePlate } from '@/utils/plateValidation';

type Plate = { plateNumber: string; vehicleType: 'car' | 'motorcycle' };

describe('validatePlate', () => {
  const none: Plate[] = [];

  it('báo lỗi khi để trống', () => {
    const r = validatePlate('   ', none);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/enter a plate/i);
  });

  it('báo lỗi khi sai định dạng', () => {
    const r = validatePlate('abc-xyz', none);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/invalid plate format/i);
  });

  it('chấp nhận biển hợp lệ (chuẩn hóa trước khi so)', () => {
    expect(validatePlate('51F97022', none)).toEqual({ ok: true });
  });

  it('phát hiện biển trùng (so ở dạng canonical đã hoa)', () => {
    const existing: Plate[] = [{ plateNumber: '51F-970.22', vehicleType: 'car' }];
    const r = validatePlate('51f 97022', existing);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/has been added/i);
  });
});
