/**
 * Certificate generation service
 *
 * This service provides methods for generating and managing certificates.
 */

import {jsPDF } from 'jspdf';
import {Certificate, CertificateGenerationOptions } from '@/types/certificate.types';
import {storage } from './firebase';
import QRCode from 'qrcode';
import {ref, uploadString, getDownloadURL } from 'firebase/storage';

/**
 * Generate a PDF certificate
 * @param options Certificate generation options
 * @returns Promise with the PDF data URL
 */
export const generateCertificatePDF = async (options: CertificateGenerationOptions): Promise<string> => {
  const {
    userName,
    courseName,
    completionDate,
    certificateId, // Used for QR code generation
    templateId = 'default', // Currently using hardcoded design
    orientation = 'landscape',
    includeQRCode = true,
    includeSignature = true,
    signatureName = 'Closer College',
    signatureTitle = 'Director of Training',
    companyName = 'Closer College',
    companyLogo,
} = options;

  // Create new PDF document based on the template
  console.log(`Using certificate template: ${templateId}`);
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4',
});

  // Add Company Logo if provided
  if (companyLogo) {
    try {
      doc.addImage(companyLogo, 'PNG', 20, 25, 30, 15); // Adjust x, y, w, h as needed
    } catch (e) {
      console.error('Error adding company logo to PDF:', e);
    }
  }
  // Set background color
  doc.setFillColor(240, 240, 255);
  doc.rect(0, 0, 297, 210, 'F');

  // Add border
  doc.setDrawColor(14, 14, 79); // primary color
  doc.setLineWidth(5);
  doc.rect(10, 10, 277, 190);

  // Add decorative elements
  doc.setDrawColor(138, 2, 0); // secondary color
  doc.setLineWidth(2);
  doc.rect(15, 15, 267, 180);

  // Add header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(14, 14, 79); // primary color
  doc.text('CERTIFICATE OF COMPLETION', 148.5, 40, {align: 'center'});

  // Add line separator
  doc.setDrawColor(14, 14, 79);
  doc.setLineWidth(1);
  doc.line(74, 45, 223, 45);

  // Add certificate text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('This is to certify that', 148.5, 70, {align: 'center'});

  // Add name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(138, 2, 0); // secondary color
  doc.text(userName || 'Student Name', 148.5, 85, {align: 'center'});

  // Add course completion text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('has successfully completed the course', 148.5, 100, {align: 'center'});

  // Add course name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(14, 14, 79); // primary color
  doc.text(courseName || 'Course Name', 148.5, 115, {align: 'center'});

  // Add completion date
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  const formattedDate = completionDate ? formatDate(completionDate) : formatDate(new Date());
  doc.text(`Completed on: ${formattedDate}`, 148.5, 135, {align: 'center'});

  // Add certificate ID
  doc.setFontSize(10);
  doc.text(`Certificate ID: ${certificateId}`, 148.5, 145, {align: 'center'});

  // Add Signature if included
  if (includeSignature) {
    // Add signature line
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(90, 165, 207, 165); // Adjust x-coordinates as needed

    // Add signature text
    doc.setFontSize(12);
    doc.text(signatureName, 148.5, 170, {align: 'center'});
    doc.setFontSize(10);
    doc.text(signatureTitle, 148.5, 175, {align: 'center'});
  }

  // Add QR Code if included
  if (includeQRCode) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'}/verify/${certificateId}`;
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 80, // pixel width for data URL, will be scaled by addImage
      });
      // Place QR code, e.g., bottom-right
      doc.addImage(qrCodeDataUrl, 'PNG', 247, 155, 25, 25); // Adjust x, y, w, h as needed
    } catch (e) {
      console.error('Error generating or adding QR code to PDF:', e);
    }
  }

  // Add footer with company name
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(companyName, 148.5, 190, {align: 'center'});
  // Convert to data URL
  return doc.output('dataurlstring');
};

/**
 * Upload certificate to Firebase Storage
 * @param userId User ID
 * @param courseId Course ID
 * @param certificateId Certificate ID
 * @param pdfDataUrl PDF data URL
 * @returns Promise with the download URL
 */
export const uploadCertificate = async (
  userId: string,
  courseId: string,
  certificateId: string,
  pdfDataUrl: string
): Promise<string> => {
  try {
    // Create a reference to the certificate in Firebase Storage
    const certificateRef = ref(
      storage,
      `certificates/${userId}/${courseId}/${certificateId}.pdf`
    );

    // Convert data URL to base64 string
    const base64Data = pdfDataUrl.split(',')[1];

    // Upload the PDF
    await uploadString(certificateRef, base64Data, 'base64');

    // Get the download URL
    const downloadURL = await getDownloadURL(certificateRef);
    return downloadURL;
} catch (error) {
    console.error('Error uploading certificate:', error);
    throw error;
}
};

/**
 * Generate a certificate thumbnail
 * @param pdfDataUrl PDF data URL
 * @returns Promise with the thumbnail data URL
 */
export const generateCertificateThumbnail = (pdfDataUrl: string): string => {
  // In a real implementation, this would convert the PDF to an image
  // For now, we'll just return a placeholder
  console.log(`Generating thumbnail for PDF with size: ${pdfDataUrl.length} bytes`);
  return '/assets/placeholder-image.svg';
};

/**
 * Verify a certificate
 * @param certificateId Certificate ID
 * @param verificationCode Verification code
 * @returns Promise with the verification result
 */
export const verifyCertificate = (certificateId: string, verificationCode: string): {valid: boolean; certificate?: Certificate} => {
    // In a real implementation, this would verify the certificate against the database
    // For now, we'll just return a mock result
    return {
      valid: true,
      certificate: {
        id: certificateId,
        userId: 'user123',
        courseId: 'course123',
        courseName: 'LIPS Sales System Fundamentals',
        userName: 'John Doe',
        issueDate: new Date().toISOString(),
        templateId: 'default',
        pdfUrl: '#',
        thumbnailUrl: '/assets/placeholder-image.svg',
        verificationCode,
        status: 'active',
        verificationUrl: `/verify/${certificateId}`,
        createdAt: new Date().toISOString(),
    },
  };
};

/**
 * Format date to a human-readable string
 * @param date Date object
 * @returns Formatted date string (e.g., "January 1, 2023")
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});
};
