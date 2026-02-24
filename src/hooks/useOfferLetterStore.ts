import { create } from 'zustand';

export interface OfferLetterSection {
  id: string;
  title: string;
  status: 'green' | 'yellow' | 'red' | 'missing';
  status_label: string;
  original_text: string;
  explanation: string;
  key_figures: string[];
  action_items: string[];
}

export interface OfferLetterAnalysis {
  document_type_detected: string;
  company_name: string;
  role_title: string;
  confidence_score: number;
  total_compensation_summary: {
    base_salary: { annual: string; monthly: string; per_paycheck: string; notes: string };
    equity: { type: string; total_grant: string; estimated_value: string; year_1_value: string; notes: string };
    signing_bonus: { amount: string; clawback: string; notes: string };
    performance_bonus: { target: string; type: string; notes: string };
    benefits_estimate: { annual_value: string; breakdown: string; notes: string };
    total_year_1: string;
    total_annual_ongoing: string;
  };
  sections: OfferLetterSection[];
  red_flags: Array<{ severity: string; section: string; issue: string; detail: string }>;
  caution_items: Array<{ severity: string; section: string; issue: string; detail: string }>;
  missing_items: Array<{ section: string; why_it_matters: string }>;
  glossary: Array<{ term: string; definition: string }>;
  negotiation_tips: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface OfferLetterState {
  file: File | null;
  fileName: string | null;
  pastedText: string | null;
  extractedText: string | null;
  analysis: OfferLetterAnalysis | null;
  error: string | null;
  isAnalyzing: boolean;
  chatMessages: ChatMessage[];
  setFile: (file: File | null) => void;
  setPastedText: (text: string | null) => void;
  setExtractedText: (text: string) => void;
  setAnalysis: (analysis: OfferLetterAnalysis) => void;
  setError: (error: string | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  reset: () => void;
}

export const useOfferLetterStore = create<OfferLetterState>((set) => ({
  file: null,
  fileName: null,
  pastedText: null,
  extractedText: null,
  analysis: null,
  error: null,
  isAnalyzing: false,
  chatMessages: [],
  setFile: (file) => set({ file, fileName: file?.name ?? null, error: null }),
  setPastedText: (pastedText) => set({ pastedText }),
  setExtractedText: (extractedText) => set({ extractedText }),
  setAnalysis: (analysis) => set({ analysis, isAnalyzing: false }),
  setError: (error) => set({ error, isAnalyzing: false }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  addChatMessage: (role, content) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, { role, content, timestamp: new Date() }],
    })),
  reset: () =>
    set({
      file: null,
      fileName: null,
      pastedText: null,
      extractedText: null,
      analysis: null,
      error: null,
      isAnalyzing: false,
      chatMessages: [],
    }),
}));
