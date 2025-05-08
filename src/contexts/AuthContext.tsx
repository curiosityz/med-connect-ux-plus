import React, { createContext, useReducer, useContext, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { authReducer, initialAuthState, AuthState, AuthAction } from '../reducers/authReducer';
import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/api-client'; // Import apiClient

interface AuthContextType {
  authState: AuthState;
  authDispatch: React.Dispatch<AuthAction>;
  signIn: (credentials: { email?: string; password?: string; provider?: 'google' | 'facebook' }) => Promise<void>;
  signUp: (credentials: { email?: string; password?: string; provider?: 'google' | 'facebook' }, metadata?: Record<string, any>) => Promise<void>;
  signOut: () => Promise<void>;
  // syncUserToCustomBackend: (token: string) => Promise<void>; // Old signature
  syncUserToCustomBackend: (user: User) => Promise<void>; // New signature
  fetchUserTier: (userId: string) => Promise<AuthState['userTier']>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, authDispatch] = useReducer(authReducer, initialAuthState);

  const syncUserToCustomBackend = async (user: User) => {
    try {
      console.log('Syncing user to custom backend:', user.id, user.email);
      const response = await apiClient.syncUser({
        supabase_user_id: user.id,
        email: user.email,
      });
      if (!response.success) {
        console.warn('Failed to sync user to custom backend:', response.message, response.data);
        // Decide if this should be a critical error that logs the user out or just a warning
      }
      console.log('User sync response:', response);
    } catch (error) {
      console.error('Error syncing user to custom backend:', error);
      // Handle error appropriately, maybe dispatch a specific error action
      // For now, we'll let the login/session check proceed but log the error
      throw error; // Re-throw to be caught by calling function if needed
    }
  };

  const fetchUserTier = async (userId: string): Promise<AuthState['userTier']> => {
    try {
      console.log('Fetching user tier for userId:', userId);
      const response = await apiClient.fetchUserMembership(userId);
      // Assuming response.membershipTier is 'basic', 'premium', 'expert', or null
      return response.membershipTier;
    } catch (error) {
      console.error('Error fetching user tier:', error);
      // Return null or a default tier in case of error
      return null;
    }
  };

  useEffect(() => {
    const checkUserSession = async () => {
      authDispatch({ type: 'LOGIN_REQUEST' });
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        authDispatch({ type: 'LOGIN_FAILURE', payload: error.message });
        return;
      }

      if (session?.user && session.access_token) {
        try {
          await syncUserToCustomBackend(session.user); // Pass user object
          const tier = await fetchUserTier(session.user.id);
          authDispatch({ type: 'LOGIN_SUCCESS', payload: { user: session.user, token: session.access_token, tier } });
        } catch (syncError: any) {
          console.error('Error during post-login sync or tier fetch:', syncError);
          // If sync fails, we might still want to log the user in on the frontend,
          // but with a warning or limited functionality. Or log them out.
          // For now, logging them in but with an error state for the sync.
          authDispatch({ type: 'LOGIN_FAILURE', payload: syncError.message || 'Failed to sync user or fetch tier' });
        }
      } else {
        authDispatch({ type: 'LOGOUT' }); // No active session or user
      }
    };

    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'SIGNED_IN' && session?.user && session.access_token) {
        try {
          await syncUserToCustomBackend(session.user); // Pass user object
          const tier = await fetchUserTier(session.user.id);
          authDispatch({ type: 'LOGIN_SUCCESS', payload: { user: session.user, token: session.access_token, tier } });
        } catch (syncError: any) {
          console.error('Error during post-SIGN_IN sync or tier fetch:', syncError);
          // Potentially dispatch a specific error or update UI to indicate sync issue
        }
      } else if (_event === 'SIGNED_OUT') {
        authDispatch({ type: 'LOGOUT' });
      } else if (_event === 'TOKEN_REFRESHED' && session?.access_token) {
        authDispatch({ type: 'TOKEN_REFRESH_SUCCESS', payload: { token: session.access_token } });
      }
      // Potentially handle other events like USER_UPDATED, PASSWORD_RECOVERY
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [authDispatch]);


  const signIn = async (credentials: { email?: string; password?: string; provider?: 'google' | 'facebook' }) => {
    authDispatch({ type: 'LOGIN_REQUEST' });
    try {
      let authResponse;
      if (credentials.provider) {
        authResponse = await supabase.auth.signInWithOAuth({ provider: credentials.provider });
      } else if (credentials.email && credentials.password) {
        authResponse = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
      } else {
        throw new Error('Invalid sign-in credentials provided.');
      }

      const { data, error } = authResponse;

      if (error) throw error;
      if (!data.user || !data.session?.access_token) throw new Error('Sign-in successful but no user or token received.');
      
      // User and token are set by onAuthStateChange listener
      // await syncUserToCustomBackend(data.session.access_token);
      // const tier = await fetchUserTier(data.user.id);
      // authDispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.session.access_token, tier } });

    } catch (error: any) {
      console.error('Sign-in error:', error);
      authDispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      throw error; // Re-throw to be caught by UI
    }
  };

  const signUp = async (credentials: { email?: string; password?: string; provider?: 'google' | 'facebook' }, metadata: Record<string, any> = {}) => {
    authDispatch({ type: 'LOGIN_REQUEST' });
    try {
      let authResponse;
      if (credentials.provider) {
        // For OAuth, sign-up is often handled by the first sign-in attempt
        authResponse = await supabase.auth.signInWithOAuth({
          provider: credentials.provider
          // Metadata for OAuth is typically handled post-authentication
          // or via custom claims in Supabase settings.
        });
      } else if (credentials.email && credentials.password) {
        authResponse = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: { data: metadata },
        });
      } else {
        throw new Error('Invalid sign-up credentials provided.');
      }
      
      const { data, error } = authResponse;

      if (error) throw error;
      // For email/password, user might need verification. Session might not be active immediately.
      // The onAuthStateChange listener will handle SIGNED_IN event if auto-verification is on or after verification.
      if (data.user && data.session?.access_token) {
        // This case is more for OAuth or if email verification is disabled/auto
        // await syncUserToCustomBackend(data.session.access_token);
        // const tier = await fetchUserTier(data.user.id);
        // authDispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.session.access_token, tier } });
      } else if (data.user && !data.session) {
        // User created but needs verification
        console.log('User created, awaiting verification:', data.user.email);
        // UI should inform the user to check their email
      } else if (!data.user) {
        throw new Error('Sign-up successful but no user data received.');
      }

    } catch (error: any) {
      console.error('Sign-up error:', error);
      authDispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      throw error; // Re-throw to be caught by UI
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign-out error:', error);
      // Even if Supabase signout fails, dispatch logout to clear client state
      authDispatch({ type: 'LOGOUT' });
      throw error;
    }
    // State update is handled by onAuthStateChange listener
  };

  return (
    <AuthContext.Provider value={{ authState, authDispatch, signIn, signUp, signOut, syncUserToCustomBackend, fetchUserTier }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};