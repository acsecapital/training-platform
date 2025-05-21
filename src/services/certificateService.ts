import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import {ref, uploadString, getDownloadURL } from 'firebase/storage';
import {firestore, storage } from './firebase';
import {
  Certificate,
  CertificateTemplate,
  CertificateGenerationOptions,
  CertificateVerification,
  CertificateSearchFilters,
  CertificateVerificationResult,
} from '@/types/certificate.types';
import {v4 as uuidv4 } from 'uuid';
import {Course } from '@/types/course.types';
import {User } from '@/types/user.types';
import {generatePDF } from '@/utils/pdfGenerator';
import QRCode from 'qrcode';
import {registerCertificateOnBlockchain, verifyBlockchainCertificate } from './blockchainService';
import {generateSignature, verifySignature } from '@/utils/digitalSignature';

/**
 * Get a certificate template by ID
 */
export const getCertificateTemplate = async (templateId: string): Promise<CertificateTemplate | null> => {
  try {
    const templateRef = doc(firestore, 'certificateTemplates', templateId);
    const templateSnapshot = await getDoc(templateRef);

    if (!templateSnapshot.exists()) {
      return null;
  }

    return {
      id: templateSnapshot.id,
      ...templateSnapshot.data() as Omit<CertificateTemplate, 'id'>
  };
} catch (error) {
    console.error('Error getting certificate template:', error);
    return null;
}
};

/**
 * Get all certificate templates
 */
export const getCertificateTemplates = async (): Promise<CertificateTemplate[]> => {
  try {
    const templatesRef = collection(firestore, 'certificateTemplates');
    const templatesQuery = query(templatesRef, orderBy('createdAt', 'desc'));
    const templatesSnapshot = await getDocs(templatesQuery);

    const templates: CertificateTemplate[] = [];

    templatesSnapshot.forEach(doc => {
      templates.push({
        id: doc.id,
        ...doc.data() as Omit<CertificateTemplate, 'id'>
    });
  });

    return templates;
} catch (error) {
    console.error('Error getting certificate templates:', error);
    return [];
}
};

/**
 * Get the default certificate template
 */
export const getDefaultCertificateTemplate = async (): Promise<CertificateTemplate | null> => {
  try {
    const templatesRef = collection(firestore, 'certificateTemplates');
    const templatesQuery = query(templatesRef, where('isDefault', '==', true), limit(1));
    const templatesSnapshot = await getDocs(templatesQuery);

    if (templatesSnapshot.empty) {
      return null;
  }

    const templateDoc = templatesSnapshot.docs[0];

    return {
      id: templateDoc.id,
      ...templateDoc.data() as Omit<CertificateTemplate, 'id'>
  };
} catch (error) {
    console.error('Error getting default certificate template:', error);
    return null;
}
};

/**
 * Create a new certificate template
 */
