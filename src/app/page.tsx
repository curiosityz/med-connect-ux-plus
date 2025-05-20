
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Pill, MapPin, Search, Loader2, AlertCircle, BriefcaseMedical, Radius } from 'lucide-react';
import { findPrescribersAction } from './actions';
import type { PrescriberSearchInput, PrescriberSearchOutput } from '@/ai/flows/prescriber-search-flow';

interface PrescriberResult {
  prescriberName: string;
  address: string;
  zipcode: string;
  medicationMatch: string;
  distance: number;
}

const searchRadii = [5, 10, 15, 25, 50, 100]; // Miles

export default function HomePage() {
  const [medicationName, setMedicationName] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [searchRadius, setSearchRadius] = useState<number>(searchRadii[2]); // Default to 15 miles
  const [results, setResults] = useState<PrescriberResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const { toast } = useToast();

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
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <BriefcaseMedical className="h-10 w-10 text-primary mr-3" />
            <CardTitle className="text-3xl font-bold">Prescriber Finder</CardTitle>
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

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search Prescribers
            </Button>
          </form>

          {searchMessage && !isLoading && (
            <div className={`p-3 rounded-md text-sm ${results.length > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} flex items-center`}>
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{searchMessage}</p>
            </div>
          )}
          
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Searching for prescribers...</p>
            </div>
          )}

          {results.length > 0 && !isLoading && (
            <ScrollArea className="h-[400px] w-full rounded-md border p-1 bg-background">
              <div className="space-y-3 p-3">
                {results.map((prescriber, index) => (
                  <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center">
                          <BriefcaseMedical className="h-5 w-5 mr-2 text-primary" />
                          {prescriber.prescriberName}
                        </div>
                        <span className="text-sm font-normal text-muted-foreground">~{prescriber.distance} mi</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><strong>Address:</strong> {prescriber.address}, {prescriber.zipcode}</p>
                      <p><strong>Matched Medication:</strong> {prescriber.medicationMatch}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
          <p>Search powered by Genkit and PostgreSQL. Ensure 'calculate_distance' SQL function and 'npi_addresses_usps' table are available in your database.</p>
        </CardFooter>
      </Card>
    </main>
  );
}
