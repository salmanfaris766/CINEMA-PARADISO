import { NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import { TMDBGenre } from '@/lib/types';

interface GenreListResponse {
  genres: TMDBGenre[];
}

export async function GET() {
  try {
    const [movieRes, tvRes] = await Promise.all([
      tmdbFetch<GenreListResponse>('/genre/movie/list', { language: 'en-US' }).catch(() => ({ genres: [] })),
      tmdbFetch<GenreListResponse>('/genre/tv/list', { language: 'en-US' }).catch(() => ({ genres: [] })),
    ]);

    return NextResponse.json({
      movie: movieRes.genres || [],
      tv: tvRes.genres || [],
    });
  } catch (error) {
    console.error('Failed to fetch genres:', error);
    return NextResponse.json({ movie: [], tv: [] });
  }
}
