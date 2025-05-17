
import { useState, useCallback, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { apiClient } from '@/lib/api-client';
import { useClerkAuth } from './useClerkAuth';

export type MembershipTier = 'basic' | 'premium' | 'expert' | null;

interface UserProfile {
  primaryZipCode: string | null;
  membershipTier: MembershipTier;
  isLoading: boolean;
  error: Error | null;
}

interface UseUserProfileResult extends UserProfile {
  updatePrimaryZipCode: (zipCode: string) => Promise<boolean>;
  syncUserProfile: () => Promise<void>;
}

export function useClerkUserProfile(): UseUserProfileResult {
  const { userId } = useAuth();
  const { user } = useUser();
  const { getToken } = useClerkAuth();
  const [primaryZipCode, setPrimaryZipCode] = useState<string | null>(null);
  const [membershipTier, setMembershipTier] = useState<MembershipTier>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const syncUserProfile = useCallback(async (): Promise<void> => {
    if (!userId || !user) {
      setPrimaryZipCode(null);
      setMembershipTier(null);
      setIsLoading(false);
      return;
    }

    console.log("Syncing user profile for:", userId);
    setIsLoading(true);
    setError(null);
    
    try {
      // Get auth token for API requests
      const token = await getToken();
      
      // Sync user to backend and fetch membership tier
      const syncResponse = await apiClient.syncUser({
        supabase_user_id: userId,
        email: user.emailAddresses[0]?.emailAddress || '',
      }, token);
      
      if (syncResponse?.data?.membershipTier) {
        setMembershipTier(syncResponse.data.membershipTier);
      } else {
        // Fetch membership tier directly if not returned in sync response
        const membershipResponse = await apiClient.fetchUserMembership(userId, token);
        setMembershipTier(membershipResponse.membershipTier);
      }
      
      // Fetch primary ZIP code
      try {
        const locations = await apiClient.getUserLocations(token);
        const primaryLocation = locations.find(location => location.isPrimary);
        
        if (primaryLocation?.zipCode) {
          console.log("Found primary location with ZIP:", primaryLocation.zipCode);
          setPrimaryZipCode(primaryLocation.zipCode);
        } else {
          console.log("No primary location found with ZIP code");
          setPrimaryZipCode(null);
        }
      } catch (locError) {
        console.error('Error fetching user locations:', locError);
        // This is non-critical, so we don't set the main error state
        // Just log and continue
      }
    } catch (e) {
      console.error('Error syncing user profile:', e);
      setError(e as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, user, getToken]);

  // Sync the user profile on mount
  useEffect(() => {
    if (userId && user) {
      syncUserProfile();
    }
  }, [userId, user, syncUserProfile]);

  // Update user's primary ZIP code
  const updatePrimaryZipCode = useCallback(async (zipCode: string): Promise<boolean> => {
    if (!userId) {
      console.error("Cannot update ZIP code: No user logged in");
      return false;
    }
    
    console.log("Updating primary ZIP code to:", zipCode);
    setIsLoading(true);
    try {
      const token = await getToken();
      
      // First check if the user already has locations
      const locations = await apiClient.getUserLocations(token);
      
      // If user has locations, set one as primary; otherwise create a new one
      let success = false;
      
      if (locations.length > 0) {
        const primaryLocation = locations.find(loc => loc.zipCode === zipCode);
        if (primaryLocation) {
          // If this zip code already exists, just set it as primary
          const setPrimaryResponse = await apiClient.setPrimaryLocation(primaryLocation.id, token);
          success = setPrimaryResponse.success;
        } else {
          // Otherwise, create a new location with this ZIP code
          const newLocation = await apiClient.addUserLocation({
            name: `Location for ${zipCode}`,
            zipCode: zipCode
          }, token);
          const setPrimaryResponse = await apiClient.setPrimaryLocation(newLocation.id, token);
          success = setPrimaryResponse.success;
        }
      } else {
        // Create first location if none exist
        const newLocation = await apiClient.addUserLocation({
          name: 'Primary Location',
          zipCode: zipCode
        }, token);
        const setPrimaryResponse = await apiClient.setPrimaryLocation(newLocation.id, token);
        success = setPrimaryResponse.success;
      }
      
      if (success) {
        setPrimaryZipCode(zipCode);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error updating primary ZIP code:", e);
      setError(e as Error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, getToken]);

  return {
    primaryZipCode,
    membershipTier,
    isLoading,
    error,
    updatePrimaryZipCode,
    syncUserProfile
  };
}
