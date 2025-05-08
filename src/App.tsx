
import React, { Suspense, lazy } from 'react'; // Import Suspense and lazy
import { AuthProvider } from "./contexts/AuthContext";
import { SearchProvider } from "./contexts/SearchContext";
import { UIProvider } from "./contexts/UIContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Skeleton } from '@/components/ui/skeleton'; // For fallback UI

// Lazy load page components
const Index = lazy(() => import("./pages/Index"));
const MedicationsPage = lazy(() => import("./pages/MedicationsPage"));
const MedicationDetailPage = lazy(() => import("./pages/MedicationDetailPage"));
const ProviderDetailPage = lazy(() => import("./pages/ProviderDetailPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ArkansasProvidersPage = lazy(() => import("./pages/ArkansasProvidersPage"));
const ArkansasProviderDetailPage = lazy(() => import("./pages/ArkansasProviderDetailPage"));
const ProviderSearchPage = lazy(() => import("./pages/ProviderSearchPage"));
const AuthPage = lazy(() => import("./pages/AuthPage").then(module => ({ default: module.AuthPage }))); // Adjust for named export
const ManageLocationsPage = lazy(() => import("./pages/ManageLocationsPage"));


// Simple fallback component
const LoadingFallback = () => (
  <div className="p-4">
    <Skeleton className="h-8 w-1/4 mb-4" />
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-3/4" />
  </div>
);


// Initialize query client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SearchProvider>
        <UIProvider> {/* Wrap with UIProvider */}
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}> {/* Wrap Routes with Suspense */}
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/medications" element={<MedicationsPage />} />
                  <Route path="/medications/:id" element={<MedicationDetailPage />} />
                  <Route path="/providers/:id" element={<ProviderDetailPage />} />
                  <Route path="/arkansas-providers" element={<ArkansasProvidersPage />} />
                  <Route path="/arkansas-providers/:npi" element={<ArkansasProviderDetailPage />} />
                  <Route path="/find-providers" element={<ProviderSearchPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/manage-locations" element={<ManageLocationsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </UIProvider>
      </SearchProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
