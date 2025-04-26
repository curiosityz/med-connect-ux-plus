
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import { getMedicationById, getProvidersByMedication, Provider } from "@/data/mockData";
import ProviderCard from "@/components/ProviderCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const MedicationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [providers, setProviders] = useState<Provider[]>([]);
  
  const medication = id ? getMedicationById(id) : undefined;
  
  useEffect(() => {
    if (id) {
      const matchedProviders = getProvidersByMedication(id);
      setProviders(matchedProviders);
    }
  }, [id]);
  
  if (!medication) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavigation />
        <main className="flex-grow container mx-auto px-4 py-16">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4 text-medblue-800">Medication Not Found</h1>
            <p className="text-gray-600 mb-6">The medication you're looking for does not exist or has been removed.</p>
            <Button asChild>
              <Link to="/medications">Back to Medications</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      
      <main className="flex-grow">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-medblue-700 to-medblue-800 py-16 text-white">
          <div className="container mx-auto px-4">
            <div className="mb-6">
              <Button 
                asChild 
                variant="ghost" 
                size="sm" 
                className="text-white hover:text-medblue-100 hover:bg-medblue-600 mb-6"
              >
                <Link to="/medications">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Medications
                </Link>
              </Button>
            </div>
            
            <div className="max-w-2xl">
              <div className="flex items-center mb-4">
                <span className="px-3 py-1 bg-medblue-600 text-white text-sm font-medium rounded-full mr-3">
                  {medication.category}
                </span>
                <span className="text-medblue-100">{medication.providerCount} providers available</span>
              </div>
              
              <h1 className="text-4xl font-bold mb-2">{medication.name}</h1>
              <p className="text-xl text-medblue-100 mb-4">{medication.genericName}</p>
              
              <p className="text-lg mb-6">
                {medication.description}
              </p>
            </div>
          </div>
        </section>
        
        {/* Providers Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 text-medblue-800">
              {providers.length} Providers Who Prescribe {medication.name}
            </h2>
            
            {providers.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {providers.map((provider) => (
                  <ProviderCard key={provider.id} {...provider} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
                <p className="text-gray-600">
                  We couldn't find any providers who prescribe this medication. 
                  Please try searching for another medication.
                </p>
              </div>
            )}
          </div>
        </section>
        
        {/* Related Info Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-medblue-800">About {medication.name}</h2>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="font-bold text-lg mb-3 text-medblue-800">General Information</h3>
                <p className="text-gray-700 mb-4">
                  {medication.name} ({medication.genericName}) is a {medication.category.toLowerCase()} 
                  that is commonly prescribed by healthcare providers. When considering this medication, 
                  it's important to discuss with a qualified healthcare provider who can evaluate your 
                  specific needs and medical history.
                </p>
                <p className="text-gray-700">
                  Our platform connects you with providers who specialize in prescribing this medication
                  and can offer expert guidance on its use, potential side effects, and alternatives.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-3 text-medblue-800">Next Steps</h3>
                <p className="text-gray-700 mb-4">
                  To get started with {medication.name}, browse the providers listed above
                  and book an appointment with one who meets your needs. During your appointment,
                  the provider will evaluate your condition and determine if this medication
                  is appropriate for you.
                </p>
                
                <Button asChild className="bg-medblue-600 hover:bg-medblue-700">
                  <Link to="/providers">Find More Providers</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default MedicationDetailPage;
