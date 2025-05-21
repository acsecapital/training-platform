import React, {useState, useEffect, useRef } from 'react';
import {useRouter } from 'next/router';
import {
  EmailTemplate,
  EmailTemplateVariable,
  NotificationTemplateType
} from '@/types/notification-templates.types';
import {
  getEmailTemplateById,
  updateEmailTemplate,
  createEmailTemplate,
  getAvailableEmailVariables,
  getEmailTemplateCategories,
  sendTestEmail
} from '@/services/notificationTemplateService';
import Button from '@/components/ui/Button';
import ClientSideEmailPreview from './ClientSideEmailPreview';

// Dynamically import the VariableSelector with SSR disabled and wrapped with SafeMuiWrapper
import {dynamicWithSafeMui } from '@/components/mui/withSafeMui';
import {VariableSelectorProps } from '@/types/email-editor.types';

// Import ReactQuill type for ref
import ReactQuill from 'react-quill';
import Quill from 'quill'; // Import Quill type for editor instance

const VariableSelector = dynamicWithSafeMui<VariableSelectorProps>(
  () => import('./VariableSelector')
);

// Import our custom QuillEditor component
import QuillEditor from './QuillEditor';

interface EmailTemplateEditorProps {
  templateId?: string;
}

const DEFAULT_TEMPLATE_TYPES: NotificationTemplateType[] = [
  'course_progress',
  'course_completion',
  'certificate_expiration',
  'new_course_available',
  'inactivity_reminder',
  'enrollment_confirmation',
  'quiz_completion',
  'achievement_unlocked',
  'welcome_message'
];

const DEFAULT_CATEGORIES = [
  'Course Updates',
  'Certificates',
  'Reminders',
  'System',
  'Marketing',
  'Achievements'
];

