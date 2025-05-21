import React from 'react';
import Head from 'next/head';

const DebugEnvPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Debug Environment Variables</title>
      </Head>
      
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Environment Variables</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Firebase Configuration</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({
              apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
              authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
              storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
              messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
              appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
              measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
          }, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Stripe Configuration</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({
              publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
              // Don't expose the secret key in client-side code
              hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
          }, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Email Configuration</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({
              googleClientId: process.env.GOOGLE_CLIENT_ID,
              hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
              hasGoogleRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
              fromEmail: process.env.FROM_EMAIL,
          }, null, 2)}
          </pre>
        </div>
      </div>
    </>
  );
};

export default DebugEnvPage;
