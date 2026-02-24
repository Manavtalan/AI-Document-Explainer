import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import UploadPage from "./pages/Upload";
import Processing from "./pages/Processing";
import Explanation from "./pages/Explanation";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import OfferLetterProcessing from "./pages/OfferLetterProcessing";
import OfferLetterResults from "./pages/OfferLetterResults";
import ContractProcessing from "./pages/ContractProcessing";
import ContractResults from "./pages/ContractResults";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/processing" element={<ContractProcessing />} />
          <Route path="/contract-results" element={<ContractResults />} />
          <Route path="/explanation" element={<Explanation />} />
          <Route path="/about" element={<AboutUs />} />
          {/* Redirect old offer letter upload to unified upload */}
          <Route path="/offer-letter-explainer" element={<Navigate to="/upload" replace />} />
          <Route path="/offer-letter-processing" element={<OfferLetterProcessing />} />
          <Route path="/offer-letter-results" element={<OfferLetterResults />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
