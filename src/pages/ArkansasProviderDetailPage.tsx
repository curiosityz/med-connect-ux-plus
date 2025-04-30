import React from "react";
import { useParams, Link } from "react-router-dom";
import MainNavigation from "@/components/MainNavigation";
import Footer from "@/components/Footer";
import { useArkansasProviderWithDetails } from "@/hooks/useSupabase";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

const ArkansasProviderDetailPage = () => {
  const { npi } = useParams<{ npi: string }>();
  const { data, isLoading, error } = useArkansasProviderWithDetails(npi);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavigation />
        <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medblue-700"></div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error || !data?.provider) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavigation />
        <main className="flex-grow container mx-auto px-4 py-16">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4 text-medblue-800">Provider Not Found</h1>
            <p className="text-gray-600 mb-6">The provider you're looking for does not exist or has been removed.</p>
            <Button asChild>
              <Link to="/arkansas-providers">Back to Providers</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { provider, details } = data;

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
                <Link to="/arkansas-providers">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Arkansas Providers
                </Link>
              </Button>
            </div>
            
            <div className="max-w-3xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {provider.prscrbr_last_org_name}, {provider.prscrbr_first_name}
              </h1>
              <p className="text-xl text-medblue-100 mb-4">{provider.prscrbr_type}</p>
              
              <div className="flex flex-wrap gap-3 mt-4">
                <span className="px-3 py-1 bg-medblue-600 text-white text-sm font-medium rounded-full">
                  NPI: {provider.prscrbr_npi}
                </span>
                <span className="px-3 py-1 bg-medblue-600 text-white text-sm font-medium rounded-full">
                  {provider.prscrbr_city}, {provider.prscrbr_state_abrvtn}
                </span>
              </div>
            </div>
          </div>
        </section>
        
        {/* Provider Details Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Provider Information */}
              <div>
                <h2 className="text-xl font-bold mb-4 text-medblue-800">Provider Information</h2>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                      <p className="text-gray-900">{provider.prscrbr_last_org_name}, {provider.prscrbr_first_name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">NPI</h3>
                      <p className="text-gray-900">{provider.prscrbr_npi}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Location</h3>
                      <p className="text-gray-900">{provider.prscrbr_city}, {provider.prscrbr_state_abrvtn}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Provider Type</h3>
                      <p className="text-gray-900">{provider.prscrbr_type}</p>
                    </div>
                    {details && (
                      <>
                        {details.provider_credential_text && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Credentials</h3>
                            <p className="text-gray-900">{details.provider_credential_text}</p>
                          </div>
                        )}
                        {details.provider_sex_code && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                            <p className="text-gray-900">{details.provider_sex_code === 'M' ? 'Male' : 'Female'}</p>
                          </div>
                        )}
                        {details.provider_license_number_1 && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">License Number</h3>
                            <p className="text-gray-900">{details.provider_license_number_1} ({details.provider_license_number_state_code_1})</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Medication Information */}
              <div>
                <h2 className="text-xl font-bold mb-4 text-medblue-800">Prescription Information</h2>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Medication</h3>
                    <p className="text-gray-900 font-semibold">{provider.brnd_name}</p>
                    <p className="text-sm text-gray-500">{provider.gnrc_name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Claims</h3>
                      <p className="text-gray-900 font-semibold">{provider.tot_clms.toLocaleString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Beneficiaries</h3>
                      <p className="text-gray-900 font-semibold">{provider.tot_benes.toLocaleString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">30-Day Fills</h3>
                      <p className="text-gray-900">{provider.tot_30day_fills.toLocaleString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Day Supply</h3>
                      <p className="text-gray-900">{provider.tot_day_suply.toLocaleString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Drug Cost</h3>
                      <p className="text-gray-900">${provider.tot_drug_cst.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                  </div>
                  
                  {/* 65+ Information */}
                  {provider.ge65_tot_clms !== null && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-md font-semibold text-gray-900 mb-3">65+ Population Data</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">65+ Claims</h3>
                          <p className="text-gray-900">{provider.ge65_tot_clms.toLocaleString()}</p>
                        </div>
                        {provider.ge65_tot_benes !== null && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">65+ Beneficiaries</h3>
                            <p className="text-gray-900">{provider.ge65_tot_benes.toLocaleString()}</p>
                          </div>
                        )}
                        {provider.ge65_tot_30day_fills !== null && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">65+ 30-Day Fills</h3>
                            <p className="text-gray-900">{provider.ge65_tot_30day_fills.toLocaleString()}</p>
                          </div>
                        )}
                        {provider.ge65_tot_day_suply !== null && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">65+ Day Supply</h3>
                            <p className="text-gray-900">{provider.ge65_tot_day_suply.toLocaleString()}</p>
                          </div>
                        )}
                        {provider.ge65_tot_drug_cst !== null && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">65+ Drug Cost</h3>
                            <p className="text-gray-900">${provider.ge65_tot_drug_cst.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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

export default ArkansasProviderDetailPage;
