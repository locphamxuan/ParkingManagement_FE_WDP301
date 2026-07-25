// Nguồn dùng chung cho nhãn/màu badge TRẠNG THÁI VẬN HÀNH của tòa nhà.
// Tách bạch hai khái niệm:
// - `building.status` (active | inactive | maintenance): trạng thái HÀNH CHÍNH, do admin/manager đặt.
// - open/closed: trạng thái VẬN HÀNH tại thời điểm hiện tại, suy ra từ operatingHours.
// Tòa nhà `active` nhưng đang ngoài giờ mở cửa KHÔNG được hiển thị như đang mở.

import { BUSINESS_TIMEZONE, isWithinOperatingWindow } from '@/utils/businessHours';

export type BuildingOperationalState = 'open' | 'closed' | 'maintenance' | 'inactive';

type OperatingHoursInput = { open?: string | null; close?: string | null } | null | undefined;

/**
 * Trạng thái hiển thị của badge tại thời điểm `now` (giờ nghiệp vụ).
 * - maintenance / inactive: trạng thái hành chính thắng, không xét giờ mở cửa.
 * - active + không cấu hình giờ: giữ fallback "24/7" của UI → open.
 * - active + có giờ: theo cửa sổ [open, close) của `isWithinOperatingWindow`;
 *   dữ liệu sai định dạng (open === close, "6:0", "25:00"…) → closed, không bao giờ open.
 */
export function resolveBuildingOperationalState(
  status: string | null | undefined,
  operatingHours: OperatingHoursInput,
  now: Date = new Date(),
  timeZone: string = BUSINESS_TIMEZONE,
): BuildingOperationalState {
  if (status === 'maintenance') return 'maintenance';
  if (status !== 'active') return 'inactive';

  const open = operatingHours?.open;
  const close = operatingHours?.close;
  if (!open && !close) return 'open';

  return isWithinOperatingWindow(open, close, now, timeZone) ? 'open' : 'closed';
}

export const BUILDING_STATE_LABELS: Record<BuildingOperationalState, string> = {
  open: 'Open',
  closed: 'Closed',
  maintenance: 'Maintenance',
  inactive: 'Paused',
};

/** Class gồm border + bg + text — dùng trực tiếp làm className của badge trên nền sáng. */
export const BUILDING_STATE_BADGE: Record<BuildingOperationalState, string> = {
  open: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  closed: 'border-rose-200 bg-rose-50 text-rose-700',
  maintenance: 'border-amber-200 bg-amber-50 text-amber-700',
  inactive: 'border-slate-200 bg-slate-50 text-slate-600',
};

/** Màu chấm trạng thái; chỉ `open` mới được nhấp nháy (xem `isOperationalNow`). */
export const BUILDING_STATE_DOT: Record<BuildingOperationalState, string> = {
  open: 'bg-emerald-500',
  closed: 'bg-rose-500',
  maintenance: 'bg-amber-500',
  inactive: 'bg-slate-400',
};

export const isOperationalNow = (state: BuildingOperationalState): boolean => state === 'open';

/** Nhãn phụ giải thích vì sao tòa nhà `active` lại đang đóng. */
export const BUILDING_STATE_HINTS: Record<BuildingOperationalState, string> = {
  open: 'Open — within operating hours',
  closed: 'Closed — outside operating hours',
  maintenance: 'Under maintenance',
  inactive: 'Paused by administrator',
};
