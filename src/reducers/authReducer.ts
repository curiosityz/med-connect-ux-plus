import { User } from '@supabase/supabase-js';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  userTier: 'basic' | 'premium' | 'expert' | null; // Added userTier
}

export const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
  userTier: null, // Initialize userTier
};

export type AuthAction =
  | { type: 'LOGIN_REQUEST' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; tier: AuthState['userTier'] } } // Added tier
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: { user: User | null; token: string | null; tier: AuthState['userTier'] } } // Added tier
  | { type: 'TOKEN_REFRESH_SUCCESS'; payload: { token: string } }
  | { type: 'UPDATE_USER_TIER'; payload: AuthState['userTier'] }; // Action to update tier

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_REQUEST':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        userTier: action.payload.tier, // Set userTier on login
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        userTier: null, // Reset tier on failure
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...initialAuthState, // Reset to initial state on logout
      };
    case 'SET_USER': // Handles session restoration
      return {
        ...state,
        isAuthenticated: !!action.payload.user,
        user: action.payload.user,
        token: action.payload.token,
        userTier: action.payload.tier, // Set userTier
        loading: false,
      };
    case 'TOKEN_REFRESH_SUCCESS':
      return {
        ...state,
        token: action.payload.token,
      };
    case 'UPDATE_USER_TIER':
      return {
        ...state,
        userTier: action.payload,
      };
    default:
      return state;
  }
};