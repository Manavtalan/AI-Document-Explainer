import { useState, useCallback } from "react";
import { FileText, Upload as UploadIcon, X, ArrowRight, FileCheck, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useOfferLetterStore } from "@/hooks/useOfferLetterStore";

const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type FileError = 'unsupported_type' | 'file_too_large' | null;

function validateOfferFile(file: File): FileError {
  const name = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext));
  if (!hasValidExt) return 'unsupported_type';
  if (file.size > MAX_FILE_SIZE_BYTES) return 'file_too_large';
  return null;
}

const OfferLetterUpload = () => {
  const navigate = useNavigate();
  const { setFile, setPastedText, reset } = useOfferLetterStore();

  const [localFile, setLocalFile] = useState<File | null>(null);
  const [pastedText, setLocalPastedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<FileError>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileValidation = useCallback((file: File): boolean => {
    setFileError(null);
    const error = validateOfferFile(file);
    if (error) {
      setFileError(error);
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
      setLocalPastedText("");
    }
  }, [handleFileValidation]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (handleFileValidation(selectedFile)) {
      setLocalFile(selectedFile);
      setLocalPastedText("");
    }
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setLocalFile(null);
    setFileError(null);
  };

  const handleSubmit = () => {
    if (localFile) {
      reset();
      setFile(localFile);
      navigate("/offer-letter-processing");
    } else if (pastedText.trim().length > 0) {
      reset();
      setPastedText(pastedText.trim());
      navigate("/offer-letter-processing");
    }
  };

  const hasInput = localFile !== null || pastedText.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      <main className="py-16 px-4">
        <div className="container mx-auto max-w-xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-sage mx-auto flex items-center justify-center mb-6">
              <Briefcase className="w-8 h-8 text-primary" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-serif font-semibold mb-2">
              Offer Letter Explainer
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Upload your offer letter and get a clear, plain-English breakdown of every component — compensation, equity, benefits, restrictions, and hidden risks.
            </p>
          </div>

          {/* File error */}
          {fileError && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
              <p className="text-sm font-medium text-destructive">
                {fileError === 'unsupported_type'
                  ? 'Unsupported file type. Please upload a PDF or DOCX file.'
                  : 'File too large. Please upload a file smaller than 10MB.'}
              </p>
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
                  : fileError
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
                  Drag & drop your offer letter here
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports PDF, DOCX — or paste text below
                </p>
                <p className="text-xs text-muted-foreground">
                  Max size: {MAX_FILE_SIZE_MB}MB
                </p>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
              </>
            )}
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground font-medium">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Text paste area */}
          <div className="relative">
            <textarea
              value={pastedText}
              onChange={(e) => {
                setLocalPastedText(e.target.value);
                if (e.target.value.trim()) setLocalFile(null);
              }}
              placeholder="Paste your offer letter text here..."
              className="w-full min-h-[200px] p-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm leading-relaxed"
              disabled={isProcessing}
            />
            <span className="absolute bottom-3 right-3 text-xs text-muted-foreground">
              {pastedText.length} characters
            </span>
          </div>

          {/* Submit button */}
          <div className="mt-8 text-center">
            <Button
              variant="hero"
              size="xl"
              onClick={handleSubmit}
              disabled={!hasInput || isProcessing}
              className="w-full sm:w-auto"
            >
              {isProcessing ? "Processing..." : "Analyze My Offer Letter"}
              {!isProcessing && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>🔒 Encrypted & Secure</span>
            <span>🗑️ Auto-deleted in 24 hours</span>
            <span>🚫 Never used for AI training</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OfferLetterUpload;
