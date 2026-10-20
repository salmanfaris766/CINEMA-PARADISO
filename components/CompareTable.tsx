'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Check, X } from 'lucide-react';
import { IMG_BASE } from '@/lib/tmdb';

export interface CompareTableItem {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  year: string;
  poster_path: string;
  details: {
    id: number;
    title: string;
    tagline?: string | null;
    overview?: string;
    year?: string;
    runtime?: string | null;
    genres?: { id: number; name: string }[];
    certification?: string | null;
    original_language?: string;
    vote_average?: number;
    vote_count?: number;
    poster_path?: string | null;
    backdrop_path?: string | null;
    media_type?: 'movie' | 'tv';
  };
  credits: {
    cast: Array<{ id: number; name: string; character: string; profile_path: string | null }>;
    crew: {
      director: string | null;
      writer: string | null;
      producer: string | null;
      cinematographer: string | null;
      editor: string | null;
      musicDirector: string | null;
    };
  };
  ratings: {
    tmdb: number;
    imdb: string | null;
    imdbVotes: string | null;
    rottenTomatoes: string | null;
    metacritic: string | null;
  };
  providers: {
    flatrate: Array<{ provider_name: string; logo_path: string; display_priority: number }> | null;
    rent: Array<{ provider_name: string; logo_path: string; display_priority: number }> | null;
    buy: Array<{ provider_name: string; logo_path: string; display_priority: number }> | null;
  } | null;
  inTheatres: boolean;
}

interface CompareTableProps {
  data: CompareTableItem[];
}

