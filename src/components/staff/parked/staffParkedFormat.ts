// Format dùng chung cho màn "Xe đang đỗ" / checkout (thời gian, tiền, thời lượng đỗ).
export const fmtTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString('vi-VN') : '—';

export const fmtMoney = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} đ` : '—';

export const fmtDuration = (from: string | null | undefined, to?: string | null) => {
  if (!from) return '—';
  const end = to ? new Date(to).getTime() : Date.now();
  const mins = Math.max(0, Math.floor((end - new Date(from).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/** Current charge returned by the backend from the building's Price Policy. */
export function getCheckoutCharges(
  target: { currentFee?: number | null; fee?: number | null; isLongTerm?: boolean; pricePolicyConfigured?: boolean },
  pendingPenalty: number,
) {
  const parkingFee = target.currentFee ?? target.fee ?? 0;
  const pricePolicyConfigured = target.isLongTerm || target.pricePolicyConfigured !== false;
  return { parkingFee, grandTotal: parkingFee + pendingPenalty, pricePolicyConfigured };
}

export type CheckoutPaymentKind = 'cash' | 'bank_transfer' | 'wallet';

/**
 * Payload check-out gửi lên BE. MỌI luồng còn được hỗ trợ (vãng lai / có tài khoản /
 * gói dài hạn) đều PHẢI kèm `paymentMethod` — không còn nhánh nào bỏ trống phần thanh
 * toán. `bank_transfer` chỉ có QR thật cho phí gửi xe: nếu không còn phí gửi xe
 * (grandTotal = 0, vd chỉ còn phí phạt) thì hạ về `cash` để BE không đánh dấu đã thu
 * điện tử trong khi chưa có giao dịch nào.
 */
export function buildCheckoutPayload(input: {
  paymentMethod: CheckoutPaymentKind;
  grandTotal: number;
  exitPlateImage: string | null;
  exitPortraitImage: string | null;
}) {
  const paymentMethod = input.grandTotal > 0
    ? (input.paymentMethod === 'bank_transfer' ? 'cash' : input.paymentMethod)
    : 'cash';
  return {
    paymentMethod,
    exitPlateImage: input.exitPlateImage,
    exitPortraitImage: input.exitPortraitImage,
  };
}
