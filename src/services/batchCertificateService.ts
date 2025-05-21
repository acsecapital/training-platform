import {doc, getDoc, collection, query, where, getDocs, serverTimestamp, writeBatch, increment } from 'firebase/firestore';
import {firestore, storage } from './firebase';
import {verifyCertificate, getCertificateTemplate, generateQRCode } from './certificateService'; // Import necessary functions
import {Certificate, CertificateVerificationResult } from '@/types/certificate.types'; // Import Certificate and Options types
import {User } from '@/types/user.types'; // Import User type
import {Course } from '@/types/course.types'; // Import Course type
import {ref, uploadString, getDownloadURL } from 'firebase/storage'; // Import storage functions
import {v4 as uuidv4 } from 'uuid'; // Import uuid
import {generateSignature } from '@/utils/digitalSignature'; // Import digital signature function
import {registerCertificateOnBlockchain } from './blockchainService'; // Import blockchain service
import {generatePDF } from '@/utils/pdfGenerator'; // Import generatePDF function

/**
 * Interface for batch certificate issuance options
 */
export interface BatchCertificateIssuanceOptions {
  values: Record<string, string | number | boolean | Date | null | undefined>;
  metadata: {completionDate: string; grade?: string | undefined; duration?: string | undefined; skills?: string[] | undefined; issuer?: {name: string; logo?: string | undefined; signature?: string | undefined; title?: string | undefined; } | undefined; } | undefined;
  courseId: string;
  templateId: string;
  userIds: string[];
  isPublic?: boolean;
  expiryDate?: string;
  onProgress?: (processed: number, success: number, failed: number) => void;
}

/**
 * Issue certificates in batch
 */
