import {App, cert, getApps, initializeApp } from 'firebase-admin/app';

/**
 * Initialize Firebase Admin SDK
 * This is used for server-side operations that require admin privileges
 */
export function initAdmin(): App {
  const apps = getApps();
  
  if (apps.length > 0) {
    return apps[0];
}

  // Check for required environment variables
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    throw new Error('Missing Firebase Admin SDK credentials in environment variables');
}

  // Initialize the app with credentials
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // The private key comes as a string with "\n" character literals
      // We need to replace them with actual newlines
      privateKey: privateKey.replace(/\\n/g, '\n'),
  }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});
}
