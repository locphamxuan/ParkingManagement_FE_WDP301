import { api } from '@/services/apiClient';

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

export interface ManagerSubscriptionStatus {
  active: boolean;
  endDate: string | null;
  startDate: string | null;
  daysRemaining: number;
  package: { _id: string; name: string; price: number; durationDays: number } | null;
  packageName: string | null;
}

export interface BuildingMembers {
  manager: AdminUser | null;
  staff: AdminUser[];
  subscription?: ManagerSubscriptionStatus;
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

export interface SystemWallet {
  _id: string;
  balance: number;
  totalDistributed: number;
  updatedAt: string;
}

export interface WalletDistribution {
  _id: string;
  building: { _id: string; name: string; code: string };
  amount: number;
  periodStart?: string;
  periodEnd?: string;
  note?: string;
  createdAt: string;
}

export interface AdminOverview {
  counts: {
    buildings: number;
    managers: number;
    staff: number;
    users: number;
    activeSessions: number;
  };
  revenue: {
    today: number;
    byMethod: Record<string, { amount: number; count: number }>;
  };
}

interface ListResult<T> {
  items: T[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

interface Wrap<T> {
  data: T;
}

export const adminApi = {
  overview: () => api.get<Wrap<AdminOverview>>('/admin/dashboard'),

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
    getMembers: (buildingId: string) =>
      api.get<Wrap<BuildingMembers>>(`/admin/buildings/${buildingId}/members`),
    assignManager: (buildingId: string, userId: string) =>
      api.post(`/admin/buildings/${buildingId}/assign-manager`, { userId }),
    revokeManager: (buildingId: string, userId: string) =>
      api.post(`/admin/buildings/${buildingId}/revoke-manager`, { userId }),
    assignStaff: (buildingId: string, userId: string) =>
      api.post(`/admin/buildings/${buildingId}/assign-staff`, { userId }),
    revokeStaff: (buildingId: string, userId: string) =>
      api.post(`/admin/buildings/${buildingId}/revoke-staff`, { userId }),
    grantSubscription: (buildingId: string, packageId: string) =>
      api.post<Wrap<{ subscription: ManagerSubscriptionStatus }>>(
        `/admin/buildings/${buildingId}/subscription/grant`,
        { packageId },
      ),
    revokeSubscription: (buildingId: string) =>
      api.post<Wrap<{ subscription: ManagerSubscriptionStatus }>>(
        `/admin/buildings/${buildingId}/subscription/revoke`,
        {},
      ),
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

  wallet: {
    get: () => api.get<Wrap<{ wallet: SystemWallet }>>('/admin/wallet'),
    distributions: (q?: Record<string, string | undefined>) =>
      api.get<Wrap<ListResult<WalletDistribution>>>('/admin/wallet/distributions', { query: q }),
  },

  revenue: (q?: Record<string, string | undefined>) =>
    api.get<Wrap<{ items: { date: string; building: { _id: string; name: string; code: string }; totalRevenue: number; sessionCount: number }[]; total: number }>>('/admin/revenue', { query: q }),

  subscriptionRevenue: (q?: Record<string, string | undefined>) =>
    api.get<Wrap<{ items: SubscriptionTransfer[]; total: number; grandTotal: number }>>('/admin/revenue/subscriptions', { query: q }),

  subscriptionPackages: {
    list: () => api.get<Wrap<{ items: AdminSubscriptionPackage[] }>>('/admin/subscription-packages'),
    create: (body: Partial<AdminSubscriptionPackage>) =>
      api.post<Wrap<AdminSubscriptionPackage>>('/admin/subscription-packages', body),
    update: (id: string, body: Partial<AdminSubscriptionPackage>) =>
      api.put<Wrap<AdminSubscriptionPackage>>(`/admin/subscription-packages/${id}`, body),
    remove: (id: string) => api.delete(`/admin/subscription-packages/${id}`),
  },
};

export interface AdminSubscriptionPackage {
  _id: string;
  name: string;
  price: number;
  durationDays: number;
  description?: string;
  features: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface SubscriptionTransfer {
  _id: string;
  building?: { _id: string; name: string; code: string };
  performedBy?: { _id: string; fullName: string; email: string };
  amount: number;
  balanceAfter: number;
  createdAt: string;
}
