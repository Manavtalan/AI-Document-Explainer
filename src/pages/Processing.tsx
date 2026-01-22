import { useEffect, useState } from "react";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/hooks/useDocumentAnalysis";
import { supabase } from "@/integrations/supabase/client";

const Processing = () => {
  const navigate = useNavigate();
  const { file, fileName, setSections, setError, setIsAnalyzing, reset } = useDocumentStore();
  const [processingError, setProcessingError] = useState<string | null>(null);

  useEffect(() => {
    const analyzeDocument = async () => {
      // If no file, redirect to upload
      if (!file) {
        navigate("/upload");
        return;
      }

      setIsAnalyzing(true);
      setProcessingError(null);

      try {
        // Read file content as text
        const text = await file.text();
        
        // Call the edge function
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
        console.error("Analysis error:", err);
        setProcessingError("Something went wrong. Please try again later.");
        setError("Analysis failed");
      }
    };

    analyzeDocument();
  }, [file, fileName, navigate, setSections, setError, setIsAnalyzing]);

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
        {processingError ? (
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
    </div>
  );
};

export default Processing;
