import {EmailTemplate, EmailTemplateVariable, NotificationTemplateType } from './notification-templates.types';

export interface EmailEditorProps {
  template?: EmailTemplate;
  onSave: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  availableVariables?: EmailTemplateVariable[];
  templateTypes?: NotificationTemplateType[];
  categories?: string[];
}

export interface EmailEditorState {
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  type: NotificationTemplateType;
  isActive: boolean;
  variables: EmailTemplateVariable[];
  version: number;
  category: string;
  tags: string[];
  previewText: string;
  metadata: {
    sender?: string;
    senderName?: string;
    replyTo?: string;
    priority?: 'high' | 'normal' | 'low';
    trackingEnabled?: boolean;
};
  design: {
    templateType: 'responsive' | 'fixed-width';
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    headerImageUrl?: string;
    footerContent?: string;
};
  errors: {
    name?: string;
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    type?: string;
    category?: string;
};
  isDirty: boolean;
  previewMode: boolean;
  activeTab: 'html' | 'text' | 'preview' | 'settings';
  testEmailAddress: string;
}

export interface VariableSelectorProps {
  variables: EmailTemplateVariable[];
  onInsert: (variable: EmailTemplateVariable) => void;
}

export interface EmailPreviewProps {
  subject: string;
  htmlContent: string;
  textContent: string;
  previewText?: string;
  previewMode: 'html' | 'text';
  testData?: Record<string, string>;
}

export interface EmailTemplateService {
  getTemplateById: (id: string) => Promise<EmailTemplate | null>;
  getTemplatesByType: (type: NotificationTemplateType) => Promise<EmailTemplate[]>;
  createTemplate: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTemplate: (id: string, template: Partial<EmailTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  getAvailableVariables: () => Promise<EmailTemplateVariable[]>;
  getTemplateCategories: () => Promise<string[]>;
  sendTestEmail: (to: string, template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>, testData?: Record<string, string>) => Promise<boolean>;
}
