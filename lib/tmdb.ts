export const IMG_BASE = 'https://image.tmdb.org/t/p';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export async function tmdbFetch<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  const readToken = process.env.TMDB_READ_ACCESS_TOKEN;

  if (!apiKey && !readToken) {
    throw new Error('Neither TMDB_API_KEY nor TMDB_READ_ACCESS_TOKEN is defined in environment variables');
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = new URL(`https://api.themoviedb.org/3${cleanEndpoint}`);

  const tokenToUse = readToken || (apiKey?.startsWith('ey') ? apiKey : null);
  const v3KeyToUse = !tokenToUse && apiKey && !apiKey.startsWith('ey') ? apiKey : null;

  if (v3KeyToUse) {
    url.searchParams.set('api_key', v3KeyToUse);
  }

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }

  const cacheKey = url.toString();
  const cached = cache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }

  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  if (tokenToUse) {
    headers['Authorization'] = `Bearer ${tokenToUse}`;
  }

  const res = await fetch(url.toString(), {
    headers,
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`TMDB fetch failed [${res.status}]: ${errorText}`);
  }

  const data = (await res.json()) as T;
  cache.set(cacheKey, { data, timestamp: now });

  return data;
}
