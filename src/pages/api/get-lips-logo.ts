import {NextApiRequest, NextApiResponse } from 'next';
import admin from 'firebase-admin';
import {getApp, cert } from 'firebase-admin/app';
import {getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin if not already initialized
let firebaseAdmin;
try {
  firebaseAdmin = getApp();
} catch (error) {
  // Create a service account using the environment variables
  // The ServiceAccount interface only requires projectId, clientEmail, and privateKey
  const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

  // Alternatively, we could cast the full object to ServiceAccount
  // const serviceAccount = {
  //   type: 'service_account',
  //   project_id: process.env.FIREBASE_PROJECT_ID,
  //   private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  //   private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  //   client_email: process.env.FIREBASE_CLIENT_EMAIL,
  //   client_id: process.env.FIREBASE_CLIENT_ID,
  //   auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  //   token_uri: 'https://oauth2.googleapis.com/token',
  //   auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  //   client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(
  //     process.env.FIREBASE_CLIENT_EMAIL || ''
  //   )}`,
  // } as admin.ServiceAccount;

  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the storage bucket
    const bucket = getStorage().bucket();

    // Reference to the LIPS logo in Firebase Storage
    const file = bucket.file('media/6c092fdf-d573-445c-87b8-8fef84b8e260.png');

    // Check if the file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({error: 'Logo file not found'});
  }

    // Generate a signed URL for the file
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

    // Redirect to the signed URL
    res.redirect(signedUrl);
} catch (error: any) {
    console.error('Error fetching LIPS logo:', error);
    res.status(500).json({error: 'Failed to fetch LIPS logo', message: error.message});
}
}
