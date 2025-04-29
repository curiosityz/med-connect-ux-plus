
import React, { useState, useEffect } from "react";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import { medications } from "@/data/mockData";
import MedicationCard from "@/components/MedicationCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { motion } from "framer-motion";

const MedicationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFocused, setSearchFocused] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  
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
  
  // Pagination
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredMedications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMedications = filteredMedications.slice(startIndex, startIndex + itemsPerPage);
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category) 
        ? prev.filter(cat => cat !== category) 
        : [...prev, category];
      
      // Show toast when filters change
      if (!prev.includes(category)) {
        toast({
          title: "Filter Added",
          description: `Showing medications in ${category} category`,
          duration: 2000,
        });
      }
      
      return newCategories;
    });
    setCurrentPage(1);
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    setHasSearched(false);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setCurrentPage(1);
    
    if (searchQuery.trim() !== "") {
      toast({
        title: "Search Results",
        description: `Found ${filteredMedications.length} medications matching "${searchQuery}"`,
        duration: 3000,
      });
    }
  };
  
  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategories]);

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      
      <main className="flex-grow">
        {/* Header Section */}
        <section className="bg-gradient-to-b from-medblue-700 to-medblue-800 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold mb-4">
              Find Medication Prescribers
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-medblue-100 max-w-2xl mx-auto">
              Search for medications to connect with providers who specialize in prescribing them.
            </motion.p>
            
            {/* Search prominently featured */}
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              onSubmit={handleSearch}
              className="max-w-xl mx-auto mt-8">
              <div className={`relative group ${searchFocused ? 'ring-2 ring-medblue-400 ring-opacity-50' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className={`h-5 w-5 transition-colors ${searchFocused ? 'text-medblue-500' : 'text-gray-400'}`} />
                </div>
                <Input 
                  type="text" 
                  placeholder="Search medications by name, generic name, or description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value === "") setHasSearched(false);
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="pl-10 pr-10 py-6 text-lg bg-white shadow-lg transition-all duration-300 border-medblue-200 focus:border-medblue-500"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-12 flex items-center"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-medblue-500 transition-colors" />
                  </button>
                )}
                <button 
                  type="submit"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <div className="bg-medblue-600 hover:bg-medblue-700 text-white rounded-full p-1 transition-colors">
                    <Search className="h-5 w-5" />
                  </div>
                </button>
              </div>
            </motion.form>
          </div>
        </section>
        
        {/* Search and Results Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              {/* Filters Sidebar */}
              <div className="md:col-span-1">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
                  <h2 className="text-lg font-bold text-medblue-800 mb-4">Filter Medications</h2>
                  
                  {/* Selected Filters */}
                  {selectedCategories.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedCategories.map(category => (
                          <Badge 
                            key={`selected-${category}`} 
                            variant="outline"
                            className="bg-medblue-50 text-medblue-700 border-medblue-200 px-3 py-1 flex items-center gap-1 animate-fade-in"
                          >
                            {category}
                            <X 
                              className="h-3 w-3 ml-1 cursor-pointer hover:text-medblue-900" 
                              onClick={() => handleCategoryChange(category)} 
                            />
                          </Badge>
                        ))}
                      </div>
                      {selectedCategories.length > 1 && (
                        <button 
                          onClick={() => setSelectedCategories([])} 
                          className="text-xs text-medblue-600 hover:text-medblue-800 mt-2 transition-colors"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <motion.div 
                          key={category} 
                          className="flex items-center"
                          whileTap={{ scale: 0.98 }}
                        >
                          <Checkbox 
                            id={`category-${category}`}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => handleCategoryChange(category)}
                            className="data-[state=checked]:bg-medblue-600 data-[state=checked]:border-medblue-600"
                          />
                          <Label 
                            htmlFor={`category-${category}`}
                            className="ml-2 text-sm text-gray-600 cursor-pointer"
                          >
                            {category}
                          </Label>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Results */}
              <div className="md:col-span-3">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-medblue-800">
                      {filteredMedications.length} {filteredMedications.length === 1 ? 'Medication' : 'Medications'} Found
                    </h2>

                    {hasSearched && searchQuery && (
                      <div className="text-sm text-gray-600">
                        Search results for: <span className="font-medium text-medblue-700">"{searchQuery}"</span>
                      </div>
                    )}
                  </div>
                  
                  {filteredMedications.length > 0 ? (
                    <>
                      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {paginatedMedications.map((medication, index) => (
                          <motion.div
                            key={medication.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                          >
                            <MedicationCard {...medication} />
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-8">
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious 
                                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                />
                              </PaginationItem>
                              
                              {Array.from({ length: totalPages }).map((_, i) => (
                                <PaginationItem key={i}>
                                  <PaginationLink 
                                    isActive={currentPage === i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className="cursor-pointer"
                                  >
                                    {i + 1}
                                  </PaginationLink>
                                </PaginationItem>
                              ))}
                              
                              <PaginationItem>
                                <PaginationNext 
                                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-center py-16 bg-gray-50 rounded-lg"
                    >
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No medications found</h3>
                      <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                      
                      <button 
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategories([]);
                          setHasSearched(false);
                        }}
                        className="text-medblue-600 hover:text-medblue-800 font-medium"
                      >
                        Reset all filters
                      </button>
                    </motion.div>
                  )}
                </motion.div>
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
