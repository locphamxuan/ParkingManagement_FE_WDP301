import { describe, it, expect } from 'vitest';
import {
  normalizePlate,
  isValidVietnamPlate,
  brandsForVehicleType,
  CAR_BRANDS,
  MOTORCYCLE_BRANDS,
} from '@/utils/plate';

describe('normalizePlate', () => {
  it('chuẩn hóa biển 5 số về dạng NNN.NN', () => {
    expect(normalizePlate('51F97022')).toBe('51F-970.22');
    expect(normalizePlate('59g2 03880')).toBe('59G2-038.80');
  });

  it('idempotent trên input đã chuẩn', () => {
    expect(normalizePlate('51F-970.22')).toBe('51F-970.22');
    expect(normalizePlate('59G2-038.80')).toBe('59G2-038.80');
  });

  it('viết hoa và bỏ ký tự phân tách linh hoạt', () => {
    expect(normalizePlate('30a.12345')).toBe('30A-123.45');
  });

  it('trả về chuỗi rỗng khi không parse được', () => {
    expect(normalizePlate('')).toBe('');
    expect(normalizePlate(null)).toBe('');
    expect(normalizePlate(undefined)).toBe('');
    expect(normalizePlate('xe của tôi')).toBe('');
  });

  it('từ chối nhóm số quá ngắn/quá dài', () => {
    expect(normalizePlate('51F123')).toBe('');       // 3 số
    expect(normalizePlate('51F1234567')).toBe('');    // >5 số phần number
  });
});

describe('isValidVietnamPlate', () => {
  it('nhận biển canonical hợp lệ', () => {
    expect(isValidVietnamPlate('51F-970.22')).toBe(true);
    expect(isValidVietnamPlate('59G2-038.80')).toBe(true);
    expect(isValidVietnamPlate('30LD-1234')).toBe(true);
  });

  it('từ chối biển sai định dạng', () => {
    expect(isValidVietnamPlate('51F97022')).toBe(false); // chưa có dấu -
    expect(isValidVietnamPlate('')).toBe(false);
    expect(isValidVietnamPlate(null)).toBe(false);
  });
});

describe('brandsForVehicleType', () => {
  it('trả danh sách hãng xe máy khi motorcycle', () => {
    expect(brandsForVehicleType('motorcycle')).toBe(MOTORCYCLE_BRANDS);
  });

  it('mặc định trả danh sách hãng ô tô', () => {
    expect(brandsForVehicleType('car')).toBe(CAR_BRANDS);
  });
});
