import { create } from 'zustand';

export interface ContractSection {
  id: string;
  title: string;
  status: 'green' | 'yellow' | 'red' | 'missing';
  status_label: string;
  original_text: string;
  explanation: string;
  key_figures: string[];
  action_items: string[];
}

export interface ContractAnalysis {
  document_type_detected: string;
  party_a: string;
  party_b: string;
  contract_title: string;
  confidence_score: number;
  key_terms_summary: {
    contract_value: { amount: string; notes: string };
    payment_schedule: { terms: string; notes: string };
    effective_date: { date: string; notes: string };
    termination_date: { date: string; notes: string };
    governing_law: { jurisdiction: string; notes: string };
  };
  sections: ContractSection[];
  red_flags: Array<{ severity: string; section: string; issue: string; detail: string }>;
  caution_items: Array<{ severity: string; section: string; issue: string; detail: string }>;
  missing_items: Array<{ section: string; why_it_matters: string }>;
  glossary: Array<{ term: string; definition: string }>;
  negotiation_tips: string[];
}

export interface ContractChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ContractState {
  file: File | null;
  fileName: string | null;
  extractedText: string | null;
  analysis: ContractAnalysis | null;
  error: string | null;
  isAnalyzing: boolean;
  chatMessages: ContractChatMessage[];
  setFile: (file: File | null) => void;
  setExtractedText: (text: string) => void;
  setAnalysis: (analysis: ContractAnalysis) => void;
  setError: (error: string | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  reset: () => void;
}

export const useContractStore = create<ContractState>((set) => ({
  file: null,
  fileName: null,
  extractedText: null,
  analysis: null,
  error: null,
  isAnalyzing: false,
  chatMessages: [],
  setFile: (file) => set({ file, fileName: file?.name ?? null, error: null }),
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
      extractedText: null,
      analysis: null,
      error: null,
      isAnalyzing: false,
      chatMessages: [],
    }),
}));
