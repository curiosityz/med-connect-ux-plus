
import React, { useState, useMemo, useEffect } from 'react';
import './ProviderSearch.css';
import { useAuth } from '@/hooks/useAuth';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearch } from '@/contexts/SearchContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchApiParams } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Check, ChevronsUpDown } from "lucide-react";
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const MOCK_INSURANCES = [
  { id: "aetna", label: "Aetna" },
  { id: "cigna", label: "Cigna" },
  { id: "uhc", label: "United Healthcare" },
  { id: "bluecross", label: "Blue Cross Blue Shield" },
  { id: "medicare", label: "Medicare" },
];

type SortByType = SearchApiParams['sortBy'];

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
  // Always call these hooks unconditionally at the top level
  const { membershipTier, loading: authLoading } = useAuth();
  const { getToken } = useClerkAuth();
  const { searchState, fetchSuggestions } = useSearch();
  
  // Initialize all state variables, regardless of conditions
  const [drugInput, setDrugInput] = useState(drugName);
  const debouncedDrugInput = useDebounce(drugInput, 300);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Get token on mount and when auth changes - no conditions
  useEffect(() => {
    const loadToken = async () => {
      try {
        const newToken = await getToken();
        setToken(newToken);
      } catch (error) {
        console.error("Error getting token:", error);
        setToken(null);
      }
    };
    
    loadToken();
  }, [getToken]);

  // Always define this value, don't make it conditional
  const isLoadingSuggestions = searchState.isLoading && drugInput.length > 0 && showSuggestionsDropdown;
  const drugSuggestionsFromContext = searchState.suggestions || [];

  // Effect to fetch suggestions based on drug input
  useEffect(() => {
    const fetchSuggestionsWithToken = async () => {
      if (debouncedDrugInput && debouncedDrugInput.length >= 2) {
        try {
          const currentToken = await getToken();
          await fetchSuggestions(debouncedDrugInput, currentToken);
          setShowSuggestionsDropdown(true);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      } else {
        setShowSuggestionsDropdown(false);
      }
    };
    
    fetchSuggestionsWithToken();
  }, [debouncedDrugInput, fetchSuggestions, getToken]);

  // Sync with parent state
  useEffect(() => {
    setDrugInput(drugName);
  }, [drugName]);

  // Compute primaryLocationZip consistently
  const primaryLocationZip = useMemo(() => (membershipTier === 'basic' ? "90210" : null), [membershipTier]);

  // Define all handler functions consistently
  const handleDrugInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDrugInput(value);
    if (value.length >= 2) {
      setShowSuggestionsDropdown(true);
    } else {
      setShowSuggestionsDropdown(false);
    }
  };

  const handleDrugSuggestionSelect = (suggestion: string) => {
    setDrugInput(suggestion);
    onDrugNameChange(suggestion);
    setShowSuggestionsDropdown(false);
  };

  const handleDrugInputBlur = () => {
    setTimeout(() => {
      setShowSuggestionsDropdown(false);
      if (drugInput && drugInput !== drugName) {
        onDrugNameChange(drugInput);
      }
    }, 150);
  };
  
  const handleDrugInputFocus = () => {
    if (drugInput.length >= 2 && drugSuggestionsFromContext.length > 0) {
        setShowSuggestionsDropdown(true);
    }
  };

  const handleInsuranceChange = (checked: boolean | 'indeterminate', insuranceId: string) => {
    const newSelection = checked
      ? [...selectedInsurances, insuranceId]
      : selectedInsurances.filter(id => id !== insuranceId);
    onSelectedInsurancesChange(newSelection);
  };

  // Create a renderLocationInput function that always returns JSX
  const renderLocationInput = () => {
    // Always define renderLocationInput output regardless of conditions
    if (authLoading) {
      return <div className="sm:col-span-1"><Skeleton className="h-10 w-full" /></div>;
    }
    
    let labelText = "Zip Code";
    let placeholderText = "e.g., 90210";
    
    if (membershipTier === 'basic') {
      return (
        <div className="sm:col-span-1">
          <Label htmlFor="location" className="input-label">Primary Location</Label>
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
        <Label htmlFor="locationInput" className="input-label">{labelText}</Label>
        <Input
          id="locationInput"
          type="text"
          value={locationInput}
          onChange={(e) => onLocationInputChange(e.target.value)}
          placeholder={placeholderText}
          disabled={authLoading}
        />
        {membershipTier === 'premium' && (
          <p className="text-xs text-muted-foreground mt-1">Select from saved locations.</p>
        )}
      </div>
    );
  };

  return (
    <details className="provider-search-details" open>
      <summary className="provider-search-summary">Search Filters</summary>
      <div className="provider-search-grid">
        <div className="relative sm:col-span-1">
          <Label htmlFor="drugName" className="input-label">Drug Name</Label>
          <Input
            id="drugName"
            type="text"
            value={drugInput}
            onChange={handleDrugInputChange}
            onFocus={handleDrugInputFocus}
            onBlur={handleDrugInputBlur}
            placeholder="e.g., Lisinopril"
            autoComplete="off"
          />
          {showSuggestionsDropdown && (
            <div className="suggestion-dropdown">
              {isLoadingSuggestions && (
                <div className="p-2 text-center text-muted-foreground flex items-center justify-center">
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                </div>
              )}
              {!isLoadingSuggestions && (!drugSuggestionsFromContext || drugSuggestionsFromContext.length === 0) && debouncedDrugInput.length >= 2 && (
                 <div className="p-2 text-center text-muted-foreground">No suggestions found.</div>
              )}
              {!isLoadingSuggestions && drugSuggestionsFromContext && drugSuggestionsFromContext.length > 0 && (
                <ul>
                  {drugSuggestionsFromContext.map((suggestion, index) => (
                    <li
                      key={index}
                      className="suggestion-item"
                      onMouseDown={() => handleDrugSuggestionSelect(suggestion)}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {renderLocationInput()}

        <div className="sm:col-span-1">
          <Label htmlFor="radius" className="input-label">Search Radius (miles)</Label>
          <Input
            id="radius"
            type="number"
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            placeholder="e.g., 10"
            min="1"
          />
        </div>

        <div className="sm:col-span-1">
          <Label htmlFor="minClaims" className="input-label">Min. Claims</Label>
          <Input
            id="minClaims"
            type="number"
            value={minClaims || ''}
            onChange={(e) => onMinClaimsChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder="e.g., 5"
            min="0"
          />
        </div>

        <div className="sm:col-span-1">
          <Label htmlFor="taxonomyClass" className="input-label">Specialty (Taxonomy)</Label>
          <Input
            id="taxonomyClass"
            type="text"
            value={taxonomyClass || ''}
            onChange={(e) => onTaxonomyClassChange(e.target.value || undefined)}
            placeholder="e.g., Internal Medicine"
          />
        </div>

        <div className="sm:col-span-1">
          <Label htmlFor="sortBy" className="input-label">Sort By</Label>
          <Select value={sortBy} onValueChange={(value: SortByType) => onSortByChange(value)}>
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

        {/* Insurance Filter using Popover + Command */}
        <div className="sm:col-span-2 md:col-span-2">
           <Label className="input-label">Insurance Accepted</Label>
           <Popover>
             <PopoverTrigger asChild>
               <Button
                 variant="outline"
                 role="combobox"
                 className="w-full justify-between font-normal"
               >
                 <span className="truncate">
                   {selectedInsurances.length === 0
                     ? "Select insurances..."
                     : selectedInsurances.length === 1
                     ? MOCK_INSURANCES.find(ins => ins.id === selectedInsurances[0])?.label ?? "Select insurances..."
                     : `${selectedInsurances.length} selected`}
                 </span>
                 <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
               </Button>
             </PopoverTrigger>
             <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
               <Command>
                 <CommandInput placeholder="Search insurance..." />
                 <CommandList>
                   <CommandEmpty>No insurance found.</CommandEmpty>
                   <CommandGroup>
                    <ScrollArea className="h-48">
                     {MOCK_INSURANCES.map((insurance) => (
                       <CommandItem
                         key={insurance.id}
                         value={insurance.label} // Use label for searching
                         onSelect={() => {
                           handleInsuranceChange(!selectedInsurances.includes(insurance.id), insurance.id);
                         }}
                         className="cursor-pointer"
                       >
                         <Checkbox
                           className={cn(
                             "mr-2 h-4 w-4",
                             selectedInsurances.includes(insurance.id)
                               ? "opacity-100"
                               : "opacity-0" // Hide checkbox, show checkmark via CommandItem's indicator
                           )}
                           checked={selectedInsurances.includes(insurance.id)}
                         />
                         <span>{insurance.label}</span>
                         <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedInsurances.includes(insurance.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                       </CommandItem>
                     ))}
                     </ScrollArea>
                   </CommandGroup>
                 </CommandList>
               </Command>
             </PopoverContent>
           </Popover>
           {selectedInsurances.length > 0 && (
             <div className="mt-1 flex flex-wrap gap-1">
               {selectedInsurances.map(id => {
                 const insurance = MOCK_INSURANCES.find(ins => ins.id === id);
                 return insurance ? (
                   <Badge key={id} variant="secondary" className="font-normal">
                     {insurance.label}
                   </Badge>
                 ) : null;
               })}
             </div>
           )}
         </div>


        <div className="sm:col-span-1 md:col-span-2">
          <Label htmlFor="minRating" className="input-label">Min. Rating (1-5)</Label>
          <div className="flex items-center space-x-1 mb-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`h-6 w-6 cursor-pointer ${minRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                onClick={() => onMinRatingChange(minRating === star ? 0 : star)}
              />
            ))}
          </div>
           <Input
            id="minRatingInput"
            type="number"
            value={minRating || ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              onMinRatingChange(val >=0 && val <=5 ? val : 0);
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
