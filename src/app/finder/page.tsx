
"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Pill, MapPin, Search, Loader2, AlertCircle, BriefcaseMedical, Filter, Bookmark, Printer, Trash2, Phone, TrendingUp, AreaChart } from 'lucide-react';
import { findPrescribersAction } from '../actions';
import type { PrescriberSearchInput, PrescriberSearchOutput } from '@/ai/flows/prescriber-search-flow';

interface PrescriberResult {
  prescriberName: string;
  credentials?: string;
  specialization?: string;
  address: string;
  zipcode: string;
  phoneNumber?: string;
  medicationMatch: string;
  confidenceScore: number;
}

const searchAreaTypes = [
  { value: 'exact', label: 'Exact Zipcode' },
  { value: 'prefix3', label: 'Wider Area (Same 3-digit prefix)' },
];

const confidenceFilterOptions = [
  { value: 'any', label: 'Any Confidence' },
  { value: 'high', label: 'High (70-100%)' },
  { value: 'medium', label: 'Medium (30-69%)' },
  { value: 'low', label: 'Low (0-29%)' },
];

const loadingPhrases = [
  "Searching for prescribers...",
  "Accessing medication database...",
  "Scanning local area data...",
  "Cross-referencing information...",
  "Finalizing results...",
  "Almost there!",
];

const formatPhoneNumber = (phoneNumberString?: string): string | undefined => {
  if (!phoneNumberString) return undefined;
  const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
  if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  return phoneNumberString; 
};

