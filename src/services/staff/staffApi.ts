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
  slot?: { _id: string; code: string } | null;
  gate?: { _id: string; code: string; name: string } | null;
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

  getActiveSessions: () => api.get<Wrap<ApiList<ParkingSession>>>('/staff/parking-sessions/active'),

  searchSessions: (q: string) =>
    api.get<Wrap<ApiList<ParkingSession>>>('/staff/parking-sessions/search', { query: { q } }),

  checkIn: (payload: { plateNumber: string; vehicleType?: string; gate?: string; buildingId?: string }) =>
    api.post<Wrap<{ item: ParkingSession }>>('/staff/parking-sessions/check-in', payload),

  checkOut: (id: string) => api.patch<Wrap<{ item: ParkingSession }>>(`/staff/parking-sessions/${id}/check-out`),

  getSessionById: (id: string) => api.get<Wrap<ParkingSession>>(`/staff/parking-sessions/${id}`),

  getMyShifts: (query?: Record<string, string | undefined>) =>
    api.get<Wrap<ApiList<MyShift>>>('/staff/my-shifts', { query }),

  createIncident: (payload: unknown) => api.post('/staff/incidents', payload),

  processWallet: (payload: unknown) => api.post('/staff/wallet-transactions', payload),

  checkInReservation: (code: string) => api.post(`/staff/reservations/${code}/check-in`),

  incidents: {
    list: (buildingId?: string) =>
      api.get<Wrap<ApiList<StaffIncident>>>('/staff/incidents', {
        query: buildingId ? { buildingId } : undefined,
      }),
  },

  // Backward-compatible aliases used by the current UI code
  buildings: () => api.get<Wrap<ApiList<StaffBuilding>>>('/staff/buildings'),

  myShifts: (q?: Record<string, string | undefined>) =>
    api.get<Wrap<ApiList<MyShift>>>('/staff/my-shifts', { query: q }),

  sessions: {
    list: (buildingId: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: ParkingSession[] }>>(
        `/staff/buildings/${buildingId}/sessions`,
        { query: q }
      ),
    checkIn: (
      buildingId: string,
      body: { plateNumber: string; vehicleType?: string; gate?: string }
    ) =>
      api.post<Wrap<{ item: ParkingSession }>>(
        `/staff/buildings/${buildingId}/sessions/check-in`,
        body
      ),
    checkOut: (buildingId: string, sessionId: string, body: { paymentMethod: string }) =>
      api.patch<Wrap<{ item: ParkingSession }>>(
        `/staff/buildings/${buildingId}/sessions/${sessionId}/check-out`,
        body
      ),
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
