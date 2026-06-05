import { api } from '@/services/apiClient';

export interface StaffBuilding {
  _id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive' | 'maintenance';
  operatingHours: { open: string; close: string };
  address?: { fullAddress?: string };
  contactPhone?: string;
}

export interface MyShift {
  _id: string;
  shift: { _id: string; code: string; name: string; startTime: string; endTime: string };
  building: { _id: string; name: string; code: string };
  workDate: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  note?: string;
}

export interface ParkingSession {
  _id: string;
  plateNumber: string;
  vehicleType?: { _id: string; name: string; code: string } | null;
  slot?: { _id: string; code: string; floor?: { _id: string; name?: string; code?: string } | null } | null;
  entryGate?: { _id: string; code: string; name: string } | null;
  reservation?: string | null;
  checkIn: string;
  checkOut?: string | null;
  duration?: number | null;
  fee?: number | null;
  paymentMethod?: 'cash' | 'wallet' | 'qr' | null;
  paymentStatus: 'pending' | 'paid' | 'waived';
  status: 'active' | 'completed' | 'cancelled';
}

export interface StaffIncident {
  _id: string;
  code?: string;
  type?: string;
  building?: { _id?: string; code?: string; name?: string } | null;
  severity?: 'medium' | 'high' | 'critical';
  status?: 'open' | 'investigating' | 'escalated' | 'resolved' | 'closed';
  createdAt?: string;
  note?: string;
}

export interface StaffReservation {
  _id: string;
  code?: string;
  user?: { _id: string; fullName?: string; email?: string } | null;
  building?: { _id: string; name?: string; code?: string } | null;
  vehicleType?: { _id: string; name?: string; code?: string } | null;
  slot?: { _id: string; code?: string } | null;
  plateNumber?: string;
  startTime?: string;
  endTime?: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'expired';
  fee?: number | null;
  createdAt?: string;
}

interface Wrap<T> {
  data: T;
}

type ApiList<T> = T[] | { items: T[] };

function unwrapList<T>(payload: ApiList<T> | Wrap<ApiList<T>> | null | undefined): T[] {
  if (!payload) return [];
  const raw = typeof payload === 'object' && 'data' in payload ? payload.data : payload;
  if (Array.isArray(raw)) return raw;
  return (raw as { items?: T[] }).items ?? [];
}

