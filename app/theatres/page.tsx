'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Ticket, Film } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { IMG_BASE } from '@/lib/tmdb';
import { useCompareStore } from '@/store/compareStore';

interface TheatreMovie {
  id: number;
  media_type: 'movie';
  title: string;
  year: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
}

const BLUR_PIXEL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AKwA//9k=';

export default function TheatresPage() {
  const addItem = useCompareStore((state) => state.addItem);

  const { data, isLoading, isError } = useQuery<{ results: TheatreMovie[] }>({
    queryKey: ['now-playing'],
    queryFn: async () => {
      const res = await fetch('/api/now-playing');
      if (!res.ok) throw new Error('Failed to fetch now-playing movies');
      return res.json();
    },
    staleTime: 21600 * 1000,
  });

  const movies = data?.results || [];

  return (
    <PageTransition className="w-full pb-24">
      {/* Heading */}
      <h1
        className="text-4xl font-bold text-[#f4f4f5] mb-2 tracking-tight"
        style={{ fontFamily: 'var(--font-display), serif' }}
      >
        Now in Theatres
      </h1>
      <p className="text-secondary text-lg mb-8 font-light">
        Currently showing in India
      </p>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2 animate-pulse">
              <div className="w-full aspect-[2/3] rounded-xl surface shimmer" />
              <div className="h-8 w-full rounded-full surface shimmer mt-1" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 || isError ? (
        /* Empty State */
        <div className="w-full py-16 flex items-center justify-center">
          <div className="glass rounded-2xl p-12 text-center max-w-md border border-white/10 shadow-2xl flex flex-col items-center">
            <Film className="w-12 h-12 text-[#f5a524] mb-4 opacity-80" />
            <h2
              className="text-2xl font-bold text-[#f4f4f5]"
              style={{ fontFamily: 'var(--font-display), serif' }}
            >
              No movies currently showing
            </h2>
            <p className="text-secondary text-sm mt-2">
              Check back soon for upcoming theatrical releases in India.
            </p>
            <Link
              href="/movies"
              className="mt-6 bg-[#f5a524] hover:bg-[#e0961f] text-[#07070b] font-semibold rounded-full px-6 py-2.5 text-sm transition-all"
            >
              Browse All Movies
            </Link>
          </div>
        </div>
      ) : (
        /* Grid of Theatre Movies with staggered animations */
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-4"
        >
          {movies.map((movie) => {
            const imageUrl = `${IMG_BASE}/w500${movie.poster_path}`;
            const bmsUrl = `https://in.bookmyshow.com/search/movies/${encodeURIComponent(
              movie.title
            )}`;

            return (
              <motion.div
                key={movie.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
                className="flex flex-col group/card"
              >
                {/* Poster Card Container */}
                <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#0d0d14] border border-white/5 transition-shadow duration-300 ease-out hover:shadow-[0_0_30px_rgba(245,165,36,0.25)]">
                  {/* In Theatres Badge */}
                  <span className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-full font-semibold z-20 shadow-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    In Theatres
                  </span>

                  <Link href={`/movie/${movie.id}`} className="block w-full h-full">
                    <Image
                      src={imageUrl}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 15vw"
                      placeholder="blur"
                      blurDataURL={BLUR_PIXEL}
                      className="object-cover transition-transform duration-300 ease-out group-hover/card:scale-105"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 glass translate-y-full group-hover/card:translate-y-0 transition-transform duration-300 ease-out flex flex-col z-10">
                      <h4
                        className="text-sm font-semibold truncate text-[#f4f4f5]"
                        title={movie.title}
                      >
                        {movie.title}
                      </h4>

                      <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] mt-0.5">
                        <span>{movie.year || 'N/A'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-[#f5a524] font-medium">
                          <Star className="w-3 h-3 fill-[#f5a524] text-[#f5a524]" />
                          {movie.vote_average > 0
                            ? movie.vote_average.toFixed(1)
                            : 'NR'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addItem({
                            id: movie.id,
                            media_type: 'movie',
                            title: movie.title,
                            poster_path: movie.poster_path,
                          });
                        }}
                        className="text-[11px] border border-[#f5a524]/60 text-[#f5a524] hover:bg-[#f5a524]/20 hover:border-[#f5a524] rounded-full px-2.5 py-0.5 mt-2 transition-colors w-fit font-medium"
                      >
                        + Compare
                      </button>
                    </div>
                  </Link>
                </div>

                {/* Book on BookMyShow Button */}
                <a
                  href={bmsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 w-full border border-green-500/50 text-green-400 hover:bg-green-500/15 hover:border-green-500 rounded-full py-1.5 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(34,197,94,0.1)] hover:shadow-[0_0_15px_rgba(34,197,94,0.25)]"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Book on BookMyShow</span>
                </a>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </PageTransition>
  );
}
