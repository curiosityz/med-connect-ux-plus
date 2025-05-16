
import React, { useState, useEffect } from "react";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import MedicationCard from "@/components/MedicationCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Medication } from "@/data/mockData"; // Only importing the interface

interface MedicationData {
  id: string;
  name: string;
  generic_name: string;
  category: string;
  description: string;
  provider_count: number;
}

const MedicationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Fetch medications from Supabase
  const { data: medications, isLoading, error } = useQuery({
    queryKey: ['medications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*');
      
      if (error) throw error;
      return data as MedicationData[];
    }
  });
  
  // Extract unique categories
  const uniqueCategories = medications ? Array.from(new Set(medications.map(med => med.category))) : [];
  
  // Filter medications based on search and category filters
  const filteredMedications = medications ? medications.filter(med => {
    const matchesSearch = 
      searchQuery === "" || 
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (med.generic_name && med.generic_name.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesCategory = 
      selectedCategory === null || med.category === selectedCategory;
      
    return matchesSearch && matchesCategory;
  }) : [];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(prev => prev === category ? null : category);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="md:col-span-2">
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
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Medications</h2>
          <p className="mb-8">There was a problem loading medication data.</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
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
            <h1 className="text-4xl font-bold mb-4">Browse Medications</h1>
            <p className="text-xl text-medblue-100 max-w-2xl mx-auto">
              Find medications and the healthcare providers who prescribe them.
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
                        placeholder="Search medications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
                    <div className="space-y-2">
                      {uniqueCategories.sort().map((category) => (
                        <div 
                          key={category}
                          onClick={() => handleCategoryChange(category)}
                          className={`px-3 py-2 rounded-md cursor-pointer text-sm ${
                            category === selectedCategory 
                              ? "bg-medblue-100 text-medblue-800" 
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {category}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Results */}
              <div className="md:col-span-3">
                <h2 className="text-xl font-bold text-medblue-800 mb-6">
                  {filteredMedications.length} Medications Found
                </h2>
                
                {filteredMedications.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredMedications.map((medication) => (
                      <Link key={medication.id} to={`/medications/${medication.id}`}>
                        <MedicationCard
                          id={medication.id}
                          name={medication.name}
                          genericName={medication.generic_name || ""}
                          category={medication.category || ""}
                          description={medication.description || ""}
                          providerCount={medication.provider_count || 0}
                        />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No medications found</h3>
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

export default MedicationsPage;
