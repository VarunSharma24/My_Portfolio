type Entry = { count: number; reset: number };
const globalStore = globalThis as typeof globalThis & { __varunRateLimits?: Map<string, Entry> };
const store = (globalStore.__varunRateLimits ??= new Map());

// In-memory fallback suitable for single-instance development. Use a shared edge/store limiter when horizontally scaling.
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (store.size > 10_000)
    for (const [storedKey, value] of store) if (value.reset <= now) store.delete(storedKey);
  const entry = store.get(key);
  if (!entry || entry.reset <= now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  entry.count++;
  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}

export function requestKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
