import React, { useEffect, useMemo, useCallback, useState } from 'react';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import { ProviderSearch } from '@/components/ProviderSearch';
import { ProviderResultsList } from '@/components/ProviderResultsList';
import ProviderMap from '@/components/Map/ProviderMap';
import { useAuth } from '@/hooks/useAuth';
import { useSearch } from '@/contexts/SearchContext';
import { SearchFilters } from '@/reducers/searchReducer';
// import { useDebounce } from '@/hooks/useDebounce'; // No longer needed here
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const ProviderSearchPage = () => {
  const { membershipTier, loading: authLoading } = useAuth();
  const {
    searchState,
    updateFilters, // Still needed for individual filter updates via handlers
    performSearch, // Get performSearch from context
    loadMoreResults,
  } = useSearch();

  const {
    results: providers,
    isLoading,
    error,
    filters, // Get current filters from context
    pagination,
  } = searchState;

  // Local state ONLY for the location input field
  const [localLocationInput, setLocalLocationInput] = useState(filters.locationName || filters.zipCode || '');
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Memoized primary location zip
  const primaryLocationZip = useMemo(() => (membershipTier === 'basic' ? "90210" : null), [membershipTier]); // Example

  // Effect to set initial zip code for basic tier if not already set
  // And sync local input if context changes (e.g., clear search)
  useEffect(() => {
      if (membershipTier === 'basic' && primaryLocationZip) {
          if (!filters.zipCode || filters.zipCode !== primaryLocationZip) {
             // Update context only if needed, avoid loops
             updateFilters({ zipCode: primaryLocationZip, locationName: undefined });
          }
          // Sync local input if context has primary zip
          if (localLocationInput !== primaryLocationZip) {
             setLocalLocationInput(primaryLocationZip);
          }
      } else {
          // Sync local input if context filter changes (e.g., after clearSearch)
          const contextLocation = filters.locationName || filters.zipCode || '';
          if (localLocationInput !== contextLocation) {
              setLocalLocationInput(contextLocation);
          }
      }
  }, [membershipTier, primaryLocationZip, filters.zipCode, filters.locationName, updateFilters]); // Removed localLocationInput from deps


  // Effect to track if user has started interacting (optional, for UI feedback)
  useEffect(() => {
      if (filters.drugName || localLocationInput) {
          setSearchAttempted(true);
      }
  }, [filters.drugName, localLocationInput]);


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
  const handleSearchClick = () => {
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
      };

      // Perform the search if criteria are met
      if (filtersForSearch.drugName && filtersForSearch.drugName.length >= 2 && (finalZipCode || finalLocationName)) {
         // Pass the calculated filters directly to performSearch
         performSearch(filtersForSearch, false); // false = not load more
      } else {
         console.log("Search criteria not met for API call.");
         // Optionally show a message if criteria aren't met on click
         // e.g., using UIContext's addNotification
      }
  };

  // Determine if the search criteria are met (for enabling search button)
  const isSearchCriteriaMet = useMemo(() => {
    // Check drug name from context filter state
    if (authLoading || !filters.drugName || filters.drugName.length < 2) return false;
    // Check location based on tier and *local* input state
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

        <ProviderSearch
          drugName={filters.drugName || ''}
          locationInput={localLocationInput} // Controlled input uses local state
          radius={filters.radius || 10}
          minClaims={filters.minClaims}
          taxonomyClass={filters.taxonomyClass}
          sortBy={filters.sortBy || 'distance'}
          selectedInsurances={filters.acceptedInsurance || []}
          minRating={filters.minRating || 0}
          onDrugNameChange={handleDrugNameChange}
          onLocationInputChange={handleLocationInputChange} // Updates local state only
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
      </main>

      <Footer />
    </div>
  );
};

export default ProviderSearchPage;
