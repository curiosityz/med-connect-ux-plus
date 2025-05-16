
import React, { useEffect, useMemo, useCallback, useState } from 'react';
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

const ProviderSearchPage = () => {
  // Use both our custom auth hook and Clerk's useUser hook
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

  // Local state ONLY for the location input field
  const [localLocationInput, setLocalLocationInput] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [clerkToken, setClerkToken] = useState<string | null>(null);

  // Get token on mount and when auth changes
  useEffect(() => {
    const loadToken = async () => {
      if (isSignedIn && clerkLoaded) {
        const newToken = await getToken();
        setClerkToken(newToken);
      } else {
        setClerkToken(null);
      }
    };
    
    loadToken();
  }, [getToken, isSignedIn, clerkLoaded]);

  // Memoized primary location zip
  const primaryLocationZip = useMemo(() => (membershipTier === 'basic' ? "90210" : null), [membershipTier]);

  // Effect to SYNC local input state FROM context/auth state when relevant parts change
  useEffect(() => {
    let locationToShow = '';
    if (membershipTier === 'basic' && primaryLocationZip) {
      locationToShow = primaryLocationZip;
    } else {
      // Show zip if available, otherwise location name
      locationToShow = filters.locationName || filters.zipCode || '';
    }
    // Only update local state if it's different from what should be shown
    if (localLocationInput !== locationToShow) {
      setLocalLocationInput(locationToShow);
    }
  }, [filters.locationName, filters.zipCode, membershipTier, primaryLocationZip, localLocationInput]);

  // Redirect to login if not authenticated - checking both auth systems
  if (!authLoading && clerkLoaded && !isSignedIn) {
    return <Navigate to="/auth?redirect=/find-providers" replace />;
  }

  // Handlers for ProviderSearch component
  const handleDrugNameChange = useCallback((value: string) => {
    updateFilters({ drugName: value });
  }, [updateFilters]);

  // Location input only updates local state now
  const handleLocationInputChange = useCallback((value: string) => {
    setLocalLocationInput(value);
  }, []);

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

  // Handler for the explicit search button
  const handleSearchClick = async () => {
      setSearchAttempted(true);
      let finalZipCode: string | undefined = undefined;
      let finalLocationName: string | undefined = undefined;

      // Determine final zip/location based on tier and local input *at time of click*
      switch (membershipTier) {
          case 'basic':
              finalZipCode = primaryLocationZip || undefined;
              break;
          case 'premium':
              if (/^\d{5}(-\d{4})?$/.test(localLocationInput)) {
                  finalZipCode = localLocationInput;
              } else if (localLocationInput) {
                  finalLocationName = localLocationInput;
              }
              break;
          case 'expert':
          default:
              if (/^\d{5}(-\d{4})?$/.test(localLocationInput)) {
                 finalZipCode = localLocationInput;
              } else {
                 console.warn("Expert tier requires a valid zip code for location search.");
                 // Optionally show error
              }
              break;
      }

      // Create the final filter object to send to performSearch
      const filtersForSearch: SearchFilters = {
          ...filters, // Get other filters from context state
          zipCode: finalZipCode,
          locationName: finalLocationName,
          token: clerkToken // Pass the token directly in filters
      };

      // Perform the search if criteria are met
      if (filtersForSearch.drugName && filtersForSearch.drugName.length >= 2 && (finalZipCode || finalLocationName)) {
         performSearch(filtersForSearch, false); // false = not load more
      } else {
         console.log("Search criteria not met for API call.");
         // Optionally show a message if criteria aren't met on click
      }
  };

  // Determine if the search criteria are met (for enabling search button)
  const isSearchCriteriaMet = useMemo(() => {
    if (authLoading || !filters.drugName || filters.drugName.length < 2) return false;
    if (membershipTier === 'basic') return !!primaryLocationZip;
    return !!localLocationInput.trim();
  }, [authLoading, filters.drugName, localLocationInput, membershipTier, primaryLocationZip]);


  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <MainNavigation />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
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
            />

            {/* Explicit Search Button */}
            <div className="mt-6 text-center">
                <Button
                    onClick={handleSearchClick}
                    disabled={!isSearchCriteriaMet || isLoading}
                    size="lg"
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Search Providers
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
