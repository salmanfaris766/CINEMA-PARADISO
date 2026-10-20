'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { RailItem } from '@/lib/types';
import { IMG_BASE } from '@/lib/tmdb';

interface HeroProps {
  items: RailItem[];
}

export default function Hero({ items }: HeroProps) {
  const slides = items.slice(0, 5);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const currentItem = slides[activeIndex] || slides[0];

  return (
    <section className="relative w-full h-[80vh] rounded-2xl overflow-hidden mb-12 bg-[#07070b] border border-white/5 shadow-2xl">
      {/* 5 Crossfading Backdrop Layers */}
      {slides.map((item, idx) => {
        const bgPath = item.backdrop_path || item.poster_path;
        const bgUrl = `${IMG_BASE}/w1280${bgPath}`;

        return (
          <div
            key={item.id}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              idx === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{
              backgroundImage: `url(${bgUrl})`,
            }}
          />
        );
      })}

      {/* Gradient Overlays */}
      {/* Left Gradient (covers 60% of the left) */}
      <div
        className="absolute inset-y-0 left-0 w-[60%] pointer-events-none z-10 bg-gradient-to-r from-[#07070b] via-[#07070b]/80 to-transparent"
        aria-hidden="true"
      />

      {/* Bottom Gradient (covers 40% of the bottom) */}
      <div
        className="absolute bottom-0 inset-x-0 h-[40%] pointer-events-none z-10 bg-gradient-to-t from-[#07070b] via-[#07070b]/60 to-transparent"
        aria-hidden="true"
      />

      {/* Content Area */}
      <div className="absolute bottom-12 left-12 z-20 max-w-[500px]">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col"
        >
          {/* Title */}
          <h1
            className="text-4xl md:text-5xl font-bold text-[#f4f4f5] leading-tight tracking-tight drop-shadow-md"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            {currentItem.title}
          </h1>

          {/* Meta line */}
          <div className="flex items-center gap-2 text-sm text-[#a1a1aa] mt-3 font-medium">
            <span>{currentItem.year || '2024'}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-[#f5a524]">
              <Star className="w-4 h-4 fill-[#f5a524] text-[#f5a524]" />
              {currentItem.vote_average > 0 ? currentItem.vote_average.toFixed(1) : '8.0'}
            </span>
            <span>•</span>
            <span className="capitalize">{currentItem.media_type === 'tv' ? 'Series' : 'Movie'}</span>
          </div>

          {/* Overview description */}
          <p className="text-base text-[#a1a1aa] line-clamp-2 mt-3 leading-relaxed">
            {currentItem.overview || 'Explore this critically acclaimed cinematic masterpiece on Cinema Paradiso.'}
          </p>

          {/* Buttons row */}
          <div className="mt-6 flex items-center gap-3">
            <Link
              href={`/${currentItem.media_type}/${currentItem.id}`}
              className="bg-[#f5a524] hover:bg-[#e0961f] text-[#07070b] font-semibold rounded-full px-6 py-3 transition-colors text-sm shadow-[0_0_20px_rgba(245,165,36,0.25)] hover:shadow-[0_0_25px_rgba(245,165,36,0.4)]"
            >
              View Details
            </Link>

            <button
              type="button"
              onClick={() => console.log('compare', currentItem.id, currentItem.title)}
              className="border border-[#f5a524] text-[#f5a524] hover:bg-[#f5a524]/10 rounded-full px-6 py-3 transition-colors text-sm font-semibold"
            >
              + Compare
            </button>
          </div>
        </motion.div>
      </div>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 right-8 z-20 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveIndex(idx)}
            aria-label={`Switch to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === activeIndex
                ? 'w-6 bg-[#f5a524]'
                : 'w-2 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
