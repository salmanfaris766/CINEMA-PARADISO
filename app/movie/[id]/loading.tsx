import React from 'react';

export default function MovieDetailLoading() {
  return (
    <div className="w-full pb-16 animate-pulse">
      {/* Backdrop Shimmer */}
      <div className="w-full h-[60vh] min-h-[500px] rounded-2xl surface shimmer mb-8 border border-white/5" />

      {/* Ratings Strip Placeholder */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl surface shimmer" />
        ))}
      </div>

      {/* Action buttons placeholder */}
      <div className="flex gap-4 mb-8">
        <div className="h-11 w-40 rounded-full surface shimmer" />
        <div className="h-11 w-36 rounded-full surface shimmer" />
      </div>

      {/* Body placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-full surface shimmer rounded" />
            <div className="h-4 w-5/6 surface shimmer rounded" />
            <div className="h-4 w-4/6 surface shimmer rounded" />
          </div>

          <div className="h-28 rounded-xl surface shimmer" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl surface shimmer" />
            ))}
          </div>
        </div>

        {/* Right column sticky provider placeholder */}
        <div className="h-64 rounded-xl surface shimmer" />
      </div>
    </div>
  );
}
