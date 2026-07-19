const STORAGE_KEYS = {
  apiBase: 'pbms.apiBase',
  token: 'pbms.token',
  user: 'pbms.user',
} as const;

export interface LocalSession {
  token: string;
  user: Record<string, unknown> | null;
}

function getItem(key: string): string | null {
  try {
    const s = sessionStorage.getItem(key);
    if (s) return s;
  } catch {}
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setItem(key: string, val: string): void {
  try { sessionStorage.setItem(key, val); } catch {}
  try { localStorage.setItem(key, val); } catch {}
}

function removeItem(key: string): void {
  try { sessionStorage.removeItem(key); } catch {}
  try { localStorage.removeItem(key); } catch {}
}

export function loadJson<T = unknown>(key: string): T | null {
  try {
    const raw = getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadApiBase(defaultValue: string): string {
  return getItem(STORAGE_KEYS.apiBase) || defaultValue;
}

export function saveApiBase(apiBase: string): void {
  setItem(STORAGE_KEYS.apiBase, apiBase);
}

export function loadSession(): LocalSession {
  const token = getItem(STORAGE_KEYS.token) || '';
  const user = loadJson<Record<string, unknown>>(STORAGE_KEYS.user);

  return { token, user };
}

export function saveSession(session: LocalSession): void {
  if (session?.token) {
    setItem(STORAGE_KEYS.token, session.token);
    setItem(STORAGE_KEYS.user, JSON.stringify(session.user || null));
    return;
  }

  removeItem(STORAGE_KEYS.token);
  removeItem(STORAGE_KEYS.user);
}

export function clearSession(): void {
  removeItem(STORAGE_KEYS.token);
  removeItem(STORAGE_KEYS.user);
}
