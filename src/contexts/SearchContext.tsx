
import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { SearchFilters, SearchState, initialSearchState, searchReducer } from '@/reducers/searchReducer';
import { apiClient } from '@/lib/api-client';

interface SearchContextType {
  searchState: SearchState;
  updateFilters: (filters: Partial<SearchFilters>) => void;
  performSearch: (filters: SearchFilters, isLoadMore: boolean) => Promise<void>;
  loadMoreResults: () => Promise<void>;
  fetchSuggestions: (query: string, token?: string | null) => Promise<void>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [searchState, dispatch] = useReducer(searchReducer, initialSearchState);
  
  // Added flag to prevent multiple concurrent searches
  let isCurrentlySearching = false;

  const updateFilters = useCallback((filters: Partial<SearchFilters>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  }, []);

  const performSearch = useCallback(async (filters: SearchFilters, isLoadMore: boolean) => {
    // Prevent concurrent searches
    if (isCurrentlySearching) {
      console.log('Search already in progress. Ignoring duplicate request.');
      return;
    }
    
    try {
      isCurrentlySearching = true;
      dispatch({ type: 'SEARCH_REQUEST' });
      
      console.log('Performing search with filters:', filters);
      
      // Extract pagination from filters or use defaults
      const { cursor } = filters;
      
      // Execute search API call
      const response = await apiClient.search({
        ...filters,
        cursor: isLoadMore ? searchState.pagination.nextCursor : cursor
      }, filters.token);
      
      // Dispatch appropriate action based on whether this is a new search or loading more
      if (isLoadMore) {
        dispatch({
          type: 'SEARCH_MORE_SUCCESS',
          payload: {
            results: response.data,
            pagination: {
              nextCursor: response.nextCursor,
              totalCount: response.totalCount
            }
          }
        });
      } else {
        dispatch({
          type: 'SEARCH_SUCCESS',
          payload: {
            results: response.data,
            pagination: {
              nextCursor: response.nextCursor,
              totalCount: response.totalCount
            }
          }
        });
      }
      
      console.log('Search completed successfully');
    } catch (error: any) {
      console.error('Error performing search:', error);
      dispatch({
        type: 'SEARCH_FAILURE',
        payload: error
      });
    } finally {
      isCurrentlySearching = false;
    }
  }, [searchState.pagination.nextCursor]);

  const loadMoreResults = useCallback(async () => {
    // Don't try to load more if already loading or no next cursor
    if (searchState.isLoading || !searchState.pagination.nextCursor) return;
    
    await performSearch(searchState.filters, true);
  }, [performSearch, searchState.filters, searchState.isLoading, searchState.pagination.nextCursor]);

  // Variable to track if suggestions are currently being fetched
  let isFetchingSuggestions = false;

  const fetchSuggestions = useCallback(async (query: string, token?: string | null) => {
    // Prevent concurrent suggestion requests
    if (isFetchingSuggestions) {
      console.log('Already fetching suggestions. Ignoring duplicate request.');
      return;
    }
    
    try {
      isFetchingSuggestions = true;
      dispatch({ type: 'FETCH_SUGGESTIONS_REQUEST' });
      
      const suggestions = await apiClient.fetchDrugSuggestions(query, token);
      
      dispatch({
        type: 'FETCH_SUGGESTIONS_SUCCESS',
        payload: suggestions
      });
      
      console.log('Suggestions fetched successfully');
    } catch (error: any) {
      console.error('Error fetching suggestions:', error);
      dispatch({
        type: 'FETCH_SUGGESTIONS_FAILURE',
        payload: error.message || 'Failed to fetch suggestions'
      });
    } finally {
      isFetchingSuggestions = false;
    }
  }, []);

  return (
    <SearchContext.Provider
      value={{
        searchState,
        updateFilters,
        performSearch,
        loadMoreResults,
        fetchSuggestions
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
