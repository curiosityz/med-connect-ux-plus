import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { searchReducer, SearchState, SearchAction, initialSearchState, SearchFilters } from '@/reducers/searchReducer';
import { apiClient, SearchApiParams } from '@/lib/api-client';

interface SearchContextProps {
  searchState: SearchState;
  dispatch: React.Dispatch<SearchAction>;
  updateFilters: (filters: Partial<SearchFilters>) => void;
  performSearch: (searchParams: SearchFilters, loadMore: boolean) => Promise<void>;
  loadMoreResults: () => Promise<void>;
}

const SearchContext = createContext<SearchContextProps | undefined>(undefined);

interface SearchProviderProps {
  children: React.ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [searchState, dispatch] = useReducer(searchReducer, initialSearchState);
  const { filters, pagination } = searchState;

  const updateFilters = useCallback((filters: Partial<SearchFilters>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  }, [dispatch]);

  const performSearch = useCallback(async (searchParams: SearchFilters, loadMore: boolean) => {
    if (!loadMore) {
      dispatch({ type: 'SEARCH_REQUEST' });
    }

    try {
      const apiParams: SearchApiParams = {
        drugName: searchParams.drugName || '',
        zipCode: searchParams.zipCode || '',
        locationName: searchParams.locationName,
        radiusMiles: searchParams.radius,
        minClaims: searchParams.minClaims,
        taxonomyClass: searchParams.taxonomyClass,
        sortBy: searchParams.sortBy,
        acceptedInsurance: searchParams.acceptedInsurance,
        minRating: searchParams.minRating,
        cursor: searchParams.cursor,
        limit: 10,
        token: searchParams.token
      };

      const results = await apiClient.findProviders(apiParams, searchParams.token);

      dispatch({
        type: loadMore ? 'SEARCH_MORE_SUCCESS' : 'SEARCH_SUCCESS',
        payload: {
          results: results.data,
          pagination: {
            nextCursor: results.nextCursor,
            totalCount: results.totalCount,
          },
        },
      });
    } catch (error: any) {
      dispatch({ type: 'SEARCH_FAILURE', payload: error });
    }
  }, [dispatch]);

  // Inside the useSearch hook or the SearchProvider component, update the loadMoreResults function
  const loadMoreResults = useCallback(async () => {
    if (!pagination.nextCursor || searchState.isLoading) return;

    dispatch({ type: 'SEARCH_REQUEST' });

    try {
      const nextParams: SearchFilters = {
        ...filters,
        cursor: pagination.nextCursor,
      };

      // Fix TypeScript error by ensuring drugName is not undefined
      const apiParams: SearchApiParams = {
        drugName: nextParams.drugName || '', // Ensure drugName is not undefined
        zipCode: nextParams.zipCode || '',
        locationName: nextParams.locationName,
        radiusMiles: nextParams.radius,
        minClaims: nextParams.minClaims,
        taxonomyClass: nextParams.taxonomyClass,
        sortBy: nextParams.sortBy,
        acceptedInsurance: nextParams.acceptedInsurance,
        minRating: nextParams.minRating,
        cursor: nextParams.cursor,
        limit: 10,
        token: nextParams.token
      };

      const results = await apiClient.findProviders(apiParams, nextParams.token);

      dispatch({
        type: 'SEARCH_MORE_SUCCESS',
        payload: {
          results: results.data,
          pagination: {
            nextCursor: results.nextCursor,
            totalCount: results.totalCount,
          },
        },
      });
    } catch (error: any) {
      dispatch({ type: 'SEARCH_FAILURE', payload: error });
    }
  }, [dispatch, filters, searchState.isLoading, pagination.nextCursor]);

  const value: SearchContextProps = {
    searchState,
    dispatch,
    updateFilters,
    performSearch,
    loadMoreResults,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = (): SearchContextProps => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
