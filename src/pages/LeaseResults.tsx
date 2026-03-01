import { useState, useEffect, useMemo } from "react";
import { FileText, Copy, Check, ArrowLeft, AlertTriangle, ChevronDown, Search, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useLeaseStore } from "@/hooks/useLeaseStore";
import FinancialSummary from "@/components/lease/FinancialSummary";
import LeaseSectionBreakdown from "@/components/lease/LeaseSectionBreakdown";
import LeaseChatPanel from "@/components/lease/LeaseChatPanel";
import MoveInChecklist from "@/components/lease/MoveInChecklist";

const LeaseResults = () => {
  const navigate = useNavigate();
  const { analysis, fileName, reset } = useLeaseStore();
  const [copied, setCopied] = useState(false);
  const [glossarySearch, setGlossarySearch] = useState("");
  const [showGlossary, setShowGlossary] = useState(false);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    if (!analysis) navigate("/upload");
  }, [analysis, navigate]);

  const redCount = analysis?.red_flags?.length || 0;
  const yellowCount = analysis?.caution_items?.length || 0;
  const missingCount = analysis?.missing_items?.length || 0;
  const illegalCount = analysis?.potentially_illegal_clauses?.length || 0;

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
    const fs = analysis.financial_summary;
    const text = `Lease Analysis — ${analysis.property_address}
Landlord: ${analysis.landlord_name} | Type: ${analysis.lease_type} | Term: ${fs.total_lease_cost?.lease_term || "N/A"}
Monthly Rent: ${fs.monthly_rent?.amount || "N/A"}
Security Deposit: ${fs.security_deposit?.amount || "N/A"}
Total Move-In: ${fs.move_in_costs?.total_move_in || "N/A"}
Grand Total Commitment: ${fs.total_lease_cost?.grand_total_commitment || "N/A"}
Red Flags: ${redCount} | Cautions: ${yellowCount} | Missing: ${missingCount} | Illegal Clauses: ${illegalCount}
Analyzed by DocBrief AI`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Financial summary copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    reset();
    navigate("/upload");
  };

  if (!analysis) return null;

  // Not a lease
  if (analysis.document_type_detected === "not_a_lease") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-accent mx-auto flex items-center justify-center mb-8">
            <AlertTriangle className="w-10 h-10 text-foreground" />
          </div>
          <h1 className="text-2xl font-serif font-semibold mb-3">This doesn't look like a lease agreement</h1>
          <p className="text-muted-foreground mb-8">
            Our AI detected this may be a different type of document. Try one of these tools instead:
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="warm" onClick={() => { reset(); navigate("/upload"); }}>Contract Explainer</Button>
            <Button variant="soft" onClick={() => { reset(); navigate("/upload"); }}>Offer Letter Explainer</Button>
            <Button variant="outline" onClick={() => { reset(); navigate("/upload"); }}>Upload a different file</Button>
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
            <span className="hidden sm:inline ml-2">{copied ? "Copied!" : "Copy Summary"}</span>
          </Button>
        </div>
      </header>

      <main className="py-8 md:py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Analyze Another Lease
          </button>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-serif font-semibold mb-2 flex items-center gap-2">
              <Home className="w-7 h-7 text-teal-600" />
              Lease Analysis: {analysis.property_address || "Your Lease"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs font-medium">
                AI Confidence: {analysis.confidence_score}%
              </span>
              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                {analysis.lease_type}
              </span>
              <span>Landlord: {analysis.landlord_name}</span>
              <span>Analyzed on {new Date().toLocaleDateString()}</span>
              {fileName && <span className="truncate max-w-[200px]">({fileName})</span>}
            </div>
          </div>

          {/* Low confidence */}
          {analysis.confidence_score < 60 && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                <strong>Low Confidence Analysis (Score: {analysis.confidence_score}%)</strong> — Our AI is less certain about this analysis. The lease may have unusual formatting or non-standard terms. Verify key terms directly with your landlord.
              </p>
            </div>
          )}

          {/* Commercial lease banner */}
          {analysis.document_type_detected === "commercial_lease" && (
            <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                This appears to be a <strong>commercial lease</strong>. DocBrief is optimized for residential leases — some sections may not apply.
              </p>
            </div>
          )}

          {/* Financial Summary */}
          <div className="mb-8">
            <FinancialSummary
              summary={analysis.financial_summary}
              landlordName={analysis.landlord_name}
              propertyAddress={analysis.property_address}
              leaseType={analysis.lease_type}
            />
          </div>

          {/* Quick Alerts */}
          {(redCount > 0 || yellowCount > 0 || missingCount > 0 || illegalCount > 0) && (
            <div className="flex flex-wrap gap-3 mb-8">
              {redCount > 0 && (
                <a href="#red-flags" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-destructive/10 text-destructive hover:opacity-80 transition-opacity">
                  🔴 {redCount} Red Flag{redCount > 1 ? "s" : ""}
                </a>
              )}
              {illegalCount > 0 && (
                <a href="#illegal-clauses" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-red-900/10 text-red-900 dark:text-red-300 hover:opacity-80 transition-opacity">
                  ⛔ {illegalCount} Potentially Illegal
                </a>
              )}
              {yellowCount > 0 && (
                <a href="#caution-items" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-accent text-accent-foreground hover:opacity-80 transition-opacity">
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
              <LeaseSectionBreakdown sections={analysis.sections} />
            </div>
          )}

          {/* Red Flags */}
          {redCount > 0 && (
            <div id="red-flags" className="mb-8 scroll-mt-20">
              <h2 className="text-lg font-serif font-semibold mb-4">🔴 Red Flags</h2>
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

          {/* Potentially Illegal Clauses */}
          {illegalCount > 0 && (
            <div id="illegal-clauses" className="mb-8 scroll-mt-20">
              <h2 className="text-lg font-serif font-semibold mb-4">⛔ Potentially Illegal or Unenforceable Clauses</h2>
              <div className="space-y-2">
                {analysis.potentially_illegal_clauses.map((item, i) => (
                  <div key={i} className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 border-l-4 border-l-red-900 dark:border-l-red-400 p-4">
                    <p className="text-sm font-medium text-foreground mb-1">{item.section}: {item.clause}</p>
                    <p className="text-sm text-muted-foreground mb-1"><strong>Concern:</strong> {item.concern}</p>
                    <p className="text-sm text-teal-700 dark:text-teal-400"><strong>Recommended Action:</strong> {item.recommendation}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic mt-3">
                Legality varies by jurisdiction. Check your local laws or contact a tenant rights organization.
              </p>
            </div>
          )}

          {/* Caution Items */}
          {yellowCount > 0 && (
            <div id="caution-items" className="mb-8 scroll-mt-20">
              <h2 className="text-lg font-serif font-semibold mb-4">🟡 Caution Items</h2>
              <div className="space-y-2">
                {analysis.caution_items.map((item, i) => (
                  <details key={i} className="rounded-xl bg-accent/50 border border-border border-l-4 border-l-amber-500 overflow-hidden">
                    <summary className="p-4 cursor-pointer text-sm font-medium text-foreground">
                      {item.section}: {item.issue}
                    </summary>
                    <p className="px-4 pb-4 text-sm text-muted-foreground">{item.detail}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Missing Items */}
          {missingCount > 0 && (
            <div id="missing-items" className="mb-8 scroll-mt-20">
              <h2 className="text-lg font-serif font-semibold mb-4">📋 Missing From Your Lease</h2>
              <div className="rounded-xl bg-muted/50 border border-border p-5 space-y-4">
                {analysis.missing_items.map((item, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-foreground">{item.section}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.why_it_matters}</p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground italic pt-2 border-t border-border/50">
                  Ask your landlord to add these items in writing before signing.
                </p>
              </div>
            </div>
          )}

          {/* Tenant Rights */}
          {analysis.tenant_rights_notes && analysis.tenant_rights_notes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-serif font-semibold mb-4">🛡️ Know Your Tenant Rights</h2>
              <div className="rounded-xl bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 border-l-4 border-l-teal-500 p-5 space-y-3">
                {analysis.tenant_rights_notes.map((right, i) => (
                  <p key={i} className="text-sm text-foreground">
                    <span className="font-medium text-teal-700 dark:text-teal-400 mr-1.5">{i + 1}.</span>
                    {right}
                  </p>
                ))}
                <p className="text-xs text-muted-foreground italic pt-2 border-t border-teal-200/50 dark:border-teal-800/50">
                  These are general rights in most US states. Check local laws for jurisdiction-specific rights.
                </p>
              </div>
            </div>
          )}

          {/* Move-In Checklist */}
          {analysis.move_in_checklist && analysis.move_in_checklist.length > 0 && (
            <div className="mb-8">
              <MoveInChecklist items={analysis.move_in_checklist} propertyAddress={analysis.property_address} />
            </div>
          )}

          {/* Glossary */}
          {analysis.glossary && analysis.glossary.length > 0 && (
            <div className="mb-8">
              <button onClick={() => setShowGlossary(!showGlossary)} className="flex items-center gap-2 w-full text-left">
                <h2 className="text-lg font-serif font-semibold">📖 Lease Jargon Glossary</h2>
                <span className="text-xs text-muted-foreground">({analysis.glossary.length} terms)</span>
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
              <button onClick={() => setShowTips(!showTips)} className="flex items-center gap-2 w-full text-left">
                <h2 className="text-lg font-serif font-semibold">💡 Negotiation Tips</h2>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showTips ? "rotate-180" : ""}`} />
              </button>
              {showTips && (
                <div className="mt-4 space-y-2 animate-fade-in">
                  {analysis.negotiation_tips.map((tip, i) => (
                    <div key={i} className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/10 text-sm text-foreground">
                      <span className="font-medium text-teal-700 dark:text-teal-400 mr-1.5">{i + 1}.</span>
                      {tip}
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground italic mt-3">
                    These are general suggestions based on your lease. Consider consulting a tenant rights organization for personalized advice.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Legal Disclaimer */}
          <div className="mt-10 p-4 bg-muted/50 rounded-xl border border-border/30">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              ⚖️ <strong>Disclaimer:</strong> DocBrief provides educational explanations only. This is not legal advice. Lease laws vary significantly by state, city, and country. Always consult a qualified attorney or tenant rights organization. AI analysis may contain errors — verify critical terms with your landlord.
            </p>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <Button variant="warm" onClick={handleBack}>
              Analyze Another Lease
            </Button>
          </div>
        </div>
      </main>

      <LeaseChatPanel />
    </div>
  );
};

export default LeaseResults;
