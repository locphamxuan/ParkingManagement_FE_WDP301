import { describe, expect, it } from 'vitest';
import { isWithinOperatingWindow, parseTime } from '@/utils/businessHours';

const VN = 'Asia/Ho_Chi_Minh';

describe('isWithinOperatingWindow', () => {
  it('keys off the business timezone, not the device timezone', () => {
    // 2026-07-01T23:30:00Z = 06:30 ngày 02/07 giờ VN.
    const instant = new Date('2026-07-01T23:30:00Z');

    // Cùng một thời điểm, hai timezone cho hai kết quả khác nhau → hàm bám
    // timezone truyền vào chứ không phải giờ máy.
    expect(isWithinOperatingWindow('06:00', '22:00', instant, VN)).toBe(true);
    expect(isWithinOperatingWindow('06:00', '22:00', instant, 'UTC')).toBe(false);
  });

  it('treats the open boundary as open and the close boundary as closed', () => {
    const at = (vnTime: string) => new Date(`2026-07-01T${vnTime}+07:00`);

    expect(isWithinOperatingWindow('06:00', '22:00', at('05:59'), VN)).toBe(false);
    expect(isWithinOperatingWindow('06:00', '22:00', at('06:00'), VN)).toBe(true);
    expect(isWithinOperatingWindow('06:00', '22:00', at('12:00'), VN)).toBe(true);
    expect(isWithinOperatingWindow('06:00', '22:00', at('21:59'), VN)).toBe(true);
    expect(isWithinOperatingWindow('06:00', '22:00', at('22:00'), VN)).toBe(false);
  });

  it('supports an overnight window spanning midnight', () => {
    const at = (day: string, vnTime: string) => new Date(`2026-07-0${day}T${vnTime}+07:00`);

    expect(isWithinOperatingWindow('22:00', '06:00', at('1', '21:59'), VN)).toBe(false);
    expect(isWithinOperatingWindow('22:00', '06:00', at('1', '23:00'), VN)).toBe(true);
    expect(isWithinOperatingWindow('22:00', '06:00', at('2', '02:00'), VN)).toBe(true);
    expect(isWithinOperatingWindow('22:00', '06:00', at('2', '05:59'), VN)).toBe(true);
    expect(isWithinOperatingWindow('22:00', '06:00', at('2', '06:00'), VN)).toBe(false);
    expect(isWithinOperatingWindow('22:00', '06:00', at('2', '12:00'), VN)).toBe(false);
  });

  it('treats open === close and malformed values as closed, never as 24/7', () => {
    const noon = new Date('2026-07-01T05:00:00Z'); // 12:00 VN

    expect(isWithinOperatingWindow('08:00', '08:00', noon, VN)).toBe(false);
    expect(isWithinOperatingWindow('25:00', '22:00', noon, VN)).toBe(false);
    expect(isWithinOperatingWindow('6:0', '22:00', noon, VN)).toBe(false);
    expect(isWithinOperatingWindow('', '', noon, VN)).toBe(false);
  });
});

describe('parseTime', () => {
  it('accepts HH:mm only', () => {
    expect(parseTime('06:00')).toBe(360);
    expect(parseTime('23:59')).toBe(1439);
    expect(parseTime('6:0')).toBeNull();
    expect(parseTime('25:00')).toBeNull();
    expect(parseTime(undefined)).toBeNull();
  });
});
