import React from 'react';
import FilmLoader from '@/components/FilmLoader';

export default function GlobalLoading() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-3">
      <FilmLoader size="lg" label="Loading..." />
    </div>
  );
}
