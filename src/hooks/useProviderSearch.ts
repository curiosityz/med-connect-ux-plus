import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
// Assuming these functions are defined in your api-client library
// and correctly make authenticated calls to your Node.js backend
import {
    findProviders,
    fetchUserLocations,
    fetchUserProfile, // <-- ADDED: Assumes a function to get profile/tier
    ProviderSearchParams,
    ProviderSearchResult,
    UserLocation,
    UserProfile // <-- ADDED: Assumes a type for the user profile/tier
} from '@/lib/api-client';
import { useAuth } from './useAuth'; // Assumes this hook provides the Supabase user object

// Define or import UserProfile type
// interface UserProfile {
//   membership_tier: 'basic' | 'premium' | 'expert';
//   // other profile fields if needed
// }


export const useProviderSearch = () => {
  const [searchParams, setSearchParams] = useState<ProviderSearchParams | null>(null);
  const { user, isLoading: authLoading } = useAuth(); // Get user and auth loading state

  // Get user's profile including membership tier
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile | null>({
    queryKey: ['userProfile', user?.id],
    // **** CHANGED queryFn TO CALL ACTUAL API ****
    queryFn: async () => {
      if (!user?.id) return null; // No user, no profile
      console.log('Fetching user profile/tier from backend...');
      try {
         // This calls the function defined in api-client.js
         const profile = await fetchUserProfile();
         console.log('Fetched profile:', profile);
         // Ensure a default tier if API doesn't return one (or handle error)
         return profile || { membership_tier: 'basic' };
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        toast.error(`Failed to load user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Return null or a default profile state on error
        return null; // Or { membership_tier: 'basic' };
      }
    },
    enabled: !!user?.id && !authLoading, // Enable only when user ID exists and auth isn't loading
    // staleTime: 5 * 60 * 1000, // Optional: Cache profile data for 5 minutes
    // refetchOnWindowFocus: false, // Optional: Don't refetch profile just on focus
  });

  // Determine tier and tier loading state cleanly
  const userTier = userProfile?.membership_tier || 'basic';
  const tierLoading = authLoading || profileLoading;

  // Get user's saved locations (conditionally enabled for premium)
  const { data: userLocations = [], isLoading: locationsLoading } = useQuery<UserLocation[]>({
    queryKey: ['userLocations', user?.id],
    queryFn: fetchUserLocations, // Calls function defined in api-client.js
    enabled: !!user?.id && !tierLoading && userTier === 'premium', // Enable only for loaded premium users
    meta: {
      onError: (error: Error) => {
        console.error('Failed to load locations:', error);
        toast.error(`Failed to load saved locations: ${error.message}`);
      }
    }
  });

  // Search for providers (driven by searchParams state)
  const { data: searchResults = [], isLoading: searchLoading, error: searchError, refetch } = useQuery<ProviderSearchResult[]>({
    queryKey: ['providerSearch', searchParams],
    queryFn: () => {
      if (!searchParams) {
        // console.log('No search params provided'); // Can be noisy
        return Promise.resolve([]); // Return empty array if no params
      }
      console.log('Executing provider search with params:', searchParams);
      return findProviders(searchParams); // Calls function defined in api-client.js
    },
    enabled: !!searchParams, // Only run when searchParams is not null
    meta: {
      onError: (error: Error) => {
        console.error('Search failed:', error);
        toast.error(`Provider search failed: ${error.message}`);
      }
    }
  });

  // Function called by the UI component to initiate a search
  const handleSearch = (params: ProviderSearchParams) => {
    console.log('Setting search params:', params);
    toast.info(`Searching for providers of ${params.drugName}...`);
    // Setting the state triggers the searchResults query to run/refetch
    setSearchParams(params);
  };

  // Values and functions returned by the hook for the UI component to use
  return {
    userTier,          // The determined tier ('basic', 'premium', 'expert')
    tierLoading,       // Combined loading state for auth and profile
    userLocations,     // Array of saved locations (for premium)
    locationsLoading,  // Loading state for locations
    searchResults,     // Array of provider results
    searchLoading,     // Loading state for the search
    searchError,       // Any error object from the search query
    handleSearch,      // Function to trigger a new search
    refetchSearch: refetch // Function to manually refetch the current search
  };
};
