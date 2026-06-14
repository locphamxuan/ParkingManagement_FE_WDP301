import { api } from '@/services/apiClient';

export interface ManagerBuilding {
  _id: string;
  name: string;
  code: string;
  totalFloors: number;
  status: 'active' | 'inactive' | 'maintenance';
  operatingHours: { open: string; close: string };
  pricing: { hourlyRate: number; dailyCap?: number | null; motorcycleMultiplier?: number };
  address?: { fullAddress?: string; street?: string; district?: string; city?: string };
  contactPhone?: string;
}

export interface VehicleType {
  _id: string;
  building: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Floor {
  _id: string;
  building: string;
  code: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  allowedVehicleTypes: VehicleType[];
}

export interface Gate {
  _id: string;
  building: string;
  code: string;
  name: string;
  direction: 'in' | 'out' | 'both';
  status: 'active' | 'inactive' | 'maintenance';
  allowedVehicleTypes: VehicleType[];
  floors: { _id: string; code: string; name: string; levelNumber: number }[] | string[];
}

export interface ParkingSlot {
  _id: string;
  building: string;
  floor: { _id: string; code: string; name: string; levelNumber: number } | string;
  code: string;
  vehicleType?: VehicleType | string | null;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  reservable: boolean;
  note?: string;
}

export interface PricePolicy {
  _id: string;
  building: string;
  vehicleType: VehicleType | string | null;
  name: string;
  type: 'regular' | 'peak' | 'holiday';
  hourlyRate: number;
  dailyCap?: number | null;
  minRate?: number;
  maxRate?: number | null;
  timeWindow?: { from: string; to: string };
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface LongTermPackage {
  _id: string;
  building: string;
  vehicleType: VehicleType | string;
  name: string;
  code: string;
  durationDays: number;
  price: number;
  reservedSlots: number;
  description?: string;
  allowDedicatedSlot: boolean;
  benefits: string[];
  isActive: boolean;
}

export interface AdminSubscriptionPackage {
  _id: string;
  name: string;
  price: number;
  durationDays: number;
  description?: string;
  features: string[];
  isActive: boolean;
}

export interface Subscription {
  _id: string;
  user: { _id: string; fullName: string; email: string; phone?: string };
  package: { _id: string; name: string; code: string; durationDays: number; price: number };
  plateNumber: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
}

export interface ReservationPolicy {
  _id?: string;
  maxHoldMinutes: number;
  bookingFee: number;
  refundPercent: number;
  isActive: boolean;
}

export interface Shift {
  _id: string;
  building: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface StaffShift {
  _id: string;
  building: string;
  shift: { _id: string; code: string; name: string; startTime: string; endTime: string };
  staff: { _id: string; fullName: string; email: string; phone?: string };
  workDate: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  note?: string;
}

export interface ShiftRevenue {
  _id: string;
  shift: { _id: string; code: string; name: string };
  staff: { _id: string; fullName: string; email: string };
  workDate: string;
  sessionCount: number;
  totalRevenue: number;
  cashAmount: number;
  walletAmount: number;
  qrAmount: number;
  reconciled: boolean;
}

export interface Feedback {
  _id: string;
  user: { _id: string; fullName: string; email: string; phone?: string };
  building?: { _id?: string; name?: string; code?: string; address?: unknown } | null;
  parkingSession?: {
    _id?: string;
    plateNumber?: string;
    entryTime?: string;
    exitTime?: string;
    fee?: number;
    status?: string;
  } | null;
  reservation?: {
    _id?: string;
    code?: string;
    plateNumber?: string;
    startTime?: string;
    endTime?: string;
    fee?: number;
    estimatedFee?: number;
    status?: string;
  } | null;
  rating?: number | null;
  comment?: string;
  portraitImageUrl?: string | null;
  plateImageUrl?: string | null;
  staffReply?: string | null;
  repliedAt?: string | null;
  repliedBy?: { _id?: string; fullName?: string; email?: string; role?: string } | null;
  status: 'pending' | 'resolved';
  createdAt: string;
  updatedAt?: string;
}
export interface BuildingWallet {
  _id: string;
  building: string;
  balance: number;
  totalReceived: number;
  totalTransferred: number;
  updatedAt: string;
}

export interface BuildingWalletTransaction {
  _id: string;
  building: string;
  type: 'credit' | 'debit';
  amount: number;
  balanceAfter: number;
  reason: 'parking_fee' | 'reservation_fee' | 'transfer_to_system' | 'refund' | 'topup' | 'admin_subscription';
  note?: string | null;
  createdAt: string;
}

export interface DailyRevenueResult {
  totalRevenue: number;
  date: string;
}

export interface SubscriptionStatus {
  active: boolean;
  endDate: string | null;
  startDate: string | null;
  daysRemaining: number;
  package: { _id: string; name: string; price: number; durationDays: number } | null;
  packageName: string | null;
}

export interface DashboardOverview {
  slots: {
    total: number;
    available?: number;
    occupied?: number;
    reserved?: number;
    maintenance?: number;
    occupancyRate: number;
  };
  floors: number;
  gates: number;
  sessions: { active: number; today: number };
  subscriptions: { active: number };
  feedbacks: { pending: number };
  revenue: {
    today: number;
    byMethod: Record<string, { amount: number; count: number }>;
    weekly: { date: string; revenue: number; sessions: number }[];
  };
}

interface Wrap<T> {
  data: T;
}

const path = (buildingId: string, suffix: string) =>
  `/manager/buildings/${buildingId}${suffix}`;

export const managerApi = {
  listAssignedBuildings: () =>
    api.get<Wrap<ManagerBuilding[] | { items: ManagerBuilding[] }>>('/manager/buildings'),
  updateBuilding: (id: string, body: Partial<ManagerBuilding>) =>
    api.put<Wrap<{ building: ManagerBuilding }>>(`/manager/buildings/${id}`, body),

  getDashboard: (buildingId: string) =>
    api.get<Wrap<DashboardOverview>>(path(buildingId, '/dashboard')),

  vehicleTypes: {
    list: (b: string) => api.get<Wrap<{ items: VehicleType[] }>>(path(b, '/vehicle-types')),
    create: (b: string, body: Partial<VehicleType>) =>
      api.post<Wrap<{ item: VehicleType }>>(path(b, '/vehicle-types'), body),
    update: (b: string, id: string, body: Partial<VehicleType>) =>
      api.put<Wrap<{ item: VehicleType }>>(path(b, `/vehicle-types/${id}`), body),
    remove: (b: string, id: string) => api.delete(path(b, `/vehicle-types/${id}`)),
  },

  floors: {
    list: (b: string) => api.get<Wrap<{ items: Floor[] }>>(path(b, '/floors')),
    create: (b: string, body: Partial<Floor> & { allowedVehicleTypes?: string[] }) =>
      api.post<Wrap<{ item: Floor }>>(path(b, '/floors'), body),
    update: (b: string, id: string, body: Partial<Floor> & { allowedVehicleTypes?: string[] }) =>
      api.put<Wrap<{ item: Floor }>>(path(b, `/floors/${id}`), body),
    remove: (b: string, id: string) => api.delete(path(b, `/floors/${id}`)),
  },

  gates: {
    list: (b: string) => api.get<Wrap<{ items: Gate[] }>>(path(b, '/gates')),
    create: (b: string, body: Partial<Gate> & { allowedVehicleTypes?: string[] }) =>
      api.post<Wrap<{ item: Gate }>>(path(b, '/gates'), body),
    update: (b: string, id: string, body: Partial<Gate> & { allowedVehicleTypes?: string[] }) =>
      api.put<Wrap<{ item: Gate }>>(path(b, `/gates/${id}`), body),
    remove: (b: string, id: string) => api.delete(path(b, `/gates/${id}`)),
  },

  slots: {
    list: (b: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: ParkingSlot[] }>>(path(b, '/slots'), { query: q }),
    create: (b: string, body: Partial<ParkingSlot> & { floor: string }) =>
      api.post<Wrap<{ item: ParkingSlot }>>(path(b, '/slots'), body),
    update: (b: string, id: string, body: Partial<ParkingSlot>) =>
      api.put<Wrap<{ item: ParkingSlot }>>(path(b, `/slots/${id}`), body),
    updateStatus: (b: string, id: string, status: ParkingSlot['status']) =>
      api.patch<Wrap<{ item: ParkingSlot }>>(path(b, `/slots/${id}/status`), { status }),
    remove: (b: string, id: string) => api.delete(path(b, `/slots/${id}`)),
  },

  pricePolicies: {
    list: (b: string) => api.get<Wrap<{ items: PricePolicy[] }>>(path(b, '/price-policies')),
    create: (b: string, body: Partial<PricePolicy>) =>
      api.post<Wrap<{ item: PricePolicy }>>(path(b, '/price-policies'), body),
    update: (b: string, id: string, body: Partial<PricePolicy>) =>
      api.put<Wrap<{ item: PricePolicy }>>(path(b, `/price-policies/${id}`), body),
    deactivate: (b: string, id: string) => api.delete(path(b, `/price-policies/${id}`)),
  },

  packages: {
    list: (b: string) =>
      api.get<Wrap<{ items: LongTermPackage[] }>>(path(b, '/packages')),
    create: (b: string, body: Partial<LongTermPackage>) =>
      api.post<Wrap<{ item: LongTermPackage }>>(path(b, '/packages'), body),
    update: (b: string, id: string, body: Partial<LongTermPackage>) =>
      api.put<Wrap<{ item: LongTermPackage }>>(path(b, `/packages/${id}`), body),
    remove: (b: string, id: string) => api.delete(path(b, `/packages/${id}`)),
    subscriptions: (b: string) =>
      api.get<Wrap<{ items: Subscription[]; pagination: unknown }>>(path(b, '/subscriptions')),
  },

  reservationPolicy: {
    get: (b: string) =>
      api.get<Wrap<{ item: ReservationPolicy }>>(path(b, '/reservation-policy')),
    update: (b: string, body: Partial<ReservationPolicy>) =>
      api.put<Wrap<{ item: ReservationPolicy }>>(path(b, '/reservation-policy'), body),
  },

  shifts: {
    list: (b: string) => api.get<Wrap<{ items: Shift[] }>>(path(b, '/shifts')),
    create: (b: string, body: Partial<Shift>) =>
      api.post<Wrap<{ item: Shift }>>(path(b, '/shifts'), body),
    update: (b: string, id: string, body: Partial<Shift>) =>
      api.put<Wrap<{ item: Shift }>>(path(b, `/shifts/${id}`), body),
    remove: (b: string, id: string) => api.delete(path(b, `/shifts/${id}`)),
    listStaff: (b: string) =>
      api.get<Wrap<{ items: { _id: string; fullName: string; email: string; role: string }[] }>>(
        path(b, '/staff')
      ),
    listStaffShifts: (b: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: StaffShift[] }>>(path(b, '/staff-shifts'), { query: q }),
    assignStaffShift: (
      b: string,
      body: { staff: string; shift: string; workDate: string; note?: string }
    ) => api.post<Wrap<{ item: StaffShift }>>(path(b, '/staff-shifts'), body),
    updateStaffShift: (b: string, id: string, body: Partial<StaffShift>) =>
      api.put<Wrap<{ item: StaffShift }>>(path(b, `/staff-shifts/${id}`), body),
    removeStaffShift: (b: string, id: string) =>
      api.delete(path(b, `/staff-shifts/${id}`)),
    revenues: (b: string, q?: Record<string, string | undefined>) =>
      api.get<
        Wrap<{ items: ShiftRevenue[]; totals: { sessionCount: number; totalRevenue: number; cashAmount: number; walletAmount: number; qrAmount: number } }>
      >(path(b, '/shift-revenues'), { query: q }),
  },

  feedbacks: {
    list: (b: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: Feedback[]; pagination: unknown }>>(path(b, '/feedbacks'), {
        query: q,
      }),
    respond: (b: string, id: string, body: { response?: string; status?: Feedback['status'] }) =>
      api.patch<Wrap<{ item: Feedback }>>(path(b, `/feedbacks/${id}`), body),
  },

  wallet: {
    get: (b: string) =>
      api.get<Wrap<{ wallet: BuildingWallet }>>(path(b, '/wallet')),
    getDailyRevenue: (b: string) =>
      api.get<Wrap<DailyRevenueResult>>(path(b, '/wallet/daily-revenue')),
    listTransactions: (b: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: BuildingWalletTransaction[] }>>(path(b, '/wallet/transactions'), { query: q }),
    listSubscriptionPackages: (b: string) =>
      api.get<Wrap<{ items: AdminSubscriptionPackage[] }>>(path(b, '/wallet/subscription-packages')),
    getSubscriptionStatus: (b: string) =>
      api.get<Wrap<SubscriptionStatus>>(path(b, '/subscription')),
    subscribe: (b: string, packageId: string) =>
      api.post<Wrap<{ wallet: BuildingWallet; package: AdminSubscriptionPackage }>>(
        path(b, '/wallet/subscribe'),
        { packageId },
      ),
    initiateTopup: (b: string, amount: number) =>
      api.post<Wrap<{ checkoutUrl: string; qrCode: string; orderCode: number }>>(
        path(b, '/wallet/topup'),
        { amount },
      ),
    verifyTopup: (b: string, orderCode: number) =>
      api.get<Wrap<{ status: string; credited: boolean }>>(
        path(b, `/wallet/topup/${orderCode}/verify`),
      ),
  },

};

export const unwrapItems = <T,>(payload: Wrap<{ items: T[] }> | Wrap<T[]> | undefined): T[] => {
  if (!payload?.data) return [];
  const d = payload.data as unknown as { items?: T[] };
  if (Array.isArray(d)) return d as unknown as T[];
  return d.items ?? [];
};
