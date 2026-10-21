'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Play, Plus, Film, ExternalLink, Ticket } from 'lucide-react';
import CastScroller from '@/components/CastScroller';
import ProviderList from '@/components/ProviderList';
import TrailerModal from '@/components/TrailerModal';
import Rail from '@/components/Rail';
import PageTransition from '@/components/PageTransition';
import { IMG_BASE } from '@/lib/tmdb';
import { PosterCardProps } from '@/components/PosterCard';
import { useCompareStore } from '@/store/compareStore';

interface DetailsResponse {
  details: {
    id: number;
    title: string;
    tagline: string | null;
    overview: string;
    year: string;
    runtime: string | null;
    genres: { id: number; name: string }[];
    certification: string | null;
    original_language: string;
    vote_average: number;
    vote_count: number;
    poster_path: string | null;
    backdrop_path: string | null;
    media_type: 'movie' | 'tv';
  };
  credits: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: {
      director: string | null;
      writer: string | null;
      producer: string | null;
      cinematographer: string | null;
      editor: string | null;
      musicDirector: string | null;
    };
  };
  trailer: { youtubeKey: string | null };
  providers: {
    flatrate: Array<{ provider_name: string; logo_path: string; display_priority: number }> | null;
    rent: Array<{ provider_name: string; logo_path: string; display_priority: number }> | null;
    buy: Array<{ provider_name: string; logo_path: string; display_priority: number }> | null;
  } | null;
  ratings: {
    tmdb: number;
    imdb: string | null;
    imdbVotes: string | null;
    rottenTomatoes: string | null;
    metacritic: string | null;
  };
  inTheatres: boolean;
  similar: PosterCardProps[];
}

