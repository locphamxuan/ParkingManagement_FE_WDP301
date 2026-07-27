// Giá trị key phải giữ nguyên vĩnh viễn — đổi là mất dữ liệu người dùng đã lưu.
export const STORAGE_KEYS = {
  token: 'pbms.token',
  user: 'pbms.user',
  forgotEmailPending: 'pbms.forgotEmail_pending',
  savedAccounts: 'pbms_saved_accounts',
  staffCameraDevices: 'pbms.staffCameraDevices',
  selectedVehicleType: 'pbms_selected_vehicle_type',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// Auth is via httpOnly cookie (see services/client/apiClient.ts) — the token
// itself is never written here, so it can't be read out by an XSS payload.
// `user` is cached only for optimistic UI on reload (display data, not a secret).
export interface LocalSession {
  user: Record<string, unknown> | null;
}

export function loadJson<T = unknown>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveJson(key: StorageKey, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage không khả dụng (private mode) — bỏ qua, không chặn UI
  }
}

export function loadString(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveString(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage không khả dụng — bỏ qua
  }
}

export function removeStored(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage không khả dụng — bỏ qua
  }
}

export function loadSession(): LocalSession {
  // One-time purge of any token a pre-cookie-auth build of this app left
  // behind in localStorage — nothing writes STORAGE_KEYS.token anymore.
  localStorage.removeItem(STORAGE_KEYS.token);
  const user = loadJson<Record<string, unknown>>(STORAGE_KEYS.user);
  return { user };
}

export function saveSession(session: LocalSession): void {
  if (session?.user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(session.user));
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.user);
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
}

export function saveForgotEmail(email: string): void {
  localStorage.setItem(STORAGE_KEYS.forgotEmailPending, email);
}

export function loadForgotEmail(): string | null {
  return localStorage.getItem(STORAGE_KEYS.forgotEmailPending);
}

export function clearForgotEmail(): void {
  localStorage.removeItem(STORAGE_KEYS.forgotEmailPending);
}
