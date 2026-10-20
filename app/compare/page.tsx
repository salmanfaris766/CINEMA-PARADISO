'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Film, Sparkles, Layers } from 'lucide-react';
import { useCompareStore } from '@/store/compareStore';
import CompareTable, { CompareTableItem } from '@/components/CompareTable';

export default function ComparePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const items = useCompareStore((state) => state.items);
  const clearAll = useCompareStore((state) => state.clearAll);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch full details for each item in parallel
  const detailQueries = useQueries({
    queries: items.map((item) => ({
      queryKey: ['details', item.media_type, String(item.id)],
      queryFn: async () => {
        const res = await fetch(`/api/details/${item.media_type}/${item.id}`);
        if (!res.ok) throw new Error('Failed to load item');
        return res.json();
      },
      staleTime: 86400 * 1000,
      enabled: mounted && items.length >= 2,
    })),
  });

  const isAnyLoading = detailQueries.some((q) => q.isLoading);
  const allLoaded =
    detailQueries.length > 0 && detailQueries.every((q) => q.isSuccess && q.data);

  // CompareTable data formatting
  const tableData: CompareTableItem[] = useMemo(() => {
    if (!allLoaded) return [];
    return detailQueries.map((q, idx) => {
      const resp = q.data;
      const baseItem = items[idx];
      return {
        id: baseItem.id,
        media_type: baseItem.media_type,
        title: resp.details?.title || baseItem.title,
        year: resp.details?.year || '',
        poster_path: resp.details?.poster_path || baseItem.poster_path,
        details: resp.details,
        credits: resp.credits,
        ratings: resp.ratings,
        providers: resp.providers,
        inTheatres: Boolean(resp.inTheatres),
      };
    });
  }, [allLoaded, detailQueries, items]);

  // AI Verdict payload
  const verdictPayload = useMemo(() => {
    if (!allLoaded) return null;
    return {
      titles: tableData.map((d) => {
        const platforms = [
          ...(d.providers?.flatrate || []),
          ...(d.providers?.rent || []),
        ]
          .map((p) => p.provider_name)
          .filter((v, i, a) => a.indexOf(v) === i)
          .join(', ');

        return {
          name: d.title,
          year: d.year,
          imdbRating: d.ratings?.imdb || 'N/A',
          tmdbRating: d.ratings?.tmdb ? `${d.ratings.tmdb.toFixed(1)}/10` : 'N/A',
          genres: d.details?.genres?.map((g) => g.name).join(', ') || 'N/A',
          director: d.credits?.crew?.director || 'N/A',
          runtime: d.details?.runtime || 'N/A',
          platforms: platforms || 'None',
        };
      }),
    };
  }, [allLoaded, tableData]);

  // AI Verdict Query
  const { data: verdictResponse, isLoading: isVerdictLoading } = useQuery({
    queryKey: ['verdict', ...items.map((i) => i.id)],
    queryFn: async () => {
      if (!verdictPayload) return { verdict: null };
      const res = await fetch('/api/compare-verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verdictPayload),
      });
      if (!res.ok) return { verdict: null };
      return res.json();
    },
    enabled: Boolean(allLoaded && verdictPayload),
    staleTime: 86400 * 1000,
  });

  // Handle clear
  const handleClear = () => {
    clearAll();
    router.push('/movies');
  };

  // SSR skeleton
  if (!mounted) {
    return (
      <div className="w-full pb-20 animate-pulse">
        <div className="h-10 w-48 surface shimmer rounded-xl mb-4" />
        <div className="h-6 w-64 surface shimmer rounded-lg mb-8" />
        <div className="h-[400px] w-full surface shimmer rounded-2xl" />
      </div>
    );
  }

  // Empty state: items < 2
  if (items.length < 2) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center">
        <div className="glass rounded-2xl p-12 text-center max-w-[550px] border border-white/10 shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#f5a524]/10 border border-[#f5a524]/20 flex items-center justify-center mb-6 text-[#f5a524]">
            <Layers className="w-8 h-8" />
          </div>

          <h1
            className="text-3xl font-bold text-[#f4f4f5]"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            Add titles to compare
          </h1>

          <p className="text-secondary text-sm mt-3 leading-relaxed">
            Select 2 to 4 movies or series from any page using the{' '}
            <span className="text-[#f5a524] font-medium">+ Compare</span> button.
          </p>

          <Link
            href="/movies"
            className="mt-6 bg-[#f5a524] hover:bg-[#e0961f] text-[#07070b] font-semibold rounded-full px-6 py-2.5 text-sm transition-all shadow-[0_0_20px_rgba(245,165,36,0.25)] hover:shadow-[0_0_25px_rgba(245,165,36,0.4)]"
          >
            Browse Movies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-24">
      {/* a. Page Heading */}
      <h1
        className="text-4xl font-bold text-[#f4f4f5] mb-2"
        style={{ fontFamily: 'var(--font-display), serif' }}
      >
        Compare
      </h1>

      {/* b. Subtitle */}
      <p className="text-secondary text-sm mb-6">
        Comparing {items.length} titles
      </p>

      {/* c. Clear comparison button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={handleClear}
          className="text-[#f5a524] text-sm hover:underline font-medium focus:outline-none transition-colors"
        >
          Clear comparison
        </button>
      </div>

      {/* d. Table or loading skeleton */}
      {isAnyLoading || !allLoaded ? (
        <div className="w-full h-[500px] glass rounded-2xl surface shimmer flex items-center justify-center">
          <span className="text-secondary text-sm font-medium animate-pulse">
            Loading movie comparison details...
          </span>
        </div>
      ) : (
        <CompareTable data={tableData} />
      )}

      {/* e. AI Verdict section */}
      {allLoaded && (
        <div className="mt-8">
          {isVerdictLoading ? (
            <div className="glass rounded-xl p-6 surface shimmer border border-white/10">
              <div className="h-6 w-32 surface shimmer rounded mb-2" />
              <div className="h-4 w-3/4 surface shimmer rounded" />
            </div>
          ) : verdictResponse?.verdict ? (
            <div className="glass rounded-xl p-6 border border-[#f5a524]/20 shadow-[0_0_30px_rgba(245,165,36,0.1)]">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#f5a524]" />
                <h3
                  className="text-xl font-bold text-[#f5a524]"
                  style={{ fontFamily: 'var(--font-display), serif' }}
                >
                  AI Verdict
                </h3>
              </div>
              <p className="text-secondary text-sm leading-relaxed">
                {verdictResponse.verdict}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
