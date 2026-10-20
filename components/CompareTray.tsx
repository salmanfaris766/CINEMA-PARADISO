'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useCompareStore } from '@/store/compareStore';
import { IMG_BASE } from '@/lib/tmdb';

export default function CompareTray() {
  const [mounted, setMounted] = useState(false);
  const items = useCompareStore((state) => state.items);
  const removeItem = useCompareStore((state) => state.removeItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || items.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="compare-tray"
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass rounded-full px-6 py-3 flex items-center gap-4 border border-white/15 shadow-[0_0_40px_rgba(245,165,36,0.15)]"
      >
        {/* a. Poster Thumbnails */}
        <div className="flex items-center gap-2">
          {items.map((item) => {
            const posterUrl = item.poster_path
              ? `${IMG_BASE}/w92${item.poster_path}`
              : '/placeholder-poster.png';

            return (
              <div
                key={item.id}
                className="relative w-12 h-[72px] rounded-lg overflow-hidden shrink-0 border border-white/10 bg-[#0d0d14] group"
              >
                {item.poster_path ? (
                  <Image
                    src={posterUrl}
                    alt={item.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-secondary p-1 text-center bg-surface">
                    {item.title}
                  </div>
                )}

                {/* Remove X button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                  aria-label={`Remove ${item.title} from comparison`}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center shadow-md transition-colors z-10"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* b. Divider */}
        <div className="h-10 w-px bg-white/10" aria-hidden="true" />

        {/* c. Count or Max reached */}
        <div className="whitespace-nowrap flex items-center justify-center min-w-[50px]">
          {items.length === 4 ? (
            <span className="text-[#71717a] text-xs font-medium">Max reached</span>
          ) : (
            <span className="text-sm text-[#a1a1aa] font-medium">{items.length}/4</span>
          )}
        </div>

        {/* d. Compare Now Button */}
        <Link
          href="/compare"
          className="bg-[#f5a524] hover:bg-[#e0961f] text-[#07070b] font-semibold rounded-full px-5 py-2 text-sm transition-all whitespace-nowrap shadow-[0_0_15px_rgba(245,165,36,0.25)] hover:shadow-[0_0_20px_rgba(245,165,36,0.4)]"
        >
          Compare Now
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
