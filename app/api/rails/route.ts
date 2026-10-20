import { NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import { RailData, RailItem, TMDBPaginatedResponse } from '@/lib/types';

interface RawTMDBItem {
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
  media_type?: string;
}

function mapRailItems(
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

      return {
        id: item.id,
        media_type,
        title: item.title || item.name || 'Untitled',
        year,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path || null,
        vote_average: Number((item.vote_average || 0).toFixed(1)),
        genre_ids: item.genre_ids || [],
        overview: item.overview || '',
      };
    });
}

// Fallback rail data in case TMDB is temporarily unreachable
const FALLBACK_RAILS: RailData[] = [
  {
    title: 'Trending This Week',
    items: [
      { id: 157336, media_type: 'movie', title: 'Interstellar', year: '2014', poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg', vote_average: 8.4, genre_ids: [12, 18, 878], overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole.' },
      { id: 27205, media_type: 'movie', title: 'Inception', year: '2010', poster_path: '/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg', backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg', vote_average: 8.4, genre_ids: [28, 878, 12], overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets.' },
      { id: 155, media_type: 'movie', title: 'The Dark Knight', year: '2008', poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', backdrop_path: '/dqK9Hag1054tghRQSqLSfrkvQnA.jpg', vote_average: 8.5, genre_ids: [18, 28, 80], overview: 'Batman raises the stakes in his war on crime.' },
      { id: 872585, media_type: 'movie', title: 'Oppenheimer', year: '2023', poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', backdrop_path: '/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg', vote_average: 8.1, genre_ids: [18, 36], overview: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb.' },
      { id: 693134, media_type: 'movie', title: 'Dune: Part Two', year: '2024', poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s520b8q.jpg', vote_average: 8.2, genre_ids: [878, 12], overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen.' }
    ]
  }
];

export async function GET() {
  try {
    const fetchRail = async (
      title: string,
      endpoint: string,
      params: Record<string, string>,
      defaultMediaType: 'movie' | 'tv' = 'movie'
    ): Promise<RailData> => {
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
    };

    const [
      trending,
      mysteryThriller,
      tamilBlockbusters,
      hollywoodMustWatch,
      nowInTheatres,
      bingeSeries,
      hiddenGems,
    ] = await Promise.all([
      fetchRail('Trending This Week', '/trending/movie/week', { language: 'en-US' }, 'movie'),
      fetchRail(
        'Top Rated Mystery & Thriller',
        '/discover/movie',
        {
          with_genres: '9648,53',
          sort_by: 'vote_average.desc',
          'vote_count.gte': '100',
          language: 'en-US',
        },
        'movie'
      ),
      fetchRail(
        'Tamil Blockbusters',
        '/discover/movie',
        {
          with_original_language: 'ta',
          sort_by: 'popularity.desc',
          'vote_count.gte': '100',
        },
        'movie'
      ),
      fetchRail(
        'Hollywood Must-Watch',
        '/discover/movie',
        {
          with_original_language: 'en',
          sort_by: 'vote_average.desc',
          'vote_count.gte': '500',
          language: 'en-US',
        },
        'movie'
      ),
      fetchRail(
        'Now in Theatres',
        '/movie/now_playing',
        {
          region: 'IN',
          language: 'en-US',
        },
        'movie'
      ),
      fetchRail('Binge-worthy Series', '/trending/tv/week', { language: 'en-US' }, 'tv'),
      fetchRail(
        'Hidden Gems',
        '/discover/movie',
        {
          sort_by: 'vote_average.desc',
          'vote_count.gte': '100',
          'vote_count.lte': '1000',
          language: 'en-US',
        },
        'movie'
      ),
    ]);

    const rails: RailData[] = [
      trending,
      mysteryThriller,
      tamilBlockbusters,
      hollywoodMustWatch,
      nowInTheatres,
      bingeSeries,
      hiddenGems,
    ];

    // If all rails returned empty (e.g. offline/network blocked), fallback to preserve user experience
    const totalItems = rails.reduce((acc, r) => acc + r.items.length, 0);
    if (totalItems === 0) {
      return NextResponse.json({ rails: FALLBACK_RAILS });
    }

    return NextResponse.json({ rails });
  } catch (error) {
    console.error('Error in /api/rails:', error);
    return NextResponse.json({ rails: FALLBACK_RAILS });
  }
}
