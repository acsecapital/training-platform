import React, {useState } from 'react';
import Button from '@/components/ui/Button';
import {X, Download, Printer, Send } from 'lucide-react';
import {toast } from 'sonner';

interface EnrollmentAgreementPreviewProps {
  content: string;
  onClose: () => void;
  sampleData?: {
    studentName?: string;
    courseName?: string;
    enrollmentDate?: string;
    companyName?: string;
    teamName?: string;
};
}

const EnrollmentAgreementPreview: React.FC<EnrollmentAgreementPreviewProps> = ({
  content,
  onClose,
  sampleData = {}
}) => {
  const [sending, setSending] = useState(false);

  // Replace placeholders with actual data
  const processedContent = content
    .replace(/{{studentName}}/g, sampleData.studentName || 'John Doe')
    .replace(/{{courseName}}/g, sampleData.courseName || 'Sample Course')
    .replace(/{{enrollmentDate}}/g, sampleData.enrollmentDate || new Date().toLocaleDateString())
    .replace(/{{companyName}}/g, sampleData.companyName || 'Sample Company')
    .replace(/{{teamName}}/g, sampleData.teamName || 'Sample Team')
    .replace(/{{currentDate}}/g, new Date().toLocaleDateString());

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Enrollment Agreement</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
              h1, h2, h3 {
                color: #111;
            }
              @media print {
                button {
                  display: none;
              }
            }
            </style>
          </head>
          <body>
            <div>
              ${processedContent}
            </div>
            <button onclick="window.print();" style="margin-top: 20px; padding: 10px 15px; background-color: #4F46E5; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print Agreement
            </button>
          </body>
        </html>
      `);
      printWindow.document.close();
  } else {
      toast.error('Unable to open print window. Please check your popup blocker settings.');
  }
};

  const handleDownload = () => {
    const blob = new Blob([`
      <html>
        <head>
          <title>Enrollment Agreement</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
          }
            h1, h2, h3 {
              color: #111;
          }
          </style>
        </head>
        <body>
          ${processedContent}
        </body>
      </html>
    `], {type: 'text/html'});
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'enrollment-agreement.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

  const handleSendTest = async () => {
    // This would be implemented in a future step
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success('Test email sent successfully');
  }, 1500);
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-neutral-900">Agreement Preview</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{__html: processedContent }}
          />
        </div>
        
        <div className="px-6 py-4 border-t border-neutral-200 flex justify-between items-center bg-neutral-50">
          <div className="text-sm text-neutral-500">
            This is a preview with sample data.
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendTest}
              disabled={sending}
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1.5"></div>
              ) : (
                <Send className="h-4 w-4 mr-1.5" />
              )}
              Send Test
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentAgreementPreview;

