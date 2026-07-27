import { api } from '@/services/client/apiClient';

export interface AdminBuilding {
  _id: string;
  name: string;
  code: string;
  totalFloors: number;
  status: 'active' | 'inactive' | 'maintenance';
  isActive: boolean;
  operatingHours: { open: string; close: string };
  pricing: { hourlyRate: number; dailyCap?: number | null; motorcycleMultiplier?: number };
  manager?: { _id: string; fullName: string; email: string } | string | null;
  address?: { fullAddress?: string };
  contactPhone?: string;
  createdAt?: string;
}

export interface AdminUser {
  _id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  assignedBuildings?: string[];
  createdAt?: string;
}

export interface BuildingMembers {
  manager: AdminUser | null;
  staff: AdminUser[];
}

export interface AdminAuditLog {
  _id: string;
  actor: { _id: string; fullName: string; email: string; role: string } | null;
  action: string;
  targetTable: string;
  targetId?: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  building?: { _id: string; name: string; code: string } | null;
  description?: string;
  createdAt: string;
}

export interface AdminOverview {
  period?: 'today' | 'week' | 'month';
  counts: {
    buildings: number;
    managers: number;
    staff: number;
    users: number;
    activeSessions: number;
  };
  revenue: {
    /** Revenue over the selected period (backend field). */
    total: number;
    /** @deprecated legacy alias — backend now returns `total`. */
    today?: number;
    byMethod: Record<string, { amount: number; count: number }>;
  };
}

