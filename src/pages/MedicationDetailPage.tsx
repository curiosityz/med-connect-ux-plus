
import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query"; // Import useQuery
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
// import { getMedicationById, getProvidersByMedication, Provider } from "@/data/mockData"; // Remove mock data imports
import { ProviderCard } from "@/components/ProviderCard"; // Use named import
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { apiClient } from "@/lib/api-client"; // Import apiClient
import { Provider } from "@/lib/supabase"; // Import Provider type
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert
import { Terminal } from "lucide-react"; // Import icon

// Define type for Medication details (adjust based on actual API response)
interface MedicationDetails {
  id: string;
  name: string;
  genericName: string;
  category: string;
  description: string;
  providerCount?: number; // May not be available directly
}

// Define type for API response combining medication and providers
interface MedicationDetailResponse {
    medication: MedicationDetails;
    providers: Provider[];
}

// Helper function to fetch medication details and providers
const fetchMedicationData = async (medicationId: string): Promise<MedicationDetailResponse> => {
    // TODO: Implement API call - this might be one call or two separate calls
    // Example: Fetch medication details
    // const medication = await apiClient.get<MedicationDetails>(`/medications/${medicationId}`);
    // Example: Fetch providers for this medication (using search endpoint)
    // const providerResponse = await apiClient.findProviders({ drugName: medication.name, limit: 50 }); // Fetch providers
    // return { medication, providers: providerResponse.data };

    // Mock implementation for now
    console.log("API Call: fetchMedicationData", medicationId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockMed: MedicationDetails = { id: medicationId, name: "Mock Medication", genericName: "Mock Generic", category: "Mock Category", description: "Mock description.", providerCount: 5 };
    const mockProviders: Provider[] = [
        // Add mock provider data conforming to Provider type if needed for testing
    ];
    if (medicationId === 'not-found') throw new Error("Medication not found"); // Simulate error
    return { medication: mockMed, providers: mockProviders };
};


const MedicationDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError, error } = useQuery<MedicationDetailResponse, Error>({
      queryKey: ['medicationDetail', id],
      queryFn: () => {
          if (!id) throw new Error("Medication ID is required");
          return fetchMedicationData(id);
      },
      enabled: !!id,
      staleTime: 10 * 60 * 1000, // Cache for 10 mins
  });

  const medication = data?.medication;
  const providers = data?.providers || [];

  if (isLoading) {
     return (
       <div className="min-h-screen flex flex-col">
         <MainNavigation />
         <main className="flex-grow">
            {/* Header Skeleton */}
            <section className="bg-gradient-to-r from-gray-400 to-gray-500 py-16 text-white animate-pulse">
              <div className="container mx-auto px-4">
                 <Skeleton className="h-6 w-32 mb-6 bg-gray-300/50 rounded" />
                 <div className="max-w-2xl">
                    <div className="flex items-center mb-4">
                       <Skeleton className="h-6 w-24 rounded-full bg-gray-300/50 mr-3" />
                       <Skeleton className="h-5 w-36 bg-gray-300/50 rounded" />
                    </div>
                    <Skeleton className="h-10 w-3/4 mb-2 bg-gray-300/50 rounded" />
                    <Skeleton className="h-6 w-1/2 mb-4 bg-gray-300/50 rounded" />
                    <Skeleton className="h-20 w-full bg-gray-300/50 rounded" />
                 </div>
              </div>
            </section>
            {/* Providers Skeleton */}
            <section className="py-16">
               <div className="container mx-auto px-4">
                  <Skeleton className="h-8 w-1/2 mb-6 bg-gray-200 rounded" />
                  <div className="grid md:grid-cols-2 gap-6">
                     <Skeleton className="h-48 w-full bg-gray-200 rounded-lg" />
                     <Skeleton className="h-48 w-full bg-gray-200 rounded-lg" />
                  </div>
               </div>
            </section>
         </main>
         <Footer />
       </div>
     );
  }

  if (isError || !medication) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavigation />
        <main className="flex-grow container mx-auto px-4 py-16">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Medication</h1>
            <p className="text-gray-600 mb-6">{error?.message || "The medication you're looking for could not be found."}</p>
            <Button asChild>
              <Link to="/find-providers">Back to Search</Link>
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
                  {medication.category || 'N/A'}
                </span>
                {/* Provider count might need separate calculation or API field */}
                {/* <span className="text-medblue-100">{medication.providerCount} providers available</span> */}
              </div>

              <h1 className="text-4xl font-bold mb-2">{medication.name || 'Unknown Medication'}</h1>
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
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Changed grid layout */}
                {providers.map((provider) => (
                  <ProviderCard key={provider.npi || provider.id} provider={provider} /> // Pass provider prop
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
