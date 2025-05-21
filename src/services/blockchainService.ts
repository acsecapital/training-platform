import {doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {firestore } from './firebase';
import {Certificate } from '@/types/certificate.types';
import {createHash } from 'crypto';

/**
 * Interface for blockchain verification record
 */
export interface BlockchainVerification {
  id: string;
  certificateId: string;
  certificateHash: string;
  transactionId?: string;
  blockchainProvider: string;
  blockchainNetwork: string;
  blockNumber?: number;
  timestamp: string;
  status: 'pending' | 'verified' | 'failed';
  verificationUrl?: string;
}

/**
 * Generate a hash for a certificate
 */
export const generateCertificateHash = (certificate: Certificate): string => {
  // Create a deterministic string representation of the certificate
  const certificateData = JSON.stringify({
    id: certificate.id,
    userId: certificate.userId,
    courseId: certificate.courseId,
    courseName: certificate.courseName,
    userName: certificate.userName,
    issueDate: certificate.issueDate,
    templateId: certificate.templateId,
    verificationCode: certificate.verificationCode
});
  
  // Generate SHA-256 hash
  return createHash('sha256').update(certificateData).digest('hex');
};

/**
 * Register a certificate on the blockchain
 * Note: In a real implementation, this would interact with an actual blockchain
 */
export const registerCertificateOnBlockchain = async (certificate: Certificate): Promise<BlockchainVerification | null> => {
  try {
    // Generate certificate hash
    const certificateHash = generateCertificateHash(certificate);
    
    // Check if certificate is already registered
    const existingVerification = await getBlockchainVerification(certificate.id);
    if (existingVerification) {
      return existingVerification;
  }
    
    // Create blockchain verification record
    const verificationId = certificate.id;
    const verificationRef = doc(firestore, 'blockchainVerifications', verificationId);
    
    // In a real implementation, this would submit the hash to a blockchain
    // For now, we'll simulate a successful registration
    const timestamp = new Date().toISOString();
    
    // Simulate blockchain transaction data
    const blockchainData = {
      transactionId: `tx_${Math.random().toString(36).substring(2, 15)}`,
      blockNumber: Math.floor(Math.random() * 1000000),
      blockchainProvider: 'Ethereum',
      blockchainNetwork: 'Rinkeby Testnet',
      verificationUrl: `https://rinkeby.etherscan.io/tx/${Math.random().toString(36).substring(2, 15)}`
  };
    
    const verification: BlockchainVerification = {
      id: verificationId,
      certificateId: certificate.id,
      certificateHash,
      transactionId: blockchainData.transactionId,
      blockchainProvider: blockchainData.blockchainProvider,
      blockchainNetwork: blockchainData.blockchainNetwork,
      blockNumber: blockchainData.blockNumber,
      timestamp,
      status: 'verified',
      verificationUrl: blockchainData.verificationUrl
  };
    
    // Save verification record
    await setDoc(verificationRef, {
      ...verification,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
  });
    
    // Update certificate with blockchain verification
    const certificateRef = doc(firestore, 'certificates', certificate.id);
    await updateDoc(certificateRef, {
      blockchainVerified: true,
      blockchainVerificationId: verificationId,
      updatedAt: serverTimestamp()
  });
    
    return verification;
} catch (error) {
    console.error('Error registering certificate on blockchain:', error);
    return null;
}
};

/**
 * Get blockchain verification for a certificate
 */
export const getBlockchainVerification = async (certificateId: string): Promise<BlockchainVerification | null> => {
  try {
    const verificationRef = doc(firestore, 'blockchainVerifications', certificateId);
    const verificationSnapshot = await getDoc(verificationRef);
    
    if (!verificationSnapshot.exists()) {
      return null;
  }
    
    return {
      id: verificationSnapshot.id,
      ...verificationSnapshot.data()
  } as BlockchainVerification;
} catch (error) {
    console.error('Error getting blockchain verification:', error);
    return null;
}
};

/**
 * Verify a certificate against the blockchain
 */
export const verifyBlockchainCertificate = async (certificate: Certificate): Promise<{
  isValid: boolean;
  message: string;
  verification?: BlockchainVerification;
}> => {
  try {
    // Get blockchain verification
    const verification = await getBlockchainVerification(certificate.id);
    
    if (!verification) {
      return {
        isValid: false,
        message: 'Certificate is not registered on the blockchain'
    };
  }
    
    // Generate certificate hash
    const certificateHash = generateCertificateHash(certificate);
    
    // Compare hashes
    if (certificateHash !== verification.certificateHash) {
      return {
        isValid: false,
        message: 'Certificate hash does not match blockchain record',
        verification
    };
  }
    
    return {
      isValid: true,
      message: 'Certificate is verified on the blockchain',
      verification
  };
} catch (error) {
    console.error('Error verifying certificate on blockchain:', error);
    return {
      isValid: false,
      message: 'Error verifying certificate on blockchain'
  };
}
};

/**
 * Register all unregistered certificates on the blockchain
 */
export const registerAllCertificatesOnBlockchain = async (certificates: Certificate[]): Promise<{
  success: number;
  failed: number;
  total: number;
}> => {
  let success = 0;
  let failed = 0;
  
  for (const certificate of certificates) {
    try {
      const result = await registerCertificateOnBlockchain(certificate);
      if (result) {
        success++;
    } else {
        failed++;
    }
  } catch (error) {
      console.error(`Error registering certificate ${certificate.id} on blockchain:`, error);
      failed++;
  }
}
  
  return {
    success,
    failed,
    total: certificates.length
};
};
