
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import { getProviderById, getMedicationById } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ProviderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const provider = id ? getProviderById(id) : undefined;
  
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
    
    // Format date for display
    const formattedDate = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    toast({
      title: "Appointment Request Sent",
      description: `Your appointment with ${provider?.name} on ${formattedDate} at ${selectedTime} has been requested. We'll send you a confirmation shortly.`,
    });
  };
  
  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavigation />
        <main className="flex-grow container mx-auto px-4 py-16">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4 text-medblue-800">Provider Not Found</h1>
            <p className="text-gray-600 mb-6">The provider you're looking for does not exist or has been removed.</p>
            <Button asChild>
              <Link to="/providers">Back to Providers</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Get medications this provider prescribes
  const providerMedications = provider.medications.map(medId => getMedicationById(medId)).filter(Boolean);

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
                <Link to="/providers">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Providers
                </Link>
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
              <div className="w-32 h-32 rounded-full bg-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {provider.imageUrl ? (
                  <img src={provider.imageUrl} alt={provider.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-4xl font-bold">{provider.name.charAt(0)}</div>
                )}
              </div>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center md:text-left">{provider.name}</h1>
                <p className="text-xl text-medblue-100 mb-4 text-center md:text-left">{provider.title}</p>
                
                <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                  {provider.specialties.map((specialty, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-medblue-600 text-white text-sm font-medium rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                  <div className="flex items-center">
                    <span className="text-lg font-medium text-medteal-300">{provider.rating.toFixed(1)} ★</span>
                    <span className="text-sm text-medblue-100 ml-1">({provider.reviewCount} reviews)</span>
                  </div>
                  <span className="text-medblue-100">{provider.location}</span>
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
                  <p className="text-gray-700 mb-4">
                    {provider.bio || `${provider.name} is a ${provider.title} who specializes in the treatment of various conditions. 
                    With a focus on personalized care and evidence-based approaches, they work closely with 
                    patients to develop appropriate treatment plans.`}
                  </p>
                </div>
                
                {providerMedications.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-medblue-800">Medications Prescribed</h2>
                    <div className="space-y-4">
                      {providerMedications.map(medication => medication && (
                        <div key={medication.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                          <h3 className="font-medium text-lg text-medblue-700">{medication.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">{medication.genericName} - {medication.category}</p>
                          <p className="text-gray-700">{medication.description}</p>
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
                  <h2 className="text-xl font-bold mb-4 text-medblue-800">Book an Appointment</h2>
                  
                  <div className="mb-6">
                    <p className="text-gray-700 mb-2">Select a date:</p>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        // Disable past dates and weekends
                        return (
                          date < new Date() || 
                          date.getDay() === 0 || 
                          date.getDay() === 6
                        );
                      }}
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
