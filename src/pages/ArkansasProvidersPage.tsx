
import React, { useState, useEffect } from "react";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import ArkansasProviderTable from "@/components/ArkansasProviderTable";
import { useArkansasProviders, useSearchArkansasProviders } from "@/hooks/useSupabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

const ArkansasProvidersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce search query to prevent too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Use the regular provider list when not searching
  const { data: providers, isLoading: isLoadingProviders } = useArkansasProviders();
  
  // Use search results when searching
  const { 
    data: searchResults, 
    isLoading: isLoadingSearch,
    error: searchError
  } = useSearchArkansasProviders(
    debouncedSearchQuery, 
    isSearching
  );

  // Set searching state whenever debounced query changes
  useEffect(() => {
    setIsSearching(debouncedSearchQuery.length > 0);
  }, [debouncedSearchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length > 0) {
      setIsSearching(true);
      // Log the search query to help with debugging
      console.log(`Search submitted: ${searchQuery}`);
    }
  };

  // Handle search errors
  useEffect(() => {
    if (searchError) {
      console.error("Error during search:", searchError);
      toast.error("An error occurred while searching. Please try again.");
    }
  }, [searchError]);

  const displayedProviders = isSearching ? searchResults : providers;
  const isLoading = isSearching ? isLoadingSearch : isLoadingProviders;
  
  // Log when results are displayed
  useEffect(() => {
    if (isSearching && searchResults) {
      console.log(`Displaying ${searchResults.length} search results for "${debouncedSearchQuery}"`);
    }
  }, [isSearching, searchResults, debouncedSearchQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      
      <main className="flex-grow">
        {/* Header Section */}
        <section className="bg-medblue-700 py-16 text-white">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Arkansas Healthcare Providers</h1>
            <p className="text-xl text-medblue-100 max-w-2xl">
              Detailed information on Arkansas healthcare providers and their prescribing patterns.
            </p>
          </div>
        </section>
        
        {/* Search & Results Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input 
                    type="text" 
                    placeholder="Search by provider name, city, or medication (e.g., alprazolam)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
              
              {isSearching && searchResults?.length === 0 && !isLoadingSearch && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center text-sm">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                  <span>No results found for "{debouncedSearchQuery}". Try using a more general term or check spelling.</span>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-medblue-800 mb-6">
                {isSearching 
                  ? `Search Results (${displayedProviders?.length || 0})` 
                  : `Arkansas Providers (${displayedProviders?.length || 0})`
                }
              </h2>
              
              <ArkansasProviderTable 
                providers={displayedProviders || []} 
                isLoading={isLoading} 
              />
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ArkansasProvidersPage;
