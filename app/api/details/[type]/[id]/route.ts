import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import { getOmdbRatings } from '@/lib/omdb';

interface RawDetails {
  id: number;
  title?: string;
  name?: string;
  tagline?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  number_of_seasons?: number;
  episode_run_time?: number[];
  genres?: { id: number; name: string }[];
  original_language?: string;
  vote_average?: number;
  vote_count?: number;
  poster_path?: string | null;
  backdrop_path?: string | null;
  external_ids?: { imdb_id?: string | null };
  release_dates?: {
    results?: Array<{
      iso_3166_1: string;
      release_dates: Array<{ certification: string }>;
    }>;
  };
  content_ratings?: {
    results?: Array<{
      iso_3166_1: string;
      rating: string;
    }>;
  };
}

interface RawCredits {
  cast?: Array<{
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }>;
  crew?: Array<{
    id: number;
    name: string;
    job: string;
    department: string;
  }>;
}

interface RawVideos {
  results?: Array<{
    id: string;
    key: string;
    site: string;
    type: string;
  }>;
}

interface RawWatchProviders {
  results?: Record<
    string,
    {
      link?: string;
      flatrate?: Array<{ provider_name: string; logo_path: string; display_priority: number }>;
      rent?: Array<{ provider_name: string; logo_path: string; display_priority: number }>;
      buy?: Array<{ provider_name: string; logo_path: string; display_priority: number }>;
    }
  >;
}

interface RawSimilar {
  results?: Array<{
    id: number;
    title?: string;
    name?: string;
    release_date?: string;
    first_air_date?: string;
    poster_path: string | null;
    vote_average: number;
  }>;
}