const templateTypeOptions = [
  {value: 'course_progress', label: 'Course Progress'},
  {value: 'course_completion', label: 'Course Completion'},
  {value: 'certificate_expiration', label: 'Certificate Expiration'},
  {value: 'new_course_available', label: 'New Course Available'},
  {value: 'inactivity_reminder', label: 'Inactivity Reminder'},
  {value: 'enrollment_confirmation', label: 'Enrollment Confirmation'},
  {value: 'quiz_completion', label: 'Quiz Completion'},
  {value: 'achievement_unlocked', label: 'Achievement Unlocked'},
  {value: 'welcome_message', label: 'Welcome Message'},
];

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({templateId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableVariables, setAvailableVariables] = useState<EmailTemplateVariable[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [activeTab, setActiveTab] = useState<'html' | 'text' | 'preview' | 'settings'>('html');
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{success: boolean; message: string} | null>(null);

  // Ref for the HTML Quill editor
  const htmlQuillRef = useRef<ReactQuill>(null);

  const [template, setTemplate] = useState<Partial<EmailTemplate>>({
    name: '',
    type: 'course_progress',
    subject: '',
    htmlContent: '<p>Hello {{firstName}},</p><p>Your content here.</p><p>Regards,<br>{{platformName}} Team</p>',
    textContent: 'Hello {{firstName}},\n\nYour content here.\n\nRegards,\n{{platformName}} Team',
    isActive: true,
    variables: [],
    version: 1,
    category: DEFAULT_CATEGORIES[0],
    tags: [],
    previewText: '',
    metadata: {
      sender: '',
      senderName: '',
      replyTo: '',
      priority: 'normal',
      trackingEnabled: true
  },
    design: {
      templateType: 'responsive',
      primaryColor: '#3f51b5',
      secondaryColor: '#f50057',
      fontFamily: 'Arial, sans-serif',
      headerImageUrl: '',
      footerContent: '© ' + new Date().getFullYear() + ' Training Platform. All rights reserved.'
  }
});

  const [newVariable, setNewVariable] = useState({
    name: '',
    description: '',
    required: false,
    defaultValue: ''
});

  const [newTag, setNewTag] = useState('');
  const [testEmailAddress, setTestEmailAddress] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!templateId) {
        setLoading(false);
        return;
    }

      try {
        setLoading(true);
        setError(null);

        // Fetch available variables and categories
        const [variables, cats, fetchedTemplate] = await Promise.all([
          getAvailableEmailVariables(),
          getEmailTemplateCategories(),
          templateId ? getEmailTemplateById(templateId) : null
        ]);

        setAvailableVariables(variables);
        if (cats.length > 0) {
          setCategories(cats);
      }

        if (templateId && fetchedTemplate) {
          setTemplate(fetchedTemplate);
      } else if (templateId) {
          setError('Template not found');
          console.error('Template not found:', templateId);
      }
    } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
    } finally {
        setLoading(false);
    }
  };

    fetchData();
}, [templateId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        {error}
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/notifications/templates')}
          >
            Return to Templates
          </Button>
        </div>
      </div>
    );
}

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const {name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setTemplate(prev => ({...prev, [name]: checked }));
  } else {
      setTemplate(prev => ({...prev, [name]: value }));
  }
};

  // Handle nested object changes (metadata, design)
  const handleNestedChange = (parent: string, field: string, value: any) => {
    setTemplate(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as any || {}),
        [field]: value
    }
  }));
};

  // Handle HTML editor change
  const handleHtmlChange = (content: string) => {
    setTemplate(prev => ({...prev, htmlContent: content }));
};

  // Handle text editor change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTemplate(prev => ({...prev, textContent: e.target.value }));
};

  // Handle variable input change
  const handleVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = e.target.checked;
      setNewVariable(prev => ({...prev, [name]: checked }));
  } else {
      setNewVariable(prev => ({...prev, [name]: value }));
  }
};

  // Add variable
  const handleAddVariable = () => {
    if (!newVariable.name) return;

    setTemplate(prev => ({
      ...prev,
      variables: [...(prev.variables || []), newVariable]
  }));

    setNewVariable({
      name: '',
      description: '',
      required: false,
      defaultValue: ''
  });
};

  // Remove variable
  const handleRemoveVariable = (index: number) => {
    setTemplate(prev => ({
      ...prev,
      variables: prev.variables?.filter((_, i) => i !== index)
  }));
};

  // Handle tab change
  const handleTabChange = (tab: 'html' | 'text' | 'preview' | 'settings') => {
    setActiveTab(tab);
};

  // Handle adding a tag
  const handleAddTag = () => {
    if (newTag && !template.tags?.includes(newTag)) {
      setTemplate(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag]
    }));
      setNewTag('');
  }
};

  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setTemplate(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag)
  }));
};

  // Handle inserting a variable into the content
  const handleInsertVariable = (variable: EmailTemplateVariable) => {
    const variableTag = `{{${variable.name}}}`; // Keep the braces for display/insertion

    if (activeTab === 'html') {
      const editor = htmlQuillRef.current?.getEditor();
      if (editor) {
        const range = editor.getSelection();
        const index = range ? range.index : editor.getLength(); // Insert at cursor or end
        editor.insertText(index, variableTag, 'user');
        editor.setSelection(index + variableTag.length, 0, 'user'); // Move cursor after inserted tag
        // Update state after editor modification
        handleHtmlChange(editor.root.innerHTML);
    } else {
        console.error('HTML Quill editor instance not found.');
        // Fallback: Append to existing content if editor not ready
        handleHtmlChange((template.htmlContent || '') + variableTag);
    }
  } else if (activeTab === 'text') {
      // For plain text, find the textarea and insert at cursor position
      const textarea = document.getElementById('textContentArea') as HTMLTextAreaElement | null;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = text.substring(0, start) + variableTag + text.substring(end);
        setTemplate(prev => ({...prev, textContent: newText }));
        // Move cursor after inserted text
        // Use setTimeout to ensure the update happens after state change
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + variableTag.length;
          textarea.focus();
      }, 0);
    } else {
         // Fallback: Append if textarea not found (shouldn't happen)
         setTemplate(prev => ({
           ...prev,
           textContent: (prev.textContent || '') + variableTag
       }));
    }
  }
};

  // Handle sending a test email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      setTestEmailResult({
        success: false,
        message: 'Please enter a test email address'
    });
      return;
  }

    setSendingTest(true);
    setTestEmailResult(null);

    try {
      const success = await sendTestEmail(
        testEmailAddress,
        template as Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>
      );

      setTestEmailResult({
        success,
        message: success
          ? `Test email sent successfully to ${testEmailAddress}`
          : 'Failed to send test email. Please try again.'
    });
  } catch (error) {
      setTestEmailResult({
        success: false,
        message: `Error sending test email: ${error instanceof Error ? error.message : String(error)}`
    });
  } finally {
      setSendingTest(false);
  }
};

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!template.name) {
      errors.name = 'Template name is required';
  }

    if (!template.subject) {
      errors.subject = 'Subject is required';
  }

    if (!template.htmlContent) {
      errors.htmlContent = 'HTML content is required';
  }

    if (!template.textContent) {
      errors.textContent = 'Text content is required';
  }

    if (!template.type) {
      errors.type = 'Template type is required';
  }

    if (!template.category) {
      errors.category = 'Category is required';
  }

    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]);
      return false;
  }

    return true;
};

  // Save template
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!validateForm()) {
        setSaving(false);
        return;
    }

      if (templateId) {
        // Update existing template
        await updateEmailTemplate(
          templateId,
          template,
          {
            incrementVersion: true,
            changeDescription: 'Template updated via editor',
            changedBy: 'admin' // This should be the actual user ID
        }
        );
    } else {
        // Create new template
        await createEmailTemplate(template as Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>);
    }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/notifications/templates');
    }, 1500);
  } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save template');
  } finally {
      setSaving(false);
  }
};

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {templateId ? 'Edit Email Template' : 'Create Email Template'}
        </h2>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push('/admin/notifications/templates')}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={saving}
            isLoading={saving}
          >
            {templateId ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
          Template saved successfully!
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Template Name
            </label>
            <input
              type="text"
              name="name"
              value={template.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="e.g., Course Completion Notification"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Template Type
            </label>
            <select
              name="type"
              value={template.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {templateTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Email Subject
            </label>
            <input
              type="text"
              name="subject"
              value={template.subject}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="e.g., Congratulations on completing {{courseName}}!"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Category
            </label>
            <select
              name="category"
              value={template.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Preview Text (shown in email clients)
          </label>
          <input
            type="text"
            name="previewText"
            value={template.previewText || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Brief summary shown in email clients before opening"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200">
          <div className="flex space-x-6">
            <button
              className={`py-2 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'html'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
              onClick={() => handleTabChange('html')}
            >
              HTML Content
            </button>
            <button
              className={`py-2 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'text'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
              onClick={() => handleTabChange('text')}
            >
              Plain Text
            </button>
            <button
              className={`py-2 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'preview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
              onClick={() => handleTabChange('preview')}
            >
              Preview
            </button>
            <button
              className={`py-2 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'settings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
            }`}
              onClick={() => handleTabChange('settings')}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Variable Selector - Always visible */}
        <div className="mb-4 bg-white border border-neutral-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Available Variables</h3>
          <VariableSelector
            variables={availableVariables}
            onInsert={handleInsertVariable}
          />
        </div>

        {/* Tab Content */}

        {activeTab === 'html' && (
          <div>

            <div className="border border-neutral-300 rounded-md">
              <QuillEditor
                value={template.htmlContent || ''}
                onChange={handleHtmlChange}
                modules={{
                  toolbar: [
                    [{header: [1, 2, 3, 4, 5, 6, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{list: 'ordered'}, {list: 'bullet'}],
                    [{color: [] }, {background: [] }],
                    ['link', 'image'],
                    ['clean']
                  ]
              }}
                className="h-64"
              />
            </div>
            <p className="text-sm text-neutral-500 mt-2 ml-4">
              {'Use {{variableName}} syntax to include dynamic content.'}
            </p>
          </div>
        )}

        {activeTab === 'text' && (
          <div>

            <textarea
              name="textContent"
              value={template.textContent}
              onChange={handleTextChange}
              rows={12}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Plain text version of the email for clients that don't support HTML..."
            ></textarea>
            <p className="text-sm text-neutral-500 mt-1">
              This version will be shown to recipients whose email clients don't support HTML.
            </p>
          </div>
        )}

        {activeTab === 'preview' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-neutral-700">Email Preview</h3>

              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Enter test email address"
                  className="px-3 py-1 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendTestEmail}
                  disabled={sendingTest || !testEmailAddress}
                  isLoading={sendingTest}
                >
                  Send Test
                </Button>
              </div>
            </div>

            {testEmailResult && (
              <div className={`mb-4 p-3 rounded-md ${
                testEmailResult.success
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
                {testEmailResult.message}
              </div>
            )}

            <div className="border border-neutral-200 rounded-md overflow-hidden">
              <ClientSideEmailPreview
                subject={template.subject || ''}
                htmlContent={template.htmlContent || ''}
                textContent={template.textContent || ''}
                previewText={template.previewText}
                previewMode="html"
              />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Email Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Sender Email
                  </label>
                  <input
                    type="email"
                    value={template.metadata?.sender || ''}
                    onChange={(e) => handleNestedChange('metadata', 'sender', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Leave blank to use system default"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={template.metadata?.senderName || ''}
                    onChange={(e) => handleNestedChange('metadata', 'senderName', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Leave blank to use system default"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Reply-To Email
                  </label>
                  <input
                    type="email"
                    value={template.metadata?.replyTo || ''}
                    onChange={(e) => handleNestedChange('metadata', 'replyTo', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Leave blank to use sender email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={template.metadata?.priority || 'normal'}
                    onChange={(e) => handleNestedChange('metadata', 'priority', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="trackingEnabled"
                    checked={template.metadata?.trackingEnabled !== false}
                    onChange={(e) => handleNestedChange('metadata', 'trackingEnabled', e.target.checked)}
                    className="w-4 h-4 text-primary focus:ring-primary border-neutral-300 rounded"
                  />
                  <label htmlFor="trackingEnabled" className="ml-2 text-sm text-neutral-700">
                    Enable email tracking (opens, clicks)
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Design Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Template Layout
                  </label>
                  <select
                    value={template.design?.templateType || 'responsive'}
                    onChange={(e) => handleNestedChange('design', 'templateType', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="responsive">Responsive</option>
                    <option value="fixed-width">Fixed Width</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Font Family
                  </label>
                  <input
                    type="text"
                    value={template.design?.fontFamily || ''}
                    onChange={(e) => handleNestedChange('design', 'fontFamily', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="e.g., Arial, sans-serif"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={template.design?.primaryColor || '#3f51b5'}
                      onChange={(e) => handleNestedChange('design', 'primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="#3f51b5"
                    />
                    <input
                      type="color"
                      value={template.design?.primaryColor || '#3f51b5'}
                      onChange={(e) => handleNestedChange('design', 'primaryColor', e.target.value)}
                      className="w-10 h-10 border-t border-r border-b border-neutral-300 rounded-r-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Secondary Color
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={template.design?.secondaryColor || '#f50057'}
                      onChange={(e) => handleNestedChange('design', 'secondaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="#f50057"
                    />
                    <input
                      type="color"
                      value={template.design?.secondaryColor || '#f50057'}
                      onChange={(e) => handleNestedChange('design', 'secondaryColor', e.target.value)}
                      className="w-10 h-10 border-t border-r border-b border-neutral-300 rounded-r-md"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Header Image URL
                  </label>
                  <input
                    type="text"
                    value={template.design?.headerImageUrl || ''}
                    onChange={(e) => handleNestedChange('design', 'headerImageUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="https://example.com/header-image.jpg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Footer Content
                  </label>
                  <textarea
                    value={template.design?.footerContent || ''}
                    onChange={(e) => handleNestedChange('design', 'footerContent', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="© 2023 Training Platform. All rights reserved."
                  ></textarea>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Tags</h3>
              <div className="flex items-center mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 px-3 py-2 border border-neutral-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Add a tag"
                />
                <button
                  onClick={handleAddTag}
                  disabled={!newTag || (template.tags && template.tags.includes(newTag))}
                  className="px-3 py-2 bg-primary text-white rounded-r-md hover:bg-primary-dark disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {template.tags && template.tags.length > 0 ? (
                  template.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-primary-light bg-primary hover:bg-primary-dark focus:outline-none"
                      >
                        <span className="sr-only">Remove tag</span>
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                          <path d="M2.22 2.22a.75.75 0 011.06 0L4 2.94l.72-.72a.75.75 0 111.06 1.06L5.06 4l.72.72a.75.75 0 11-1.06 1.06L4 5.06l-.72.72a.75.75 0 01-1.06-1.06L2.94 4l-.72-.72a.75.75 0 010-1.06z" />
                        </svg>
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-neutral-500 text-sm">No tags added yet.</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={template.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-primary focus:ring-primary border-neutral-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-neutral-700">
                  Template is active
                </label>
              </div>
              <p className="text-xs text-neutral-500 mt-1 ml-6">
                Inactive templates will not be used for sending notifications
              </p>
            </div>
          </div>
        )}

        {/* Template Variables - shown in all tabs */}
        {activeTab !== 'settings' && activeTab !== 'preview' && (
          <div>
            <h3 className="text-lg font-medium mb-3">Template Variables</h3>

            <div className="bg-neutral-50 p-4 rounded-md mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Variable Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newVariable.name}
                    onChange={handleVariableChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="e.g., firstName"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={newVariable.description}
                    onChange={handleVariableChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="e.g., User's first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Default Value
                  </label>
                  <input
                    type="text"
                    name="defaultValue"
                    value={newVariable.defaultValue || ''}
                    onChange={handleVariableChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="e.g., John"
                  />
                </div>

                <div className="flex items-end">
                  <div className="flex items-center mr-4">
                    <input
                      type="checkbox"
                      id="required"
                      name="required"
                      checked={newVariable.required}
                      onChange={handleVariableChange}
                      className="w-4 h-4 text-primary focus:ring-primary border-neutral-300 rounded"
                    />
                    <label htmlFor="required" className="ml-2 text-sm text-neutral-700">
                      Required
                    </label>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddVariable}
                    disabled={!newVariable.name}
                  >
                    Add Variable
                  </Button>
                </div>
              </div>

              {/* Variable List */}
              {template.variables && template.variables.length > 0 ? (
                <div className="border border-neutral-200 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Variable
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Default Value
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Required
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {template.variables.map((variable, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
                            {`{{${variable.name}}}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {variable.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {variable.defaultValue || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {variable.required ? 'Yes' : 'No'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleRemoveVariable(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-neutral-500 text-sm">No variables added yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailTemplateEditor;


