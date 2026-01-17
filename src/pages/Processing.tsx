import { useEffect } from "react";
import { FileText, Loader2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const Processing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate processing time
    const timer = setTimeout(() => {
      navigate("/explanation");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

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

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-sage mx-auto flex items-center justify-center mb-8">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          
          <h1 className="text-2xl font-serif font-semibold mb-3">
            Analyzing your contract…
          </h1>
          <p className="text-muted-foreground">
            This may take up to 1 minute
          </p>
        </div>
      </main>
    </div>
  );
};

export default Processing;
