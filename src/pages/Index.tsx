
import React from "react";
import MainNavigation from "@/components/MainNavigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { medications, providers } from "@/data/mockData";
import MedicationCard from "@/components/MedicationCard";
import ProviderCard from "@/components/ProviderCard";

const Index = () => {
  // Show just a few medications and providers for the homepage
  const featuredMedications = medications.slice(0, 3);
  const featuredProviders = providers.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      
      <main className="flex-grow">
        <Hero />
        <Features />
        
        {/* Featured Medications Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-medblue-800">Popular Medications</h2>
                <p className="text-gray-600">Find providers specialized in these common medications</p>
              </div>
              <Button asChild variant="outline" className="border-medblue-600 text-medblue-700">
                <Link to="/medications">View All</Link>
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredMedications.map((medication) => (
                <MedicationCard key={medication.id} {...medication} />
              ))}
            </div>
          </div>
        </section>
        
        {/* Featured Providers Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-medblue-800">Top Providers</h2>
                <p className="text-gray-600">Highly rated medication specialists ready to help</p>
              </div>
              <Button asChild variant="outline" className="border-medblue-600 text-medblue-700">
                <Link to="/providers">View All</Link>
              </Button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProviders.map((provider) => (
                <ProviderCard key={provider.id} {...provider} />
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-medblue-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to find your medication specialist?</h2>
            <p className="text-xl text-medblue-100 mb-8 max-w-2xl mx-auto">
              Get connected with providers who specialize in the exact medications you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-medblue-700 hover:bg-gray-100">
                <Link to="/medications">Find by Medication</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-medblue-600">
                <Link to="/providers">Browse All Providers</Link>
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
