import { useState, useEffect } from "react";
import { FileText, Copy, Download, Check, Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useDocumentStore, SECTION_LABELS, SECTION_ORDER, ContractExplanation } from "@/hooks/useDocumentAnalysis";

/**
 * Phase 4: Content Renderer
 * Renders text with proper formatting:
 * - Bullet points where lines start with • or -
 * - Paragraphs otherwise
 * - Preserves line breaks
 */
const ContentRenderer = ({ content }: { content: string }) => {
  // Check if content has bullet points
  const lines = content.split('\n').filter(line => line.trim());
  const hasBullets = lines.some(line => 
    line.trim().startsWith('•') || 
    line.trim().startsWith('-') ||
    line.trim().startsWith('⚠️')
  );

  if (hasBullets) {
    return (
      <ul className="space-y-2">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          // Remove bullet character if present
          const text = trimmed.replace(/^[•\-]\s*/, '').replace(/^⚠️\s*/, '');
          const hasWarning = trimmed.startsWith('⚠️');
          
          return (
            <li key={i} className="flex gap-2 text-muted-foreground leading-relaxed">
              <span className="flex-shrink-0 mt-1">
                {hasWarning ? '⚠️' : '•'}
              </span>
              <span>{text || trimmed}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  // Render as paragraphs
  return (
    <div className="space-y-3 text-muted-foreground leading-relaxed">
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  );
};

/**
 * Explanation Page - Phase 4 Compliant
 * 
 * This component ONLY renders text from the backend.
 * - No interpretation
 * - No conditional logic based on content
 * - No rewriting or summarizing
 * 
 * Backend owns all intelligence.
 */
const Explanation = () => {
  const navigate = useNavigate();
  const { explanation, fileName, reset } = useDocumentStore();
  const [copied, setCopied] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Redirect if no explanation available
  useEffect(() => {
    if (!explanation) {
      navigate("/upload");
    }
  }, [explanation, navigate]);

  const handleCopy = () => {
    if (!explanation) return;
    
    // Phase 4: Build plain text version for clipboard
    // Includes section headers + content, maintains readable formatting
    const text = SECTION_ORDER
      .map(key => {
        const label = SECTION_LABELS[key];
        const content = explanation[key];
        return `${label}\n${'─'.repeat(label.length)}\n${content}`;
      })
      .join("\n\n");
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Explanation copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    setShowUpgradeModal(true);
  };

  const handleUploadAnother = () => {
    reset();
    navigate("/upload");
  };

  // Show nothing while redirecting
  if (!explanation) {
    return null;
  }

  // Check if this is a risks or caution section for special styling
  const isWarningSection = (key: keyof ContractExplanation) => 
    key === "risks" || key === "be_careful";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full border-b border-border/50 bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-semibold text-foreground">
              iLoveDocs<span className="text-primary">.ai</span>
            </span>
          </Link>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button variant="warm" size="sm" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline ml-2">
                {copied ? "Copied!" : "Copy Explanation"}
              </span>
            </Button>
            <Button variant="soft" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Download PDF</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-10">
            <h1 className="text-3xl font-serif font-semibold mb-2">
              Contract Explanation
            </h1>
            <p className="text-muted-foreground">
              Here's what you need to know about your document
              {fileName && (
                <span className="block text-sm mt-1 truncate max-w-md">
                  ({fileName})
                </span>
              )}
            </p>
          </div>

          {/* Explanation sections - Phase 4: rendered in fixed order */}
          <div className="space-y-6">
            {SECTION_ORDER.map((key) => (
              <section 
                key={key}
                className={`
                  rounded-xl p-6 border
                  ${isWarningSection(key) 
                    ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800" 
                    : "bg-card border-border/50"
                  }
                `}
              >
                <h2 className="text-lg font-serif font-semibold mb-4 text-foreground flex items-center gap-2">
                  {isWarningSection(key) && (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  )}
                  {SECTION_LABELS[key]}
                </h2>
                {/* 
                  Phase 4: Render content with proper formatting
                  - Bullet points where line breaks exist with markers
                  - Paragraphs otherwise
                */}
                <ContentRenderer content={explanation[key]} />
              </section>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="mt-10 p-4 bg-muted/50 rounded-xl border border-border/30">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              This explanation is for informational purposes only and does not constitute legal advice. 
              If you have questions about this contract, please consult a qualified attorney.
            </p>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Need to analyze another contract?
            </p>
            <Button variant="warm" onClick={handleUploadAnother}>
              Upload Another Contract
            </Button>
          </div>
        </div>
      </main>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl p-8 max-w-md w-full shadow-calm border border-border/50 text-center">
            <div className="w-16 h-16 rounded-2xl bg-sage mx-auto flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-xl font-serif font-semibold mb-2">
              Save and share this explanation
            </h2>
            <p className="text-muted-foreground mb-6">
              Upgrade to Pro to download your explanation as a PDF
            </p>

            <Button variant="hero" className="w-full mb-3">
              Upgrade to Pro — $9/month
            </Button>
            
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explanation;
