import React, {useState } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import Button from '@/components/ui/Button';
import {collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {initializeCourseProgress } from '@/services/courseProgressService';

const FixEnrollmentsPage: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<{
    usersProcessed: number;
    enrollmentsFixed: number;
    progressDocsCreated: number;
    errors: string[];
}>({
    usersProcessed: 0,
    enrollmentsFixed: 0,
    progressDocsCreated: 0,
    errors: []
});
  const [log, setLog] = useState<string[]>([]);

  const addToLog = (message: string) => {
    setLog(prev => [...prev, message]);
};

  const fixEnrollments = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setResults({
      usersProcessed: 0,
      enrollmentsFixed: 0,
      progressDocsCreated: 0,
      errors: []
  });
    setLog([]);

    try {
      addToLog('Starting enrollment fix process...');

      // Get all users
      const usersRef = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersRef);

      addToLog(`Found ${usersSnapshot.docs.length} users to process`);

      let usersProcessed = 0;
      let enrollmentsFixed = 0;
      let progressDocsCreated = 0;
      const errors: string[] = [];

      // Process each user
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        try {
          addToLog(`Processing user: ${userId}`);

          // Get all enrollments for this user
          const enrollmentsRef = collection(firestore, `users/${userId}/enrollments`);
          const enrollmentsSnapshot = await getDocs(enrollmentsRef);

          addToLog(`Found ${enrollmentsSnapshot.docs.length} enrollments for user ${userId}`);

          // Process each enrollment
          for (const enrollmentDoc of enrollmentsSnapshot.docs) {
            const enrollmentId = enrollmentDoc.id;
            const enrollmentData = enrollmentDoc.data();
            const courseId = enrollmentData?.courseId as string;

            // Skip if the enrollment ID is already the course ID
            if (enrollmentId === courseId) {
              addToLog(`Enrollment ${enrollmentId} for user ${userId} already has correct ID`);
              continue;
          }

            try {
              // Check if a document with the course ID already exists
              const correctEnrollmentRef = doc(firestore, `users/${userId}/enrollments`, courseId);
              const correctEnrollmentDoc = await getDoc(correctEnrollmentRef);

              if (!correctEnrollmentDoc.exists()) {
                // Create a new enrollment document with the course ID as the document ID
                await setDoc(correctEnrollmentRef, {
                  ...enrollmentData,
                  updatedAt: new Date().toISOString()
              });

                addToLog(`Created new enrollment document for user ${userId}, course ${courseId}`);
                enrollmentsFixed++;
            } else {
                addToLog(`Enrollment document for user ${userId}, course ${courseId} already exists`);
            }

              // Check if course progress document exists
              const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
              const progressDoc = await getDoc(progressRef);

              if (!progressDoc.exists()) {
                // Initialize course progress
                try {
                  // Get course name
                  const courseRef = doc(firestore, 'courses', courseId);
                  const courseDoc = await getDoc(courseRef);
                  const courseName = courseDoc.exists() ? (courseDoc.data()?.title as string) : 'Unknown Course';

                  await initializeCourseProgress(userId, courseId, courseName);
                  addToLog(`Initialized course progress for user ${userId}, course ${courseId}`);
                  progressDocsCreated++;
              } catch (error) {
                  const errorMessage = `Error initializing course progress for user ${userId}, course ${courseId}: ${String(error)}`;
                  addToLog(errorMessage);
                  errors.push(errorMessage);
              }
            } else {
                addToLog(`Course progress for user ${userId}, course ${courseId} already exists`);
            }

              // Optionally delete the old enrollment document
              // Uncomment this if you want to delete the old documents
              // await deleteDoc(enrollmentDoc.ref);
              // addToLog(`Deleted old enrollment document ${enrollmentId} for user ${userId}`);

          } catch (error) {
              const errorMessage = `Error processing enrollment ${enrollmentId} for user ${userId}: ${String(error)}`;
              addToLog(errorMessage);
              errors.push(errorMessage);
          }
        }

          usersProcessed++;
      } catch (error) {
          const errorMessage = `Error processing user ${userId}: ${String(error)}`;
          addToLog(errorMessage);
          errors.push(errorMessage);
      }
    }

      setResults({
        usersProcessed,
        enrollmentsFixed,
        progressDocsCreated,
        errors
    });

      addToLog('Enrollment fix process completed');

  } catch (error) {
      addToLog(`Error in fix process: ${String(error)}`);
      setResults(prev => ({
        ...prev,
        errors: [...prev.errors, `General error: ${String(error)}`]
    }));
  } finally {
      setIsProcessing(false);
  }
};

  return (
    <AdminLayout title="Fix Enrollments">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-4">Fix Enrollment Documents</h1>

        <div className="mb-6">
          <p className="text-neutral-700 mb-2">
            This utility fixes enrollment documents by ensuring that:
          </p>
          <ul className="list-disc pl-5 mb-4 text-neutral-700">
            <li>Enrollment documents use the course ID as their document ID</li>
            <li>Course progress documents exist for each enrollment</li>
          </ul>
          <p className="text-neutral-700 mb-4">
            This helps resolve issues where users cannot mark lessons as complete or track their progress.
          </p>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This process may take some time depending on the number of users and enrollments.
                  Do not navigate away from this page while the process is running.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => void fixEnrollments()}
            disabled={isProcessing}
            className="w-full md:w-auto"
          >
            {isProcessing ? 'Processing...' : 'Fix Enrollment Documents'}
          </Button>
        </div>

        {/* Results Section */}
        {(results.usersProcessed > 0 || results.errors.length > 0) && (
          <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded shadow-sm">
                <p className="text-sm text-neutral-500">Users Processed</p>
                <p className="text-2xl font-bold">{results.usersProcessed}</p>
              </div>
              <div className="bg-white p-4 rounded shadow-sm">
                <p className="text-sm text-neutral-500">Enrollments Fixed</p>
                <p className="text-2xl font-bold">{results.enrollmentsFixed}</p>
              </div>
              <div className="bg-white p-4 rounded shadow-sm">
                <p className="text-sm text-neutral-500">Progress Docs Created</p>
                <p className="text-2xl font-bold">{results.progressDocsCreated}</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Errors ({results.errors.length})</h3>
                <div className="bg-red-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                  <ul className="list-disc pl-5">
                    {results.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Log Section */}
        {log.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Process Log</h2>
            <div className="bg-neutral-800 text-neutral-100 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
              {log.map((entry, index) => (
                <div key={index} className="mb-1">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FixEnrollmentsPage;
