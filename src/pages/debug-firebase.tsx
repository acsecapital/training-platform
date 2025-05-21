import React, {useEffect, useState } from 'react';
import Head from 'next/head';
import {app, auth, firestore } from '@/services/firebase';
import {collection, getDocs } from 'firebase/firestore';

const DebugFirebasePage: React.FC = () => {
  const [firebaseConfig, setFirebaseConfig] = useState<Record<string, unknown> | null>(null);
  const [firestoreTest, setFirestoreTest] = useState<{success: boolean; message: string }>({
    success: false,
    message: 'Testing...',
});

  useEffect(() => {
    // Get Firebase config
    setFirebaseConfig({
      appName: app.name,
      options: app.options,
      authCurrentUser: auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
    } : null,
  });

    // Test Firestore connection
    const testFirestore = async () => {
      try {
        // Try to get a collection
        const querySnapshot = await getDocs(collection(firestore, 'test-collection'));

        setFirestoreTest({
          success: true,
          message: `Successfully connected to Firestore. Found ${querySnapshot.size} documents in test-collection.`,
      });
    } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : 'Unknown error occurred';

        setFirestoreTest({
          success: false,
          message: `Error connecting to Firestore: ${errorMessage}`,
      });
    }
  };

    void testFirestore();
}, []);

  return (
    <>
      <Head>
        <title>Debug Firebase</title>
      </Head>

      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Firebase Debug</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Firebase Configuration</h2>
          {firebaseConfig ? (
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(firebaseConfig, null, 2)}
            </pre>
          ) : (
            <p>Loading Firebase configuration...</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Firestore Connection Test</h2>
          <div className={`p-4 rounded ${firestoreTest.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className={firestoreTest.success ? 'text-green-700' : 'text-red-700'}>
              {firestoreTest.message}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DebugFirebasePage;
