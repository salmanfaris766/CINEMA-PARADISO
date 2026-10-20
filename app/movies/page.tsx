'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import FilterBar from '@/components/FilterBar';
import PosterGrid from '@/components/PosterGrid';
import { useFilterStore } from '@/store/filterStore';
import { PosterCardProps } from '@/components/PosterCard';

interface DiscoverApiResponse {
  total_results: number;
  total_pages: number;
  page: number;
  items: PosterCardProps[];
}

function MoviesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accumulatedItems, setAccumulatedItems] = useState<PosterCardProps[]>([]);
  const isInitialMount = useRef(true);

  const {
    genres,
    mode,
    yearFrom,
    yearTo,
    minRating,
    language,
    sortBy,
    page,
    setMediaType,
    setPage,
    syncFromUrl,
    toQueryString,
  } = useFilterStore();

  // On mount: set mediaType to movie and sync state from URL params
  useEffect(() => {
    setMediaType('movie');
    if (searchParams) {
      syncFromUrl(searchParams);
    }
  }, []);

  // Sync state back to URL on filter changes (excluding first mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const queryString = toQueryString();
    router.push(queryString ? `/movies?${queryString}` : '/movies', {
      scroll: false,
    });
  }, [genres, mode, yearFrom, yearTo, minRating, language, sortBy, page, router, toQueryString]);

  // Query key reflecting all filter parameters
  const queryKey = [
    'discover',
    'movie',
    genres.join(mode === 'or' ? '|' : ','),
    mode,
    yearFrom,
    yearTo,
    minRating,
    language,
    sortBy,
    page,
  ];

  const fetchUrl = `/api/discover?media_type=movie&genres=${genres.join(
    mode === 'or' ? '|' : ','
  )}&mode=${mode}&year_from=${yearFrom}&year_to=${yearTo}&min_rating=${minRating}&language=${language}&sort_by=${sortBy}&page=${page}`;

  const { data, isLoading, isError } = useQuery<DiscoverApiResponse>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('Failed to fetch movies');
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  // Handle pagination and items accumulation
  useEffect(() => {
    if (!data?.items) return;

    if (page === 1) {
      setAccumulatedItems(data.items);
    } else {
      setAccumulatedItems((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newUnique = data.items.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newUnique];
      });
    }
  }, [data, page]);

  // When filters change and reset page to 1, clear stale items if query is fetching
  useEffect(() => {
    if (page === 1) {
      setAccumulatedItems([]);
    }
  }, [genres, mode, yearFrom, yearTo, minRating, language, sortBy]);

  const totalResults = data?.total_results || 0;
  const totalPages = data?.total_pages || 1;
  const hasMore = page < totalPages && accumulatedItems.length < totalResults;

  return (
    <div className="w-full pb-16">
      {/* Page Heading */}
      <h1
        className="text-4xl md:text-5xl font-bold text-[#f4f4f5] tracking-tight mb-6"
        style={{ fontFamily: 'var(--font-display), serif' }}
      >
        Movies
      </h1>

      {/* Filter Bar */}
      <FilterBar totalCount={totalResults} />

      {/* Error State */}
      {isError && (
        <div className="w-full p-8 rounded-2xl glass surface text-center my-6">
          <p className="text-red-400 font-medium">Failed to load movies.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-3 px-5 py-2 rounded-full bg-[#f5a524] text-[#07070b] font-semibold text-xs"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Virtualized Poster Grid */}
      <PosterGrid
        items={accumulatedItems.length > 0 ? accumulatedItems : data?.items || []}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={() => setPage(page + 1)}
        totalCount={totalResults}
      />
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full py-20 text-center text-[#a1a1aa]">
          Loading movie shelf...
        </div>
      }
    >
      <MoviesContent />
    </Suspense>
  );
}
