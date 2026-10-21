'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function MoviesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Movies Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-10 md:p-12 text-center max-w-md w-full border border-white/10 shadow-2xl flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 text-red-400">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h2
          className="text-2xl font-bold text-[#f4f4f5]"
          style={{ fontFamily: 'var(--font-display), serif' }}
        >
          Something went wrong
        </h2>

        <p className="text-sm text-[#71717a] mt-2 font-mono break-words max-w-full">
          {error.message || 'Failed to load movie collection.'}
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#f5a524] hover:bg-[#e0961f] text-[#07070b] font-semibold text-sm transition-all shadow-[0_0_20px_rgba(245,165,36,0.25)] hover:shadow-[0_0_25px_rgba(245,165,36,0.4)]"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try again</span>
        </button>
      </div>
    </div>
  );
}
