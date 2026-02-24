import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ToolsSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-2xl">
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-center mb-4">
          Document Explainer
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          Upload any contract, offer letter, or agreement. Get a clear, plain-English breakdown in seconds.
        </p>

        <div className="rounded-2xl border border-primary/30 bg-card p-8 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-14 h-14 rounded-xl bg-sage flex items-center justify-center mb-6">
            <FileText className="w-7 h-7 text-primary" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-serif font-semibold mb-2">Analyze Any Document</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md">
            Upload a contract or offer letter and get a detailed breakdown — key terms, obligations, risks, missing clauses, and a jargon glossary. All in plain English.
          </p>
          <Button
            variant="hero"
            onClick={() => navigate("/upload")}
            className="w-full max-w-xs"
          >
            Upload Document
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
