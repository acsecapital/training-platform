import type {NextApiRequest, NextApiResponse } from 'next';
import {getStorage } from 'firebase-admin/storage';
import {initAdmin } from '@/services/firebase-admin';

/**
 * API endpoint to proxy PDF files from Firebase Storage
 * This helps with CORS issues and permission issues when working with PDFs
 * Uses Firebase Admin SDK for elevated permissions
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Initialize Firebase Admin
    const app = initAdmin();
    const adminStorage = getStorage(app);
    const bucket = adminStorage.bucket();

    // Handle GET requests (download/view PDF)
    if (req.method === 'GET') {
      try {
        const {path } = req.query;

        if (!path || typeof path !== 'string') {
          return res.status(400).json({message: 'Missing path parameter'});
      }

        // Get the file from Firebase Storage using Admin SDK
        // Handle both direct paths and full paths
        const filePath = path.includes('certificate-templates/') ? path : `certificate-templates/${path}`;
        console.log('Accessing file with path:', filePath);
        const file = bucket.file(filePath);

        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
          return res.status(404).json({message: 'File not found'});
      }

        // Get the file data
        const [fileData] = await file.download();

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', fileData.length);
        res.setHeader('Cache-Control', 'public, max-age=3600');

        // Send the file data
        res.status(200).send(fileData);
    } catch (error) {
        console.error('Error proxying PDF:', error);
        res.status(500).json({message: 'Failed to proxy PDF file', error: String(error)});
    }
  }
    // Handle POST requests (upload PDF)
    else if (req.method === 'POST') {
      try {
        // Check if we have the file data in the request body
        if (!req.body || !req.body.fileData || !req.body.fileName || !req.body.contentType) {
          return res.status(400).json({message: 'Missing file data, file name, or content type'});
      }

        const {fileData, fileName, contentType, storagePath } = req.body;

        // Decode base64 data
        const buffer = Buffer.from(fileData, 'base64');

        // Create a storage path
        const path = storagePath || `certificate-templates/${Date.now()}_${fileName}`;
        console.log('Uploading file to path:', path);

        // Upload the file using Admin SDK
        const file = bucket.file(path);
        await file.save(buffer, {
          metadata: {
            contentType
        }
      });

        // Make the file publicly accessible
        await file.makePublic();

        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;

        // Return the download URL and storage path
        res.status(200).json({
          url: publicUrl,
          path,
          success: true
      });
    } catch (error) {
        console.error('Error uploading PDF:', error);
        res.status(500).json({message: 'Failed to upload PDF file', error: String(error)});
    }
  } else {
      return res.status(405).json({message: 'Method not allowed'});
  }
} catch (adminError) {
    console.error('Firebase Admin initialization error:', adminError);
    res.status(500).json({message: 'Server configuration error', error: String(adminError)});
  }
}
