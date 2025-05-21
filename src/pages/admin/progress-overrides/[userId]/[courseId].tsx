import React, {useState, useEffect } from 'react';
import {useRouter } from 'next/router';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import {useAuth } from '@/context/AuthContext';
import {firestore } from '@/services/firebase';
import {doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import {toast } from 'sonner';
import Button from '@/components/ui/Button';
import {User } from '@/types/user.types';
import {Course, CourseProgress } from '@/types/course.types';
import Link from 'next/link';
import {
  adminMarkCourseComplete,
  adminResetCourseProgress,
  adminRevokeEnrollment,
  adminMarkModuleComplete,
  adminResetModuleProgress,
  adminMarkLessonComplete,
  adminResetLessonProgress
} from '@/utilities/adminProgressOverrides';

export default function CourseProgressOverridePage() {
  const router = useRouter();
  const {userId, courseId } = router.query;
  const {user: adminUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  // Fetch data
  useEffect(() => {
    if (!userId || !courseId || !adminUser) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch user data
        const userRef = doc(firestore, 'users', userId as string);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          setError('User not found');
          return;
      }

        // Use type assertion with caution, ensuring we have a valid user object
        const userData = userDoc.data();
        // Check if we have the minimum required user data
        if (!userData || typeof userData !== 'object' || !('email' in userData)) {
          setError('Invalid user data');
          return;
      }

        // Create a user object with required fields, using defaults for missing properties
        setUser({
          id: userDoc.id,
          uid: userDoc.id,
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          displayName: userData.displayName || userData.email || '',
          location: userData.location || '',
          country: userData.country || '',
          city: userData.city || '',
          department: userData.department || null,
          departmentId: userData.departmentId || null,
          companyId: userData.companyId || false,
          ...userData // Include any other fields from the document
      } as User);

        // Fetch course data
        const courseRef = doc(firestore, 'courses', courseId as string);
        const courseDoc = await getDoc(courseRef);

        if (!courseDoc.exists()) {
          setError('Course not found');
          return;
      }

        setCourse({id: courseDoc.id, ...courseDoc.data() } as Course);

        // Fetch enrollment data
        const enrollmentRef = doc(firestore, `users/${userId}/enrollments/${courseId}`);
        const enrollmentDoc = await getDoc(enrollmentRef);

        if (!enrollmentDoc.exists()) {
          setError('Enrollment not found');
          return;
      }

        setEnrollment({id: enrollmentDoc.id, ...enrollmentDoc.data() });

        // Fetch progress data
        const progressRef = doc(firestore, 'courseProgress', `${userId}_${courseId}`);
        const progressDoc = await getDoc(progressRef);

        if (progressDoc.exists()) {
          setProgress(progressDoc.data() as CourseProgress);
      }

        // Fetch modules and lessons
        const modulesList = courseDoc.data().modulesList || [];
        const modulesData = await Promise.all(
          modulesList.map(async (moduleId: string) => {
            const moduleRef = doc(firestore, 'modules', moduleId);
            const moduleDoc = await getDoc(moduleRef);

            if (!moduleDoc.exists()) return null;

            const moduleData = {id: moduleDoc.id, ...moduleDoc.data() };

            // Fetch lessons for this module
            const lessonsRef = collection(firestore, `modules/${moduleId}/lessons`);
            const lessonsQuery = query(lessonsRef, orderBy('order', 'asc'));
            const lessonsSnapshot = await getDocs(lessonsQuery);

            const lessons = lessonsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          }));

            return {
              ...moduleData,
              lessons
          };
        })
        );

        setModules(modulesData.filter(Boolean));
    } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(`Error fetching data: ${err.message}`);
        toast.error(`Error fetching data: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };

    fetchData();
}, [userId, courseId, adminUser]);

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
  }));
};

  // Check if a lesson is completed
  const isLessonCompleted = (moduleId: string, lessonId: string) => {
    if (!progress) return false;

    return progress.completedLessons.includes(`${moduleId}_${lessonId}`);
};

  // Check if a module is completed
  const isModuleCompleted = (moduleId: string) => {
    if (!progress) return false;

    return progress.completedModules.includes(moduleId);
};

  // Handle course-level actions
  const handleCourseAction = async (action: 'complete' | 'reset' | 'revoke') => {
    if (!adminUser?.uid || !userId || !courseId) return;

    setActionLoading(true);

    try {
      let result;

      switch (action) {
        case 'complete':
          result = await adminMarkCourseComplete(
            userId as string,
            courseId as string,
            adminUser.uid,
            adminNote || undefined
          );
          break;
        case 'reset':
          result = await adminResetCourseProgress(
            userId as string,
            courseId as string,
            adminUser.uid,
            adminNote || undefined
          );
          break;
        case 'revoke':
          result = await adminRevokeEnrollment(
            userId as string,
            courseId as string,
            adminUser.uid,
            adminNote || undefined
          );
          break;
    }

      if (result.success) {
        toast.success(result.message);
        // Refresh data
        router.reload();
    } else {
        toast.error(result.message);
    }
  } catch (err: any) {
      console.error(`Error performing course action (${action}):`, err);
      toast.error(`Error: ${err.message}`);
  } finally {
      setActionLoading(false);
  }
};

  // Handle module-level actions
  const handleModuleAction = async (moduleId: string, action: 'complete' | 'reset') => {
    if (!adminUser?.uid || !userId || !courseId) return;

    setActionLoading(true);

    try {
      let result;

      switch (action) {
        case 'complete':
          result = await adminMarkModuleComplete(
            userId as string,
            courseId as string,
            moduleId,
            adminUser.uid,
            adminNote || undefined
          );
          break;
        case 'reset':
          result = await adminResetModuleProgress(
            userId as string,
            courseId as string,
            moduleId,
            adminUser.uid,
            adminNote || undefined
          );
          break;
    }

      if (result && result.success) {
        toast.success(result.message);
        // Refresh data
        router.reload();
    } else if (result) {
        toast.error(result.message);
    } else {
        toast.error("Operation failed with no result");
    }
  } catch (err: any) {
      console.error(`Error performing module action (${action}):`, err);
      toast.error(`Error: ${err.message}`);
  } finally {
      setActionLoading(false);
  }
};

  // Handle lesson-level actions
  const handleLessonAction = async (moduleId: string, lessonId: string, action: 'complete' | 'reset') => {
    if (!adminUser?.uid || !userId || !courseId) return;

    setActionLoading(true);

    try {
      let result;

      switch (action) {
        case 'complete':
          result = await adminMarkLessonComplete(
            userId as string,
            courseId as string,
            moduleId,
            lessonId,
            adminUser.uid,
            adminNote || undefined
          );
          break;
        case 'reset':
          result = await adminResetLessonProgress(
            userId as string,
            courseId as string,
            moduleId,
            lessonId,
            adminUser.uid,
            adminNote || undefined
          );
          break;
    }

      if (result.success) {
        toast.success(result.message);
        // Refresh data
        router.reload();
    } else {
        toast.error(result.message);
    }
  } catch (err: any) {
      console.error(`Error performing lesson action (${action}):`, err);
      toast.error(`Error: ${err.message}`);
  } finally {
      setActionLoading(false);
  }
};

  return (
    <AdminLayout title="Course Progress Override | Admin">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Back button */}
          <div className="mb-6">
            <Link href="/admin/progress-overrides" passHref>
              <Button variant="outline" size="sm">
                &larr; Back to Progress Overrides
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-semibold mb-2">
                  Course Progress Override
                </h1>
                <div className="flex flex-col md:flex-row md:items-center gap-2 text-neutral-600">
                  <div>
                    <span className="font-medium">User:</span> {user?.displayName || 'N/A'} ({user?.email})
                  </div>
                  <div className="hidden md:block">•</div>
                  <div>
                    <span className="font-medium">Course:</span> {course?.title || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Course-level actions */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Course-Level Actions</h2>
                <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
                  <div className="mb-4">
                    <p className="text-neutral-600 mb-2">
                      <span className="font-medium">Enrollment Status:</span> {enrollment?.status.charAt(0).toUpperCase() + enrollment?.status.slice(1) || 'N/A'}
                    </p>
                    <p className="text-neutral-600 mb-2">
                      <span className="font-medium">Progress:</span> {progress?.overallProgress || enrollment?.progress || 0}%
                    </p>
                    <p className="text-neutral-600 mb-2">
                      <span className="font-medium">Completed:</span> {progress?.completed ? 'Yes' : 'No'}
                    </p>
                    {progress?.completedDate && (
                      <p className="text-neutral-600 mb-2">
                        <span className="font-medium">Completed Date:</span> {new Date(progress.completedDate).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Admin Note (Optional)
                    </label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className="w-full border border-neutral-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={2}
                      placeholder="Add a note explaining this override"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleCourseAction('complete')}
                      disabled={actionLoading}
                      variant="success"
                    >
                      Mark Course as Completed
                    </Button>
                    <Button
                      onClick={() => handleCourseAction('reset')}
                      disabled={actionLoading}
                      variant="warning"
                    >
                      Reset Course Progress
                    </Button>
                    <Button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to revoke this enrollment? This action cannot be undone.')) {
                          handleCourseAction('revoke');
                      }
                    }}
                      disabled={actionLoading}
                      variant="danger"
                    >
                      Revoke Enrollment
                    </Button>
                  </div>
                </div>
              </div>

              {/* Modules and Lessons */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Modules and Lessons</h2>

                {modules.length === 0 ? (
                  <div className="bg-neutral-50 p-6 rounded-md text-center">
                    <p className="text-neutral-600">No modules found for this course.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {modules.map((module) => (
                      <div key={module.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                        <div
                          className={`px-6 py-4 flex justify-between items-center cursor-pointer ${isModuleCompleted(module.id) ? 'bg-green-50' : 'bg-neutral-50'}`}
                          onClick={() => toggleModule(module.id)}
                        >
                          <div>
                            <h3 className="text-lg font-medium">
                              {isModuleCompleted(module.id) && (
                                <span className="text-green-600 mr-2">✓</span>
                              )}
                              {module.title}
                            </h3>
                            <p className="text-sm text-neutral-500">
                              {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex gap-2">
                              <Button
                                onClick={(e) => {
                                  if (e) e.stopPropagation(); // Add null check
                                  handleModuleAction(module.id, 'complete');
                              }}
                                disabled={actionLoading}
                                variant="success"
                                size="sm"
                              >
                                Mark Complete
                              </Button>
                              <Button
                                onClick={(e) => {
                                  if (e) e.stopPropagation(); // Add null check for the event
                                  handleModuleAction(module.id, 'reset');
                              }}
                                disabled={actionLoading}
                                variant="warning"
                                size="sm"
                              >
                                Reset
                              </Button>
                            </div>
                            <span className="text-neutral-400">
                              {expandedModules[module.id] ? '▼' : '▶'}
                            </span>
                          </div>
                        </div>

                        {expandedModules[module.id] && (
                          <div className="px-6 py-4 border-t border-neutral-200">
                            {module.lessons.length === 0 ? (
                              <p className="text-neutral-600 text-center py-2">No lessons in this module</p>
                            ) : (
                              <ul className="divide-y divide-neutral-100">
                                {module.lessons.map((lesson: any) => (
                                  <li key={lesson.id} className="py-3">
                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center">
                                        {isLessonCompleted(module.id, lesson.id) ? (
                                          <span className="text-green-600 mr-2">✓</span>
                                        ) : (
                                          <span className="text-neutral-300 mr-2">○</span>
                                        )}
                                        <span className={isLessonCompleted(module.id, lesson.id) ? 'text-neutral-900' : 'text-neutral-600'}>
                                          {lesson.title}
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => handleLessonAction(module.id, lesson.id, 'complete')}
                                          disabled={actionLoading}
                                          variant="success"
                                          size="xs"
                                        >
                                          Mark Complete
                                        </Button>
                                        <Button
                                          onClick={() => handleLessonAction(module.id, lesson.id, 'reset')}
                                          disabled={actionLoading}
                                          variant="warning"
                                          size="xs"
                                        >
                                          Reset
                                        </Button>
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}







