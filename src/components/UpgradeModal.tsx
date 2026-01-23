import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Paywall Modal - Task 5.2
 * 
 * Calm, respectful upgrade prompt when free limit is reached.
 * No scarcity, no guilt, no urgency.
 */
const UpgradeModal = ({ isOpen, onClose }: UpgradeModalProps) => {
  if (!isOpen) return null;

  const handleUpgrade = () => {
    // TODO: Integrate with payment provider
    // For now, just close the modal
    console.log('Upgrade clicked - payment integration pending');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl p-8 max-w-md w-full shadow-calm border border-border/50 text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-sage mx-auto flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-serif font-semibold mb-3">
          Upgrade to continue
        </h2>
        
        {/* Body Text */}
        <p className="text-muted-foreground mb-6 leading-relaxed">
          You've used your free contract explanation for today.
        </p>
        <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
          Upgrade to Pro to get unlimited contract explanations, faster processing, and priority access to new document types.
        </p>

        {/* Primary CTA */}
        <Button 
          variant="hero" 
          className="w-full mb-3"
          onClick={handleUpgrade}
        >
          Upgrade to Pro
        </Button>
        
        {/* Secondary option */}
        <button
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};

export default UpgradeModal;
