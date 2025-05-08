
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import { ProviderSearch } from '@/components/ProviderSearch'; // Note: Named import if ProviderSearch uses named export
import { ProviderResultsList } from '@/components/ProviderResultsList';
import ProviderMap from '@/components/Map/ProviderMap'; // Default export assumed
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { useProviderSearch } from '@/hooks/useProviderSearch';
import { SearchApiParams } from '@/lib/api-client';

type SortByType = SearchApiParams['sortBy'];

const ProviderSearchPage = () => {
  const { user, membershipTier, loading: authLoading } = useAuth();

  // State for filters, now managed by the page
  const [drugName, setDrugName] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [radius, setRadius] = useState<number>(10);
  const [minClaims, setMinClaims] = useState<number | undefined>(undefined);
  const [taxonomyClass, setTaxonomyClass] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortByType>('distance');
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [searchAttempted, setSearchAttempted] = useState(false); // Track if search was triggered

  const debouncedDrugName = useDebounce(drugName, 500);

  // Derived search parameters for the API hook
  const [searchParams, setSearchParams] = useState<Omit<SearchApiParams, 'cursor'>>({
    drugName: '',
    zipCode: '',
    locationName: undefined,
    radiusMiles: 10,
    minClaims: undefined,
    taxonomyClass: undefined,
    sortBy: 'distance',
    acceptedInsurance: [],
    minRating: 0,
    limit: 10, // Or manage limit via state if needed
  });

  const primaryLocationZip = useMemo(() => (membershipTier === 'basic' ? "90210" : null), [membershipTier]); // Example

  // Effect to update searchParams based on filter states
  useEffect(() => {
    let currentZipCode = '';
    let currentLocationName: string | undefined = undefined;

    if (authLoading) return;

    switch (membershipTier) {
      case 'basic':
        currentZipCode = primaryLocationZip || '';
        break;
      case 'premium':
        if (/^\d{5}(-\d{4})?$/.test(locationInput)) {
            currentZipCode = locationInput;
            currentLocationName = undefined;
        } else if (locationInput) {
            currentLocationName = locationInput;
        }
        break;
      case 'expert':
      default:
        currentZipCode = locationInput;
        break;
    }

    const newSearchParams = {
      drugName: debouncedDrugName,
      zipCode: currentZipCode,
      locationName: currentLocationName,
      radiusMiles: radius,
      minClaims: minClaims === 0 ? undefined : minClaims,
      taxonomyClass: taxonomyClass || undefined,
      sortBy: sortBy,
      acceptedInsurance: selectedInsurances.length > 0 ? selectedInsurances : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      limit: 10, // Keep limit consistent or manage via state
    };
    
    // Only update if params actually changed to avoid unnecessary re-renders/refetches
    if (JSON.stringify(newSearchParams) !== JSON.stringify(searchParams)) {
        setSearchParams(newSearchParams);
        if (newSearchParams.drugName && (newSearchParams.zipCode || newSearchParams.locationName)) {
            setSearchAttempted(true); // Mark search as attempted when key params are set
        }
    }

  }, [
    debouncedDrugName, locationInput, radius, minClaims, taxonomyClass, sortBy,
    membershipTier, authLoading, primaryLocationZip, selectedInsurances, minRating, searchParams // Include searchParams to compare
  ]);

  // Determine if the search query should be enabled
   const isSearchEnabled = useMemo(() => {
     if (authLoading || !searchParams.drugName) return false;
     if (membershipTier === 'basic') return !!searchParams.zipCode;
     return !!searchParams.zipCode || !!searchParams.locationName;
   }, [authLoading, searchParams.drugName, searchParams.zipCode, searchParams.locationName, membershipTier]);

  // Fetch data using the hook
  const {
    providers,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    // refetch,
  } = useProviderSearch({
    searchParams: searchParams, // Pass the derived searchParams
    enabled: isSearchEnabled, // Control query execution
  });

  // Handlers to pass down to the filter component
  const handleDrugNameChange = useCallback((value: string) => setDrugName(value), []);
  const handleLocationInputChange = useCallback((value: string) => setLocationInput(value), []);
  const handleRadiusChange = useCallback((value: number) => setRadius(value), []);
  const handleMinClaimsChange = useCallback((value: number | undefined) => setMinClaims(value), []);
  const handleTaxonomyClassChange = useCallback((value: string | undefined) => setTaxonomyClass(value), []);
  const handleSortByChange = useCallback((value: SortByType) => setSortBy(value), []);
  const handleSelectedInsurancesChange = useCallback((value: string[]) => setSelectedInsurances(value), []);
  const handleMinRatingChange = useCallback((value: number) => setMinRating(value), []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <MainNavigation />

      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          Find Medication Providers
        </h1>

        {/* Pass state and handlers to the controlled filter component */}
        <ProviderSearch
          drugName={drugName} onDrugNameChange={handleDrugNameChange}
          locationInput={locationInput} onLocationInputChange={handleLocationInputChange}
          radius={radius} onRadiusChange={handleRadiusChange}
          minClaims={minClaims} onMinClaimsChange={handleMinClaimsChange}
          taxonomyClass={taxonomyClass} onTaxonomyClassChange={handleTaxonomyClassChange}
          sortBy={sortBy} onSortByChange={handleSortByChange}
          selectedInsurances={selectedInsurances} onSelectedInsurancesChange={handleSelectedInsurancesChange}
          minRating={minRating} onMinRatingChange={handleMinRatingChange}
        />

        {/* Map Placeholder */}
        <div className="mt-8">
           <ProviderMap providers={providers} isLoading={isLoading && !providers.length} />
        </div>

        {/* Results List */}
        <ProviderResultsList
          providers={providers}
          isLoading={isLoading}
          isError={isError}
          error={error}
          fetchNextPage={fetchNextPage} // Pass down prop
          hasNextPage={hasNextPage} // Pass down prop
          isFetchingNextPage={isFetchingNextPage} // Pass down prop
          searchAttempted={searchAttempted && isSearchEnabled}
        />
      </main>

      <Footer />
    </div>
  );
};

export default ProviderSearchPage;
