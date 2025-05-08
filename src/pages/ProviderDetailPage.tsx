import React, { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import { apiClient } from "@/lib/api-client";
import { Provider } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to fetch provider details
const fetchProviderDetails = async (providerId: string): Promise<Provider> => {
  return apiClient.getProviderDetails(providerId);
};

// Placeholder type for medication data if returned with provider
// Adjust based on actual API response
interface MedicationSummary {
    id: string;
    name: string;
    genericName?: string;
    category?: string;
    description?: string;
}

// Extend Provider type if medications are nested in the response
interface ProviderWithMedications extends Provider {
    prescribed_medications?: MedicationSummary[]; // Example field name
}


const ProviderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Fetch provider details using React Query
  const { data: provider, isLoading, isError, error } = useQuery<ProviderWithMedications, Error>({
    queryKey: ['providerDetails', id], // Unique query key
    queryFn: () => {
      if (!id) throw new Error("Provider ID is required");
      // Assuming getProviderDetails returns ProviderWithMedications or adjust fetcher
      return fetchProviderDetails(id) as Promise<ProviderWithMedications>;
    },
    enabled: !!id, // Only run query if id exists
    staleTime: 10 * 60 * 1000, // 10 minutes stale time for detail view
    retry: 1, // Retry once on error
  });

  // Extract medications from provider data or set to empty array
  const providerMedications = provider?.prescribed_medications || [];

  const availableTimes = [
    "9:00 AM", "10:00 AM", "11:00 AM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Selection Required",
        description: "Please select both a date and time for your appointment.",
        variant: "destructive",
      });
      return;
    }

    const formattedDate = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    toast({
      title: "Appointment Request Sent (Mock)",
      description: `Your appointment with ${provider?.name} on ${formattedDate} at ${selectedTime} has been requested. We'll send you a confirmation shortly.`,
    });
    // TODO: Implement actual API call for booking
  };

  // Loading State
  if (isLoading) {
    return (
       <div className="min-h-screen flex flex-col">
         <MainNavigation />
         <main className="flex-grow container mx-auto px-4 py-8">
           {/* Skeleton Loader for Header */}
           <div className="bg-gradient-to-r from-gray-400 to-gray-500 py-16 text-white animate-pulse mb-16 rounded-lg">
             <div className="container mx-auto px-4">
                <Skeleton className="h-6 w-32 mb-6 bg-gray-300/50 rounded" />
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
                    <Skeleton className="w-32 h-32 rounded-full bg-gray-300/50 flex-shrink-0" />
                    <div className="flex-grow">
                        <Skeleton className="h-10 w-3/4 mb-2 bg-gray-300/50 rounded" />
                        <Skeleton className="h-6 w-1/2 mb-4 bg-gray-300/50 rounded" />
                        <div className="flex flex-wrap gap-2 mb-4">
                            <Skeleton className="h-6 w-20 rounded-full bg-gray-300/50" />
                            <Skeleton className="h-6 w-24 rounded-full bg-gray-300/50" />
                        </div>
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-6 w-28 bg-gray-300/50 rounded" />
                            <Skeleton className="h-6 w-40 bg-gray-300/50 rounded" />
                        </div>
                    </div>
                </div>
             </div>
           </div>
           {/* Skeleton Loader for Content */}
           <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Skeleton className="h-40 w-full bg-gray-200 rounded-lg" />
                    <Skeleton className="h-60 w-full bg-gray-200 rounded-lg" />
                </div>
                <div className="md:col-span-1">
                    <Skeleton className="h-96 w-full bg-gray-200 rounded-lg sticky top-24" />
                </div>
           </div>
         </main>
         <Footer />
       </div>
    );
  }

  // Error State
  if (isError || !provider) {
     return (
       <div className="min-h-screen flex flex-col">
         <MainNavigation />
         <main className="flex-grow container mx-auto px-4 py-16">
           <div className="text-center py-12">
             <h1 className="text-2xl font-bold mb-4 text-red-600">Error Fetching Provider</h1>
             <p className="text-gray-600 mb-6">{error?.message || "Could not find the requested provider."}</p>
             <Button asChild>
               <Link to="/find-providers">Back to Search</Link>
             </Button>
           </div>
         </main>
         <Footer />
       </div>
     );
  }

  // --- Render actual content when data is loaded ---
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
                <Link to="/find-providers"> {/* Link back to search page */}
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Search Results
                </Link>
              </Button>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
              <div className="w-32 h-32 rounded-full bg-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center border-2 border-white/50">
                {provider.image_url ? (
                  <img src={provider.image_url} alt={provider.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-4xl font-bold">{`${provider.first_name?.charAt(0) ?? ''}${provider.last_name?.charAt(0) ?? ''}` || provider.name?.charAt(0) || '?'}</div>
                )}
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center md:text-left">{provider.name || `${provider.first_name} ${provider.last_name}`}</h1>
                <p className="text-xl text-medblue-100 mb-4 text-center md:text-left">{provider.title || 'Healthcare Provider'}</p>

                <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                  {provider.specialties?.map((specialty, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-medblue-600 text-white text-sm font-medium rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                  {provider.rating > 0 && (
                    <div className="flex items-center">
                      <span className="text-lg font-medium text-medteal-300">{provider.rating.toFixed(1)} ★</span>
                      {provider.review_count > 0 && (
                        <span className="text-sm text-medblue-100 ml-1">({provider.review_count} reviews)</span>
                      )}
                    </div>
                  )}
                  <span className="text-medblue-100">{provider.location || `${provider.city}, ${provider.state}`}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Provider Info Column */}
              <div className="md:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                  <h2 className="text-xl font-bold mb-4 text-medblue-800">About</h2>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap"> {/* Use whitespace-pre-wrap for bio formatting */}
                    {provider.bio || `${provider.name || 'This provider'} is a ${provider.title || 'healthcare professional'} specializing in ${provider.specialties?.join(', ') || 'various fields'}.`}
                  </p>
                  {/* TODO: Add more details like NPI, credentials if available */}
                </div>

                {providerMedications.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-medblue-800">Medications Prescribed</h2>
                    <div className="space-y-4">
                      {providerMedications.map((medication) => (
                        <div key={medication.id || medication.name} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                          <h3 className="font-medium text-lg text-medblue-700">{medication.name}</h3>
                          {medication.genericName && medication.category && (
                             <p className="text-sm text-gray-500 mb-2">{medication.genericName} - {medication.category}</p>
                          )}
                          {medication.description && (
                             <p className="text-gray-700">{medication.description}</p>
                          )}
                          {/* Link to medication detail page if it exists */}
                          <Button asChild variant="link" className="p-0 h-auto text-medblue-600 hover:text-medblue-700 mt-2">
                            <Link to={`/medications/${medication.id}`}>Learn more</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Column */}
              <div className="md:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
                  <h2 className="text-xl font-bold mb-4 text-medblue-800">Book an Appointment (Mock)</h2>

                  <div className="mb-6">
                    <p className="text-gray-700 mb-2">Select a date:</p>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                      className="border rounded-md"
                    />
                  </div>

                  {selectedDate && (
                    <div className="mb-6">
                      <p className="text-gray-700 mb-2">Select a time:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {availableTimes.map((time) => (
                          <button
                            key={time}
                            className={`py-2 px-4 rounded-md border text-sm ${
                              selectedTime === time
                                ? 'bg-medblue-600 text-white border-medblue-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-medblue-600'
                            }`}
                            onClick={() => setSelectedTime(time)}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleBookAppointment}
                    className="w-full bg-medblue-600 hover:bg-medblue-700"
                    disabled={!selectedDate || !selectedTime}
                  >
                    Request Appointment
                  </Button>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    By booking, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProviderDetailPage;
