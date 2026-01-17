import { Check } from "lucide-react";

const valuePoints = [
  "What this contract is about",
  "Who is involved",
  "Payment terms",
  "Duration & termination",
  "Risks & red flags",
  "What to be careful about",
];

const ValueSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-serif font-semibold text-center mb-4">
          What you'll understand
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          Get clear answers to the most important questions about your contract
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {valuePoints.map((point, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-5 bg-card rounded-xl border border-border/50"
            >
              <div className="w-6 h-6 rounded-full bg-sage flex-shrink-0 flex items-center justify-center">
                <Check className="w-4 h-4 text-primary" strokeWidth={2} />
              </div>
              <span className="text-foreground font-medium">{point}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueSection;
