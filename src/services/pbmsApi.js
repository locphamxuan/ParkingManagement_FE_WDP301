export const DEFAULT_API_BASE = 'http://localhost:5000/api';

export function normalizeApiBase(value = DEFAULT_API_BASE) {
  return String(value).trim().replace(/\/$/, '');
}

export async function requestJson({
  apiBase = DEFAULT_API_BASE,
  path,
  method = 'GET',
  token,
  body,
}) {
  const response = await fetch(`${normalizeApiBase(apiBase)}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || 'Không thể xử lý yêu cầu');
  }

  return payload;
}