import React from 'react';

export default function MoviesLoading() {
  return (
    <div className="w-full pb-16 animate-pulse">
      {/* Page Heading Skeleton */}
      <div className="h-10 w-48 rounded-xl surface shimmer mb-6" />

      {/* FilterBar Skeleton */}
      <div className="w-full glass surface rounded-2xl p-4 md:p-6 mb-8 border border-white/5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full surface shimmer" />
          ))}
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <div className="h-8 w-44 rounded-full surface shimmer" />
          <div className="h-8 w-36 rounded-full surface shimmer" />
          <div className="h-8 w-36 rounded-full surface shimmer" />
        </div>
      </div>

      {/* Grid of 24 Poster Skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-4">
        {[...Array(24)].map((_, i) => (
          <div
            key={i}
            className="w-full aspect-[2/3] rounded-xl surface shimmer"
            style={{ borderRadius: '12px' }}
          />
        ))}
      </div>
    </div>
  );
}
