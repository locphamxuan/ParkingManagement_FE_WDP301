// Hỗ trợ cả hai tên biến môi trường từng dùng (VITE_API_BASE và VITE_API_BASE_URL)
// để giữ tương thích sau khi hợp nhất 2 HTTP client về một.
const configuredApiBase =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined);

if (import.meta.env.PROD && !configuredApiBase) {
  throw new Error(
    'VITE_API_BASE must be configured with the production backend URL before building.',
  );
}

const API_BASE = (configuredApiBase || 'http://localhost:5000/api').replace(/\/+$/, '');

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

function buildQuery(query?: ApiOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function apiRequest<T = unknown>(
  method: Method,
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const url = `${API_BASE}${path}${buildQuery(options.query)}`;

  const res = await fetch(url, {
    method,
    // Sends the httpOnly auth cookie automatically — this is the ONLY auth
    // channel for the web app now (see storage.ts / auth.middleware.js on BE).
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch (_err) {
    payload = null;
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message)
        : null) || `Request failed (${res.status})`;
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-unauthorized'));
      }
    }
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: ApiOptions) =>
    apiRequest<T>('GET', path, options),
  post: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    apiRequest<T>('POST', path, { ...options, body }),
  put: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    apiRequest<T>('PUT', path, { ...options, body }),
  patch: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    apiRequest<T>('PATCH', path, { ...options, body }),
  delete: <T = unknown>(path: string, options?: ApiOptions) =>
    apiRequest<T>('DELETE', path, options),
};

export const API_BASE_URL = API_BASE;

// ── Adapter tương thích (thay cho services/client/pbmsApi cũ) ────────────────
// Giữ nguyên chữ ký `requestJson` để các caller (auth, admin) không phải đổi,
// nhưng nội bộ dùng chung `apiRequest` → chỉ còn MỘT triển khai HTTP.
export const DEFAULT_API_BASE = API_BASE;

export function normalizeApiBase(value: string = DEFAULT_API_BASE): string {
  return String(value).trim().replace(/\/$/, '');
}

interface RequestJsonOptions {
  /** Không còn dùng (mọi call đi qua API_BASE chung); giữ để tương thích chữ ký. */
  apiBase?: string;
  path: string;
  method?: Method;
  body?: unknown;
}

export function requestJson<T = unknown>({
  path,
  method = 'GET',
  body,
}: RequestJsonOptions): Promise<T> {
  return apiRequest<T>(method, path, { body });
}
