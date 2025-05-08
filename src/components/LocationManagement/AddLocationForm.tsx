import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth'; // To potentially get user ID for API call

export const AddLocationForm: React.FC = () => {
  const { user } = useAuth();
  const [locationName, setLocationName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Placeholder for API call loading state
  const [error, setError] = useState<string | null>(null); // Placeholder for API error

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName || !zipCode || !user) {
      setError('Please fill in all fields and ensure you are logged in.');
      return;
    }
    // Basic zip code validation (can be improved)
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      setError('Please enter a valid 5-digit zip code.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Placeholder for API call to save the location
      console.log('Submitting new location:', { userId: user.id, locationName, zipCode });
      // await apiClient.saveUserLocation({ userId: user.id, locationName, zipCode }); // Example API call
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000)); 

      // Clear form on success
      setLocationName('');
      setZipCode('');
      alert('Location saved successfully! (Simulation)'); // Replace with toast notification
      // TODO: Trigger refetch of location list if using React Query

    } catch (apiError: any) {
      console.error('Error saving location:', apiError);
      setError(apiError?.message || 'Failed to save location.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded-md bg-muted/50">
      <div>
        <Label htmlFor="locationName">Location Name</Label>
        <Input
          id="locationName"
          type="text"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="e.g., Home, Work"
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="locationZipCode">Zip Code</Label>
        <Input
          id="locationZipCode"
          type="text"
          value={zipCode}
          onChange={(e) => setZipCode(e.target.value)}
          placeholder="e.g., 90210"
          required
          pattern="\d{5}(-\d{4})?" // Basic pattern validation
          title="Enter a 5-digit zip code"
          disabled={isLoading}
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Location'}
      </Button>
    </form>
  );
};

export default AddLocationForm;