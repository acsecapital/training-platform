import React, {useState, useEffect } from 'react';
import {CourseProgress, Course, Module, Lesson } from '@/types/course.types';
import {collection, getDocs, query, orderBy, doc, getDoc, QueryDocumentSnapshot } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {useAuth } from '@/context/AuthContext';
import {resetCourseProgress } from '@/services/courseProgressService';
import {formatDuration } from '@/utils/formatters';

interface CourseProgressDetailsProps {
  courseId: string;
  progress?: CourseProgress;
}

const CourseProgressDetails: React.FC<CourseProgressDetailsProps> = ({
  courseId,
  progress
}) => {
  const {user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch course
        const courseRef = doc(firestore, `courses/${courseId}`);
        const courseSnapshot = await getDoc(courseRef);
        
        if (!courseSnapshot.exists()) {
          setError('Course not found');
          return;
      }
        
        const courseData = {
          id: courseSnapshot.id,
          ...courseSnapshot.data() as Omit<Course, 'id'>
      };
        
        setCourse(courseData);

        // Fetch modules
        const modulesRef = collection(firestore, `courses/${courseId}/modules`);
        const modulesQuery = query(modulesRef, orderBy('order', 'asc'));
        const modulesSnapshot = await getDocs(modulesQuery);

        const modulesData: Module[] = [];
        const lessonPromises: Promise<any>[] = [];

        // Process modules and collect lesson fetch promises
        for (const moduleDoc of modulesSnapshot.docs) {
          const moduleData = moduleDoc.data() as Omit<Module, 'id'>;

          // Skip modules that aren't published
          if (moduleData.status !== 'published') {
            continue;
        }

          // Prepare lesson fetch promises for this module
          const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleDoc.id}/lessons`);
          const lessonsQuery = query(lessonsRef, orderBy('order', 'asc'));
          lessonPromises.push(getDocs(lessonsQuery));

          modulesData.push({
            id: moduleDoc.id,
            ...moduleData,
            lessons: [] // Temporarily empty, will be filled after Promise.all
        });
      }

        // Execute all lesson fetch promises in parallel
        const lessonsSnapshots = await Promise.all(lessonPromises);

        const finalModulesData: Module[] = modulesData.map((module, index) => {
          const lessonsSnapshot = lessonsSnapshots[index];
          const lessonsData: Lesson[] = lessonsSnapshot.docs
            .filter((lessonDoc: QueryDocumentSnapshot<Lesson>) => {
              const lessonData = lessonDoc.data();
              return lessonData.status === 'published';
          })
            .map((lessonDoc: QueryDocumentSnapshot<Lesson>) => ({
              id: lessonDoc.id,
              ...lessonDoc.data() as Omit<Lesson, 'id'>
          }));
          return {
            ...module,
            lessons: lessonsData
        };
      });

        setModules(finalModulesData);
    } catch (err: any) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course data. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchCourseData();
}, [courseId]);

  // Handle course reset
  const handleResetCourse = async () => {
    if (!user || !courseId) return;
    
    try {
      setResetting(true);
      await resetCourseProgress(user.uid, courseId);
      window.location.reload(); // Reload the page to refresh progress data
  } catch (err) {
      console.error('Error resetting course progress:', err);
      setError('Failed to reset course progress. Please try again.');
  } finally {
      setResetting(false);
      setShowConfirmReset(false);
  }
};

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
}

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        {error}
      </div>
    );
}

  if (!progress) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
        No progress data available for this course.
      </div>
    );
}

  // Calculate time spent in a readable format
  const totalTimeSpent = formatDuration(progress.timeSpent || 0);
  
  // Calculate completion date if available
  const completionDate = progress.completedDate 
    ? new Date(progress.completedDate).toLocaleDateString() 
    : 'Not completed yet';

  // Get last accessed lesson
  const lastPosition = progress.lastPosition;
  let lastAccessedLesson = '';
  
  if (lastPosition) {
    const module = modules.find(m => m.id === lastPosition.moduleId);
    const lesson = module?.lessons?.find(l => l.id === lastPosition.lessonId);
    
    if (module && lesson) {
      lastAccessedLesson = `${module.title} - ${lesson.title}`;
  }
}

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-6">
        <h2 className="text-lg font-medium text-neutral-900 mb-4">Progress Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-neutral-500 mb-1">Overall Progress</h3>
            <div className="flex items-center">
              <div className="w-full bg-neutral-200 rounded-full h-2.5 mr-2">
                <div 
                  className={`h-2.5 rounded-full ${progress.completed ? 'bg-green-500' : 'bg-primary-600'}`}
                  style={{width: `${progress.overallProgress}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{progress.overallProgress}%</span>
            </div>
          </div>
          
          <div className="bg-neutral-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-neutral-500 mb-1">Time Spent</h3>
            <p className="text-lg font-medium text-neutral-900">{totalTimeSpent}</p>
          </div>
          
          <div className="bg-neutral-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-neutral-500 mb-1">Started On</h3>
            <p className="text-lg font-medium text-neutral-900">
              {new Date(progress.startDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="bg-neutral-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-neutral-500 mb-1">Completion Status</h3>
            <div className="flex items-center">
              {progress.completed ? (
                <>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                    Completed
                  </span>
                  <span className="text-sm text-neutral-500">
                    {completionDate}
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  In Progress
                </span>
              )}
            </div>
          </div>
        </div>
        
        {lastAccessedLesson && (
          <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
            <h3 className="text-sm font-medium text-neutral-500 mb-1">Last Accessed</h3>
            <div className="flex justify-between items-center">
              <p className="text-neutral-700">{lastAccessedLesson}</p>
              <Link href={`/courses/${courseId}/modules/${lastPosition?.moduleId}/lessons/${lastPosition?.lessonId}`} passHref>
                <Button variant="primary" size="sm">
                  Continue
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Module Progress */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-medium text-neutral-900">Module Progress</h2>
        </div>
        
        <div className="divide-y divide-neutral-200">
          {modules.map((module) => {
            const moduleProgressData = progress.moduleProgress?.[module.id];
            
            if (!moduleProgressData) {
              return null;
          }
            
            return (
              <div key={module.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-neutral-900">{module.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    moduleProgressData.completed 
                      ? 'bg-green-100 text-green-800' 
                      : moduleProgressData.progress > 0 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-neutral-100 text-neutral-800'
                }`}>
                    {moduleProgressData.completed 
                      ? 'Completed' 
                      : moduleProgressData.progress > 0 
                        ? 'In Progress' 
                        : 'Not Started'}
                  </span>
                </div>
                
                <div className="flex items-center mb-2">
                  <div className="w-full bg-neutral-200 rounded-full h-2.5 mr-2">
                    <div 
                      className={`h-2.5 rounded-full ${moduleProgressData.completed ? 'bg-green-500' : 'bg-primary-600'}`}
                      style={{width: `${moduleProgressData.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-neutral-600 whitespace-nowrap">{moduleProgressData.progress}%</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-neutral-500">
                  <div>
                    <span className="font-medium">Lessons:</span> {moduleProgressData.completedLessons || 0}/{moduleProgressData.totalLessons || 0}
                  </div>
                  <div>
                    <span className="font-medium">Time Spent:</span> {formatDuration(moduleProgressData.timeSpent || 0)}
                  </div>
                  {moduleProgressData.startDate && (
                    <div>
                      <span className="font-medium">Started:</span> {new Date(moduleProgressData.startDate).toLocaleDateString()}
                    </div>
                  )}
                  {moduleProgressData.completedDate && (
                    <div>
                      <span className="font-medium">Completed:</span> {new Date(moduleProgressData.completedDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
        })}
        </div>
      </div>
      
      {/* Notes & Bookmarks */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-medium text-neutral-900">Your Notes & Bookmarks</h2>
        </div>
        
        <div className="p-4">
          {Object.entries(progress.lessonProgress || {}).some(
            ([_, lessonProgress]) => 
              (lessonProgress.notes && lessonProgress.notes.length > 0) || 
              (lessonProgress.bookmarks && lessonProgress.bookmarks.length > 0)
          ) ? (
            <div className="space-y-6">
              {modules.map(module => {
                // Get all lessons in this module that have notes or bookmarks
                const lessonsWithNotes = module.lessons?.filter(lesson => {
                  const lessonProgress = progress.lessonProgress?.[`${module.id}_${lesson.id}`];
                  return lessonProgress && (
                    (lessonProgress.notes && lessonProgress.notes.length > 0) || 
                    (lessonProgress.bookmarks && lessonProgress.bookmarks.length > 0)
                  );
              });
                
                if (!lessonsWithNotes || lessonsWithNotes.length === 0) {
                  return null;
              }
                
                return (
                  <div key={module.id} className="space-y-4">
                    <h3 className="font-medium text-neutral-900 border-b border-neutral-200 pb-2">{module.title}</h3>
                    
                    {lessonsWithNotes.map(lesson => {
                      const lessonProgress = progress.lessonProgress?.[`${module.id}_${lesson.id}`];
                      
                      if (!lessonProgress) {
                        return null;
                    }
                      
                      return (
                        <div key={lesson.id} className="pl-4 border-l-2 border-neutral-200">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-neutral-700">{lesson.title}</h4>
                            <Link href={`/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}`} passHref>
                              <Button variant="ghost" size="sm">
                                Go to Lesson
                              </Button>
                            </Link>
                          </div>
                          
                          {/* Notes */}
                          {lessonProgress.notes && lessonProgress.notes.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-neutral-600 mb-1">Notes</h5>
                              <ul className="space-y-2">
                                {lessonProgress.notes.map((note, index) => (
                                  <li key={index} className="bg-neutral-50 p-3 rounded-md text-sm">
                                    {note}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {/* Bookmarks */}
                          {lessonProgress.bookmarks && lessonProgress.bookmarks.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-neutral-600 mb-1">Bookmarks</h5>
                              <ul className="space-y-2">
                                {lessonProgress.bookmarks.map((bookmark) => (
                                  <li key={bookmark.id} className="bg-neutral-50 p-3 rounded-md">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs text-neutral-500">
                                        {lesson.type === 'video' ? `${Math.floor(bookmark.position / 60)}:${(bookmark.position % 60).toString().padStart(2, '0')}` : 'Position: ' + bookmark.position}
                                      </span>
                                      <span className="text-xs text-neutral-500">
                                        {new Date(bookmark.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm">{bookmark.note}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                  })}
                  </div>
                );
            })}
            </div>
          ) : (
            <div className="text-center p-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-900 mb-1">No Notes or Bookmarks</h3>
              <p className="text-neutral-500 mb-4">
                You haven't added any notes or bookmarks to your lessons yet.
              </p>
              <p className="text-sm text-neutral-500">
                Add notes and bookmarks while taking lessons to keep track of important information.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Reset Progress */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-6">
        <h2 className="text-lg font-medium text-neutral-900 mb-4">Reset Progress</h2>
        <p className="text-neutral-600 mb-4">
          If you want to start this course from the beginning, you can reset your progress. This will remove all your completed lessons, notes, and bookmarks.
        </p>
        
        {showConfirmReset ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <h3 className="text-red-700 font-medium mb-2">Are you sure?</h3>
            <p className="text-red-600 text-sm mb-4">
              This action cannot be undone. All your progress, notes, and bookmarks for this course will be permanently deleted.
            </p>
            <div className="flex space-x-2">
              <Button
                variant="danger"
                onClick={handleResetCourse}
                disabled={resetting}
              >
                {resetting ? 'Resetting...' : 'Yes, Reset Progress'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirmReset(false)}
                disabled={resetting}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
            onClick={() => setShowConfirmReset(true)}
          >
            Reset Course Progress
          </Button>
        )}
      </div>
    </div>
  );
};

export default CourseProgressDetails;


