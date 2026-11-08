'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import PosterCard, { PosterCardProps } from './PosterCard';
import { PosterSkeleton } from './Skeletons';

interface RailProps {
  title: string;
  items: PosterCardProps[];
}

export default function Rail({ title, items }: RailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Lazy loading via IntersectionObserver
  useEffect(() => {
    if (!railRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(railRef.current);

    return () => observer.disconnect();
  }, []);

  // Show all posters when user scrolls horizontally
  const onContainerScroll = () => {
    checkScroll();
    if (!showAll) setShowAll(true);
  };

  // Update edge masks and navigation arrows
  const checkScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const atStart = el.scrollLeft <= 5;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 5;

    setCanScrollLeft(!atStart);
    setCanScrollRight(!atEnd);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', onContainerScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', onContainerScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [isVisible, items]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;

    const offset = direction === 'left' ? -600 : 600;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div ref={railRef} className="w-full">
      <section
        onMouseEnter={() => setShowAll(true)}
        className="relative mb-12 group/rail"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h2
            className="text-2xl font-bold text-[#f4f4f5] tracking-tight"
            style={{ fontFamily: 'var(--font-display), serif' }}
          >
            {title}
          </h2>

          <div className="flex items-center gap-2">
            {/* Scroll Left Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScroll('left')}
                aria-label={`Scroll ${title} left`}
                className="opacity-0 group-hover/rail:opacity-100 transition-all duration-300 p-2 rounded-full glass hover:bg-white/10 text-[#f4f4f5] hover:text-[#f5a524]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* Scroll Right Button */}
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label={`Scroll ${title} right`}
              className="opacity-0 group-hover/rail:opacity-100 transition-all duration-300 p-2 rounded-full glass hover:bg-white/10 text-[#f4f4f5] hover:text-[#f5a524]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scroll Container Area with Edge Masks */}
        <div className="relative w-full">
          {/* Left Edge Mask */}
          <div
            className={`absolute left-0 top-0 bottom-4 w-[60px] pointer-events-none z-10 bg-gradient-to-r from-[#07070b] to-transparent transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'
              }`}
          />

          {/* Right Edge Mask */}
          <div
            className={`absolute right-0 top-0 bottom-4 w-[60px] pointer-events-none z-10 bg-gradient-to-l from-[#07070b] to-transparent transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'
              }`}
          />

          {/* Horizontal Scroll Shelf */}
          <div
            ref={containerRef}
            data-lenis-prevent
            onScroll={onContainerScroll}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {!isVisible ? (
              // Skeletons placeholder before entering viewport
              [...Array(6)].map((_, i) => <PosterSkeleton key={i} />)
            ) : items.length > 0 ? (
              // Render first 8 immediately; reveal rest on scroll/hover
              items.slice(0, showAll ? items.length : 8).map((item) => (
                <div key={item.id} className="snap-start shrink-0 w-[180px]">
                  <PosterCard {...item} />
                </div>
              ))
            ) : (
              <div className="text-sm text-[#71717a] py-8 px-4">
                No titles available at the moment.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
