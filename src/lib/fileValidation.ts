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

export type FileValidationError = 
  | 'unsupported_type'
  | 'file_too_large'
  | 'cannot_read'
  | null;

export type TextValidationError =
  | 'insufficient_text'
  | 'non_english'
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
 * Simple English language detection
 * Uses common English words frequency check
 */
export function isEnglish(text: string): boolean {
  const lowerText = text.toLowerCase();
  
  // Common English words that should appear in any English document
  const commonEnglishWords = [
    'the', 'and', 'is', 'in', 'to', 'of', 'a', 'for', 'with', 'that',
    'this', 'be', 'are', 'or', 'an', 'will', 'as', 'by', 'not', 'from',
    'have', 'has', 'been', 'may', 'any', 'all', 'such', 'shall', 'under',
  ];
  
  // Count how many common English words appear
  let englishWordCount = 0;
  const words = lowerText.split(/\s+/);
  const totalWords = words.length;
  
  for (const word of words) {
    if (commonEnglishWords.includes(word)) {
      englishWordCount++;
    }
  }
  
  // If at least 10% of words are common English words, consider it English
  // This is a simple heuristic that works well for contracts
  const englishRatio = totalWords > 0 ? englishWordCount / totalWords : 0;
  
  return englishRatio >= 0.08; // 8% threshold
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
} {
  const characterCount = text.trim().length;
  const keywordCount = getContractKeywordCount(text);
  
  // Check 1: Text length (HARD STOP)
  if (!validateTextLength(text)) {
    return {
      error: 'insufficient_text',
      warning: null,
      characterCount,
      keywordCount,
    };
  }
  
  // Check 2: Language (HARD STOP)
  if (!isEnglish(text)) {
    return {
      error: 'non_english',
      warning: null,
      characterCount,
      keywordCount,
    };
  }
  
  // Check 3: Contract-like heuristic (WARNING, not error)
  const warning: TextValidationWarning = !isContractLike(text) ? 'not_contract_like' : null;
  
  return {
    error: null,
    warning,
    characterCount,
    keywordCount,
  };
}
