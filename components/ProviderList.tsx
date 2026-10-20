'use client';

import React from 'react';
import Image from 'next/image';
import { IMG_BASE } from '@/lib/tmdb';

interface ProviderItem {
  provider_name: string;
  logo_path: string;
  display_priority?: number;
}

interface ProviderListProps {
  providers: {
    flatrate: ProviderItem[] | null;
    rent: ProviderItem[] | null;
    buy: ProviderItem[] | null;
  } | null;
}

function ProviderRow({
  title,
  items,
}: {
  title: string;
  items: ProviderItem[] | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">
        {title}
      </span>
      {items && items.length > 0 ? (
        <div className="flex flex-wrap gap-2.5">
          {items.map((provider) => (
            <div
              key={provider.provider_name}
              className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0 shadow-sm transition-transform hover:scale-105"
              title={provider.provider_name}
            >
              <Image
                src={`${IMG_BASE}/w92${provider.logo_path}`}
                alt={provider.provider_name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : (
        <span className="text-xs text-[#71717a]">Not available</span>
      )}
    </div>
  );
}

export default function ProviderList({ providers }: ProviderListProps) {
  if (
    !providers ||
    (!providers.flatrate?.length && !providers.rent?.length && !providers.buy?.length)
  ) {
    return (
      <div className="glass rounded-xl p-4 text-center">
        <p className="text-sm text-[#a1a1aa]">
          Not available on OTT in India right now
        </p>
      </div>
    );
  }

  return (
    <div className="glass surface rounded-xl p-4 flex flex-col gap-4">
      <ProviderRow title="Stream" items={providers.flatrate} />
      <ProviderRow title="Rent" items={providers.rent} />
      <ProviderRow title="Buy" items={providers.buy} />
    </div>
  );
}
