import { Provider } from '@/lib/supabase'; // Import the main Provider type
import { ApiError } from '@/lib/api-client'; // Import ApiError

// Use the main Provider type for search results
export type SearchResultProvider = Provider;

export interface SearchFilters {
  drugName?: string;
  locationName?: string; // For premium tier
  zipCode?: string;      // For expert tier or fallback
  radius?: number;
  minClaims?: number;
  taxonomyClass?: string;
  sortBy?: 'distance' | 'claims' | 'name';
  limit?: number; // Added limit to filters
  acceptedInsurance?: string[]; // Added acceptedInsurance
  minRating?: number; // Added minRating
}

export interface SearchState {
  results: SearchResultProvider[];
  isLoading: boolean;
  error: ApiError | null;
  filters: SearchFilters;
  suggestions: string[]; // For typeahead
  pagination: {
    currentPage: number;
    totalPages: number;
    totalResults: number;
    nextCursor: string | number | null;
    limit: number;
  };
  triggerLoadMore: boolean; // Flag to trigger load more effect
}

export const initialSearchState: SearchState = {
  results: [],
  isLoading: false,
  error: null,
  filters: {
    radius: 10,
    minClaims: 0,
    sortBy: 'distance',
    limit: 10,
    acceptedInsurance: [],
    minRating: 0,
  },
  suggestions: [],
  pagination: {
    currentPage: 1,
    totalPages: 0,
    totalResults: 0,
    nextCursor: null,
    limit: 10,
  },
  triggerLoadMore: false, // Initialize flag
};

export type SearchAction =
  | { type: 'SET_SEARCH_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH_RESULTS'; payload: { results: SearchResultProvider[]; pagination: SearchState['pagination'] } }
  | { type: 'APPEND_SEARCH_RESULTS'; payload: { results: SearchResultProvider[]; pagination: Pick<SearchState['pagination'], 'nextCursor' | 'totalResults'> } }
  | { type: 'SET_SEARCH_ERROR'; payload: ApiError | null }
  | { type: 'UPDATE_FILTERS'; payload: Partial<SearchFilters> } // Triggers new search implicitly via useEffect in context
  | { type: 'SET_SUGGESTIONS'; payload: string[] }
  | { type: 'CLEAR_SEARCH_STATE' }
  | { type: 'LOAD_MORE_REQUEST' }; // Action to signal loading more

export const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'SET_SEARCH_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        // Optionally clear error when explicitly setting loading?
        // error: action.payload ? null : state.error,
        // Reset triggerLoadMore if loading is set to false externally?
        triggerLoadMore: action.payload ? state.triggerLoadMore : false,
      };
    case 'SET_SEARCH_RESULTS': // For initial search or page change that replaces results
      return {
        ...state,
        results: action.payload.results,
        pagination: {
          ...state.pagination,
          ...action.payload.pagination,
        },
        isLoading: false,
        triggerLoadMore: false, // Reset flag
        error: null, // Clear error on successful search
      };
    case 'APPEND_SEARCH_RESULTS': // For "load more" / infinite scroll
      return {
        ...state,
        results: [...state.results, ...action.payload.results],
        pagination: {
          ...state.pagination,
          nextCursor: action.payload.pagination.nextCursor,
          totalResults: action.payload.pagination.totalResults,
          currentPage: state.pagination.nextCursor ? state.pagination.currentPage + 1 : state.pagination.currentPage,
        },
        isLoading: false, // Set loading false after append completes
        triggerLoadMore: false, // Reset flag
        error: null, // Clear error on successful append
      };
    case 'LOAD_MORE_REQUEST':
        // Set loading state, clear error, set trigger flag
        if (state.isLoading || !state.pagination.nextCursor) return state; // Don't trigger if already loading or no next page
        return {
            ...state,
            isLoading: true,
            error: null,
            triggerLoadMore: true, // Set flag for effect hook
        };
    case 'SET_SEARCH_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        triggerLoadMore: false, // Reset flag on error
        // results: [], // Decide if results should be cleared on error
      };
    case 'UPDATE_FILTERS':
      // When filters update, reset pagination and trigger a new search implicitly via useEffect
      return {
          ...state,
          filters: {
              ...state.filters,
              ...action.payload,
          },
          pagination: { // Reset pagination for new search
              ...initialSearchState.pagination,
              limit: state.pagination.limit, // Keep current limit
          },
          isLoading: true, // Set loading true for the new search
          error: null,
          triggerLoadMore: false, // Ensure load more isn't triggered
      };
    case 'SET_SUGGESTIONS':
      return {
        ...state,
        suggestions: action.payload,
      };
    case 'CLEAR_SEARCH_STATE':
      return {
        ...initialSearchState,
        // Optionally preserve some filters like limit?
        filters: { ...initialSearchState.filters, limit: state.filters.limit || initialSearchState.filters.limit },
        pagination: { ...initialSearchState.pagination, limit: state.pagination.limit || initialSearchState.pagination.limit }
      };
    default:
      return state;
  }
};