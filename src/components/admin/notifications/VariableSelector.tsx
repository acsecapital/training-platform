import React from 'react';
import {VariableSelectorProps } from '../../../types/email-editor.types';
import {ContentCopyIcon, InfoIcon } from '@/components/ui/SimpleIcons';

const VariableSelector: React.FC<VariableSelectorProps> = ({variables, onInsert }) => {
  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
};

  return (
    <div className="p-4 mb-4 border border-neutral-200 rounded-md">
      <div className="flex flex-wrap gap-2">
        {variables.map((variable) => (
          <div
            key={variable.name}
            className="relative group"
            title={`${variable.description}${variable.required ? ' (Required)' : ''}${variable.defaultValue ? ` Default: ${variable.defaultValue}` : ''}`}
          >
            <div
              className="flex items-center px-2 py-1 border border-primary text-primary rounded-md cursor-pointer hover:bg-primary hover:text-white"
              onClick={() => onInsert(variable)}
            >
              <span className="text-sm">{variable.name}</span>
              <button
                className="ml-2 p-1 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyVariable(variable.name);
              }}
                title="Copy variable"
              >
                <ContentCopyIcon size={14} />
              </button>
            </div>
          </div>
        ))}
        {variables.length === 0 && (
          <p className="text-sm text-neutral-500">
            No variables available
          </p>
        )}
      </div>
      <p className="text-xs text-neutral-500 mt-2 flex items-center">
        <InfoIcon size={14} className="mr-1" />
        Click a variable to insert it at the cursor position, or click the copy icon to copy it to clipboard.
      </p>
    </div>
  );
};

export default VariableSelector;
