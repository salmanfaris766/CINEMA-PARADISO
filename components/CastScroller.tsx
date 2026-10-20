'use client';

import React from 'react';
import Image from 'next/image';
import { IMG_BASE } from '@/lib/tmdb';

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface CastScrollerProps {
  cast: CastMember[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function CastScroller({ cast }: CastScrollerProps) {
  if (!cast || cast.length === 0) {
    return <p className="text-sm text-[#71717a]">No cast information available.</p>;
  }

  return (
    <div
      data-lenis-prevent
      className="flex gap-4 overflow-x-auto pb-2"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {cast.map((person) => {
        const photoUrl = person.profile_path
          ? `${IMG_BASE}/w185${person.profile_path}`
          : null;

        return (
          <div
            key={person.id}
            className="group relative shrink-0 w-[100px] text-center flex flex-col items-center"
          >
            {/* Photo Circle */}
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white/5 border border-white/10 mx-auto flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={person.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-[#a1a1aa]">
                  {getInitials(person.name)}
                </span>
              )}

              {/* Hover Tooltip Overlay with character name */}
              {person.character && (
                <div className="absolute inset-0 bg-[#07070b]/90 glass opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-1 text-[10px] text-[#f4f4f5] font-semibold text-center leading-tight">
                  {person.character}
                </div>
              )}
            </div>

            {/* Actor Name */}
            <h5
              className="text-xs font-medium text-[#f4f4f5] mt-2 w-full truncate"
              title={person.name}
            >
              {person.name}
            </h5>

            {/* Character Name */}
            <p
              className="text-[11px] text-[#71717a] w-full truncate mt-0.5"
              title={person.character}
            >
              {person.character || 'Role unspecified'}
            </p>
          </div>
        );
      })}
    </div>
  );
}