export const createCertificateTemplate = async (template: Omit<CertificateTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<CertificateTemplate | null> => {
  try {
    const templateId = uuidv4();
    const templateRef = doc(firestore, 'certificateTemplates', templateId);

    const now = new Date().toISOString();

    const newTemplate: Omit<CertificateTemplate, 'id'> = {
      ...template,
      createdAt: now,
      updatedAt: now
  };

    await setDoc(templateRef, {
      ...newTemplate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
  });

    return {
      id: templateId,
      ...newTemplate
  };
} catch (error) {
    console.error('Error creating certificate template:', error);
    return null;
}
};

/**
 * Update a certificate template
 */
export const updateCertificateTemplate = async (templateId: string, template: Partial<CertificateTemplate>): Promise<boolean> => {
  try {
    const templateRef = doc(firestore, 'certificateTemplates', templateId);

    await updateDoc(templateRef, {
      ...template,
      updatedAt: serverTimestamp()
  });

    return true;
} catch (error) {
    console.error('Error updating certificate template:', error);
    return false;
}
};

/**
 * Generate a certificate for a user who completed a course
 */
export const generateCertificate = async (options: CertificateGenerationOptions): Promise<Certificate | null> => {
  try {
    const {templateId, userId, courseId, values = {}, expiryDate, metadata: inputMetadata = {}, isPublic = false } = options;
    const metadata = {completionDate: new Date().toISOString(), ...inputMetadata };
    // Ensure metadata has required completionDate
    if (!metadata.completionDate) {
      metadata.completionDate = new Date().toISOString();
  }

    // Get the template
    const template = await getCertificateTemplate(templateId);

    if (!template) {
      throw new Error('Certificate template not found');
  }

    // Get the user
    const userRef = doc(firestore, 'users', userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      throw new Error('User not found');
  }

    const userData = userSnapshot.data() as User;

    // Get the course
    const courseRef = doc(firestore, 'courses', courseId);
    const courseSnapshot = await getDoc(courseRef);

    if (!courseSnapshot.exists()) {
      throw new Error('Course not found');
  }

    const courseData = courseSnapshot.data() as Course;

    // Generate a unique certificate ID
    const certificateId = uuidv4();

    // Generate a verification code
    const verificationCode = uuidv4();

    // Create the verification URL
    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/verify-certificate/${verificationCode}`;

    // Generate QR code for verification URL
    const qrCodeDataUrl = await generateQRCode(verificationUrl);

    // Current date
    const now = new Date().toISOString();

    // Merge default values with provided values
    const mergedValues = {
      ...template.defaultValues,
      studentName: userData.displayName || userData.email || 'Student',
      courseName: courseData.title || 'Course',
      issueDate: now,
      certificateId,
      verificationCode,
      verificationUrl,
      qrCode: qrCodeDataUrl,
      ...values
  };

    // Generate the certificate HTML
    let certificateHtml = template.content;

    // Replace placeholders with actual values
    Object.entries(mergedValues).forEach(([key, value]) => {
      certificateHtml = certificateHtml.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });

    // Generate PDF from HTML
    const pdfBuffer = await generatePDF(certificateHtml, {
      format: 'A4',
      landscape: true,
      margin: {
        top: '1cm',
        bottom: '1cm',
        left: '1cm',
        right: '1cm'
    }
  });

    // Upload PDF to storage
    const pdfRef = ref(storage, `certificates/${certificateId}.pdf`);
    await uploadString(pdfRef, pdfBuffer.toString('base64'), 'base64');

    // Get download URL
    const downloadUrl = await getDownloadURL(pdfRef);

    // Create certificate record with all required fields
    const certificateData: Omit<Certificate, 'id'> = {
      userId,
      userName: userData.displayName || userData.email || 'Student',
      courseId,
      courseName: courseData.title || 'Course',
      templateId,
      issueDate: now,
      expiryDate: expiryDate || undefined,
      values: mergedValues,
      status: 'issued',
      verificationCode,
      verificationUrl,
      downloadUrl: downloadUrl || '',
      qrCodeUrl: qrCodeDataUrl || '',
      metadata,
      createdAt: now,
      isPublic: isPublic || false,
      pdfUrl: downloadUrl || '',
      thumbnailUrl: '',
      blockchainVerified: false,
      digitalSignature: undefined
  };

    // Generate digital signature for the certificate
    const signatureData = {
      id: certificateId,
      userId,
      courseId,
      templateId,
      issueDate: now,
      verificationCode
  };

    const digitalSignature = generateSignature(signatureData);

    // Add digital signature to certificate data
    certificateData.digitalSignature = digitalSignature || undefined;
    const certificate: Certificate = {
      id: certificateId,
      ...certificateData
  };

    // Save certificate to Firestore
    const certificateRef = doc(firestore, 'certificates', certificateId);
    await setDoc(certificateRef, {
      ...certificate,
      createdAt: serverTimestamp()
  });

    // Update user's course progress to include certificate
    const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
    await updateDoc(progressRef, {
      certificateId,
      certificateIssueDate: now,
      lastUpdated: serverTimestamp()
  });

    // Update certificate stats
    const statsRef = doc(firestore, 'certificateStats', templateId);
    const statsSnapshot = await getDoc(statsRef);

    if (statsSnapshot.exists()) {
      await updateDoc(statsRef, {
        totalIssued: increment(1),
        lastIssued: serverTimestamp(),
        coursesUsed: courseId
    });
  } else {
      await setDoc(statsRef, {
        templateId,
        totalIssued: 1,
        lastIssued: serverTimestamp(),
        coursesUsed: [courseId]
    });
  }

    // Register certificate on blockchain
    try {
      const blockchainVerification = await registerCertificateOnBlockchain(certificate);

      if (blockchainVerification) {
        console.log(`Certificate ${certificate.id} registered on blockchain with transaction ID: ${blockchainVerification.transactionId}`);
    }
  } catch (blockchainError) {
      console.error('Error registering certificate on blockchain:', blockchainError);
      // Continue even if blockchain registration fails
  }

    return certificate;
} catch (error) {
    console.error('Error generating certificate:', error);
    return null;
}
};

/**
 * Get a certificate by ID
 */
export const getCertificate = async (certificateId: string): Promise<Certificate | null> => {
  try {
    const certificateRef = doc(firestore, 'certificates', certificateId);
    const certificateSnapshot = await getDoc(certificateRef);

    if (!certificateSnapshot.exists()) {
      return null;
  }

    return {
      id: certificateSnapshot.id,
      ...certificateSnapshot.data() as Omit<Certificate, 'id'>
  };
} catch (error) {
    console.error('Error getting certificate:', error);
    return null;
}
};

/**
 * Get certificates for a user
 */
export const getUserCertificates = async (userId: string): Promise<Certificate[]> => {
  try {
    const certificatesRef = collection(firestore, 'certificates');
    const certificatesQuery = query(
      certificatesRef,
      where('userId', '==', userId),
      orderBy('issueDate', 'desc')
    );
    const certificatesSnapshot = await getDocs(certificatesQuery);

    const certificates: Certificate[] = [];

    certificatesSnapshot.forEach(doc => {
      certificates.push({
        id: doc.id,
        ...doc.data() as Omit<Certificate, 'id'>
    });
  });

    return certificates;
} catch (error) {
    console.error('Error getting user certificates:', error);
    return [];
}
};

/**
 * Get certificates for a course
 */
export const getCourseCertificates = async (courseId: string): Promise<Certificate[]> => {
  try {
    const certificatesRef = collection(firestore, 'certificates');
    const certificatesQuery = query(
      certificatesRef,
      where('courseId', '==', courseId),
      orderBy('issueDate', 'desc')
    );
    const certificatesSnapshot = await getDocs(certificatesQuery);

    const certificates: Certificate[] = [];

    certificatesSnapshot.forEach(doc => {
      certificates.push({
        id: doc.id,
        ...doc.data() as Omit<Certificate, 'id'>
    });
  });

    return certificates;
} catch (error) {
    console.error('Error getting course certificates:', error);
    return [];
}
};

/**
 * Search certificates with filters
 */
export const searchCertificates = async (filters: CertificateSearchFilters): Promise<Certificate[]> => {
  try {
    const certificatesRef = collection(firestore, 'certificates');
    let certificatesQuery = query(certificatesRef);

    // Apply filters
    if (filters.userId) {
      certificatesQuery = query(certificatesQuery, where('userId', '==', filters.userId));
  }

    if (filters.courseId) {
      certificatesQuery = query(certificatesQuery, where('courseId', '==', filters.courseId));
  }

    if (filters.templateId) {
      certificatesQuery = query(certificatesQuery, where('templateId', '==', filters.templateId));
  }

    if (filters.status) {
      certificatesQuery = query(certificatesQuery, where('status', '==', filters.status));
  }

    // Add date range filters if provided
    if (filters.startDate && filters.endDate) {
      certificatesQuery = query(
        certificatesQuery,
        where('issueDate', '>=', filters.startDate),
        where('issueDate', '<=', filters.endDate)
      );
  } else if (filters.startDate) {
      certificatesQuery = query(certificatesQuery, where('issueDate', '>=', filters.startDate));
  } else if (filters.endDate) {
      certificatesQuery = query(certificatesQuery, where('issueDate', '<=', filters.endDate));
  }

    // Order by issue date
    certificatesQuery = query(certificatesQuery, orderBy('issueDate', 'desc'));

    const certificatesSnapshot = await getDocs(certificatesQuery);

    const certificates: Certificate[] = [];

    certificatesSnapshot.forEach(doc => {
      certificates.push({
        id: doc.id,
        ...doc.data() as Omit<Certificate, 'id'>
    });
  });

    return certificates;
} catch (error) {
    console.error('Error searching certificates:', error);
    return [];
}
};

/**
 * Verify a certificate by verification code
 */
export const verifyCertificate = async (verificationCode: string, ipAddress?: string, userAgent?: string): Promise<CertificateVerificationResult> => {
  try {
    const certificatesRef = collection(firestore, 'certificates');
    const certificatesQuery = query(
      certificatesRef,
      where('verificationCode', '==', verificationCode)
    );
    const certificatesSnapshot = await getDocs(certificatesQuery);

    const now = new Date().toISOString();
    const verificationId = uuidv4();

    // Certificate not found
    if (certificatesSnapshot.empty) {
      // Log invalid verification attempt
      await logVerificationAttempt({
        id: verificationId,
        verificationCode,
        status: 'invalid',
        verifiedAt: now,
        verifiedIp: ipAddress,
        userAgent
    });

      return {
        isValid: false,
        message: 'Certificate not found',
        verifiedAt: now
    };
  }

    const certificateDoc = certificatesSnapshot.docs[0];
    const certificate = {
      id: certificateDoc.id,
      ...certificateDoc.data() as Omit<Certificate, 'id'>
  };

    // Check if certificate is revoked
    if (certificate.status === 'revoked') {
      // Log revoked verification attempt
      await logVerificationAttempt({
        id: verificationId,
        certificateId: certificate.id,
        verificationCode,
        status: 'revoked',
        verifiedAt: now,
        verifiedIp: ipAddress,
        userAgent
    });

      return {
        isValid: false,
        certificate,
        message: 'Certificate has been revoked',
        verifiedAt: now
    };
  }

    // Check if certificate is expired
    if (certificate.status === 'expired' || (certificate.expiryDate && new Date(certificate.expiryDate) < new Date())) {
      // Log expired verification attempt
      await logVerificationAttempt({
        id: verificationId,
        certificateId: certificate.id,
        verificationCode,
        status: 'expired',
        verifiedAt: now,
        verifiedIp: ipAddress,
        userAgent
    });

      return {
        isValid: false,
        certificate,
        message: 'Certificate has expired',
        verifiedAt: now
    };
  }

    // Certificate is valid
    await logVerificationAttempt({
      id: verificationId,
      certificateId: certificate.id,
      verificationCode,
      status: 'valid',
      verifiedAt: now,
      verifiedIp: ipAddress,
      userAgent
  });

    // Verify digital signature
    let signatureValid = false;
    let signatureMessage = 'Digital signature not found';

    if (certificate.digitalSignature) {
      // Data to verify
      const signatureData = {
        id: certificate.id,
        userId: certificate.userId,
        courseId: certificate.courseId,
        templateId: certificate.templateId,
        issueDate: certificate.issueDate,
        verificationCode: certificate.verificationCode
    };

      signatureValid = verifySignature(signatureData, certificate.digitalSignature);
      signatureMessage = signatureValid
        ? 'Digital signature verified'
        : 'Digital signature invalid - certificate may have been tampered with';
  }

    // Verify on blockchain if available
    let blockchainVerificationResult = undefined;

    if (certificate.blockchainVerified) {
      try {
        const blockchainResult = await verifyBlockchainCertificate(certificate);

        if (blockchainResult.verification) {
          blockchainVerificationResult = {
            isValid: blockchainResult.isValid,
            message: blockchainResult.message,
            transactionId: blockchainResult.verification.transactionId,
            blockchainProvider: blockchainResult.verification.blockchainProvider,
            blockchainNetwork: blockchainResult.verification.blockchainNetwork,
            verificationUrl: blockchainResult.verification.verificationUrl
        };
      } else {
          blockchainVerificationResult = {
            isValid: false,
            message: 'Certificate not found on blockchain'
        };
      }
    } catch (blockchainError) {
        console.error('Error verifying certificate on blockchain:', blockchainError);
        blockchainVerificationResult = {
          isValid: false,
          message: 'Error verifying certificate on blockchain'
      };
    }
  }

    return {
      isValid: true,
      certificate,
      message: 'Certificate is valid',
      verifiedAt: now,
      digitalSignatureVerification: {
        isValid: signatureValid,
        message: signatureMessage
    },
      blockchainVerification: blockchainVerificationResult
  };
} catch (error) {
    console.error('Error verifying certificate:', error);

    // Log error verification attempt
    try {
      await logVerificationAttempt({
        id: uuidv4(),
        verificationCode,
        status: 'invalid',
        verifiedAt: new Date().toISOString(),
        verifiedIp: ipAddress,
        userAgent
        // errorMessage: error instanceof Error ? error.message : String(error) // Removed as it's not in CertificateVerification type
    });
  } catch (logError) {
      console.error('Error logging verification attempt:', logError);
  }

    return {
      isValid: false,
      message: 'Error verifying certificate',
      verifiedAt: new Date().toISOString()
  };
}
};

/**
 * Log a certificate verification attempt
 */
const logVerificationAttempt = async (verification: Partial<CertificateVerification>): Promise<void> => {
  try {
    const verificationRef = doc(firestore, 'certificateVerifications', verification.id || uuidv4());

    await setDoc(verificationRef, {
      ...verification,
      verifiedAt: serverTimestamp(),
      timestamp: new Date().getTime()
  });
} catch (error) {
    console.error('Error logging verification attempt:', error);
}
};

/**
 * Revoke a certificate
 */
export const revokeCertificate = async (certificateId: string, reason: string): Promise<boolean> => {
  try {
    const certificateRef = doc(firestore, 'certificates', certificateId);
    const certificateDoc = await getDoc(certificateRef);

    if (!certificateDoc.exists()) {
      throw new Error('Certificate not found');
  }

    // Update certificate status
    await updateDoc(certificateRef, {
      status: 'revoked',
      revocationReason: reason,
      revocationDate: new Date().toISOString(),
      updatedAt: serverTimestamp()
  });

    // Log revocation
    const revocationId = uuidv4();
    const revocationRef = doc(firestore, 'certificateRevocations', revocationId);

    await setDoc(revocationRef, {
      id: revocationId,
      certificateId,
      reason,
      revokedAt: serverTimestamp(),
      revokedBy: 'admin', // In a real app, this would be the current user's ID
      timestamp: new Date().getTime()
  });

    return true;
} catch (error) {
    console.error('Error revoking certificate:', error);
    return false;
}
};

/**
 * Generate a QR code for a verification URL
 */
export const generateQRCode = async (url: string): Promise<string> => {
  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#ffffff'
    }
  });

    return qrDataUrl;
} catch (error) {
    console.error('Error generating QR code:', error);
    return '';
}
};
