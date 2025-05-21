export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  userName: string;
  issueDate: string;
  expiryDate?: string;
  templateId: string;
  pdfUrl: string;
  thumbnailUrl: string;
  verificationCode: string;
  verificationUrl: string;
  downloadUrl?: string;
  qrCodeUrl?: string;
  values?: Record<string, string>;
  metadata?: {
    completionDate: string;
    grade?: string;
    duration?: string;
    skills?: string[];
    issuer?: {
      name: string;
      logo?: string;
      signature?: string;
      title?: string;
  };
};
  status: 'active' | 'expired' | 'revoked' | 'issued';
  sharedWith?: string[]; // List of email addresses or platforms
  createdAt: string;
  isPublic?: boolean;
  blockchainVerified?: boolean;
  blockchainVerificationId?: string;
  digitalSignature?: string;
}

// Field types that can be placed on the certificate
export type FieldType = 'studentName' | 'courseName' | 'completionDate' | 'certificateId' | 'signature' | 'qrCode' | 'issuerName' | 'issuerTitle' | 'image' | 'placeholder';

// Field definition with position and size
export interface TemplateField {
  id: string;
  type: FieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontColor?: string;
  alignment?: 'left' | 'center' | 'right';
  content?: string;
  imageUrl?: string; // URL for image fields
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'html' | 'pdf';
  content: string; // HTML content for HTML templates, PDF template URL for PDF templates
  previewUrl?: string;
  htmlTemplate?: string;
  cssStyles?: string;
  placeholders: string[]; // List of available placeholders like {{userName}}, {{courseName}}, etc.
  orientation: 'landscape' | 'portrait';
  dimensions: {
    width: number;
    height: number;
    unit: 'mm' | 'in' | 'px';
};
  defaultFonts: string[];
  defaultColors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
};
  defaultValues: Record<string, string>;
  isPdfTemplate?: boolean;
  pdfTemplateUrl?: string;
  storagePath?: string;
  fields?: TemplateField[];
  isDefault?: boolean;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
  createdBy: string; // User ID of the creator
  metadata?: Record<string, unknown>;
}

export interface CertificateGenerationOptions {
  templateId: string;
  userId: string;
  courseId: string;
  values?: Record<string, string>;
  expiryDate?: string; // ISO string format
  metadata?: Record<string, unknown>;
  userName?: string;
  courseName?: string;
  completionDate?: Date;
  certificateId?: string;
  customFields?: Record<string, string>;
  orientation?: 'landscape' | 'portrait';
  includeQRCode?: boolean;
  includeSignature?: boolean;
  signatureName?: string;
  signatureTitle?: string;
  companyName?: string;
  companyLogo?: string;
  isPublic?: boolean;
}

export interface CertificateVerification {
  id: string;
  certificateId: string;
  verificationCode: string;
  verifiedAt: string;
  verifiedBy?: string;
  verifiedIp?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'valid' | 'invalid' | 'expired' | 'revoked';
  metadata?: Record<string, unknown>;
}

export interface CertificateSearchFilters {
  userId?: string;
  courseId?: string;
  templateId?: string;
  status?: 'active' | 'expired' | 'revoked' | 'issued';
  startDate?: string;
  endDate?: string;
}

export interface CertificateVerificationResult {
  isValid: boolean;
  certificate?: Certificate;
  message: string;
  verifiedAt: string;
  verificationCode?: string; // Added for batch verification
  digitalSignatureVerification?: {
    isValid: boolean;
    message: string;
};
  blockchainVerification?: {
    isValid: boolean;
    message: string;
    transactionId?: string;
    blockchainProvider?: string;
    blockchainNetwork?: string;
    verificationUrl?: string;
};
}
