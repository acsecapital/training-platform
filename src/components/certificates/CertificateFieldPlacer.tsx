import React, {useState, useRef, useEffect } from 'react';
import {Rnd } from 'react-rnd';

interface Field {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontColor: string;
  alignment: 'left' | 'center' | 'right';
  content?: string;
}

interface CertificateFieldPlacerProps {
  fields: Field[];
  onFieldsUpdate: (fields: Field[]) => void;
  orientation: 'landscape' | 'portrait';
  dimensions: {
    width: number;
    height: number;
    unit: string;
};
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
};
}

const CertificateFieldPlacer: React.FC<CertificateFieldPlacerProps> = ({
  fields,
  onFieldsUpdate,
  orientation,
  dimensions,
  colors,
}) => {
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [availableFonts, setAvailableFonts] = useState<string[]>([
    'Helvetica',
    'Arial',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Courier New',
  ]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({width: 0, height: 0 });
  const [scale, setScale] = useState(1);

  // Calculate container size and scale based on dimensions and orientation
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const aspectRatio = orientation === 'landscape'
        ? dimensions.width / dimensions.height
        : dimensions.height / dimensions.width;
      
      const containerHeight = containerWidth / aspectRatio;
      
      setContainerSize({
        width: containerWidth,
        height: containerHeight,
    });
      
      // Calculate scale factor for converting between percentage and pixels
      setScale(containerWidth / 100);
  }
}, [containerRef, dimensions, orientation]);

  // Handle field selection
  const handleFieldSelect = (id: string) => {
    setSelectedField(id);
};

  // Handle field position/size change
  const handleFieldChange = (id: string, x: number, y: number, width: number, height: number) => {
    const updatedFields = fields.map(field => {
      if (field.id === id) {
        return {
          ...field,
          x: Math.round((x / containerSize.width) * 100),
          y: Math.round((y / containerSize.height) * 100),
          width: Math.round((width / containerSize.width) * 100),
          height: Math.round((height / containerSize.height) * 100),
      };
    }
      return field;
  });
    
    onFieldsUpdate(updatedFields);
};

  // Handle field property change
  const handleFieldPropertyChange = (id: string, property: string, value: any) => {
    const updatedFields = fields.map(field => {
      if (field.id === id) {
        return {
          ...field,
          [property]: value,
      };
    }
      return field;
  });
    
    onFieldsUpdate(updatedFields);
};

  // Add a new field
  const handleAddField = (type: string) => {
    const newField: Field = {
      id: `field-${Date.now()}`,
      type,
      x: 10,
      y: 10,
      width: 30,
      height: 10,
      fontFamily: 'Helvetica',
      fontSize: 16,
      fontWeight: 'normal',
      fontColor: colors.text,
      alignment: 'center',
      content: type === 'placeholder' ? '{{placeholder}}' : 'Text content',
  };
    
    onFieldsUpdate([...fields, newField]);
    setSelectedField(newField.id);
};

  // Delete a field
  const handleDeleteField = (id: string) => {
    const updatedFields = fields.filter(field => field.id !== id);
    onFieldsUpdate(updatedFields);
    setSelectedField(null);
};

  // Get field content for display
  const getFieldContent = (field: Field) => {
    if (field.type === 'placeholder') {
      return field.content || '{{placeholder}}';
  } else if (field.type === 'text') {
      return field.content || 'Text content';
  } else if (field.type === 'image') {
      return 'Image';
  }
    return '';
};

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Certificate Canvas */}
        <div className="flex-1">
          <div
            ref={containerRef}
            className="relative border border-neutral-300 rounded-md overflow-hidden"
            style={{
              backgroundColor: colors.background,
              aspectRatio: orientation === 'landscape' ? '1.414 / 1' : '1 / 1.414',
          }}
          >
            {/* Border */}
            <div
              className="absolute inset-[20px] border-[5px]"
              style={{borderColor: colors.primary }}
            />
            <div
              className="absolute inset-[25px] border-[2px]"
              style={{borderColor: colors.secondary }}
            />
            
            {/* Fields */}
            {fields.map(field => (
              <Rnd
                key={field.id}
                default={{
                  x: (field.x / 100) * containerSize.width,
                  y: (field.y / 100) * containerSize.height,
                  width: (field.width / 100) * containerSize.width,
                  height: (field.height / 100) * containerSize.height,
              }}
                onDragStop={(e, d) => {
                  handleFieldChange(
                    field.id,
                    d.x,
                    d.y,
                    (field.width / 100) * containerSize.width,
                    (field.height / 100) * containerSize.height
                  );
              }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  handleFieldChange(
                    field.id,
                    position.x,
                    position.y,
                    parseInt(ref.style.width),
                    parseInt(ref.style.height)
                  );
              }}
                bounds="parent"
                className={`${
                  selectedField === field.id
                    ? 'border-2 border-blue-500'
                    : 'border border-neutral-300 hover:border-blue-300'
              } bg-white bg-opacity-50 cursor-move flex items-center justify-center overflow-hidden`}
                onClick={() => handleFieldSelect(field.id)}
              >
                <div
                  className="w-full h-full flex items-center p-2 overflow-hidden"
                  style={{
                    fontFamily: field.fontFamily,
                    fontSize: `${field.fontSize * scale / 10}px`,
                    fontWeight: field.fontWeight,
                    color: field.fontColor,
                    textAlign: field.alignment,
                }}
                >
                  {field.type === 'image' ? (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-1/2 w-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center overflow-hidden">
                      {getFieldContent(field)}
                    </div>
                  )}
                </div>
              </Rnd>
            ))}
          </div>
          
          <div className="mt-4 flex justify-center space-x-4">
            <button
              type="button"
              className="px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              onClick={() => handleAddField('text')}
            >
              Add Text
            </button>
            <button
              type="button"
              className="px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              onClick={() => handleAddField('placeholder')}
            >
              Add Placeholder
            </button>
            <button
              type="button"
              className="px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              onClick={() => handleAddField('image')}
            >
              Add Image
            </button>
          </div>
        </div>
        
        {/* Field Properties */}
        <div className="w-full md:w-80 lg:w-96 bg-neutral-50 border border-neutral-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-neutral-900 mb-4">Field Properties</h3>
          
          {selectedField ? (
            <div className="space-y-4">
              {fields.find(f => f.id === selectedField) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Field Type
                    </label>
                    <select
                      value={fields.find(f => f.id === selectedField)?.type}
                      onChange={(e) => handleFieldPropertyChange(selectedField, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="text">Text</option>
                      <option value="placeholder">Placeholder</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                  
                  {(fields.find(f => f.id === selectedField)?.type === 'text' ||
                    fields.find(f => f.id === selectedField)?.type === 'placeholder') && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Content
                      </label>
                      <input
                        type="text"
                        value={fields.find(f => f.id === selectedField)?.content || ''}
                        onChange={(e) => handleFieldPropertyChange(selectedField, 'content', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Font Family
                    </label>
                    <select
                      value={fields.find(f => f.id === selectedField)?.fontFamily}
                      onChange={(e) => handleFieldPropertyChange(selectedField, 'fontFamily', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {availableFonts.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={fields.find(f => f.id === selectedField)?.fontSize}
                      onChange={(e) => handleFieldPropertyChange(selectedField, 'fontSize', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Font Weight
                    </label>
                    <select
                      value={fields.find(f => f.id === selectedField)?.fontWeight}
                      onChange={(e) => handleFieldPropertyChange(selectedField, 'fontWeight', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="lighter">Lighter</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Font Color
                    </label>
                    <div className="flex">
                      <input
                        type="color"
                        value={fields.find(f => f.id === selectedField)?.fontColor}
                        onChange={(e) => handleFieldPropertyChange(selectedField, 'fontColor', e.target.value)}
                        className="h-10 w-10 border border-neutral-300 rounded-l-md"
                      />
                      <input
                        type="text"
                        value={fields.find(f => f.id === selectedField)?.fontColor}
                        onChange={(e) => handleFieldPropertyChange(selectedField, 'fontColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-l-0 border-neutral-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Text Alignment
                    </label>
                    <div className="flex border border-neutral-300 rounded-md overflow-hidden">
                      <button
                        type="button"
                        className={`flex-1 py-2 ${
                          fields.find(f => f.id === selectedField)?.alignment === 'left'
                            ? 'bg-primary text-white'
                            : 'bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                        onClick={() => handleFieldPropertyChange(selectedField, 'alignment', 'left')}
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2 border-l border-r border-neutral-300 ${
                          fields.find(f => f.id === selectedField)?.alignment === 'center'
                            ? 'bg-primary text-white'
                            : 'bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                        onClick={() => handleFieldPropertyChange(selectedField, 'alignment', 'center')}
                      >
                        Center
                      </button>
                      <button
                        type="button"
                        className={`flex-1 py-2 ${
                          fields.find(f => f.id === selectedField)?.alignment === 'right'
                            ? 'bg-primary text-white'
                            : 'bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                        onClick={() => handleFieldPropertyChange(selectedField, 'alignment', 'right')}
                      >
                        Right
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Position
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">X (%)</label>
                        <input
                          type="number"
                          value={fields.find(f => f.id === selectedField)?.x}
                          onChange={(e) => handleFieldPropertyChange(selectedField, 'x', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Y (%)</label>
                        <input
                          type="number"
                          value={fields.find(f => f.id === selectedField)?.y}
                          onChange={(e) => handleFieldPropertyChange(selectedField, 'y', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Size
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Width (%)</label>
                        <input
                          type="number"
                          value={fields.find(f => f.id === selectedField)?.width}
                          onChange={(e) => handleFieldPropertyChange(selectedField, 'width', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-500 mb-1">Height (%)</label>
                        <input
                          type="number"
                          value={fields.find(f => f.id === selectedField)?.height}
                          onChange={(e) => handleFieldPropertyChange(selectedField, 'height', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-neutral-200">
                    <button
                      type="button"
                      className="w-full px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      onClick={() => handleDeleteField(selectedField)}
                    >
                      Delete Field
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <p>Select a field to edit its properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateFieldPlacer;
