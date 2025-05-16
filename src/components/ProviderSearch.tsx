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

interface ProviderSearchProps {
  drugName: string;
  locationInput: string;
  radius: number;
  minClaims?: number;
  taxonomyClass?: string;
  sortBy: string;
  selectedInsurances: string[];
  minRating: number;
  onDrugNameChange: (value: string) => void;
  onLocationInputChange: (value: string) => void;
  onRadiusChange: (value: number) => void;
  onMinClaimsChange: (value: number | undefined) => void;
  onTaxonomyClassChange: (value: string | undefined) => void;
  onSortByChange: (value: string) => void;
  onSelectedInsurancesChange: (value: string[]) => void;
  onMinRatingChange: (value: number) => void;
  disableAutoSearch?: boolean;
}

export const ProviderSearch: React.FC<ProviderSearchProps> = ({
  drugName,
  locationInput,
  radius,
  minClaims,
  taxonomyClass,
  sortBy,
  selectedInsurances,
  minRating,
  onDrugNameChange,
  onLocationInputChange,
  onRadiusChange,
  onMinClaimsChange,
  onTaxonomyClassChange,
  onSortByChange,
  onSelectedInsurancesChange,
  onMinRatingChange,
  disableAutoSearch = false,
}) => {
  // Always call hooks unconditionally at the top level
  const { membershipTier, loading: authLoading } = useAuth();
  const { getToken } = useClerkAuth();
  const { searchState, fetchSuggestions } = useSearch();
  
  // Initialize all state variables unconditionally
  const [drugInput, setDrugInput] = useState(drugName);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [manualSuggestionSearch, setManualSuggestionSearch] = useState(false);

  // Get token on mount and when auth changes
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

  // Define this value unconditionally
  const isLoadingSuggestions = searchState.isLoading && drugInput.length > 0 && showSuggestionsDropdown;
  const drugSuggestionsFromContext = searchState.suggestions || [];

  // Only fetch suggestions when explicitly requested
  useEffect(() => {
    const fetchSuggestionsWithToken = async () => {
      if (drugInput.length >= 2 && manualSuggestionSearch) {
        try {
          const currentToken = await getToken();
          await fetchSuggestions(drugInput, currentToken);
          setShowSuggestionsDropdown(true);
          setManualSuggestionSearch(false);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setManualSuggestionSearch(false);
        }
      }
    };
    
    if (manualSuggestionSearch) {
      fetchSuggestionsWithToken();
    }
  }, [drugInput, fetchSuggestions, getToken, manualSuggestionSearch]);

  // Sync with parent state
  useEffect(() => {
    setDrugInput(drugName);
  }, [drugName]);

  // Compute primaryLocationZip unconditionally
  const primaryLocationZip = useMemo(() => (membershipTier === 'basic' ? "90210" : null), [membershipTier]);

  // Define all handler functions
  const handleDrugInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDrugInput(value);
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
    if (drugInput.length >= 2 && !disableAutoSearch) {
      setManualSuggestionSearch(true);
    }
  };
  
  const handleShowSuggestions = (e: React.MouseEvent) => {
    e.preventDefault();
    if (drugInput.length >= 2) {
      setManualSuggestionSearch(true);
    }
  };

  const handleInsuranceChange = (checked: boolean | 'indeterminate', insuranceId: string) => {
    const newSelection = checked
      ? [...selectedInsurances, insuranceId]
      : selectedInsurances.filter(id => id !== insuranceId);
    onSelectedInsurancesChange(newSelection);
  };

  // Handle manual location input change - ensure this works
  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log("Location input changed:", value);
    onLocationInputChange(value);
  };

  // Location input rendering - fix the disabled state and class issues
  const renderLocationInput = () => {
    if (authLoading) {
      return <div className="sm:col-span-1"><Skeleton className="h-10 w-full" /></div>;
    }
    
    let labelText = "Zip Code";
    let placeholderText = "e.g., 90210";
    // Make sure the field is NEVER disabled unless explicitly required
    let isDisabled = false;
    
    if (membershipTier === 'basic') {
      return (
        <div className="sm:col-span-1">
          <Label htmlFor="location" className="block text-sm font-medium">Primary Location</Label>
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
        <Label htmlFor="locationInput" className="block text-sm font-medium">
          {labelText}
        </Label>
        <Input
          id="locationInput"
          type="text"
          value={locationInput}
          onChange={handleLocationInputChange}
          placeholder={placeholderText}
          disabled={isDisabled}
          className="w-full"
        />
        {membershipTier === 'premium' && (
          <p className="text-xs text-muted-foreground mt-1">Select from saved locations.</p>
        )}
      </div>
    );
  };

  // Always render with all hooks consistently used
  return (
    <details className="provider-search-details" open>
      <summary className="provider-search-summary">Search Filters</summary>
      <div className="provider-search-grid">
        <div className="relative sm:col-span-1">
          <Label htmlFor="drugName" className="input-label">Drug Name</Label>
          <div className="flex">
            <Input
              id="drugName"
              type="text"
              className="flex-1 rounded-r-none"
              value={drugInput}
              onChange={handleDrugInputChange}
              onFocus={handleDrugInputFocus}
              onBlur={handleDrugInputBlur}
              placeholder="e.g., Lisinopril"
              autoComplete="off"
            />
            <Button 
              variant="outline" 
              className="rounded-l-none border-l-0" 
              onClick={handleShowSuggestions}>
              Suggest
            </Button>
          </div>
          {showSuggestionsDropdown && (
            <div className="suggestion-dropdown">
              {isLoadingSuggestions && (
                <div className="p-2 text-center text-muted-foreground flex items-center justify-center">
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                </div>
              )}
              {!isLoadingSuggestions && (!drugSuggestionsFromContext || drugSuggestionsFromContext.length === 0) && (
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

        {/* Remaining form fields... */}
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

        {/* Insurance Filter */}
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
                         value={insurance.label}
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
                               : "opacity-0"
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
