import { useState } from "react";
import { ChevronDown, ChevronUp, Bug } from "lucide-react";

interface DebugPanelProps {
  extractedText: string;
  characterCount: number;
  keywordCount: number;
  isEnglish: boolean;
  isContractLike: boolean;
}

/**
 * Debug panel for development - shows what AI will receive
 * Toggle with VITE_DEBUG_MODE=true in environment
 */
const DebugPanel = ({
  extractedText,
  characterCount,
  keywordCount,
  isEnglish,
  isContractLike,
}: DebugPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Only show in debug mode
  const isDebugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
  
  if (!isDebugMode) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full">
      <div className="bg-foreground text-background rounded-lg shadow-lg border border-border overflow-hidden">
        {/* Header - always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 hover:bg-foreground/90 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-primary" />
            <span className="font-mono text-sm font-medium">Debug Panel</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
        
        {/* Expandable content */}
        {isExpanded && (
          <div className="p-3 border-t border-border/20 space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-background/10 rounded px-2 py-1">
                <span className="text-muted-foreground">Chars:</span>{" "}
                <span className="text-primary font-bold">{characterCount.toLocaleString()}</span>
              </div>
              <div className="bg-background/10 rounded px-2 py-1">
                <span className="text-muted-foreground">Keywords:</span>{" "}
                <span className="text-primary font-bold">{keywordCount}</span>
              </div>
              <div className="bg-background/10 rounded px-2 py-1">
                <span className="text-muted-foreground">English:</span>{" "}
                <span className={isEnglish ? "text-green-400" : "text-red-400"}>
                  {isEnglish ? "✓ Yes" : "✗ No"}
                </span>
              </div>
              <div className="bg-background/10 rounded px-2 py-1">
                <span className="text-muted-foreground">Contract:</span>{" "}
                <span className={isContractLike ? "text-green-400" : "text-yellow-400"}>
                  {isContractLike ? "✓ Yes" : "⚠ Maybe"}
                </span>
              </div>
            </div>
            
            {/* Text preview */}
            <div>
              <div className="text-xs text-muted-foreground mb-1 font-mono">
                Extracted Text Preview (first 1,000 chars):
              </div>
              <div className="bg-background/10 rounded p-2 max-h-48 overflow-y-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words text-background/80">
                  {extractedText.slice(0, 1000)}
                  {extractedText.length > 1000 && "..."}
                </pre>
              </div>
            </div>
            
            {/* Full character count */}
            <div className="text-xs font-mono text-muted-foreground">
              Extracted text length: {characterCount.toLocaleString()} characters
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
