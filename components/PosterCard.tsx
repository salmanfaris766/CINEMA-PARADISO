'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { IMG_BASE } from '@/lib/tmdb';
import { useCompareStore } from '@/store/compareStore';

export interface PosterCardProps {
  id: number;
  media_type: 'movie' | 'tv';
  title: string;
  year: string;
  poster_path: string;
  vote_average: number;
  release_date?: string;
}

export default function PosterCard({
  id,
  media_type,
  title,
  year,
  poster_path,
  vote_average,
  release_date,
}: PosterCardProps) {
  const addItem = useCompareStore((state) => state.addItem);
  const imageUrl = `${IMG_BASE}/w342${poster_path}`;
  const targetHref = `/${media_type}/${id}`;

  const formattedRelease = React.useMemo(() => {
    if (!release_date) return null;
    const d = new Date(release_date);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [release_date]);

  return (
    <Link
      href={targetHref}
      className="group relative block aspect-[2/3] w-full rounded-xl overflow-hidden cursor-pointer bg-[#0d0d14] transition-shadow duration-300 ease-out hover:shadow-[0_0_30px_rgba(245,165,36,0.3)]"
      style={{ borderRadius: '12px' }}
    >
      {/* Optional Release Date Badge */}
      {formattedRelease && (
        <span className="absolute top-2 right-2 glass text-[#f5a524] text-[11px] font-bold px-2 py-0.5 rounded-full z-10 border border-[#f5a524]/30 shadow-md">
          {formattedRelease}
        </span>
      )}

      {/* Poster Image */}
      <Image
        src={imageUrl}
        alt={title}
        fill
        loading="lazy"
        quality={75}
        sizes="200px"
        className="object-cover transition-transform duration-250 ease-out group-hover:scale-105"
      />

      {/* Hover Glass Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 glass translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out flex flex-col z-10">
        <h4 className="text-sm font-semibold truncate text-[#f4f4f5]" title={title}>
          {title}
        </h4>

        <div className="flex items-center gap-1.5 text-xs text-[#a1a1aa] mt-0.5">
          <span>{year || 'N/A'}</span>
          <span>•</span>
          <span className="flex items-center gap-0.5 text-[#f5a524] font-medium">
            <Star className="w-3 h-3 fill-[#f5a524] text-[#f5a524]" />
            {vote_average > 0 ? vote_average.toFixed(1) : 'NR'}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addItem({ id, media_type, title, poster_path });
          }}
          className="text-[11px] border border-[#f5a524]/60 text-[#f5a524] hover:bg-[#f5a524]/20 hover:border-[#f5a524] rounded-full px-2.5 py-0.5 mt-2 transition-colors w-fit font-medium"
        >
          + Compare
        </button>
      </div>
    </Link>
  );
}
