import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import ValueSection from "@/components/ValueSection";
import TrustSection from "@/components/TrustSection";
import ToolsSection from "@/components/ToolsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ToolsSection />
        <HowItWorks />
        <ValueSection />
        <TrustSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
