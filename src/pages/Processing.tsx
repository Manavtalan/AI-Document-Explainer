import { useEffect, useState, useRef, useCallback } from "react";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/hooks/useDocumentAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { 
  validateExtractedText, 
  isEnglish as checkIsEnglish, 
  isContractLike as checkIsContractLike,
  isReadableText as checkIsReadable,
  TextValidationError 
} from "@/lib/fileValidation";
import { safeExtractText } from "@/lib/textExtraction";

import { getFingerprint } from "@/lib/fingerprint";
import { isFounderMode } from "@/lib/founderMode";
import ValidationError from "@/components/ValidationError";
import ContractWarningModal from "@/components/ContractWarningModal";
import DebugPanel from "@/components/DebugPanel";
// Phase 4: Rotating loading messages
const LOADING_MESSAGES = [
  "Analyzing your contract…",
  "Identifying key clauses…",
  "Simplifying legal language…",
  "Reviewing payment terms…",
  "Checking for important dates…",
  "Almost there…",
];

// Phase 4: Timing constants
const MIN_LOADING_TIME_MS = 3000; // Minimum 3 seconds visible
const MAX_LOADING_TIME_MS = 90000; // Maximum 90 seconds before timeout
const MESSAGE_ROTATION_INTERVAL_MS = 3000; // Rotate message every 3 seconds

