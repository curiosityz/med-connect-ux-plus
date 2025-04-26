
import React, { useState } from "react";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import { medications } from "@/data/mockData";
import MedicationCard from "@/components/MedicationCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";

const MedicationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Extract unique categories
  const categories = Array.from(new Set(medications.map(med => med.category)));
  
  // Filter medications based on search and category filters
  const filteredMedications = medications.filter(medication => {
    const matchesSearch = 
      searchQuery === "" || 
      medication.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medication.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medication.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = 
      selectedCategories.length === 0 || 
      selectedCategories.includes(medication.category);
      
    return matchesSearch && matchesCategory;
  });
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(cat => cat !== category) 
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      
      <main className="flex-grow">
        {/* Header Section */}
        <section className="bg-medblue-700 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Find Medications</h1>
            <p className="text-xl text-medblue-100 max-w-2xl mx-auto">
              Search for medications and find providers who specialize in prescribing them.
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
                      {categories.map((category) => (
                        <div key={category} className="flex items-center">
                          <Checkbox 
                            id={`category-${category}`}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => handleCategoryChange(category)}
                          />
                          <Label 
                            htmlFor={`category-${category}`}
                            className="ml-2 text-sm text-gray-600"
                          >
                            {category}
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
                  {filteredMedications.length} Medications Found
                </h2>
                
                {filteredMedications.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {filteredMedications.map((medication) => (
                      <MedicationCard key={medication.id} {...medication} />
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
