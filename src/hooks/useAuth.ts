import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Provider as AuthProvider, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { apiClient } from '@/lib/api-client'; // Import the actual API client

async function syncUserToCustomBackend(user: User, token: string | null): Promise<void> {
  try {
    const response = await apiClient.syncUser({
      supabase_user_id: user.id,
      email: user.email,
    }, token);
    console.log('User sync response:', response);
    // Handle response, e.g., update local state or show notification
    if (!response.success) {
      console.warn('User sync to custom backend may have failed or reported an issue:', response.message);
    }
  } catch (error) {
    console.error('Error syncing user to custom backend:', error);
    // Handle error appropriately, e.g., notify user, retry logic
  }
}

async function fetchUserMembershipTier(userId: string, token: string | null): Promise<MembershipTier> {
  try {
    const response = await apiClient.fetchUserMembership(userId, token);
    console.log('Membership tier response:', response);
    return response.membershipTier || 'basic'; // Default to 'basic' if not found or on error
  } catch (error) {
    console.error('Error fetching user membership tier:', error);
    return 'basic'; // Default on error
  }
}

export type MembershipTier = 'basic' | 'premium' | 'expert' | null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [membershipTier, setMembershipTier] = useState<MembershipTier>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const handleUserSession = useCallback(async (sessionUser: User | null) => {
    setUser(sessionUser);
    if (sessionUser) {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || null;
      
      await syncUserToCustomBackend(sessionUser, token);
      const tier = await fetchUserMembershipTier(sessionUser.id, token);
      setMembershipTier(tier);
    } else {
      setMembershipTier(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await handleUserSession(session?.user || null);
      } catch (e) {
        console.error('Error getting initial session:', e);
        setError(e as Error);
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        setError(null);
        await handleUserSession(session?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [handleUserSession]);

  const signUp = async (credentials: SignUpWithPasswordCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp(credentials);
      if (signUpError) throw signUpError;
      if (data.user) {
        // User is signed up, session might be active or require confirmation
        // handleUserSession will be triggered by onAuthStateChange if session becomes active
        // Or, if email confirmation is needed, user will remain null until confirmed.
        console.log('Sign up successful, user:', data.user);
      }
      // setLoading(false) will be handled by onAuthStateChange or error handling
      return { user: data.user, error: null };
    } catch (e) {
      console.error('Error signing up:', e);
      setError(e as Error);
      setLoading(false);
      return { user: null, error: e as Error };
    }
  };

  const signInWithPassword = async (credentials: SignInWithPasswordCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword(credentials);
      if (signInError) throw signInError;
      // onAuthStateChange will handle setting user and loading state
      return { user: data.user, error: null };
    } catch (e) {
      console.error('Error signing in:', e);
      setError(e as Error);
      setLoading(false);
      return { user: null, error: e as Error };
    }
  };

  const signInWithOAuth = async (provider: AuthProvider) => {
    setLoading(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider });
      if (oauthError) throw oauthError;
      // Supabase handles redirect and onAuthStateChange will update the user state
    } catch (e) {
      console.error(`Error signing in with ${provider}:`, e);
      setError(e as Error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      // onAuthStateChange will set user to null and update loading state
    } catch (e) {
      console.error('Error signing out:', e);
      setError(e as Error);
      setLoading(false);
    }
  };

  return { user, membershipTier, loading, error, signUp, signInWithPassword, signInWithOAuth, signOut };
}
