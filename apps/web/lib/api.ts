export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export function csrfToken(): string {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((entry) => entry.startsWith("atlas_csrf="))?.split("=")[1] ?? "";
}

async function readPayload<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? `Request failed (${response.status})`);
  return payload;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "content-type": "application/json", ...(init.headers ?? {}), ...(init.method && init.method !== "GET" ? { "x-csrf-token": csrfToken() } : {}) },
  });
  return readPayload<T>(response);
}

export async function apiFetchForm<T>(path: string, form: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "x-csrf-token": csrfToken() },
    body: form,
  });
  return readPayload<T>(response);
}
