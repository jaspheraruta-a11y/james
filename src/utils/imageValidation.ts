interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

import type { DocumentCategory } from './documentValidation';

interface ImageValidationOptions {
  maxSizeMB?: number;
  allowedFormats?: string[];
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  maxAspectRatio?: number;
  minAspectRatio?: number;
  requireValidImage?: boolean;
  documentCategory?: DocumentCategory; // Optional: validate document content
}

export async function validateImage(
  file: File,
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const {
    maxSizeMB = 5,
    allowedFormats = ['image/jpeg', 'image/png', 'image/webp'],
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    maxAspectRatio,
    minAspectRatio,
    requireValidImage = true,
    documentCategory,
  } = options;

  // 1. File size validation
  if (file.size > maxSizeMB * 1024 * 1024) {
    errors.push(`Image size must be less than ${maxSizeMB}MB`);
  }

  // 2. File type validation
  if (!allowedFormats.includes(file.type)) {
    errors.push(`Image format must be one of: ${allowedFormats.join(', ')}`);
  }

  // 3. File extension validation (additional security)
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  if (!fileExt || !validExtensions.includes(fileExt)) {
    errors.push(`File extension must be one of: ${validExtensions.join(', ')}`);
  }

  // 4. Verify file is actually an image (magic bytes check)
  const isValidFormat = await verifyImageFormat(file);
  if (!isValidFormat) {
    errors.push('File does not appear to be a valid image');
  }

  // 5. Load and verify image can be decoded
  let metadata: { width: number; height: number; format: string; size: number } | undefined;
  
  if (requireValidImage || minWidth || maxWidth || minHeight || maxHeight || maxAspectRatio || minAspectRatio) {
    try {
      metadata = await getImageMetadata(file);
      
      // 6. Dimension validation
      if (minWidth && metadata.width < minWidth) {
        errors.push(`Image width must be at least ${minWidth}px`);
      }
      if (maxWidth && metadata.width > maxWidth) {
        errors.push(`Image width must be at most ${maxWidth}px`);
      }
      if (minHeight && metadata.height < minHeight) {
        errors.push(`Image height must be at least ${minHeight}px`);
      }
      if (maxHeight && metadata.height > maxHeight) {
        errors.push(`Image height must be at most ${maxHeight}px`);
      }

      // 7. Aspect ratio validation
      const aspectRatio = metadata.width / metadata.height;
      if (minAspectRatio && aspectRatio < minAspectRatio) {
        errors.push(`Image aspect ratio must be at least ${minAspectRatio}`);
      }
      if (maxAspectRatio && aspectRatio > maxAspectRatio) {
        errors.push(`Image aspect ratio must be at most ${maxAspectRatio}`);
      }
    } catch (error) {
      errors.push('Failed to load image. File may be corrupted.');
    }
  }

  // 8. Document content validation (if category is specified)
  if (documentCategory && errors.length === 0) {
    try {
      const { validateDocumentContent } = await import('./documentValidation');
      const docValidation = await validateDocumentContent(file, documentCategory);
      
      if (!docValidation.isValid) {
        errors.push(...docValidation.errors);
      }
    } catch (error) {
      // If document validation fails, we'll still allow the image
      // but log the error for debugging
      console.warn('Document content validation failed:', error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    metadata,
  };
}

// Verify image format using magic bytes (file signatures)
async function verifyImageFormat(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer.slice(0, 12));
      
      // JPEG: FF D8 FF
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        resolve(true);
        return;
      }
      
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        resolve(true);
        return;
      }
      
      // WebP: Check for "RIFF" and "WEBP"
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        // Check for WEBP at offset 8
        if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
          resolve(true);
          return;
        }
      }
      
      resolve(false);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

// Get image metadata (dimensions, format)
function getImageMetadata(file: File): Promise<{ width: number; height: number; format: string; size: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
        format: file.type,
        size: file.size,
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

