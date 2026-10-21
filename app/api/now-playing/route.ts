import { NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';

interface NowPlayingMovie {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
  vote_average?: number;
}

interface NowPlayingResponse {
  results: NowPlayingMovie[];
  page: number;
  total_pages: number;
  total_results: number;
}

export async function GET() {
  try {
    const data = await tmdbFetch<NowPlayingResponse>('/movie/now_playing', {
      region: 'IN',
      language: 'en-US',
      page: '1',
    });

    const results = (data.results || [])
      .filter((movie) => Boolean(movie.poster_path))
      .map((movie) => ({
        id: movie.id,
        media_type: 'movie' as const,
        title: movie.title,
        year: (movie.release_date || '').slice(0, 4),
        poster_path: movie.poster_path as string,
        vote_average: movie.vote_average || 0,
        release_date: movie.release_date || '',
      }));

    return NextResponse.json(
      { results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    console.error('Now Playing API error:', error);
    return NextResponse.json({ results: [] });
  }
}
