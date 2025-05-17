import React, { Suspense, lazy } from 'react'; 
import { AuthProvider } from "./contexts/AuthContext";
import { SearchProvider } from "./contexts/SearchContext";
import { UIProvider } from "./contexts/UIContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Skeleton } from '@/components/ui/skeleton';
import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut } from '@clerk/clerk-react';
import { OnboardingManager } from './components/Onboarding/OnboardingManager';

// Lazy load page components
const Index = lazy(() => import("./pages/Index"));
const MedicationsPage = lazy(() => import("./pages/MedicationsPage"));
const MedicationDetailPage = lazy(() => import("./pages/MedicationDetailPage"));
const ProviderDetailPage = lazy(() => import("./pages/ProviderDetailPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ArkansasProvidersPage = lazy(() => import("./pages/ArkansasProvidersPage"));
const ArkansasProviderDetailPage = lazy(() => import("./pages/ArkansasProviderDetailPage"));
const ProviderSearchPage = lazy(() => import("./pages/ProviderSearchPage"));
const AuthPage = lazy(() => import("./pages/AuthPage").then(module => ({ default: module.AuthPage })));
const ManageLocationsPage = lazy(() => import("./pages/ManageLocationsPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ProvidersPage = lazy(() => import("./pages/ProvidersPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));

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
    <ClerkLoading>
      <LoadingFallback />
    </ClerkLoading>
    <ClerkLoaded>
      <AuthProvider>
        <SearchProvider>
          <UIProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <OnboardingManager />
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/medications" element={<MedicationsPage />} />
                    <Route path="/medications/:id" element={<MedicationDetailPage />} />
                    <Route path="/providers/:id" element={<ProviderDetailPage />} />
                    <Route path="/arkansas-providers" element={<ArkansasProvidersPage />} />
                    <Route path="/arkansas-providers/:npi" element={<ArkansasProviderDetailPage />} />
                    <Route path="/find-providers" element={<ProviderSearchPage />} />
                    <Route path="/providers" element={<ProvidersPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/auth/verify-email-address" element={<VerifyEmailPage />} />
                    <Route path="/auth/verify" element={<VerifyEmailPage />} />
                    <Route path="/profile" element={
                      <>
                        <SignedIn>
                          <UserProfilePage />
                        </SignedIn>
                        <SignedOut>
                          <Navigate to="/auth" />
                        </SignedOut>
                      </>
                    } />
                    <Route path="/manage-locations" element={
                      <>
                        <SignedIn>
                          <ManageLocationsPage />
                        </SignedIn>
                        <SignedOut>
                          <Navigate to="/auth" />
                        </SignedOut>
                      </>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </UIProvider>
        </SearchProvider>
      </AuthProvider>
    </ClerkLoaded>
  </QueryClientProvider>
);

export default App;
