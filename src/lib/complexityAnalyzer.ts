/**
 * Task 4.2: Complexity Indicator
 * 
 * Analyzes contract text to determine complexity level.
 * Based on: length, clause density, structural complexity.
 * 
 * Returns: "Simple" | "Moderate" | "Complex"
 */

export type ComplexityLevel = "Simple" | "Moderate" | "Complex";

interface ComplexityFactors {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  complexTermsCount: number;
  sectionCount: number;
}

// Legal/complex terms that indicate complexity
const COMPLEX_TERMS = [
  "indemnify",
  "indemnification",
  "liability",
  "arbitration",
  "jurisdiction",
  "notwithstanding",
  "hereinafter",
  "whereas",
  "pursuant",
  "heretofore",
  "covenant",
  "warranty",
  "warranties",
  "representations",
  "severability",
  "confidentiality",
  "non-compete",
  "non-disclosure",
  "intellectual property",
  "force majeure",
  "liquidated damages",
  "consequential damages",
  "governing law",
  "assigns",
  "waiver",
  "amendment",
];

/**
 * Analyze text and return complexity factors
 */
function analyzeFactors(text: string): ComplexityFactors {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sections = (text.match(/\n\s*\n/g) || []).length + 1;
  
  const lowerText = text.toLowerCase();
  const complexTermsCount = COMPLEX_TERMS.reduce((count, term) => {
    const regex = new RegExp(term.toLowerCase(), 'gi');
    const matches = lowerText.match(regex);
    return count + (matches?.length || 0);
  }, 0);
  
  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
    complexTermsCount,
    sectionCount: sections,
  };
}

/**
 * Determine complexity level from factors
 */
export function analyzeComplexity(text: string): ComplexityLevel {
  if (!text || text.trim().length === 0) {
    return "Simple";
  }
  
  const factors = analyzeFactors(text);
  
  // Scoring system
  let score = 0;
  
  // Word count scoring
  if (factors.wordCount > 3000) score += 3;
  else if (factors.wordCount > 1500) score += 2;
  else if (factors.wordCount > 500) score += 1;
  
  // Sentence complexity
  if (factors.avgSentenceLength > 30) score += 2;
  else if (factors.avgSentenceLength > 20) score += 1;
  
  // Complex terms density
  const termsDensity = factors.complexTermsCount / (factors.wordCount / 100);
  if (termsDensity > 2) score += 3;
  else if (termsDensity > 1) score += 2;
  else if (termsDensity > 0.5) score += 1;
  
  // Section count
  if (factors.sectionCount > 10) score += 2;
  else if (factors.sectionCount > 5) score += 1;
  
  // Determine level from score
  if (score >= 6) return "Complex";
  if (score >= 3) return "Moderate";
  return "Simple";
}