interface RawNowPlaying {
  results?: Array<{ id: number }>;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> | { type: string; id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const { type, id } = resolvedParams;

    if (type !== 'movie' && type !== 'tv') {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    const appendParams =
      type === 'movie'
        ? 'external_ids,release_dates'
        : 'external_ids,content_ratings';

    // Parallel calls
    const [mainDetails, credits, videos, providers, similar, nowPlaying] = await Promise.all([
      tmdbFetch<RawDetails>(`/${type}/${id}`, {
        language: 'en-US',
        append_to_response: appendParams,
      }),
      tmdbFetch<RawCredits>(`/${type}/${id}/credits`, { language: 'en-US' }).catch(() => ({
        cast: [],
        crew: [],
      })),
      tmdbFetch<RawVideos>(`/${type}/${id}/videos`, { language: 'en-US' }).catch(() => ({
        results: [],
      })),
      tmdbFetch<RawWatchProviders>(`/${type}/${id}/watch/providers`).catch(() => ({
        results: undefined,
      })),
      tmdbFetch<RawSimilar>(`/${type}/${id}/similar`, { language: 'en-US', page: '1' }).catch(
        () => ({ results: [] })
      ),
      type === 'movie'
        ? tmdbFetch<RawNowPlaying>('/movie/now_playing', {
            region: 'IN',
            language: 'en-US',
            page: '1',
          }).catch(() => ({ results: [] }))
        : Promise.resolve({ results: [] }),
    ]);

    // OMDb Ratings lookup by imdb_id
    const imdbId = mainDetails.external_ids?.imdb_id;
    const omdbRatings = await getOmdbRatings(imdbId);

    // Crew extraction
    const crewList = credits.crew || [];
    const findCrew = (...jobs: string[]) => {
      const match = crewList.find((c) => jobs.includes(c.job));
      return match ? match.name : null;
    };

    const crew = {
      director: findCrew('Director'),
      writer: findCrew('Screenplay', 'Writer', 'Story'),
      producer: findCrew('Producer'),
      cinematographer: findCrew('Director of Photography'),
      editor: findCrew('Editor'),
      musicDirector: findCrew('Original Music Composer', 'Music', 'Original Score'),
    };

    // Cast extraction (top 20)
    const cast = (credits.cast || [])
      .slice(0, 20)
      .map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_path: c.profile_path,
      }));

    // Trailer extraction
    const videoList = videos.results || [];
    let trailer = videoList.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer'
    );
    if (!trailer) {
      trailer = videoList.find((v) => v.site === 'YouTube' && v.type === 'Teaser');
    }
    const youtubeKey = trailer ? trailer.key : null;

    // Watch providers in India
    const inProviders = providers.results?.['IN'];
    const parsedProviders = inProviders
      ? {
          flatrate: inProviders.flatrate || null,
          rent: inProviders.rent || null,
          buy: inProviders.buy || null,
        }
      : null;

    // Check theatre status
    const numId = Number(id);
    const inTheatres =
      type === 'movie' &&
      Array.isArray(nowPlaying.results) &&
      nowPlaying.results.some((m) => m.id === numId);

    // Certification
    let certification: string | null = null;
    if (type === 'movie' && mainDetails.release_dates?.results) {
      const inRelease = mainDetails.release_dates.results.find((r) => r.iso_3166_1 === 'IN');
      const usRelease = mainDetails.release_dates.results.find((r) => r.iso_3166_1 === 'US');
      const chosen = inRelease || usRelease || mainDetails.release_dates.results[0];
      const cert = chosen?.release_dates.find((d) => Boolean(d.certification))?.certification;
      if (cert) certification = cert;
    } else if (type === 'tv' && mainDetails.content_ratings?.results) {
      const inRating = mainDetails.content_ratings.results.find((r) => r.iso_3166_1 === 'IN');
      const usRating = mainDetails.content_ratings.results.find((r) => r.iso_3166_1 === 'US');
      const chosen = inRating || usRating || mainDetails.content_ratings.results[0];
      if (chosen?.rating) certification = chosen.rating;
    }

    // Format Runtime / Seasons
    let formattedRuntime: string | null = null;
    if (type === 'movie' && mainDetails.runtime) {
      const hours = Math.floor(mainDetails.runtime / 60);
      const mins = mainDetails.runtime % 60;
      formattedRuntime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    } else if (type === 'tv') {
      const seasons = mainDetails.number_of_seasons || 1;
      const epRuntime =
        mainDetails.episode_run_time && mainDetails.episode_run_time.length > 0
          ? `${mainDetails.episode_run_time[0]}m/ep`
          : null;
      formattedRuntime = epRuntime
        ? `${seasons} ${seasons === 1 ? 'Season' : 'Seasons'} • ${epRuntime}`
        : `${seasons} ${seasons === 1 ? 'Season' : 'Seasons'}`;
    }

    const title = mainDetails.title || mainDetails.name || 'Untitled';
    const dateStr = mainDetails.release_date || mainDetails.first_air_date || '';
    const year = dateStr ? dateStr.substring(0, 4) : '';

    // Similar items (filter null posters, top 10)
    const similarItems = (similar.results || [])
      .filter((m) => Boolean(m.poster_path))
      .slice(0, 10)
      .map((m) => {
        const dStr = m.release_date || m.first_air_date || '';
        return {
          id: m.id,
          media_type: type as 'movie' | 'tv',
          title: m.title || m.name || 'Untitled',
          year: dStr ? dStr.substring(0, 4) : '',
          poster_path: m.poster_path!,
          vote_average: Number((m.vote_average || 0).toFixed(1)),
        };
      });

    return NextResponse.json({
      details: {
        id: mainDetails.id,
        title,
        tagline: mainDetails.tagline || null,
        overview: mainDetails.overview || '',
        year,
        runtime: formattedRuntime,
        genres: mainDetails.genres || [],
        certification,
        original_language: mainDetails.original_language || 'en',
        vote_average: Number((mainDetails.vote_average || 0).toFixed(1)),
        vote_count: mainDetails.vote_count || 0,
        poster_path: mainDetails.poster_path,
        backdrop_path: mainDetails.backdrop_path,
        media_type: type,
      },
      credits: {
        cast,
        crew,
      },
      trailer: {
        youtubeKey,
      },
      providers: parsedProviders,
      ratings: {
        tmdb: Number((mainDetails.vote_average || 0).toFixed(1)),
        imdb: omdbRatings.imdbRating,
        imdbVotes: omdbRatings.imdbVotes,
        rottenTomatoes: omdbRatings.rottenTomatoes,
        metacritic: omdbRatings.metacritic,
      },
      inTheatres,
      similar: similarItems,
    });
  } catch (error) {
    console.error('Error fetching details:', error);
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}
