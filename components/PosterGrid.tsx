'use client';

import React from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import PosterCard, { PosterCardProps } from './PosterCard';
import { PosterSkeleton } from './Skeletons';

interface PosterGridProps {
  items: PosterCardProps[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  totalCount: number;
}

const GRID_CLASS_NAME =
  'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-4 pb-12';

export default function PosterGrid({
  items,
  isLoading,
  hasMore,
  onLoadMore,
  totalCount,
}: PosterGridProps) {
  return (
    <div className="w-full">
      {/* Header Result Count */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-xl font-bold text-[#a1a1aa]"
          style={{ fontFamily: 'var(--font-display), serif' }}
        >
          {totalCount.toLocaleString()} {totalCount === 1 ? 'title' : 'titles'}
        </h3>
      </div>

      {/* Initial Loading Skeletons */}
      {isLoading && items.length === 0 ? (
        <div className={GRID_CLASS_NAME}>
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-full aspect-[2/3]">
              <PosterSkeleton />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="w-full min-h-[40vh] flex flex-col items-center justify-center text-center p-8 glass surface">
          <p className="text-lg font-semibold text-[#f4f4f5]">
            No matching titles found
          </p>
          <p className="text-sm text-[#71717a] mt-1 max-w-sm">
            Try adjusting your genre filters, year range, or rating threshold.
          </p>
        </div>
      ) : (
        <VirtuosoGrid
          useWindowScroll
          data={items}
          endReached={() => {
            if (hasMore && !isLoading) {
              onLoadMore();
            }
          }}
          listClassName={GRID_CLASS_NAME}
          itemContent={(index, item) => (
            <div key={`${item.id}-${index}`} className="w-full">
              <PosterCard {...item} />
            </div>
          )}
          components={{
            Footer: () =>
              hasMore ? (
                <div className="col-span-full flex justify-center items-center py-8">
                  <div className="w-6 h-6 border-2 border-[#f5a524] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="col-span-full py-8 text-center text-xs text-[#71717a]">
                  You have reached the end of the shelf.
                </div>
              ),
          }}
        />
      )}
    </div>
  );
}
