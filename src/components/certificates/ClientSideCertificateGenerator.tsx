import React, {useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {CertificateTemplate } from '@/types/certificate.types';
import ClientSideMuiProvider from '@/components/mui/ClientSideMuiProvider';

// Dynamically import the CertificateGenerator with SSR disabled
const CertificateGenerator = dynamic(
  () => import('./CertificateGenerator'),
  {ssr: false }
);

interface ClientSideCertificateGeneratorProps {
  userName: string;
  courseName: string;
  completionDate: Date;
  certificateId: string;
  onGenerate: (pdfUrl: string) => void;
  autoGenerate?: boolean;
  className?: string;
  signatureUrl?: string;
  template?: {
    id: string;
    name: string;
    backgroundUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
};
  allowCustomization?: boolean;
  onSave?: (certificateData: {
    pdfUrl: string;
    certificateId: string;
    template: string;
    signatureUrl?: string;
}) => Promise<void>;
}

const ClientSideCertificateGenerator: React.FC<ClientSideCertificateGeneratorProps> = (props) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
}, []);

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center p-8 border border-gray-200 rounded-lg bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  return (
    <ClientSideMuiProvider>
      <CertificateGenerator {...props} />
    </ClientSideMuiProvider>
  );
};

export default ClientSideCertificateGenerator;
