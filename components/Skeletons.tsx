import React from 'react';

export function PosterSkeleton() {
  return (
    <div
      className="relative aspect-[2/3] w-[200px] shrink-0 rounded-xl surface shimmer overflow-hidden"
      style={{ borderRadius: '12px' }}
      aria-hidden="true"
    />
  );
}

export function RailSkeleton() {
  return (
    <section className="mb-10 w-full" aria-hidden="true">
      {/* Heading placeholder */}
      <div className="h-8 w-56 rounded-md surface shimmer mb-4" />

      {/* Row of 6 poster skeletons */}
      <div className="flex gap-4 overflow-hidden pb-4">
        {[...Array(6)].map((_, i) => (
          <PosterSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <div
      className="w-full h-[80vh] rounded-2xl surface shimmer mb-12 overflow-hidden relative"
      aria-hidden="true"
    />
  );
}
