import { useEffect, useState, useRef } from "react";
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
import ValidationError from "@/components/ValidationError";
import ContractWarningModal from "@/components/ContractWarningModal";
import DebugPanel from "@/components/DebugPanel";

const Processing = () => {
  const navigate = useNavigate();
  const { file, fileName, setSections, setError, setIsAnalyzing, reset } = useDocumentStore();
  
  // Processing states
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<TextValidationError>(null);
  const [showContractWarning, setShowContractWarning] = useState(false);
  
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

  useEffect(() => {
    // If no file, redirect to upload
    if (!file) {
      navigate("/upload");
      return;
    }

    // Prevent double-processing in React StrictMode
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const extractAndValidate = async () => {
      setIsAnalyzing(true);
      setProcessingError(null);
      setValidationError(null);

      try {
        // Step 1: Extract text from PDF/DOCX file
        const extraction = await safeExtractText(file);
        
        if (extraction.error) {
          console.error("Text extraction failed:", extraction.error);
          setProcessingError(extraction.error.message);
          return;
        }
        
        const text = extraction.text;

        // Detect file type for debug panel
        const fileExt = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
        setDetectedFileType(fileExt);

        // Store extracted text for debug panel
        setExtractedText(text);
        
        // Step 2: Run all validation checks
        const validation = validateExtractedText(text);
        setCharacterCount(validation.characterCount);
        setKeywordCount(validation.keywordCount);
        setIsReadableText(validation.isReadable);
        setIsEnglishText(checkIsEnglish(text));
        setIsContractLikeText(checkIsContractLike(text));
        
        // Check for hard errors first
        if (validation.error) {
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
        setProcessingError("Something went wrong. Please try again later.");
      }
    };

    extractAndValidate();
  }, [file, fileName, navigate, setIsAnalyzing]);

  const sendToAI = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: { documentText: text, fileName },
      });

      if (error) {
        console.error("Edge function error:", error);
        setProcessingError("We're unable to analyze your document right now. Please try again later.");
        setError("Analysis failed");
        return;
      }

      if (!data.success) {
        setProcessingError(data.error || "Something went wrong. Please try again.");
        setError(data.error);
        return;
      }

      // Success - store sections and navigate
      setSections(data.sections);
      navigate("/explanation");
    } catch (err) {
      console.error("AI analysis error:", err);
      setProcessingError("Something went wrong. Please try again later.");
      setError("Analysis failed");
    }
  };

  const handleContinueAnyway = async () => {
    setShowContractWarning(false);
    if (pendingTextRef.current) {
      await sendToAI(pendingTextRef.current);
    }
  };

  const handleUploadAnother = () => {
    reset();
    navigate("/upload");
  };

  const handleTryAgain = () => {
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
              iLoveDocs<span className="text-primary">.ai</span>
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
          // Loading state
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-sage mx-auto flex items-center justify-center mb-8">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            
            <h1 className="text-2xl font-serif font-semibold mb-3">
              Analyzing your contract…
            </h1>
            <p className="text-muted-foreground">
              This may take up to 1 minute
            </p>
            {fileName && (
              <p className="text-sm text-muted-foreground mt-4">
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
