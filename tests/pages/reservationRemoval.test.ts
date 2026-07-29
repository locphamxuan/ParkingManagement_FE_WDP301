import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { mainFlowModules } from '@/data/mainFlow';

/**
 * Đặt chỗ / đặt trước theo giờ KHÔNG còn là sản phẩm. Test này chặn việc "mọc lại"
 * điều hướng, CTA hay copy marketing giới thiệu tính năng đó cho khách hàng.
 *
 * Các nhãn LỊCH SỬ (giải mã bản ghi tài chính/audit cũ) được cố ý giữ lại và nằm
 * ngoài phạm vi test này — chúng không phải điều hướng hay CTA.
 */
const readSrc = (relative: string) =>
  readFileSync(path.resolve(__dirname, '../../src', relative), 'utf8');

const CUSTOMER_FACING_FILES = [
  'pages/HomePage.tsx',
  'pages/public/HomeRoute.tsx',
  'components/home/HomeFooterSections.tsx',
  'components/home/ModuleCard.tsx',
  'components/layout/Footer.tsx',
  'components/user/packages/BookingFooter.tsx',
  'pages/staff/StaffOperationsPage.tsx',
  'pages/staff/StaffParkedPage.tsx',
];

describe('reservation product removal', () => {
  it('exposes no reservation module in the home navigation', () => {
    const serialized = JSON.stringify(mainFlowModules).toLowerCase();

    expect(serialized).not.toContain('reservation');
    expect(serialized).not.toContain('pre-book');
    expect(serialized).not.toContain('prebook');
  });

  it.each(CUSTOMER_FACING_FILES)('has no reservation or pre-booking copy in %s', (file) => {
    expect(readSrc(file).toLowerCase()).not.toMatch(/reservation|pre-book|prebook/);
  });

  it('routes no /reservations path', () => {
    expect(readSrc('routes/AppRouter.tsx')).not.toContain('/reservations');
  });

  // Bản ghi tài chính CŨ vẫn phải đọc được (nhãn trong TYPE_LABELS của sổ giao dịch),
  // nhưng reservation KHÔNG được là một nguồn doanh thu của sản phẩm hiện hành.
  it('lists no reservation revenue source in the admin report', () => {
    const revenuePage = readSrc('pages/admin/RevenueAnalyticsPage.tsx');
    const sourceLabels = /const SOURCE_LABELS[^}]+}/.exec(revenuePage)?.[0] ?? '';
    const sourceTotals = /const totals = \{[^}]+}/.exec(revenuePage)?.[0] ?? '';

    expect(sourceLabels).toBeTruthy();
    expect(sourceLabels).not.toContain('reservation');
    expect(sourceTotals).not.toContain('reservation');
    expect(readSrc('services/admin/adminApi.ts')).toMatch(/bySource: \{[^}]*other: number;[^}]*}/);
  });

  it('drops the stale reservation fields from the staff API contract', () => {
    const staffApi = readSrc('services/staff/staffApi.ts');

    expect(staffApi).not.toContain('activeReservation');
    expect(staffApi).not.toContain('isReservation');
    expect(staffApi).not.toContain('reservationRemainingFee');
  });
});
