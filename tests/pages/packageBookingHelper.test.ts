import { describe, expect, it } from 'vitest';
import {
  isCarPackage,
  vehicleKindFromLicensePlate,
  vehicleKindFromVehicleType,
} from '@/pages/user/packageBookingHelper';

describe('package vehicle categorization', () => {
  it('keeps electric two-wheel plates in the motorcycle category', () => {
    expect(vehicleKindFromLicensePlate('ebike')).toBe('motorcycle');
    expect(vehicleKindFromLicensePlate('emotorbike')).toBe('motorcycle');
    expect(vehicleKindFromLicensePlate('truck')).toBe('car');
  });

  it('treats supported car codes as car packages', () => {
    expect(vehicleKindFromVehicleType({ _id: '1', code: 'AUTO', name: 'Auto' })).toBe('car');
    expect(isCarPackage({ vehicleType: { _id: '1', code: 'OTO', name: 'Ô tô' } } as never)).toBe(true);
  });
});
