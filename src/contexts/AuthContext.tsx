import React, { createContext, useReducer, useContext, useEffect, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authReducer, initialAuthState, AuthState, AuthAction } from '../reducers/authReducer';
import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/api-client';

interface AuthContextType {
  authState: AuthState;
  authDispatch: React.Dispatch<AuthAction>;
  signIn: (credentials: { email?: string; password?: string; provider?: 'google' | 'facebook' }) => Promise<void>;
  signUp: (credentials: { email?: string; password?: string; provider?: 'google' | 'facebook' }, metadata?: Record<string, any>) => Promise<void>;
  signOut: () => Promise<void>;
  // Internal functions are no longer part of the public context type
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, authDispatch] = useReducer(authReducer, initialAuthState);
  const lastProcessedUserId = useRef<string | null>(null);
  const processingAuthEvent = useRef<boolean>(false);

  // Internal helper function to sync user and fetch tier, requires token
  const syncAndFetchTier = async (user: User, token: string | null): Promise<AuthState['userTier']> => {
    // Check if token is actually present before proceeding
    if (!token) {
      console.error('syncAndFetchTier called without a valid token.');
      // Decide how to handle this - maybe dispatch a specific error?
      // For now, return null, indicating tier couldn't be fetched.
      return null;
      // Or: throw new Error('Authentication token is missing for sync/fetch.');
    }

    try {
      console.log('Syncing user to custom backend:', user.id, user.email);
      // Pass the token explicitly to apiClient.syncUser
      const syncResponse = await apiClient.syncUser({
        supabase_user_id: user.id,
        email: user.email,
      }, token); // Pass token here

      if (!syncResponse.success) {
        console.warn('Failed to sync user to custom backend:', syncResponse.message, syncResponse.data);
        if (syncResponse.message?.includes('duplicate key value violates unique constraint')) {
          console.log('User profile likely already exists, sync skipped.');
        } else {
          // Consider logging the user out or showing a persistent error for other sync failures
          console.error('Critical user sync failure:', syncResponse.message);
          // Potentially dispatch an error state here
          // throw new Error(syncResponse.message || 'Failed to sync user profile.');
        }
      } else {
        console.log('User sync successful:', syncResponse);
      }

      console.log('Fetching user tier for userId:', user.id);
      // Pass the token explicitly to apiClient.fetchUserMembership
      const tierResponse = await apiClient.fetchUserMembership(user.id, token); // Pass token here
      return tierResponse.membershipTier;

    } catch (error) {
      console.error('Error during sync or tier fetch:', error);
      // Return null, the calling function should handle the overall auth state
      return null;
    }
  };


  useEffect(() => {
    authDispatch({ type: 'LOGIN_REQUEST' });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session: Session | null) => {
      console.log('onAuthStateChange event:', event, 'session:', session ? 'Yes' : 'No');

      if (processingAuthEvent.current && event !== 'SIGNED_OUT') { // Allow logout event even if processing
          console.log('Already processing auth event, skipping:', event);
          return;
      }
      processingAuthEvent.current = true;

      try {
          const currentUserId = authState.user?.id; // Get user ID from current state
          const sessionUserId = session?.user?.id;
          const accessToken = session?.access_token ?? null;

          // Handle SIGNED_IN or INITIAL_SESSION with a valid session
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && sessionUserId && accessToken) {
            // Process if user is new, different, or state is currently logged out/loading
            if (sessionUserId !== currentUserId || !authState.user || authState.loading) {
              console.log(`Processing ${event} for user: ${sessionUserId}`);
              lastProcessedUserId.current = sessionUserId; // Track processed user
              authDispatch({ type: 'LOGIN_REQUEST' });
              try {
                // Pass user and token directly
                const tier = await syncAndFetchTier(session.user, accessToken);
                // Double-check session hasn't changed *during* async operations
                const { data: { session: latestSession } } = await supabase.auth.getSession();
                if (latestSession?.user?.id === sessionUserId) {
                    authDispatch({ type: 'LOGIN_SUCCESS', payload: { user: session.user, token: accessToken, tier } });
                } else {
                    console.warn("User changed during async auth flow, aborting state update.");
                    authDispatch({ type: 'LOGOUT' }); // Force logout if user changed
                }
              } catch (syncError: any) {
                console.error(`Error during post-${event} sync or tier fetch:`, syncError);
                authDispatch({ type: 'LOGIN_FAILURE', payload: syncError.message || `Failed ${event} sync/tier fetch` });
                lastProcessedUserId.current = null; // Reset on failure
              }
            } else {
              console.log(`Skipping redundant ${event} processing for user: ${sessionUserId}`);
              // If token refreshed for the *same* user, update it
              if (authState.token !== accessToken) {
                 authDispatch({ type: 'TOKEN_REFRESH_SUCCESS', payload: { token: accessToken } });
              }
            }
          }
          // Handle SIGNED_OUT event
          else if (event === 'SIGNED_OUT') {
            console.log('Processing SIGNED_OUT');
            if (authState.user) { // Only dispatch if actually logged in
                lastProcessedUserId.current = null;
                authDispatch({ type: 'LOGOUT' });
            }
          }
          // Handle TOKEN_REFRESHED event
          else if (event === 'TOKEN_REFRESHED' && accessToken) {
            console.log('Processing TOKEN_REFRESHED');
            // Only update token if user is still logged in
            if (authState.user && authState.user.id === sessionUserId) {
                authDispatch({ type: 'TOKEN_REFRESH_SUCCESS', payload: { token: accessToken } });
            } else {
                console.warn("Token refreshed but user state doesn't match session.");
                // Potentially trigger a re-sync or logout if state is inconsistent
            }
          }
          // Handle initial load or other cases where there's no session
          else if (!session) {
             if (authState.user || authState.loading) { // Only dispatch if not already logged out
                console.log('Processing no session state (dispatching logout)');
                lastProcessedUserId.current = null;
                authDispatch({ type: 'LOGOUT' });
             }
          }
      } finally {
          processingAuthEvent.current = false;
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authDispatch]); // authDispatch is stable


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

      const { error } = authResponse;
      if (error) throw error;
      // Success state handled by listener

    } catch (error: any) {
      console.error('Sign-in error:', error);
      authDispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      throw error;
    }
  };

  const signUp = async (credentials: { email?: string; password?: string; provider?: 'google' | 'facebook' }, metadata: Record<string, any> = {}) => {
    authDispatch({ type: 'LOGIN_REQUEST' });
    try {
      let authResponse;
      if (credentials.provider) {
        authResponse = await supabase.auth.signInWithOAuth({
          provider: credentials.provider
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

      if (data.user && !data.session) {
        console.log('User created, awaiting verification:', data.user.email);
        // UI should inform user. State remains LOGIN_REQUEST.
      }
      // Success state handled by listener

    } catch (error: any) {
      console.error('Sign-up error:', error);
      authDispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign-out error:', error);
      // Still dispatch logout on client
      authDispatch({ type: 'LOGOUT' });
      lastProcessedUserId.current = null;
      throw error;
    }
    // State update handled by listener
  };

  // Remove syncUserToCustomBackend and fetchUserTier from exported context value
  return (
    <AuthContext.Provider value={{ authState, authDispatch, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Cast context to AuthContextType to satisfy TypeScript
  return context as AuthContextType;
};