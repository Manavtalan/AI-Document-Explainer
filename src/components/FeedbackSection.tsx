import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type FeedbackStep = "prompt" | "followup" | "thanks";
type Helpfulness = "helpful" | "not_helpful";

interface FeedbackSectionProps {
  sessionId?: string;
}

/**
 * Lightweight feedback collection component
 * - Appears at bottom of Explanation page
 * - Two-step: initial response → optional text
 * - Anonymous, no auth required
 * - Fails silently
 */
const FeedbackSection = ({ sessionId }: FeedbackSectionProps) => {
  const [step, setStep] = useState<FeedbackStep>("prompt");
  const [helpfulness, setHelpfulness] = useState<Helpfulness | null>(null);
  const [textFeedback, setTextFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if already submitted this session
  const hasSubmitted = sessionStorage.getItem("feedback_submitted") === "true";

  if (hasSubmitted && step === "prompt") {
    return null; // Don't re-prompt in same session
  }

  const handleResponse = async (response: Helpfulness) => {
    setHelpfulness(response);
    setStep("followup");
  };

  const submitFeedback = async (skipText = false) => {
    if (!helpfulness) return;
    
    setIsSubmitting(true);
    
    try {
      await supabase.from("document_feedback").insert({
        helpfulness,
        text_feedback: skipText ? null : textFeedback.trim() || null,
        session_id: sessionId || null,
        version: "V1",
      });
    } catch {
      // Fail silently
    }
    
    sessionStorage.setItem("feedback_submitted", "true");
    setStep("thanks");
    setIsSubmitting(false);
  };

  const handleTextSubmit = () => {
    submitFeedback(false);
  };

  const handleSkip = () => {
    submitFeedback(true);
  };

  // Already shown thanks
  if (step === "thanks") {
    return (
      <div className="mt-8 py-6 text-center">
        <p className="text-sm text-muted-foreground">Thanks for the feedback.</p>
      </div>
    );
  }

  // Step 2: Optional text follow-up
  if (step === "followup") {
    const promptText = helpfulness === "helpful"
      ? "What part was most helpful? (optional)"
      : "What was unclear or missing? (optional)";
    
    const placeholderText = helpfulness === "helpful"
      ? "You can share a quick thought…"
      : "Tell us what didn't work…";

    return (
      <div className="mt-8 py-6 border-t border-border/30">
        <p className="text-sm text-muted-foreground mb-3">{promptText}</p>
        <textarea
          value={textFeedback}
          onChange={(e) => setTextFeedback(e.target.value)}
          placeholder={placeholderText}
          className="w-full px-4 py-3 text-sm rounded-lg border border-border/50 bg-background 
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50
                     resize-none transition-colors"
          rows={3}
        />
        <div className="mt-3 flex gap-3 justify-end">
          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleTextSubmit}
            disabled={isSubmitting}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {isSubmitting ? "Sending…" : "Submit"}
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Initial prompt
  return (
    <div className="mt-8 py-6 border-t border-border/30">
      <p className="text-sm text-muted-foreground text-center mb-4">
        Did this explanation help you understand the contract?
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleResponse("helpful")}
          className="px-4 py-2 text-sm rounded-lg border border-border/50 bg-background
                     hover:bg-muted/50 hover:border-primary/30 transition-colors"
        >
          ✅ Yes, it helped
        </button>
        <button
          onClick={() => handleResponse("not_helpful")}
          className="px-4 py-2 text-sm rounded-lg border border-border/50 bg-background
                     hover:bg-muted/50 hover:border-border transition-colors"
        >
          ❌ Not really
        </button>
      </div>
    </div>
  );
};

export default FeedbackSection;
