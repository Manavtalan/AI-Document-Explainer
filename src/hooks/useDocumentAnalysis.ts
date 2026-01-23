import { create } from 'zustand';

// Fixed 7-key structure from Phase 3
export interface ContractExplanation {
  what_is_this: string;
  who_is_involved: string;
  agreements: string;
  payments: string;
  duration: string;
  risks: string;
  be_careful: string;
}

// Display labels for each section (frontend rendering only)
export const SECTION_LABELS: Record<keyof ContractExplanation, string> = {
  what_is_this: "What this contract is",
  who_is_involved: "Who is involved",
  agreements: "What you are agreeing to",
  payments: "Money & payments",
  duration: "Duration & termination",
  risks: "Risks & red flags",
  be_careful: "What you should be careful about",
};

// Order of sections for display
export const SECTION_ORDER: (keyof ContractExplanation)[] = [
  "what_is_this",
  "who_is_involved",
  "agreements",
  "payments",
  "duration",
  "risks",
  "be_careful",
];

interface DocumentState {
  file: File | null;
  fileName: string | null;
  extractedText: string | null;
  explanation: ContractExplanation | null;
  error: string | null;
  isAnalyzing: boolean;
  setFile: (file: File | null) => void;
  setExtractedText: (text: string) => void;
  setExplanation: (explanation: ContractExplanation) => void;
  setError: (error: string | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  file: null,
  fileName: null,
  extractedText: null,
  explanation: null,
  error: null,
  isAnalyzing: false,
  setFile: (file) => set({ file, fileName: file?.name ?? null, error: null }),
  setExtractedText: (extractedText) => set({ extractedText }),
  setExplanation: (explanation) => set({ explanation, isAnalyzing: false }),
  setError: (error) => set({ error, isAnalyzing: false }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  reset: () => set({ file: null, fileName: null, extractedText: null, explanation: null, error: null, isAnalyzing: false }),
}));