export const staffApi = {
  getDashboard: () => api.get('/staff/dashboard'),

  listBuildings: () => api.get<Wrap<ApiList<StaffBuilding>>>('/staff/buildings'),

  getBuilding: (id: string) => api.get<Wrap<StaffBuilding>>(`/staff/buildings/${id}`),

  getActiveSessions: () =>
    api.get<Wrap<ApiList<ParkingSession>>>('/staff/parking-sessions/active'),

  searchSessions: (q: string) =>
    api.get<Wrap<ApiList<ParkingSession>>>('/staff/parking-sessions/search', { query: { q } }),

  checkIn: (payload: { plateNumber: string; vehicleType?: string; gate?: string; buildingId?: string; building?: string }) =>
    api.post<Wrap<{ item: ParkingSession }>>('/staff/parking-sessions/check-in', {
      plateNumber: payload.plateNumber,
      vehicleType: payload.vehicleType,
      gate: payload.gate,
      building: payload.building || payload.buildingId,
    }),

  checkOut: (id: string, body?: { paymentMethod?: string }) =>
    api.patch<Wrap<{ item: ParkingSession }>>(`/staff/parking-sessions/${id}/check-out`, body ?? {}),

  // Bank transfer (VietQR via PayOS): create a payment link for the parking fee.
  initiateSessionPayment: (id: string) =>
    api.post<Wrap<{ checkoutUrl: string; qrCode: string; orderCode: number; amount: number; plateNumber: string }>>(
      `/staff/parking-sessions/${id}/initiate-payment`,
    ),

  // Reconcile a bank-transfer payment if the PayOS webhook didn't arrive.
  verifySessionPayment: (orderCode: number) =>
    api.get<Wrap<{ status: string; settled: boolean }>>(`/staff/parking-sessions/payment/${orderCode}/status`),

  getSessionById: (id: string) => api.get<Wrap<ParkingSession>>(`/staff/parking-sessions/${id}`),

  lookupPlate: (plate: string) =>
    api.get<Wrap<{ plateNumber: string; hasAccount: boolean; user: { id: string; fullName: string; email: string; phone?: string; walletBalance: number } | null }>>(`/staff/parking-sessions/lookup-plate/${plate}`),

  lookupUserQr: (qrCode: string) =>
    api.get<Wrap<{ userId: string; hasAccount: boolean; user: { id: string; fullName: string; email: string; phone?: string } | null }>>(`/staff/users/lookup-qr/${qrCode}`),

  // Lookup a license plate by its unique QR token (PLT-...).
  lookupPlateQr: (qrCode: string) =>
    api.get<Wrap<{
      qrCode: string;
      found: boolean;
      plate: { plateNumber: string; vehicleType: string } | null;
      user: { id: string; fullName: string; email: string; phone?: string | null; walletBalance: number; isActive: boolean } | null;
      activeSessions: { id: string; building: string; plateNumber: string; entryTime: string; fee: number }[];
    }>>(`/staff/users/lookup-plate-qr/${qrCode}`),

  addCustomerPlate: (customerId: string, payload: { plateNumber: string; vehicleType?: string }) =>
    api.post<Wrap<{ success: boolean }>>(`/staff/users/${customerId}/license-plates`, payload),

  getMyShifts: (query?: Record<string, string | undefined>) =>
    api.get<Wrap<ApiList<MyShift>>>('/staff/my-shifts', { query }),

  createIncident: (payload: unknown) => api.post('/staff/incidents', payload),

  processWallet: (payload: unknown) => api.post('/staff/wallet-transactions', payload),

  checkInReservation: (code: string) => api.post(`/staff/reservations/${code}/check-in`),

  listReservations: (query?: Record<string, string | undefined>) =>
    api.get<Wrap<{ items: StaffReservation[]; total: number }>>('/staff/reservations', { query }),

  incidents: {
    list: (buildingId?: string) =>
      api.get<Wrap<ApiList<StaffIncident>>>('/staff/incidents', { query: buildingId ? { buildingId } : undefined }),
  },

  // Backward-compatible aliases used by the current UI code
  buildings: () => api.get<Wrap<ApiList<StaffBuilding>>>('/staff/buildings'),

  myShifts: (q?: Record<string, string | undefined>) => api.get<Wrap<ApiList<MyShift>>>('/staff/my-shifts', { query: q }),

  sessions: {
    list: (buildingId: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: ParkingSession[] }>>(`/staff/buildings/${buildingId}/sessions`, { query: q }),
    checkIn: (buildingId: string, body: { plateNumber: string; vehicleType?: string; gate?: string }) =>
      api.post<Wrap<{ item: ParkingSession }>>(`/staff/buildings/${buildingId}/sessions/check-in`, body),
    checkOut: (buildingId: string, sessionId: string, body: { paymentMethod: string }) =>
      api.patch<Wrap<{ item: ParkingSession }>>(`/staff/buildings/${buildingId}/sessions/${sessionId}/check-out`, body),
  },
};

export const extractShifts = (payload: Wrap<{ items: MyShift[] } | MyShift[]>): MyShift[] => {
  return unwrapList(payload);
};

export const extractBuildings = (
  payload: StaffBuilding[] | { items: StaffBuilding[] }
): StaffBuilding[] => {
  return unwrapList(payload);
};

export const extractIncidents = (
  payload: StaffIncident[] | { items: StaffIncident[] }
): StaffIncident[] => {
  return unwrapList(payload);
};
