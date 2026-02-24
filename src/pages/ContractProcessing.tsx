import { useEffect, useState, useRef, useCallback } from "react";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useContractStore } from "@/hooks/useContractStore";
import { useDocumentStore } from "@/hooks/useDocumentAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { safeExtractText } from "@/lib/textExtraction";

const LOADING_MESSAGES = [
  "Reading your contract…",
  "Analyzing key terms and obligations…",
  "Checking for risk factors…",
  "Reviewing liability and indemnification…",
  "Identifying missing clauses…",
  "Generating your breakdown…",
];

const MIN_LOADING_TIME_MS = 3000;
const MAX_LOADING_TIME_MS = 120000;
const MESSAGE_ROTATION_INTERVAL_MS = 3000;

const ContractProcessing = () => {
  const navigate = useNavigate();
  const { file: docStoreFile } = useDocumentStore();
  const {
    file: contractFile,
    fileName,
    setFile,
    setExtractedText,
    setAnalysis,
    setError,
    setIsAnalyzing,
    reset,
  } = useContractStore();

  const [processingError, setProcessingError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const hasStartedRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Pick up file from document store if contract store doesn't have one
  const activeFile = contractFile || docStoreFile;

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, MESSAGE_ROTATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

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
    navigate("/contract-results");
  }, [navigate]);

  useEffect(() => {
    if (!activeFile) {
      navigate("/upload");
      return;
    }

    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startTimeRef.current = Date.now();

    // Store the file in contract store if it came from doc store
    if (!contractFile && docStoreFile) {
      setFile(docStoreFile);
    }

    timeoutRef.current = setTimeout(() => {
      setProcessingError("Analysis timed out. Please try again with a shorter document.");
      setError("Timeout");
    }, MAX_LOADING_TIME_MS);

    const process = async () => {
      setIsAnalyzing(true);
      setProcessingError(null);

      try {
        const extraction = await safeExtractText(activeFile);
        if (extraction.error) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setProcessingError(extraction.error.message);
          return;
        }
        const text = extraction.text;

        if (text.trim().length < 50) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setProcessingError("The extracted text seems too short. Please check the file or paste the text manually.");
          return;
        }

        setExtractedText(text);

        const { data, error } = await supabase.functions.invoke("analyze-contract-v2", {
          body: { documentText: text },
        });

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (error) {
          console.error("Edge function error:", error);
          setProcessingError("We couldn't analyze this contract right now. Please try again.");
          setError("Analysis failed");
          return;
        }

        if (!data?.success) {
          setProcessingError(data?.error || "We couldn't analyze this contract right now. Please try again.");
          setError(data?.error || "Analysis failed");
          return;
        }

        setAnalysis(data.analysis);
        await navigateWithMinTime();
      } catch (err) {
        console.error("Processing error:", err);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setProcessingError("We couldn't analyze this contract right now. Please try again.");
      }
    };

    process();
  }, [activeFile, contractFile, docStoreFile, navigate, setFile, setIsAnalyzing, setError, setExtractedText, setAnalysis, navigateWithMinTime]);

  const handleTryAgain = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    reset();
    navigate("/upload");
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
            <h1 className="text-2xl font-serif font-semibold mb-3">Unable to analyze document</h1>
            <p className="text-muted-foreground mb-8">{processingError}</p>
            <Button variant="hero" onClick={handleTryAgain}>Try Again</Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-sage mx-auto flex items-center justify-center mb-8">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <h1 key={loadingMessageIndex} className="text-2xl font-serif font-semibold mb-3 animate-fade-in">
              {LOADING_MESSAGES[loadingMessageIndex]}
            </h1>
            <p className="text-muted-foreground">This usually takes 10–15 seconds</p>
            {(fileName || activeFile?.name) && (
              <p className="text-sm text-muted-foreground mt-4 truncate max-w-xs mx-auto">
                {fileName || activeFile?.name}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ContractProcessing;
