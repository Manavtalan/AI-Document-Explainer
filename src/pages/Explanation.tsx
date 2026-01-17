import { useState } from "react";
import { FileText, Copy, Download, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const explanationSections = [
  {
    title: "What this contract is",
    content: "This is a Service Agreement between you (the Client) and a software development company (the Provider). It establishes terms for ongoing software development services, including building, maintaining, and updating web applications.",
  },
  {
    title: "Who is involved",
    content: "Two parties are involved: You, as the Client receiving the services, and ABC Software Solutions Inc., as the Provider delivering the development work. The contract also mentions a Project Manager who will serve as your primary point of contact.",
  },
  {
    title: "What you are agreeing to",
    content: "You agree to pay for software development services on a monthly retainer basis. The Provider will deliver development work according to agreed-upon specifications. You're also agreeing to provide timely feedback and necessary access to complete the work.",
  },
  {
    title: "Money & payments",
    content: "Monthly retainer: $5,000 due on the 1st of each month. Additional work beyond scope: $150/hour. Payment terms: Net 15 days. Late payments incur 1.5% monthly interest. All amounts in USD.",
  },
  {
    title: "Duration & termination",
    content: "Initial term: 12 months starting from the signing date. Auto-renewal: Renews annually unless either party gives 60 days written notice. Either party can terminate with 30 days written notice after the initial term.",
  },
  {
    title: "Risks & red flags",
    content: "⚠️ Non-compete clause: You cannot hire the Provider's employees for 12 months after contract ends.\n⚠️ Intellectual property: Provider retains rights to reusable code components.\n⚠️ Liability cap: Limited to fees paid in the last 3 months.",
  },
  {
    title: "What you should be careful about",
    content: "• Review the IP ownership terms carefully — you may not fully own all code.\n• The 60-day notice period for non-renewal could be easy to miss.\n• Consider negotiating the non-compete clause if you might want to hire their developers.\n• Ensure the monthly retainer covers your expected workload.",
  },
];

const Explanation = () => {
  const [copied, setCopied] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleCopy = () => {
    const text = explanationSections.map(s => `${s.title}\n${s.content}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "The explanation has been copied to your clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    setShowUpgradeModal(true);
  };

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
                {copied ? "Copied" : "Copy"}
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
            </p>
          </div>

          {/* Explanation sections */}
          <div className="space-y-6">
            {explanationSections.map((section, index) => (
              <section 
                key={index}
                className="bg-card rounded-xl p-6 border border-border/50"
              >
                <h2 className="text-lg font-serif font-semibold mb-3 text-foreground">
                  {section.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </section>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Need to analyze another contract?
            </p>
            <Link to="/upload">
              <Button variant="warm">
                Upload Another Contract
              </Button>
            </Link>
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