export default function MovieDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [trailerOpen, setTrailerOpen] = useState(false);
  const addItem = useCompareStore((state) => state.addItem);

  const { data, isLoading, isError } = useQuery<DetailsResponse>({
    queryKey: ['details', 'movie', id],
    queryFn: async () => {
      const res = await fetch(`/api/details/movie/${id}`);
      if (!res.ok) throw new Error('Movie not found');
      return res.json();
    },
    staleTime: 86400 * 1000,
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="w-full pb-16 animate-pulse">
        {/* Backdrop Shimmer */}
        <div className="w-full h-[60vh] min-h-[500px] rounded-2xl surface shimmer mb-8" />

        {/* Ratings Strip Placeholder */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl surface shimmer" />
          ))}
        </div>

        {/* Body placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-4">
            <div className="h-24 rounded-xl surface shimmer" />
            <div className="h-36 rounded-xl surface shimmer" />
          </div>
          <div className="h-64 rounded-xl surface shimmer" />
        </div>
      </div>
    );
  }

  if (isError || !data?.details) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="glass surface p-8 max-w-md w-full flex flex-col items-center gap-4">
          <Film className="w-12 h-12 text-[#f5a524]" />
          <h2
            className="text-2xl font-bold text-[#f4f4f5]"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            Movie not found
          </h2>
          <p className="text-sm text-[#a1a1aa]">
            The movie you requested could not be loaded.
          </p>
          <Link
            href="/movies"
            className="mt-2 px-6 py-2.5 rounded-full bg-[#f5a524] text-[#07070b] font-semibold text-sm hover:bg-[#e0961f] transition-colors"
          >
            Back to Movies
          </Link>
        </div>
      </div>
    );
  }

  const { details, credits, trailer, providers, ratings, inTheatres, similar } = data;
  const backdropUrl = details.backdrop_path
    ? `${IMG_BASE}/w1280${details.backdrop_path}`
    : details.poster_path
    ? `${IMG_BASE}/w1280${details.poster_path}`
    : null;

  const posterUrl = details.poster_path
    ? `${IMG_BASE}/w500${details.poster_path}`
    : null;

  // Rotten Tomatoes color
  const rtScoreNum = ratings.rottenTomatoes
    ? parseInt(ratings.rottenTomatoes.replace('%', ''), 10)
    : null;
  const rtColor =
    rtScoreNum !== null ? (rtScoreNum >= 60 ? 'text-red-500' : 'text-green-500') : 'text-[#f4f4f5]';

  // Metacritic color
  const mcScoreNum = ratings.metacritic ? parseInt(ratings.metacritic, 10) : null;
  const mcBgColor =
    mcScoreNum !== null
      ? mcScoreNum >= 61
        ? 'bg-green-600'
        : mcScoreNum >= 40
        ? 'bg-yellow-600'
        : 'bg-red-600'
      : 'bg-zinc-700';

  const crewRoles = [
    { label: 'Director', name: credits.crew.director },
    { label: 'Writer', name: credits.crew.writer },
    { label: 'Producer', name: credits.crew.producer },
    { label: 'Cinematographer', name: credits.crew.cinematographer },
    { label: 'Editor', name: credits.crew.editor },
    { label: 'Music Director', name: credits.crew.musicDirector },
  ];

  return (
    <PageTransition className="w-full pb-16">
      {/* a. HEADER SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0 }}
        className="relative w-full h-[60vh] min-h-[500px] rounded-2xl overflow-hidden mb-8 bg-[#07070b] border border-white/10 shadow-2xl"
      >
        {/* Backdrop Image */}
        {backdropUrl && (
          <Image
            src={backdropUrl}
            alt={details.title}
            fill
            priority
            className="object-cover object-top opacity-40"
          />
        )}

        {/* Gradient Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-[#07070b]/60 to-transparent"
          aria-hidden="true"
        />

        {/* Header Content */}
        <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row gap-8 items-end z-10">
          {/* Left: Poster */}
          {posterUrl && (
            <div className="relative w-[180px] md:w-[200px] aspect-[2/3] shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/15 bg-black hidden sm:block">
              <Image
                src={posterUrl}
                alt={details.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Right: Info */}
          <div className="flex-1 flex flex-col">
            <h1
              className="text-4xl md:text-5xl font-bold text-[#f4f4f5] leading-tight tracking-tight drop-shadow-md"
              style={{ fontFamily: 'var(--font-display), serif' }}
            >
              {details.title}
            </h1>

            {details.tagline && (
              <p className="italic text-[#a1a1aa] text-lg mt-2 font-light">
                "{details.tagline}"
              </p>
            )}

            {/* Meta Line */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-[#a1a1aa] font-medium">
              {details.year && <span>{details.year}</span>}
              {details.runtime && (
                <>
                  <span>•</span>
                  <span>{details.runtime}</span>
                </>
              )}
              {details.certification && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded border border-white/20 text-xs">
                    {details.certification}
                  </span>
                </>
              )}
              {details.original_language && (
                <>
                  <span>•</span>
                  <span className="uppercase text-xs tracking-wider">
                    {details.original_language === 'ta' ? 'Tamil' : details.original_language === 'en' ? 'English' : details.original_language}
                  </span>
                </>
              )}
            </div>

            {/* Genre Chips */}
            {details.genres && details.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {details.genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-3 py-1 rounded-full text-xs font-medium glass border border-white/10 text-[#a1a1aa]"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* b. RATINGS STRIP */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {/* IMDb */}
        <div className="glass surface rounded-xl p-4 text-center flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] mb-1 font-semibold uppercase tracking-wider">
            <Star className="w-4 h-4 text-[#f5a524] fill-[#f5a524]" />
            <span>IMDb</span>
          </div>
          <span className="text-2xl font-bold text-[#f4f4f5]">
            {ratings.imdb || 'N/A'}
          </span>
          <span className="text-xs text-[#71717a] mt-0.5">
            {ratings.imdbVotes ? `${ratings.imdbVotes} votes` : 'No votes yet'}
          </span>
        </div>

        {/* Rotten Tomatoes */}
        <div className="glass surface rounded-xl p-4 text-center flex flex-col items-center justify-center">
          <span className="text-xs text-[#a1a1aa] mb-1 font-semibold uppercase tracking-wider">
            🍅 Rotten Tomatoes
          </span>
          <span className={`text-2xl font-bold ${rtColor}`}>
            {ratings.rottenTomatoes || 'N/A'}
          </span>
          <span className="text-xs text-[#71717a] mt-0.5">Tomatometer</span>
        </div>

        {/* Metacritic */}
        <div className="glass surface rounded-xl p-4 text-center flex flex-col items-center justify-center">
          <span className="text-xs text-[#a1a1aa] mb-1 font-semibold uppercase tracking-wider">
            Metacritic
          </span>
          {ratings.metacritic ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-sm ${mcBgColor}`}
              >
                {ratings.metacritic}
              </span>
              <span className="text-xs text-[#71717a]">/ 100</span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-[#f4f4f5]">N/A</span>
          )}
          <span className="text-xs text-[#71717a] mt-0.5">Metascore</span>
        </div>

        {/* TMDB */}
        <div className="glass surface rounded-xl p-4 text-center flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] mb-1 font-semibold uppercase tracking-wider">
            <div className="w-3.5 h-3.5 rounded-full bg-blue-500" />
            <span>TMDB</span>
          </div>
          <span className="text-2xl font-bold text-[#f4f4f5]">
            {ratings.tmdb > 0 ? ratings.tmdb.toFixed(1) : 'NR'}
          </span>
          <span className="text-xs text-[#71717a] mt-0.5">
            {details.vote_count.toLocaleString()} votes
          </span>
        </div>
      </motion.section>

      {/* c. ACTION ROW */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-wrap items-center gap-4 mb-8"
      >
        {/* Watch Trailer Button */}
        {trailer.youtubeKey ? (
          <button
            type="button"
            onClick={() => setTrailerOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#f5a524] hover:bg-[#e0961f] text-[#07070b] font-semibold text-sm transition-all shadow-[0_0_20px_rgba(245,165,36,0.25)] hover:shadow-[0_0_25px_rgba(245,165,36,0.4)]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Watch Trailer</span>
          </button>
        ) : (
          <button
            disabled
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-[#71717a] font-semibold text-sm cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            <span>No trailer available</span>
          </button>
        )}

        {/* + Compare Button */}
        <button
          type="button"
          onClick={() =>
            addItem({
              id: details.id,
              media_type: 'movie',
              title: details.title,
              poster_path: details.poster_path || '',
            })
          }
          className="flex items-center gap-2 px-6 py-3 rounded-full border border-[#f5a524] text-[#f5a524] hover:bg-[#f5a524]/10 transition-colors text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>+ Compare</span>
        </button>

        {/* In Theatres Badge & BookMyShow Link */}
        {inTheatres && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 font-medium text-sm">
              <span>🎬</span>
              <span>Now in Theatres</span>
            </span>

            <a
              href={`https://in.bookmyshow.com/search/movies/${encodeURIComponent(
                details.title
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass hover:bg-white/10 text-[#f4f4f5] text-sm font-medium transition-colors border border-white/15"
            >
              <Ticket className="w-4 h-4 text-[#f5a524]" />
              <span>Book on BookMyShow</span>
              <ExternalLink className="w-3 h-3 text-[#71717a]" />
            </a>
          </div>
        )}
      </motion.section>

      {/* d. TWO-COLUMN BODY */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 mb-12"
      >
        {/* Left Column (Wide) */}
        <div className="flex flex-col">
          {/* Synopsis */}
          <div className="mb-8">
            <h3
              className="text-2xl font-bold text-[#f4f4f5] mb-3"
              style={{ fontFamily: 'var(--font-display), serif' }}
            >
              Synopsis
            </h3>
            <p className="text-base text-[#a1a1aa] leading-relaxed">
              {details.overview || 'No synopsis available for this title.'}
            </p>
          </div>

          {/* Cast Scroller */}
          <div className="mb-8">
            <h3
              className="text-2xl font-bold text-[#f4f4f5] mb-4"
              style={{ fontFamily: 'var(--font-display), serif' }}
            >
              Cast
            </h3>
            <CastScroller cast={credits.cast} />
          </div>

          {/* Crew Grid */}
          <div className="mb-8">
            <h3
              className="text-2xl font-bold text-[#f4f4f5] mb-4"
              style={{ fontFamily: 'var(--font-display), serif' }}
            >
              Crew
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {crewRoles.map((role) => (
                <div
                  key={role.label}
                  className="glass surface rounded-xl p-4 flex flex-col"
                >
                  <span className="text-xs text-[#71717a] font-semibold uppercase tracking-wider">
                    {role.label}
                  </span>
                  <span
                    className={`text-base font-medium mt-1 truncate ${
                      role.name ? 'text-[#f4f4f5]' : 'text-[#71717a]'
                    }`}
                    title={role.name || 'Unknown'}
                  >
                    {role.name || 'Unknown'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Narrow, Sticky) */}
        <div className="lg:sticky lg:top-[100px] self-start flex flex-col gap-6">
          <div>
            <h3
              className="text-xl font-bold text-[#f4f4f5] mb-4"
              style={{ fontFamily: 'var(--font-display), serif' }}
            >
              Where to Watch
            </h3>
            <ProviderList providers={providers} />
          </div>

          {/* In Theatres Banner in Right Column */}
          {inTheatres && (
            <div className="glass surface rounded-xl p-5 border border-green-500/30 flex flex-col gap-3">
              <span className="text-sm font-semibold text-green-400 flex items-center gap-2">
                <span>🎟️</span>
                <span>Now Playing in Theatres</span>
              </span>
              <p className="text-xs text-[#a1a1aa]">
                Catch this film on the big screen near you across Indian theatres.
              </p>
              <a
                href={`https://in.bookmyshow.com/search/movies/${encodeURIComponent(
                  details.title
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 w-full text-center px-4 py-2.5 rounded-full bg-green-500 text-black font-bold text-xs hover:bg-green-400 transition-colors"
              >
                Book on BookMyShow
              </a>
            </div>
          )}
        </div>
      </motion.section>

      {/* e. MORE LIKE THIS */}
      {similar.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <Rail title="More Like This" items={similar} />
        </motion.section>
      )}

      {/* Trailer Modal */}
      <TrailerModal
        youtubeKey={trailer.youtubeKey}
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
      />
    </PageTransition>
  );
}
