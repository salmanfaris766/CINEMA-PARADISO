import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';

interface RawDiscoverItem {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  genre_ids?: number[];
  overview?: string;
}

interface TMDBDiscoverResponse {
  page: number;
  results: RawDiscoverItem[];
  total_pages: number;
  total_results: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const mediaType = (searchParams.get('media_type') || 'movie') as 'movie' | 'tv';
    const genres = searchParams.get('genres');
    const yearFrom = searchParams.get('year_from');
    const yearTo = searchParams.get('year_to');
    const minRating = searchParams.get('min_rating');
    const language = searchParams.get('language') || 'both';
    let sortBy = searchParams.get('sort_by') || 'popularity.desc';
    const page = searchParams.get('page') || '1';

    // Map release_date.desc for TV if needed
    if (mediaType === 'tv' && sortBy.startsWith('release_date')) {
      sortBy = sortBy.replace('release_date', 'first_air_date');
    }

    const params: Record<string, string> = {
      language: 'en-US',
      'vote_count.gte': '100', // Non-negotiable quality gate
      sort_by: sortBy,
      page,
    };

    if (genres && genres.trim()) {
      params['with_genres'] = genres.trim();
    }

    if (language === 'en') {
      params['with_original_language'] = 'en';
    } else if (language === 'ta') {
      params['with_original_language'] = 'ta';
    }

    if (mediaType === 'movie') {
      if (yearFrom) params['primary_release_date.gte'] = `${yearFrom}-01-01`;
      if (yearTo) params['primary_release_date.lte'] = `${yearTo}-12-31`;
    } else {
      if (yearFrom) params['first_air_date.gte'] = `${yearFrom}-01-01`;
      if (yearTo) params['first_air_date.lte'] = `${yearTo}-12-31`;
    }

    if (minRating && Number(minRating) > 0) {
      params['vote_average.gte'] = minRating;
    }

    const data = await tmdbFetch<TMDBDiscoverResponse>(`/discover/${mediaType}`, params);

    const items = (data.results || [])
      .filter((item): item is RawDiscoverItem & { poster_path: string } => Boolean(item.poster_path))
      .map((item) => {
        const dateStr = item.release_date || item.first_air_date || '';
        return {
          id: item.id,
          media_type: mediaType,
          title: item.title || item.name || 'Untitled',
          year: dateStr ? dateStr.substring(0, 4) : '',
          poster_path: item.poster_path,
          vote_average: Number((item.vote_average || 0).toFixed(1)),
          genre_ids: item.genre_ids || [],
        };
      });

    return NextResponse.json({
      total_results: data.total_results || 0,
      total_pages: data.total_pages || 0,
      page: Number(page),
      items,
    });
  } catch (error) {
    console.error('Error in /api/discover:', error);
    return NextResponse.json(
      { total_results: 0, total_pages: 0, page: 1, items: [] },
      { status: 500 }
    );
  }
}
