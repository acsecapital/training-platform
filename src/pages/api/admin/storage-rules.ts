import {NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
import {getApp } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
try {
  getApp();
} catch (_) {
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
    // Get the current rules
    const storage = admin.storage();
    const bucket = storage.bucket();

    // Set public read/write rules for the media folder
    // Note: In a production environment, you would want more restrictive rules
    const rules = `
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        match /media/{allPaths=**} {
          allow read, write: if true;
      }
        match /{allPaths=**} {
          allow read, write: if request.auth != null;
      }
    }
  }
    `;

    // Update the rules
    await bucket.setMetadata({
      metadata: {
        firebaseStorageCustomMetadata: JSON.stringify({
          rules,
      }),
    },
  });

    return res.status(200).json({success: true, message: 'Storage rules updated successfully'});
} catch (error) {
    console.error('Error updating storage rules:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({error: 'Failed to update storage rules', message: errorMessage });
}
}
