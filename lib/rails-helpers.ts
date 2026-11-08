/**
 * Shared helpers for /api/rails/primary and /api/rails/secondary routes.
 * Extracted from the original monolithic /api/rails/route.ts.
 */
import { tmdbFetch } from '@/lib/tmdb';
import { RailData, RailItem, TMDBPaginatedResponse } from '@/lib/types';

export interface RawTMDBItem {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  overview?: string;
  media_type?: string;
}

export function mapRailItems(
  items: RawTMDBItem[] | undefined,
  defaultMediaType: 'movie' | 'tv' = 'movie'
): RailItem[] {
  if (!items || !Array.isArray(items)) return [];

  return items
    .filter((item): item is RawTMDBItem & { poster_path: string } => Boolean(item.poster_path))
    .slice(0, 20)
    .map((item) => {
      const media_type: 'movie' | 'tv' =
        item.media_type === 'tv' || (!item.title && Boolean(item.name))
          ? 'tv'
          : defaultMediaType;

      const dateStr = item.release_date || item.first_air_date || '';
      const year = dateStr ? dateStr.substring(0, 4) : '';
      const genre_ids = item.genre_ids || item.genres?.map((g) => g.id) || [];

      return {
        id: item.id,
        media_type,
        title: item.title || item.name || 'Untitled',
        year,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path || null,
        vote_average: Number((item.vote_average || 0).toFixed(1)),
        genre_ids,
        overview: item.overview || '',
      };
    });
}

export async function fetchRail(
  title: string,
  endpoint: string,
  params: Record<string, string>,
  defaultMediaType: 'movie' | 'tv' = 'movie'
): Promise<RailData> {
  try {
    const response = await tmdbFetch<TMDBPaginatedResponse<RawTMDBItem>>(endpoint, params);
    return {
      title,
      items: mapRailItems(response.results, defaultMediaType),
    };
  } catch (err) {
    console.error(`Failed to fetch rail "${title}":`, err);
    return { title, items: [] };
  }
}

export async function fetchCuratedRail(
  title: string,
  ids: number[],
  defaultMediaType: 'movie' | 'tv' = 'movie'
): Promise<RailData> {
  try {
    const fetchedItems = await Promise.all(
      ids.map(async (id) => {
        try {
          return await tmdbFetch<RawTMDBItem>(`/${defaultMediaType}/${id}`, { language: 'en-US' });
        } catch {
          return null;
        }
      })
    );
    const validItems = fetchedItems.filter((item): item is RawTMDBItem => Boolean(item));
    return {
      title,
      items: mapRailItems(validItems, defaultMediaType),
    };
  } catch (err) {
    console.error(`Failed to fetch curated rail "${title}":`, err);
    return { title, items: [] };
  }
}

// Fallback data
export const FALLBACK_PRIMARY_RAILS: RailData[] = [
  {
    title: 'Trending This Week',
    items: [
      { id: 157336, media_type: 'movie', title: 'Interstellar', year: '2014', poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg', vote_average: 8.4, genre_ids: [12, 18, 878], overview: 'The adventures of a group of explorers.' },
      { id: 27205, media_type: 'movie', title: 'Inception', year: '2010', poster_path: '/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg', backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg', vote_average: 8.4, genre_ids: [28, 878, 12], overview: 'A thief enters the subconscious of his targets.' },
      { id: 155, media_type: 'movie', title: 'The Dark Knight', year: '2008', poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', backdrop_path: '/dqK9Hag1054tghRQSqLSfrkvQnA.jpg', vote_average: 8.5, genre_ids: [18, 28, 80], overview: 'Batman raises the stakes in his war on crime.' },
      { id: 872585, media_type: 'movie', title: 'Oppenheimer', year: '2023', poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', backdrop_path: '/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg', vote_average: 8.1, genre_ids: [18, 36], overview: 'The story of J. Robert Oppenheimer.' },
    ]
  }
];

