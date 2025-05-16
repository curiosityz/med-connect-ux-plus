
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { searchReducer, initialSearchState, SearchState, SearchAction } from '../reducers/searchReducer';
import { apiClient, SearchApiParams } from '../lib/api-client';

interface SearchContextType {
  searchState: SearchState;
  updateFilters: (filters: Partial<SearchState['filters']>) => void;
  performSearch: (filters: SearchState['filters'], loadMore: boolean) => Promise<void>;
  loadMoreResults: () => Promise<void>;
  fetchSuggestions: (query: string, token?: string | null) => Promise<void>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchState, dispatch] = useReducer(searchReducer, initialSearchState);

  const updateFilters = (filters: Partial<SearchState['filters']>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  };

  const performSearch = async (filters: SearchState['filters'], loadMore: boolean = false) => {
    try {
      dispatch({ type: 'SEARCH_REQUEST' });
      
      const searchParams: SearchApiParams = {
        drugName: filters.drugName || '',
        zipCode: filters.zipCode || '',
        locationName: filters.locationName,
        radiusMiles: filters.radius,
        minClaims: filters.minClaims,
        taxonomyClass: filters.taxonomyClass || null,
        sortBy: filters.sortBy,
        acceptedInsurance: filters.acceptedInsurance,
        minRating: filters.minRating,
        cursor: loadMore ? searchState.pagination.nextCursor || undefined : undefined,
        limit: 10
      };
      
      // Get token directly from filters
      const token = filters.token;
      
      const response = await apiClient.findProviders(searchParams, token);
      
      dispatch({
        type: loadMore ? 'SEARCH_MORE_SUCCESS' : 'SEARCH_SUCCESS',
        payload: {
          results: response.data,
          pagination: {
            nextCursor: response.nextCursor,
            totalCount: response.totalCount
          }
        }
      });
      
    } catch (error: any) {
      dispatch({ 
        type: 'SEARCH_FAILURE',
        payload: {
          message: error.message || 'An error occurred during search',
          status: error.status || 500,
          name: error.name || 'ApiError',
          data: error.data
        }
      });
      console.error('Search error:', error);
    }
  };
  
  const loadMoreResults = async () => {
    if (searchState.pagination.nextCursor && !searchState.isLoading) {
      return performSearch(searchState.filters, true);
    }
    return Promise.resolve();
  };

  const fetchSuggestions = async (query: string, token?: string | null) => {
    if (!query || query.length < 2) return;
    
    try {
      dispatch({ type: 'FETCH_SUGGESTIONS_REQUEST' });
      
      // Pass the token to the API client
      const suggestions = await apiClient.getDrugSuggestions(query, token);
      dispatch({ type: 'FETCH_SUGGESTIONS_SUCCESS', payload: suggestions });
      
    } catch (error: any) {
      dispatch({ 
        type: 'FETCH_SUGGESTIONS_FAILURE', 
        payload: error.message || 'Failed to fetch suggestions' 
      });
      console.error('Error fetching suggestions:', error);
    }
  };
  
  return (
    <SearchContext.Provider value={{ 
      searchState, 
      updateFilters,
      performSearch,
      loadMoreResults,
      fetchSuggestions
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
