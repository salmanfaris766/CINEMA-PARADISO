'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { TMDBGenre } from '@/lib/types';

export interface FilmFinderFormData {
  language: 'en' | 'ta' | 'both';
  type: 'movie' | 'tv' | 'sitcom';
  genres: number[];
  minRuntime: number | null;
  maxRuntime: number | null;
  minEpisodes: number | null;
  maxEpisodes: number | null;
  yearFrom: number;
  yearTo: number;
  mood: string | null;
}

interface FilmFinderFormProps {
  onSubmit: (data: FilmFinderFormData) => void;
  isLoading: boolean;
}

interface GenresApiResponse {
  movie: TMDBGenre[];
  tv: TMDBGenre[];
}

export default function FilmFinderForm({ onSubmit, isLoading }: FilmFinderFormProps) {
  // Form fields
  const [language, setLanguage] = useState<'en' | 'ta' | 'both'>('both');
  const [type, setType] = useState<'movie' | 'tv' | 'sitcom'>('movie');
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [minRuntime, setMinRuntime] = useState<string>('');
  const [maxRuntime, setMaxRuntime] = useState<string>('');
  const [minEpisodes, setMinEpisodes] = useState<string>('');
  const [maxEpisodes, setMaxEpisodes] = useState<string>('');
  const [yearFrom, setYearFrom] = useState<number>(1980);
  const [yearTo, setYearTo] = useState<number>(2026);
  const [mood, setMood] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch genres from /api/genres
  const { data: genresData } = useQuery<GenresApiResponse>({
    queryKey: ['genres'],
    queryFn: async () => {
      const res = await fetch('/api/genres');
      if (!res.ok) throw new Error('Failed to fetch genres');
      return res.json();
    },
    staleTime: Infinity,
  });

  const availableGenres = useMemo(() => {
    return type === 'movie' ? genresData?.movie || [] : genresData?.tv || [];
  }, [type, genresData]);

  // Handle Type Change & Sitcom automation
  const handleTypeChange = (newType: 'movie' | 'tv' | 'sitcom') => {
    setType(newType);
    if (newType === 'sitcom') {
      // Auto-add comedy genre (35) and lock it; prefill 20-40 min runtime
      setSelectedGenres((prev) => (prev.includes(35) ? prev : [...prev, 35]));
      setMinRuntime('20');
      setMaxRuntime('40');
    } else if (type === 'sitcom') {
      // If switching away from sitcom, reset default runtime if it was 20-40
      if (minRuntime === '20' && maxRuntime === '40') {
        setMinRuntime('');
        setMaxRuntime('');
      }
    }
  };

  // Toggle Genre
  const handleGenreToggle = (genreId: number) => {
    if (type === 'sitcom' && genreId === 35) {
      // Locked for sitcoms
      return;
    }

    setErrorMessage(null);
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter((id) => id !== genreId));
    } else {
      if (selectedGenres.length >= 5) {
        setErrorMessage('You can select a maximum of 5 genres.');
        return;
      }
      setSelectedGenres([...selectedGenres, genreId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation 1: At least one genre OR a mood must be provided
    if (selectedGenres.length === 0 && (!mood || mood.trim() === '')) {
      setErrorMessage('Please select at least one genre or describe the mood/vibe you are looking for.');
      return;
    }

    // Validation 2: Year range valid
    if (yearFrom > yearTo) {
      setErrorMessage('From Year cannot be greater than To Year.');
      return;
    }

    // Validation 3: Runtime range valid if both provided
    const minR = minRuntime ? Number(minRuntime) : null;
    const maxR = maxRuntime ? Number(maxRuntime) : null;
    if (minR !== null && maxR !== null && minR > maxR) {
      setErrorMessage('Minimum duration cannot exceed maximum duration.');
      return;
    }

    const minEp = minEpisodes ? Number(minEpisodes) : null;
    const maxEp = maxEpisodes ? Number(maxEpisodes) : null;
    if (minEp !== null && maxEp !== null && minEp > maxEp) {
      setErrorMessage('Minimum episode count cannot exceed maximum episode count.');
      return;
    }

    onSubmit({
      language,
      type,
      genres: selectedGenres,
      minRuntime: minR,
      maxRuntime: maxR,
      minEpisodes: minEp,
      maxEpisodes: maxEp,
      yearFrom,
      yearTo,
      mood: mood.trim() || null,
    });
  };

  return (
    <div className="glass rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
      {/* Heading */}
      <h1
        className="text-3xl sm:text-4xl font-bold text-[#f4f4f5] text-center mb-2 tracking-tight"
        style={{ fontFamily: 'var(--font-display), serif' }}
      >
        Find Your Perfect Watch
      </h1>
      <p className="text-secondary text-sm sm:text-base text-center mb-8">
        Tell us what you're in the mood for
      </p>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* a. Language */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              Language
            </label>
            <div className="flex rounded-full glass p-1 border border-white/10">
              {(['en', 'ta', 'both'] as const).map((lang) => {
                const label = lang === 'en' ? 'Hollywood' : lang === 'ta' ? 'Tamil' : 'Both';
                const isActive = language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-[#f5a524] text-[#07070b] shadow-[0_0_15px_rgba(245,165,36,0.3)]'
                        : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* b. Type */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              Type
            </label>
            <div className="flex rounded-full glass p-1 border border-white/10">
              {(['movie', 'tv', 'sitcom'] as const).map((t) => {
                const label = t === 'movie' ? 'Movie' : t === 'tv' ? 'Series' : 'Sitcom';
                const isActive = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTypeChange(t)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-[#f5a524] text-[#07070b] shadow-[0_0_15px_rgba(245,165,36,0.3)]'
                        : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* c. Genre selection */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              Genres <span className="text-[11px] text-[#71717a] font-normal">(Max 5)</span>
            </label>
            {selectedGenres.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedGenres(type === 'sitcom' ? [35] : [])}
                className="text-xs text-[#f5a524] hover:underline"
              >
                Clear genres
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {availableGenres.map((g) => {
              const isSelected = selectedGenres.includes(g.id);
              const isLocked = type === 'sitcom' && g.id === 35;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleGenreToggle(g.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                    isSelected
                      ? 'border-[#f5a524] bg-[#f5a524]/20 text-[#f5a524] shadow-[0_0_12px_rgba(245,165,36,0.3)]'
                      : 'border-white/10 text-[#a1a1aa] glass hover:text-[#f4f4f5] hover:border-white/20'
                  } ${isLocked ? 'cursor-default ring-1 ring-[#f5a524]/50' : 'cursor-pointer'}`}
                >
                  {g.name} {isLocked && '🔒'}
                </button>
              );
            })}
          </div>
        </div>

        {/* d & e. Duration & Episodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Runtime / Duration */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              {type === 'movie' ? 'Duration (minutes)' : 'Episode Runtime (minutes)'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                placeholder={type === 'sitcom' ? '20' : 'Min (e.g. 90)'}
                value={minRuntime}
                onChange={(e) => setMinRuntime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#f4f4f5] focus:outline-none focus:border-[#f5a524]/60 transition-colors"
              />
              <span className="text-secondary text-sm">—</span>
              <input
                type="number"
                min="1"
                placeholder={type === 'sitcom' ? '40' : 'Max (e.g. 150)'}
                value={maxRuntime}
                onChange={(e) => setMaxRuntime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#f4f4f5] focus:outline-none focus:border-[#f5a524]/60 transition-colors"
              />
            </div>
            {type === 'sitcom' && (
              <span className="text-[11px] text-[#71717a]">Pre-filled for standard sitcoms, editable</span>
            )}
          </div>

          {/* Timeline / Year Range */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
              Year Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1950"
                max="2030"
                value={yearFrom}
                onChange={(e) => setYearFrom(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#f4f4f5] focus:outline-none focus:border-[#f5a524]/60 transition-colors"
              />
              <span className="text-secondary text-sm">—</span>
              <input
                type="number"
                min="1950"
                max="2030"
                value={yearTo}
                onChange={(e) => setYearTo(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#f4f4f5] focus:outline-none focus:border-[#f5a524]/60 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* e. Number of episodes (Only for series or sitcom) */}
        {(type === 'tv' || type === 'sitcom') && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
                Number of Episodes
              </label>
              <span className="text-xs text-[#71717a]">Leave empty for any</span>
            </div>
            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="number"
                min="1"
                placeholder="Min (e.g. 8)"
                value={minEpisodes}
                onChange={(e) => setMinEpisodes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#f4f4f5] focus:outline-none focus:border-[#f5a524]/60 transition-colors"
              />
              <span className="text-secondary text-sm">—</span>
              <input
                type="number"
                min="1"
                placeholder="Max (e.g. 13)"
                value={maxEpisodes}
                onChange={(e) => setMaxEpisodes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#f4f4f5] focus:outline-none focus:border-[#f5a524]/60 transition-colors"
              />
            </div>
          </div>
        )}

        {/* g. Mood (optional) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
            Mood / Vibe <span className="text-[11px] text-[#71717a] font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g., dark thriller, feel-good comedy, mind-bending sci-fi"
            value={mood}
            onChange={(e) => {
              setMood(e.target.value);
              setErrorMessage(null);
            }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[#f4f4f5] placeholder-[#71717a] focus:outline-none focus:border-[#f5a524]/60 transition-colors"
          />
          <span className="text-[11px] text-[#71717a]">
            Describe the vibe you want for tailored AI ranking & explanations
          </span>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full bg-[#f5a524] hover:bg-[#e0961f] disabled:opacity-60 disabled:cursor-not-allowed text-[#07070b] font-semibold text-lg py-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,165,36,0.3)] hover:shadow-[0_0_35px_rgba(245,165,36,0.5)] cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Find My Picks</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

