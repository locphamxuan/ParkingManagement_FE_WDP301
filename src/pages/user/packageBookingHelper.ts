import type { LongTermPackage, VehicleType } from '@/services/user/userApi';

// Chỉ còn MỘT chế độ mua: gói dài hạn (đặt chỗ theo giờ đã bị gỡ khỏi sản phẩm).
export type VehicleKind = 'car' | 'motorcycle';

const MOTORCYCLE_LICENSE_PLATE_TYPES = new Set(['motorcycle', 'ebike', 'emotorbike']);

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function fmtMoney(v: number | undefined | null) {
  return money.format(v || 0);
}

export function fmtTime(iso: string | undefined | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function fmtShort(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${String(
    d.getDate()
  ).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function normalizeVehicleTypeCode(raw?: string | null): VehicleKind | 'all' {
  if (!raw) return 'all';
  const code = String(raw).toLowerCase();
  if (
    code.includes('motor') ||
    code.includes('moto') ||
    code.includes('xe') ||
    code.includes('motorcycle') ||
    code.includes('bike')
  )
    return 'motorcycle';
  return 'car';
}

export function vehicleKindFromLicensePlate(raw?: string | null): VehicleKind {
  return MOTORCYCLE_LICENSE_PLATE_TYPES.has(String(raw || '').toLowerCase()) ? 'motorcycle' : 'car';
}

export function vehicleKindFromVehicleType(
  vehicleType?: LongTermPackage['vehicleType'],
): VehicleKind {
  const label = typeof vehicleType === 'string'
    ? vehicleType
    : `${vehicleType?.code || ''} ${vehicleType?.name || ''}`;
  return /motor|xe m|máy|bike|moto/i.test(label) ? 'motorcycle' : 'car';
}

export function isCarPackage(pkg: LongTermPackage): boolean {
  return vehicleKindFromVehicleType(pkg.vehicleType) === 'car';
}

/**
 * A fixed slot must use the exact VehicleType configured on the selected package.
 * Package APIs normally return a populated VehicleType; the string fallback keeps
 * older responses working when they contain an id, code, or name instead.
 */
export function packageVehicleTypeId(
  packageVehicleType: LongTermPackage['vehicleType'],
  buildingVehicleTypes: VehicleType[],
): string | undefined {
  if (!packageVehicleType) return undefined;
  if (typeof packageVehicleType === 'object') return packageVehicleType._id;

  const normalized = packageVehicleType.trim().toLowerCase();
  return buildingVehicleTypes.find((vehicleType) => (
    vehicleType._id === packageVehicleType
    || vehicleType.code.toLowerCase() === normalized
    || vehicleType.name.toLowerCase() === normalized
  ))?._id;
}

export function getMaxCalendarDate(pkg?: LongTermPackage | null): Date {
  const now = new Date();
  if (!pkg) return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const days = pkg.durationDays ?? 30;
  if (days <= 7) {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  if (days <= 30) {
    return new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
  }
  return new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59);
}

export function packageCategory(pkg: LongTermPackage): 'weekly' | 'monthly' | 'yearly' {
  if (pkg.durationDays <= 7) return 'weekly';
  if (pkg.durationDays <= 30) return 'monthly';
  return 'yearly';
}

export const categoryLabels = { weekly: 'Weekly Package', monthly: 'Monthly Package', yearly: 'Yearly Package' };

export type CategoryColorSet = {
  borderSelected: string;
  bgSelected: string;
  shadowSelected: string;
  borderNormal: string;
  bgNormal: string;
  borderHover: string;
  bgHover: string;
  shadowHover: string;
  text: string;
  accent: string;
  glitterColors: string[];
};

export const categoryColors: Record<'weekly' | 'monthly' | 'yearly', CategoryColorSet> = {
  weekly: {
    borderSelected: 'border-cyan-500 ring-2 ring-cyan-500/25',
    bgSelected: 'bg-gradient-to-br from-cyan-50 via-white to-blue-50',
    shadowSelected: 'shadow-[0_12px_26px_rgba(6,182,212,0.14)]',
    borderNormal: 'border-slate-200',
    bgNormal: 'bg-white',
    borderHover: 'hover:border-cyan-500/40',
    bgHover: 'hover:bg-cyan-50',
    shadowHover: 'hover:shadow-[0_0_12px_rgba(6,182,212,0.06)]',
    text: 'text-cyan-600',
    accent: 'from-cyan-400 to-blue-500',
    glitterColors: ['bg-cyan-400', 'bg-sky-300', 'bg-blue-400'],
  },
  monthly: {
    borderSelected: 'border-orange-500 ring-2 ring-orange-500/25',
    bgSelected: 'bg-gradient-to-br from-orange-50 via-white to-amber-50',
    shadowSelected: 'shadow-[0_12px_26px_rgba(249,115,22,0.14)]',
    borderNormal: 'border-slate-200',
    bgNormal: 'bg-white',
    borderHover: 'hover:border-orange-500/40',
    bgHover: 'hover:bg-orange-50',
    shadowHover: 'hover:shadow-[0_0_12px_rgba(249,115,22,0.06)]',
    text: 'text-orange-600',
    accent: 'from-orange-400 to-amber-500',
    glitterColors: ['bg-amber-400', 'bg-orange-400', 'bg-yellow-400'],
  },
  yearly: {
    borderSelected: 'border-purple-500 ring-2 ring-purple-500/25',
    bgSelected: 'bg-gradient-to-br from-purple-50 via-white to-fuchsia-50',
    shadowSelected: 'shadow-[0_12px_26px_rgba(168,85,247,0.14)]',
    borderNormal: 'border-slate-200',
    bgNormal: 'bg-white',
    borderHover: 'hover:border-purple-500/40',
    bgHover: 'hover:bg-purple-50',
    shadowHover: 'hover:shadow-[0_0_12px_rgba(168,85,247,0.06)]',
    text: 'text-purple-600',
    accent: 'from-yellow-400 via-pink-500 to-purple-500',
    glitterColors: ['bg-purple-400', 'bg-pink-400', 'bg-yellow-400'],
  },
};