const Processing = () => {
  const navigate = useNavigate();
  const { file, fileName, setExtractedText: storeExtractedText, setExplanation, setError, setIsAnalyzing, reset } = useDocumentStore();
  
  // Processing states
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<TextValidationError>(null);
  const [showContractWarning, setShowContractWarning] = useState(false);
  
  // Phase 4: Loading message rotation
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  
  // Debug panel data
  const [extractedText, setExtractedText] = useState("");
  const [characterCount, setCharacterCount] = useState(0);
  const [keywordCount, setKeywordCount] = useState(0);
  const [isEnglishText, setIsEnglishText] = useState(true);
  const [isContractLikeText, setIsContractLikeText] = useState(true);
  const [isReadableText, setIsReadableText] = useState(true);
  const [detectedFileType, setDetectedFileType] = useState("");
  
  // Prevent double-processing
  const hasStartedRef = useRef(false);
  const pendingTextRef = useRef<string>("");
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Phase 4: Rotate loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, MESSAGE_ROTATION_INTERVAL_MS);
    
    return () => clearInterval(interval);
  }, []);

  // Phase 4: Prevent browser back button during processing
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // If we're processing, prevent navigation
      if (!processingError && !validationError) {
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    // Push initial state
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [processingError, validationError]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Navigate with minimum loading time enforcement
  const navigateWithMinTime = useCallback(async () => {
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = MIN_LOADING_TIME_MS - elapsed;
    
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }
    
    navigate("/explanation");
  }, [navigate]);

  useEffect(() => {
    // If no file, redirect to upload
    if (!file) {
      navigate("/upload");
      return;
    }

    // Prevent double-processing in React StrictMode
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startTimeRef.current = Date.now();

    // Phase 4: Set maximum timeout
    timeoutRef.current = setTimeout(() => {
      setProcessingError("We couldn't confidently analyze this contract right now. Please try again.");
      setError("Timeout");
    }, MAX_LOADING_TIME_MS);

    const extractAndValidate = async () => {
      setIsAnalyzing(true);
      setProcessingError(null);
      setValidationError(null);

      try {
        // Step 1: Extract text from PDF/DOCX file
        const extraction = await safeExtractText(file);
        
        if (extraction.error) {
          console.error("Text extraction failed:", extraction.error);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setProcessingError(extraction.error.message);
          return;
        }
        
        const text = extraction.text;

        // Detect file type for debug panel
        const fileExt = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
        setDetectedFileType(fileExt);

        // Store extracted text for debug panel and complexity analysis
        setExtractedText(text);
        storeExtractedText(text);
        
        // Step 2: Run all validation checks
        const validation = validateExtractedText(text);
        setCharacterCount(validation.characterCount);
        setKeywordCount(validation.keywordCount);
        setIsReadableText(validation.isReadable);
        setIsEnglishText(checkIsEnglish(text));
        setIsContractLikeText(checkIsContractLike(text));
        
        // Check for hard errors first
        if (validation.error) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setValidationError(validation.error);
          return;
        }
        
        // Check for warning (not contract-like)
        if (validation.warning === 'not_contract_like') {
          pendingTextRef.current = text;
          setShowContractWarning(true);
          return;
        }
        
        // All checks passed - proceed to AI analysis
        await sendToAI(text);
        
      } catch (err) {
        console.error("Processing error:", err);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setProcessingError("We couldn't confidently analyze this contract right now. Please try again.");
      }
    };

    extractAndValidate();
  }, [file, fileName, navigate, setIsAnalyzing, setError]);

  const sendToAI = async (text: string) => {
    try {
      // Get browser fingerprint for server-side rate limiting
      const fingerprint = getFingerprint();
      
      // Build request headers (include founder key if in founder mode)
      const headers: Record<string, string> = {};
      if (isFounderMode()) {
        // In founder mode, we pass a header that the edge function can check
        // The actual bypass key should be set as a secret in Supabase
        headers["x-founder-key"] = import.meta.env.VITE_FOUNDER_BYPASS_KEY || "";
      }
      
      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: { documentText: text, fingerprint },
        headers,
      });

      // Clear timeout on response
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      if (error) {
        console.error("Edge function error:", error);
        setProcessingError("We couldn't confidently analyze this contract right now. Please try again.");
        setError("Analysis failed");
        return;
      }

      // Check for rate limit error specifically
      if (!data.success && data.errorCode === "RATE_LIMIT_EXCEEDED") {
        // Server detected this fingerprint already used today
        setProcessingError(data.error);
        setError("Rate limit exceeded");
        return;
      }

      if (!data.success) {
        // Use the exact error from backend (Phase 3 compliant messages)
        setProcessingError(data.error || "We couldn't confidently analyze this contract right now. Please try again.");
        setError(data.error);
        return;
      }

      // Store explanation and navigate with minimum time
      setExplanation(data.explanation);
      await navigateWithMinTime();
    } catch (err) {
      console.error("AI analysis error:", err);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setProcessingError("We couldn't confidently analyze this contract right now. Please try again.");
      setError("Analysis failed");
    }
  };

  const handleContinueAnyway = async () => {
    setShowContractWarning(false);
    startTimeRef.current = Date.now(); // Reset start time for min loading
    if (pendingTextRef.current) {
      await sendToAI(pendingTextRef.current);
    }
  };

  const handleUploadAnother = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    reset();
    navigate("/upload");
  };

  const handleTryAgain = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    reset();
    navigate("/upload");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
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
        {validationError ? (
          // Validation error (insufficient text, non-English)
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-destructive/10 mx-auto flex items-center justify-center mb-8">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            
            <ValidationError type={validationError} />

            <div className="mt-8">
              <Button variant="hero" onClick={handleTryAgain}>
                Upload Another Document
              </Button>
            </div>
          </div>
        ) : processingError ? (
          // Processing/AI error
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-destructive/10 mx-auto flex items-center justify-center mb-8">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-serif font-semibold mb-3">
              Unable to analyze document
            </h1>
            <p className="text-muted-foreground mb-8">
              {processingError}
            </p>

            <Button variant="hero" onClick={handleTryAgain}>
              Try Again
            </Button>
          </div>
        ) : (
          // Loading state - Phase 4: Full screen, rotating messages
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-sage mx-auto flex items-center justify-center mb-8">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            
            {/* Rotating loading message with fade transition */}
            <h1 
              key={loadingMessageIndex}
              className="text-2xl font-serif font-semibold mb-3 animate-fade-in"
            >
              {LOADING_MESSAGES[loadingMessageIndex]}
            </h1>
            <p className="text-muted-foreground">
              This may take up to a minute
            </p>
            {fileName && (
              <p className="text-sm text-muted-foreground mt-4 truncate max-w-xs mx-auto">
                {fileName}
              </p>
            )}
          </div>
        )}
      </main>

      {/* Contract Warning Modal */}
      <ContractWarningModal
        isOpen={showContractWarning}
        onContinue={handleContinueAnyway}
        onCancel={handleUploadAnother}
      />

      {/* Debug Panel (dev only) */}
      <DebugPanel
        extractedText={extractedText}
        characterCount={characterCount}
        keywordCount={keywordCount}
        isEnglish={isEnglishText}
        isContractLike={isContractLikeText}
        isReadable={isReadableText}
        fileType={detectedFileType}
      />
    </div>
  );
};

export default Processing;
