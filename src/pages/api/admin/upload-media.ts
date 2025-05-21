import {NextApiRequest, NextApiResponse } from 'next';
import {IncomingForm } from 'formidable';
import {promises as fs } from 'fs';
import admin from 'firebase-admin';
import {getApp } from 'firebase-admin/app';
import {getStorage } from 'firebase-admin/storage';
import {collection, addDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
},
};

// Initialize Firebase Admin if not already initialized
try {
  getApp();
} catch (_) {
  // Get the service account key from environment variables
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({error: 'Method not allowed'});
}

  try {
    // Parse the incoming form data
    const form = new IncomingForm({
      multiples: true,
      keepExtensions: true,
  });

    // Parse the form
    const formData = await new Promise<{files: any}>((resolve, reject) => {
      form.parse(req, (err, _fields, files) => {
        if (err) return reject(new Error(err.message));
        resolve({files});
    });
  });

    const files = formData.files;

    // Get the file from the form data
    const file = files.file;

    if (!file) {
      return res.status(400).json({error: 'No file uploaded'});
  }

    // Read the file
    const fileData = await fs.readFile(file.filepath);

    // Get the storage bucket
    const bucket = getStorage().bucket();

    // Generate a unique filename
    const timestamp = Date.now();
    const fileName = file.originalFilename.replace(/[^a-zA-Z0-9.]/g, '_');
    const destination = `media/${timestamp}_${fileName}`;

    // Upload the file to Firebase Storage
    const fileUpload = bucket.file(destination);
    await fileUpload.save(fileData, {
      metadata: {
        contentType: file.mimetype,
    },
  });

    // Make the file publicly accessible
    await fileUpload.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;

    // Add metadata to Firestore
    await addDoc(collection(firestore, 'media'), {
      name: file.originalFilename,
      path: destination,
      type: file.mimetype,
      size: file.size,
      url: publicUrl,
      createdAt: new Date().toISOString(),
      metadata: {
        contentType: file.mimetype,
    },
  });

    // Return the file information
    return res.status(200).json({
      success: true,
      file: {
        name: file.originalFilename,
        path: destination,
        type: file.mimetype,
        size: file.size,
        url: publicUrl,
    },
  });
} catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({error: 'Failed to upload file', message: errorMessage });
}
}
