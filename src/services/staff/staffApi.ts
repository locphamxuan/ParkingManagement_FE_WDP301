import { api } from '@/services/apiClient';

const USE_MOCK = (import.meta.env.VITE_USE_MOCK_DATA as string | undefined) !== 'false';

// Simple mock data for offline preview when VITE_USE_MOCK_DATA is not set to 'false'
const mockBuilding: StaffBuilding = {
  _id: 'bldg-demo-1',
  name: 'Tòa nhà Demo',
  code: 'DEMO-1',
  status: 'active',
  operatingHours: { open: '07:00', close: '22:00' },
  address: { fullAddress: '123 Demo Street' },
  contactPhone: '+84901234567',
};

const mockShift = {
  _id: 'shift-demo-1',
  shift: { _id: 's1', code: 'S1', name: 'Ca sáng', startTime: '07:00', endTime: '15:00' },
  building: { _id: mockBuilding._id, name: mockBuilding.name, code: mockBuilding.code },
  workDate: new Date().toISOString().slice(0, 10),
  status: 'active' as const,
};

const mockSession: ParkingSession = {
  _id: 'ps-1',
  plateNumber: '30A-12345',
  vehicleType: null,
  slot: { _id: 'slot-1', code: 'A1' },
  entryGate: { _id: 'gate-1', code: 'G1', name: 'Main Gate' },
  checkIn: new Date().toISOString(),
  paymentStatus: 'pending',
  status: 'active',
};

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
  slot?: { _id: string; code: string } | null;
  entryGate?: { _id: string; code: string; name: string } | null;
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
  getDashboard: () => (USE_MOCK ? Promise.resolve({ data: { totalActive: 1, totalShifts: 1 } }) : api.get('/staff/dashboard')),

  listBuildings: () =>
    USE_MOCK ? Promise.resolve({ data: { items: [mockBuilding] } }) : api.get<Wrap<ApiList<StaffBuilding>>>('/staff/buildings'),

  getBuilding: (id: string) => (USE_MOCK ? Promise.resolve({ data: mockBuilding }) : api.get<Wrap<StaffBuilding>>(`/staff/buildings/${id}`)),

  getActiveSessions: () =>
    USE_MOCK ? Promise.resolve({ data: { items: [mockSession] } }) : api.get<Wrap<ApiList<ParkingSession>>>('/staff/parking-sessions/active'),

  searchSessions: (q: string) =>
    USE_MOCK ? Promise.resolve({ data: { items: [mockSession] } }) : api.get<Wrap<ApiList<ParkingSession>>>('/staff/parking-sessions/search', { query: { q } }),

  checkIn: (payload: { plateNumber: string; vehicleType?: string; gate?: string; buildingId?: string }) =>
    USE_MOCK ? Promise.resolve({ data: { item: mockSession } }) : api.post<Wrap<{ item: ParkingSession }>>('/staff/parking-sessions/check-in', payload),

  checkOut: (id: string, body?: { paymentMethod?: string }) =>
    USE_MOCK
      ? Promise.resolve({ data: { item: mockSession } })
      : api.patch<Wrap<{ item: ParkingSession }>>(`/staff/parking-sessions/${id}/check-out`, body ?? {}),

  // Bank transfer (VietQR via PayOS): create a payment link for the parking fee.
  initiateSessionPayment: (id: string) =>
    USE_MOCK
      ? Promise.resolve({ data: { checkoutUrl: '', qrCode: '', orderCode: 0, amount: 0 } })
      : api.post<Wrap<{ checkoutUrl: string; qrCode: string; orderCode: number; amount: number; plateNumber: string }>>(
          `/staff/parking-sessions/${id}/initiate-payment`,
        ),

  // Reconcile a bank-transfer payment if the PayOS webhook didn't arrive.
  verifySessionPayment: (orderCode: number) =>
    USE_MOCK
      ? Promise.resolve({ data: { status: 'success', settled: true } })
      : api.get<Wrap<{ status: string; settled: boolean }>>(`/staff/parking-sessions/payment/${orderCode}/status`),

  getSessionById: (id: string) => (USE_MOCK ? Promise.resolve({ data: mockSession }) : api.get<Wrap<ParkingSession>>(`/staff/parking-sessions/${id}`)),

  getMyShifts: (query?: Record<string, string | undefined>) =>
    USE_MOCK ? Promise.resolve({ data: { items: [mockShift] } }) : api.get<Wrap<ApiList<MyShift>>>('/staff/my-shifts', { query }),

  createIncident: (payload: unknown) => (USE_MOCK ? Promise.resolve({ data: { item: payload } }) : api.post('/staff/incidents', payload)),

  processWallet: (payload: unknown) => (USE_MOCK ? Promise.resolve({ data: { success: true } }) : api.post('/staff/wallet-transactions', payload)),

  checkInReservation: (code: string) =>
    USE_MOCK ? Promise.resolve({ data: { success: true } }) : api.post(`/staff/reservations/${code}/check-in`),

  listReservations: (query?: Record<string, string | undefined>) =>
    USE_MOCK
      ? Promise.resolve({ data: { items: [] as StaffReservation[], total: 0 } })
      : api.get<Wrap<{ items: StaffReservation[]; total: number }>>('/staff/reservations', { query }),

  incidents: {
    list: (buildingId?: string) =>
      USE_MOCK ? Promise.resolve({ data: { items: [] } }) : api.get<Wrap<ApiList<StaffIncident>>>('/staff/incidents', { query: buildingId ? { buildingId } : undefined }),
  },

  // Backward-compatible aliases used by the current UI code
  buildings: () => (USE_MOCK ? Promise.resolve({ data: { items: [mockBuilding] } }) : api.get<Wrap<ApiList<StaffBuilding>>>('/staff/buildings')),

  myShifts: (q?: Record<string, string | undefined>) => (USE_MOCK ? Promise.resolve({ data: { items: [mockShift] } }) : api.get<Wrap<ApiList<MyShift>>>('/staff/my-shifts', { query: q })),

  sessions: {
    list: (buildingId: string, q?: Record<string, string | undefined>) =>
      USE_MOCK ? Promise.resolve({ data: { items: [mockSession] } }) : api.get<Wrap<{ items: ParkingSession[] }>>(`/staff/buildings/${buildingId}/sessions`, { query: q }),
    checkIn: (buildingId: string, body: { plateNumber: string; vehicleType?: string; gate?: string }) =>
      USE_MOCK ? Promise.resolve({ data: { item: mockSession } }) : api.post<Wrap<{ item: ParkingSession }>>(`/staff/buildings/${buildingId}/sessions/check-in`, body),
    checkOut: (buildingId: string, sessionId: string, body: { paymentMethod: string }) =>
      USE_MOCK ? Promise.resolve({ data: { item: mockSession } }) : api.patch<Wrap<{ item: ParkingSession }>>(`/staff/buildings/${buildingId}/sessions/${sessionId}/check-out`, body),
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
