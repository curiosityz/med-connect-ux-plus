import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

// This function assumes the backend endpoint /api/drug-suggestions?q=... exists
// and requires authentication.
const fetchDrugSuggestions = async (query: string, token: string | null): Promise<string[]> => {
  if (query.length < 2) { // Only fetch if query is long enough
    return [];
  }
  // Pass the token to the apiClient method
  return apiClient.getDrugSuggestions(query, token);
};

// Exporting as a named export
export const useDrugSuggestions = (query: string) => {
  const { authState } = useAuth(); // Get auth state
  const token = authState.token; // Extract token

  // Include token in the queryKey ONLY if it exists, to avoid re-fetching just for token changes
  // However, for simplicity and ensuring auth is checked, we might include a boolean flag or user ID
  // A stable query key is important. Let's use user ID if available.
  const queryKey = ['drugSuggestions', query, authState.user?.id ?? 'anonymous'];

  return useQuery<string[], ApiError>({
    queryKey: queryKey,
    // Pass the token to the query function
    queryFn: () => fetchDrugSuggestions(query, token),
    // Enable only if query is long enough AND user is authenticated (token exists)
    enabled: query.length >= 2 && !!token,
    staleTime: 5 * 60 * 1000, // Cache suggestions for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep data in cache longer
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1, // Retry once on failure
  });
};