
import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { apiClient } from '@/lib/api-client';
import { useClerkAuth } from './useClerkAuth';

// Local cache to prevent excessive API calls
const suggestionCache: Record<string, string[]> = {};

export const useDrugSuggestions = (query: string, enabled = true, minLength = 3, manualTrigger = false) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const { getToken } = useClerkAuth();
  const [lastFetchedQuery, setLastFetchedQuery] = useState<string>("");

  // Manual fetch function that can be called explicitly
  const fetchSuggestions = async (forceQuery?: string) => {
    const queryToUse = forceQuery || debouncedQuery;
    
    // Don't fetch if disabled, empty query, or query too short
    if (!enabled || !queryToUse || queryToUse.length < minLength) {
      setSuggestions([]);
      return;
    }

    // Prevent duplicate fetches for the same query
    if (queryToUse === lastFetchedQuery && suggestionCache[queryToUse.toLowerCase()]) {
      return;
    }

    // Check cache first
    const cacheKey = queryToUse.toLowerCase();
    if (suggestionCache[cacheKey]) {
      setSuggestions(suggestionCache[cacheKey]);
      setLastFetchedQuery(queryToUse);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const results = await apiClient.getDrugSuggestions(queryToUse, token);
      
      // Cache the results
      suggestionCache[cacheKey] = results;
      
      setSuggestions(results);
      setLastFetchedQuery(queryToUse);
    } catch (err) {
      console.error('Error fetching drug suggestions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch suggestions'));
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Only auto-fetch if manualTrigger is false
  useEffect(() => {
    // Only auto-fetch if we're explicitly told to do so via manualTrigger=false
    // AND the query meets minimum requirements
    if (!manualTrigger && debouncedQuery && debouncedQuery.length >= minLength && enabled) {
      fetchSuggestions();
    }
  }, [debouncedQuery, enabled, manualTrigger]);

  return { suggestions, isLoading, error, fetchSuggestions };
};
