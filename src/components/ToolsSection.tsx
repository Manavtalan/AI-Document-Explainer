import { FileText, Briefcase, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ToolsSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-serif font-semibold text-center mb-4">
          Choose Your Tool
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          DocBrief AI helps you understand important documents — no legal expertise needed.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Contract Explainer Card */}
          <div className="rounded-2xl border border-border/50 bg-card p-8 flex flex-col hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-xl bg-sage flex items-center justify-center mb-6">
              <FileText className="w-7 h-7 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Contract Explainer</h3>
            <p className="text-muted-foreground text-sm mb-6 flex-1">
              Upload any contract and get a clear, plain-English breakdown of key terms, obligations, payments, and risks.
            </p>
            <Button
              variant="warm"
              onClick={() => navigate("/upload")}
              className="w-full"
            >
              Analyze a Contract
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Offer Letter Explainer Card */}
          <div className="rounded-2xl border border-primary/30 bg-card p-8 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="w-14 h-14 rounded-xl bg-sage flex items-center justify-center mb-6">
              <Briefcase className="w-7 h-7 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Offer Letter Explainer</h3>
            <p className="text-muted-foreground text-sm mb-6 flex-1">
              Decode compensation, equity, vesting, non-competes, benefits, and clawback provisions — in plain English.
            </p>
            <Button
              variant="hero"
              onClick={() => navigate("/upload")}
              className="w-full"
            >
              Analyze an Offer Letter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Lease Agreement Explainer Card */}
          <div className="rounded-2xl border border-teal-500/30 bg-card p-8 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-600 text-white">
                NEW
              </span>
            </div>
            <div className="w-14 h-14 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-6">
              <Home className="w-7 h-7 text-teal-600 dark:text-teal-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Lease Agreement Explainer</h3>
            <p className="text-muted-foreground text-sm mb-6 flex-1">
              Understand your rental agreement in plain English — rental terms, penalties, maintenance responsibilities, security deposits, and your tenant rights explained clearly.
            </p>
            <Button
              onClick={() => navigate("/upload")}
              className="w-full bg-teal-600 text-white hover:bg-teal-700"
            >
              Analyze a Lease
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToolsSection;
