
import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { supabase } from '@/lib/supabase';

export interface ProviderSearchParams {
  query?: string;
  specialty?: string;
  location?: string;
  medication?: string;
  page?: number;
  limit?: number;
}

export interface ProviderSearchResult {
  id: string;
  npi: string;
  name: string;
  specialties: string[];
  city: string;
  state: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
}

export const useProviderSearch = (initialParams: ProviderSearchParams = {}) => {
  const [params, setParams] = useState<ProviderSearchParams>(initialParams);
  const [results, setResults] = useState<ProviderSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Debounce search query to prevent too many requests
  const debouncedQuery = useDebounce(params.query, 300);
  
  // Flag to track if search is currently in progress
  const [isSearching, setIsSearching] = useState(false);
  
  // Make searchProviders method accessible externally and prevent automatic search
  const searchProviders = useCallback(async (searchParams: ProviderSearchParams) => {
    // Prevent concurrent searches
    if (isSearching) {
      console.log('Search already in progress. Ignoring duplicate request.');
      return;
    }
    
    setIsSearching(true);
    setLoading(true);
    setError(null);
    
    try {
      // Default to first page if not specified
      const page = searchParams.page || 1;
      const limit = searchParams.limit || 10;
      const startIndex = (page - 1) * limit;
      
      console.log('Executing provider search with params:', searchParams);
      
      let query = supabase
        .from('providers')
        .select('id, npi, name, first_name, last_name, specialties, city, state, rating, review_count, image_url', { count: 'exact' });
      
      // Add filters based on search parameters
      if (searchParams.query) {
        query = query.ilike('name', `%${searchParams.query}%`);
      }
      
      if (searchParams.specialty) {
        query = query.contains('specialties', [searchParams.specialty]);
      }
      
      if (searchParams.location) {
        query = query.or(`city.ilike.%${searchParams.location}%,state.ilike.%${searchParams.location}%`);
      }
      
      // Handle pagination
      query = query.range(startIndex, startIndex + limit - 1);
      
      // Execute the query
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setResults(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      console.error('Provider search error:', err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [isSearching]);
  
  // Remove automatic search to prevent thousands of API calls
  // Instead, expose searchProviders for explicit calling
  
  // Update search parameters
  const updateSearchParams = (newParams: Partial<ProviderSearchParams>) => {
    setParams(prev => ({
      ...prev,
      ...newParams,
      // Reset to page 1 when search criteria change (not when just changing pages)
      page: newParams.page || (newParams.query !== undefined || 
                              newParams.specialty !== undefined || 
                              newParams.location !== undefined || 
                              newParams.medication !== undefined) ? 1 : prev.page
    }));
  };
  
  return {
    results,
    loading,
    error,
    totalCount,
    params,
    updateSearchParams,
    searchProviders
  };
};
