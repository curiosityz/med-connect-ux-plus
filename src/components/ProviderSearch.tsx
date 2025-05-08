import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce'; // Import useDebounce
import { useDrugSuggestions } from '@/hooks/useDrugSuggestions'; // Import the suggestions hook
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchApiParams } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Star } from "lucide-react";
import { Loader2 } from 'lucide-react'; // For loading indicator

// Mock data for UI placeholders (Insurances)
const MOCK_INSURANCES = [
  { id: "aetna", label: "Aetna" },
  { id: "cigna", label: "Cigna" },
  { id: "uhc", label: "United Healthcare" },
  { id: "bluecross", label: "Blue Cross Blue Shield" },
  { id: "medicare", label: "Medicare" },
];

type SortByType = SearchApiParams['sortBy'];

// Define props for the controlled component
interface ProviderSearchFiltersProps {
  drugName: string;
  onDrugNameChange: (value: string) => void;
  locationInput: string;
  onLocationInputChange: (value: string) => void;
  radius: number;
  onRadiusChange: (value: number) => void;
  minClaims: number | undefined;
  onMinClaimsChange: (value: number | undefined) => void;
  taxonomyClass: string | undefined;
  onTaxonomyClassChange: (value: string | undefined) => void;
  sortBy: SortByType;
  onSortByChange: (value: SortByType) => void;
  selectedInsurances: string[];
  onSelectedInsurancesChange: (value: string[]) => void;
  minRating: number;
  onMinRatingChange: (value: number) => void;
}

