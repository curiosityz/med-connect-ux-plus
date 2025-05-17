
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { LocationList } from '@/components/LocationManagement/LocationList';
import AddLocationForm from '@/components/LocationManagement/AddLocationForm';
import { apiClient, UserLocation } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export const ManageLocationsPage: React.FC = () => {
  const { user, loading: authLoading, membershipTier } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user locations with token
  const { data: locations = [], isLoading: locationsLoading, isError: locationsError, error: locationsFetchError } = useQuery<UserLocation[], Error>({
    queryKey: ['userLocations', user?.id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || null;
      return apiClient.getUserLocations(token);
    },
    enabled: !!user && !authLoading,
  });

  // Mutation for adding a location
  const addLocationMutation = useMutation<UserLocation, Error, Omit<UserLocation, 'id' | 'isPrimary'>>({
    mutationFn: async (newLocationData) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || null;
      return apiClient.addUserLocation(newLocationData, token);
    },
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: ['userLocations', user?.id] });
      toast({ title: "Location Added", description: `"${newLocation.name}" has been saved.` });
    },
    onError: (error) => {
      toast({ title: "Error Adding Location", description: error.message || "Could not save location.", variant: "destructive" });
    },
  });

  // Mutation for deleting a location
  const deleteLocationMutation = useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (locationId) => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || null;
      return apiClient.deleteUserLocation(locationId, token);
    },
    onSuccess: (data, locationId) => {
      if (data.success) {
        // Optimistically update cache before invalidating for smoother UI
        queryClient.setQueryData<UserLocation[]>(['userLocations', user?.id], (oldData) =>
          oldData ? oldData.filter(loc => loc.id !== locationId) : []
        );
        queryClient.invalidateQueries({ queryKey: ['userLocations', user?.id] });
        toast({ title: "Location Deleted", description: "The location has been removed." });
      } else {
         toast({ title: "Deletion Failed", description: "Could not remove the location.", variant: "destructive" });
      }
    },
    onError: (error) => {
       toast({ title: "Error Deleting Location", description: error.message || "Could not remove location.", variant: "destructive" });
    },
  });

   // Mutation for setting primary location
   const setPrimaryLocationMutation = useMutation<{ success: boolean }, Error, string>({
     mutationFn: async (locationId) => {
       const { data: { session } } = await supabase.auth.getSession();
       const token = session?.access_token || null;
       return apiClient.setPrimaryLocation(locationId, token);
     },
     onSuccess: (data, locationId) => {
       if (data.success) {
         // Optimistically update cache
         queryClient.setQueryData<UserLocation[]>(['userLocations', user?.id], (oldData) =>
            oldData ? oldData.map(loc => ({ ...loc, isPrimary: loc.id === locationId })) : []
         );
         queryClient.invalidateQueries({ queryKey: ['userLocations', user?.id] });
         toast({ title: "Primary Location Updated" });
       } else {
         toast({ title: "Update Failed", description: "Could not set primary location.", variant: "destructive" });
       }
     },
     onError: (error) => {
       toast({ title: "Error Updating Primary Location", description: error.message, variant: "destructive" });
     },
   });

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <MainNavigation />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-1/3 mb-6" />
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-40 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  // Redirect if user is not logged in
  if (!user) {
    return <Navigate to="/auth?redirect=/manage-locations" replace />;
  }

  const renderContent = () => {
    if (locationsLoading) {
       return (
         <div className="space-y-8">
           <Skeleton className="h-8 w-1/3 mb-4" />
           <Skeleton className="h-40 w-full mb-6" />
           <Skeleton className="h-40 w-full" />
         </div>
       );
    }

    if (locationsError) {
       return (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error Loading Locations</AlertTitle>
            <AlertDescription>
              {locationsFetchError?.message || "Could not fetch your saved locations. Please try again later."}
            </AlertDescription>
          </Alert>
       );
    }

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Your Locations</h1>
          <Button variant="outline" asChild>
            <Link to="/profile">Back to Profile</Link>
          </Button>
        </div>

        {/* Basic Tier: Show only primary location */}
        {membershipTier === 'basic' && (
          <div className="p-6 border rounded-lg bg-card shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Primary Location</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your primary location is used for searches on the Basic tier. Upgrade to Premium or Expert to save multiple locations.
            </p>
            <LocationList
              locations={locations.filter(loc => loc.isPrimary)}
              onDelete={deleteLocationMutation.mutate}
              onSetPrimary={setPrimaryLocationMutation.mutate}
              isLoading={deleteLocationMutation.isPending || setPrimaryLocationMutation.isPending}
              isPrimaryFeatureEnabled={false}
            />
             {locations.filter(loc => loc.isPrimary).length === 0 && !locationsLoading && (
                 <p className="text-sm text-muted-foreground mt-4">No primary location set.</p>
             )}
          </div>
        )}

        {/* Premium/Expert Tier: Add form and list */}
        {(membershipTier === 'premium' || membershipTier === 'expert') && (
          <>
            <div className="p-6 border rounded-lg bg-card shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Add New Location</h2>
              <AddLocationForm
                 onSubmit={addLocationMutation.mutate}
                 isLoading={addLocationMutation.isPending}
              />
            </div>

            <div className="p-6 border rounded-lg bg-card shadow-sm">
              <h2 className="text-xl font-semibold mb-3">Your Saved Locations</h2>
               <p className="text-sm text-muted-foreground mb-4">
                 Manage your saved locations. Premium users can select these by name during searches.
               </p>
              <LocationList
                 locations={locations}
                 onDelete={deleteLocationMutation.mutate}
                 onSetPrimary={setPrimaryLocationMutation.mutate}
                 isLoading={deleteLocationMutation.isPending || setPrimaryLocationMutation.isPending || addLocationMutation.isPending}
                 isPrimaryFeatureEnabled={true}
              />
               {locations.length === 0 && !locationsLoading && (
                   <p className="text-sm text-muted-foreground mt-4">You haven't saved any locations yet.</p>
               )}
            </div>
          </>
        )}

        {/* Fallback for unknown/null tier after loading */}
        {!authLoading && !membershipTier && (
           <p className="text-muted-foreground">Could not determine membership tier. Location features unavailable.</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <MainNavigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default ManageLocationsPage;
