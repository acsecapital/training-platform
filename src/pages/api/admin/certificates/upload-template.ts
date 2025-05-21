import {NextApiRequest, NextApiResponse } from 'next';
import {getAuth } from 'firebase-admin/auth';
import {getStorage } from 'firebase-admin/storage';
import {getFirestore } from 'firebase-admin/firestore';
import {initAdmin } from '@/services/firebase-admin';
import formidable from 'formidable';
import fs from 'fs';

// Initialize Firebase Admin
initAdmin();

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
},
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
}

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({error: 'Unauthorized'});
  }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await getAuth().verifyIdToken(token);
  } catch (error) {
      console.error('Error verifying auth token:', error);
      return res.status(401).json({error: 'Invalid authentication token'});
  }

    // Check if user is an admin
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(403).json({error: 'User not found'});
  }

    const userData = userDoc.data();
    if (!userData?.role || (userData.role !== 'admin' && userData.role !== 'super_admin')) {
      return res.status(403).json({error: 'Insufficient permissions'});
  }

    // Parse form data'
    const options = {
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
  };

    const form = formidable(options);

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(new Error(err.message));
        resolve([fields, files]);
    });
  });

    // Get file type (PDF or image)
    const fileType = Array.isArray(fields.fileType) ? fields.fileType[0] : fields.fileType;
    const fileArray = Array.isArray(files.file) ? files.file : [files.file];
    const file = fileArray[0];

    if (!file) {
      return res.status(400).json({error: 'No file uploaded'});
  }

    // Determine storage path based on file type
    let storagePath = '';
    if (fileType === 'pdf') {
      storagePath = `certificate-templates/pdf/${Date.now()}_${file.originalFilename}`;
  } else if (fileType === 'preview') {
      storagePath = `certificate-templates/previews/${Date.now()}_${file.originalFilename}`;
  } else {
      return res.status(400).json({error: 'Invalid file type'});
  }

    // Upload file to Firebase Storage using Admin SDK
    const bucket = getStorage().bucket();
    await bucket.upload(file.filepath, {
      destination: storagePath,
      metadata: {
        contentType: file.mimetype || 'application/octet-stream',
    },
  });

    // Get download URL
    const [url] = await bucket.file(storagePath).getSignedUrl({
      action: 'read',
      expires: '01-01-2100', // Long expiration
  });

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    // Return success with download URL
    return res.status(200).json({
      success: true,
      url,
      path: storagePath,
  });
} catch (error) {
    console.error('Error uploading template file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({error: 'Failed to upload file', message: errorMessage });
}
}
