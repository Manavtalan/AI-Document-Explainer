import { create } from 'zustand';

export interface LeaseSection {
  id: string;
  title: string;
  status: 'green' | 'yellow' | 'red' | 'missing';
  status_label: string;
  original_text: string;
  explanation: string;
  key_figures: string[];
  action_items: string[];
  tenant_tip?: string;
}

export interface LeaseAnalysis {
  document_type_detected: string;
  landlord_name: string;
  property_address: string;
  lease_type: string;
  confidence_score: number;

  financial_summary: {
    monthly_rent: { amount: string; due_date: string; payment_methods: string; notes: string };
    security_deposit: { amount: string; refund_conditions: string; max_legal_limit_note: string; notes: string };
    additional_deposits: { pet_deposit: string; key_deposit: string; other: string; notes: string };
    move_in_costs: { first_month: string; last_month: string; security_deposit: string; other_fees: string; total_move_in: string; notes: string };
    late_fees: { grace_period: string; late_fee_amount: string; compounding: string; notes: string };
    total_lease_cost: { lease_term: string; total_rent: string; total_deposits: string; total_fees: string; grand_total_commitment: string; notes: string };
    rent_increases: { allowed: string; terms: string; notes: string };
  };

  sections: LeaseSection[];
  red_flags: Array<{ severity: string; section: string; issue: string; detail: string }>;
  caution_items: Array<{ severity: string; section: string; issue: string; detail: string }>;
  missing_items: Array<{ section: string; why_it_matters: string }>;
  potentially_illegal_clauses: Array<{ section: string; clause: string; concern: string; recommendation: string }>;
  tenant_rights_notes: string[];
  glossary: Array<{ term: string; definition: string }>;
  negotiation_tips: string[];
  move_in_checklist: string[];
}

export interface LeaseChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface LeaseState {
  file: File | null;
  fileName: string | null;
  extractedText: string | null;
  analysis: LeaseAnalysis | null;
  error: string | null;
  isAnalyzing: boolean;
  chatMessages: LeaseChatMessage[];
  setFile: (file: File | null) => void;
  setExtractedText: (text: string) => void;
  setAnalysis: (analysis: LeaseAnalysis) => void;
  setError: (error: string | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  reset: () => void;
}

export const useLeaseStore = create<LeaseState>((set) => ({
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
