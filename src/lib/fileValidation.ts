// File validation utilities - BULLETPROOF UPLOAD

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const MIN_TEXT_LENGTH = 300;

// Contract-like keywords (case-insensitive)
export const CONTRACT_KEYWORDS = [
  'agreement',
  'party',
  'parties',
  'terms',
  'payment',
  'termination',
  'obligations',
  'whereas',
  'hereby',
  'shall',
  'covenant',
  'indemnify',
  'liability',
  'confidential',
  'effective date',
] as const;

export const MIN_CONTRACT_KEYWORDS = 2;

// Thresholds for readability check
export const MIN_READABLE_RATIO = 0.85; // 85% of chars should be printable ASCII or common unicode
export const MAX_BINARY_RATIO = 0.05; // Max 5% binary/control characters

export type FileValidationError = 
  | 'unsupported_type'
  | 'file_too_large'
  | 'cannot_read'
  | null;

export type TextValidationError =
  | 'insufficient_text'
  | 'non_english'
  | 'unreadable_text'
  | null;

export type TextValidationWarning =
  | 'not_contract_like'
  | null;

export const ERROR_MESSAGES = {
  unsupported_type: {
    title: 'Unsupported file type.',
    description: 'Please upload a PDF or Word document (.doc or .docx).',
  },
  file_too_large: {
    title: 'File too large.',
    description: 'Please upload a document smaller than 10MB.',
  },
  cannot_read: {
    title: 'We could not read this file.',
    description: 'Please upload a clear, uncorrupted document.',
  },
  insufficient_text: {
    title: 'This file does not appear to contain readable contract text.',
    description: 'Please upload a different document.',
  },
  non_english: {
    title: 'Currently, we support English contracts only.',
    description: 'Please upload an English-language document.',
  },
  unreadable_text: {
    title: 'We could not extract readable text from this document.',
    description: 'Please upload a clearer file.',
  },
  not_contract_like: {
    title: 'This document may not be a contract.',
    description: 'Are you sure you want to continue?',
  },
} as const;

/**
 * Validate file type and size before upload
 */
export function validateFile(file: File): FileValidationError {
  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  // Check MIME type
  const hasValidMimeType = ALLOWED_MIME_TYPES.includes(file.type as any);
  
  // Must have valid extension OR valid MIME type (some systems don't set MIME correctly)
  if (!hasValidExtension && !hasValidMimeType) {
    return 'unsupported_type';
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'file_too_large';
  }
  
  return null;
}

/**
 * Check if text has minimum required length
 */
export function validateTextLength(text: string): boolean {
  return text.trim().length >= MIN_TEXT_LENGTH;
}

/**
 * Check if extracted text is readable (not binary, garbage, or control characters)
 * Returns true if text appears to be human-readable
 */
export function isReadableText(text: string): boolean {
  if (!text || text.length === 0) return false;
  
  let printableCount = 0;
  let binaryCount = 0;
  
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    
    // Printable ASCII (space to tilde) + common unicode ranges
    // Also allow newlines, tabs, and common punctuation
    if (
      (code >= 32 && code <= 126) ||  // Basic ASCII printable
      (code >= 160 && code <= 255) || // Latin-1 Supplement
      (code >= 8192 && code <= 8303) || // General Punctuation
      code === 9 ||   // Tab
      code === 10 ||  // Newline
      code === 13 ||  // Carriage return
      (code >= 8208 && code <= 8231) // Dashes and spaces
    ) {
      printableCount++;
    } else if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      // Control characters (excluding tab, newline, CR)
      binaryCount++;
    }
  }
  
  const printableRatio = printableCount / text.length;
  const binaryRatio = binaryCount / text.length;
  
  // Text is readable if it has high printable ratio and low binary ratio
  return printableRatio >= MIN_READABLE_RATIO && binaryRatio <= MAX_BINARY_RATIO;
}

/**
 * Simple English language detection
 * Uses common English words frequency check
 */
export function isEnglish(text: string): boolean {
  // PDFs/DOCX extraction often includes punctuation, smart quotes, and odd whitespace.
  // Normalize to improve reliability of this heuristic.
  const lowerText = text.toLowerCase();
  // Keep letters/spaces only to avoid missing matches like "the," or "and."
  const normalized = lowerText
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  // Common English words that should appear in any English document
  const commonEnglishWords = [
    'the', 'and', 'is', 'in', 'to', 'of', 'a', 'for', 'with', 'that',
    'this', 'be', 'are', 'or', 'an', 'will', 'as', 'by', 'not', 'from',
    'have', 'has', 'been', 'may', 'any', 'all', 'such', 'shall', 'under',
  ];
  
  // Count how many common English words appear
  let englishWordCount = 0;
  const words = normalized.split(" ").filter(Boolean);
  const totalWords = words.length;
  
  for (const word of words) {
    if (commonEnglishWords.includes(word)) {
      englishWordCount++;
    }
  }
  
  // If enough words are common English words, consider it English.
  // NOTE: Offer letters can be heavy on names/dates, so we use a tolerant threshold.
  const englishRatio = totalWords > 0 ? englishWordCount / totalWords : 0;

  // Also require a minimum amount of tokenized words so tiny/garbled outputs don't pass.
  if (totalWords < 40) return false;

  return englishRatio >= 0.04; // 4% threshold
}

/**
 * Check if document appears to be contract-like
 * Returns the count of contract keywords found
 */
export function getContractKeywordCount(text: string): number {
  const lowerText = text.toLowerCase();
  
  let count = 0;
  for (const keyword of CONTRACT_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      count++;
    }
  }
  
  return count;
}

/**
 * Check if document has enough contract-like keywords
 */
export function isContractLike(text: string): boolean {
  return getContractKeywordCount(text) >= MIN_CONTRACT_KEYWORDS;
}

/**
 * Run all text validation checks
 */
export function validateExtractedText(text: string): {
  error: TextValidationError;
  warning: TextValidationWarning;
  characterCount: number;
  keywordCount: number;
  isReadable: boolean;
} {
  const characterCount = text.trim().length;
  const keywordCount = getContractKeywordCount(text);
  const readable = isReadableText(text);
  
  // Check 1: Text length (HARD STOP)
  if (!validateTextLength(text)) {
    return {
      error: 'insufficient_text',
      warning: null,
      characterCount,
      keywordCount,
      isReadable: readable,
    };
  }
  
  // Check 2: Text is readable - not binary/junk (HARD STOP)
  if (!readable) {
    return {
      error: 'unreadable_text',
      warning: null,
      characterCount,
      keywordCount,
      isReadable: false,
    };
  }
  
  // Check 3: Language (HARD STOP)
  if (!isEnglish(text)) {
    return {
      error: 'non_english',
      warning: null,
      characterCount,
      keywordCount,
      isReadable: readable,
    };
  }
  
  // Check 4: Contract-like heuristic (WARNING, not error)
  const warning: TextValidationWarning = !isContractLike(text) ? 'not_contract_like' : null;
  
  return {
    error: null,
    warning,
    characterCount,
    keywordCount,
    isReadable: readable,
  };
}
