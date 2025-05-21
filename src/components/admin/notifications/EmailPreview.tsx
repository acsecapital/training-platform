import React, {useState } from 'react';
import {EmailPreviewProps } from '../../../types/email-editor.types';
import {
  VisibilityIcon,
  CodeIcon,
  TextIcon,
  EditIcon
} from '@/components/ui/SimpleIcons';

/**
 * A simple email preview component that doesn't use MUI components
 * to avoid the "Cannot read properties of null (reading 'useContext')" error
 */
const EmailPreview: React.FC<EmailPreviewProps> = ({
  subject,
  htmlContent,
  textContent,
  previewText,
  previewMode = 'html',
  testData = {}
}) => {
  const [viewMode, setViewMode] = useState<'html' | 'text'>(previewMode);
  const [showSource, setShowSource] = useState(false);
  const [customTestData, setCustomTestData] = useState<Record<string, string>>(testData);
  const [editingTestData, setEditingTestData] = useState(false);
  const [newVariableName, setNewVariableName] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');

  const toggleSourceView = () => {
    setShowSource(!showSource);
};

  const addTestVariable = () => {
    if (newVariableName.trim()) {
      setCustomTestData({
        ...customTestData,
        [newVariableName.trim()]: newVariableValue
    });
      setNewVariableName('');
      setNewVariableValue('');
  }
};

  const removeTestVariable = (name: string) => {
    const newData = {...customTestData };
    delete newData[name];
    setCustomTestData(newData);
};

  // Replace variables in content with test data
  const replaceVariables = (content: string | undefined): string => {
    if (!content) return '';

    let result = content;

    // Replace all {{variableName}} occurrences with their values
    Object.entries(customTestData).forEach(([name, value]) => {
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
            <CodeIcon size={16} className="mr-1" />
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
            <TextIcon size={16} className="mr-1" />
            Text
          </button>
        </div>

        <button
          className="px-3 py-1 text-sm border border-neutral-300 rounded-md flex items-center hover:bg-neutral-50"
          onClick={() => setEditingTestData(!editingTestData)}
        >
          <EditIcon size={16} className="mr-1" />
          {editingTestData ? 'Hide Test Data' : 'Edit Test Data'}
        </button>
      </div>

      {editingTestData && (
        <div className="p-4 mb-4 border border-neutral-200 rounded-md">
          <h3 className="text-sm font-medium mb-2">Test Data Variables</h3>

          <div className="grid grid-cols-12 gap-2 mb-3">
            <div className="col-span-5">
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md"
                placeholder="Variable name (e.g., firstName)"
                value={newVariableName}
                onChange={(e) => setNewVariableName(e.target.value)}
              />
            </div>
            <div className="col-span-5">
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-md"
                placeholder="Value (e.g., John)"
                value={newVariableValue}
                onChange={(e) => setNewVariableValue(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <button
                className="w-full px-3 py-2 text-sm bg-primary text-white rounded-md disabled:opacity-50"
                onClick={addTestVariable}
                disabled={!newVariableName.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {Object.keys(customTestData).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(customTestData).map(([name, value]) => (
                <div
                  key={name}
                  className="flex items-center px-2 py-1 bg-neutral-50 border border-neutral-200 rounded-md"
                >
                  <span className="font-medium text-sm mr-1">{name}:</span>
                  <span className="text-sm mr-2">{value}</span>
                  <button
                    className="text-red-500 hover:text-red-700 text-sm px-1"
                    onClick={() => removeTestVariable(name)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              No test variables added yet. Variables in the preview will be highlighted.
            </p>
          )}
        </div>
      )}

      <div className="border border-neutral-200 rounded-md overflow-hidden mb-4">
        <div className="p-4 border-b border-neutral-200">
          <div className="text-sm text-neutral-500">Subject:</div>
          <div className="font-medium" dangerouslySetInnerHTML={{__html: replaceVariables(subject) }} />

          {previewText && (
            <div className="mt-2">
              <div className="text-sm text-neutral-500">Preview Text:</div>
              <div className="text-sm text-neutral-600" dangerouslySetInnerHTML={{__html: replaceVariables(previewText) }} />
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

      {viewMode === 'html' && (
        <button
          className="text-primary hover:text-primary-dark text-sm flex items-center"
          onClick={toggleSourceView}
        >
          <VisibilityIcon size={16} className="mr-1" />
          {showSource ? 'Show Rendered HTML' : 'Show HTML Source'}
        </button>
      )}
    </div>
  );
};

export default EmailPreview;



