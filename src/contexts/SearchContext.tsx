
import React, { createContext, useReducer, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';
import { searchReducer, initialSearchState, SearchState, SearchAction, SearchFilters, SearchResultProvider } from '../reducers/searchReducer';
import { ApiError, apiClient, SearchApiParams, PaginatedProvidersApiResponse } from '@/lib/api-client';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface SearchContextType {
  searchState: SearchState;
  searchDispatch: React.Dispatch<SearchAction>;
  performSearch: (filtersToUse: SearchFilters, isLoadMore?: boolean) => Promise<void>;
  fetchSuggestions: (query: string) => Promise<void>;
  updateFilters: (filters: Partial<SearchFilters>) => void;
  clearSearch: () => void;
  loadMoreResults: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchState, searchDispatch] = useReducer(searchReducer, initialSearchState);
  const { authState } = useAuth();

  const performSearch = useCallback(async (filtersToUse: SearchFilters, isLoadMore: boolean = false) => {
    searchDispatch({ type: 'SET_SEARCH_LOADING', payload: true });
    if (isLoadMore) {
        searchDispatch({ type: 'LOAD_MORE_REQUEST' });
    }

    const apiParams: SearchApiParams = {
      drugName: filtersToUse.drugName || '',
      radiusMiles: filtersToUse.radius,
      minClaims: filtersToUse.minClaims,
      taxonomyClass: filtersToUse.taxonomyClass,
      sortBy: filtersToUse.sortBy,
      zipCode: filtersToUse.zipCode || '',
      locationName: filtersToUse.locationName,
      acceptedInsurance: filtersToUse.acceptedInsurance && filtersToUse.acceptedInsurance.length > 0 ? filtersToUse.acceptedInsurance : undefined,
      minRating: filtersToUse.minRating && filtersToUse.minRating > 0 ? filtersToUse.minRating : undefined,
      limit: filtersToUse.limit || searchState.pagination.limit,
      cursor: isLoadMore ? searchState.pagination.nextCursor : undefined,
    };

    // Basic validation
    if (!apiParams.drugName || (!apiParams.zipCode && !apiParams.locationName)) {
      searchDispatch({ type: 'SET_SEARCH_ERROR', payload: new ApiError("Drug name and location are required to search.", 400) });
      searchDispatch({ type: 'SET_SEARCH_LOADING', payload: false });
      if (!isLoadMore) {
        searchDispatch({
          type: 'SET_SEARCH_RESULTS',
          payload: { results: [], pagination: { ...initialSearchState.pagination, limit: apiParams.limit || initialSearchState.pagination.limit } },
        });
      }
      return;
    }

    try {
      console.log(`Performing API search (isLoadMore: ${isLoadMore}) with params:`, apiParams);
      
      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseToken = session?.access_token;
      
      // Use either the Clerk token or the Supabase token, with fallback
      const token = authState.token || supabaseToken;
      
      if (!token) {
        console.warn('No authentication token available for API search');
        toast({
          title: "Authentication Required",
          description: "Please sign in to perform searches.",
          variant: "destructive",
        });
        searchDispatch({ type: 'SET_SEARCH_LOADING', payload: false });
        return;
      }
      
      const response: PaginatedProvidersApiResponse = await apiClient.findProviders(apiParams, token);

      const newPaginationState: SearchState['pagination'] = {
        currentPage: isLoadMore && response.nextCursor ? searchState.pagination.currentPage + 1 : 1,
        totalResults: response.totalCount,
        nextCursor: response.nextCursor,
        limit: apiParams.limit || searchState.pagination.limit,
        totalPages: Math.ceil(response.totalCount / (apiParams.limit || searchState.pagination.limit)),
      };

      if (isLoadMore) {
        searchDispatch({
          type: 'APPEND_SEARCH_RESULTS',
          payload: { results: response.data, pagination: { nextCursor: response.nextCursor, totalResults: response.totalCount } },
        });
      } else {
        searchDispatch({ type: 'UPDATE_FILTERS', payload: filtersToUse });
        searchDispatch({
          type: 'SET_SEARCH_RESULTS',
          payload: { results: response.data, pagination: newPaginationState },
        });
      }
    } catch (error: unknown) {
      console.error('API Search error:', error);
      if (error instanceof ApiError) {
        searchDispatch({ type: 'SET_SEARCH_ERROR', payload: error });
        toast({
          title: "Search Error", 
          description: error.message,
          variant: "destructive",
        });
      } else if (error instanceof Error) {
        searchDispatch({ type: 'SET_SEARCH_ERROR', payload: new ApiError(error.message, 0) });
        toast({
          title: "Search Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        searchDispatch({ type: 'SET_SEARCH_ERROR', payload: new ApiError('An unknown error occurred during search', 0) });
        toast({
          title: "Search Error",
          description: "An unknown error occurred during search",
          variant: "destructive",
        });
      }
    } finally {
      searchDispatch({ type: 'SET_SEARCH_LOADING', payload: false });
    }
  }, [searchState.pagination.limit, searchState.pagination.nextCursor, searchState.pagination.currentPage, authState.token]);


  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      searchDispatch({ type: 'SET_SUGGESTIONS', payload: [] });
      return;
    }
    try {
      // Get auth token from Supabase session as fallback
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseToken = session?.access_token;
      
      // Use either the Clerk token or the Supabase token, with fallback
      const token = authState.token || supabaseToken;
      
      if (!token) {
        console.warn('No authentication token available for drug suggestions');
        searchDispatch({ type: 'SET_SUGGESTIONS', payload: [] });
        return;
      }
      
      console.log('Fetching suggestions for:', query);
      const suggestions = await apiClient.getDrugSuggestions(query, token);
      searchDispatch({ type: 'SET_SUGGESTIONS', payload: suggestions });
    } catch (error: unknown) {
      console.error('Suggestion fetch error:', error);
      searchDispatch({ type: 'SET_SUGGESTIONS', payload: [] });
    }
  }, [authState.token]);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    searchDispatch({ type: 'UPDATE_FILTERS', payload: newFilters });
  }, []);

  const clearSearch = useCallback(() => {
    searchDispatch({ type: 'CLEAR_SEARCH_STATE' });
  }, []);

  const loadMoreResults = useCallback(() => {
    if (searchState.pagination.nextCursor && !searchState.isLoading) {
        console.log("Triggering Load More Search");
        performSearch(searchState.filters, true);
    } else {
        console.log("Load more conditions not met:", { next: searchState.pagination.nextCursor, loading: searchState.isLoading });
    }
  }, [searchState.pagination.nextCursor, searchState.isLoading, searchState.filters, performSearch]);

  return (
    <SearchContext.Provider value={{
      searchState,
      searchDispatch,
      performSearch,
      fetchSuggestions,
      updateFilters,
      clearSearch,
      loadMoreResults
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
