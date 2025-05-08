import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';

// This function assumes the backend endpoint /api/drug-suggestions?q=... exists
// We will verify/adjust this after inspecting backend/server.js
const fetchDrugSuggestions = async (query: string): Promise<string[]> => {
  if (query.length < 2) { // Only fetch if query is long enough
    return [];
  }
  // This call might need adjustment based on the actual backend implementation
  return apiClient.getDrugSuggestions(query);
};

// Exporting as a named export
export const useDrugSuggestions = (query: string) => {
  const queryKey = ['drugSuggestions', query];

  return useQuery<string[], ApiError>({
    queryKey: queryKey,
    queryFn: () => fetchDrugSuggestions(query),
    enabled: query.length >= 2, // Only enable the query when the input is long enough
    staleTime: 5 * 60 * 1000, // Cache suggestions for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep data in cache longer
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
  });
};