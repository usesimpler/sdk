import type { SimplerAuth } from "./auth.js";
import { SimplerApiError } from "./errors.js";
import type { TenantScope } from "./tenant.js";

export const DEFAULT_TIMEOUT_MS = 15_000;

export type TransportConfig = {
  apiBase: string;
  auth: SimplerAuth;
  timeoutMs?: number;
};

export type RequestOptions = Omit<RequestInit, "signal"> & {
  signal?: AbortSignal | null;
  timeoutMs?: number;
  /** When false, omit default `Content-Type: application/json` (e.g. multipart FormData). */
  json?: boolean;
  /** How to read a successful response body. Defaults to `json`. */
  response?: "json" | "blob";
};

/** Bound HTTP call for one client or fork. Outside resources take this and nothing else. */
export type SimplerTransport = {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
};

function mergeSignals(signals: AbortSignal[]): AbortSignal {
  const only = signals[0];
  if (signals.length === 1 && only) return only;
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

async function resolveAccessToken(auth: SimplerAuth): Promise<string | null> {
  if (auth.type === "oauth") return auth.accessToken;
  return auth.getAccessToken();
}

function applyTenantToUrl(url: string, tenant: TenantScope | undefined): string {
  if (!tenant) return url;
  const sep = url.includes("?") ? "&" : "?";
  if (tenant.kind === "org") {
    if (tenant.orgSlug) return `${url}${sep}org_slug=${encodeURIComponent(tenant.orgSlug)}`;
    if (tenant.orgId) return `${url}${sep}org_id=${encodeURIComponent(tenant.orgId)}`;
    return url;
  }
  if (tenant.kind === "site") return url;
  if (url.includes("team_id=")) return url;
  return `${url}${sep}team_id=${encodeURIComponent(tenant.teamId)}`;
}

function tenantHeaders(tenant: TenantScope | undefined): Record<string, string> {
  if (!tenant) return {};
  if (tenant.kind === "org") {
    const headers: Record<string, string> = {};
    if (tenant.orgSlug) headers["X-Org-Slug"] = tenant.orgSlug;
    if (tenant.orgId) headers["X-Org-Id"] = tenant.orgId;
    return headers;
  }
  if (tenant.kind === "site") return {};
  return { "X-Team-Id": tenant.teamId };
}

/** True when fetch was aborted by `AbortSignal.timeout` (undici `TimeoutError`). */
export function isTimeoutError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name: unknown }).name === "TimeoutError"
  );
}

export function createTransport(config: TransportConfig, tenant?: TenantScope): SimplerTransport {
  const apiBase = config.apiBase.replace(/\/$/, "");
  const defaultTimeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const pathPart = path.startsWith("/") ? path : `/${path}`;
    const versionedPath = `/v1${pathPart}`;
    if (
      !versionedPath ||
      versionedPath === "/v1" ||
      versionedPath === "/v1/"
    ) {
      throw new Error(`Invalid API path: "${path}" would request API root`);
    }

    let url = `${apiBase}${versionedPath}`;
    url = applyTenantToUrl(url, tenant);

    const {
      timeoutMs = defaultTimeoutMs,
      signal: callerSignal,
      response: responseType = "json",
      json: jsonOption,
      ...rest
    } = options;
    const isFormData =
      typeof FormData !== "undefined" && rest.body instanceof FormData;
    const json = jsonOption ?? (responseType === "json" && !isFormData);
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = callerSignal
      ? mergeSignals([callerSignal, timeoutSignal])
      : timeoutSignal;

    const headers: Record<string, string> = {
      ...(json && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(rest.headers as Record<string, string> | undefined),
      ...tenantHeaders(tenant),
    };

    const token = await resolveAccessToken(config.auth);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const credentials =
      config.auth.type === "session" ? (config.auth.credentials ?? "include") : rest.credentials;

    let res: Response;
    try {
      res = await fetch(url, {
        ...rest,
        headers,
        credentials,
        signal,
      });
    } catch (err) {
      // undici rejects with a raw TimeoutError DOMException; normalize so SSR
      // callers (and `.catch` fallbacks) see a consistent SimplerApiError.
      if (isTimeoutError(err)) {
        throw new SimplerApiError(`Request timed out after ${timeoutMs}ms`, 408, {
          cause: err,
        });
      }
      throw err;
    }

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const message =
        errorBody &&
        typeof errorBody === "object" &&
        "error" in errorBody &&
        typeof (errorBody as { error?: unknown }).error === "string"
          ? (errorBody as { error: string }).error
          : res.statusText;
      throw new SimplerApiError(message || "Request failed", res.status, errorBody);
    }

    if (res.status === 204) return undefined as T;

    if (responseType === "blob") {
      return res.blob() as Promise<T>;
    }

    const body = await res.json().catch(() => ({}));

    if (
      body &&
      typeof body === "object" &&
      "basePath" in body &&
      (body as { basePath?: string }).basePath === "/v1"
    ) {
      const finalUrl = typeof res.url === "string" ? res.url : url;
      throw new SimplerApiError(
        `API returned root response. Requested ${url} but got API root (final URL: ${finalUrl}). Check apiBase is the API origin with no trailing slash.`,
        res.status,
        body,
      );
    }

    return body as T;
  }

  return { request };
}
