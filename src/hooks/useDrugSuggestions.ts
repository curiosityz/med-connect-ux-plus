
import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { apiClient } from '@/lib/api-client';
import { useClerkAuth } from './useClerkAuth';

// Local cache to prevent excessive API calls
const suggestionCache: Record<string, string[]> = {};

export const useDrugSuggestions = (query: string, enabled = true, minLength = 3) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const { getToken } = useClerkAuth();

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Don't fetch if disabled, empty query, or query too short
      if (!enabled || !debouncedQuery || debouncedQuery.length < minLength) {
        setSuggestions([]);
        return;
      }

      // Check cache first
      const cacheKey = debouncedQuery.toLowerCase();
      if (suggestionCache[cacheKey]) {
        setSuggestions(suggestionCache[cacheKey]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const results = await apiClient.getDrugSuggestions(debouncedQuery, token);
        
        // Cache the results
        suggestionCache[cacheKey] = results;
        
        setSuggestions(results);
      } catch (err) {
        console.error('Error fetching drug suggestions:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch suggestions'));
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, enabled, getToken, minLength]);

  return { suggestions, isLoading, error };
};
