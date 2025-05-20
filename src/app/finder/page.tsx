
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Pill, MapPin, Search, Loader2, AlertCircle, BriefcaseMedical, Radius, Phone, ShieldCheck, TrendingUp } from 'lucide-react';
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
  distance: number;
  confidenceScore: number;
}

const searchRadii = [5, 10, 15, 25, 50, 100]; // Miles

export default function FinderPage() {
  const [medicationName, setMedicationName] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [searchRadius, setSearchRadius] = useState<number>(searchRadii[2]); // Default to 15 miles
  const [results, setResults] = useState<PrescriberResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const { toast } = useToast();

  const getConfidenceColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!medicationName.trim() || !zipcode.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter medication name, 5-digit zipcode, and select a radius.',
        variant: 'destructive',
      });
      return;
    }
    if (zipcode.trim().length !== 5 || !/^\d{5}$/.test(zipcode.trim())) {
      toast({
        title: 'Invalid Zipcode',
        description: 'Please enter a valid 5-digit zipcode for radius search.',
        variant: 'destructive',
      });
      return;
    }
    if (searchRadius <= 0) {
      toast({
        title: 'Invalid Radius',
        description: 'Search radius must be greater than 0.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setResults([]);
    setSearchMessage(null);

    const input: PrescriberSearchInput = { 
      medicationName, 
      zipcode,
      searchRadius
    };
    const response: PrescriberSearchOutput = await findPrescribersAction(input);

    setIsLoading(false);

    if (response.results.length > 0) {
      setResults(response.results);
      setSearchMessage(response.message || `Found ${response.results.length} prescriber(s).`);
    } else {
      setResults([]);
      setSearchMessage(response.message || 'No prescribers found matching your criteria.');
      toast({
        title: 'No Results',
        description: response.message || 'No prescribers found. Try different search terms or a larger radius.',
        variant: 'default',
      });
    }
  };

  return (
    <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
      <Card className="w-full max-w-2xl shadow-xl bg-card">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <BriefcaseMedical className="h-10 w-10 text-primary mr-3" />
            <CardTitle className="text-3xl font-bold">RX Prescribers Search</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Find prescribers by medication and location within a specified radius.
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2 md:col-span-2">
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
                  <Radius className="h-4 w-4 mr-2 text-primary" />
                  Radius (miles)
                </Label>
                <Select 
                  value={String(searchRadius)} 
                  onValueChange={(value) => setSearchRadius(Number(value))}
                >
                  <SelectTrigger id="searchRadius" className="w-full text-base md:text-sm">
                    <SelectValue placeholder="Select radius" />
                  </SelectTrigger>
                  <SelectContent>
                    {searchRadii.map(radius => (
                      <SelectItem key={radius} value={String(radius)}>{radius} miles</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

          {searchMessage && !isLoading && (
            <div className={`p-4 rounded-md text-sm flex items-start ${results.length > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <p className="flex-grow">{searchMessage}</p>
            </div>
          )}
          
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-lg text-muted-foreground">Searching for prescribers...</p>
            </div>
          )}

          {results.length > 0 && !isLoading && (
            <ScrollArea className="h-[400px] w-full rounded-md border p-1 bg-secondary/30">
              <div className="space-y-3 p-3">
                {results.map((prescriber, index) => (
                  <Card key={index} className="shadow-md hover:shadow-lg transition-shadow bg-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center">
                          <BriefcaseMedical className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                          <span className="font-semibold">{prescriber.prescriberName}</span>
                          {prescriber.credentials && <span className="ml-1.5 text-sm text-muted-foreground">({prescriber.credentials})</span>}
                        </div>
                        <span className="text-sm font-medium text-primary whitespace-nowrap ml-2">~{prescriber.distance} mi</span>
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
                          <strong>Phone:</strong>&nbsp;{prescriber.phoneNumber}
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
          <p>Search powered by Genkit and PostgreSQL. Ensure 'calculate_distance' SQL function and 'npi_addresses_usps' table are available. Data is for informational purposes only.</p>
        </CardFooter>
      </Card>
    </main>
  );
}
