
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { findProviders, fetchUserLocations, ProviderSearchParams, ProviderSearchResult, UserLocation } from '@/lib/api-client';
import { useAuth } from './useAuth';

interface UserTier {
  tier: 'basic' | 'premium' | 'expert';
  loading: boolean;
}

export const useProviderSearch = () => {
  const [searchParams, setSearchParams] = useState<ProviderSearchParams | null>(null);
  const { user } = useAuth();
  
  // Get user's membership tier
  const { data: userTier = { tier: 'basic', loading: true } } = useQuery<UserTier>({
    queryKey: ['userTier', user?.id],
    queryFn: async () => {
      if (!user?.id) return { tier: 'basic', loading: false };
      try {
        // This should be implemented to fetch from your Supabase profiles table
        // For now, assuming a mock implementation
        console.log('User authenticated, returning mock tier');
        return { tier: 'expert', loading: false }; // Setting to expert for testing
      } catch (error) {
        console.error('Failed to fetch user tier:', error);
        return { tier: 'basic', loading: false };
      }
    },
    enabled: !!user?.id,
  });
  
  // Get user's saved locations
  const { data: userLocations = [], isLoading: locationsLoading } = useQuery<UserLocation[]>({
    queryKey: ['userLocations', user?.id],
    queryFn: fetchUserLocations,
    enabled: !!user?.id && userTier.tier === 'premium',
    meta: {
      onError: (error: Error) => {
        console.error('Failed to load locations:', error);
        toast.error(`Failed to load saved locations: ${error.message}`);
      }
    }
  });
  
  // Search for providers
  const { data: searchResults = [], isLoading: searchLoading, error: searchError, refetch } = useQuery<ProviderSearchResult[]>({
    queryKey: ['providerSearch', searchParams],
    queryFn: () => {
      if (!searchParams) {
        console.log('No search params provided');
        return Promise.resolve([]);
      }
      console.log('Executing provider search with params:', searchParams);
      return findProviders(searchParams);
    },
    enabled: !!searchParams,
    meta: {
      onError: (error: Error) => {
        console.error('Search failed:', error);
        toast.error(`Search failed: ${error.message}`);
      }
    }
  });
  
  const handleSearch = (params: ProviderSearchParams) => {
    console.log('Handling search with params:', params);
    toast.info(`Searching for providers of ${params.drugName}...`);
    setSearchParams(params);
  };
  
  return {
    userTier: userTier.tier,
    tierLoading: userTier.loading,
    userLocations,
    locationsLoading,
    searchResults,
    searchLoading,
    searchError,
    handleSearch,
    refetchSearch: refetch
  };
};
