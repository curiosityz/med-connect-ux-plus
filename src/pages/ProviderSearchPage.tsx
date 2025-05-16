
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import './ProviderSearchPage.css';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import { ProviderSearch } from '@/components/ProviderSearch';
import { ProviderResultsList } from '@/components/ProviderResultsList';
import ProviderMap from '@/components/Map/ProviderMap';
import { useAuth } from '@/hooks/useAuth';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { useSearch } from '@/contexts/SearchContext';
import { SearchFilters } from '@/reducers/searchReducer';
import { Button } from '@/components/ui/button';
import { Loader2, Info } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';

const ProviderSearchPage = () => {
  // Always call hooks at the top level, unconditionally
  const { membershipTier, loading: authLoading } = useAuth();
  const { isSignedIn, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const {
    searchState,
    updateFilters,
    performSearch,
    loadMoreResults,
  } = useSearch();

  const {
    results: providers,
    isLoading,
    error,
    filters,
    pagination,
  } = searchState;

  // Local state for UI
  const [localLocationInput, setLocalLocationInput] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [clerkToken, setClerkToken] = useState<string | null>(null);

  // Log membership tier whenever it changes
  useEffect(() => {
    console.log("Current membershipTier in ProviderSearchPage:", membershipTier);
  }, [membershipTier]);

  // Get token on mount and when auth changes
  useEffect(() => {
    const loadToken = async () => {
      if (isSignedIn && clerkLoaded) {
        try {
          const newToken = await getToken();
          console.log("Clerk token loaded:", newToken ? "Available" : "Not available");
          setClerkToken(newToken);
        } catch (err) {
          console.error('Failed to get authentication token:', err);
        }
      } else {
        setClerkToken(null);
      }
    };
    
    loadToken();
  }, [getToken, isSignedIn, clerkLoaded]);

  // Memoized primary location zip
  const primaryLocationZip = useMemo(() => {
    console.log("Calculating primaryLocationZip based on membershipTier:", membershipTier);
    return membershipTier === 'basic' ? "90210" : null;
  }, [membershipTier]);

  // Effect to SYNC local input state FROM context/auth state when relevant parts change
  useEffect(() => {
    let locationToShow = '';
    
    // Basic users see fixed zip code
    if (membershipTier === 'basic' && primaryLocationZip) {
      locationToShow = primaryLocationZip;
      console.log("Setting basic tier location to:", locationToShow);
    } else {
      // Premium/expert users see entered location
      locationToShow = filters.locationName || filters.zipCode || '';
      console.log("Setting premium/expert tier location to:", locationToShow);
    }
    
    // Only update local state if it's different from what should be shown
    if (localLocationInput !== locationToShow) {
      setLocalLocationInput(locationToShow);
    }
  }, [filters.locationName, filters.zipCode, membershipTier, primaryLocationZip, localLocationInput]);

  // Handlers for ProviderSearch component - update state but DON'T trigger searches
  const handleDrugNameChange = useCallback((value: string) => {
    // Update filter state but don't trigger search
    updateFilters({ drugName: value });
  }, [updateFilters]);

  const handleLocationInputChange = useCallback((value: string) => {
    console.log("Location input changed in parent:", value);
    // For non-basic users, update the local state
    if (membershipTier !== 'basic') {
      setLocalLocationInput(value);
    } else {
      console.log("Ignoring location change for basic tier");
    }
  }, [membershipTier]);

  const handleRadiusChange = useCallback((value: number) => {
    updateFilters({ radius: value });
  }, [updateFilters]);

  const handleMinClaimsChange = useCallback((value: number | undefined) => {
    updateFilters({ minClaims: value });
  }, [updateFilters]);

  const handleTaxonomyClassChange = useCallback((value: string | undefined) => {
    updateFilters({ taxonomyClass: value });
  }, [updateFilters]);

  const handleSortByChange = useCallback((value: SearchFilters['sortBy']) => {
    updateFilters({ sortBy: value });
  }, [updateFilters]);

  const handleSelectedInsurancesChange = useCallback((selectedIds: string[]) => {
    updateFilters({ acceptedInsurance: selectedIds });
  }, [updateFilters]);

  const handleMinRatingChange = useCallback((value: number) => {
    updateFilters({ minRating: value });
  }, [updateFilters]);

  // Handler for the explicit search button - ONLY place where search is triggered
  const handleSearchClick = async () => {
    console.log("Search button clicked");
    console.log("Local location input:", localLocationInput);
    console.log("Membership tier:", membershipTier);
    console.log("Search criteria met:", isSearchCriteriaMet);
    
    setSearchAttempted(true);
    let finalZipCode: string | undefined = undefined;
    let finalLocationName: string | undefined = undefined;

    // Determine final zip/location based on tier and local input *at time of click*
    if (membershipTier === 'basic') {
      finalZipCode = primaryLocationZip || undefined;
      console.log("Using basic tier fixed location:", finalZipCode);
    } else {
      // Premium or expert tier - can use any location
      if (/^\d{5}(-\d{4})?$/.test(localLocationInput)) {
        finalZipCode = localLocationInput;
        console.log("Using zip code input:", finalZipCode);
      } else if (localLocationInput) {
        finalLocationName = localLocationInput;
        console.log("Using location name input:", finalLocationName);
      }
    }

    // Create the final filter object to send to performSearch
    const filtersForSearch = {
      ...filters, // Get other filters from context state
      zipCode: finalZipCode,
      locationName: finalLocationName,
      token: clerkToken // Pass the token directly in filters
    };

    console.log("Search initiated with filters:", filtersForSearch);

    // Perform the search if criteria are met
    if (filtersForSearch.drugName && filtersForSearch.drugName.length >= 2 && (finalZipCode || finalLocationName)) {
      try {
        await performSearch(filtersForSearch, false); // false = not load more
        toast.success("Search completed successfully");
      } catch (error) {
        console.error('Error performing search:', error);
        toast.error("Search failed. Please try again.");
      }
    } else {
      console.log("Search criteria not met for API call.");
      toast.error("Please enter a drug name and location to search.");
    }
  };

  // Determine if the search criteria are met (for enabling search button)
  const isSearchCriteriaMet = useMemo(() => {
    if (authLoading || !filters.drugName || filters.drugName.length < 2) {
      console.log("Search criteria not met: Missing drug name or still loading");
      return false;
    }
    
    // For basic membership, check if primaryLocationZip exists
    if (membershipTier === 'basic') {
      const result = !!primaryLocationZip;
      console.log("Basic tier search criteria met:", result);
      return result;
    }
    
    // For other membership types, check if location input exists
    const result = !!localLocationInput.trim();
    console.log("Premium/expert tier search criteria met:", result);
    return result;
  }, [authLoading, filters.drugName, localLocationInput, membershipTier, primaryLocationZip]);

  // Handle authentication redirect early - but AFTER all hooks are called
  if (!authLoading && clerkLoaded && !isSignedIn) {
    return <Navigate to="/auth?redirect=/find-providers" replace />;
  }

  return (
    <div className="provider-search-container">
      <MainNavigation />

      <main className="provider-search-content">
        <h1 className="provider-search-header">
          Find Medication Providers
        </h1>

        {(authLoading || !clerkLoaded) ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertTitle>Connected to Database</AlertTitle>
              <AlertDescription>
                Searches will query the PostgreSQL database at {process.env.DB_HOSTNAME || 'rxprescribers.com'}.
                {clerkToken ? ' Authentication token available.' : ' No authentication token available.'}
                Current membership tier: {membershipTier || 'none'}
              </AlertDescription>
            </Alert>

            <ProviderSearch
              drugName={filters.drugName || ''}
              locationInput={localLocationInput}
              radius={filters.radius || 10}
              minClaims={filters.minClaims}
              taxonomyClass={filters.taxonomyClass}
              sortBy={filters.sortBy || 'distance'}
              selectedInsurances={filters.acceptedInsurance || []}
              minRating={filters.minRating || 0}
              onDrugNameChange={handleDrugNameChange}
              onLocationInputChange={handleLocationInputChange}
              onRadiusChange={handleRadiusChange}
              onMinClaimsChange={handleMinClaimsChange}
              onTaxonomyClassChange={handleTaxonomyClassChange}
              onSortByChange={handleSortByChange}
              onSelectedInsurancesChange={handleSelectedInsurancesChange}
              onMinRatingChange={handleMinRatingChange}
              disableAutoSearch={true} // Disable automatic search to prevent resource exhaustion
            />

            {/* Explicit Search Button - ensure it's a button type and properly styled */}
            <div className="mt-6 text-center">
              <Button
                onClick={handleSearchClick}
                disabled={!isSearchCriteriaMet || isLoading}
                size="lg"
                className="px-8 py-3 text-lg cursor-pointer" 
                type="button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search Providers"
                )}
              </Button>
            </div>

            <div className="mt-8">
              <ProviderMap providers={providers || []} isLoading={isLoading && (!providers || providers.length === 0)} />
            </div>

            <ProviderResultsList
              providers={providers || []}
              isLoading={isLoading && !pagination.nextCursor}
              isError={!!error}
              error={error}
              fetchNextPage={loadMoreResults}
              hasNextPage={!!pagination.nextCursor}
              isFetchingNextPage={isLoading && !!pagination.nextCursor}
              searchAttempted={searchAttempted && isSearchCriteriaMet}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProviderSearchPage;
