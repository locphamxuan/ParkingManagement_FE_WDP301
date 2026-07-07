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
