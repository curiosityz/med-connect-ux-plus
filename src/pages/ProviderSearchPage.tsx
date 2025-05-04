
import React, { useEffect } from 'react';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import ProviderSearch from '@/components/ProviderSearch';
import { useAuth } from '@/hooks/useAuth';

const ProviderSearchPage = () => {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    console.log('ProviderSearchPage loaded with auth state:', { 
      authenticated: !!user, 
      loading,
      userId: user?.id
    });
  }, [user, loading]);

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      
      <main className="flex-grow">
        {/* Header Section */}
        <section className="bg-medblue-700 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Find Medication Providers</h1>
            <p className="text-xl text-medblue-100 max-w-2xl mx-auto">
              Search for healthcare providers who prescribe your specific medications.
            </p>
            {user ? (
              <p className="mt-4 text-medblue-200">
                Logged in as {user.email} ({user.id.substring(0,8)}...)
              </p>
            ) : loading ? (
              <p className="mt-4 text-medblue-200">Checking authentication...</p>
            ) : (
              <p className="mt-4 text-medblue-200">
                Not logged in. Some features may be limited.
              </p>
            )}
          </div>
        </section>
        
        {/* Search Component */}
        <section className="py-16 bg-gray-50">
          <ProviderSearch />
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProviderSearchPage;
