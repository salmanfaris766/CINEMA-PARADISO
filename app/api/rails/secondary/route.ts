import { NextResponse } from 'next/server';
import { fetchRail, fetchCuratedRail } from '@/lib/rails-helpers';
import { RAJINI_CLASSICS_IDS, KAMAL_CLASSICS_IDS } from '@/lib/tmdb-curated';

/**
 * SECONDARY rails — the remaining rails loaded lazily after first paint.
 * Revalidates every 3600s (1 hour). Less time-sensitive than trending.
 */
export const revalidate = 3600;

export async function GET() {
  try {
    const [
      hollywoodMustWatch,
      nowInTheatres,
      bingeSeries,
      hiddenGems,
      rajiniClassics,
      kamalClassics,
      tamilHits2000s,
      tamilGoldenEra,
      netflixOriginals,
      primeVideoHits,
      allTimeSitcoms,
    ] = await Promise.all([
      fetchRail('Hollywood Must-Watch', '/discover/movie', {
        with_original_language: 'en',
        sort_by: 'vote_average.desc',
        'vote_count.gte': '500',
        language: 'en-US',
      }, 'movie'),

      fetchRail('Now in Theatres', '/movie/now_playing', {
        region: 'IN',
        language: 'en-US',
      }, 'movie'),

      fetchRail('Binge-worthy Series', '/trending/tv/week', { language: 'en-US' }, 'tv'),

      fetchRail('Hidden Gems', '/discover/movie', {
        sort_by: 'vote_average.desc',
        'vote_count.gte': '100',
        'vote_count.lte': '1000',
        language: 'en-US',
      }, 'movie'),

      fetchCuratedRail('Rajinikanth Classics', RAJINI_CLASSICS_IDS, 'movie'),
      fetchCuratedRail('Kamal Haasan Essentials', KAMAL_CLASSICS_IDS, 'movie'),

      fetchRail('Tamil Hits 2000s-2020s', '/discover/movie', {
        with_original_language: 'ta',
        sort_by: 'popularity.desc',
        'vote_count.gte': '20',
        'primary_release_date.gte': '2000-01-01',
        language: 'en-US',
      }, 'movie'),

      fetchRail('Tamil Golden Era', '/discover/movie', {
        with_original_language: 'ta',
        sort_by: 'vote_average.desc',
        'vote_count.gte': '10',
        'primary_release_date.gte': '1980-01-01',
        'primary_release_date.lte': '1999-12-31',
        language: 'en-US',
      }, 'movie'),

      fetchRail('Netflix Originals', '/discover/tv', {
        with_networks: '213',
        sort_by: 'popularity.desc',
        'vote_count.gte': '100',
        language: 'en-US',
      }, 'tv'),

      fetchRail('Prime Video Hits', '/discover/tv', {
        with_networks: '1024',
        sort_by: 'popularity.desc',
        'vote_count.gte': '100',
        language: 'en-US',
      }, 'tv'),

      fetchRail('All-Time Sitcoms', '/discover/tv', {
        with_genres: '35',
        with_original_language: 'en',
        sort_by: 'vote_average.desc',
        'vote_count.gte': '500',
        language: 'en-US',
      }, 'tv'),
    ]);

    const rails = [
      hollywoodMustWatch,
      nowInTheatres,
      bingeSeries,
      hiddenGems,
      rajiniClassics,
      kamalClassics,
      tamilHits2000s,
      tamilGoldenEra,
      netflixOriginals,
      primeVideoHits,
      allTimeSitcoms,
    ];

    return NextResponse.json({ rails }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('Error in /api/rails/secondary:', error);
    return NextResponse.json({ rails: [] });
  }
}

