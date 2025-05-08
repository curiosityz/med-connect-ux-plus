import React, { createContext, useReducer, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';
import { searchReducer, initialSearchState, SearchState, SearchAction, SearchFilters, SearchResultProvider } from '../reducers/searchReducer';
import { ApiError, apiClient, SearchApiParams, PaginatedProvidersApiResponse } from '@/lib/api-client';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchContextType {
  searchState: SearchState;
  searchDispatch: React.Dispatch<SearchAction>;
  performSearch: (filtersToUse: SearchFilters, isLoadMore?: boolean) => Promise<void>; // Accept filters directly
  fetchSuggestions: (query: string) => Promise<void>;
  updateFilters: (filters: Partial<SearchFilters>) => void; // Still used for individual filter updates
  clearSearch: () => void;
  loadMoreResults: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchState, searchDispatch] = useReducer(searchReducer, initialSearchState);

  // performSearch now uses the filters passed directly as arguments
  const performSearch = useCallback(async (filtersToUse: SearchFilters, isLoadMore: boolean = false) => {
    // Set loading state based on whether it's a new search or load more
    searchDispatch({ type: 'SET_SEARCH_LOADING', payload: true });
    if (isLoadMore) {
        searchDispatch({ type: 'LOAD_MORE_REQUEST' }); // Signal intent for load more specifically
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
      limit: filtersToUse.limit || searchState.pagination.limit, // Use limit from filters or state
      // Use nextCursor from *current* state only if loading more
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
      const response: PaginatedProvidersApiResponse = await apiClient.findProviders(apiParams);

      const newPaginationState: SearchState['pagination'] = {
        // If loading more, increment page, otherwise reset to 1
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
        // When performing a new search, update the filters in the state to match what was used
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
      } else if (error instanceof Error) {
        searchDispatch({ type: 'SET_SEARCH_ERROR', payload: new ApiError(error.message, 0) });
      } else {
        searchDispatch({ type: 'SET_SEARCH_ERROR', payload: new ApiError('An unknown error occurred during search', 0) });
      }
    } finally {
      searchDispatch({ type: 'SET_SEARCH_LOADING', payload: false });
    }
  // Dependencies: Include pagination state needed for calculations
  }, [searchState.pagination.limit, searchState.pagination.nextCursor, searchState.pagination.currentPage]);


  // No automatic search useEffect needed here anymore

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      searchDispatch({ type: 'SET_SUGGESTIONS', payload: [] });
      return;
    }
    try {
      console.log('Fetching suggestions for:', query);
      const suggestions = await apiClient.getDrugSuggestions(query);
      searchDispatch({ type: 'SET_SUGGESTIONS', payload: suggestions });
    } catch (error: unknown) {
      console.error('Suggestion fetch error:', error);
      searchDispatch({ type: 'SET_SUGGESTIONS', payload: [] });
    }
  }, []); // apiClient is stable

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    // This just updates the state, search is triggered manually
    searchDispatch({ type: 'UPDATE_FILTERS', payload: newFilters });
  }, []);

  const clearSearch = useCallback(() => {
    searchDispatch({ type: 'CLEAR_SEARCH_STATE' });
  }, []);

  const loadMoreResults = useCallback(() => {
    if (searchState.pagination.nextCursor && !searchState.isLoading) {
        console.log("Triggering Load More Search");
        // Call performSearch directly, passing current filters and indicating load more
        performSearch(searchState.filters, true);
    } else {
        console.log("Load more conditions not met:", { next: searchState.pagination.nextCursor, loading: searchState.isLoading });
    }
  // Depend on state needed and performSearch reference
  }, [searchState.pagination.nextCursor, searchState.isLoading, searchState.filters, performSearch]);

  return (
    <SearchContext.Provider value={{
      searchState,
      searchDispatch,
      performSearch, // Expose performSearch
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