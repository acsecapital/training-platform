import React, {useState } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import Button from '@/components/ui/Button';
import {createCourseProgressCollection, createTestCourseProgressDocument } from '@/utilities/migrations/createCourseProgressCollection';
import {toast } from 'sonner';
import {collection, getDocs } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

// Define the MigrationResult interface to match the return type of createCourseProgressCollection
interface MigrationResult {
  processed: number;
  created: number;
  errors: string[];
  details: {
    userId: string;
    courseId: string;
    success: boolean;
    error?: string;
  }[];
}

export default function CreateCourseProgressPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<MigrationResult | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Function to test if we can create a document in the courseProgress collection
  const handleTestCollection = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setTestResult(null);
      toast.loading('Testing courseProgress collection...', {id: 'test-progress'});

      // First, check if the collection exists
      try {
        const collectionRef = collection(firestore, 'courseProgress');
        const snapshot = await getDocs(collectionRef);
        const docsCount = snapshot.size;
        console.log(`Found ${docsCount} documents in courseProgress collection`);
        setTestResult(`Found ${docsCount} existing documents in courseProgress collection`);
    } catch (err) {
        console.log('Error checking collection, it might not exist yet:', err);
        setTestResult('Collection does not exist yet or cannot be accessed');
    }

      // Try to create a test document
      const success = await createTestCourseProgressDocument();

      if (success) {
        toast.success('Successfully created test document in courseProgress collection!', {id: 'test-progress'});
        setTestResult(prev => `${prev || ''}\nSuccessfully created test document in courseProgress collection!`);
    } else {
        toast.error('Failed to verify test document creation', {id: 'test-progress'});
        setTestResult(prev => `${prev || ''}\nFailed to verify test document creation`);
    }
  } catch (error: unknown) {
      console.error('Error testing courseProgress collection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error: ${errorMessage}`, {id: 'test-progress'});
      setTestResult(`Error: ${errorMessage}`);
  } finally {
      setIsProcessing(false);
  }
};

  const handleCreateCourseProgress = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      toast.loading('Creating courseProgress collection...', {id: 'create-progress'});

      const result = await createCourseProgressCollection();

      setResults(result);
      toast.success(`Migration completed. Created ${result.created} progress documents. ${result.errors.length > 0 ? `(${result.errors.filter(e => e.includes("not found")).length} warnings about deleted courses)` : ''}`, {id: 'create-progress'});
  } catch (error: unknown) {
      console.error('Error creating courseProgress collection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error: ${errorMessage}`, {id: 'create-progress'});
  } finally {
      setIsProcessing(false);
  }
};

  return (
    <AdminLayout title="Create Course Progress Collection | Admin">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-semibold mb-6">Create Course Progress Collection</h1>

          <div className="mb-6">
            <p className="text-neutral-600 mb-4">
              This utility will create the courseProgress collection in Firestore and migrate existing progress data from user enrollment documents.
            </p>
            <p className="text-neutral-600 mb-4">
              <strong>Important:</strong> This is a one-time operation. Once the collection is created, all progress tracking will use this collection instead of the enrollment documents.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-700">
                <strong>Warning:</strong> This operation may take some time depending on the number of users and enrollments. Do not close this page until the operation completes.
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-4 mb-8">
            <div>
              <h3 className="text-lg font-medium mb-2">Step 1: Test Collection Access</h3>
              <p className="text-neutral-600 mb-4">
                First, test if you can create documents in the courseProgress collection. This will help diagnose any permission issues.
              </p>
              <Button
                onClick={() => void handleTestCollection()}
                disabled={isProcessing}
                variant="outline"
              >
                {isProcessing ? 'Testing...' : 'Test Collection Access'}
              </Button>

              {testResult && (
                <div className="mt-4 p-4 bg-neutral-50 rounded-md border border-neutral-200">
                  <h4 className="font-medium mb-2">Test Results:</h4>
                  <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-lg font-medium mb-2">Step 2: Create Course Progress Collection</h3>
              <p className="text-neutral-600 mb-4">
                Once you've confirmed collection access works, run the full migration to create progress documents for all enrollments.
              </p>
              <Button
                onClick={() => void handleCreateCourseProgress()}
                disabled={isProcessing}
                variant="primary"
              >
                {isProcessing ? 'Processing...' : 'Create Course Progress Collection'}
              </Button>
            </div>
          </div>

          {results && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Results</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-neutral-100 p-4 rounded-lg">
                  <p className="text-lg font-medium">{results.processed}</p>
                  <p className="text-sm text-neutral-600">Enrollments Processed</p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg">
                  <p className="text-lg font-medium">{results.created}</p>
                  <p className="text-sm text-neutral-600">Progress Documents Created</p>
                </div>
                <div className="bg-red-100 p-4 rounded-lg">
                  <p className="text-lg font-medium">{results.errors.length}</p>
                  <p className="text-sm text-neutral-600">Errors</p>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Errors</h3>
                  <div className="bg-red-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                    <ul className="list-disc pl-5">
                      {results.errors.map((error, index) => (
                        <li key={index} className={error.includes("not found") ? "text-yellow-700" : "text-red-700"}>
                          {error.includes("Course") && error.includes("not found")
                            ? error.replace("Error:", "Warning:") + " (This is not a critical error, progress record was still created)"
                            : error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium mb-2">Details</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Course ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {results.details.map((detail, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{detail.userId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{detail.courseId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {detail.success ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Success</span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Failed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
