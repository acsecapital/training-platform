import React from 'react';
import EmailTemplateEditor from './EmailTemplateEditor';
import {withSafeMui } from '@/components/mui/withSafeMui';

interface EmailTemplateEditorWithProviderProps {
  templateId?: string;
}

const EmailTemplateEditorWithProviderBase: React.FC<EmailTemplateEditorWithProviderProps> = ({templateId }) => {
  return <EmailTemplateEditor templateId={templateId} />;
};

// Export the wrapped component
const EmailTemplateEditorWithProvider = withSafeMui(EmailTemplateEditorWithProviderBase);
export default EmailTemplateEditorWithProvider;
