import React from 'react';
import {EmailPreviewProps } from '@/types/email-editor.types';
import dynamic from 'next/dynamic';

// Dynamically import the EmailPreview with SSR disabled
const EmailPreview = dynamic<EmailPreviewProps>(
  () => import('./EmailPreview'),
  {ssr: false }
);

const ClientSideEmailPreview: React.FC<EmailPreviewProps> = (props) => {
  return <EmailPreview {...props} />;
};

export default ClientSideEmailPreview;
