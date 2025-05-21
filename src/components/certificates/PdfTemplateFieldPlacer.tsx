import React, {useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {Document, Page } from 'react-pdf';
import {pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Button from '../ui/Button';
import {getCorsProxyUrl } from '@/utils/corsProxy';
import {FieldType, TemplateField } from '@/types/certificate.types';
import {MediaItem } from '@/components/admin/media/MediaManager';
import {collection, getDocs, query, where } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  // We need to use a direct URL to the worker
  const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
  console.log('Setting PDF.js worker source:', workerSrc);
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
}

// PDF.js worker is initialized at the top of the file

interface PdfTemplateFieldPlacerProps {
  pdfUrl: string;
  initialFields?: TemplateField[];
  onSave: (fields: TemplateField[]) => void;
  onCancel?: () => void;
}

const PdfTemplateFieldPlacer: React.FC<PdfTemplateFieldPlacerProps> = ({
  pdfUrl,
  initialFields = [],
  onSave,
  onCancel,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [activeField, setActiveField] = useState<TemplateField | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState({x: 0, y: 0 });
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({width: 0, height: 0 });
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [processedPdfUrl, setProcessedPdfUrl] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showFontPreview, setShowFontPreview] = useState(false);
  const [selectedFontPreview, setSelectedFontPreview] = useState('');

  // Media selector state
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Field types with labels and colors for the UI
  const fieldTypes: {type: FieldType; label: string; color: string }[] = [
    {type: 'studentName', label: 'Student Name', color: '#4f46e5'},
    {type: 'courseName', label: 'Course Name', color: '#0891b2'},
    {type: 'completionDate', label: 'Completion Date', color: '#059669'},
    {type: 'certificateId', label: 'Certificate ID', color: '#7c3aed'},
    {type: 'signature', label: 'Signature', color: '#b91c1c'},
    {type: 'qrCode', label: 'QR Code', color: '#0f172a'},
    {type: 'issuerName', label: 'Issuer Name', color: '#c2410c'},
    {type: 'issuerTitle', label: 'Issuer Title', color: '#a16207'},
    {type: 'image', label: 'Image', color: '#6366f1'},
  ];

  // Process the PDF URL to handle CORS
  useEffect(() => {
    if (pdfUrl) {
      console.log('Original PDF URL:', pdfUrl);
      const corsProxyUrl = getCorsProxyUrl(pdfUrl);
      console.log('Processed PDF URL:', corsProxyUrl);
      setProcessedPdfUrl(corsProxyUrl);
  }
}, [pdfUrl]);

  // This function is now inlined in the Document component

  // Handle document load error
  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setPdfError(`Error loading PDF: ${error.message}`);
    setPdfLoaded(false);

    // Log additional information for debugging
    console.log('PDF URL:', pdfUrl);
    console.log('Processed PDF URL:', processedPdfUrl);

    // Check if it might be a CORS issue
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      setPdfError(`CORS error loading PDF. The server might not allow cross-origin requests.`);
  }

    // Check if it might be a permission issue
    if (error.message.includes('401') || error.message.includes('403') || error.message.includes('unauthorized')) {
      setPdfError(`Permission error loading PDF. Please make sure you have access to this file.`);
  }

    // Try reloading with a delay
    setTimeout(() => {
      if (processedPdfUrl) {
        console.log('Attempting to reload PDF...');
        // Force a refresh of the processed URL
        setProcessedPdfUrl('');
        setTimeout(() => {
          if (pdfUrl) {
            const corsProxyUrl = getCorsProxyUrl(pdfUrl);
            setProcessedPdfUrl(corsProxyUrl);
        }
      }, 500);
    }
  }, 2000);
};

  // Handle page load success to get dimensions and fit to container
  const onPageLoadSuccess = (page: any) => {
    const {width, height } = page.getViewport({scale: 1 });
    setPageSize({width, height });

    console.log('PDF page dimensions at scale 1:', {width, height });

    // Auto-fit the document to the container only on initial load
    if (containerRef.current && !pdfLoaded) {
      const containerWidth = containerRef.current.clientWidth - 100; // Subtract padding
      const containerHeight = containerRef.current.clientHeight - 100; // Subtract padding

      // Calculate scale to fit width and height
      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;

      // Use the smaller scale to ensure the document fits completely
      const fitScale = Math.min(scaleX, scaleY, 1.0); // Cap at 1.0 to avoid making small docs too big

      // Set the scale with a slight reduction to ensure margins
      setScale(fitScale * 0.9);
      console.log('Setting initial scale to:', fitScale * 0.9);
  }
};

  // Add a new field
  const addField = (type: FieldType) => {
    const newField: TemplateField = {
      id: `field-${Date.now()}`,
      type,
      x: 50, // Center of the page horizontally
      y: 50, // Center of the page vertically
      width: type === 'qrCode' || type === 'signature' || type === 'image' ? 20 : 35,
      height: type === 'qrCode' || type === 'image' ? 20 : 12,
      fontSize: 16,
      fontFamily: 'Helvetica',
      fontWeight: 'normal',
      fontColor: '#000000',
      alignment: 'center',
  };

    console.log('Adding new field:', newField);

    // Use the functional update form to ensure we're working with the latest state
    setFields(prevFields => {
      const updatedFields = [...prevFields, newField];
      console.log('Updated fields after adding:', updatedFields);
      return updatedFields;
  });

    // Select the new field after a short delay to ensure state has updated
    setTimeout(() => {
      selectField(newField.id);
      console.log('Selected new field:', newField);
  }, 50);
};

  // Start dragging a field
  const startDrag = (e: React.MouseEvent, field: TemplateField) => {
    if (!containerRef.current) return;

    // Get the field element
    const fieldElement = document.getElementById(field.id);
    if (!fieldElement) return;

    // Get the page element - now we need to find it inside the relative container
    const pageElement = containerRef.current.querySelector('.react-pdf__Page');
    if (!pageElement) return;

    // Calculate the page rect
    const pageRect = pageElement.getBoundingClientRect();
    console.log('Page rect during drag start:', pageRect);

    // Calculate the mouse position relative to the page
    const mouseX = e.clientX - pageRect.left;
    const mouseY = e.clientY - pageRect.top;

    // Calculate the field position in percentage
    const fieldXPercent = field.x;
    const fieldYPercent = field.y;

    // Convert field percentage to pixels
    const fieldXPixels = (fieldXPercent / 100) * pageRect.width;
    const fieldYPixels = (fieldYPercent / 100) * pageRect.height;

    // Calculate the offset from the mouse to the field position
    const offsetX = mouseX - fieldXPixels;
    const offsetY = mouseY - fieldYPixels;

    console.log('Drag start - Field position:', {fieldXPercent, fieldYPercent, fieldXPixels, fieldYPixels });
    console.log('Drag start - Mouse position:', {mouseX, mouseY });
    console.log('Drag start - Offset:', {offsetX, offsetY });

    // Store the offset for use during dragging
    setDragOffset({x: offsetX, y: offsetY });

    // Set the drag state
    setIsDragging(true);
    setActiveField({...field}); // Create a copy to avoid reference issues
    selectField(field.id);

    // Add visual feedback
    fieldElement.style.cursor = 'grabbing';
    fieldElement.style.zIndex = '1000';
    fieldElement.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
    fieldElement.style.opacity = '0.9';
    fieldElement.style.border = '2px dashed #3b82f6';
    // Disable transitions during drag for better performance
    fieldElement.style.transition = 'none';

    // Prevent default to avoid text selection during drag
    e.preventDefault();
    e.stopPropagation();
};


  // Start resizing a field
  const startResize = (e: React.MouseEvent, field: TemplateField) => {
    e.stopPropagation();
    setIsResizing(true);
    setActiveField(field);
    selectField(field.id);
    console.log('Selected field for resizing:', field);
};

  // Use a ref to store the last animation frame request
  const animationFrameRef = useRef<number | null>(null);

  // Handle mouse move for dragging or resizing
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || (!isDragging && !isResizing) || !activeField) return;

    // Cancel any pending animation frame to avoid multiple updates
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
  }

    // Use requestAnimationFrame for smoother updates
    animationFrameRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      // Get the page element for proper positioning relative to the scaled document
      const pageElement = containerRef.current.querySelector('.react-pdf__Page');
      if (!pageElement) return;

      const pageRect = pageElement.getBoundingClientRect();
      console.log('Page rect during mouse move:', {width: pageRect.width, height: pageRect.height, scale });

      if (isDragging) {
        // Get the mouse position relative to the page
        const mouseX = e.clientX - pageRect.left;
        const mouseY = e.clientY - pageRect.top;

        // Adjust the mouse position by the offset to maintain the same relative position
        const adjustedX = mouseX - dragOffset.x;
        const adjustedY = mouseY - dragOffset.y;

        // Calculate position as percentage of page width/height
        const newX = (adjustedX / pageRect.width) * 100;
        const newY = (adjustedY / pageRect.height) * 100;

        // Apply constraints but don't round values to maintain precision
        const constrainedX = Math.max(0, Math.min(100, newX));
        const constrainedY = Math.max(0, Math.min(100, newY));

        // Update field position directly without recreating the entire array
        // This is more efficient and leads to smoother updates
        setFields(prevFields => {
          return prevFields.map(f =>
            f.id === activeField.id
              ? {...f, x: constrainedX, y: constrainedY }
              : f
          );
      });

        // Make sure the field stays selected
        if (selectedFieldId !== activeField.id) {
          setSelectedFieldId(activeField.id);
      }
    } else if (isResizing) {
        // Calculate new width and height
        const fieldElement = document.getElementById(activeField.id);
        if (!fieldElement) return;

        const fieldRect = fieldElement.getBoundingClientRect();

        // Calculate with high precision
        const newWidth = ((e.clientX - fieldRect.left + fieldRect.width/2) / pageRect.width) * 100;
        const newHeight = ((e.clientY - fieldRect.top + fieldRect.height/2) / pageRect.height) * 100;

        // Apply constraints but maintain precision
        const constrainedWidth = Math.max(5, newWidth);
        const constrainedHeight = Math.max(5, newHeight);

        // Update field size directly without recreating the entire array
        setFields(prevFields => {
          return prevFields.map(f =>
            f.id === activeField.id
              ? {...f, width: constrainedWidth, height: constrainedHeight }
              : f
          );
      });

        // Make sure the field stays selected
        if (selectedFieldId !== activeField.id) {
          setSelectedFieldId(activeField.id);
      }
    }
  });

}, [isDragging, isResizing, activeField, selectedFieldId]);

  // End dragging or resizing
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      console.log('Ended dragging/resizing');

      // Reset cursor and styles on all fields
      fields.forEach(field => {
        const fieldElement = document.getElementById(field.id);
        if (fieldElement) {
          fieldElement.style.cursor = 'grab';
          fieldElement.style.zIndex = selectedFieldId === field.id ? '10' : '1';
          fieldElement.style.boxShadow = '';
          fieldElement.style.opacity = '1';
          fieldElement.style.border = selectedFieldId === field.id ? '2px solid #3b82f6' : '2px solid transparent';
          fieldElement.style.transition = ''; // Re-enable transitions
      }
    });

      // Log the current state for debugging
      console.log('Fields after drag:', fields);
      console.log('Final field positions:', fields.map(f => ({id: f.id, x: f.x, y: f.y })));
  }

    // Reset the drag state
    setIsDragging(false);
    setIsResizing(false);
    setActiveField(null);

    // Keep the field selected so it can be dragged again
    // We don't reset selectedFieldId here
}, [isDragging, isResizing, fields, selectedFieldId]);

  // Update field properties
  const updateFieldProperty = (id: string, property: string, value: any) => {
    console.log(`Updating field ${id}, property ${property} to value:`, value);
    console.log('Current fields before update:', fields);

    const updatedFields = fields.map(field => {
      if (field.id === id) {
        const updatedField = {...field, [property]: value };
        console.log('Updated field:', updatedField);
        return updatedField;
    }
      return field;
  });

    console.log('Updated fields array:', updatedFields);
    setFields(updatedFields);
};

  // Select a field
  const selectField = (id: string) => {
    console.log('Selecting field with ID:', id);
    console.log('Available fields:', fields.map(f => ({id: f.id, type: f.type })));

    // Verify the field exists before selecting it
    const fieldExists = fields.some(field => field.id === id);
    if (fieldExists) {
      setSelectedFieldId(id);
      console.log('Field selected successfully');
  } else {
      console.warn(`Attempted to select field with ID ${id}, but it doesn't exist in the fields array`);
      // If the field doesn't exist but we have fields, select the first one
      if (fields.length > 0) {
        console.log('Selecting first available field instead');
        setSelectedFieldId(fields[0].id);
    }
  }
};

  // Delete a field
  const deleteField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
    setSelectedFieldId(null);
};

  // Get the selected field
  const selectedField = fields.find(field => field.id === selectedFieldId);

  // Debug selected field
  useEffect(() => {
    console.log('Selected field ID changed to:', selectedFieldId);
    console.log('Selected field:', selectedField);
    console.log('All fields:', fields);
}, [selectedFieldId, selectedField, fields]);

  // Handle zoom in/out
  const handleZoomIn = () => {
    console.log('Zooming in');
    setScale(prev => {
      const newScale = Math.min(prev + 0.2, 5);
      console.log(`Zoom scale changing from ${prev} to ${newScale}`);
      return newScale;
  });
};

  const handleZoomOut = () => {
    console.log('Zooming out');
    setScale(prev => {
      const newScale = Math.max(prev - 0.2, 0.5);
      console.log(`Zoom scale changing from ${prev} to ${newScale}`);
      return newScale;
  });
};

  const handleResetZoom = () => {
    console.log('Resetting zoom');
    // Calculate fit scale again
    if (containerRef.current && pageSize.width > 0 && pageSize.height > 0) {
      const containerWidth = containerRef.current.clientWidth - 100;
      const containerHeight = containerRef.current.clientHeight - 100;

      const scaleX = containerWidth / pageSize.width;
      const scaleY = containerHeight / pageSize.height;

      const fitScale = Math.min(scaleX, scaleY, 1.0);
      const newScale = fitScale * 0.9;
      console.log(`Reset zoom to fit: ${newScale}`);
      setScale(newScale);
  } else {
      console.log('Reset zoom to default 1.0');
      setScale(1.0);
  }
};

  // Effect to add and remove mouse event listeners
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging || isResizing) {
        console.log('Global mouse up detected');
        handleMouseUp();
    }
  };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging || isResizing) {
        // Convert the global mouse event to a React mouse event-like object
        handleMouseMove({
          clientX: e.clientX,
          clientY: e.clientY,
          preventDefault: () => e.preventDefault(),
          stopPropagation: () => e.stopPropagation()
      } as any);
    }
  };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
  };
}, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Memoize PDF.js options to prevent unnecessary reloads
  const documentOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/standard_fonts/',
    withCredentials: false,
    disableRange: true,
    disableStream: true,
    disableAutoFetch: true,
}), []);

  // Function to fetch media items
  const fetchMediaItems = async () => {
    setLoadingMedia(true);
    try {
      const mediaCollection = collection(firestore, 'media');
      // Get all media items and filter for images client-side
      const mediaQuery = query(mediaCollection);
      const mediaSnapshot = await getDocs(mediaQuery);

      const items: MediaItem[] = [];
      mediaSnapshot.forEach(doc => {
        const data = doc.data();
        // Only include image files
        if (data.type && data.type.startsWith('image/')) {
          items.push({
            id: doc.id,
            name: data.name,
            url: data.url,
            path: data.path,
            type: data.type,
            size: data.size,
            createdAt: data.createdAt,
            category: data.category,
            usage: data.usage,
            metadata: data.metadata,
        });
      }
    });

      setMediaItems(items);
  } catch (error) {
      console.error('Error fetching media items:', error);
  } finally {
      setLoadingMedia(false);
  }
};

  // Handle image selection
  const handleImageSelect = (imageUrl: string) => {
    if (selectedField && selectedField.type === 'image') {
      updateFieldProperty(selectedField.id, 'imageUrl', imageUrl);
      setShowMediaSelector(false);
  }
};

  // Fetch media items when the media selector is opened
  useEffect(() => {
    if (showMediaSelector) {
      fetchMediaItems();
  }
}, [showMediaSelector]);

  // Initialize fields when the component loads or when initialFields change
  useEffect(() => {
    console.log('PdfTemplateFieldPlacer - Initial fields received:', initialFields);

    // Always set fields from initialFields if they exist, regardless of current fields state
    if (initialFields && initialFields.length > 0) {
      console.log('PdfTemplateFieldPlacer - Setting fields from initialFields:', initialFields);

      // Create a deep copy of initialFields to ensure we're not working with references
      const fieldsCopy = initialFields.map(field => ({...field }));
      setFields(fieldsCopy);

      // Select the first field by default
      selectField(initialFields[0].id);
      console.log('Selected first field from initialFields:', initialFields[0]);
  } else if (pdfLoaded && fields.length === 0) {
      // Add a student name field by default if no fields exist
      const defaultField = {
        id: `field-${Date.now()}`,
        type: 'studentName' as FieldType,
        x: 50, // Center of the page horizontally
        y: 50, // Center of the page vertically
        width: 35,
        height: 12,
        fontSize: 16,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        fontColor: '#000000',
        alignment: 'center' as 'left' | 'center' | 'right',
    };

      console.log('PdfTemplateFieldPlacer - Adding default field:', defaultField);
      setFields([defaultField]);
      selectField(defaultField.id);
      console.log('Selected default field:', defaultField);
  }
}, [initialFields, pdfLoaded]); // Only depend on initialFields and pdfLoaded, not fields

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <span className="mr-1">-</span> Zoom Out
          </Button>
          <Button size="sm" variant="outline" onClick={handleResetZoom}>
            Reset Zoom
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <span className="mr-1">+</span> Zoom In
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setPreviewLoading(true);
              setShowPreview(true);
          }}
          >
            <span className="mr-1">👁️</span> Preview
          </Button>

        </div>
        <div>
          {numPages && (
            <span className="text-sm text-neutral-600">
              Page {pageNumber} of {numPages}
            </span>
          )}
        </div>
      </div>



      <div className="flex flex-1 gap-4 min-h-[600px]">
        {/* PDF Viewer with Fields */}
        <div
          className="flex-1 border border-neutral-200 rounded-lg bg-neutral-50 relative min-h-full"
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{overflow: 'auto', maxWidth: '100%'}}
        >
          <div className="p-8 flex justify-center items-center" style={{minWidth: 'max-content', minHeight: '100%', width: 'fit-content'}}>
          {pdfError ? (
            <div className="flex items-center justify-center h-full p-4 text-red-600">
              {pdfError}
            </div>
          ) : (
            <div style={{width: 'max-content', minWidth: '100%'}}>
              <Document
                file={processedPdfUrl}
                onLoadSuccess={({numPages }) => {
                  setNumPages(numPages);
                  setPdfLoaded(true);
                  setPdfError(null);
                  console.log(`PDF loaded with ${numPages} pages`);
                  console.log('Current fields when PDF loaded:', fields);
                  console.log('Initial fields provided to component:', initialFields);
              }}
                onLoadError={onDocumentLoadError}
                className="flex flex-col items-center justify-center"
                options={documentOptions}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
              }
              >
                {pdfLoaded && (
                  <div className="relative flex justify-center items-center mx-auto" style={{padding: '20px', width: 'max-content'}}>
                    <div className="relative" style={{display: 'inline-block', minWidth: 'max-content'}}>
                      <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        onLoadSuccess={onPageLoadSuccess}
                        className="relative shadow-lg mx-auto"
                        loading={
                          <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                          </div>
                      }
                      />

                      {/* Render fields inside the Page container to ensure proper scaling */}
                      {fields.length === 0 && (
                        <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-yellow-800 p-2 text-center text-sm">
                          No fields added yet. Click on a field type in the panel to add it to the certificate.
                        </div>
                      )}
                      {fields.map(field => (
                        <div
                          id={field.id}
                          key={field.id}
                          className={`absolute border-2 cursor-grab hover:shadow-lg transition-all duration-75 flex items-center justify-center ${
                            selectedFieldId === field.id
                              ? 'border-blue-500'
                              : 'border-transparent hover:border-blue-300'
                        }`}
                          style={{
                            left: `${field.x}%`,
                            top: `${field.y}%`,
                            width: `${field.width}%`,
                            height: `${field.height}%`,
                            backgroundColor: `${selectedFieldId === field.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                            transform: 'none',
                            transformOrigin: 'top left',
                            touchAction: 'none', /* Prevents touch scrolling while dragging */
                            userSelect: 'none', /* Prevents text selection */
                            cursor: 'grab', /* Explicitly set cursor */
                            zIndex: selectedFieldId === field.id ? '10' : '1',
                            transition: isDragging && activeField?.id === field.id ? 'none' : 'all 0.05s ease-out'
                        }}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectField(field.id);
                            console.log('Selected field:', field);
                        }}
                          onMouseDown={(e) => startDrag(e, field)}
                          onTouchStart={(e) => {
                            const touch = e.touches[0];
                            startDrag({clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => e.preventDefault(), stopPropagation: () => e.stopPropagation() } as any, field);
                        }}
                          draggable="false"
                        >
                          <div
                            className="p-1 text-xs font-medium text-white bg-blue-500 absolute top-0 left-0 right-0 flex justify-between items-center cursor-grab"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectField(field.id);
                              console.log('Selected field from header:', field);
                          }}
                            onMouseDown={(e) => startDrag(e, field)}
                          >
                            <span>{fieldTypes.find(f => f.type === field.type)?.label || field.type}</span>
                            <span className="text-xs opacity-75">⋮⋮</span>
                          </div>

                          {/* Drag indicator in the center */}
                          <div
                            className="absolute inset-0 flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectField(field.id);
                              console.log('Selected field from center:', field);
                          }}
                          >
                            {selectedFieldId !== field.id && (
                              <div className="bg-blue-100 rounded-full p-2 text-blue-500 opacity-70">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Resize handle */}
                          <div
                            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectField(field.id);
                              console.log('Selected field from resize handle:', field);
                          }}
                            onMouseDown={(e) => startResize(e, field)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Document>
            </div>
          )}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-80 flex flex-col border border-neutral-200 rounded-lg bg-white">
          <div className="p-4 border-b border-neutral-200">
            <h3 className="text-lg font-medium">Field Properties</h3>
          </div>

          <div className="p-4 flex-1 overflow-auto">
            {/* Always show Add Fields section */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-3">Add Fields to Certificate</h4>
              <p className="text-xs text-neutral-500 mb-4">
                Click a button below to add a field to your certificate template. Then drag it to position it correctly.
              </p>
              <div className="grid grid-cols-1 gap-2 mb-4">
                {fieldTypes.map(({type, label, color }) => (
                  <button
                    key={type}
                    className="px-3 py-2 text-sm rounded-md text-white flex items-center justify-between"
                    style={{backgroundColor: color }}
                    onClick={() => addField(type)}
                  >
                    <span>{label}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Field Selection Dropdown */}
            <div className="border-t border-neutral-200 pt-4 mb-4">
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Select Field to Edit
              </label>
              <select
                value={selectedFieldId || ''}
                onChange={(e) => e.target.value && selectField(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-neutral-300 rounded-md mb-2"
              >
                <option value="" disabled>Select a field...</option>
                {fields.map(field => (
                  <option key={field.id} value={field.id}>
                    {fieldTypes.find(f => f.type === field.type)?.label || field.type}
                  </option>
                ))}
              </select>
            </div>

            {/* Show Field Properties when a field is selected */}
            {selectedField ? (
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium">Edit Field: {fieldTypes.find(f => f.type === selectedField.type)?.label}</h4>
                  <button
                    className="text-red-600 text-xs hover:text-red-800"
                    onClick={() => deleteField(selectedField.id)}
                  >
                    Delete Field
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Position */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Position (X, Y)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={'Math.round(selectedField.x * 10) / 10'}
                        onChange={(e) => updateFieldProperty(selectedField.id, 'x', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-neutral-300 rounded-md"
                        step="0.1"
                      />
                      <input
                        type="number"
                        value={'Math.round(selectedField.y * 10) / 10'}
                        onChange={(e) => updateFieldProperty(selectedField.id, 'y', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-neutral-300 rounded-md"
                        step="0.1"
                      />
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Size (Width, Height)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={'Math.round(selectedField.width * 10) / 10'}
                        onChange={(e) => updateFieldProperty(selectedField.id, 'width', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-neutral-300 rounded-md"
                        step="0.1"
                      />
                      <input
                        type="number"
                        value={'Math.round(selectedField.height * 10) / 10'}
                        onChange={(e) => updateFieldProperty(selectedField.id, 'height', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 text-sm border border-neutral-300 rounded-md"
                        step="0.1"
                      />
                    </div>
                  </div>

                  {/* Font properties (for text fields) */}
                  {selectedField.type !== 'qrCode' && selectedField.type !== 'signature' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Font Size
                        </label>
                        <input
                          type="number"
                          value={selectedField.fontSize || 16}
                          onChange={(e) => updateFieldProperty(selectedField.id, 'fontSize', parseInt(e.target.value))}
                          className="w-full px-2 py-1 text-sm border border-neutral-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Font Family
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={selectedField.fontFamily || 'Helvetica'}
                            onChange={(e) => {
                              updateFieldProperty(selectedField.id, 'fontFamily', e.target.value);
                              setSelectedFontPreview(e.target.value);
                              setShowFontPreview(true);
                              // No auto-hide timeout - modal stays open until manually closed
                          }}
                            className="w-full px-2 py-1 text-sm border border-neutral-300 rounded-md"
                          >
                            <optgroup label="Standard Fonts">
                              <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                              <option value="'Times New Roman', Times, serif">Times New Roman</option>
                              <option value="'Courier New', Courier, monospace">Courier New</option>
                              <option value="Arial, Helvetica, sans-serif">Arial</option>
                              <option value="Verdana, Geneva, sans-serif">Verdana</option>
                              <option value="Georgia, serif">Georgia</option>
                              <option value="'Trebuchet MS', Helvetica, sans-serif">Trebuchet MS</option>
                            </optgroup>
                            <optgroup label="Elegant Formal Script Fonts (Similar to Edwardian)">
                              <option value="'Monte Carlo Pro', 'Edwardian Script ITC', cursive">Monte Carlo Pro</option>
                              <option value="'Edwardian Script ITC', 'Snell Roundhand', 'Monotype Corsiva', cursive">Edwardian Script ITC</option>
                              <option value="'English 157', 'Edwardian Script ITC', 'Snell Roundhand', cursive">English 157</option>
                              <option value="'Shelley Allegro', 'Edwardian Script ITC', 'Snell Roundhand', cursive">Shelley Allegro</option>
                              <option value="'Shelley Volante', 'Edwardian Script ITC', 'Snell Roundhand', cursive">Shelley Volante</option>
                              <option value="'Rage Italic', 'Edwardian Script ITC', 'Snell Roundhand', cursive">Rage Italic</option>
                              <option value="'Palace Script MT', 'Edwardian Script ITC', 'Snell Roundhand', cursive">Palace Script MT</option>
                              <option value="'Kuenstler Script', 'Edwardian Script ITC', 'Snell Roundhand', cursive">Kuenstler Script</option>
                              <option value="'Kunstler Script', 'Edwardian Script ITC', 'Snell Roundhand', cursive">Kunstler Script</option>
                              <option value="'Snell Roundhand', 'Edwardian Script ITC', 'Monotype Corsiva', cursive">Snell Roundhand</option>
                              <option value="'Vivaldi', 'Edwardian Script ITC', 'Snell Roundhand', cursive">Vivaldi</option>
                              <option value="'Zapfino', 'Edwardian Script ITC', 'Snell Roundhand', cursive">Zapfino</option>
                              <option value="'Bickham Script Pro', 'Edwardian Script ITC', 'Snell Roundhand', cursive">Bickham Script Pro</option>
                              <option value="'Lavanderia', 'Edwardian Script ITC', 'Snell Roundhand', cursive">Lavanderia</option>
                              <option value="'Scriptina', 'Edwardian Script ITC', 'Snell Roundhand', cursive">Scriptina</option>
                              <option value="'Coronet', 'Edwardian Script ITC', 'Snell Roundhand', cursive">Coronet</option>
                            </optgroup>
                            <optgroup label="Other Script/Cursive Fonts">
                              <option value="'Brush Script MT', 'Edwardian Script ITC', cursive">Brush Script MT</option>
                              <option value="'Lucida Handwriting', 'Edwardian Script ITC', cursive">Lucida Handwriting</option>
                              <option value="'Segoe Script', 'Edwardian Script ITC', cursive">Segoe Script</option>
                              <option value="'Monotype Corsiva', 'Edwardian Script ITC', cursive">Monotype Corsiva</option>
                              <option value="'Freestyle Script', 'Edwardian Script ITC', cursive">Freestyle Script</option>
                              <option value="'Zapf Chancery', 'Edwardian Script ITC', cursive">Zapf Chancery</option>
                              <option value="'Dancing Script', 'Edwardian Script ITC', cursive">Dancing Script</option>
                              <option value="'Great Vibes', 'Edwardian Script ITC', cursive">Great Vibes</option>
                              <option value="'Pacifico', 'Edwardian Script ITC', cursive">Pacifico</option>
                              <option value="'Satisfy', 'Edwardian Script ITC', cursive">Satisfy</option>
                              <option value="'Tangerine', 'Edwardian Script ITC', cursive">Tangerine</option>
                              <option value="'Allura', 'Edwardian Script ITC', cursive">Allura</option>
                              <option value="'Pinyon Script', 'Edwardian Script ITC', cursive">Pinyon Script</option>
                              <option value="'Alex Brush', 'Edwardian Script ITC', cursive">Alex Brush</option>
                              <option value="'Petit Formal Script', 'Edwardian Script ITC', cursive">Petit Formal Script</option>
                              <option value="'Mr De Haviland', 'Edwardian Script ITC', cursive">Mr De Haviland</option>
                              <option value="'Herr Von Muellerhoff', 'Edwardian Script ITC', cursive">Herr Von Muellerhoff</option>
                              <option value="'Lovers Quarrel', 'Edwardian Script ITC', cursive">Lovers Quarrel</option>
                              <option value="'Rouge Script', 'Edwardian Script ITC', cursive">Rouge Script</option>
                              <option value="'Edwardian Script ITC', cursive">Generic Cursive</option>
                            </optgroup>
                            <optgroup label="Calligraphic Certificate Fonts">
                              <option value="'Nuptial Script', 'Edwardian Script ITC', cursive">Nuptial Script</option>
                              <option value="'Calligraphy', 'Edwardian Script ITC', cursive">Calligraphy</option>
                              <option value="'Baroque Script', 'Edwardian Script ITC', cursive">Baroque Script</option>
                              <option value="'Formal Script', 'Edwardian Script ITC', cursive">Formal Script</option>
                              <option value="'Adine Kirnberg', 'Edwardian Script ITC', cursive">Adine Kirnberg</option>
                              <option value="'Amazone BT', 'Edwardian Script ITC', cursive">Amazone BT</option>
                              <option value="'Ballantines Script EF', 'Edwardian Script ITC', cursive">Ballantines Script</option>
                              <option value="'Berthold Script', 'Edwardian Script ITC', cursive">Berthold Script</option>
                              <option value="'Cataneo BT', 'Edwardian Script ITC', cursive">Cataneo BT</option>
                              <option value="'Citadel Script', 'Edwardian Script ITC', cursive">Citadel Script</option>
                              <option value="'Exmouth', 'Edwardian Script ITC', cursive">Exmouth</option>
                              <option value="'Freehand 575', 'Edwardian Script ITC', cursive">Freehand 575</option>
                              <option value="'Kaufmann', 'Edwardian Script ITC', cursive">Kaufmann</option>
                            </optgroup>
                            <optgroup label="Formal/Certificate Fonts">
                              <option value="Copperplate, 'Copperplate Gothic Light', serif">Copperplate</option>
                              <option value="'Trajan Pro', 'Times New Roman', serif">Trajan Pro</option>
                              <option value="Baskerville, 'Baskerville Old Face', 'Hoefler Text', Garamond, 'Times New Roman', serif">Baskerville</option>
                              <option value="Garamond, 'Hoefler Text', 'Times New Roman', serif">Garamond</option>
                              <option value="Palatino, 'Palatino Linotype', 'Palatino LT STD', 'Book Antiqua', Georgia, serif">Palatino</option>
                              <option value="'Book Antiqua', Palatino, 'Palatino Linotype', serif">Book Antiqua</option>
                              <option value="'Goudy Old Style', Garamond, 'Big Caslon', 'Times New Roman', serif">Goudy Old Style</option>
                              <option value="Didot, 'Didot LT STD', 'Hoefler Text', Garamond, 'Times New Roman', serif">Didot</option>
                              <option value="'Bodoni MT', Didot, 'Didot LT STD', 'Book Antiqua', Garamond, 'Times New Roman', serif">Bodoni</option>
                              <option value="'Century Schoolbook', 'New Century Schoolbook', Century, serif">Century Schoolbook</option>
                            </optgroup>
                          </select>
                          <button
                            type="button"
                            className="px-2 py-1 text-sm border border-neutral-300 rounded-md bg-neutral-50 hover:bg-neutral-100"
                            onClick={() => {
                              setSelectedFontPreview(selectedField.fontFamily || 'Helvetica');
                              setShowFontPreview(true);
                          }}
                            title="Preview Font"
                          >
                            <span role="img" aria-label="Preview">👁️</span>
                          </button>
                        </div>

                        {/* Font Preview */}
                        {showFontPreview && (
                          <div className="mt-2 p-3 border border-neutral-200 rounded-md bg-neutral-50">
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-xs text-neutral-500">Font Preview:</p>
                              <button
                                onClick={() => setShowFontPreview(false)}
                                className="text-neutral-400 hover:text-neutral-600"
                                title="Close Preview"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <p
                              className="text-lg"
                              style={{
                                fontFamily: selectedFontPreview,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                            >
                              The quick brown fox jumps over the lazy dog
                            </p>
                            <p
                              className="text-2xl mt-1"
                              style={{
                                fontFamily: selectedFontPreview,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                            >
                              ABCDEFGHIJKLM
                            </p>
                            <div className="mt-2 border-t border-neutral-200 pt-2">
                              <p
                                className="text-3xl"
                                style={{
                                  fontFamily: selectedFontPreview,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  lineHeight: 1.5
                              }}
                              >
                                Certificate of Achievement
                              </p>
                              <p
                                className="text-xl mt-1"
                                style={{
                                  fontFamily: selectedFontPreview,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                              }}
                              >
                                John Smith
                              </p>
                            </div>
                            <div className="mt-2 pt-2 border-t border-neutral-200 text-xs text-neutral-500">
                              <p>Want more elegant fonts? <a href="https://fonts.google.com/?category=Handwriting&sort=popularity&stylecount=1" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Browse Google Fonts</a></p>
                              <p className="mt-1">Try these elegant Google Fonts: <span className="text-neutral-700">Great Vibes, Tangerine, Alex Brush, Pinyon Script, Allura, Dancing Script</span></p>
                              <p className="mt-1">To use Google Fonts, add the font name followed by a fallback: <code className="bg-neutral-200 px-1 rounded">"Font Name, cursive"</code></p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Font Weight
                        </label>
                        <select
                          value={selectedField.fontWeight || 'normal'}
                          onChange={(e) => updateFieldProperty(selectedField.id, 'fontWeight', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-neutral-300 rounded-md"
                        >
                          <option value="normal">Normal</option>
                          <option value="bold">Bold</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Text Color
                        </label>
                        <input
                          type="color"
                          value={selectedField.fontColor || '#000000'}
                          onChange={(e) => updateFieldProperty(selectedField.id, 'fontColor', e.target.value)}
                          className="w-full h-8 px-1 py-1 border border-neutral-300 rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Text Alignment
                        </label>
                        <select
                          value={selectedField.alignment || 'left'}
                          onChange={(e) => updateFieldProperty(
                            selectedField.id,
                            'alignment',
                            e.target.value as 'left' | 'center' | 'right'
                          )}
                          className="w-full px-2 py-1 text-sm border border-neutral-300 rounded-md"
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Field-specific properties for image fields */}
                  {selectedField.type === 'image' && (
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Image
                      </label>

                      {selectedField.imageUrl ? (
                        <div className="mb-2 p-2 border border-neutral-200 rounded-md bg-neutral-50">
                          <div className="aspect-w-16 aspect-h-9 mb-2">
                            <img
                              src={selectedField.imageUrl}
                              alt="Selected image"
                              className="object-contain w-full h-full rounded-md"
                            />
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-500 truncate max-w-[180px]">
                              {selectedField.imageUrl.split('/').pop()}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateFieldProperty(selectedField.id, 'imageUrl', '')}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-4 border border-dashed border-neutral-300 rounded-md bg-neutral-50 hover:bg-neutral-100 cursor-pointer"
                             onClick={() => setShowMediaSelector(true)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-1 text-sm text-neutral-600">Click to select an image</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-t border-neutral-200 pt-4 text-center p-4">
                <p className="text-neutral-500">Select a field to edit its properties</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-neutral-200 flex justify-end space-x-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button variant="primary" onClick={() => onSave(fields)}>
              Save Template
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Certificate Preview</h3>
                <p className="text-sm text-neutral-500 mt-1">This is how the certificate will look with sample data</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="flex justify-center">
                <div className="relative" style={{display: 'inline-block'}}>
                  {/* PDF Document */}
                  <Document
                    file={processedPdfUrl}
                    className="flex flex-col items-center justify-center"
                    options={documentOptions}
                    onLoadSuccess={() => setPreviewLoading(false)}
                    loading={
                      <div className="flex items-center justify-center h-64 w-full">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-neutral-600">Loading preview...</p>
                        </div>
                      </div>
                  }
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      className="shadow-lg"
                    />

                    {/* Render fields in preview mode (no editing controls) */}
                    {fields.map(field => {
                      // Determine what to render based on field type
                      let content;
                      let customStyles = {};

                      // Get the font family for this field or use a default
                      const fieldFont = field.fontFamily || "'Helvetica', 'Arial', 'sans-serif'";

                      switch(field.type) {
                        case 'studentName':
                          content = 'John Doe';
                          break;
                        case 'courseName':
                          content = 'LIPS Sales System';
                          break;
                        case 'completionDate':
                          content = new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                          break;
                        case 'certificateId':
                          content = 'CERT-12345-6789';
                          break;
                        case 'signature':
                          content = (
                            <div className="w-full h-full flex items-end justify-center">
                              <div className="text-center" style={{fontFamily: fieldFont }}>
                                <div style={{fontSize: `${(field.fontSize || 16) * 1.2}px` }}>John Smith</div>
                                <div className="border-t border-black mt-1" style={{width: '100%'}}></div>
                              </div>
                            </div>
                          );
                          customStyles = {display: 'block'};
                          break;
                        case 'qrCode':
                          content = (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-100 border border-neutral-300">
                              <svg viewBox="0 0 100 100" className="w-3/4 h-3/4">
                                <path d="M30,30 L30,70 L70,70 L70,30 Z" stroke="black" strokeWidth="5" fill="none" />
                                <path d="M40,40 L40,60 L60,60 L60,40 Z" stroke="black" strokeWidth="5" fill="none" />
                                <path d="M50,20 L50,80" stroke="black" strokeWidth="2" />
                                <path d="M20,50 L80,50" stroke="black" strokeWidth="2" />
                              </svg>
                            </div>
                          );
                          break;
                        case 'issuerName':
                          content = 'Closer College';
                          break;
                        case 'issuerTitle':
                          content = 'CEO';
                          break;
                        case 'image':
                          if (field.imageUrl) {
                            content = (
                              <div className="w-full h-full flex items-center justify-center">
                                <img
                                  src={field.imageUrl}
                                  alt="Certificate image"
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                            );
                        } else {
                            content = (
                              <div className="w-full h-full flex items-center justify-center bg-neutral-100 border border-neutral-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3/4 h-3/4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            );
                        }
                          break;
                        default:
                          content = field.type;
                    }

                      // Special handling for signature field with script fonts
                      if (field.type === 'signature' && typeof content === 'string') {
                        // Use the field's font for the signature
                        content = (
                          <div className="w-full h-full flex items-end justify-center">
                            <div className="text-center" style={{fontFamily: fieldFont }}>
                              <div style={{fontSize: `${(field.fontSize || 16) * 1.5}px`, lineHeight: '1'}}>John Smith</div>
                              <div className="border-t border-black mt-1" style={{width: '100%'}}></div>
                            </div>
                          </div>
                        );
                        customStyles = {display: 'block'};
                    }

                      return (
                        <div
                          key={field.id}
                          className="absolute flex items-center justify-center"
                          style={{
                            left: `${field.x}%`,
                            top: `${field.y}%`,
                            width: `${field.width}%`,
                            height: `${field.height}%`,
                            fontFamily: fieldFont,
                            fontSize: `${field.fontSize || 16}px`,
                            fontWeight: field.fontWeight || 'normal',
                            color: field.fontColor || '#000000',
                            textAlign: field.alignment || 'center',
                            ...customStyles
                        }}
                        >
                          {content}
                        </div>
                      );
                  })}
                  </Document>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-between items-center">
              <div className="text-sm text-neutral-500">
                <span className="font-medium">Note:</span> Field positions and sizes will be maintained when generating actual certificates.
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Continue Editing
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowPreview(false);
                    onSave(fields);
                }}
                >
                  Save Template
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Select an Image</h3>
                <p className="text-sm text-neutral-500 mt-1">Choose an image from your media library</p>
              </div>
              <button
                onClick={() => setShowMediaSelector(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {loadingMedia ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-neutral-600">Loading images...</p>
                  </div>
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-neutral-600 mb-2">No images found in your media library</p>
                  <p className="text-sm text-neutral-500">
                    Upload images in the <a href="/admin/media" target="_blank" className="text-blue-500 hover:underline">Media Manager</a>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaItems.map(item => (
                    <div
                      key={item.id}
                      className="border border-neutral-200 rounded-md overflow-hidden hover:border-primary cursor-pointer transition-colors"
                      onClick={() => {
                        if (selectedField) {
                          updateFieldProperty(selectedField.id, 'imageUrl', item.url);
                          setShowMediaSelector(false);
                      }
                    }}
                    >
                      <div className="aspect-w-16 aspect-h-9 bg-neutral-100">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-neutral-700 truncate">{item.name}</p>
                        <p className="text-xs text-neutral-500 truncate">
                          {item.category && (
                            <span className="inline-block mr-1">
                              {item.category === 'signature' ? '✍️' :
                               item.category === 'logo' ? '🏢' :
                               item.category === 'course' ? '📚' : '🖼️'}
                            </span>
                          )}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-neutral-200 flex justify-between items-center">
              <div className="text-sm text-neutral-500">
                <span className="font-medium">Tip:</span> Upload more images in the Media Manager
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowMediaSelector(false)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('/admin/media', '_blank')}
                >
                  Open Media Manager
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfTemplateFieldPlacer;
