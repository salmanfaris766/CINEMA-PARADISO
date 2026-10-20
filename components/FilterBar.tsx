'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, SlidersHorizontal } from 'lucide-react';
import { useFilterStore } from '@/store/filterStore';
import { TMDBGenre } from '@/lib/types';

interface GenresApiResponse {
  movie: TMDBGenre[];
  tv: TMDBGenre[];
}

interface FilterBarProps {
  totalCount?: number;
}

export default function FilterBar({ totalCount = 0 }: FilterBarProps) {
  const {
    mediaType,
    genres,
    mode,
    yearFrom,
    yearTo,
    minRating,
    language,
    sortBy,
    toggleGenre,
    toggleMode,
    setYearRange,
    setMinRating,
    setLanguage,
    setSort,
    clearAll,
  } = useFilterStore();

  const { data: genresData } = useQuery<GenresApiResponse>({
    queryKey: ['genres'],
    queryFn: async () => {
      const res = await fetch('/api/genres');
      if (!res.ok) throw new Error('Failed to fetch genres');
      return res.json();
    },
    staleTime: Infinity,
  });

  const availableGenres =
    mediaType === 'movie' ? genresData?.movie || [] : genresData?.tv || [];

  const genreMap = React.useMemo(() => {
    const map = new Map<number, string>();
    availableGenres.forEach((g) => map.set(g.id, g.name));
    return map;
  }, [availableGenres]);

  // Determine if any filters are active
  const hasActiveFilters =
    genres.length > 0 ||
    yearFrom !== 1990 ||
    yearTo !== 2026 ||
    minRating > 0 ||
    language !== 'both';

  return (
    <div
      className="sticky top-[80px] z-40 glass rounded-2xl p-4 md:p-5 mb-6 surface transition-all duration-300"
      style={{
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Row 1: Genre chips & AND/OR toggle */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={toggleMode}
          className="shrink-0 px-3 py-1 rounded-full text-xs font-bold glass border border-[#f5a524]/40 text-[#f5a524] hover:bg-[#f5a524]/15 transition-colors"
          title="Toggle matching all (AND) or any (OR) selected genres"
        >
          {mode.toUpperCase()}
        </button>

        <div className="h-4 w-px bg-white/10 shrink-0" />

        {availableGenres.map((genre) => {
          const isActive = genres.includes(genre.id);
          return (
            <button
              key={genre.id}
              type="button"
              onClick={() => toggleGenre(genre.id)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                isActive
                  ? 'border-[#f5a524] bg-[#f5a524]/15 text-[#f5a524] shadow-[0_0_10px_rgba(245,165,36,0.2)]'
                  : 'border-white/10 text-[#a1a1aa] bg-transparent hover:text-[#f4f4f5] hover:border-white/20'
              }`}
            >
              {genre.name}
            </button>
          );
        })}
      </div>

      {/* Row 2: Secondary Controls (Years, Rating, Language, Sort) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-white/10 text-xs text-[#a1a1aa]">
        {/* Left cluster: Year Range & Rating */}
        <div className="flex flex-wrap items-center gap-5">
          {/* Year Range */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[#71717a]">Year:</span>
            <input
              type="number"
              min="1900"
              max={yearTo}
              value={yearFrom}
              onChange={(e) => setYearRange(Number(e.target.value) || 1900, yearTo)}
              className="w-16 px-2 py-1 rounded-lg glass border border-white/10 text-[#f4f4f5] text-xs text-center outline-none focus:border-[#f5a524]/60"
            />
            <span>–</span>
            <input
              type="number"
              min={yearFrom}
              max="2030"
              value={yearTo}
              onChange={(e) => setYearRange(yearFrom, Number(e.target.value) || 2026)}
              className="w-16 px-2 py-1 rounded-lg glass border border-white/10 text-[#f4f4f5] text-xs text-center outline-none focus:border-[#f5a524]/60"
            />
          </div>

          {/* Min Rating Slider */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#71717a]">Rating:</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-24 accent-[#f5a524] cursor-pointer"
            />
            <span className="text-[#f5a524] font-semibold w-7">
              {minRating > 0 ? `${minRating.toFixed(1)}+` : 'All'}
            </span>
          </div>
        </div>

        {/* Right cluster: Language Segmented & Sort */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Language Segmented Control */}
          <div className="flex items-center p-0.5 rounded-full glass border border-white/10">
            {(['both', 'en', 'ta'] as const).map((lang) => {
              const label =
                lang === 'both' ? 'Both' : lang === 'en' ? 'Hollywood' : 'Tamil';
              const isActive = language === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#f5a524] text-[#07070b] font-semibold shadow-sm'
                      : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-[#71717a]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSort(e.target.value)}
              className="glass px-3 py-1 rounded-full border border-white/10 text-[#f4f4f5] text-xs outline-none focus:border-[#f5a524]/60 bg-[#07070b] cursor-pointer"
            >
              <option value="popularity.desc" className="bg-[#07070b] text-[#f4f4f5]">
                Popularity
              </option>
              <option value="vote_average.desc" className="bg-[#07070b] text-[#f4f4f5]">
                Rating
              </option>
              <option
                value={mediaType === 'movie' ? 'release_date.desc' : 'first_air_date.desc'}
                className="bg-[#07070b] text-[#f4f4f5]"
              >
                Newest
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Row 3: Active Filters Summary (Removable Chips) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#71717a] mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-[#f5a524]" /> Active:
            </span>

            {/* Genre chips */}
            {genres.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-[#f5a524]/10 border border-[#f5a524]/30 text-[#f5a524]"
              >
                {genreMap.get(id) || `Genre ${id}`}
                <button
                  type="button"
                  onClick={() => toggleGenre(id)}
                  className="hover:text-white"
                  aria-label="Remove genre"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Year chip */}
            {(yearFrom !== 1990 || yearTo !== 2026) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-white/5 border border-white/15 text-[#f4f4f5]">
                {yearFrom}–{yearTo}
                <button
                  type="button"
                  onClick={() => setYearRange(1990, 2026)}
                  className="hover:text-[#f5a524]"
                  aria-label="Reset year range"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Rating chip */}
            {minRating > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-white/5 border border-white/15 text-[#f4f4f5]">
                Rating {minRating}+
                <button
                  type="button"
                  onClick={() => setMinRating(0)}
                  className="hover:text-[#f5a524]"
                  aria-label="Reset rating filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Language chip */}
            {language !== 'both' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-white/5 border border-white/15 text-[#f4f4f5]">
                {language === 'en' ? 'Hollywood' : 'Tamil'}
                <button
                  type="button"
                  onClick={() => setLanguage('both')}
                  className="hover:text-[#f5a524]"
                  aria-label="Reset language"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Clear all */}
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-[#f5a524] hover:underline ml-2"
            >
              Clear all
            </button>
          </div>

          {/* Result Count */}
          <div className="text-xs text-[#71717a] font-medium">
            {totalCount.toLocaleString()} titles
          </div>
        </div>
      )}
    </div>
  );
}
