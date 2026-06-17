export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface ApiAuthHandlers {
  getAccessToken?: () => string | null;
  refreshSession?: () => Promise<string | null>;
  clearSession?: () => void;
}

let apiAuthHandlers: ApiAuthHandlers = {};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export interface ApiFetchOptions extends RequestInit {
  query?: Record<string, string | number | boolean | null | undefined>;
  retryOnAuthError?: boolean;
}

export function registerApiAuthHandlers(handlers: ApiAuthHandlers) {
  apiAuthHandlers = handlers;
}

export function buildApiUrl(path: string, query?: ApiFetchOptions["query"]) {
  const baseUrl = resolveApiBaseUrl();
  const url = new URL(path.replace(/^\//, ""), `${baseUrl.replace(/\/$/, "")}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "" || value === "all") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function resolveApiBaseUrl() {
  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return API_BASE_URL;
  }

  const origin = typeof window === "undefined" ? APP_BASE_URL : window.location.origin;
  return new URL(API_BASE_URL, origin).toString();
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { query, headers, retryOnAuthError = true, ...init } = options;
  const accessToken = apiAuthHandlers.getAccessToken?.();
  const baseHeaders = {
    Accept: "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headers
  };

  const requestUrl = buildApiUrl(path, query);
  let response = await fetch(requestUrl, {
    ...init,
    credentials: "include",
    headers: baseHeaders,
    cache: "no-store"
  });

  if (response.status === 401 && retryOnAuthError && !path.startsWith("/auth/") && apiAuthHandlers.refreshSession) {
    const nextAccessToken = await apiAuthHandlers.refreshSession();

    if (nextAccessToken) {
      response = await fetch(requestUrl, {
        ...init,
        credentials: "include",
        headers: {
          ...baseHeaders,
          Authorization: `Bearer ${nextAccessToken}`
        },
        cache: "no-store"
      });
    }
  }

  const rawBody = await response.text();
  const payload = rawBody ? safeParse(rawBody) : null;

  if (!response.ok) {
    throw new ApiError("Request failed.", response.status, payload);
  }

  return payload as T;
}

function safeParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
