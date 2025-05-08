import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { apiClient, SearchApiParams, ApiError } from '@/lib/api-client';
import { Provider } from '@/lib/supabase'; // Assuming Provider type is defined here

// Define the expected structure of the API response for a single page
// This needs to match what the backend WILL return after modification
interface PaginatedProvidersResponse {
  data: Provider[];
  nextCursor?: string | number | null;
  totalCount?: number; // Optional but helpful
}

// The API function that will be called by React Query
// It now needs to handle pagination parameters (cursor/limit)
}

export const useProviderSearch = ({ searchParams, enabled = true }: UseProviderSearchOptions) => {
  // Query key depends on the search parameters
  const queryKey = ['providers', searchParams];

  const {
    data: providers = [], // Default to empty array
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<Provider[], ApiError>({ // Use standard useQuery types
    queryKey: queryKey,
    queryFn: () => fetchProviders(searchParams),
    enabled: enabled, // Use the passed enabled flag
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // Keep longer in cache
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    providers,
    isLoading: isLoading || isRefetching, // Combine loading states
    isError,
    error,
    refetch, // Expose refetch
    // Pagination-related returns are removed
  };
};
