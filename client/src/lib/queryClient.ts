import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let message = res.statusText;
    const text = await res.text();
    if (text) {
      try {
        const json = JSON.parse(text);
        message = json.message || json.error || text;
      } catch {
        message = text;
      }
    }
    throw new Error(message);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

/**
 * Build a request URL from a TanStack Query queryKey.
 *
 * Convention used across the codebase: the FIRST element is always the
 * absolute API path (e.g. "/api/members"). Any subsequent string/number
 * segments are appended as path segments (e.g. ["/api/members", id]
 * → "/api/members/<id>"). Object segments are treated as query-string
 * filters and are skipped from the path part — this preserves uniqueness
 * in the cache without producing nonsense URLs like
 * "/api/members/[object Object]" (the original bug).
 */
function buildUrlFromKey(queryKey: readonly unknown[]): string {
  if (queryKey.length === 0) {
    throw new Error("Empty queryKey passed to default fetcher");
  }
  const [base, ...rest] = queryKey;
  if (typeof base !== "string") {
    throw new Error("queryKey[0] must be a string URL path");
  }
  const segments: string[] = [];
  const params: Record<string, string> = {};
  for (const part of rest) {
    if (part === undefined || part === null) continue;
    if (typeof part === "string" || typeof part === "number") {
      segments.push(encodeURIComponent(String(part)));
    } else if (typeof part === "object") {
      for (const [k, v] of Object.entries(part as Record<string, unknown>)) {
        if (v === undefined || v === null) continue;
        params[k] = String(v);
      }
    }
  }
  let url = base.replace(/\/+$/, "");
  if (segments.length) url += "/" + segments.join("/");
  const qs = new URLSearchParams(params).toString();
  if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  return url;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(buildUrlFromKey(queryKey), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // 30s default keeps lists fresh while avoiding pointless refetches
      // during a single user interaction. Mutations always invalidate
      // their target keys explicitly.
      staleTime: 30_000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
