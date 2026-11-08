'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60000, // 1 minute
            gcTime: 600000, // 10 minutes
            refetchOnWindowFocus: false,
            refetchOnReconnect: false, // don't refetch on reconnect
            refetchOnMount: false, // don't refetch if we already have data
            retry: 1, // only retry once on failure
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
