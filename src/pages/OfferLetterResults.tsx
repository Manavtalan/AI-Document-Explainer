import { useState, useEffect, useMemo } from "react";
import { FileText, Copy, Check, ArrowLeft, AlertTriangle, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useOfferLetterStore } from "@/hooks/useOfferLetterStore";
import CompensationSummary from "@/components/offer-letter/CompensationSummary";
import SectionBreakdown from "@/components/offer-letter/SectionBreakdown";
import ChatPanel from "@/components/offer-letter/ChatPanel";

const OfferLetterResults = () => {
  const navigate = useNavigate();
  const { analysis, fileName, reset } = useOfferLetterStore();
  const [copied, setCopied] = useState(false);
  const [glossarySearch, setGlossarySearch] = useState("");
  const [showGlossary, setShowGlossary] = useState(false);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    if (!analysis) {
      navigate("/offer-letter-explainer");
    }
  }, [analysis, navigate]);

  const redCount = analysis?.red_flags?.length || 0;
  const yellowCount = analysis?.caution_items?.length || 0;
  const missingCount = analysis?.missing_items?.length || 0;

  const filteredGlossary = useMemo(() => {
    if (!analysis?.glossary) return [];
    const sorted = [...analysis.glossary].sort((a, b) => a.term.localeCompare(b.term));
    if (!glossarySearch.trim()) return sorted;
    return sorted.filter(
      (g) =>
        g.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
        g.definition.toLowerCase().includes(glossarySearch.toLowerCase())
    );
  }, [analysis?.glossary, glossarySearch]);

  const handleCopySummary = () => {
    if (!analysis) return;
    const s = analysis.total_compensation_summary;
    const text = `Offer Letter Analysis — ${analysis.role_title} at ${analysis.company_name}

Base Salary: ${s.base_salary?.annual || "N/A"}
Equity: ${s.equity?.total_grant || "None"} (${s.equity?.type || ""})
Signing Bonus: ${s.signing_bonus?.amount || "None"}
Performance Bonus: ${s.performance_bonus?.target || "None"}
Benefits: ${s.benefits_estimate?.annual_value || "N/A"}

Total Year 1: ${s.total_year_1 || "N/A"}
Red Flags: ${redCount} | Caution Items: ${yellowCount} | Missing Items: ${missingCount}

Analyzed by DocBrief AI`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Summary copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    reset();
    navigate("/offer-letter-explainer");
  };

  if (!analysis) return null;

  // Not an offer letter
  if (analysis.document_type_detected === "not_offer_letter") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-accent mx-auto flex items-center justify-center mb-8">
            <AlertTriangle className="w-10 h-10 text-foreground" />
          </div>
          <h1 className="text-2xl font-serif font-semibold mb-3">
            This doesn't look like an offer letter
          </h1>
          <p className="text-muted-foreground mb-8">
            {analysis.sections?.[0]?.explanation || "The uploaded document doesn't appear to be a job offer letter."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="warm" onClick={() => navigate("/upload")}>
              Try Contract Explainer →
            </Button>
            <Button variant="soft" onClick={() => { reset(); navigate("/offer-letter-explainer"); }}>
              Upload a different file
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              DocBrief <span className="text-primary">AI</span>
            </span>
          </Link>

          <Button variant="warm" size="sm" onClick={handleCopySummary}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline ml-2">
              {copied ? "Copied!" : "Copy Summary"}
            </span>
          </Button>
        </div>
      </header>

      <main className="py-8 md:py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Back button */}
          <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Analyze Another Offer Letter
          </button>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-serif font-semibold mb-2">
              {analysis.role_title} at {analysis.company_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                AI Confidence: {analysis.confidence_score}%
              </span>
              <span>Analyzed on {new Date().toLocaleDateString()}</span>
              {fileName && <span className="truncate max-w-[200px]">({fileName})</span>}
            </div>
          </div>

          {/* Low confidence warning */}
          {analysis.confidence_score < 60 && (
            <div className="mb-6 p-4 rounded-xl bg-accent border border-border flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                <strong>Low Confidence:</strong> Our AI is less certain about this analysis (confidence: {analysis.confidence_score}%). Some sections may be inaccurate. We recommend verifying key terms directly with your employer.
              </p>
            </div>
          )}

          {/* Total Compensation Summary */}
          <div className="mb-8">
            <CompensationSummary summary={analysis.total_compensation_summary} />
          </div>

          {/* Quick Alerts Bar */}
          {(redCount > 0 || yellowCount > 0 || missingCount > 0) && (
            <div className="flex flex-wrap gap-3 mb-8">
              {redCount > 0 && (
                <a href="#risk-assessment" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:opacity-80 transition-opacity">
                  🔴 {redCount} Red Flag{redCount > 1 ? "s" : ""}
                </a>
              )}
              {yellowCount > 0 && (
                <a href="#risk-assessment" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-accent text-accent-foreground hover:opacity-80 transition-opacity">
                  🟡 {yellowCount} Caution Item{yellowCount > 1 ? "s" : ""}
                </a>
              )}
              {missingCount > 0 && (
                <a href="#missing-items" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:opacity-80 transition-opacity">
                  ⚪ {missingCount} Missing Item{missingCount > 1 ? "s" : ""}
                </a>
              )}
            </div>
          )}

          {/* Section Breakdown */}
          {analysis.sections && analysis.sections.length > 0 && (
            <div className="mb-10">
              <SectionBreakdown sections={analysis.sections} />
            </div>
          )}

          {/* Risk Assessment */}
          {(redCount > 0 || yellowCount > 0) && (
            <div id="risk-assessment" className="mb-10 scroll-mt-20">
              <h2 className="text-lg font-serif font-semibold mb-4">⚠️ Risk Assessment</h2>

              {redCount > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-destructive mb-2">Red Flags</h3>
                  <div className="space-y-2">
                    {analysis.red_flags.map((flag, i) => (
                      <details key={i} className="rounded-xl bg-destructive/5 border border-destructive/20 border-l-4 border-l-destructive overflow-hidden">
                        <summary className="p-4 cursor-pointer text-sm font-medium text-foreground">
                          {flag.section}: {flag.issue}
                        </summary>
                        <p className="px-4 pb-4 text-sm text-muted-foreground">{flag.detail}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}

              {yellowCount > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">Caution Items</h3>
                  <div className="space-y-2">
                    {analysis.caution_items.map((item, i) => (
                      <details key={i} className="rounded-xl bg-accent/50 border border-border border-l-4 border-l-accent-foreground/50 overflow-hidden">
                        <summary className="p-4 cursor-pointer text-sm font-medium text-foreground">
                          {item.section}: {item.issue}
                        </summary>
                        <p className="px-4 pb-4 text-sm text-muted-foreground">{item.detail}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Missing Items */}
          {missingCount > 0 && (
            <div id="missing-items" className="mb-10 scroll-mt-20">
              <h2 className="text-lg font-serif font-semibold mb-4">📋 Missing From Your Offer</h2>
              <div className="rounded-xl bg-muted/50 border border-border p-5 space-y-4">
                {analysis.missing_items.map((item, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-foreground">{item.section}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.why_it_matters}</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground italic pt-2 border-t border-border/50">
                  Consider asking your employer about these items before signing.
                </p>
              </div>
            </div>
          )}

          {/* Glossary */}
          {analysis.glossary && analysis.glossary.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() => setShowGlossary(!showGlossary)}
                className="flex items-center gap-2 w-full text-left"
              >
                <h2 className="text-lg font-serif font-semibold">📖 Jargon Glossary</h2>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showGlossary ? "rotate-180" : ""}`} />
              </button>

              {showGlossary && (
                <div className="mt-4 space-y-3 animate-fade-in">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={glossarySearch}
                      onChange={(e) => setGlossarySearch(e.target.value)}
                      placeholder="Search terms..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    {filteredGlossary.map((g, i) => (
                      <div key={i} className="p-3 rounded-lg bg-card border border-border/50">
                        <p className="text-sm font-medium text-foreground">{g.term}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{g.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Negotiation Tips */}
          {analysis.negotiation_tips && analysis.negotiation_tips.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() => setShowTips(!showTips)}
                className="flex items-center gap-2 w-full text-left"
              >
                <h2 className="text-lg font-serif font-semibold">💡 Negotiation Tips</h2>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showTips ? "rotate-180" : ""}`} />
              </button>

              {showTips && (
                <div className="mt-4 space-y-2 animate-fade-in">
                  {analysis.negotiation_tips.map((tip, i) => (
                    <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm text-foreground">
                      <span className="font-medium text-primary mr-1.5">{i + 1}.</span>
                      {tip}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground italic mt-3">
                    These are general suggestions based on your offer letter. Consider consulting a career advisor for personalized negotiation strategy.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Legal Disclaimer */}
          <div className="mt-10 p-4 bg-muted/50 rounded-xl border border-border/30">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              ⚖️ <strong>Disclaimer:</strong> DocBrief provides educational explanations only. This is not legal, financial, or tax advice. Always consult a qualified attorney or financial advisor before making decisions. AI analysis may contain errors — verify critical terms directly with your employer.
            </p>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <Button variant="warm" onClick={handleBack}>
              Analyze Another Offer Letter
            </Button>
          </div>
        </div>
      </main>

      {/* Q&A Chat Panel */}
      <ChatPanel />
    </div>
  );
};

export default OfferLetterResults;
