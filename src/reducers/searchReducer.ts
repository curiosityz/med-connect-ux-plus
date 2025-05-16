
// Update the SearchReducer to have a token field
import { Provider } from '@/lib/supabase';
import { ApiError } from '@/lib/api-client';

export interface SearchFilters {
  drugName?: string;
  zipCode?: string;
  locationName?: string;
  radius?: number;
  minClaims?: number;
  taxonomyClass?: string;
  sortBy?: 'distance' | 'claims' | 'name';
  acceptedInsurance?: string[];
  minRating?: number;
  token?: string | null; // Add token field
}

export interface SearchPagination {
  nextCursor: string | number | null;
  totalCount: number;
}

export interface SearchState {
  filters: SearchFilters;
  results: Provider[];
  suggestions: string[];
  isLoading: boolean;
  error: ApiError | null;
  pagination: SearchPagination;
  token: string | null; // Add token field at the state level
}

export const initialSearchState: SearchState = {
  filters: {
    drugName: '',
    zipCode: '',
    locationName: undefined,
    radius: 10,
    minClaims: undefined,
    taxonomyClass: undefined,
    sortBy: 'distance',
    acceptedInsurance: [],
    minRating: 0,
    token: null, // Initialize token as null
  },
  results: [],
  suggestions: [],
  isLoading: false,
  error: null,
  pagination: {
    nextCursor: null,
    totalCount: 0,
  },
  token: null, // Initialize token as null
};

export type SearchAction =
  | { type: 'UPDATE_FILTERS'; payload: Partial<SearchFilters> }
  | { type: 'SEARCH_REQUEST' }
  | { 
      type: 'SEARCH_SUCCESS';
      payload: {
        results: Provider[];
        pagination: SearchPagination;
      }
    }
  | { 
      type: 'SEARCH_MORE_SUCCESS';
      payload: {
        results: Provider[];
        pagination: SearchPagination;
      }
    }
  | { type: 'SEARCH_FAILURE'; payload: ApiError }
  | { type: 'FETCH_SUGGESTIONS_REQUEST' }
  | { type: 'FETCH_SUGGESTIONS_SUCCESS'; payload: string[] }
  | { type: 'FETCH_SUGGESTIONS_FAILURE'; payload: string }
  | { type: 'UPDATE_TOKEN'; payload: string | null }; // Add UPDATE_TOKEN action

export const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
        // If updating token in filter, also update it in state
        token: action.payload.token !== undefined ? action.payload.token : state.token,
      };
      
    case 'SEARCH_REQUEST':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
      
    case 'SEARCH_SUCCESS':
      return {
        ...state,
        results: action.payload.results,
        pagination: action.payload.pagination,
        isLoading: false,
        error: null,
      };
      
    case 'SEARCH_MORE_SUCCESS':
      return {
        ...state,
        results: [...state.results, ...action.payload.results],
        pagination: action.payload.pagination,
        isLoading: false,
        error: null,
      };
      
    case 'SEARCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
      
    case 'FETCH_SUGGESTIONS_REQUEST':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
      
    case 'FETCH_SUGGESTIONS_SUCCESS':
      return {
        ...state,
        suggestions: action.payload,
        isLoading: false,
        error: null,
      };
      
    case 'FETCH_SUGGESTIONS_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: {
          message: action.payload,
          status: 0,
          name: 'ApiError'
        },
      };
      
    case 'UPDATE_TOKEN':
      return {
        ...state,
        token: action.payload,
        filters: {
          ...state.filters,
          token: action.payload,
        },
      };
      
    default:
      return state;
  }
};
