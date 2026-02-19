const DEFAULT_API_BASE =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000";
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? DEFAULT_API_BASE;

const AUTH_STORAGE_KEY = "workplatform-auth";

type StoredAuth = {
  token: string;
  userEmail: string;
  role: string;
};

const getToken = () => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredAuth>;
    return parsed.token ?? null;
  } catch {
    return null;
  }
};

export const getAuthToken = () => getToken();
export const getApiBase = () => API_BASE;

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let requestId = response.headers.get("x-request-id") ?? undefined;
    try {
      const payload = (await response.json()) as {
        detail?: string;
        error?: { message?: string; requestId?: string };
      };
      if (payload.error?.message) {
        message = payload.error.message;
      } else if (payload.detail) {
        message = payload.detail;
      }
      requestId = payload.error?.requestId ?? requestId;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    if (requestId) {
      message = `${message} (Request ID: ${requestId})`;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
