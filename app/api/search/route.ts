import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';

interface SearchItem {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  vote_average?: number;
  popularity?: number;
}

interface SearchResponse {
  page: number;
  results: SearchItem[];
  total_pages: number;
  total_results: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const [multiData, movieData] = await Promise.all([
      tmdbFetch<SearchResponse>('/search/multi', {
        query: q.trim(),
        include_adult: 'false',
        language: 'en-US',
        page: '1',
      }).catch(() => ({ results: [] as SearchItem[] } as SearchResponse)),
      tmdbFetch<SearchResponse>('/search/movie', {
        query: q.trim(),
        include_adult: 'false',
        language: 'en-US',
        page: '1',
      }).catch(() => ({ results: [] as SearchItem[] } as SearchResponse)),
    ]);

    const combined: SearchItem[] = [
      ...(multiData.results || []),
      ...(movieData.results || []).map((m) => ({ ...m, media_type: 'movie' })),
    ];

    const seen = new Set<string>();
    const results = combined
      .filter((item) => {
        const type = item.media_type || 'movie';
        const key = `${type}-${item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return (
          (type === 'movie' || type === 'tv') &&
          item.poster_path !== null &&
          item.poster_path !== undefined
        );
      })
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        media_type: item.media_type as 'movie' | 'tv',
        title: item.media_type === 'tv' ? item.name || '' : item.title || '',
        year: (item.release_date || item.first_air_date || '').slice(0, 4),
        poster_path: item.poster_path as string,
        vote_average: item.vote_average || 0,
      }));

    return NextResponse.json(
      { results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ results: [] });
  }
}
