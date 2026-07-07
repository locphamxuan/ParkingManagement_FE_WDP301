import { describe, it, expect } from 'vitest';
import {
  packageStatusLabel,
  packageStatusBadgeClass,
  PACKAGE_STATUS_LABELS,
  PACKAGE_STATUS_BADGE,
} from '@/utils/packageStatus';

describe('packageStatusLabel', () => {
  it('trả nhãn (tiếng Anh) cho status hợp lệ', () => {
    expect(packageStatusLabel('active')).toBe(PACKAGE_STATUS_LABELS.active);
    expect(packageStatusLabel('pending')).toBe('Pending activation');
  });

  it('fallback về chính status khi không xác định', () => {
    expect(packageStatusLabel('weird-status')).toBe('weird-status');
  });
});

describe('packageStatusBadgeClass', () => {
  it('trả class badge tương ứng status', () => {
    expect(packageStatusBadgeClass('cancelled')).toBe(PACKAGE_STATUS_BADGE.cancelled);
  });

  it('fallback về class trung tính khi status lạ', () => {
    expect(packageStatusBadgeClass('unknown')).toContain('slate');
  });
});
