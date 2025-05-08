import React from 'react';
import { Provider } from '@/lib/supabase';
import { ApiError } from '@/lib/api-client';
import { ProviderCard } from './ProviderCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface ProviderResultsListProps {
  providers: Provider[];
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  // Removed pagination props: fetchNextPage, hasNextPage, isFetchingNextPage
  searchAttempted: boolean;
}

export const ProviderResultsList: React.FC<ProviderResultsListProps> = ({
  providers,
  isLoading,
  isError,
  error,
  // Removed pagination props
  searchAttempted
}) => {

  if (isLoading && !providers.length) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-600 bg-red-100 p-4 rounded-md mt-6">
        <p>Error fetching providers: {error?.message}</p>
        {error?.data && <pre className="mt-2 text-sm">{JSON.stringify(error.data, null, 2)}</pre>}
      </div>
    );
  }

  if (searchAttempted && !isLoading && providers.length === 0) {
     return (
       <p className="text-center text-gray-500 mt-6">
         No providers found matching your criteria.
       </p>
     );
  }

  // Don't show "No providers found" before a search is attempted
  if (!searchAttempted && providers.length === 0) {
      return null; // Or a prompt to start searching
  }


  return (
    <div className="space-y-6 mt-6">
      {providers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <ProviderCard key={provider.npi || provider.id} provider={provider} />
          ))}
        </div>
      )}

      {/* Removed pagination button */}
      
    </div>
  );
};