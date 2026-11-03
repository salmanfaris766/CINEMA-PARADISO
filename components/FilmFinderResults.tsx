'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { IMG_BASE } from '@/lib/tmdb';
import { useCompareStore } from '@/store/compareStore';
import FilmLoader from '@/components/FilmLoader';

export interface FilmFinderResultItem {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  year: string;
  poster_path: string;
  vote_average: number;
  genres: Array<{ id: number; name: string }>;
  matchScore: number;
  reason: string;
  runtime: string | null;
  overview: string;
}

interface FilmFinderResultsProps {
  results: FilmFinderResultItem[];
  isLoading: boolean;
  aiNote: string | null;
  onReset: () => void;
}

const BLUR_PIXEL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=';

export default function FilmFinderResults({
  results,
  isLoading,
  aiNote,
  onReset,
}: FilmFinderResultsProps) {
  const router = useRouter();
  const addItem = useCompareStore((state) => state.addItem);
  const clearAll = useCompareStore((state) => state.clearAll);

  // Compare Top 4 handler
  const handleCompareTop4 = () => {
    clearAll();
    results.slice(0, 4).forEach((item) => {
      addItem({
        id: item.id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
      });
    });
    router.push('/compare');
  };

  // Full screen loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="glass rounded-3xl p-12 max-w-md w-full border border-white/10 shadow-[0_16px_50px_rgba(0,0,0,0.6)] flex flex-col items-center"
        >
          <div className="relative flex items-center justify-center mb-6">
            <FilmLoader size="lg" label="" />
            <Sparkles className="w-5 h-5 text-[#f5a524] absolute bottom-0 right-0" />
          </div>
          <h2
            className="text-2xl font-bold text-[#f4f4f5] tracking-tight"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            Finding your perfect picks...
          </h2>
          <p className="text-secondary text-sm mt-3 leading-relaxed">
            Our AI is matching your criteria against thousands of titles from our curated catalog
          </p>
        </motion.div>
      </div>
    );
  }

  // Empty state
  if (!results || results.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8">
        <div className="glass rounded-2xl p-10 max-w-lg w-full border border-white/10 shadow-2xl flex flex-col items-center gap-4">
          <Sparkles className="w-10 h-10 text-[#f5a524] opacity-80" />
          <h2
            className="text-2xl font-bold text-[#f4f4f5]"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            No matches found
          </h2>
          <p className="text-secondary text-sm leading-relaxed">
            No titles match all your criteria. Try broadening your filters, expanding the year range, or adjusting duration.
          </p>
          <button
            type="button"
            onClick={onReset}
            className="mt-4 px-6 py-2.5 rounded-full bg-[#f5a524] text-[#07070b] font-semibold text-sm hover:bg-[#e0961f] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(245,165,36,0.3)]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Different Criteria</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col mb-6">
        <h1
          className="text-3xl sm:text-4xl font-bold text-[#f4f4f5] tracking-tight mb-2"
          style={{ fontFamily: 'var(--font-display), serif' }}
        >
          Your Top Picks
        </h1>
        <p className="text-secondary text-sm">
          Ranked and analyzed by AI based on your personalized criteria
        </p>
      </div>

      {/* AI Note Banner */}
      {aiNote && (
        <div className="glass rounded-xl p-4 sm:p-5 mb-8 border-l-4 border-[#f5a524] border-t border-r border-b border-white/10 shadow-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#f5a524] shrink-0 mt-0.5" />
            <p className="text-secondary text-sm sm:text-base italic leading-relaxed">
              "{aiNote}"
            </p>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="flex flex-col gap-4">
        {results.map((item, index) => {
          const posterUrl = item.poster_path
            ? `${IMG_BASE}/w300${item.poster_path}`
            : '/placeholder-poster.png';

          const genreString =
            item.genres && item.genres.length > 0
              ? item.genres.map((g) => g.name).join(' • ')
              : null;

          return (
            <motion.div
              key={`${item.media_type}-${item.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              className="glass surface rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 border border-white/10 hover:border-[#f5a524]/40 hover:shadow-[0_0_25px_rgba(245,165,36,0.15)] transition-all duration-300 group"
            >
              {/* Left: Rank number */}
              <div
                className="hidden sm:flex text-3xl md:text-4xl font-bold text-[#f5a524] w-10 shrink-0 text-center justify-center drop-shadow-sm"
                style={{ fontFamily: 'var(--font-display), serif' }}
              >
                #{index + 1}
              </div>

              {/* Poster */}
              <div className="relative w-[85px] sm:w-[100px] h-[125px] sm:h-[150px] rounded-xl overflow-hidden shrink-0 bg-[#0d0d14] border border-white/15 shadow-md">
                <Image
                  src={posterUrl}
                  alt={item.title}
                  fill
                  sizes="100px"
                  placeholder="blur"
                  blurDataURL={BLUR_PIXEL}
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="sm:hidden absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-[#07070b]/90 text-[10px] font-bold text-[#f5a524]">
                  #{index + 1}
                </span>
              </div>

              {/* Middle: Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className="text-lg sm:text-xl font-bold text-[#f4f4f5] group-hover:text-[#f5a524] transition-colors truncate"
                    style={{ fontFamily: 'var(--font-display), serif' }}
                  >
                    {item.title}
                  </h3>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-white/5 text-[#a1a1aa] shrink-0 border border-white/10">
                    {item.media_type === 'movie' ? 'Movie' : 'TV'}
                  </span>
                </div>

                {/* Year + Runtime + Genres */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-secondary mt-1">
                  <span>{item.year || 'N/A'}</span>
                  {item.runtime && (
                    <>
                      <span>•</span>
                      <span>{item.runtime}</span>
                    </>
                  )}
                  {genreString && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[260px]">{genreString}</span>
                    </>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 text-xs text-[#f5a524] font-medium mt-1">
                  <Star className="w-3.5 h-3.5 fill-[#f5a524] text-[#f5a524]" />
                  <span>{item.vote_average > 0 ? item.vote_average.toFixed(1) : 'NR'}</span>
                </div>

                {/* Match score bar */}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-semibold text-[#f5a524]">
                    Match: {item.matchScore}%
                  </span>
                  <div className="w-28 sm:w-36 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#e0961f] to-[#f5a524] rounded-full"
                      style={{ width: `${item.matchScore}%` }}
                    />
                  </div>
                </div>

                {/* AI reason */}
                {item.reason && (
                  <p className="text-xs sm:text-sm text-secondary mt-2 italic line-clamp-2 leading-relaxed">
                    "{item.reason}"
                  </p>
                )}
              </div>

              {/* Right: View Details button */}
              <div className="sm:shrink-0 w-full sm:w-auto mt-2 sm:mt-0 flex sm:flex-col items-center gap-2">
                <Link
                  href={`/${item.media_type}/${item.id}`}
                  className="w-full sm:w-auto text-center px-4 py-2 rounded-full border border-[#f5a524] text-[#f5a524] hover:bg-[#f5a524]/10 transition-colors text-xs font-semibold whitespace-nowrap"
                >
                  View Details
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
        <button
          type="button"
          onClick={onReset}
          className="px-6 py-3 rounded-full border border-[#f5a524] text-[#f5a524] hover:bg-[#f5a524]/10 transition-colors text-sm font-semibold flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Different Criteria</span>
        </button>

        {results.length >= 2 && (
          <button
            type="button"
            onClick={handleCompareTop4}
            className="px-6 py-3 rounded-full bg-[#f5a524] hover:bg-[#e0961f] text-[#07070b] transition-all text-sm font-semibold flex items-center gap-2 shadow-[0_0_20px_rgba(245,165,36,0.3)] hover:shadow-[0_0_25px_rgba(245,165,36,0.5)]"
          >
            <span>Compare Top {Math.min(4, results.length)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