export default function FinderPage() {
  const [medicationName, setMedicationName] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [searchAreaType, setSearchAreaType] = useState<'exact' | 'prefix3'>(searchAreaTypes[0].value as 'exact' | 'prefix3');
  const [confidenceFilter, setConfidenceFilter] = useState<string>('any');
  
  const [allPrescribers, setAllPrescribers] = useState<PrescriberResult[]>([]);
  const [displayedPrescribers, setDisplayedPrescribers] = useState<PrescriberResult[]>([]);
  const [shortlist, setShortlist] = useState<PrescriberResult[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [currentLoadingPhrase, setCurrentLoadingPhrase] = useState(loadingPhrases[0]);

  const { toast } = useToast();

  const getConfidenceColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Effect for loading phrases
  useEffect(() => {
    let phraseInterval: NodeJS.Timeout;
    if (isLoading) {
      let currentIndex = 0;
      setCurrentLoadingPhrase(loadingPhrases[currentIndex]); 
      phraseInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % loadingPhrases.length;
        setCurrentLoadingPhrase(loadingPhrases[currentIndex]);
      }, 1800); 
    }
    return () => {
      if (phraseInterval) {
        clearInterval(phraseInterval);
      }
    };
  }, [isLoading]);

  // Effect for filtering displayed prescribers
  useEffect(() => {
    let filtered = allPrescribers;
    if (confidenceFilter !== 'any') {
      filtered = allPrescribers.filter(p => {
        if (confidenceFilter === 'high') return p.confidenceScore >= 70;
        if (confidenceFilter === 'medium') return p.confidenceScore >= 30 && p.confidenceScore < 70;
        if (confidenceFilter === 'low') return p.confidenceScore < 30;
        return true;
      });
    }
    setDisplayedPrescribers(filtered);
  }, [allPrescribers, confidenceFilter]);

  // Effect for updating the search message based on results and filters
  useEffect(() => {
    if (isLoading) {
      // Message is handled by loading phrases or is null from handleSearch start
      return;
    }

    // At this point, isLoading is false. API call has finished.
    // The initial message from response.message is ALREADY in the searchMessage state
    // because it was set directly in handleSearch.

    if (allPrescribers.length > 0) {
      // API returned results
      let searchAreaDescription = `in zipcode ${zipcode}`;
      if (searchAreaType === 'prefix3' && zipcode.length >= 3) {
        searchAreaDescription = `in the area starting with zipcode prefix ${zipcode.substring(0, 3)}`;
      }
      const baseMessageFromCurrentData = `Found ${allPrescribers.length} prescriber(s) for "${medicationName}" ${searchAreaDescription}.`;

      if (searchMessage && (searchMessage.startsWith("No prescribers found") || searchMessage.startsWith("Flow Error:"))) {
        // If the API message (already in searchMessage state) was an error or "no results",
        // we should stick with that, even if allPrescribers somehow got populated (shouldn't happen).
        // This case is mostly defensive. The toast in handleSearch already handled this.
      } else if (confidenceFilter !== 'any') {
        if (allPrescribers.length === displayedPrescribers.length) {
          setSearchMessage(`${baseMessageFromCurrentData} All match current confidence filter.`);
        } else {
          setSearchMessage(`${baseMessageFromCurrentData} Displaying ${displayedPrescribers.length} after filtering by confidence.`);
        }
      } else {
        // No confidence filter, or API message was not an error/no results.
        setSearchMessage(baseMessageFromCurrentData);
      }
    } else {
      // allPrescribers is empty.
      // `searchMessage` state should already hold the API's message (e.g., "No prescribers found", error, or null).
      // We don't need to set it again here, as handleSearch took care of it.
      // If searchMessage is null at this point (e.g. API returned [] results and null message) and a search was made,
      // the UI will show "No prescribers to display" or similar based on displayedPrescribers.length.
    }
  // Critical: `searchMessage` is NOT a dependency here because this effect SETS it.
  // Dependencies are the values that, when changed, should lead to recalculating the message.
  }, [allPrescribers, displayedPrescribers, confidenceFilter, medicationName, zipcode, searchAreaType, isLoading]);


  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!medicationName.trim() || !zipcode.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter medication name, 5-digit zipcode, and select a search area.',
        variant: 'destructive',
      });
      return;
    }
    if (zipcode.trim().length !== 5 || !/^\d{5}$/.test(zipcode.trim())) {
      toast({
        title: 'Invalid Zipcode',
        description: 'Please enter a valid 5-digit zipcode.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setAllPrescribers([]);
    setDisplayedPrescribers([]);
    setSearchMessage(null); 

    const input: PrescriberSearchInput = { 
      medicationName, 
      zipcode,
      searchAreaType
    };
    
    const response: PrescriberSearchOutput = await findPrescribersAction(input);

    setIsLoading(false); // Set loading to false AFTER the API call.
    setSearchMessage(response.message || null); // Set message from API response. This is the source of truth.

    if (response.results && response.results.length > 0) {
      setAllPrescribers(response.results); // This will trigger the filtering useEffect.
    } else {
      setAllPrescribers([]); 
      setDisplayedPrescribers([]);
       if (response.message && (response.message.startsWith("No prescribers found") || response.message.startsWith("Flow Error:"))) {
         toast({
            title: response.message.startsWith("Flow Error:") ? 'Search Error' : 'No Results',
            description: response.message,
            variant: response.message.startsWith("Flow Error:") ? 'destructive' : 'default',
         });
       } else if (!response.message) { 
         toast({
            title: 'No Results',
            description: 'No prescribers found matching your criteria.',
            variant: 'default',
         });
       }
    }
  };

  const isPrescriberInShortlist = (prescriber: PrescriberResult) => {
    return shortlist.some(item => item.prescriberName === prescriber.prescriberName && item.address === prescriber.address);
  };

  const toggleShortlist = (prescriber: PrescriberResult) => {
    if (isPrescriberInShortlist(prescriber)) {
      setShortlist(prev => prev.filter(item => !(item.prescriberName === prescriber.prescriberName && item.address === prescriber.address)));
      toast({ title: "Removed from Shortlist", description: `${prescriber.prescriberName} removed.` });
    } else {
      setShortlist(prev => [...prev, prescriber]);
      toast({ title: "Added to Shortlist", description: `${prescriber.prescriberName} added.` });
    }
  };

  const handlePrintShortlist = () => {
    window.print();
  };

  return (
    <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center space-y-6">
      <Card className="w-full max-w-2xl shadow-xl bg-card no-print-section">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <BriefcaseMedical className="h-10 w-10 text-primary mr-3" />
            <CardTitle className="text-3xl font-bold">RX Prescribers Search</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Find prescribers by medication and location.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medicationName" className="flex items-center text-sm font-medium">
                <Pill className="h-4 w-4 mr-2 text-primary" />
                Medication Name
              </Label>
              <Input
                id="medicationName"
                type="text"
                placeholder="e.g., Lisinopril, Alprazolam"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                aria-label="Medication Name"
                required
                className="text-base md:text-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="zipcode" className="flex items-center text-sm font-medium">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  Center Zipcode (5-digits)
                </Label>
                <Input
                  id="zipcode"
                  type="text"
                  placeholder="e.g., 19018"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  aria-label="Zipcode"
                  pattern="\d{5}"
                  title="Enter a 5-digit zipcode."
                  maxLength={5}
                  required
                  className="text-base md:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="searchAreaType" className="flex items-center text-sm font-medium">
                  <AreaChart className="h-4 w-4 mr-2 text-primary" /> 
                  Search Area
                </Label>
                <Select 
                  value={searchAreaType} 
                  onValueChange={(value) => setSearchAreaType(value as 'exact' | 'prefix3')}
                >
                  <SelectTrigger id="searchAreaType" className="w-full text-base md:text-sm">
                    <SelectValue placeholder="Select search area" />
                  </SelectTrigger>
                  <SelectContent>
                    {searchAreaTypes.map(areaType => (
                      <SelectItem key={areaType.value} value={areaType.value}>{areaType.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="confidenceFilter" className="flex items-center text-sm font-medium">
                  <Filter className="h-4 w-4 mr-2 text-primary" />
                  Filter by Confidence Score
                </Label>
                <Select
                  value={confidenceFilter}
                  onValueChange={setConfidenceFilter}
                >
                  <SelectTrigger id="confidenceFilter" className="w-full text-base md:text-sm">
                    <SelectValue placeholder="Filter by confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    {confidenceFilterOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            <Button type="submit" disabled={isLoading} className="w-full text-lg py-6">
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Search className="mr-2 h-5 w-5" />
              )}
              Search Prescribers
            </Button>
          </form>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">{currentLoadingPhrase}</p>
            </div>
          )}
          
          {!isLoading && searchMessage && (
            <div className={`p-4 rounded-md text-sm flex items-start ${
                searchMessage.startsWith("No prescribers found") || searchMessage.startsWith("Flow Error:")
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <p className="flex-grow">{searchMessage}</p>
            </div>
          )}
          
          {!isLoading && displayedPrescribers.length === 0 && !searchMessage && medicationName && zipcode && (
             <div className="p-4 rounded-md text-sm flex items-start bg-blue-50 text-blue-700 border border-blue-200">
                <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                <p className="flex-grow">No prescribers match your current filter criteria. Try adjusting the confidence filter or search terms.</p>
            </div>
          )}


          {displayedPrescribers.length > 0 && !isLoading && (
            <ScrollArea className="h-[400px] w-full rounded-md border p-1 bg-muted/20 shadow-inner animate-in fade-in-50 duration-700 no-print-section">
              <div className="space-y-3 p-3">
                {displayedPrescribers.map((prescriber, index) => (
                  <Card key={index} className="shadow-md hover:shadow-lg transition-shadow bg-card relative">
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleShortlist(prescriber)}
                        title={isPrescriberInShortlist(prescriber) ? 'Remove from Shortlist' : 'Add to Shortlist'}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-primary no-print-button"
                        aria-label={isPrescriberInShortlist(prescriber) ? 'Remove from Shortlist' : 'Add to Shortlist'}
                      >
                        <Bookmark className={`h-5 w-5 ${isPrescriberInShortlist(prescriber) ? 'text-primary fill-primary' : ''}`} />
                      </Button>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between pr-10">
                        <div className="flex items-center">
                          <BriefcaseMedical className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                          <span className="font-semibold">{prescriber.prescriberName}</span>
                          {prescriber.credentials && <span className="ml-1.5 text-sm text-muted-foreground">({prescriber.credentials})</span>}
                        </div>
                      </CardTitle>
                      {prescriber.specialization && (
                        <CardDescription className="text-xs text-primary/80 -mt-1">
                           Specialization: {prescriber.specialization}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="text-sm space-y-1.5 text-muted-foreground">
                      <p><strong>Address:</strong> {prescriber.address}, {prescriber.zipcode}</p>
                      {prescriber.phoneNumber && (
                        <p className="flex items-center">
                          <Phone className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                          <strong>Phone:</strong>&nbsp;{formatPhoneNumber(prescriber.phoneNumber)}
                        </p>
                      )}
                      <p><strong>Matched Medication:</strong> <span className="font-medium text-foreground">{prescriber.medicationMatch}</span></p>
                      <div className="flex items-center pt-1">
                        <TrendingUp className="h-4 w-4 mr-1.5 text-primary/70" />
                        <strong>Confidence:</strong>&nbsp;{prescriber.confidenceScore}%
                        <div className={`w-3 h-3 rounded-full ml-2 ${getConfidenceColor(prescriber.confidenceScore)}`} title={`Confidence Score: ${prescriber.confidenceScore}%`}></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground/80">
          <p>Search powered by Genkit and PostgreSQL. Data is for informational purposes only. Results limited (max 50).</p>
        </CardFooter>
      </Card>

      {shortlist.length > 0 && !isLoading && (
        <Card className="w-full max-w-2xl shadow-xl bg-card printable-shortlist-area mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center">
              <Bookmark className="h-6 w-6 text-primary mr-3 fill-primary" />
              <CardTitle className="text-2xl font-bold">My Shortlist ({shortlist.length})</CardTitle>
            </div>
            <Button onClick={handlePrintShortlist} variant="outline" className="no-print-button">
              <Printer className="mr-2 h-4 w-4" /> Print Shortlist
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {shortlist.map((prescriber, index) => (
              <Card key={`shortlist-${index}`} className="p-4 shadow-sm bg-muted/30 shortlist-item-print relative">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleShortlist(prescriber)}
                    title="Remove from Shortlist"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive no-print-button"
                    aria-label="Remove from Shortlist"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
                <h3 className="text-md font-semibold text-foreground flex items-center">
                  <BriefcaseMedical className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                  {prescriber.prescriberName} 
                  {prescriber.credentials && <span className="ml-1.5 text-xs text-muted-foreground">({prescriber.credentials})</span>}
                </h3>
                {prescriber.specialization && (
                  <p className="text-xs text-primary/80 ml-6">{prescriber.specialization}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1"><strong>Address:</strong> {prescriber.address}, {prescriber.zipcode}</p>
                {prescriber.phoneNumber && (
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Phone className="h-3 w-3 mr-1.5 text-primary/70" />
                    {formatPhoneNumber(prescriber.phoneNumber)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground"><strong>Matched Medication:</strong> {prescriber.medicationMatch}</p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <strong>Confidence:</strong>&nbsp;{prescriber.confidenceScore}%
                  <div className={`w-2.5 h-2.5 rounded-full ml-1.5 ${getConfidenceColor(prescriber.confidenceScore)}`}></div>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
