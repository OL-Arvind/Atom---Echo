interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 25_000; // 25s TTL for instant tab switching

export function invalidateDbCache(pattern?: string) {
  if (!pattern) {
    queryCache.clear();
    return;
  }
  for (const key of queryCache.keys()) {
    if (key.includes(pattern)) {
      queryCache.delete(key);
    }
  }
}

export async function withDbCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const cached = queryCache.get(key);
  const now = Date.now();
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data as T;
  }
  const fresh = await fetcher();
  queryCache.set(key, { data: fresh, timestamp: now });
  return fresh;
}
