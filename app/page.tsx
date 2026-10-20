'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, RotateCcw } from 'lucide-react';
import Hero from '@/components/Hero';
import Rail from '@/components/Rail';
import { HeroSkeleton, RailSkeleton } from '@/components/Skeletons';
import { RailData } from '@/lib/types';

interface RailsApiResponse {
  rails: RailData[];
}

async function fetchRails(): Promise<RailsApiResponse> {
  const res = await fetch('/api/rails');
  if (!res.ok) {
    throw new Error(`Failed to load rails: ${res.status}`);
  }
  return res.json();
}

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useQuery<RailsApiResponse>({
    queryKey: ['rails'],
    queryFn: fetchRails,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="w-full pb-20">
        <HeroSkeleton />
        {[...Array(4)].map((_, i) => (
          <RailSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !data?.rails || data.rails.length === 0) {
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

  const rails = data.rails;
  const heroItems = rails[0]?.items || [];

  return (
    <div className="w-full pb-16">
      {/* Hero Banner (First rail's top items) */}
      {heroItems.length > 0 && <Hero items={heroItems} />}

      {/* 7 Horizontal Rails with Staggered Fade-in */}
      <div className="flex flex-col gap-2">
        {rails.map((rail, index) => (
          <motion.div
            key={rail.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.1,
              duration: 0.5,
              ease: 'easeOut',
            }}
          >
            <Rail title={rail.title} items={rail.items} />
          </motion.div>
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
    </div>
  );
}
