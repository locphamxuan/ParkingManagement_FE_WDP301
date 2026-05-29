import { requestJson } from '@/services/pbmsApi';
import type { AdminDataset } from '@/services/admin/types';
import type {
  AuditLog,
  Building,
  MonitoringMetric,
  RevenuePoint,
  UserRecord,
} from '@/types';

interface ApiEnvelope<T> {
  data: T;
  message?: string;
  success: boolean;
}

interface AdminOverviewData {
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

interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiBuilding {
  _id: string;
  code?: string;
  name: string;
  address?: {
    fullAddress?: string;
  };
  totalFloors?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  manager?: string | null;
}

interface ApiUser {
  _id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
  isActive?: boolean;
  licensePlates?: Array<{ plateNumber?: string }>;
  phone?: string;
}

interface ApiAudit {
  _id: string;
  actor?: { email?: string; fullName?: string } | null;
  action: string;
  targetTable: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  createdAt?: string;
}

interface ManagerOverviewData {
  slots?: {
    occupancyRate?: number;
  };
  sessions?: {
    today?: number;
    active?: number;
  };
  revenue?: {
    today?: number;
    weekly?: Array<{
      date: string;
      revenue: number;
      sessions: number;
    }>;
  };
}

const OPERATIONAL_GUARDRAILS = [
  'Online passes must be linked to an authenticated user account with a registered plate.',
  'Walk-in guests may only enter via a valid parking session and must pay before leaving.',
  'All pricing policy changes, account locks, and fee adjustments must have an audit log.',
];

const METHOD_LABELS: Record<string, string> = {
  wallet: 'Wallet',
  qr: 'QR',
  cash: 'Cash',
  card: 'Bank card',
};

const formatCompactCurrency = (amount: number): string =>
  `${(amount / 1_000_000).toFixed(1)}M VND`;

const formatChartDate = (dateValue: string): string => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });
};

const toBuilding = (
  item: ApiBuilding,
  managerNameById: Map<string, string>,
  overview?: ManagerOverviewData,
): Building => {
  const managerId = item.manager ? String(item.manager) : '';
  const managerName = managerNameById.get(managerId) || (managerId ? `ID: ${managerId.slice(0, 8)}` : 'Not assigned');

  return {
    id: item.code || item._id,
    backendId: item._id,
    name: item.name,
    address: item.address?.fullAddress || 'Address not set',
    floors: item.totalFloors || 0,
    occupancyRate: Number(overview?.slots?.occupancyRate || 0),
    status: item.status || 'inactive',
    manager: managerName,
    revenueToday: Number(overview?.revenue?.today || 0),
  };
};

const toUser = (item: ApiUser): UserRecord => {
  // Check if locally updated user exists
  const locallyUpdatedRaw = localStorage.getItem('pbms.locallyUpdatedUsers');
  const locallyUpdated = locallyUpdatedRaw ? JSON.parse(locallyUpdatedRaw) : {};
  
  // Case-insensitive and trimmed lookup
  const targetEmail = (item.email || '').trim().toLowerCase();
  const matchingKey = Object.keys(locallyUpdated).find(
    (key) => key.trim().toLowerCase() === targetEmail
  );
  const localUser = matchingKey ? locallyUpdated[matchingKey] : null;

  const backendPlates = (item.licensePlates || []).map((p) => 
    typeof p === 'string' ? p : p.plateNumber || ''
  ).filter(Boolean);

  if (localUser) {
    const localPlates = (localUser.licensePlates || []).map((p: any) => 
      typeof p === 'string' ? p : p.plateNumber || ''
    ).filter(Boolean);

    // Merge both arrays uniquely
    const mergedPlates = Array.from(new Set([...localPlates, ...backendPlates]));

    return {
      id: item._id,
      name: localUser.fullName || item.fullName,
      email: item.email,
      role: item.role,
      status: item.isActive === false ? 'blocked' : 'active',
      walletBalance: 0,
      linkedPlates: mergedPlates,
      phone: localUser.phone || item.phone || '',
    };
  }

  return {
    id: item._id,
    name: item.fullName,
    email: item.email,
    role: item.role,
    status: item.isActive === false ? 'blocked' : 'active',
    walletBalance: 0,
    linkedPlates: backendPlates,
    phone: item.phone || '',
  };
};

const toAudit = (item: ApiAudit): AuditLog => ({
  id: item._id,
  actor: item.actor?.email || item.actor?.fullName || 'unknown',
  action: item.action,
  target: item.targetTable,
  severity: item.severity || 'low',
  timestamp: item.createdAt ? new Date(item.createdAt).toLocaleString('en-GB') : '-',
  details: item.description || `${item.action} on ${item.targetTable}`,
});

async function getManagerOverview(token: string, buildingId: string): Promise<ManagerOverviewData | null> {
  try {
    const response = await requestJson<ApiEnvelope<ManagerOverviewData>>({
      path: `/manager/buildings/${buildingId}/dashboard`,
      token,
    });
    return response.data;
  } catch {
    return null;
  }
}

