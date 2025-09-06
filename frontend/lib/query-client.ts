'use client';

import { QueryClient } from '@tanstack/react-query';

// Create a stable query client instance
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache patient data for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep data in cache for 10 minutes after component unmounts
        gcTime: 10 * 60 * 1000,
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error && 'status' in error && typeof error.status === 'number') {
            return error.status >= 500 && failureCount < 2;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Singleton query client for client-side usage
let queryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!queryClient) {
      queryClient = createQueryClient();
    }
    return queryClient;
  }
}