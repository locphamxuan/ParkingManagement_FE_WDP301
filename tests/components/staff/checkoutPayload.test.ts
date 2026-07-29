import { describe, expect, it } from 'vitest';
import { buildCheckoutPayload } from '@/components/staff/parked/staffParkedFormat';

/**
 * Sau khi gỡ nhánh "đặt chỗ" (trước đây `target.isReservation` làm payload KHÔNG có
 * `paymentMethod`), mọi lượt check-out còn được hỗ trợ đều phải gửi phương thức
 * thanh toán hợp lệ.
 */
describe('buildCheckoutPayload', () => {
  const evidence = { exitPlateImage: 'plate.png', exitPortraitImage: 'portrait.png' };

  it.each(['cash', 'wallet'] as const)('always sends %s as the payment method', (paymentMethod) => {
    expect(buildCheckoutPayload({ ...evidence, paymentMethod, grandTotal: 45000 })).toEqual({
      paymentMethod,
      ...evidence,
    });
  });

  // 'bank_transfer' được xử lý ở nhánh tạo QR PayOS TRƯỚC khi tới payload này, nên
  // payload không bao giờ gửi 'bank_transfer' cho BE (BE không có method đó).
  it.each([0, 30000])('never forwards bank_transfer to the API (grandTotal %i)', (grandTotal) => {
    expect(buildCheckoutPayload({ ...evidence, paymentMethod: 'bank_transfer', grandTotal }))
      .toMatchObject({ paymentMethod: 'cash' });
  });

  it('never emits an empty payment method, even for a free release', () => {
    const payload = buildCheckoutPayload({ ...evidence, paymentMethod: 'wallet', grandTotal: 0 });

    expect(payload.paymentMethod).toBeTruthy();
    expect(payload).not.toHaveProperty('isReservation');
  });
});
