import React from 'react';
import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-12 h-12 text-[#f5a524] animate-spin" />
      <span className="text-secondary text-sm font-medium tracking-wide">
        Loading...
      </span>
    </div>
  );
}
