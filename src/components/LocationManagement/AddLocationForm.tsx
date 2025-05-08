import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react'; // Import Loader2

// Define the shape of the data expected by the onSubmit prop
interface LocationFormData {
  name: string;
  zipCode: string;
}

interface AddLocationFormProps {
  onSubmit: (data: LocationFormData) => void; // Callback for submitting data
  isLoading?: boolean; // Loading state controlled by parent mutation
}

export const AddLocationForm: React.FC<AddLocationFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [locationName, setLocationName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null); // Local form validation error

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null); // Clear previous errors

    // Basic validation
    if (!locationName.trim() || !zipCode.trim()) {
      setFormError('Please fill in both location name and zip code.');
      return;
    }
    if (!/^\d{5}(-\d{4})?$/.test(zipCode.trim())) {
      setFormError('Please enter a valid 5-digit zip code.');
      return;
    }

    // Call the onSubmit prop passed from the parent (which triggers the mutation)
    onSubmit({ name: locationName.trim(), zipCode: zipCode.trim() });

    // Clear form fields immediately after submission attempt
    // Parent component's mutation handles success/error feedback & state
    setLocationName('');
    setZipCode('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className="mt-1"
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
          className="mt-1"
        />
      </div>
      {formError && <p className="text-red-500 text-sm">{formError}</p>}
      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? 'Saving...' : 'Save Location'}
      </Button>
    </form>
  );
};

export default AddLocationForm;