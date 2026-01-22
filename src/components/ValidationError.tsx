import { AlertCircle } from "lucide-react";
import { ERROR_MESSAGES, FileValidationError, TextValidationError } from "@/lib/fileValidation";

interface ValidationErrorProps {
  type: FileValidationError | TextValidationError;
}

/**
 * Displays user-friendly validation error messages
 * Uses exact copy from requirements - no technical jargon
 */
const ValidationError = ({ type }: ValidationErrorProps) => {
  if (!type) return null;
  
  const message = ERROR_MESSAGES[type];
  
  if (!message) return null;
  
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-foreground">{message.title}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{message.description}</p>
      </div>
    </div>
  );
};

export default ValidationError;
