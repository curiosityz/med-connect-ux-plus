
import React, { useState, useEffect } from "react";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import { ProviderCard } from "@/components/ProviderCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface Provider {
  id: string;
  npi: string;
  name: string;
  title?: string;
  specialties: string[];
  location?: string;
  city?: string;
  state?: string;
  rating?: number;
  review_count?: number;
  availability?: string;
  image_url?: string;
  bio?: string;
}

const ProvidersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  
  // Fetch providers from Supabase
  const { data: providers, isLoading, error } = useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('*');
      
      if (error) throw error;
      return data as Provider[];
    }
  });
  
  // Extract unique specialties
  const allSpecialties = providers ? providers.flatMap(provider => provider.specialties || []) : [];
  const uniqueSpecialties = Array.from(new Set(allSpecialties));
  
  // Filter providers based on search and specialty filters
  const filteredProviders = providers ? providers.filter(provider => {
    const matchesSearch = 
      searchQuery === "" || 
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (provider.title && provider.title.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesSpecialty = 
      selectedSpecialties.length === 0 || 
      provider.specialties?.some(specialty => 
        selectedSpecialties.includes(specialty)
      );
      
    return matchesSearch && matchesSpecialty;
  }) : [];
  
  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(spec => spec !== specialty) 
        : [...prev, specialty]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="md:col-span-3">
              <Skeleton className="h-12 w-3/4 mb-6" />
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Providers</h2>
          <p className="mb-8">There was a problem loading provider data.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-medblue-600 text-white px-4 py-2 rounded hover:bg-medblue-700"
          >
            Try Again
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      
      <main className="flex-grow">
        {/* Header Section */}
        <section className="bg-medblue-700 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Find Providers</h1>
            <p className="text-xl text-medblue-100 max-w-2xl mx-auto">
              Connect with healthcare providers who specialize in the medications you need.
            </p>
          </div>
        </section>
        
        {/* Search and Results Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <div className="md:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h2 className="text-lg font-bold text-medblue-800 mb-4">Filters</h2>
                  
                  <div className="mb-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input 
                        type="text" 
                        placeholder="Search providers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Specialties</h3>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {uniqueSpecialties.sort().map((specialty) => (
                        <div key={specialty} className="flex items-center">
                          <Checkbox 
                            id={`specialty-${specialty}`}
                            checked={selectedSpecialties.includes(specialty)}
                            onCheckedChange={() => handleSpecialtyChange(specialty)}
                          />
                          <Label 
                            htmlFor={`specialty-${specialty}`}
                            className="ml-2 text-sm text-gray-600"
                          >
                            {specialty}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Results */}
              <div className="md:col-span-3">
                <h2 className="text-xl font-bold text-medblue-800 mb-6">
                  {filteredProviders.length} Providers Found
                </h2>
                
                {filteredProviders.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredProviders.map((provider) => (
                      <ProviderCard key={provider.id} provider={provider} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
                    <p className="text-gray-600">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProvidersPage;