export async function getApiAdminDataset(token: string): Promise<AdminDataset> {
  const [overviewRes, buildingsRes, usersRes, auditRes] = await Promise.all([
    requestJson<ApiEnvelope<AdminOverviewData>>({ path: '/admin/dashboard', token }),
    requestJson<ApiEnvelope<Paginated<ApiBuilding>>>({ path: '/admin/buildings?limit=200', token }),
    requestJson<ApiEnvelope<Paginated<ApiUser>>>({ path: '/admin/users?limit=200', token }),
    requestJson<ApiEnvelope<Paginated<ApiAudit>>>({ path: '/admin/audit-logs?limit=200', token }),
  ]);

  const buildingItems = buildingsRes.data.items || [];
  const userItems = usersRes.data.items || [];
  const auditItems = auditRes.data.items || [];

  const managerNameById = new Map(
    userItems
      .filter((user) => user.role === 'manager')
      .map((user) => [String(user._id), user.fullName]),
  );

  const managerOverviews = await Promise.all(
    buildingItems.map(async (building) => ({
      buildingId: building._id,
      data: await getManagerOverview(token, building._id),
    })),
  );
  const managerOverviewMap = new Map(managerOverviews.map((x) => [x.buildingId, x.data]));

  const buildings: Building[] = buildingItems.map((item) =>
    toBuilding(item, managerNameById, managerOverviewMap.get(item._id) || undefined),
  );

  const users: UserRecord[] = userItems.map(toUser);
  const auditLogs: AuditLog[] = auditItems.map(toAudit);

  const weeklyMap = new Map<string, { revenue: number; sessions: number; occupancySum: number; count: number }>();

  managerOverviews.forEach(({ data }) => {
    if (!data?.revenue?.weekly) return;

    data.revenue.weekly.forEach((point) => {
      const current = weeklyMap.get(point.date) || {
        revenue: 0,
        sessions: 0,
        occupancySum: 0,
        count: 0,
      };
      current.revenue += Number(point.revenue || 0);
      current.sessions += Number(point.sessions || 0);
      current.occupancySum += Number(data?.slots?.occupancyRate || 0);
      current.count += 1;
      weeklyMap.set(point.date, current);
    });
  });

  const revenueTrend: RevenuePoint[] = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .slice(-7)
    .map(([date, value]) => ({
      date: formatChartDate(date),
      revenue: Math.round(value.revenue),
      occupancy: value.count > 0 ? Math.round((value.occupancySum / value.count) * 10) / 10 : 0,
      sessions: value.sessions,
    }));

  const paymentMethodDistribution = Object.entries(overviewRes.data.revenue.byMethod || {}).map(
    ([method, summary]) => ({
      name: METHOD_LABELS[method] || method,
      value: Number(summary.amount || 0),
    }),
  );

  const dashboardStats = [
    {
      key: 'buildings',
      label: 'Total buildings',
      value: String(overviewRes.data.counts.buildings),
      delta: `${buildings.filter((b) => b.status === 'active').length} active`,
    },
    {
      key: 'sessions',
      label: 'Parking sessions active',
      value: overviewRes.data.counts.activeSessions.toLocaleString('en-US'),
      delta: `${overviewRes.data.counts.staff}  operators on duty`,
    },
    {
      key: 'revenue',
      label: 'Today revenue',
      value: formatCompactCurrency(overviewRes.data.revenue.today),
      delta: `${paymentMethodDistribution.length} payment methods`,
    },
    {
      key: 'users',
      label: 'Total users',
      value: overviewRes.data.counts.users.toLocaleString('en-US'),
      delta: `${overviewRes.data.counts.managers} managers / ${overviewRes.data.counts.staff} staff`,
    },
  ];

  const monitoringMetrics: MonitoringMetric[] = [
    {
      id: 'active-buildings',
      label: 'Total active buildings',
      value: `${buildings.filter((b) => b.status === 'active').length}/${buildings.length}`,
      trend: 'Based on current status',
      status: buildings.some((b) => b.status === 'maintenance') ? 'warning' : 'ok',
    },
    {
      id: 'active-sessions',
      label: 'Parking sessions active',
      value: overviewRes.data.counts.activeSessions.toLocaleString('en-US'),
      trend: 'Updated in real-time',
      status: overviewRes.data.counts.activeSessions > 0 ? 'ok' : 'warning',
    },
    {
      id: 'ops-staff',
      label: 'Operating staff',
      value: overviewRes.data.counts.staff.toLocaleString('en-US'),
      trend: `${overviewRes.data.counts.managers} managers`,
      status: overviewRes.data.counts.staff > 0 ? 'ok' : 'critical',
    },
  ];

  const liveActivities = auditLogs.slice(0, 5).map(
    (log) => `${log.action}: ${log.details}`,
  );

  return {
    dashboardStats,
    revenueTrend,
    paymentMethodDistribution,
    buildings,
    users,
    transactions: [],
    auditLogs,
    fraudAlerts: [],
    monitoringMetrics,
    liveActivities,
    operationalGuardrails: OPERATIONAL_GUARDRAILS,
  };
}
