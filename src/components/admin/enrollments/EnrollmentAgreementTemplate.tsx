import React, {useState } from 'react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import Button from '@/components/ui/Button';
import {Save, Eye, Download, Trash2 } from 'lucide-react';
import {toast } from 'sonner';

interface EnrollmentAgreementTemplateProps {
  initialContent?: string;
  onSave: (content: string) => Promise<void>;
  onPreview: (content: string) => void;
  onDelete?: () => Promise<void>;
}

const EnrollmentAgreementTemplate: React.FC<EnrollmentAgreementTemplateProps> = ({
  initialContent = '',
  onSave,
  onPreview,
  onDelete
}) => {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleEditorChange = (content: string) => {
    setContent(content);
};

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Template content cannot be empty');
      return;
  }

    try {
      setSaving(true);
      await onSave(content);
      toast.success('Template saved successfully');
  } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
  } finally {
      setSaving(false);
  }
};

  const handlePreview = () => {
    if (!content.trim()) {
      toast.error('Template content cannot be empty');
      return;
  }

    onPreview(content);
};

  const handleDelete = async () => {
    if (!onDelete) return;

    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        setDeleting(true);
        await onDelete();
        toast.success('Template deleted successfully');
    } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Failed to delete template');
    } finally {
        setDeleting(false);
    }
  }
};

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-neutral-900">Enrollment Agreement Template</h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4 mr-1.5" />
              Preview
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1.5"></div>
              ) : (
                <Save className="h-4 w-4 mr-1.5" />
              )}
              Save
            </Button>
            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1.5"></div>
                ) : (
                  <Trash2 className="h-4 w-4 mr-1.5" />
                )}
                Delete
              </Button>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-neutral-500 mb-2">
              Use the following placeholders in your template:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-neutral-600">
              <div><code>{'{{studentName}}'}</code> - Student's full name</div>
              <div><code>{'{{courseName}}'}</code> - Course title</div>
              <div><code>{'{{enrollmentDate}}'}</code> - Date of enrollment</div>
              <div><code>{'{{companyName}}'}</code> - Company name</div>
              <div><code>{'{{teamName}}'}</code> - Team name</div>
              <div><code>{'{{currentDate}}'}</code> - Current date</div>
            </div>
          </div>

          <RichTextEditor
            initialValue={initialContent}
            onChange={handleEditorChange}
            height={500}
            editorType="advanced"
          />
        </div>
      </div>
    </div>
  );
};

export default EnrollmentAgreementTemplate;



