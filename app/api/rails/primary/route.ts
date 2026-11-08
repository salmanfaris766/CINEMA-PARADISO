import { NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import { fetchRail, mapRailItems, FALLBACK_PRIMARY_RAILS, RawTMDBItem } from '@/lib/rails-helpers';
import { TMDBPaginatedResponse } from '@/lib/types';

/**
 * PRIMARY rails — the first 4 rails shown above the fold.
 * Revalidates every 300s (5 min) so trending stays fresh.
 */
export const revalidate = 300;

export async function GET() {
  try {
    const today = new Date();
    const in60Days = new Date(today);
    in60Days.setDate(today.getDate() + 60);
    const todayStr = today.toISOString().split('T')[0];
    const in60DaysStr = in60Days.toISOString().split('T')[0];

    const [trending, comingSoon, mysteryThriller, tamilBlockbusters] = await Promise.all([
      fetchRail('Trending This Week', '/trending/movie/week', { language: 'en-US' }, 'movie'),

      // Coming Soon — merged Hollywood + Tamil upcoming
      (async () => {
        try {
          const [us, inResult] = await Promise.all([
            tmdbFetch<TMDBPaginatedResponse<RawTMDBItem>>('/movie/upcoming', { region: 'US', language: 'en-US' }),
            tmdbFetch<TMDBPaginatedResponse<RawTMDBItem>>('/discover/movie', {
              with_original_language: 'ta',
              'primary_release_date.gte': todayStr,
              'primary_release_date.lte': in60DaysStr,
              sort_by: 'popularity.desc',
            }),
          ]);
          const all = [...(us.results || []), ...(inResult.results || [])]
            .filter((i) => i.poster_path && i.release_date && i.release_date >= todayStr && i.release_date <= in60DaysStr)
            .sort((a, b) => (a.release_date || '').localeCompare(b.release_date || ''))
            .slice(0, 20);
          const seen = new Set<number>();
          const unique = all.filter((i) => { if (seen.has(i.id)) return false; seen.add(i.id); return true; });
          return {
            title: 'Coming Soon',
            items: mapRailItems(unique, 'movie').map((item, idx) => ({ ...item, release_date: unique[idx]?.release_date })),
          };
        } catch (err) {
          console.error('Coming Soon rail error:', err);
          return { title: 'Coming Soon', items: [] };
        }
      })(),

      fetchRail('Top Rated Mystery & Thriller', '/discover/movie', {
        with_genres: '9648,53',
        sort_by: 'vote_average.desc',
        'vote_count.gte': '100',
        language: 'en-US',
      }, 'movie'),

      fetchRail('Tamil Blockbusters', '/discover/movie', {
        with_original_language: 'ta',
        sort_by: 'popularity.desc',
        'vote_count.gte': '100',
      }, 'movie'),
    ]);

    const rails = [trending, comingSoon, mysteryThriller, tamilBlockbusters];
    const totalItems = rails.reduce((acc, r) => acc + r.items.length, 0);

    if (totalItems === 0) {
      return NextResponse.json({ rails: FALLBACK_PRIMARY_RAILS }, {
        headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
      });
    }

    return NextResponse.json({ rails }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    });
  } catch (error) {
    console.error('Error in /api/rails/primary:', error);
    return NextResponse.json({ rails: FALLBACK_PRIMARY_RAILS });
  }
}
