
"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Pill, MapPin, Search, Loader2, AlertCircle, BriefcaseMedical, Filter, Bookmark, Printer, Trash2, Phone, TrendingUp, Pin, SigmaSquare, Layers } from 'lucide-react';
import { findPrescribersAction } from '../actions';
// PrescriberSearchActionOutput is the type for data returned by the server action
import type { PrescriberSearchActionOutput } from '../actions';


interface PrescriberResult {
  prescriberName: string;
  credentials?: string;
  specialization?: string;
  taxonomyClass?: string;
  address: string;
  zipcode: string;
  phoneNumber?: string;
  matchedMedications: string[]; // Changed from medicationMatch
  confidenceScore: number;
  distance?: number;
}

// This local type should align with the structure of `results` in `PrescriberSearchActionOutput`
// It's essentially the same as `PrescriberResult` but good to be explicit if needed later.
// For now, PrescriberResult is sufficient.

const searchRadiusOptions = [
  { value: '5', label: '5 miles' },
  { value: '10', label: '10 miles' },
  { value: '15', label: '15 miles' },
  { value: '25', label: '25 miles' },
  { value: '50', label: '50 miles' },
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
  "Calculating distances...",
  "Cross-referencing information...",
  "Checking multiple medication criteria...",
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
  const [medicationNamesInput, setMedicationNamesInput] = useState(''); // For comma-separated string
  const [zipcode, setZipcode] = useState('');
  const [searchRadius, setSearchRadius] = useState<number>(parseInt(searchRadiusOptions[1].value));
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

  useEffect(() => {
    if (isLoading || !searchMessage) return; // Don't update message if loading or no initial message

    let currentBaseMessage = searchMessage.split(" Displaying")[0].split(" All match")[0];
    
    // Prevent message update if it's a critical error message that shouldn't be changed by filtering
    const criticalErrorMessages = ["Flow Error:", "Database query failed", "Could not find location data for zipcode", "An unexpected error occurred"];
    if (criticalErrorMessages.some(err => currentBaseMessage.startsWith(err))) {
        // setSearchMessage(currentBaseMessage); // Ensure it stays as the critical error
        return;
    }


    if (currentBaseMessage.includes("No prescribers found")) {
        // If the base message is "No prescribers found", don't append filter info
        // setSearchMessage(currentBaseMessage); // Already set by handleSearch
    } else if (allPrescribers.length > 0) {
        if (confidenceFilter !== 'any') {
            if (displayedPrescribers.length === 0) {
                 setSearchMessage(`${currentBaseMessage} No results match the current confidence filter.`);
            } else if (allPrescribers.length === displayedPrescribers.length) {
                setSearchMessage(`${currentBaseMessage} All match current confidence filter.`);
            } else {
                setSearchMessage(`${currentBaseMessage} Displaying ${displayedPrescribers.length} of ${allPrescribers.length} after filtering by confidence.`);
            }
        } else {
             setSearchMessage(currentBaseMessage); // Revert to base if filter is 'any'
        }
    } else if (!currentBaseMessage.includes("No prescribers found")) { 
      // If allPrescribers is empty but it wasn't a "No prescribers found" message, it implies it was an error.
      // Don't modify error messages with filter status.
      // setSearchMessage(currentBaseMessage); // Already set by handleSearch
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedPrescribers, confidenceFilter, allPrescribers]); // Removed isLoading and searchMessage from deps to avoid loops, ensure searchMessage is set correctly after API call


  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const parsedMedicationNames = medicationNamesInput.split(',')
                                      .map(name => name.trim())
                                      .filter(name => name.length > 0);

    if (parsedMedicationNames.length === 0) {
      toast({
        title: 'Missing Medication',
        description: 'Please enter at least one medication name. For multiple, separate with commas.',
        variant: 'destructive',
      });
      return;
    }
    if (!zipcode.trim()) {
      toast({
        title: 'Missing Zipcode',
        description: 'Please enter a 5-digit zipcode.',
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
    setSearchMessage(null); // Clear previous message

    const inputForAction = {
      medicationName: medicationNamesInput, // Send the comma-separated string to the action
      zipcode,
      searchRadius: Number(searchRadius)
    };

    // This type matches the expected return from `findPrescribersAction`
    const response: PrescriberSearchActionOutput = await findPrescribersAction(inputForAction);

    setIsLoading(false);
    setSearchMessage(response.message || null); // Set the base message from API first

    if (response.results && response.results.length > 0) {
      setAllPrescribers(response.results); // This will trigger the filtering useEffect
    } else {
      setAllPrescribers([]);
      setDisplayedPrescribers([]);
       if (response.message) { // Message already set above
         toast({
            title: response.message.startsWith("Flow Error:") || response.message.startsWith("Database query failed") || response.message.startsWith("Could not find location data for zipcode") || response.message.startsWith("An unexpected error occurred") ? 'Search Error' : 'No Results',
            description: response.message,
            variant: response.message.startsWith("Flow Error:") || response.message.startsWith("Database query failed") || response.message.startsWith("Could not find location data for zipcode") || response.message.startsWith("An unexpected error occurred") ? 'destructive' : 'default',
         });
       } else {
         toast({
            title: 'No Results',
            description: 'No prescribers found matching your criteria.',
            variant: 'default',
         });
       }
    }
  };

  const isPrescriberInShortlist = (prescriber: PrescriberResult) => {
    return shortlist.some(item => item.prescriberName === prescriber.prescriberName && item.address === prescriber.address && JSON.stringify(item.matchedMedications) === JSON.stringify(prescriber.matchedMedications));
  };

  const toggleShortlist = (prescriber: PrescriberResult) => {
    if (isPrescriberInShortlist(prescriber)) {
      setShortlist(prev => prev.filter(item => !(item.prescriberName === prescriber.prescriberName && item.address === prescriber.address && JSON.stringify(item.matchedMedications) === JSON.stringify(prescriber.matchedMedications))));
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
            Find prescribers by medication(s), location, and radius.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medicationNamesInput" className="flex items-center text-sm font-medium">
                <Pill className="h-4 w-4 mr-2 text-primary" />
                Medication Names (comma-separated for multiple)
              </Label>
              <Input
                id="medicationNamesInput"
                type="text"
                placeholder="e.g., Lisinopril, Alprazolam OR Aspirin"
                value={medicationNamesInput}
                onChange={(e) => setMedicationNamesInput(e.target.value)}
                aria-label="Medication Names (comma-separated)"
                
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
                  
                  className="text-base md:text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="searchRadius" className="flex items-center text-sm font-medium">
                   <SigmaSquare className="h-4 w-4 mr-2 text-primary" />
                   Search Radius (miles)
                </Label>
                <Select
                  value={String(searchRadius)}
                  onValueChange={(value) => setSearchRadius(parseInt(value))}
                >
                  <SelectTrigger id="searchRadius" className="w-full text-base md:text-sm">
                    <SelectValue placeholder="Select search radius" />
                  </SelectTrigger>
                  <SelectContent>
                    {searchRadiusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
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
                searchMessage.includes("No prescribers found") || searchMessage.startsWith("Flow Error:") || searchMessage.startsWith("Database query failed") || searchMessage.startsWith("Could not find location data for zipcode") || searchMessage.startsWith("An unexpected error occurred")
                ? 'bg-destructive/10 text-destructive border border-destructive/20'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <p className="flex-grow">{searchMessage}</p>
            </div>
          )}

          {!isLoading && displayedPrescribers.length === 0 && allPrescribers.length > 0 && !searchMessage?.includes("No prescribers found") && !searchMessage?.startsWith("Flow Error:") && (
             <div className="p-4 rounded-md text-sm flex items-start bg-blue-50 text-blue-700 border border-blue-200">
                <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                <p className="flex-grow">No prescribers match your current filter criteria. Try adjusting the confidence filter.</p>
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
                       {prescriber.taxonomyClass && (
                        <CardDescription className="text-xs text-primary/80">
                           <Layers className="h-3 w-3 mr-1 inline-block relative -top-px" />
                           Taxonomy: {prescriber.taxonomyClass}
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
                      <p><strong>Matched Medications:</strong> <span className="font-medium text-foreground">{prescriber.matchedMedications.join(', ')}</span></p>
                      {prescriber.distance != null && (
                        <p className="flex items-center">
                          <Pin className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                          <strong>Distance:</strong>&nbsp;~{prescriber.distance.toFixed(1)} miles
                        </p>
                      )}
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
          <p>Search powered by your SQL function and public NPI data. Data is for informational purposes only. Distances are approximate.</p>
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
                {prescriber.taxonomyClass && (
                  <p className="text-xs text-muted-foreground ml-6"><Layers className="h-3 w-3 mr-1 inline-block relative -top-px" />{prescriber.taxonomyClass}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1"><strong>Address:</strong> {prescriber.address}, {prescriber.zipcode}</p>
                {prescriber.phoneNumber && (
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Phone className="h-3 w-3 mr-1.5 text-primary/70" />
                    {formatPhoneNumber(prescriber.phoneNumber)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground"><strong>Matched Medications:</strong> {prescriber.matchedMedications.join(', ')}</p>
                 {prescriber.distance != null && (
                  <p className="text-xs text-muted-foreground"><strong>Distance:</strong> ~{prescriber.distance.toFixed(1)} miles</p>
                )}
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
