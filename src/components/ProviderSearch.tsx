
import React, { useState, useEffect } from 'react';
import { useProviderSearch } from '@/hooks/useProviderSearch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProviderSearchParams } from '@/lib/api-client';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Form validation schema
const searchFormSchema = z.object({
  drugName: z.string().min(1, "Medication name is required"),
  radiusMiles: z.number().positive().max(100).optional(),
  minClaims: z.number().min(0).optional(),
  taxonomyClass: z.string().optional(),
  sortBy: z.enum(['distance', 'claims']).optional(),
  locationName: z.string().optional(),
  zipCode: z.string().regex(/^\d{5}$/, "Enter a valid 5-digit ZIP code").optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

const ProviderSearch = () => {
  const {
    userTier,
    tierLoading,
    userLocations,
    locationsLoading,
    searchResults,
    searchLoading,
    searchError,
    handleSearch
  } = useProviderSearch();
  
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      drugName: '',
      radiusMiles: 10,
      minClaims: 0,
      taxonomyClass: '',
      sortBy: 'distance',
      zipCode: '',
    },
  });
  
  const onSubmit = (values: SearchFormValues) => {
    const searchParams: ProviderSearchParams = {
      drugName: values.drugName,
      radiusMiles: values.radiusMiles,
      minClaims: values.minClaims,
      taxonomyClass: values.taxonomyClass || undefined,
      sortBy: values.sortBy,
    };
    
    // Add location based on user tier
    if (userTier === 'expert' && values.zipCode) {
      searchParams.zipCode = values.zipCode;
      console.log(`Expert tier: searching with ZIP code ${values.zipCode}`);
    } else if (userTier === 'premium' && values.locationName) {
      searchParams.locationName = values.locationName;
      console.log(`Premium tier: searching with saved location ${values.locationName}`);
    } else {
      console.log(`Basic tier: using primary location (determined by backend)`);
    }
    
    setHasSubmitted(true);
    handleSearch(searchParams);
  };

  // Log component rendering for debugging
  useEffect(() => {
    console.log(`ProviderSearch rendered with tier: ${userTier}`);
  }, [userTier]);
  
  // Log search state
  useEffect(() => {
    if (hasSubmitted) {
      console.log('Search state:', {
        loading: searchLoading,
        error: searchError ? searchError.message : null,
        resultsCount: searchResults?.length || 0
      });
    }
  }, [hasSubmitted, searchLoading, searchError, searchResults]);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold mb-6">Find Medication Providers</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Drug Name Input */}
            <FormField
              control={form.control}
              name="drugName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medication Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter medication name" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a medication name like "ALPRAZOLAM"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Search Radius */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="radiusMiles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search Radius (miles)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Minimum Claims */}
              <FormField
                control={form.control}
                name="minClaims"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Claims</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Taxonomy Class & Sort By */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="taxonomyClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Specialty</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. Internal Medicine" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sortBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Results By</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sort order" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="distance">Distance</SelectItem>
                        <SelectItem value="claims">Number of Claims</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Location Selection based on user tier */}
            {tierLoading ? (
              <div className="p-4 bg-gray-50 rounded text-center">Loading your membership details...</div>
            ) : (
              <>
                {userTier === 'premium' && (
                  <FormField
                    control={form.control}
                    name="locationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Saved Location</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a saved location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locationsLoading ? (
                              <SelectItem value="" disabled>Loading locations...</SelectItem>
                            ) : userLocations && userLocations.length > 0 ? (
                              userLocations.map(location => (
                                <SelectItem key={location.id} value={location.location_name}>
                                  {location.location_name} ({location.zip_code})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>No saved locations</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {userTier === 'expert' && (
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter 5-digit ZIP code" maxLength={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {userTier === 'basic' && (
                  <div className="p-4 border border-amber-200 bg-amber-50 rounded">
                    <p className="text-amber-800">
                      Basic tier: We'll use your primary location for the search.
                      <br />
                      <span className="text-sm">Upgrade to Premium to use saved locations or Expert to search any ZIP code.</span>
                    </p>
                  </div>
                )}
              </>
            )}
            
            <Button 
              type="submit" 
              className="w-full md:w-auto" 
              disabled={searchLoading}
            >
              {searchLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : 'Find Providers'}
            </Button>
          </form>
        </Form>
      </div>
      
      {/* Error display */}
      {searchError && hasSubmitted && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {searchError instanceof Error ? searchError.message : 'An error occurred during search'}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Results Section */}
      {searchResults && searchResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold mb-4">Search Results ({searchResults.length})</h3>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Claims</TableHead>
                  <TableHead>Distance (mi)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((provider) => (
                  <TableRow key={provider.npi}>
                    <TableCell>
                      <div className="font-medium">{provider.provider_first_name} {provider.provider_last_name_legal_name}</div>
                      <div className="text-sm text-gray-500">NPI: {provider.npi}</div>
                    </TableCell>
                    <TableCell>{provider.taxonomy_class || 'N/A'}</TableCell>
                    <TableCell>
                      <div>{provider.practice_address1}</div>
                      {provider.practice_address2 && <div>{provider.practice_address2}</div>}
                      <div>{provider.practice_city}, {provider.practice_state} {provider.practice_zip.substring(0, 5)}</div>
                    </TableCell>
                    <TableCell>{provider.claims}</TableCell>
                    <TableCell>{parseFloat(provider.distance_miles).toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      
      {/* No Results Message */}
      {hasSubmitted && searchResults && searchResults.length === 0 && !searchLoading && !searchError && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No providers found</h3>
          <p>Try adjusting your search criteria or expanding the search radius.</p>
        </div>
      )}
    </div>
  );
};

export default ProviderSearch;
