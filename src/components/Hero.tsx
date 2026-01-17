import { FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-32 px-4">
      <div className="container mx-auto max-w-3xl text-center">
        {/* Document icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-sage flex items-center justify-center">
            <FileText className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold text-foreground leading-tight mb-6 animate-fade-in">
          Upload a contract.
          <br />
          Understand it clearly.
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Get a plain-English explanation of any contract in seconds. No legal jargon. No prompts needed.
        </p>

        {/* CTA */}
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Button 
            variant="hero" 
            size="xl"
            onClick={() => navigate("/upload")}
            className="mb-4"
          >
            <FileText className="w-5 h-5 mr-2" />
            Upload Contract
          </Button>

          {/* Trust micro-text */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              No signup required
            </span>
            <span className="text-border">•</span>
            <span>Your document is not stored</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
