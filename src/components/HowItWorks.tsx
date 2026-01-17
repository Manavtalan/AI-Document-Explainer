import { Upload, Brain, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "1",
    title: "Upload your contract",
    description: "Simply drag & drop or select your PDF or DOC file.",
  },
  {
    icon: Brain,
    step: "2",
    title: "We analyze and simplify it",
    description: "Your document is processed to extract key information.",
  },
  {
    icon: CheckCircle,
    step: "3",
    title: "You get a clear explanation",
    description: "Read an easy-to-understand summary of your contract.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 px-4 bg-card">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-serif font-semibold text-center mb-4">
          How it works
        </h2>
        <p className="text-muted-foreground text-center mb-16 max-w-lg mx-auto">
          Three simple steps to understand any contract
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <div 
              key={index}
              className="relative bg-background rounded-2xl p-8 border border-border/50 shadow-subtle"
            >
              {/* Step number */}
              <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                {item.step}
              </div>

              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-sage flex items-center justify-center mb-6 mt-2">
                <item.icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-serif font-semibold mb-3">
                {item.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
