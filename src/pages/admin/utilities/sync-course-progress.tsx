import React, {useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import Button from '@/components/ui/Button';
import {syncCourseProgress } from '@/utilities/syncCourseProgress';
import {toast } from 'sonner';
import {useAuth } from '@/context/AuthContext';
import {collection, getDocs } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

interface SyncResult {
  synced: number;
  failed: number;
  details: Array<{
    userId: string;
    courseId: string;
    oldProgress: number;
    newProgress: number;
    success: boolean;
    error?: string;
}>;
}

const SyncCourseProgressPage: React.FC = () => {
  const {user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<SyncResult | null>(null);
  const [userId, setUserId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [currentUserEnrollments, setCurrentUserEnrollments] = useState<Array<{id: string, courseId: string, courseName: string, progress: number}>>([]);

  // Handle syncing all course progress
  const handleSyncAll = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setResults(null);
      toast.loading('Syncing all course progress...', {id: 'sync-progress'});

      const result = await syncCourseProgress();

      setResults(result);

      if (result.synced > 0) {
        toast.success(`Synced progress for ${result.synced} enrollments. ${result.failed} failed.`, {id: 'sync-progress'});
    } else {
        toast.error(`Failed to sync any enrollments. ${result.failed} failed.`, {id: 'sync-progress'});
    }
  } catch (error: Error | unknown) {
      console.error('Error syncing course progress:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {id: 'sync-progress'});
  } finally {
      setIsProcessing(false);
  }
};

  // Handle syncing for a specific user
  const handleSyncUser = async () => {
    if (isProcessing || !userId) return;

    try {
      setIsProcessing(true);
      setResults(null);
      toast.loading(`Syncing course progress for user ${userId}...`, {id: 'sync-user'});

      const result = await syncCourseProgress(userId);

      setResults(result);

      if (result.synced > 0) {
        toast.success(`Synced progress for ${result.synced} enrollments. ${result.failed} failed.`, {id: 'sync-user'});
    } else {
        toast.error(`Failed to sync any enrollments for user ${userId}. ${result.failed} failed.`, {id: 'sync-user'});
    }
  } catch (error: Error | unknown) {
      console.error('Error syncing user course progress:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {id: 'sync-user'});
  } finally {
      setIsProcessing(false);
  }
};

  // Handle syncing for a specific course
  const handleSyncCourse = async () => {
    if (isProcessing || !courseId) return;

    try {
      setIsProcessing(true);
      setResults(null);
      toast.loading(`Syncing progress for course ${courseId}...`, {id: 'sync-course'});

      const result = await syncCourseProgress(undefined, courseId);

      setResults(result);

      if (result.synced > 0) {
        toast.success(`Synced progress for ${result.synced} enrollments in course ${courseId}. ${result.failed} failed.`, {id: 'sync-course'});
    } else {
        toast.error(`Failed to sync any enrollments for course ${courseId}. ${result.failed} failed.`, {id: 'sync-course'});
    }
  } catch (error: Error | unknown) {
      console.error('Error syncing course progress:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {id: 'sync-course'});
  } finally {
      setIsProcessing(false);
  }
};

  // Handle syncing for a specific user and course
  const handleSyncUserCourse = async () => {
    if (isProcessing || !userId || !courseId) return;

    try {
      setIsProcessing(true);
      setResults(null);
      toast.loading(`Syncing progress for user ${userId} in course ${courseId}...`, {id: 'sync-user-course'});

      const result = await syncCourseProgress(userId, courseId);

      setResults(result);

      if (result.synced > 0) {
        toast.success(`Successfully synced progress for user ${userId} in course ${courseId}.`, {id: 'sync-user-course'});
    } else {
        toast.error(`Failed to sync progress for user ${userId} in course ${courseId}.`, {id: 'sync-user-course'});
    }
  } catch (error: Error | unknown) {
      console.error('Error syncing user course progress:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {id: 'sync-user-course'});
  } finally {
      setIsProcessing(false);
  }
};

  // Fetch current user's enrollments
  useEffect(() => {
    const fetchCurrentUserEnrollments = async () => {
      if (!user) return;

      try {
        const enrollmentsRef = collection(firestore, `users/${user.uid}/enrollments`);
        const enrollmentsSnapshot = await getDocs(enrollmentsRef);

        const enrollments = enrollmentsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            courseId: doc.id,
            courseName: typeof data.courseName === 'string' ? data.courseName : 'Unknown Course',
            progress: typeof data.progress === 'number' ? data.progress : 0
          };
      });

        setCurrentUserEnrollments(enrollments);
    } catch (error) {
        console.error('Error fetching current user enrollments:', error);
    }
  };

    void fetchCurrentUserEnrollments();
}, [user]);

  // Handle syncing current user's enrollment
  const handleSyncCurrentUserCourse = async (courseId: string) => {
    if (isProcessing || !user || !courseId) return;

    try {
      setIsProcessing(true);
      toast.loading(`Syncing your progress for course ${courseId}...`, {id: 'sync-current-user-course'});

      const result = await syncCourseProgress(user.uid, courseId);

      if (result.synced > 0) {
        toast.success(`Successfully synced your progress for course ${courseId}.`, {id: 'sync-current-user-course'});

        // Update the enrollment in the UI
        setCurrentUserEnrollments(prev =>
          prev.map(enrollment =>
            enrollment.courseId === courseId
              ? {...enrollment, progress: result.details[0].newProgress }
              : enrollment
          )
        );
    } else {
        toast.error(`Failed to sync your progress for course ${courseId}.`, {id: 'sync-current-user-course'});
    }
  } catch (error: Error | unknown) {
      console.error('Error syncing current user course progress:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {id: 'sync-current-user-course'});
  } finally {
      setIsProcessing(false);
  }
};

  return (
    <AdminLayout title="Sync Course Progress">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Sync Course Progress</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p className="text-neutral-700 mb-4">
            This utility syncs progress data between the courseProgress collection and user enrollment documents.
            This helps resolve issues where progress might be showing correctly in the course learning page but not
            on the My Learning dashboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border border-neutral-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Sync All Progress</h2>
              <p className="text-neutral-600 mb-4">
                This will sync progress for all users and all courses. This may take some time if there are many enrollments.
              </p>
              <Button
                onClick={() => void handleSyncAll()}
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Sync All Progress'}
              </Button>
            </div>

            <div className="border border-neutral-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Sync by User ID</h2>
              <div className="mb-4">
                <label className="block text-neutral-600 mb-1">User ID</label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded"
                  placeholder="Enter user ID"
                />
              </div>
              <Button
                onClick={() => void handleSyncUser()}
                disabled={isProcessing || !userId}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Sync User Progress'}
              </Button>
            </div>

            <div className="border border-neutral-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Sync by Course ID</h2>
              <div className="mb-4">
                <label className="block text-neutral-600 mb-1">Course ID</label>
                <input
                  type="text"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded"
                  placeholder="Enter course ID"
                />
              </div>
              <Button
                onClick={() => void handleSyncCourse()}
                disabled={isProcessing || !courseId}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Sync Course Progress'}
              </Button>
            </div>

            <div className="border border-neutral-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Sync Specific Enrollment</h2>
              <div className="mb-4">
                <label className="block text-neutral-600 mb-1">User ID</label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded"
                  placeholder="Enter user ID"
                />
              </div>
              <div className="mb-4">
                <label className="block text-neutral-600 mb-1">Course ID</label>
                <input
                  type="text"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full p-2 border border-neutral-300 rounded"
                  placeholder="Enter course ID"
                />
              </div>
              <Button
                onClick={() => void handleSyncUserCourse()}
                disabled={isProcessing || !userId || !courseId}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Sync Specific Enrollment'}
              </Button>
            </div>
          </div>
        </div>

        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800 font-medium">Synced Successfully</p>
                <p className="text-2xl font-bold text-green-600">{results.synced}</p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-800 font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-600">{results.failed}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 font-medium">Total Processed</p>
                <p className="text-2xl font-bold text-blue-600">{results.synced + results.failed}</p>
              </div>
            </div>

            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>

            {showDetails && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Course ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Old Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">New Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Error</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {results.details.map((detail, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{detail.userId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{detail.courseId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{detail.oldProgress}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{detail.newProgress}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {detail.success ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Success
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{detail.error || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Current User's Enrollments */}
        {user && currentUserEnrollments.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Your Enrollments</h2>
            <p className="text-neutral-600 mb-4">
              These are your own enrollments. You can sync progress for any of these courses.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Course Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Current Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {currentUserEnrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{enrollment.courseName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        <div className="w-full bg-neutral-200 rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{width: `${enrollment.progress}%` }}
                          ></div>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500">{enrollment.progress}% complete</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          onClick={() => void handleSyncCurrentUserCourse(enrollment.courseId)}
                          disabled={isProcessing}
                          size="sm"
                        >
                          Sync Progress
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SyncCourseProgressPage;
