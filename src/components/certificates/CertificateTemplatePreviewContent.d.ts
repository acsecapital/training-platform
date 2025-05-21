import {CertificateTemplate } from '@/types/certificate.types';

export interface CertificateTemplatePreviewContentProps {
  id: string;
  templateData?: CertificateTemplate | null;
  templateError?: string | null;
}

declare const CertificateTemplatePreviewContent: React.FC<CertificateTemplatePreviewContentProps>;

export default CertificateTemplatePreviewContent;
