import { useState } from "react";
import { Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Paywall Modal - Beta Mode
 * 
 * Calm, honest upgrade prompt for private beta.
 * No payments yet - captures intent only.
 */
const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  const [hasRequested, setHasRequested] = useState(false);

  if (!isOpen) return null;

  const handleRequestAccess = () => {
    // Store intent locally for beta tracking
    try {
      localStorage.setItem('pro_interest_requested', 'true');
      localStorage.setItem('pro_interest_requested_date', new Date().toISOString());
    } catch {
      // Fail silently if localStorage unavailable
    }
    setHasRequested(true);
  };

  const handleClose = () => {
    setHasRequested(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl p-8 max-w-md w-full shadow-calm border border-border/50 text-center">
        
        {hasRequested ? (
          // Confirmation State
          <>
            <div className="w-16 h-16 rounded-2xl bg-sage mx-auto flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-xl font-serif font-semibold mb-3">
              You're on the list
            </h2>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Thanks! Pro access is rolling out to beta users.
              We'll notify you as soon as it's available.
            </p>

            <Button 
              variant="soft" 
              className="w-full"
              onClick={handleClose}
            >
              Got it
            </Button>
          </>
        ) : (
          // Request State
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
              Payments will be enabled soon.
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
