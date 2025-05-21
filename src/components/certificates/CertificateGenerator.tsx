import React, {useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import {jsPDF } from 'jspdf';
import Button from '../ui/Button';
import {getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {storage } from '@/services/firebase';
import QRCode from 'qrcode';

// Import HTML Image constructor to avoid conflict with next/image
const HTMLImage = typeof window !== 'undefined' ? window.Image : null;

interface CertificateTemplate {
  id: string;
  name: string;
  backgroundUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

interface CertificateGeneratorProps {
  userName: string;
  courseName: string;
  completionDate: Date;
  certificateId: string;
  onGenerate: (pdfUrl: string) => void;
  autoGenerate?: boolean;
  className?: string;
  signatureUrl?: string;
  template?: CertificateTemplate;
  allowCustomization?: boolean;
  onSave?: (certificateData: {
    pdfUrl: string;
    certificateId: string;
    template: string;
    signatureUrl?: string;
}) => Promise<void>;
}

// Default certificate templates
const certificateTemplates: CertificateTemplate[] = [
  {
    id: 'default',
    name: 'Classic Blue',
    primaryColor: '#0e0e4f', // Dark blue
    secondaryColor: '#8a0200', // Dark red
    fontFamily: 'helvetica',
},
  {
    id: 'modern',
    name: 'Modern Green',
    primaryColor: '#1a5d1a', // Dark green
    secondaryColor: '#4d4d4d', // Dark gray
    fontFamily: 'helvetica',
},
  {
    id: 'elegant',
    name: 'Elegant Gold',
    primaryColor: '#8b7500', // Gold
    secondaryColor: '#2d2d2d', // Almost black
    fontFamily: 'times',
},
  {
    id: 'professional',
    name: 'Professional Gray',
    primaryColor: '#2c3e50', // Dark blue-gray
    secondaryColor: '#e74c3c', // Red accent
    fontFamily: 'helvetica',
},
  {
    id: 'minimal',
    name: 'Minimal Black',
    primaryColor: '#000000', // Black
    secondaryColor: '#666666', // Dark gray
    fontFamily: 'helvetica',
},
];

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  userName,
  courseName,
  completionDate,
  certificateId,
  onGenerate,
  autoGenerate = false,
  className = '',
  signatureUrl,
  template,
  allowCustomization = false,
  onSave,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate>(
    template || certificateTemplates[0]
  );
  const [customSignatureUrl, setCustomSignatureUrl] = useState<string | undefined>(signatureUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
  });
};

  // Handle signature image upload
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('image/')) {
      setUploadError('Please upload an image file');
      return;
  }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image size should be less than 2MB');
      return;
  }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Create a reference to the storage location
      const storageRef = ref(storage, `certificates/signatures/${Date.now()}_${file.name}`);

      // Upload the file
      await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);
      setCustomSignatureUrl(downloadUrl);
  } catch (error) {
      console.error('Error uploading signature:', error);
      setUploadError('Failed to upload signature. Please try again.');
  } finally {
      setIsUploading(false);
  }
};

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    const template = certificateTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
  }
};

  // Parse color string to RGB values
  const parseColor = (color: string): {r: number, g: number, b: number } => {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return {r, g, b };
  }

    // Default fallback
    return {r: 0, g: 0, b: 0 };
};

  // Generate PDF certificate
  const generateCertificate = async () => {
    setIsGenerating(true);

    try {
      // Parse colors
      const primaryColor = parseColor(selectedTemplate.primaryColor);
      const secondaryColor = parseColor(selectedTemplate.secondaryColor);

      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    });

      // Set background color
      doc.setFillColor(240, 240, 255);
      doc.rect(0, 0, 297, 210, 'F');

      // Add background image if available
      if (selectedTemplate.backgroundUrl && HTMLImage) {
        try {
          const img = new HTMLImage();
          img.src = selectedTemplate.backgroundUrl;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            // Set a timeout to prevent hanging if image doesn't load
            setTimeout(reject, 10000);
        });

          // Add the image with proper positioning and sizing
          // Use the full page dimensions (297mm x 210mm for A4 landscape)
          doc.addImage(img, 'PNG', 0, 0, 297, 210);

          // Add a subtle overlay to ensure text readability
          doc.setFillColor(255, 255, 255);
          // Use opacity in the fill style instead of setGlobalAlpha
          const opacity = 0.15;
          doc.setFillColor(255, 255, 255, opacity);
          doc.rect(0, 0, 297, 210, 'F');
          doc.setFillColor(255, 255, 255, 1.0); // Reset opacity
      } catch (err) {
          console.error('Error adding background image:', err);
          // Fallback to a gradient background
          doc.setFillColor(240, 240, 255);
          doc.rect(0, 0, 297, 210, 'F');
      }
    } else {
        // Default background if no image is provided
        doc.setFillColor(240, 240, 255);
        doc.rect(0, 0, 297, 210, 'F');
    }

      // Add border
      doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.setLineWidth(5);
      doc.rect(10, 10, 277, 190);

      // Add decorative elements
      doc.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
      doc.setLineWidth(2);
      doc.rect(15, 15, 267, 180);

      // Add header
      doc.setFont(selectedTemplate.fontFamily, 'bold');
      doc.setFontSize(30);
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text('CERTIFICATE OF COMPLETION', 148.5, 40, {align: 'center'});

      // Add line separator
      doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.setLineWidth(1);
      doc.line(74, 45, 223, 45);

      // Add certificate text
      doc.setFont(selectedTemplate.fontFamily, 'normal');
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text('This is to certify that', 148.5, 70, {align: 'center'});

      // Add name
      doc.setFont(selectedTemplate.fontFamily, 'bold');
      doc.setFontSize(24);
      doc.setTextColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
      doc.text(userName, 148.5, 85, {align: 'center'});

      // Add course completion text
      doc.setFont(selectedTemplate.fontFamily, 'normal');
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text('has successfully completed the course', 148.5, 100, {align: 'center'});

      // Add course name
      doc.setFont(selectedTemplate.fontFamily, 'bold');
      doc.setFontSize(20);
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text(courseName, 148.5, 115, {align: 'center'});

      // Add completion date
      doc.setFont(selectedTemplate.fontFamily, 'normal');
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text(`Completed on: ${formatDate(completionDate)}`, 148.5, 135, {align: 'center'});

      // Add certificate ID
      doc.setFontSize(10);
      doc.text(`Certificate ID: ${certificateId}`, 148.5, 145, {align: 'center'});

      // Add QR code for certificate verification
      try {
        // Generate QR code for verification URL
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
        const verificationUrl = `${origin}/verify-certificate?id=${certificateId}`;
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 100,
          color: {
            dark: '#000000',
            light: '#ffffff'
        }
      });

        // Add QR code to the certificate (bottom right corner)
        const qrSize = 25; // 25mm
        doc.addImage(qrCodeDataUrl, 'PNG', 260, 175, qrSize, qrSize);

        // Add verification text
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Scan to verify', 260 + (qrSize / 2), 175 + qrSize + 5, {align: 'center'});
        doc.setTextColor(0, 0, 0); // Reset text color
    } catch (err) {
        console.error('Error generating QR code:', err);
    }

      // Add signature
      if (customSignatureUrl && HTMLImage) {
        try {
          const img = new HTMLImage();
          img.src = customSignatureUrl;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            // Set a timeout to prevent hanging if image doesn't load
            setTimeout(reject, 10000);
        });

          // Calculate optimal signature size and position
          // Signature should be proportional but not too large
          const maxWidth = 60; // Maximum width in mm
          const maxHeight = 20; // Maximum height in mm

          // Calculate dimensions while maintaining aspect ratio
          let imgWidth = maxWidth;
          let imgHeight = (img.height / img.width) * imgWidth;

          // If height exceeds max, scale down proportionally
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight;
            imgWidth = (img.width / img.height) * imgHeight;
        }

          // Position signature centered horizontally, at a fixed vertical position
          const signatureX = 148.5 - (imgWidth / 2); // Center horizontally
          const signatureY = 155; // Fixed vertical position

          // Add the signature image
          doc.addImage(img, 'PNG', signatureX, signatureY, imgWidth, imgHeight);

          // Add a small line below the signature for visual appeal
          doc.setDrawColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
          doc.setLineWidth(0.3);
          doc.line(signatureX, signatureY + imgHeight + 2, signatureX + imgWidth, signatureY + imgHeight + 2);
      } catch (err) {
          console.error('Error adding signature image:', err);
          // Fallback to signature line if image fails
          doc.setDrawColor(100, 100, 100);
          doc.setLineWidth(0.5);
          doc.line(90, 165, 207, 165);
      }
    } else {
        // Add signature line
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.5);
        doc.line(90, 165, 207, 165);
    }

      // Add signature text
      doc.setFontSize(12);
      doc.text('Authorized Signature', 148.5, 175, {align: 'center'});

      // Add footer with company name
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Closer College - AI-powered Sales Training', 148.5, 190, {align: 'center'});

      // Convert to data URL
      const pdfDataUrl = doc.output('dataurlstring');
      setPdfUrl(pdfDataUrl);
      onGenerate(pdfDataUrl);

      // Save certificate data if onSave is provided
      if (onSave) {
        await onSave({
          pdfUrl: pdfDataUrl,
          certificateId,
          template: selectedTemplate.id,
          signatureUrl: customSignatureUrl,
      });
    }
  } catch (error) {
      console.error('Error generating certificate:', error);
  } finally {
      setIsGenerating(false);
  }
};

  // Auto-generate certificate if enabled
  useEffect(() => {
    if (autoGenerate && !pdfUrl) {
      generateCertificate();
  }
}, [autoGenerate]);

  return (
    <div className={className}>
      {/* Certificate Customization Options */}
      {allowCustomization && !autoGenerate && (
        <div className="mb-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <h3 className="text-lg font-medium mb-4">Certificate Options</h3>

          {/* Template Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Certificate Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {certificateTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    selectedTemplate.id === template.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-primary-300'
                }`}
                  onClick={() => handleTemplateChange(template.id)}
                >
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{backgroundColor: template.primaryColor }}
                    ></div>
                    <span className="font-medium">{template.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Signature Image (Optional)
            </label>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Signature'}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleSignatureUpload}
              />
              {customSignatureUrl && (
                <button
                  className="text-red-600 text-sm hover:text-red-800"
                  onClick={() => setCustomSignatureUrl(undefined)}
                >
                  Remove
                </button>
              )}
            </div>

            {uploadError && (
              <p className="mt-1 text-sm text-red-600">{uploadError}</p>
            )}

            {customSignatureUrl && (
              <div className="mt-3 border border-neutral-200 rounded-lg p-2 inline-block">
                <div className="relative h-16 w-48">
                  <Image
                    src={customSignatureUrl}
                    alt="Signature"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certificate Preview */}
      {pdfUrl && !isGenerating && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Certificate Preview</h3>
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <iframe
              src={pdfUrl}
              className="w-full h-96"
              title="Certificate Preview"
            />
          </div>
        </div>
      )}

      {/* Generate Button */}
      {!autoGenerate && (
        <Button
          onClick={generateCertificate}
          variant="primary"
          isLoading={isGenerating}
          disabled={isGenerating}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        }
        >
          {pdfUrl ? 'Regenerate Certificate' : 'Generate Certificate'}
        </Button>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="mt-4 text-sm text-neutral-600">
          Generating your certificate, please wait...
        </div>
      )}

      {/* Download Button */}
      {pdfUrl && !isGenerating && (
        <div className="mt-4">
          <a
            href={pdfUrl}
            download={`${userName.replace(/\s+/g, '_')}_${courseName.replace(/\s+/g, '_')}_Certificate.pdf`}
            className="text-primary hover:text-primary-700 font-medium flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Certificate
          </a>
        </div>
      )}
    </div>
  );
};

export default CertificateGenerator;