export default function CompareTable({ data }: CompareTableProps) {
  if (!data || data.length === 0) return null;

  // Rating max calculations for amber highlight
  const imdbValues = data.map((d) => {
    const val = parseFloat(d.ratings?.imdb || '');
    return isNaN(val) ? null : val;
  });
  const maxImdb = Math.max(...imdbValues.filter((v): v is number => v !== null), 0);

  const rtValues = data.map((d) => {
    if (!d.ratings?.rottenTomatoes) return null;
    const val = parseInt(d.ratings.rottenTomatoes.replace('%', ''), 10);
    return isNaN(val) ? null : val;
  });
  const maxRt = Math.max(...rtValues.filter((v): v is number => v !== null), 0);

  const metaValues = data.map((d) => {
    if (!d.ratings?.metacritic) return null;
    const val = parseInt(d.ratings.metacritic, 10);
    return isNaN(val) ? null : val;
  });
  const maxMeta = Math.max(...metaValues.filter((v): v is number => v !== null), 0);

  const tmdbValues = data.map((d) => {
    const val = d.ratings?.tmdb;
    return typeof val === 'number' && val > 0 ? val : null;
  });
  const maxTmdb = Math.max(...tmdbValues.filter((v): v is number => v !== null), 0);

  return (
    <div className="w-full overflow-x-auto rounded-2xl glass border border-white/10 shadow-2xl">
      <div
        className="grid min-w-[760px]"
        style={{
          gridTemplateColumns: `160px repeat(${data.length}, minmax(180px, 1fr))`,
        }}
      >
        {/* ROW: Headers */}
        <div className="sticky left-0 bg-[#07070b] z-20 p-4 border-b border-r border-white/10 flex items-center justify-center font-display text-muted text-xs uppercase tracking-wider">
          Criteria
        </div>
        {data.map((item) => {
          const posterUrl = item.poster_path
            ? `${IMG_BASE}/w300${item.poster_path}`
            : '/placeholder-poster.png';

          return (
            <div
              key={item.id}
              className="p-6 text-center border-b border-r border-white/10 last:border-r-0 flex flex-col items-center justify-between"
            >
              <Link
                href={`/${item.media_type}/${item.id}`}
                className="group flex flex-col items-center"
              >
                <div className="relative w-[120px] aspect-[2/3] rounded-xl overflow-hidden shadow-xl border border-white/15 bg-black transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src={posterUrl}
                    alt={item.title}
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
                <h3
                  className="mt-3 text-lg font-bold text-[#f4f4f5] group-hover:text-[#f5a524] transition-colors line-clamp-2"
                  style={{ fontFamily: 'var(--font-display), serif' }}
                >
                  {item.title}
                </h3>
                <span className="text-sm text-[#a1a1aa] mt-0.5">
                  {item.year || item.details?.year || '—'}
                </span>
              </Link>
            </div>
          );
        })}

        {/* ROW: IMDb */}
        <div className="sticky left-0 bg-[#07070b] z-10 py-4 px-3 text-sm text-[#71717a] font-medium uppercase tracking-wider flex items-center border-b border-r border-white/10">
          IMDb
        </div>
        {data.map((item, idx) => {
          const val = imdbValues[idx];
          const isHighest = val !== null && val > 0 && val === maxImdb;
          return (
            <div
              key={item.id}
              className="py-4 px-3 text-sm text-[#f4f4f5] flex items-center justify-center text-center border-b border-r border-white/5 last:border-r-0"
            >
              {item.ratings?.imdb ? (
                <div
                  className={`px-3 py-1.5 flex flex-col items-center ${
                    isHighest ? 'bg-[#f5a524]/10 text-[#f5a524] rounded-lg' : ''
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-base">
                    <Star className="w-3.5 h-3.5 fill-current text-[#f5a524]" />
                    <span>{item.ratings.imdb}</span>
                  </div>
                  {item.ratings.imdbVotes && (
                    <span className="text-[11px] text-[#71717a]">
                      {item.ratings.imdbVotes} votes
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[#71717a]">—</span>
              )}
            </div>
          );
        })}

        {/* ROW: Rotten Tomatoes */}
        <div className="sticky left-0 bg-[#07070b] z-10 py-4 px-3 text-sm text-[#71717a] font-medium uppercase tracking-wider flex items-center border-b border-r border-white/10">
          Rotten Tomatoes
        </div>
        {data.map((item, idx) => {
          const val = rtValues[idx];
          const isHighest = val !== null && val > 0 && val === maxRt;
          return (
            <div
              key={item.id}
              className="py-4 px-3 text-sm text-[#f4f4f5] flex items-center justify-center text-center border-b border-r border-white/5 last:border-r-0"
            >
              {item.ratings?.rottenTomatoes ? (
                <div
                  className={`px-3 py-1.5 flex items-center gap-1.5 font-bold text-base ${
                    isHighest ? 'bg-[#f5a524]/10 text-[#f5a524] rounded-lg' : ''
                  }`}
                >
                  <span>🍅</span>
                  <span>{item.ratings.rottenTomatoes}</span>
                </div>
              ) : (
                <span className="text-[#71717a]">—</span>
              )}
            </div>
          );
        })}

        {/* ROW: Metacritic */}
        <div className="sticky left-0 bg-[#07070b] z-10 py-4 px-3 text-sm text-[#71717a] font-medium uppercase tracking-wider flex items-center border-b border-r border-white/10">
          Metacritic
        </div>
        {data.map((item, idx) => {
          const val = metaValues[idx];
          const isHighest = val !== null && val > 0 && val === maxMeta;
          return (
            <div
              key={item.id}
              className="py-4 px-3 text-sm text-[#f4f4f5] flex items-center justify-center text-center border-b border-r border-white/5 last:border-r-0"
            >
              {item.ratings?.metacritic ? (
                <div
                  className={`px-3 py-1.5 font-bold text-base ${
                    isHighest ? 'bg-[#f5a524]/10 text-[#f5a524] rounded-lg' : ''
                  }`}
                >
                  <span>{item.ratings.metacritic}</span>
                </div>
              ) : (
                <span className="text-[#71717a]">—</span>
              )}
            </div>
          );
        })}

        {/* ROW: TMDB Score */}
        <div className="sticky left-0 bg-[#07070b] z-10 py-4 px-3 text-sm text-[#71717a] font-medium uppercase tracking-wider flex items-center border-b border-r border-white/10">
          TMDB Score
        </div>
        {data.map((item, idx) => {
          const val = tmdbValues[idx];
          const isHighest = val !== null && val > 0 && val === maxTmdb;
          return (
            <div
              key={item.id}
              className="py-4 px-3 text-sm text-[#f4f4f5] flex items-center justify-center text-center border-b border-r border-white/5 last:border-r-0"
            >
              {val !== null ? (
                <div
                  className={`px-3 py-1.5 flex flex-col items-center ${
                    isHighest ? 'bg-[#f5a524]/10 text-[#f5a524] rounded-lg' : ''
                  }`}
                >
                  <span className="font-bold text-base">{val.toFixed(1)} / 10</span>
                  {item.details?.vote_count ? (
                    <span className="text-[11px] text-[#71717a]">
                      {item.details.vote_count.toLocaleString()} votes
                    </span>
                  ) : null}
                </div>
              ) : (
                <span className="text-[#71717a]">—</span>
              )}
            </div>
          );
        })}

        {/* ROW: Year */}
        <div className="sticky left-0 bg-[#07070b] z-10 py-4 px-3 text-sm text-[#71717a] font-medium uppercase tracking-wider flex items-center border-b border-r border-white/10">
          Year
        </div>
        {data.map((item) => (
          <div
            key={item.id}
            className="py-4 px-3 text-sm text-[#f4f4f5] flex items-center justify-center text-center border-b border-r border-white/5 last:border-r-0 font-medium"
          >
            {item.year || item.details?.year || '—'}
          </div>
        ))}

        {/* ROW: Runtime */}
        <div className="sticky left-0 bg-[#07070b] z-10 py-4 px-3 text-sm text-[#71717a] font-medium uppercase tracking-wider flex items-center border-b border-r border-white/10">
          Runtime
        </div>
        {data.map((item) => (
          <div
            key={item.id}
            className="py-4 px-3 text-sm text-[#a1a1aa] flex items-center justify-center text-center border-b border-r border-white/5 last:border-r-0"
          >
            {item.details?.runtime || '—'}
          </div>
        ))}

        {/* ROW: Genres */}
        <div className="sticky left-0 bg-[#07070b] z-10 py-4 px-3 text-sm text-[#71717a] font-medium uppercase tracking-wider flex items-center border-b border-r border-white/10">
          Genres
        </div>
        {data.map((item) => (
          <div
            key={item.id}
            className="py-4 px-3 text-sm text-[#f4f4f5] flex items-center justify-center text-center border-b border-r border-white/5 last:border-r-0"
          >
            {item.details?.genres && item.details.genres.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 justify-center">
                {item.details.genres.slice(0, 3).map((g) => (
                  <span
                    key={g.id}
                    className="px-2 py-0.5 rounded-full text-[11px] glass border border-white/10 text-[#a1a1aa]"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[#71717a]">—</span>
            )}
          </div>
        ))}

        {/* ROW: Director */}
        <div className="sticky left-0 bg-[#07070b] z-10 py-4 px-3 text-sm text-[#71717a] font-medium uppercase tracking-wider flex items-center border-b border-r border-white/10">
          Director
        </div>
        {data.map((item) => (
          <div
            key={item.id}
            className="py-4 px-3 text-sm text-[#f4f4f5] flex items-center justify-center text-center border-b border-r border-white/5 last:border-r-0 font-medium"
          >
            {item.credits?.crew?.director || '—'}
          </div>
        ))}

        {/* ROW: Music Director */}
        <div className="sticky left-0 bg-[#07070b] z-10 py-4 px-3 text-sm text-[#71717a] font-medium uppercase tracking-wider flex items-center border-b border-r border-white/10">
          Music Director
        </div>
        {data.map((item) => (
          <div
            key={item.id}
            className="py-4 px-3 text-sm text-[#f4f4f5] flex items-center justify-center text-center border-b border-r border-white/5 last:border-r-0 font-medium"
          >
            {item.credits?.crew?.musicDirector || '—'}
          </div>
        ))}

        {/* ROW: Lead Cast */}
        <div className="sticky left-0 bg-[#07070b] z-10 py-4 px-3 text-sm text-[#71717a] font-medium uppercase tracking-wider flex items-center border-b border-r border-white/10">
          Lead Cast
        </div>
        {data.map((item) => {
          const top3 = item.credits?.cast?.slice(0, 3).map((c) => c.name);
          return (
            <div
              key={item.id}
              className="py-4 px-3 text-sm text-[#a1a1aa] flex items-center justify-center text-center border-b border-r border-white/5 last:border-r-0"
            >
              {top3 && top3.length > 0 ? top3.join(', ') : '—'}
            </div>
          );
        })}

        {/* ROW: OTT (India) */}
        <div className="sticky left-0 bg-[#07070b] z-10 py-4 px-3 text-sm text-[#71717a] font-medium uppercase tracking-wider flex items-center border-b border-r border-white/10">
          OTT (India)
        </div>
        {data.map((item) => {
          const list = [
            ...(item.providers?.flatrate || []),
            ...(item.providers?.rent || []),
            ...(item.providers?.buy || []),
          ];
          // Unique by provider_name
          const uniqueProviders = list.filter(
            (p, index, self) =>
              index === self.findIndex((t) => t.provider_name === p.provider_name)
          );

          return (
            <div
              key={item.id}
              className="py-4 px-3 text-sm text-[#f4f4f5] flex items-center justify-center text-center border-b border-r border-white/5 last:border-r-0"
            >
              {uniqueProviders.length > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-[140px]">
                  {uniqueProviders.slice(0, 4).map((p) => (
                    <div
                      key={p.provider_name}
                      title={p.provider_name}
                      className="relative w-6 h-6 rounded-md overflow-hidden shrink-0 border border-white/10"
                    >
                      <Image
                        src={`${IMG_BASE}/w92${p.logo_path}`}
                        alt={p.provider_name}
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[#71717a]">—</span>
              )}
            </div>
          );
        })}

        {/* ROW: In Theatres */}
        <div className="sticky left-0 bg-[#07070b] z-10 py-4 px-3 text-sm text-[#71717a] font-medium uppercase tracking-wider flex items-center border-r border-white/10">
          In Theatres
        </div>
        {data.map((item) => (
          <div
            key={item.id}
            className="py-4 px-3 text-sm flex items-center justify-center text-center border-r border-white/5 last:border-r-0"
          >
            {item.inTheatres ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 font-semibold text-xs border border-green-500/30">
                <Check className="w-3 h-3" />
                Yes
              </span>
            ) : (
              <span className="text-[#71717a] text-xs">No</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
