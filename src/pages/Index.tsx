
import React from "react";
import MainNavigation from "@/components/MainNavigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
// import { medications, providers } from "@/data/mockData"; // Removed mock data import
import MedicationCard from "@/components/MedicationCard"; // Keep if used elsewhere or for future API data
import { ProviderCard } from "@/components/ProviderCard"; // Keep if used elsewhere or for future API data
// TODO: Import necessary hooks (e.g., useQuery) and apiClient to fetch featured data

const Index = () => {
  // TODO: Fetch featured medications and providers from API
  // const { data: featuredMedications } = useQuery(...)
  // const { data: featuredProviders } = useQuery(...)
  const featuredMedications: any[] = []; // Placeholder
  const featuredProviders: any[] = []; // Placeholder


  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      
      <main className="flex-grow">
        <Hero />
        <Features />
        
        {/* TODO: Re-implement Featured Sections with API data and loading/error states */}
        {/* Placeholder Content */}
         <section className="py-16 bg-gray-50">
           <div className="container mx-auto px-4 text-center">
             <h2 className="text-2xl font-semibold mb-4">Find Providers by Medication</h2>
             <p className="text-muted-foreground mb-6">Search our extensive database for healthcare providers specializing in specific medications.</p>
             <Button asChild size="lg">
                <Link to="/find-providers">Start Your Search</Link>
             </Button>
           </div>
         </section>


        {/* CTA Section */}
        <section className="py-16 bg-medblue-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to find prescribers for your medication?</h2>
            <p className="text-xl text-medblue-100 mb-8 max-w-2xl mx-auto">
              Get connected with providers who specialize in the exact medications you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-medblue-700 hover:bg-gray-100">
                <Link to="/medications">Search Medications</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
