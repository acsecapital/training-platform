import React, {useState } from 'react';
import {EmailPreviewProps } from '@/types/email-editor.types';

/**
 * A simple email preview component that doesn't use MUI components
 * to avoid the "Cannot read properties of null (reading 'useContext')" error
 */
const SimpleEmailPreview: React.FC<EmailPreviewProps> = ({
  subject,
  htmlContent,
  textContent,
  previewText,
  previewMode = 'html',
  testData = {}
}) => {
  const [viewMode, setViewMode] = useState<'html' | 'text'>(previewMode);
  const [showSource, setShowSource] = useState(false);

  // Replace variables in content with test data
  const replaceVariables = (content: string | undefined): string => {
    if (!content) return '';

    let result = content;

    // Replace all {{variableName}} occurrences with their values
    Object.entries(testData).forEach(([name, value]) => {
      const regex = new RegExp(`{{${name}}}`, 'g');
      result = result.replace(regex, value);
  });

    // Replace any remaining {{variableName}} with a placeholder
    result = result.replace(/{{(\w+)}}/g, (_, variableName) => {
      return `<span style="background-color: #fff3cd; color: #856404; padding: 0 3px; border-radius: 2px;">${variableName}</span>`;
  });

    return result;
};

  const processedHtmlContent = replaceVariables(htmlContent);
  const processedTextContent = replaceVariables(textContent);

  return (
    <div className="email-preview">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex border border-neutral-300 rounded-md overflow-hidden">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'html'
                ? 'bg-primary text-white'
                : 'bg-white text-neutral-700 hover:bg-neutral-100'
          }`}
            onClick={() => setViewMode('html')}
          >
            HTML
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              viewMode === 'text'
                ? 'bg-primary text-white'
                : 'bg-white text-neutral-700 hover:bg-neutral-100'
          }`}
            onClick={() => setViewMode('text')}
          >
            Text
          </button>
        </div>

        {viewMode === 'html' && (
          <button
            className="text-sm text-primary hover:text-primary-dark"
            onClick={() => setShowSource(!showSource)}
          >
            {showSource ? 'Show Rendered HTML' : 'Show HTML Source'}
          </button>
        )}
      </div>

      <div className="border border-neutral-200 rounded-md overflow-hidden mb-4">
        <div className="p-4 border-b border-neutral-200">
          <div className="text-sm text-neutral-500">Subject:</div>
          <div className="font-medium">{replaceVariables(subject)}</div>

          {previewText && (
            <div className="mt-2">
              <div className="text-sm text-neutral-500">Preview Text:</div>
              <div className="text-sm text-neutral-600">{replaceVariables(previewText)}</div>
            </div>
          )}
        </div>

        <div className="p-4">
          {viewMode === 'html' ? (
            showSource ? (
              <pre className="p-4 bg-neutral-100 rounded-md overflow-auto text-sm max-h-96">
                {htmlContent}
              </pre>
            ) : (
              <div
                className="max-h-96 overflow-auto"
                dangerouslySetInnerHTML={{__html: processedHtmlContent }}
              />
            )
          ) : (
            <pre className="p-4 bg-neutral-100 rounded-md overflow-auto text-sm font-mono whitespace-pre-wrap max-h-96">
              {processedTextContent}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleEmailPreview;
