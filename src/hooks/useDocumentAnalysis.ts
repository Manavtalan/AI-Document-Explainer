import { create } from 'zustand';

interface ExplanationSection {
  title: string;
  content: string;
}

interface DocumentState {
  file: File | null;
  fileName: string | null;
  sections: ExplanationSection[] | null;
  error: string | null;
  isAnalyzing: boolean;
  setFile: (file: File | null) => void;
  setSections: (sections: ExplanationSection[]) => void;
  setError: (error: string | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  file: null,
  fileName: null,
  sections: null,
  error: null,
  isAnalyzing: false,
  setFile: (file) => set({ file, fileName: file?.name ?? null, error: null }),
  setSections: (sections) => set({ sections, isAnalyzing: false }),
  setError: (error) => set({ error, isAnalyzing: false }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  reset: () => set({ file: null, fileName: null, sections: null, error: null, isAnalyzing: false }),
}));
