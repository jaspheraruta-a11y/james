import { createWorker } from 'tesseract.js';

export type DocumentCategory = 'CENRO' | 'CHO' | 'OBO' | 'BFP' | 'PROOF_OF_OWNERSHIP' | 'PROOF_OF_PAYMENT' | 'OTHER';

interface DocumentValidationResult {
  isValid: boolean;
  errors: string[];
  extractedText?: string;
  confidence?: number;
}

// Keywords that should appear in CENRO documents
const CENRO_KEYWORDS = [
  'cenro',
  'city environment',
  'city environment and natural resources',
  'natural resources',
  'environmental',
  'environmental clearance',
  'clearance',
  'environment',
  'certificate',
  'permit',
  'office',
];

// Keywords that should appear in CHO documents
const CHO_KEYWORDS = [
  'cho',
  'city health',
  'city health office',
  'health office',
  'health',
  'sanitary',
  'sanitary clearance',
  'clearance',
  'certificate',
  'permit',
  'office',
];

// Keywords that should appear in OBO documents
const OBO_KEYWORDS = [
  'obo',
  'office of the building official',
  'office of building official',
  'building official',
  'building',
  'building clearance',
  'building certificate',
  'building permit',
  'clearance',
  'certificate',
  'permit',
  'office',
  'official',
];

// Keywords that should appear in BFP documents
const BFP_KEYWORDS = [
  'bfp',
  'bureau of fire protection',
  'bureau of fire',
  'fire protection',
  'fire',
  'fire clearance',
  'fire safety',
  'fire certificate',
  'fire permit',
  'clearance',
  'certificate',
  'permit',
  'bureau',
];

// Keywords for proof of ownership documents
const PROOF_OF_OWNERSHIP_KEYWORDS = [
  'title',
  'deed',
  'ownership',
  'owner',
  'property',
  'land',
  'lot',
  'tax declaration',
  'certificate',
];

// Keywords for proof of payment
const PROOF_OF_PAYMENT_KEYWORDS = [
  'payment',
  'receipt',
  'paid',
  'gcash',
  'paymaya',
  'bank',
  'transaction',
  'reference',
  'amount',
];

/**
 * Extract text from an image using OCR
 */
async function extractTextFromImage(file: File): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker('eng');
  
  try {
    const { data } = await worker.recognize(file);
    await worker.terminate();
    
    return {
      text: data.text.toLowerCase(),
      confidence: data.confidence || 0,
    };
  } catch (error) {
    await worker.terminate();
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Check if extracted text contains required keywords for a document category
 */
function checkKeywords(text: string, keywords: string[]): { found: boolean; matchedKeywords: string[] } {
  const matchedKeywords: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    if (lowerText.includes(lowerKeyword)) {
      matchedKeywords.push(keyword);
    }
  }
  
  // Require at least 2-3 keywords to match for validation
  // For shorter keyword lists, require at least 2 matches
  // For longer lists, require at least 25% matches
  const requiredMatches = Math.max(2, Math.ceil(keywords.length * 0.25));
  const found = matchedKeywords.length >= requiredMatches;
  
  return { found, matchedKeywords };
}

/**
 * Validate document content based on category
 */
export async function validateDocumentContent(
  file: File,
  category: DocumentCategory
): Promise<DocumentValidationResult> {
  const errors: string[] = [];
  
  try {
    // Extract text from image using OCR
    const { text, confidence } = await extractTextFromImage(file);
    
    // Check confidence level (should be reasonable)
    if (confidence < 30) {
      errors.push('Image quality is too low. Please ensure the document is clear and readable.');
    }
    
    // Validate based on document category
    let keywordCheck: { found: boolean; matchedKeywords: string[] } | null = null;
    let expectedDocumentType = '';
    
    switch (category) {
      case 'CENRO':
        expectedDocumentType = 'CENRO (City Environment and Natural Resources Office)';
        keywordCheck = checkKeywords(text, CENRO_KEYWORDS);
        break;
      case 'CHO':
        expectedDocumentType = 'CHO (City Health Office)';
        keywordCheck = checkKeywords(text, CHO_KEYWORDS);
        break;
      case 'OBO':
        expectedDocumentType = 'OBO (Office of the Building Official)';
        keywordCheck = checkKeywords(text, OBO_KEYWORDS);
        break;
      case 'BFP':
        expectedDocumentType = 'BFP (Bureau of Fire Protection)';
        keywordCheck = checkKeywords(text, BFP_KEYWORDS);
        break;
      case 'PROOF_OF_OWNERSHIP':
        expectedDocumentType = 'Proof of Ownership';
        keywordCheck = checkKeywords(text, PROOF_OF_OWNERSHIP_KEYWORDS);
        break;
      case 'PROOF_OF_PAYMENT':
        expectedDocumentType = 'Proof of Payment';
        keywordCheck = checkKeywords(text, PROOF_OF_PAYMENT_KEYWORDS);
        break;
      case 'OTHER':
        // For other document types, we don't validate content
        return {
          isValid: true,
          errors: [],
          extractedText: text,
          confidence,
        };
    }
    
    // Check if required keywords were found
    if (keywordCheck && !keywordCheck.found) {
      const matchedCount = keywordCheck.matchedKeywords.length;
      const requiredCount = Math.max(2, Math.ceil(
        category === 'CENRO' ? CENRO_KEYWORDS.length * 0.25 :
        category === 'CHO' ? CHO_KEYWORDS.length * 0.25 :
        category === 'OBO' ? OBO_KEYWORDS.length * 0.25 :
        category === 'BFP' ? BFP_KEYWORDS.length * 0.25 : 2
      ));
      
      errors.push(
        `This image does not appear to be a valid ${expectedDocumentType} document. ` +
        `Found ${matchedCount} matching keywords, but need at least ${requiredCount}. ` +
        `Please ensure you are uploading the correct document type.`
      );
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      extractedText: text,
      confidence,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Failed to validate document content. Please ensure the image is clear and readable.'],
    };
  }
}

/**
 * Get document category from field name or context
 */
export function getDocumentCategoryFromField(fieldName: string): DocumentCategory {
  const lowerField = fieldName.toLowerCase();
  
  if (lowerField.includes('cenro')) return 'CENRO';
  if (lowerField.includes('cho')) return 'CHO';
  if (lowerField.includes('obo')) return 'OBO';
  if (lowerField.includes('bfp')) return 'BFP';
  if (lowerField.includes('proof_of_ownership') || lowerField.includes('proofofownership')) return 'PROOF_OF_OWNERSHIP';
  if (lowerField.includes('proof_of_payment') || lowerField.includes('proofofpayment')) return 'PROOF_OF_PAYMENT';
  
  return 'OTHER';
}

