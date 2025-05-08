import React from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Star } from 'lucide-react';
import { UserLocation } from '@/lib/api-client'; // Import UserLocation type

interface LocationListProps {
  locations: UserLocation[];
  onDelete: (locationId: string) => void; // Use string ID from UserLocation
  onSetPrimary: (locationId: string) => void; // Use string ID from UserLocation
  isLoading?: boolean; // Optional loading state from parent
  isPrimaryFeatureEnabled?: boolean; // Control if Set Primary button is shown/enabled
}

export const LocationList: React.FC<LocationListProps> = ({
  locations,
  onDelete,
  onSetPrimary,
  isLoading = false, // Default to false if not provided
  isPrimaryFeatureEnabled = true, // Default to true
}) => {

  const handleSetPrimary = (locationId: string) => {
    // Optional: Add confirmation if needed
    onSetPrimary(locationId);
  };

  const handleDelete = (locationId: string, locationName: string) => {
     if (confirm(`Are you sure you want to delete "${locationName}"?`)) {
        onDelete(locationId);
     }
  };

  // Show skeleton only if explicitly loading (usually during mutations) and no locations are passed yet
  // The main loading state is handled by the parent page component
  if (isLoading && locations.length === 0) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    );
  }

  // Note: Error handling is now managed by the parent component using the query
  // The "no locations" message is also handled by the parent for better context

  if (!isLoading && locations.length === 0) {
      // Render nothing if not loading and no locations (parent shows message)
      return null;
  }


  return (
    <div className="space-y-3">
      {locations.map(location => (
        <div key={location.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
          <div>
            <p className="font-medium">{location.name}</p>
            <p className="text-sm text-muted-foreground">{location.zipCode}</p>
          </div>
          <div className="flex items-center space-x-2">
            {location.isPrimary ? (
              <span className="text-xs font-semibold text-green-600 flex items-center px-2 py-1 rounded bg-green-100/80">
                <Star className="h-3 w-3 mr-1 fill-green-600" /> Primary
              </span>
            ) : (
              isPrimaryFeatureEnabled && ( // Only show button if feature enabled
                <Button
                  variant="ghost"
                  size="icon" // Make button smaller
                  onClick={() => handleSetPrimary(location.id)}
                  title="Set as Primary"
                  disabled={isLoading} // Disable during mutation
                  className="h-8 w-8 text-muted-foreground hover:text-foreground" // Adjust size and styling
                >
                  <Star className="h-4 w-4" />
                </Button>
              )
            )}
            <Button
              variant="ghost"
              size="icon" // Make button smaller
              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8" // Adjust size
              onClick={() => handleDelete(location.id, location.name)}
              title="Delete Location"
              disabled={isLoading} // Disable during mutation
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};