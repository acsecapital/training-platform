import {NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only show environment variables in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({error: 'This endpoint is only available in development mode'});
}

  res.status(200).json({
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
    stripe: {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
  },
    email: {
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasGoogleRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
      fromEmail: process.env.FROM_EMAIL,
  },
    nodeEnv: process.env.NODE_ENV,
});
}
