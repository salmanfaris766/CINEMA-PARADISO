'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, RotateCcw } from 'lucide-react';
import Hero from '@/components/Hero';
import Rail from '@/components/Rail';
import { HeroSkeleton, RailSkeleton } from '@/components/Skeletons';
import PageTransition from '@/components/PageTransition';
import { RailData } from '@/lib/types';

interface RailsApiResponse {
  rails: RailData[];
}

export default function HomePage() {
  // Fetch primary rails immediately (Trending, Coming Soon, Mystery, Tamil Blockbusters)
  const {
    data: primaryData,
    isLoading: primaryLoading,
    isError: primaryError,
    refetch,
  } = useQuery<RailsApiResponse>({
    queryKey: ['rails-primary'],
    queryFn: async () => {
      const res = await fetch('/api/rails/primary');
      if (!res.ok) throw new Error(`Failed to load primary rails: ${res.status}`);
      return res.json();
    },
    staleTime: 300 * 1000, // 5 minutes
  });

  // Fetch secondary rails lazily after first paint — delayed 600ms to let above-fold render first
  const [secondaryEnabled, setSecondaryEnabled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSecondaryEnabled(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const { data: secondaryData } = useQuery<RailsApiResponse>({
    queryKey: ['rails-secondary'],
    queryFn: async () => {
      const res = await fetch('/api/rails/secondary');
      if (!res.ok) throw new Error(`Failed to load secondary rails: ${res.status}`);
      return res.json();
    },
    staleTime: 3600 * 1000, // 1 hour
    enabled: secondaryEnabled,
  });

  if (primaryLoading) {
    return (
      <div className="w-full pb-20">
        <HeroSkeleton />
        {[...Array(4)].map((_, i) => (
          <RailSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (primaryError || !primaryData?.rails || primaryData.rails.length === 0) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <div className="glass surface p-8 max-w-md w-full flex flex-col items-center gap-4">
          <h2
            className="text-2xl font-bold text-[#f4f4f5]"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            Failed to load
          </h2>
          <p className="text-sm text-[#a1a1aa]">
            Could not fetch movies from the shelf. Please check your connection and refresh.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-2 mt-2 px-6 py-2.5 rounded-full bg-[#f5a524] text-[#07070b] font-semibold text-sm hover:bg-[#e0961f] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  const primaryRails = primaryData.rails;
  const secondaryRails = secondaryData?.rails || [];
  const allRails = [...primaryRails, ...secondaryRails];
  const heroItems = primaryRails[0]?.items || [];

  return (
    <PageTransition className="w-full pb-16">
      {/* Hero Banner (First primary rail's top items) */}
      {heroItems.length > 0 && <Hero items={heroItems} />}

      {/* Primary Rails (immediate) */}
      <div className="flex flex-col gap-2">
        {allRails.map((rail) => (
          <Rail key={rail.title} title={rail.title} items={rail.items} />
        ))}
      </div>

      {/* Bottom Call to Action */}
      <div className="flex flex-col items-center justify-center mt-16 mb-8 text-center">
        <Link
          href="/movies"
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-full glass hover:border-[#f5a524]/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,165,36,0.2)] text-[#f4f4f5] hover:text-[#f5a524]"
        >
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            Browse the full shelf
          </span>
          <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1.5" />
        </Link>
      </div>
    </PageTransition>
  );
}
