
"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Pill, MapPin, Search, Loader2, AlertCircle, BriefcaseMedical, Filter, Bookmark, Printer, Trash2, Phone, TrendingUp, Pin, SigmaSquare } from 'lucide-react'; // SigmaSquare for Radius
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
  distance?: number; // Added distance
}

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
  const [searchRadius, setSearchRadius] = useState<number>(parseInt(searchRadiusOptions[1].value)); // Default to 10 miles
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
    if (isLoading) return;

    if (allPrescribers.length > 0 && searchMessage && !searchMessage.startsWith("No prescribers found") && !searchMessage.startsWith("Flow Error:") && !searchMessage.startsWith("Database query error:") && !searchMessage.startsWith("Invalid zipcode format") && !searchMessage.startsWith("No coordinates found") && !searchMessage.startsWith("Invalid coordinates")) {
      let baseMessage = `Found ${allPrescribers.length} prescriber(s) for "${medicationName}" within ${searchRadius} miles of ${zipcode}.`;
      if (confidenceFilter !== 'any') {
        if (allPrescribers.length === displayedPrescribers.length) {
          setSearchMessage(`${baseMessage} All match current confidence filter.`);
        } else {
          setSearchMessage(`${baseMessage} Displaying ${displayedPrescribers.length} after filtering by confidence.`);
        }
      } else {
        setSearchMessage(baseMessage);
      }
    } else if (searchMessage && (searchMessage.startsWith("No prescribers found") || searchMessage.startsWith("Flow Error:") || searchMessage.startsWith("Database query error:") || searchMessage.startsWith("Invalid zipcode format") || searchMessage.startsWith("No coordinates found") || searchMessage.startsWith("Invalid coordinates"))) {
      // Message already set by handleSearch, do nothing to override it.
    }
  }, [allPrescribers, displayedPrescribers, confidenceFilter, medicationName, zipcode, searchRadius, isLoading, searchMessage]);


  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!medicationName.trim() || !zipcode.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter medication name, 5-digit zipcode, and select a search radius.',
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
      searchRadius: Number(searchRadius)
    };
    
    const response: PrescriberSearchOutput = await findPrescribersAction(input);

    setIsLoading(false);
    setSearchMessage(response.message || null);

    if (response.results && response.results.length > 0) {
      setAllPrescribers(response.results);
    } else {
      setAllPrescribers([]); 
      setDisplayedPrescribers([]);
       if (response.message) { // API returned a message (error or no results)
         toast({
            title: response.message.startsWith("Flow Error:") || response.message.startsWith("Database query error:") || response.message.startsWith("Invalid zipcode format") || response.message.startsWith("No coordinates found") || response.message.startsWith("Invalid coordinates") ? 'Search Error' : 'No Results',
            description: response.message,
            variant: response.message.startsWith("Flow Error:") || response.message.startsWith("Database query error:") || response.message.startsWith("Invalid zipcode format") || response.message.startsWith("No coordinates found") || response.message.startsWith("Invalid coordinates") ? 'destructive' : 'default',
         });
       } else { // API returned no results and no message
         toast({
            title: 'No Results',
            description: 'No prescribers found matching your criteria.',
            variant: 'default',
         });
       }
    }
  };

  const isPrescriberInShortlist = (prescriber: PrescriberResult) => {
    return shortlist.some(item => item.prescriberName === prescriber.prescriberName && item.address === prescriber.address && item.medicationMatch === prescriber.medicationMatch);
  };

  const toggleShortlist = (prescriber: PrescriberResult) => {
    if (isPrescriberInShortlist(prescriber)) {
      setShortlist(prev => prev.filter(item => !(item.prescriberName === prescriber.prescriberName && item.address === prescriber.address && item.medicationMatch === prescriber.medicationMatch)));
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
            Find prescribers by medication, location, and radius.
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
                <Label htmlFor="searchRadius" className="flex items-center text-sm font-medium">
                   <SigmaSquare className="h-4 w-4 mr-2 text-primary" />
                   Search Radius
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
                searchMessage.startsWith("No prescribers found") || searchMessage.startsWith("Flow Error:") || searchMessage.startsWith("Database query error:") || searchMessage.startsWith("Invalid zipcode format") || searchMessage.startsWith("No coordinates found") || searchMessage.startsWith("Invalid coordinates")
                ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <p className="flex-grow">{searchMessage}</p>
            </div>
          )}
          
          {!isLoading && displayedPrescribers.length === 0 && !searchMessage && (medicationName || zipcode) && (
             <div className="p-4 rounded-md text-sm flex items-start bg-blue-50 text-blue-700 border border-blue-200">
                <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                <p className="flex-grow">No prescribers match your current filter criteria. Try adjusting the confidence filter, search radius, or search terms.</p>
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
                      {prescriber.distance != null && (
                        <p className="flex items-center">
                          <Pin className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                          <strong>Distance:</strong>&nbsp;~{prescriber.distance} miles
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
          <p>Search powered by Genkit and PostgreSQL. Data is for informational purposes only. Results limited (max 50). Distances are approximate.</p>
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
                 {prescriber.distance != null && (
                  <p className="text-xs text-muted-foreground"><strong>Distance:</strong> ~{prescriber.distance} miles</p>
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