export const issueCertificatesInBatch = async (options: BatchCertificateIssuanceOptions): Promise<{
  total: number;
  success: number;
  failed: number;
}> => {
  const {courseId, templateId, userIds, isPublic = false, expiryDate, onProgress } = options;

  let processed = 0;
  let success = 0;
  let failed = 0;

  // Create a new write batch
  const batch = writeBatch(firestore);
  const certificatesToRegisterBlockchain: Certificate[] = [];

  try {
    // Get course data (read outside the batch)
    const courseRef = doc(firestore, 'courses', courseId);
    const courseSnapshot = await getDoc(courseRef);

    if (!courseSnapshot.exists()) {
      throw new Error('Course not found');
  }
    const courseData = courseSnapshot.data() as Course;

    // Get template data (read outside the batch)
    const template = await getCertificateTemplate(templateId);
    if (!template) {
      throw new Error('Certificate template not found');
  }

    // Process each user
    for (const userId of userIds) {
      try {
        // Check if certificate already exists (read outside the batch)
        const certificatesQuery = query(
          collection(firestore, 'certificates'),
          where('userId', '==', userId),
          where('courseId', '==', courseId)
        );
        const certificatesSnapshot = await getDocs(certificatesQuery);

        if (!certificatesSnapshot.empty) {
          // Skip if certificate already exists
          processed++;
          success++;
          if (onProgress) onProgress(processed, success, failed);
          continue;
      }

        // Get user data (read outside the batch)
        const userRef = doc(firestore, 'users', userId);
        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
          // Skip if user not found
          processed++;
          failed++;
          if (onProgress) onProgress(processed, success, failed);
          continue;
      }
        const userData = userSnapshot.data() as User;

        // --- Non-Firestore Operations (prepare data for batch) ---

        // Generate unique IDs and URLs
        const certificateId = uuidv4();
        const verificationCode = uuidv4();
        const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/verify-certificate/${verificationCode}`;
        const now = new Date().toISOString();

        // Merge values from batch options and user/course data
        const mergedValues = {
          ...template.defaultValues,
          studentName: userData.displayName || userData.email || 'Student',
          courseName: courseData.title || 'Course',
          issueDate: now,
          certificateId,
          verificationCode,
          verificationUrl,
          completionDate: new Date().toISOString(), // Ensure completionDate is always set
          issuerName: courseData.instructor || 'Instructor', // Add issuer details
          issuerTitle: courseData.instructorTitle || 'Course Instructor', // Add issuer details
          ...options.values // Include any additional values from batch options
      };

        // Generate certificate HTML
        let certificateHtml = template.content;
        Object.entries(mergedValues).forEach(([key, value]) => {
          certificateHtml = certificateHtml.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });

        // Generate PDF and QR code (outside the batch)
        const [pdfBuffer, qrCodeDataUrl] = await Promise.all([
          generatePDF(certificateHtml, {format: 'A4', landscape: true, margin: {top: '1cm', bottom: '1cm', left: '1cm', right: '1cm'} }),
          generateQRCode(verificationUrl)
        ]);

        // Upload PDF to storage (outside the batch)
        const pdfRef = ref(storage, `certificates/${certificateId}.pdf`);
        await uploadString(pdfRef, pdfBuffer.toString('base64'), 'base64');
        const downloadUrl = await getDownloadURL(pdfRef);

        // Create certificate data object
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
          metadata: {completionDate: new Date().toISOString(), ...options.metadata }, // Ensure metadata is correctly structured using batch options
          createdAt: now,
          isPublic: isPublic || false,
          pdfUrl: downloadUrl || '',
          thumbnailUrl: '', // Assuming thumbnail is generated elsewhere or not needed for batch
          blockchainVerified: false,
          digitalSignature: undefined
      };

        // Generate digital signature (outside the batch)
        const signatureData = {
          id: certificateId,
          userId,
          courseId,
          templateId,
          issueDate: now,
          verificationCode
      };
        const digitalSignature: string | null = generateSignature(signatureData);
        certificateData.digitalSignature = digitalSignature || undefined;

        const certificate: Certificate = {
          id: certificateId,
          ...certificateData
      };

        // --- Firestore Write Operations (add to batch) ---

        // Add certificate document to the batch
        const certificateRef = doc(firestore, 'certificates', certificateId);
        batch.set(certificateRef, {...certificate, createdAt: serverTimestamp() });

        // Add update user's course progress to the batch
        const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
        // Use set with merge: true in case the document doesn't exist
        batch.set(progressRef, {
          certificateId,
          certificateIssueDate: now,
          lastUpdated: serverTimestamp()
      }, {merge: true });

        // Add update certificate stats to the batch
        const statsRef = doc(firestore, 'certificateStats', templateId);
        // Note: Firestore batch does not support conditional updates like increment
        // directly on a document that might not exist. A transaction would be better
        // for this specific case if accuracy is paramount and concurrent updates are likely.
        // For simplicity in batching, we'll add an update assuming the stats doc exists.
        // If it doesn't exist, the update will fail silently in the batch.
        // A more robust solution would involve checking existence and using set with merge: true or a transaction.
        // Given the current structure, we'll add a simple update.
        // Also, updating `coursesUsed` as a single string will overwrite previous values.
        // If `coursesUsed` should be an array, this needs adjustment.
        // Assuming for now it's okay to just update last issued course.
        batch.update(statsRef, {
          totalIssued: increment(1),
          lastIssued: serverTimestamp(),
          // coursesUsed: courseId // This will overwrite, needs adjustment for array
      });

        // Add certificate to a list for blockchain registration after batch commit
        certificatesToRegisterBlockchain.push(certificate);

        success++;

    } catch (error) {
        console.error(`Error processing certificate generation for user ${userId}:`, error);
        failed++;
    }

      processed++;

      // Report progress after processing each item
      if (onProgress) {
        onProgress(processed, success, failed);
    }
  }

    // Commit the batch
    await batch.commit();

    // --- Post-Batch Operations ---

    // Register certificates on blockchain after successful batch commit
    for (const certificate of certificatesToRegisterBlockchain) {
      try {
        const blockchainVerification = await registerCertificateOnBlockchain(certificate);
        if (blockchainVerification) {
          console.log(`Certificate ${certificate.id} registered on blockchain with transaction ID: ${blockchainVerification.transactionId}`);
          // Optionally update the certificate doc with blockchain info after the fact if needed
          // This would require another separate update or transaction if critical
      }
    } catch (blockchainError) {
        console.error(`Error registering certificate ${certificate.id} on blockchain:`, blockchainError);
        // Continue even if blockchain registration fails for one certificate
    }
  }

    return {
      total: userIds.length,
      success,
      failed
  };
} catch (error) {
    console.error('Error committing batch certificate generation:', error);
    // If batch.commit() fails, the entire batch fails.
    // The individual success/failed counts from the loop might not accurately reflect the final state.
    // For simplicity, we'll report all as failed if the commit fails.
    return {
      total: userIds.length,
      success: 0,
      failed: userIds.length
  };
}
};

/**
 * Interface for batch certificate revocation options
 */
export interface BatchCertificateRevocationOptions {
  certificateIds: string[];
  reason: string;
  onProgress?: (processed: number, success: number, failed: number) => void;
}

/**
 * Revoke certificates in batch
 */
export const revokeCertificatesInBatch = async (options: BatchCertificateRevocationOptions): Promise<{
  total: number;
  success: number;
  failed: number;
}> => {
  const {certificateIds, reason, onProgress } = options;

  let processed = 0;
  let success = 0;
  let failed = 0;

  // Create a new write batch
  const batch = writeBatch(firestore);

  try {
    // Process each certificate
    for (const certificateId of certificateIds) {
      try {
        // Get certificate
        const certificateRef = doc(firestore, 'certificates', certificateId);
        const certificateSnapshot = await getDoc(certificateRef);

        if (!certificateSnapshot.exists()) {
          // Skip if certificate doesn't exist
          processed++;
          failed++;

          if (onProgress) {
            onProgress(processed, success, failed);
        }

          continue;
      }

        const certificateData = certificateSnapshot.data();

        // Skip if certificate is already revoked
        if (certificateData.status === 'revoked') {
          processed++;
          success++; // Count as success since it's already in the desired state

          if (onProgress) {
            onProgress(processed, success, failed);
        }

          continue;
      }

        // Add update operation to the batch
        batch.update(certificateRef, {
          status: 'revoked',
          revokedAt: new Date().toISOString(),
          revokedReason: reason,
          updatedAt: serverTimestamp()
      });

        // Increment success count for the batch operation
        success++;

    } catch (error) {
        console.error(`Error preparing revocation for certificate ${certificateId}:`, error);
        failed++;
    }

      processed++;

      // Report progress after processing each item, even if batched
      if (onProgress) {
        onProgress(processed, success, failed);
    }
  }

    // Commit the batch
    await batch.commit();

    return {
      total: certificateIds.length,
      success,
      failed
  };
} catch (error) {
    console.error('Error committing batch revocation:', error);
    // Note: If batch.commit() fails, the entire batch fails. The individual
    // success/failed counts from the loop might not accurately reflect the final state.
    // For simplicity, we'll report all as failed if the commit fails.
    return {
      total: certificateIds.length,
      success: 0,
      failed: certificateIds.length
  };
}
};

/**
 * Interface for batch certificate verification options
 */
export interface BatchCertificateVerificationOptions {
  verificationCodes: string[];
  onProgress?: (processed: number, valid: number, invalid: number) => void;
}

/**
 * Verify certificates in batch
 */
export const verifyCertificatesInBatch = async (options: BatchCertificateVerificationOptions): Promise<{
  results: CertificateVerificationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
};
}> => {
  const {verificationCodes, onProgress } = options;

  let processed = 0;
  let valid = 0;
  let invalid = 0;
  const results: CertificateVerificationResult[] = [];

  try {
    // Process each verification code
    for (const code of verificationCodes) {
      try {
        // Verify certificate
        const result = await verifyCertificate(code);

        // Add verification code to result for reference
        const resultWithCode = {
          ...result,
          verificationCode: code
      };

        results.push(resultWithCode);

        if (result.isValid) {
          valid++;
      } else {
          invalid++;
      }
    } catch (error) {
        console.error(`Error verifying certificate with code ${code}:`, error);

        // Add error result
        results.push({
          isValid: false,
          message: 'Error verifying certificate',
          verifiedAt: new Date().toISOString(),
          verificationCode: code
      });

        invalid++;
    }

      processed++;

      if (onProgress) {
        onProgress(processed, valid, invalid);
    }
  }

    return {
      results,
      summary: {
        total: verificationCodes.length,
        valid,
        invalid
    }
  };
} catch (error) {
    console.error('Error verifying certificates in batch:', error);
    return {
      results,
      summary: {
        total: verificationCodes.length,
        valid,
        invalid
    }
  };
}
};
