import { NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';

interface RawMovie {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  popularity?: number;
  overview?: string;
  original_language?: string;
}

interface TMDBMovieResponse {
  results: RawMovie[];
  page: number;
  total_pages: number;
  total_results: number;
}

export interface UpcomingMovieItem {
  id: number;
  media_type: 'movie';
  title: string;
  year: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  overview: string;
  original_language: string;
}

export async function GET() {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const future60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const future60Str = future60.toISOString().split('T')[0];

    // Fetch Hollywood and Tamil upcoming in parallel
    const [hollywoodData, tamilData] = await Promise.all([
      tmdbFetch<TMDBMovieResponse>(
        '/movie/upcoming',
        {
          region: 'US',
          language: 'en-US',
          page: '1',
        },
        { revalidate: 3600 }
      ).catch(() => ({ results: [] as RawMovie[] } as TMDBMovieResponse)),

      tmdbFetch<TMDBMovieResponse>(
        '/discover/movie',
        {
          with_original_language: 'ta',
          'primary_release_date.gte': todayStr,
          'primary_release_date.lte': future60Str,
          sort_by: 'popularity.desc',
          page: '1',
        },
        { revalidate: 3600 }
      ).catch(() => ({ results: [] as RawMovie[] } as TMDBMovieResponse)),
    ]);

    const processList = (
      items: RawMovie[],
      defaultLang: string,
      popularityThreshold = 10
    ): UpcomingMovieItem[] => {
      let filtered = (items || []).filter((m) => {
        if (!m.poster_path || !m.release_date) return false;
        // Must be in next 60 days
        const isUpcoming = m.release_date >= todayStr && m.release_date <= future60Str;
        return isUpcoming && (m.popularity || 0) >= popularityThreshold;
      });

      // Graceful fallback for popularity threshold if list is small
      if (filtered.length < 5) {
        filtered = (items || []).filter((m) => {
          if (!m.poster_path || !m.release_date) return false;
          return m.release_date >= todayStr && m.release_date <= future60Str;
        });
      }

      return filtered
        .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))
        .slice(0, 15)
        .map((m) => ({
          id: m.id,
          media_type: 'movie' as const,
          title: m.title || 'Untitled',
          year: (m.release_date || '').slice(0, 4),
          poster_path: m.poster_path as string,
          vote_average: Number((m.vote_average || 0).toFixed(1)),
          release_date: m.release_date || '',
          overview: m.overview || '',
          original_language: m.original_language || defaultLang,
        }));
    };

    const hollywood = processList(hollywoodData.results, 'en', 10);
    const tamil = processList(tamilData.results, 'ta', 2);

    return NextResponse.json(
      { hollywood, tamil },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error in /api/upcoming:', error);
    return NextResponse.json({ hollywood: [], tamil: [] }, { status: 500 });
  }
}

