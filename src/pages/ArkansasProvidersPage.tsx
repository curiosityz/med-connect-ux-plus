
import React, { useState } from "react";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import ArkansasProviderTable from "@/components/ArkansasProviderTable";
import { useArkansasProviders, useSearchArkansasProviders } from "@/hooks/useSupabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const ArkansasProvidersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Use the regular provider list when not searching
  const { data: providers, isLoading: isLoadingProviders } = useArkansasProviders();
  
  // Use search results when searching
  const { data: searchResults, isLoading: isLoadingSearch } = useSearchArkansasProviders(
    searchQuery, 
    isSearching
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(searchQuery.length > 0);
  };

  const displayedProviders = isSearching ? searchResults : providers;
  const isLoading = isSearching ? isLoadingSearch : isLoadingProviders;

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
                    placeholder="Search by provider name, city, or medication..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
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
