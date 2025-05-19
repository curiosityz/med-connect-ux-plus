
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Database, Search, Loader2, CheckCircle, XCircle, Table } from 'lucide-react'; // Changed ServerIcon to Table
import { testConnection, searchTables } from './actions'; // Changed searchNodes to searchTables
import { debounce } from '@/lib/utils';

interface TableResult { // Renamed from NodeResult
  table_name: string; // Renamed from node_name
  highlighted_name: string;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<TableResult[]>([]); // Changed NodeResult to TableResult
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingConnection, setIsLoadingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean | null;
    message: string;
  }>({ connected: null, message: '' });

  const { toast } = useToast();

  const handleTestConnection = async () => {
    setIsLoadingConnection(true);
    setConnectionStatus({ connected: null, message: 'Testing connection...' });
    const response = await testConnection();
    setConnectionStatus({
      connected: response.success,
      message: response.message,
    });
    setIsLoadingConnection(false);
    toast({
      title: response.success ? 'Connection Test Successful' : 'Connection Test Failed',
      description: response.message,
      variant: response.success ? 'default' : 'destructive',
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        setIsLoadingSearch(false);
        return;
      }
      setIsLoadingSearch(true);
      const response = await searchTables(query); // Changed from searchNodes
      if (response.success && response.results) {
        setResults(response.results);
      } else {
        setResults([]);
        toast({
          title: 'Search Error',
          description: response.message || 'An unknown error occurred during search.',
          variant: 'destructive',
        });
      }
      setIsLoadingSearch(false);
    }, 500), 
    [toast] 
  );

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    if (query.trim() === '') {
      setResults([]); 
      setIsLoadingSearch(false);
    } else {
      setIsLoadingSearch(true); 
      debouncedSearch(query);
    }
  };
  
  // Optional: Effect to test connection on initial load
  // useEffect(() => {
  //  handleTestConnection();
  // }, []);

  return (
    <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Database className="h-10 w-10 text-primary mr-3" />
            <CardTitle className="text-3xl font-bold">PG Table Navigator</CardTitle> 
          </div>
          <CardDescription className="text-lg">
            Real-time full-text search for PostgreSQL tables.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Connection Status</h3>
              {connectionStatus.connected === true && <CheckCircle className="h-6 w-6 text-green-500" />}
              {connectionStatus.connected === false && <XCircle className="h-6 w-6 text-destructive" />}
            </div>
            {connectionStatus.message && (
              <p className={`text-sm ${connectionStatus.connected ? 'text-green-600' : 'text-destructive'}`}>
                {connectionStatus.message}
              </p>
            )}
            <Button onClick={handleTestConnection} disabled={isLoadingConnection} className="w-full">
              {isLoadingConnection ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Database className="mr-2 h-4 w-4" />
              )}
              Test Database Connection
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
             <h3 className="text-lg font-semibold mb-1">Search Tables</h3>
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter table name to search..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                className="flex-grow"
                aria-label="Search table names"
              />
            </div>
          </div>

          {isLoadingSearch && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Searching...</p>
            </div>
          )}

          {!isLoadingSearch && searchQuery && results.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No tables found for "{searchQuery}".</p>
          )}

          {results.length > 0 && (
            <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-background">
              <ul className="space-y-3">
                {results.map((result, index) => (
                  <li key={`${result.table_name}-${index}`} className="p-3 rounded-md shadow-sm border border-input hover:bg-secondary transition-colors">
                    <div className="flex items-start">
                      <Table className="h-5 w-5 text-primary mr-3 mt-1 flex-shrink-0" /> 
                      <div
                        className="text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: result.highlighted_name || result.table_name }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
          <p>Powered by Next.js, PostgreSQL, and ShadCN UI.</p>
        </CardFooter>
      </Card>
    </main>
  );
}
