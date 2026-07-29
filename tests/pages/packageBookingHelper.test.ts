import { describe, expect, it } from 'vitest';
import {
  isCarPackage,
  normalizeVehicleTypeCode,
  packageVehicleTypeId,
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
    expect(normalizeVehicleTypeCode('SUV')).toBe('car');
    expect(normalizeVehicleTypeCode('TRUCK')).toBe('car');
  });

  it('uses the selected package VehicleType id instead of the first matching category', () => {
    const vehicleTypes = [
      { _id: 'car-id', code: 'CAR', name: 'Car' },
      { _id: 'suv-id', code: 'SUV', name: 'SUV' },
    ];

    expect(packageVehicleTypeId({ _id: 'suv-id', code: 'SUV', name: 'SUV' }, vehicleTypes)).toBe('suv-id');
    expect(packageVehicleTypeId('SUV', vehicleTypes)).toBe('suv-id');
  });
});
