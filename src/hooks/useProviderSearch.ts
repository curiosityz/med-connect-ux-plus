
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
        return { tier: 'basic', loading: false };
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
        toast.error(`Failed to load saved locations: ${error.message}`);
      }
    }
  });
  
  // Search for providers
  const { data: searchResults = [], isLoading: searchLoading, error: searchError, refetch } = useQuery<ProviderSearchResult[]>({
    queryKey: ['providerSearch', searchParams],
    queryFn: () => {
      if (!searchParams) return Promise.resolve([]);
      return findProviders(searchParams);
    },
    enabled: !!searchParams,
    meta: {
      onError: (error: Error) => {
        toast.error(`Search failed: ${error.message}`);
      }
    }
  });
  
  const handleSearch = (params: ProviderSearchParams) => {
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
