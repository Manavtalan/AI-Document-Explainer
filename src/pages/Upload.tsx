import { useState, useCallback } from "react";
import { FileText, Upload as UploadIcon, X, ArrowRight, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useDocumentStore } from "@/hooks/useDocumentAnalysis";
import { validateFile, FileValidationError, ALLOWED_EXTENSIONS, MAX_FILE_SIZE_MB } from "@/lib/fileValidation";
import ValidationError from "@/components/ValidationError";

const UploadPage = () => {
  const navigate = useNavigate();
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showDocTypeModal, setShowDocTypeModal] = useState(false);
  const [validationError, setValidationError] = useState<FileValidationError>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { setFile } = useDocumentStore();

  const handleFileValidation = useCallback((file: File): boolean => {
    setValidationError(null);
    
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      setLocalFile(null);
      return false;
    }
    
    return true;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
    
    if (handleFileValidation(droppedFile)) {
      setLocalFile(droppedFile);
    }
  }, [handleFileValidation]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (handleFileValidation(selectedFile)) {
      setLocalFile(selectedFile);
    }
    
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setLocalFile(null);
    setValidationError(null);
  };

  const handleAnalyze = () => {
    if (!localFile) return;
    setShowDocTypeModal(true);
  };

  const handleDocTypeConfirm = () => {
    if (!localFile) return;
    
    setIsProcessing(true);
    setFile(localFile);
    setShowDocTypeModal(false);
    navigate("/processing");
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

      <main className="py-16 px-4">
        <div className="container mx-auto max-w-xl">
          <h1 className="text-3xl font-serif font-semibold text-center mb-2">
            Upload your contract
          </h1>
          <p className="text-muted-foreground text-center mb-10">
            We'll analyze it and give you a clear explanation
          </p>

          {/* Validation Error */}
          {validationError && (
            <div className="mb-6">
              <ValidationError type={validationError} />
            </div>
          )}

          {/* Upload area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200
              ${isDragging 
                ? "border-primary bg-sage/30" 
                : localFile 
                  ? "border-primary/50 bg-sage/20" 
                  : validationError
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-border hover:border-primary/30 hover:bg-card"
              }
            `}
          >
            {localFile ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-sage mx-auto flex items-center justify-center">
                  <FileCheck className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{localFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(localFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-sage mx-auto flex items-center justify-center mb-6">
                  <UploadIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium text-foreground mb-2">
                  Drag & drop your contract here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  {ALLOWED_EXTENSIONS.join(', ').toUpperCase().replace(/\./g, '')} • Max size: {MAX_FILE_SIZE_MB}MB
                </p>
                <input
                  type="file"
                  accept={ALLOWED_EXTENSIONS.join(',')}
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
              </>
            )}
          </div>

          {/* Upload button - Phase 4: "Upload Contract" CTA */}
          {localFile && (
            <div className="mt-8 text-center">
              <Button 
                variant="hero" 
                size="xl" 
                onClick={handleAnalyze}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Upload Contract"}
                {!isProcessing && <ArrowRight className="w-5 h-5 ml-2" />}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Document Type Modal - Phase 4 */}
      {showDocTypeModal && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl p-8 max-w-md w-full shadow-calm border border-border/50">
            <h2 className="text-xl font-serif font-semibold mb-2">
              What kind of document is this?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Select the type that best matches your document
            </p>

            <div className="space-y-3">
              {/* Contract - enabled */}
              <button
                onClick={handleDocTypeConfirm}
                className="w-full p-4 text-left rounded-xl border border-primary bg-sage/30 hover:bg-sage/50 transition-colors"
              >
                <span className="font-medium text-foreground">✅ Contract</span>
              </button>
              
              {/* Coming soon options - disabled */}
              <button
                disabled
                className="w-full p-4 text-left rounded-xl border border-border bg-muted/50 opacity-60 cursor-not-allowed"
              >
                <span className="font-medium text-muted-foreground">🔒 Offer Letter</span>
                <span className="text-xs text-muted-foreground ml-2">(Coming soon)</span>
              </button>
              <button
                disabled
                className="w-full p-4 text-left rounded-xl border border-border bg-muted/50 opacity-60 cursor-not-allowed"
              >
                <span className="font-medium text-muted-foreground">🔒 Bank Letter</span>
                <span className="text-xs text-muted-foreground ml-2">(Coming soon)</span>
              </button>
              <button
                disabled
                className="w-full p-4 text-left rounded-xl border border-border bg-muted/50 opacity-60 cursor-not-allowed"
              >
                <span className="font-medium text-muted-foreground">🔒 Legal Notice</span>
                <span className="text-xs text-muted-foreground ml-2">(Coming soon)</span>
              </button>
            </div>

            <button
              onClick={() => setShowDocTypeModal(false)}
              className="mt-6 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
