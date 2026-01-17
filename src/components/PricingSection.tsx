import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "",
    features: [
      "1 contract explanation",
      "View explanation on screen",
      "No signup required",
    ],
    cta: "Get Started",
    variant: "warm" as const,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    features: [
      "Unlimited contract explanations",
      "Download explanation as PDF",
      "Priority processing",
    ],
    cta: "Upgrade to Pro",
    variant: "hero" as const,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-serif font-semibold text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          Start for free, upgrade when you need more
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className="bg-card rounded-2xl p-8 border border-border/50 shadow-subtle flex flex-col"
            >
              <h3 className="text-xl font-serif font-semibold mb-2">
                {plan.name}
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-serif font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-sage flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" strokeWidth={2.5} />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button variant={plan.variant} className="w-full">
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
