import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // All queryFns read from local SQLite — no network needed.
      // The sync engine handles populating SQLite from the server.
      // staleTime: 0 ensures invalidateQueries marks queries as stale immediately,
      // and refetchOnMount: true ensures stale queries re-read from SQLite on mount.
      retry: false,
      staleTime: 0,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: true,
    },
  },
});
