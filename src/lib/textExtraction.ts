import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract text from a PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const textParts: string[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    textParts.push(pageText);
  }
  
  return textParts.join('\n\n');
}

/**
 * Extract text from a DOCX file using mammoth
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

/**
 * Extract text from a file based on its type
 */
export async function extractText(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  }
  
  if (fileName.endsWith('.docx')) {
    return extractTextFromDOCX(file);
  }
  
  if (fileName.endsWith('.doc')) {
    // Legacy .doc files are binary and require server-side processing
    // For now, attempt to read as text (will likely fail validation)
    throw new Error('Legacy .doc files are not fully supported. Please save as .docx');
  }
  
  // Fallback for text files
  return file.text();
}

export type ExtractionError = {
  type: 'password_protected' | 'corrupted' | 'unsupported' | 'unknown';
  message: string;
};

/**
 * Safe wrapper that catches extraction errors
 */
export async function safeExtractText(file: File): Promise<{ text: string; error: null } | { text: null; error: ExtractionError }> {
  try {
    const text = await extractText(file);
    return { text, error: null };
  } catch (err: any) {
    console.error('Text extraction failed:', err);
    
    // Check for password-protected PDF
    if (err.name === 'PasswordException' || err.message?.includes('password')) {
      return {
        text: null,
        error: {
          type: 'password_protected',
          message: 'This PDF is password-protected. Please upload an unlocked document.'
        }
      };
    }
    
    // Check for legacy .doc
    if (err.message?.includes('.doc')) {
      return {
        text: null,
        error: {
          type: 'unsupported',
          message: 'Legacy .doc files are not supported. Please save as .docx and try again.'
        }
      };
    }
    
    // Generic corrupted/unreadable
    return {
      text: null,
      error: {
        type: 'corrupted',
        message: 'We could not read this file. Please upload a clear, uncorrupted document.'
      }
    };
  }
}