export const ProviderSearch: React.FC<ProviderSearchFiltersProps> = ({
  drugName, onDrugNameChange,
  locationInput, onLocationInputChange,
  radius, onRadiusChange,
  minClaims, onMinClaimsChange,
  taxonomyClass, onTaxonomyClassChange,
  sortBy, onSortByChange,
  selectedInsurances, onSelectedInsurancesChange,
  minRating, onMinRatingChange
}) => {
  const { membershipTier, loading: authLoading } = useAuth();

  // State for drug suggestions UI
  const [drugInput, setDrugInput] = useState(''); // Separate state for the input field value
  const debouncedDrugInput = useDebounce(drugInput, 300); // Debounce the input for API call
  const { data: drugSuggestions, isLoading: isLoadingSuggestions, isError: isSuggestionsError } = useDrugSuggestions(debouncedDrugInput);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);

  // Memoize primary location zip (example)
  const primaryLocationZip = useMemo(() => (membershipTier === 'basic' ? "90210" : null), [membershipTier]);

  // Handle drug input change
  const handleDrugInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDrugInput(value); // Update the raw input state
    if (value.length >= 2) {
      setShowSuggestionsDropdown(true); // Show dropdown when typing
    } else {
      setShowSuggestionsDropdown(false);
    }
    // Note: We don't call onDrugNameChange here directly anymore.
    // It's called when a suggestion is selected or maybe on blur/enter if needed.
  };

  // Handle selecting a drug suggestion
  const handleDrugSuggestionSelect = (suggestion: string) => {
    setDrugInput(suggestion); // Update input field
    onDrugNameChange(suggestion); // Update the actual filter value passed to parent
    setShowSuggestionsDropdown(false);
  };

  // Handle setting drug name filter on input blur if no suggestion was clicked
  // (Optional: depends on desired UX)
  const handleDrugInputBlur = () => {
    // Delay hiding dropdown to allow click on suggestion
    setTimeout(() => {
        setShowSuggestionsDropdown(false);
        // Update the main filter state only if the input wasn't cleared
        // and doesn't exactly match the current filter (if already set by suggestion click)
        if (drugInput && drugInput !== drugName) {
             onDrugNameChange(drugInput);
        }
    }, 150);
  };


  // Handle insurance checkbox change
  const handleInsuranceChange = (checked: boolean | 'indeterminate', insuranceId: string) => {
    const newSelection = checked
      ? [...selectedInsurances, insuranceId]
      : selectedInsurances.filter(id => id !== insuranceId);
    onSelectedInsurancesChange(newSelection); // Call prop handler
  };

  // Render location input based on tier
  const renderLocationInput = () => {
    if (authLoading) return <div className="sm:col-span-1"><Skeleton className="h-10 w-full" /></div>;

    let labelText = "Zip Code";
    let placeholderText = "e.g., 90210";

    if (membershipTier === 'basic') {
      return (
        <div className="sm:col-span-1">
          <Label htmlFor="location" className="font-semibold block mb-1">Primary Location</Label>
          {primaryLocationZip ? (
            <Input id="location" type="text" value={primaryLocationZip} disabled readOnly />
          ) : (
            <p className="text-sm text-muted-foreground pt-2">
              Primary location not set. Please set it in your profile to enable search.
            </p>
          )}
        </div>
      );
    } else if (membershipTier === 'premium') {
      labelText = "Location Name / Zip Code";
      placeholderText = "Enter city, state, or zip";
    }

    return (
      <div className="sm:col-span-1">
        <Label htmlFor="locationInput" className="font-semibold block mb-1">{labelText}</Label>
        <Input
          id="locationInput"
          type="text"
          value={locationInput}
          onChange={(e) => onLocationInputChange(e.target.value)} // Use prop handler
          placeholder={placeholderText}
          disabled={authLoading}
        />
        {membershipTier === 'premium' && (
          <p className="text-xs text-muted-foreground mt-1">TODO: Select from saved locations.</p>
        )}
      </div>
    );
  };

  return (
    <details className="p-4 border rounded-lg shadow-sm bg-card" open>
      <summary className="font-semibold text-lg cursor-pointer hover:text-primary">Search Filters</summary>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-end">
        {/* Drug Name */}
        <div className="relative sm:col-span-1">
          <Label htmlFor="drugName" className="font-semibold block mb-1">Drug Name</Label>
          <Input
            id="drugName"
            type="text"
            value={drugInput} // Use local input state for value
            onChange={handleDrugInputChange}
            onFocus={() => { // Show suggestions on focus if input is long enough
              if (drugInput.length >= 2 && drugSuggestions && drugSuggestions.length > 0) {
                setShowSuggestionsDropdown(true);
              }
            }}
            onBlur={handleDrugInputBlur} // Handle blur event
            placeholder="e.g., Lisinopril"
            autoComplete="off"
          />
          {/* Suggestions Dropdown */}
          {showSuggestionsDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {isLoadingSuggestions && (
                <div className="p-2 text-center text-muted-foreground flex items-center justify-center">
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                </div>
              )}
              {!isLoadingSuggestions && isSuggestionsError && (
                 <div className="p-2 text-center text-red-500">Error fetching suggestions.</div>
              )}
              {!isLoadingSuggestions && !isSuggestionsError && (!drugSuggestions || drugSuggestions.length === 0) && debouncedDrugInput.length >= 2 && (
                 <div className="p-2 text-center text-muted-foreground">No suggestions found.</div>
              )}
              {!isLoadingSuggestions && drugSuggestions && drugSuggestions.length > 0 && (
                <ul>
                  {drugSuggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="px-3 py-2 hover:bg-muted cursor-pointer"
                      onMouseDown={() => handleDrugSuggestionSelect(suggestion)} // Use onMouseDown
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Location Input */}
        {renderLocationInput()}

        {/* Radius */}
        <div className="sm:col-span-1">
          <Label htmlFor="radius" className="font-semibold block mb-1">Search Radius (miles)</Label>
          <Input
            id="radius"
            type="number"
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))} // Use prop handler
            placeholder="e.g., 10"
            min="1"
          />
        </div>

        {/* Min Claims */}
        <div className="sm:col-span-1">
          <Label htmlFor="minClaims" className="font-semibold block mb-1">Min. Claims</Label>
          <Input
            id="minClaims"
            type="number"
            value={minClaims || ''}
            onChange={(e) => onMinClaimsChange(e.target.value ? Number(e.target.value) : undefined)} // Use prop handler
            placeholder="e.g., 5"
            min="0"
          />
        </div>

        {/* Taxonomy Class */}
        <div className="sm:col-span-1">
          <Label htmlFor="taxonomyClass" className="font-semibold block mb-1">Specialty (Taxonomy)</Label>
          <Input
            id="taxonomyClass"
            type="text"
            value={taxonomyClass || ''}
            onChange={(e) => onTaxonomyClassChange(e.target.value || undefined)} // Use prop handler
            placeholder="e.g., Internal Medicine"
          />
        </div>

        {/* Sort By */}
        <div className="sm:col-span-1">
          <Label htmlFor="sortBy" className="font-semibold block mb-1">Sort By</Label>
          <Select value={sortBy} onValueChange={(value: SortByType) => onSortByChange(value)}> {/* Use prop handler */}
            <SelectTrigger id="sortBy">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="claims">Claims</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Insurance Filter Placeholder */}
        <div className="sm:col-span-2 md:col-span-2">
          <Label className="font-semibold block mb-1">Insurance Accepted (Placeholder)</Label>
          <div className="p-3 border rounded-md h-32 overflow-y-auto space-y-2 bg-background">
            {MOCK_INSURANCES.map(insurance => (
              <div key={insurance.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`insurance-${insurance.id}`}
                  checked={selectedInsurances.includes(insurance.id)}
                  onCheckedChange={(checked) => handleInsuranceChange(!!checked, insurance.id)} // Use handler
                />
                <Label htmlFor={`insurance-${insurance.id}`} className="text-sm font-normal cursor-pointer">
                  {insurance.label}
                </Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Multi-select. Actual component needed.</p>
        </div>

        {/* Min Rating Filter Placeholder */}
        <div className="sm:col-span-1 md:col-span-2">
          <Label htmlFor="minRating" className="font-semibold block mb-1">Min. Rating (1-5)</Label>
          <div className="flex items-center space-x-1 mb-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`h-6 w-6 cursor-pointer ${minRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                onClick={() => onMinRatingChange(minRating === star ? 0 : star)} // Use prop handler
              />
            ))}
          </div>
           <Input
            id="minRatingInput"
            type="number"
            value={minRating || ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              onMinRatingChange(val >=0 && val <=5 ? val : 0); // Use prop handler
            }}
            className="w-24 text-sm"
            min="0" max="5" step="1"
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground mt-1">0 for no filter. Click stars or type.</p>
        </div>
      </div>
    </details>
  );
};
