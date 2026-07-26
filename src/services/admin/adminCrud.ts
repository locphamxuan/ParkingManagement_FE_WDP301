import { requestJson } from '@/services/client/apiClient';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface CreateAdminUserInput {
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
  phone?: string;
  /** buildingId to assign immediately after creation (staff / manager only) */
  buildingId?: string;
}

export interface UpdateAdminUserInput {
  fullName?: string;
  role?: 'admin' | 'manager' | 'staff' | 'user';
  phone?: string;
}

export interface CreateBuildingInput {
  name: string;
  code: string;
  fullAddress?: string;
  // Floors & pricing do managers set up themselves (floors + PricePolicy). Admin chỉ
  // tạo khung tòa nhà; BE vẫn yêu cầu 2 field này nên gửi giá trị khởi tạo tối thiểu.
  totalFloors?: number;
  hourlyRate?: number;
}

export interface UpdateBuildingInput {
  name?: string;
  code?: string;
  totalFloors?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  fullAddress?: string;
}

// All calls below authenticate via the httpOnly cookie (apiClient.ts sends
// credentials:'include' on every request) — no explicit Bearer token needed
// or accepted anymore, see docs/HUONG_DAN_NOI_BO_CODEBASE.md for why.

export async function createAdminUser(payload: CreateAdminUserInput): Promise<string> {
  const { buildingId, role, ...rest } = payload;
  // staff / manager must be created as a plain user first, then promoted via the
  // building assign endpoint (which sets the role + building). user / admin are
  // set directly on creation.
  const needsAssignment = role === 'staff' || role === 'manager';
  const res = await requestJson<ApiEnvelope<{ user: { _id: string } }>>({
    path: '/admin/users',
    method: 'POST',
    body: { ...rest, role: needsAssignment ? 'user' : role },
  });
  const userId = res.data?.user?._id;
  if (userId && buildingId && needsAssignment) {
    const endpoint = role === 'staff' ? 'assign-staff' : 'assign-manager';
    await requestJson({
      path: `/admin/buildings/${buildingId}/${endpoint}`,
      method: 'POST',
      body: { userId },
    });
  }
  return userId ?? '';
}

export async function assignStaffToBuilding(buildingId: string, userId: string): Promise<void> {
  await requestJson({
    path: `/admin/buildings/${buildingId}/assign-staff`,
    method: 'POST',
    body: { userId },
  });
}

export async function revokeStaffFromBuilding(buildingId: string, userId: string): Promise<void> {
  await requestJson({
    path: `/admin/buildings/${buildingId}/revoke-staff`,
    method: 'POST',
    body: { userId },
  });
}

export async function revokeManagerFromBuilding(buildingId: string, userId: string): Promise<void> {
  await requestJson({
    path: `/admin/buildings/${buildingId}/revoke-manager`,
    method: 'POST',
    body: { userId },
  });
}

export async function assignManagerToBuilding(buildingId: string, userId: string): Promise<void> {
  await requestJson({
    path: `/admin/buildings/${buildingId}/assign-manager`,
    method: 'POST',
    body: { userId },
  });
}

export async function updateAdminUser(userId: string, payload: UpdateAdminUserInput): Promise<void> {
  await requestJson<ApiEnvelope<{ user: unknown }>>({
    path: `/admin/users/${userId}`,
    method: 'PUT',
    body: payload,
  });
}

export async function updateAdminUserStatus(userId: string, isActive: boolean): Promise<void> {
  await requestJson<ApiEnvelope<{ user: unknown }>>({
    path: `/admin/users/${userId}/status`,
    method: 'PATCH',
    body: { isActive },
  });
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await requestJson<ApiEnvelope<null>>({
    path: `/admin/users/${userId}`,
    method: 'DELETE',
  });
}

export async function createBuilding(payload: CreateBuildingInput): Promise<void> {
  await requestJson<ApiEnvelope<{ building: unknown }>>({
    path: '/admin/buildings',
    method: 'POST',
    body: {
      name: payload.name,
      code: payload.code,
      // Khởi tạo tối thiểu để qua validator BE; manager sẽ tạo floor thật + PricePolicy.
      totalFloors: Number(payload.totalFloors ?? 1),
      pricing: {
        hourlyRate: Number(payload.hourlyRate ?? 0),
      },
      operatingHours: {
        open: '06:00',
        close: '22:00',
      },
      address: {
        fullAddress: payload.fullAddress || '',
      },
      status: 'active',
    },
  });
}

export async function updateBuilding(buildingId: string, payload: UpdateBuildingInput): Promise<void> {
  const body: Record<string, unknown> = {};

  if (payload.name !== undefined) body.name = payload.name;
  if (payload.code !== undefined) body.code = payload.code;
  if (payload.totalFloors !== undefined) body.totalFloors = Number(payload.totalFloors);
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.fullAddress !== undefined) {
    body.address = { fullAddress: payload.fullAddress };
  }

  await requestJson<ApiEnvelope<{ building: unknown }>>({
    path: `/admin/buildings/${buildingId}`,
    method: 'PUT',
    body,
  });
}

export async function updateBuildingStatus(
  buildingId: string,
  status: 'active' | 'inactive' | 'maintenance'
): Promise<void> {
  await requestJson<ApiEnvelope<{ building: unknown }>>({
    path: `/admin/buildings/${buildingId}/status`,
    method: 'PATCH',
    body: { status },
  });
}

export async function deleteBuilding(buildingId: string): Promise<void> {
  await requestJson<ApiEnvelope<null>>({
    path: `/admin/buildings/${buildingId}`,
    method: 'DELETE',
  });
}
