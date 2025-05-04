
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import MedicationsPage from "./pages/MedicationsPage";
import MedicationDetailPage from "./pages/MedicationDetailPage";
import ProviderDetailPage from "./pages/ProviderDetailPage";
import NotFound from "./pages/NotFound";
import ArkansasProvidersPage from "./pages/ArkansasProvidersPage";
import ArkansasProviderDetailPage from "./pages/ArkansasProviderDetailPage";
import ProviderSearchPage from "./pages/ProviderSearchPage";

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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/medications" element={<MedicationsPage />} />
          <Route path="/medications/:id" element={<MedicationDetailPage />} />
          <Route path="/providers/:id" element={<ProviderDetailPage />} />
          <Route path="/arkansas-providers" element={<ArkansasProvidersPage />} />
          <Route path="/arkansas-providers/:npi" element={<ArkansasProviderDetailPage />} />
          <Route path="/find-providers" element={<ProviderSearchPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