export interface AdminPricePolicy {
  _id: string;
  building: { _id: string; name: string; code: string } | string;
  vehicleType: { _id: string; code: string; name: string } | string;
  name: string;
  hourlyRate: number;
  dailyCap?: number | null;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

/** Read-only view of a building's long-term (customer) package. */
export interface AdminBuildingPackage {
  _id: string;
  name: string;
  code: string;
  vehicleType?: { _id: string; code: string; name: string } | string | null;
  durationDays: number;
  price: number;
  isActive: boolean;
}

export interface RevenueReportRow {
  buildingId: string;
  buildingName?: string;
  buildingCode?: string;
  totalRevenue: number;
  sessionCount: number;
  cashAmount: number;
  walletAmount: number;
  qrAmount: number;
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  pendingCash: number;
  walletFunding: number;
  paymentCount: number;
  pendingCashCount: number;
  onlineAmount: number;
  bySource: {
    parking: number;
    reservation: number;
    subscription: number;
    penalty: number;
  };
}

export interface RevenueReport {
  from: string;
  to: string;
  items: RevenueReportRow[];
  grandTotal: number;
  summary: {
    grossRevenue: number;
    refunds: number;
    netRevenue: number;
    pendingCash: number;
    walletFunding: number;
    successfulPayments: number;
    pendingCashPayments: number;
  };
  definitions: Record<string, string>;
}

export interface AdminPayment {
  _id: string;
  building?: { _id: string; name: string; code: string } | null;
  type: 'session' | 'reservation' | 'subscription' | 'penalty' | 'refund' | 'topup' | 'cancellation_fee';
  method: 'cash' | 'wallet' | 'qr' | 'card' | 'payos';
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'refunded' | 'reconciliation_required';
  settledAt?: string | null;
  createdAt: string;
  parkingSession?: { _id: string; plateNumber?: string } | null;
  user?: { _id: string; fullName?: string; email?: string } | null;
  staff?: { _id: string; fullName?: string; email?: string } | null;
  note?: string;
}

export interface RevenueReconciliation {
  generatedAt: string;
  staleThresholdHours: number;
  pendingCash: { count: number; amount: number };
  staleElectronic: { count: number; amount: number };
  reconciliationRequired: { count: number; amount: number };
  walletIntegrity: {
    checked: number;
    mismatchCount: number;
    mismatches: Array<{
      buildingId: string;
      walletBalance: number;
      ledgerBalance: number;
      difference: number;
    }>;
  };
  responsibility: { admin: string; manager: string };
}

export interface RoleGovernance {
  operatingModel: Record<'admin' | 'manager' | 'staff' | 'user', string>;
  roles: Array<{
    role: 'admin' | 'manager' | 'staff' | 'user';
    purpose: string;
    capabilities: string[];
    boundaries: string[];
  }>;
  separationOfDuties: Array<{
    flow: string;
    staff?: string;
    manager?: string;
    admin?: string;
  }>;
}

interface ListResult<T> {
  items: T[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

interface Wrap<T> {
  data: T;
}

export const adminApi = {
  overview: (period?: 'today' | 'week' | 'month') =>
    api.get<Wrap<AdminOverview>>('/admin/dashboard', {
      query: period ? { period } : undefined,
    }),

  buildings: {
    list: (q?: Record<string, string | undefined>) =>
      api.get<Wrap<ListResult<AdminBuilding>>>('/admin/buildings', { query: q }),
    get: (id: string) =>
      api.get<Wrap<{ building: AdminBuilding }>>(`/admin/buildings/${id}`),
    create: (body: Partial<AdminBuilding>) =>
      api.post<Wrap<{ building: AdminBuilding }>>('/admin/buildings', body),
    update: (id: string, body: Partial<AdminBuilding>) =>
      api.put<Wrap<{ building: AdminBuilding }>>(`/admin/buildings/${id}`, body),
    updateStatus: (id: string, status: AdminBuilding['status']) =>
      api.patch<Wrap<{ building: AdminBuilding }>>(`/admin/buildings/${id}/status`, {
        status,
      }),
    remove: (id: string) => api.delete(`/admin/buildings/${id}`),
    assignManager: (buildingId: string, userId: string) =>
      api.post(`/admin/buildings/${buildingId}/assign-manager`, { userId }),
    revokeManager: (buildingId: string, userId: string) =>
      api.post(`/admin/buildings/${buildingId}/revoke-manager`, { userId }),
    assignStaff: (buildingId: string, userId: string) =>
      api.post(`/admin/buildings/${buildingId}/assign-staff`, { userId }),
    revokeStaff: (buildingId: string, userId: string) =>
      api.post(`/admin/buildings/${buildingId}/revoke-staff`, { userId }),
    getMembers: (buildingId: string) =>
      api.get<Wrap<BuildingMembers>>(`/admin/buildings/${buildingId}/members`),
    /** Read-only: a building's price policies. */
    listPricePolicies: (buildingId: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: AdminPricePolicy[] }>>(
        `/admin/buildings/${buildingId}/price-policies`,
        { query: q }
      ),
    /** Read-only: a building's long-term packages. */
    listPackages: (buildingId: string) =>
      api.get<Wrap<{ items: AdminBuildingPackage[] }>>(`/admin/buildings/${buildingId}/packages`),
  },

  users: {
    list: (q?: Record<string, string | undefined>) =>
      api.get<Wrap<ListResult<AdminUser>>>('/admin/users', { query: q }),
    get: (id: string) => api.get<Wrap<{ user: AdminUser }>>(`/admin/users/${id}`),
    create: (body: Partial<AdminUser> & { password: string }) =>
      api.post<Wrap<{ user: AdminUser }>>('/admin/users', body),
    update: (id: string, body: Partial<AdminUser>) =>
      api.put<Wrap<{ user: AdminUser }>>(`/admin/users/${id}`, body),
    updateStatus: (id: string, isActive: boolean) =>
      api.patch<Wrap<{ user: AdminUser }>>(`/admin/users/${id}/status`, { isActive }),
    remove: (id: string) => api.delete(`/admin/users/${id}`),
  },

  auditLogs: (q?: Record<string, string | undefined>) =>
    api.get<Wrap<ListResult<AdminAuditLog>>>('/admin/audit-logs', { query: q }),

  /** Revenue reports (shift-revenue aggregation). */
  revenue: {
    /** GET /admin/revenue?from=&to=&buildingId= */
    report: (q: { from: string; to: string; buildingId?: string }) =>
      api.get<Wrap<RevenueReport>>('/admin/revenue', { query: q }),
    transactions: (q?: Record<string, string | number | undefined>) =>
      api.get<Wrap<ListResult<AdminPayment>>>('/admin/revenue/transactions', { query: q }),
    reconciliation: (staleHours = 24) =>
      api.get<Wrap<RevenueReconciliation>>('/admin/revenue/reconciliation', {
        query: { staleHours },
      }),
  },

  governance: {
    roles: () => api.get<Wrap<RoleGovernance>>('/admin/governance/roles'),
  },

  /** Read-only price policies across buildings (managers own pricing). */
  pricePolicies: {
    list: (q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: AdminPricePolicy[] }>>('/admin/price-policies', { query: q }),
  },
};

// Mutation helpers (create/update/delete users & buildings, assign/revoke
// manager, revoke staff) live in `./adminCrud` — kept separate for historical
// reasons (they used to take an explicit token before being migrated to
// cookie-only auth like everything above; the split wasn't worth undoing).
