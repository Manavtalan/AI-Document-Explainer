import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import UploadPage from "./pages/Upload";
import Processing from "./pages/Processing";
import Explanation from "./pages/Explanation";
import NotFound from "./pages/NotFound";
import AboutUs from "./pages/AboutUs";
import OfferLetterUpload from "./pages/OfferLetterUpload";
import OfferLetterProcessing from "./pages/OfferLetterProcessing";
import OfferLetterResults from "./pages/OfferLetterResults";

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
          <Route path="/processing" element={<Processing />} />
          <Route path="/explanation" element={<Explanation />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/offer-letter-explainer" element={<OfferLetterUpload />} />
          <Route path="/offer-letter-processing" element={<OfferLetterProcessing />} />
          <Route path="/offer-letter-results" element={<OfferLetterResults />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
