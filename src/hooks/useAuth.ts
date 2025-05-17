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
  // For testing/debugging, return a fixed tier
  // Comment out the API call implementation and use this fixed value instead
  // This helps us debug the UI behavior with different membership tiers
  console.log('Fetching membership tier for user:', userId);
  console.log('Using premium tier for testing purposes');
  return 'premium'; // Change to 'basic' or 'expert' to test different tier behaviors

  /* Uncomment this for production code that actually fetches the tier
  try {
    const response = await apiClient.fetchUserMembership(userId, token);
    console.log('Membership tier response:', response);
    return response.membershipTier || 'basic'; // Default to 'basic' if not found or on error
  } catch (error) {
    console.error('Error fetching user membership tier:', error);
    return 'basic'; // Default on error
  }
  */
}

// Fetch user's primary ZIP code from the database
async function fetchUserPrimaryZip(userId: string, token: string | null): Promise<string | null> {
  try {
    console.log('Fetching primary ZIP code for user:', userId);
    // For testing purposes, return a hardcoded value
    // In production, this would query the database for the user's saved locations
    return "90210"; // Default ZIP code for testing
    
    /* Uncomment for production code
    const { data, error } = await supabase
      .from('user_locations')
      .select('zip_code')
      .eq('supabase_user_id', userId)
      .eq('is_primary', true)
      .single();
      
    if (error) {
      console.error('Error fetching user primary ZIP code:', error);
      return null;
    }
    
    return data?.zip_code || null;
    */
  } catch (error) {
    console.error('Error fetching user primary ZIP code:', error);
    return null;
  }
}

// Save user's primary ZIP code to the database
async function saveUserPrimaryZip(userId: string, zipCode: string, token: string | null): Promise<boolean> {
  try {
    console.log('Saving primary ZIP code for user:', userId, zipCode);
    // For testing purposes, just log the save attempt
    // In production, this would upsert to the database
    
    /* Uncomment for production code
    // Check if user already has a primary location
    const { data: existingLocation } = await supabase
      .from('user_locations')
      .select('user_location_id')
      .eq('supabase_user_id', userId)
      .eq('is_primary', true)
      .single();
    
    if (existingLocation) {
      // Update existing primary location
      const { error } = await supabase
        .from('user_locations')
        .update({ zip_code: zipCode })
        .eq('user_location_id', existingLocation.user_location_id);
      
      if (error) throw error;
    } else {
      // Create new primary location
      const { error } = await supabase
        .from('user_locations')
        .insert({
          supabase_user_id: userId,
          location_name: 'Primary Location',
          zip_code: zipCode,
          is_primary: true,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
    }
    */
    
    return true;
  } catch (error) {
    console.error('Error saving user primary ZIP code:', error);
    return false;
  }
}

export type MembershipTier = 'basic' | 'premium' | 'expert' | null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [membershipTier, setMembershipTier] = useState<MembershipTier>(null);
  const [primaryZipCode, setPrimaryZipCode] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const handleUserSession = useCallback(async (sessionUser: User | null) => {
    console.log("Handling user session:", sessionUser?.email);
    setUser(sessionUser);
    if (sessionUser) {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || null;
      
      await syncUserToCustomBackend(sessionUser, token);
      const tier = await fetchUserMembershipTier(sessionUser.id, token);
      console.log("Setting membership tier to:", tier);
      setMembershipTier(tier);
      
      // Fetch user's primary ZIP code
      const zip = await fetchUserPrimaryZip(sessionUser.id, token);
      console.log("Setting primary ZIP code to:", zip);
      setPrimaryZipCode(zip);
    } else {
      console.log("No user session, setting membership tier and ZIP code to null");
      setMembershipTier(null);
      setPrimaryZipCode(null);
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

    console.log("Initializing auth hook");
    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth state changed:", _event);
        setLoading(true);
        setError(null);
        await handleUserSession(session?.user || null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [handleUserSession]);

  // Function to update user's primary ZIP code
  const updatePrimaryZipCode = async (zipCode: string) => {
    if (!user) {
      console.error("Cannot update ZIP code: No user logged in");
      return false;
    }
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || null;
      
      const success = await saveUserPrimaryZip(user.id, zipCode, token);
      if (success) {
        setPrimaryZipCode(zipCode);
        console.log("Primary ZIP code updated successfully");
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error updating primary ZIP code:", e);
      setError(e as Error);
      return false;
    } finally {
      setLoading(false);
    }
  };

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

  return { 
    user, 
    membershipTier, 
    primaryZipCode, 
    updatePrimaryZipCode,
    loading, 
    error, 
    signUp, 
    signInWithPassword, 
    signInWithOAuth, 
    signOut 
  };
}
