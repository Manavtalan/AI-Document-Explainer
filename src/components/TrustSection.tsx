import { Lock, Trash2, Scale, Globe } from "lucide-react";

const trustPoints = [
  {
    icon: Lock,
    title: "We don't store your documents",
    description: "Your files are processed securely and never saved to our servers.",
  },
  {
    icon: Trash2,
    title: "Files are processed and deleted",
    description: "Documents are automatically removed after processing is complete.",
  },
  {
    icon: Scale,
    title: "This is not legal advice",
    description: "Our explanations help you understand, but consult a lawyer for legal decisions.",
  },
  {
    icon: Globe,
    title: "Used by professionals worldwide",
    description: "Trusted by individuals and businesses to simplify complex documents.",
  },
];

const TrustSection = () => {
  return (
    <section className="py-20 px-4 bg-sage/30">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-serif font-semibold text-center mb-4">
          Your documents are safe
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          We take privacy and security seriously
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {trustPoints.map((item, index) => (
            <div 
              key={index}
              className="flex gap-4 p-6 bg-background rounded-xl border border-border/50"
            >
              <div className="w-10 h-10 rounded-lg bg-sage flex-shrink-0 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
