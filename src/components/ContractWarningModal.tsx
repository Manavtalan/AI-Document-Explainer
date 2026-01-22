import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ERROR_MESSAGES } from "@/lib/fileValidation";

interface ContractWarningModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

/**
 * Warning modal for documents that may not be contracts
 * Gives user choice to continue or upload another file
 */
const ContractWarningModal = ({
  isOpen,
  onContinue,
  onCancel,
}: ContractWarningModalProps) => {
  if (!isOpen) return null;
  
  const message = ERROR_MESSAGES.not_contract_like;
  
  return (
    <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl p-8 max-w-md w-full shadow-calm border border-border/50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-yellow-100 mx-auto flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-yellow-600" />
        </div>
        
        <h2 className="text-xl font-serif font-semibold mb-2">
          {message.title}
        </h2>
        <p className="text-muted-foreground mb-6">
          {message.description}
        </p>

        <div className="space-y-3">
          <Button 
            variant="hero" 
            className="w-full"
            onClick={onContinue}
          >
            Continue anyway
          </Button>
          <Button 
            variant="warm" 
            className="w-full"
            onClick={onCancel}
          >
            Upload another file
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContractWarningModal;
