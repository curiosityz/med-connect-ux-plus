import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Phone, Globe, Star, MessageSquare } from 'lucide-react';

const ProviderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { authState } = useAuth();

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        // Get auth token from Supabase session as fallback
        const { data: { session } } = await supabase.auth.getSession();
        const supabaseToken = session?.access_token;
        
        // Use either the Clerk token or the Supabase token, with fallback
        const token = authState.token || supabaseToken;
        
        if (!token) {
          console.warn('No authentication token available for provider details');
          setLoading(false);
          return;
        }
        
        if (id) {
          const data = await apiClient.getProviderDetails(id, token);
          setProvider(data);
        }
      } catch (error) {
        console.error("Error fetching provider:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [id, authState.token]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavigation />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-1/2 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-6" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="md:col-span-2">
              <Skeleton className="h-48 w-full mb-6" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Provider Not Found</h2>
          <p className="mb-8">Could not retrieve provider details.</p>
          <Link to="/find-providers">
            <Button>Back to Search</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />

      <main className="flex-grow bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Provider Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{provider.name}</h1>
                <p className="text-gray-600 dark:text-gray-400">{provider.title}</p>
              </div>
              {provider.imageUrl && (
                <img
                  src={provider.imageUrl}
                  alt={provider.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              )}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Contact</h3>
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <MapPin className="mr-2 h-4 w-4" />
                  {provider.location}, {provider.city}, {provider.state}
                </p>
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <Phone className="mr-2 h-4 w-4" />
                  {provider.phone || 'Not available'}
                </p>
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <Globe className="mr-2 h-4 w-4" />
                  <a href={provider.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">
                    Website
                  </a>
                </p>
              </div>

              {/* Ratings and Reviews */}
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Ratings & Reviews</h3>
                <div className="flex items-center">
                  <Star className="mr-1 h-5 w-5 text-yellow-500" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{provider.rating || 'No rating'}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1">({provider.reviewCount || 0} reviews)</span>
                </div>
                <Button variant="outline" className="mt-2">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Write a Review
                </Button>
              </div>
            </div>
          </div>

          {/* Provider Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">About</h2>
            <p className="text-gray-700 dark:text-gray-300">{provider.bio || 'No bio available.'}</p>

            {/* Specialties */}
            {provider.specialties && provider.specialties.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Specialties</h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                  {provider.specialties.map((specialty: string, index: number) => (
                    <li key={index}>{specialty}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Availability */}
            {provider.availability && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Availability</h3>
                <p className="text-gray-600 dark:text-gray-400">{provider.availability}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProviderDetailPage;
