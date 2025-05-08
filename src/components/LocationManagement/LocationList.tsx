import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, Star } from 'lucide-react';

interface UserLocation {
  user_location_id: number;
  supabase_user_id: string;
  location_name: string;
  zip_code: string;
  is_primary: boolean;
  created_at: string;
}

const MOCK_LOCATIONS: UserLocation[] = [
  { user_location_id: 1, supabase_user_id: 'mock-user-id', location_name: 'Home', zip_code: '90210', is_primary: true, created_at: new Date().toISOString() },
  { user_location_id: 2, supabase_user_id: 'mock-user-id', location_name: 'Work', zip_code: '10001', is_primary: false, created_at: new Date().toISOString() },
  { user_location_id: 3, supabase_user_id: 'mock-user-id', location_name: 'Parents', zip_code: '60606', is_primary: false, created_at: new Date().toISOString() },
];

export const LocationList: React.FC = () => { // Ensure NAMED export
  const { user } = useAuth();
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching locations for user:', user.id);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLocations(MOCK_LOCATIONS);
      } catch (apiError: any) {
        console.error('Error fetching locations:', apiError);
        setError(apiError?.message || 'Failed to fetch locations.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocations();
  }, [user]);

  const handleSetPrimary = async (locationId: number) => {
    alert(`Simulating setting location ${locationId} as primary.`);
    // TODO: API call
  };

  const handleDelete = async (locationId: number) => {
     if (confirm(`Are you sure you want to delete location ${locationId}? (Simulation)`)) {
        alert(`Simulating deleting location ${locationId}.`);
        // TODO: API call
     }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  if (locations.length === 0) {
    return <p className="text-muted-foreground">You haven't saved any locations yet.</p>;
  }

  return (
    <div className="space-y-3">
      {locations.map(location => (
        <div key={location.user_location_id} className="flex items-center justify-between p-3 border rounded-md bg-background">
          <div>
            <p className="font-medium">{location.location_name}</p>
            <p className="text-sm text-muted-foreground">{location.zip_code}</p>
          </div>
          <div className="flex items-center space-x-2">
            {location.is_primary ? (
              <span className="text-xs font-semibold text-green-600 flex items-center">
                <Star className="h-4 w-4 mr-1 fill-green-600" /> Primary
              </span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSetPrimary(location.user_location_id)}
                title="Set as Primary"
              >
                <Star className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDelete(location.user_location_id)}
              title="Delete Location"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};