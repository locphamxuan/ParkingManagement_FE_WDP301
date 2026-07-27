/**
 * Giờ hoạt động tòa nhà theo TIMEZONE NGHIỆP VỤ, không theo timezone thiết bị.
 * Mirror `BE/src/utils/businessTime.js` — cùng semantics để badge trên FE không
 * mâu thuẫn với quyết định chặn/cho vào của BE.
 */
export const BUSINESS_TIMEZONE = 'Asia/Ho_Chi_Minh';

const HH_MM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "HH:mm" → số phút từ 00:00; null nếu sai định dạng. */
export function parseTime(value: string | null | undefined): number | null {
  const match = HH_MM_RE.exec(`${value ?? ''}`);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Số phút từ 00:00 của `date` khi quy về `timeZone`. */
function minutesInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

/**
 * `now` có nằm trong cửa sổ [open, close) tính theo giờ nghiệp vụ không?
 * - open < close: cửa sổ trong ngày (mốc mở tính là mở, mốc đóng là đóng).
 * - open > close: cửa sổ qua đêm.
 * - open === close hoặc sai định dạng: dữ liệu không hợp lệ → coi như đóng.
 */
export function isWithinOperatingWindow(
  open: string | null | undefined,
  close: string | null | undefined,
  now: Date = new Date(),
  timeZone: string = BUSINESS_TIMEZONE,
): boolean {
  const openMinutes = parseTime(open);
  const closeMinutes = parseTime(close);
  if (openMinutes === null || closeMinutes === null || openMinutes === closeMinutes) {
    return false;
  }

  const current = minutesInTimeZone(now, timeZone);
  return openMinutes < closeMinutes
    ? current >= openMinutes && current < closeMinutes
    : current >= openMinutes || current < closeMinutes;
}
