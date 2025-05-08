import React from 'react';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
// Import placeholder components for location management
import { LocationList } from '@/components/LocationManagement/LocationList'; // Use named import
import AddLocationForm from '@/components/LocationManagement/AddLocationForm'; // Use default import

export const ManageLocationsPage: React.FC = () => {
  const { user, loading: authLoading, membershipTier } = useAuth();

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <MainNavigation />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-1/4 mb-4" />
          <Skeleton className="h-40 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  // Redirect if user is not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Placeholder content - Replace with actual components later
  const renderContent = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Manage Your Locations</h2>

        {membershipTier === 'basic' && (
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="text-lg font-medium mb-2">Primary Location</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your primary location is used for searches on the Basic tier.
            </p>
            {/* LocationList will show the primary location */}
            <LocationList />
          </div>
        )}

        {(membershipTier === 'premium' || membershipTier === 'expert') && (
          <div className="p-4 border rounded-lg bg-card space-y-6">
             <div>
               <h3 className="text-lg font-medium mb-2">Add New Location</h3>
               <AddLocationForm />
             </div>

             <div>
               <h3 className="text-lg font-medium mb-2">Your Saved Locations</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage your saved locations below. Premium users can select these for searches.
                </p>
               <LocationList />
             </div>
          </div>
        )}

        {membershipTier !== 'basic' && membershipTier !== 'premium' && membershipTier !== 'expert' && (
           <p className="text-muted-foreground">Location management features depend on your membership tier.</p>
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

export default ManageLocationsPage; // Default export for lazy loading if needed later