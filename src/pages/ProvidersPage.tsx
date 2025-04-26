
import React, { useState } from "react";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import { providers } from "@/data/mockData";
import ProviderCard from "@/components/ProviderCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";

const ProvidersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  
  // Extract unique specialties
  const allSpecialties = providers.flatMap(provider => provider.specialties);
  const uniqueSpecialties = Array.from(new Set(allSpecialties));
  
  // Filter providers based on search and specialty filters
  const filteredProviders = providers.filter(provider => {
    const matchesSearch = 
      searchQuery === "" || 
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.title.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesSpecialty = 
      selectedSpecialties.length === 0 || 
      provider.specialties.some(specialty => 
        selectedSpecialties.includes(specialty)
      );
      
    return matchesSearch && matchesSpecialty;
  });
  
  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(spec => spec !== specialty) 
        : [...prev, specialty]
    );
  };

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
                      <ProviderCard key={provider.id} {...provider} />
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
