import { FileText, Shield, Zap, Eye } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Mission */}
          <section className="text-center mb-20">
            <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-6">
              Making contracts<br />understandable for everyone
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              DocBrief AI turns complex legal documents into clear, plain-language explanations — so you can sign with confidence.
            </p>
          </section>

          {/* What we do */}
          <section className="mb-20">
            <h2 className="text-2xl font-serif font-semibold mb-8 text-center">
              What we do
            </h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Eye,
                  title: "Analyze",
                  description: "Upload any contract and our AI reads every clause carefully.",
                },
                {
                  icon: Zap,
                  title: "Simplify",
                  description: "Complex legal language is translated into plain, everyday English.",
                },
                {
                  icon: Shield,
                  title: "Protect",
                  description: "Key risks and important terms are highlighted so nothing is missed.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl p-6 border border-border/50 text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-sage mx-auto flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-serif font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Our vision */}
          <section className="text-center bg-card rounded-2xl p-10 border border-border/50">
            <div className="w-14 h-14 rounded-xl bg-primary mx-auto flex items-center justify-center mb-6">
              <FileText className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-serif font-semibold mb-4">
              Our vision
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
              We believe no one should sign a document they don't fully understand. 
              DocBrief AI is built to bridge the gap between legal complexity and everyday clarity — 
              empowering individuals and small businesses to make informed decisions.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
