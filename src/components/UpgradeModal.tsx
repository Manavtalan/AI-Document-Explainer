import { useState } from "react";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = "request" | "form" | "success";

/**
 * Paywall Modal - Beta Mode with Email Capture
 * 
 * Flow: Request → Email Form → Success
 * Captures intent without enabling payments.
 */
const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  const [step, setStep] = useState<ModalStep>("request");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!isOpen) return null;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleRequestAccess = () => {
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setSubmitError("");

    // Validate email
    if (!email.trim()) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("pro_access_requests")
        .insert({
          email: email.trim().toLowerCase(),
          name: name.trim() || null,
          source: "Pro Request – Beta"
        });

      if (error) {
        console.error("Pro access request error:", error);
        setSubmitError("Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Store local flag to avoid repeated prompts
      try {
        localStorage.setItem("pro_requested", "true");
        localStorage.setItem("pro_requested_date", new Date().toISOString());
      } catch {
        // Fail silently if localStorage unavailable
      }

      setStep("success");
    } catch (error) {
      console.error("Pro access request error:", error);
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state on close
    setStep("request");
    setEmail("");
    setName("");
    setEmailError("");
    setSubmitError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl p-8 max-w-md w-full shadow-calm border border-border/50 text-center">
        
        {step === "success" && (
          // Success State
          <>
            <div className="w-16 h-16 rounded-2xl bg-sage mx-auto flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-xl font-serif font-semibold mb-3">
              Thanks!
            </h2>
            
            <p className="text-muted-foreground mb-3 leading-relaxed">
              We've received your request for Pro access.
            </p>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We'll notify you as soon as Pro is available.
            </p>

            <Button 
              variant="soft" 
              className="w-full"
              onClick={handleClose}
            >
              Got it
            </Button>
          </>
        )}

        {step === "form" && (
          // Email Capture Form
          <>
            <div className="w-16 h-16 rounded-2xl bg-sage mx-auto flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-xl font-serif font-semibold mb-6">
              Get Pro Access
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  className={emailError ? "border-destructive" : ""}
                  disabled={isSubmitting}
                />
                {emailError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {emailError}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                We'll only use this to notify you about Pro access and important product updates. No spam.
              </p>

              {submitError && (
                <p className="text-sm text-destructive flex items-center gap-1 justify-center">
                  <AlertCircle className="w-3 h-3" />
                  {submitError}
                </p>
              )}

              <Button 
                type="submit"
                variant="hero" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Request Access"}
              </Button>
            </form>
            
            <button
              onClick={handleClose}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={isSubmitting}
            >
              Maybe later
            </button>
          </>
        )}

        {step === "request" && (
          // Initial Request State
          <>
            <div className="w-16 h-16 rounded-2xl bg-sage mx-auto flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-xl font-serif font-semibold mb-3">
              Upgrade to Pro
            </h2>
            
            <p className="text-muted-foreground mb-4 leading-relaxed">
              You've used your free contract explanation for today.
            </p>
            
            <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
              Pro gives you unlimited contract explanations, faster processing, and early access to new document types.
            </p>
            
            <p className="text-muted-foreground/80 mb-8 leading-relaxed text-sm italic">
              We're currently onboarding early beta users.
            </p>

            <Button 
              variant="hero" 
              className="w-full mb-3"
              onClick={handleRequestAccess}
            >
              Request Pro Access
            </Button>
            
            <button
              onClick={handleClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Maybe later
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UpgradeModal;
