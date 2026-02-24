import { useEffect, useState, useRef, useCallback } from "react";
import { FileText, Loader2, AlertCircle, Briefcase } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useOfferLetterStore } from "@/hooks/useOfferLetterStore";
import { supabase } from "@/integrations/supabase/client";
import { safeExtractText } from "@/lib/textExtraction";

const LOADING_MESSAGES = [
  "Reading your offer letter…",
  "Analyzing compensation structure…",
  "Checking for risk factors…",
  "Reviewing equity and vesting…",
  "Identifying hidden clauses…",
  "Generating your breakdown…",
];

const MIN_LOADING_TIME_MS = 3000;
const MAX_LOADING_TIME_MS = 120000;
const MESSAGE_ROTATION_INTERVAL_MS = 3000;

const OfferLetterProcessing = () => {
  const navigate = useNavigate();
  const {
    file,
    pastedText,
    fileName,
    setExtractedText,
    setAnalysis,
    setError,
    setIsAnalyzing,
    reset,
  } = useOfferLetterStore();

  const [processingError, setProcessingError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const hasStartedRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Rotate loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, MESSAGE_ROTATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const navigateWithMinTime = useCallback(async () => {
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = MIN_LOADING_TIME_MS - elapsed;
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    navigate("/offer-letter-results");
  }, [navigate]);

  useEffect(() => {
    // Redirect if no input
    if (!file && !pastedText) {
      navigate("/offer-letter-explainer");
      return;
    }

    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startTimeRef.current = Date.now();

    timeoutRef.current = setTimeout(() => {
      setProcessingError("Analysis timed out. Please try again with a shorter document.");
      setError("Timeout");
    }, MAX_LOADING_TIME_MS);

    const process = async () => {
      setIsAnalyzing(true);
      setProcessingError(null);

      try {
        let text: string;

        if (pastedText) {
          text = pastedText;
        } else if (file) {
          const extraction = await safeExtractText(file);
          if (extraction.error) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setProcessingError(extraction.error.message);
            return;
          }
          text = extraction.text;
        } else {
          return;
        }

        // Basic validation
        if (text.trim().length < 50) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setProcessingError(
            "The extracted text seems too short. Please check the file or paste the text manually."
          );
          return;
        }

        setExtractedText(text);

        // Call AI edge function
        const { data, error } = await supabase.functions.invoke(
          "analyze-offer-letter",
          { body: { documentText: text } }
        );

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (error) {
          console.error("Edge function error:", error);
          setProcessingError(
            "We couldn't analyze this offer letter right now. Please try again."
          );
          setError("Analysis failed");
          return;
        }

        if (!data?.success) {
          setProcessingError(
            data?.error ||
              "We couldn't analyze this offer letter right now. Please try again."
          );
          setError(data?.error || "Analysis failed");
          return;
        }

        // Check if not an offer letter
        if (data.analysis?.document_type_detected === "not_offer_letter") {
          setAnalysis(data.analysis);
          await navigateWithMinTime();
          return;
        }

        setAnalysis(data.analysis);
        await navigateWithMinTime();
      } catch (err) {
        console.error("Processing error:", err);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setProcessingError(
          "We couldn't analyze this offer letter right now. Please try again."
        );
      }
    };

    process();
  }, [file, pastedText, navigate, setIsAnalyzing, setError, setExtractedText, setAnalysis, navigateWithMinTime]);

  const handleTryAgain = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    reset();
    navigate("/offer-letter-explainer");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full border-b border-border/50 bg-background">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-semibold text-foreground">
              DocBrief <span className="text-primary">AI</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
        {processingError ? (
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-destructive/10 mx-auto flex items-center justify-center mb-8">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-serif font-semibold mb-3">
              Unable to analyze document
            </h1>
            <p className="text-muted-foreground mb-8">{processingError}</p>
            <Button variant="hero" onClick={handleTryAgain}>
              Try Again
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-sage mx-auto flex items-center justify-center mb-8">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1
              key={loadingMessageIndex}
              className="text-2xl font-serif font-semibold mb-3 animate-fade-in"
            >
              {LOADING_MESSAGES[loadingMessageIndex]}
            </h1>
            <p className="text-muted-foreground">
              This usually takes 10–15 seconds
            </p>
            {fileName && (
              <p className="text-sm text-muted-foreground mt-4 truncate max-w-xs mx-auto">
                {fileName}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default OfferLetterProcessing;
