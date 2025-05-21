import React, {useState, useEffect } from 'react';
import {Course, Module, Lesson, CourseProgress } from '@/types/course.types';
import {collection, getDocs, query, orderBy, doc, getDoc, QueryDocumentSnapshot, QuerySnapshot, FirestoreDataConverter } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {useAuth } from '@/context/AuthContext';

interface CourseProgressVisualizerProps {
  courseId: string;
  progress?: CourseProgress;
}

const lessonConverter: FirestoreDataConverter<Lesson> = {
  toFirestore: (lesson: Lesson) => {
    // Convert Lesson object to Firestore data (omit id)
    const { id, ...rest } = lesson;
    return rest;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    // Convert Firestore data to Lesson object
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title as string || '', // Explicitly cast and provide default
      description: data.description as string || '', // Explicitly cast and provide default
      type: data.type as string || 'text', // Explicitly cast and provide default
      content: data.content as string || '', // Explicitly cast and provide default
      videoId: data.videoId as string | undefined, // Explicitly cast
      duration: data.duration as number | undefined, // Explicitly cast
      order: data.order as number || 0, // Explicitly cast and provide default
      status: data.status as 'draft' | 'published' | 'archived' || 'draft', // Explicitly cast and provide default
      quizQuestions: (data.quizQuestions || data.questions) as AdminQuizQuestion[] | undefined, // Explicitly cast to AdminQuizQuestion[]
      passingScore: data.passingScore as number | undefined, // Explicitly cast
      resources: data.resources as string[] | undefined, // Explicitly cast
      createdAt: data.createdAt as string | undefined, // Explicitly cast
      updatedAt: data.updatedAt as string | undefined, // Explicitly cast
      completed: data.completed as boolean | undefined, // Explicitly cast
      instructor: data.instructor as string | undefined, // Explicitly cast
      instructorTitle: data.instructorTitle as string | undefined, // Explicitly cast
      instructorBio: data.instructorBio as string | undefined, // Explicitly cast
      instructorAvatar: data.instructorAvatar as string | undefined, // Explicitly cast
    };
  },
};

const CourseProgressVisualizer: React.FC<CourseProgressVisualizerProps> = ({
  courseId,
  progress
}) => {
  const {user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState(false);

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId || !user?.uid) return; // Add check for user existence

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
        const lessonPromises: Promise<QuerySnapshot<Lesson>>[] = [];

        // Process modules and collect lesson fetch promises
        for (const moduleDoc of modulesSnapshot.docs) {
          const moduleData = moduleDoc.data() as Omit<Module, 'id'>;

          // Skip modules that aren't published unless they're already started
          if (moduleData.status !== 'published' &&
              (!progress || !progress.completedLessons.some(id => id.startsWith(`${moduleDoc.id}_`)))) {
            continue;
        }

          // Check if module is available based on dates
          const now = new Date();
          if (moduleData.availableFrom && new Date(moduleData.availableFrom) > now) {
            continue;
        }
          if (moduleData.availableTo && new Date(moduleData.availableTo) < now) {
            continue;
        }

          // Check prerequisites
          if (moduleData.prerequisites && moduleData.prerequisites.length > 0) {
            const allPrerequisitesMet = moduleData.prerequisites.every(prereqId =>
              progress && progress.completedModules.includes(prereqId)
            );

            if (!allPrerequisitesMet) {
              continue;
          }
        }

          // Prepare lesson fetch promises for this module
          const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleDoc.id}/lessons`).withConverter(lessonConverter);
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

        // Map lessons back to their respective modules
        modulesData.forEach((module, index) => {
          const lessonsSnapshot = lessonsSnapshots[index];
          const lessonsData: Lesson[] = lessonsSnapshot.docs
            .filter((lessonDoc: QueryDocumentSnapshot<Lesson>) => {
              const lessonData = lessonDoc.data();
              return lessonData.status === 'published';
          })
            .map((lessonDoc: QueryDocumentSnapshot<Lesson>) => lessonDoc.data()); // Use data directly from converter
          module.lessons = lessonsData;
      });

        setModules(modulesData);

        // Initialize expanded state
        const initialExpandedState: Record<string, boolean> = {};
        modulesData.forEach(module => {
          // Auto-expand the first incomplete module
          const isModuleCompleted = progress && progress.completedModules.includes(module.id);
          const hasIncompleteLessons = module.lessons && module.lessons.some(lesson =>
            !progress || !progress.completedLessons.includes(`${module.id}_${lesson.id}`)
          );

          initialExpandedState[module.id] = expandAll || (!isModuleCompleted && (hasIncompleteLessons || false));
      });
        setExpandedModules(initialExpandedState);

    } catch (err: unknown) {
        console.error('Error fetching course structure:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load course structure. Please try again.';
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
  };

    fetchCourseData();
}, [courseId, expandAll, progress, user?.uid]); // Add user?.uid to dependency array

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
  }));
};

  // Toggle all modules
  const toggleAllModules = () => {
    const newExpandAll = !expandAll;
    setExpandAll(newExpandAll);

    const newExpandedState: Record<string, boolean> = {};
    modules.forEach(module => {
      newExpandedState[module.id] = newExpandAll;
  });
    setExpandedModules(newExpandedState);
};

  // Calculate module completion status
  const getModuleCompletionStatus = (module: Module) => {
    if (!module.lessons || module.lessons.length === 0) {
      return {completed: 0, total: 0, percentage: 0 };
  }

    const total = module.lessons.length;
    const completed = module.lessons.filter(lesson =>
      progress && progress.completedLessons.includes(`${module.id}_${lesson.id}`)
    ).length;
    const percentage = Math.round((completed / total) * 100);

    return {completed, total, percentage };
};

  // Check if a lesson is completed
  const isLessonCompleted = (moduleId: string, lessonId: string) => {
    return progress && progress.completedLessons.includes(`${moduleId}_${lessonId}`);
};

  // Check if a module is locked
  const isModuleLocked = (module: Module, index: number) => {
    // First module is never locked
    if (index === 0) return false;

    // Check prerequisites
    if (module.prerequisites && module.prerequisites.length > 0) {
      const allPrerequisitesMet = module.prerequisites.every(prereqId =>
        progress && progress.completedModules.includes(prereqId)
      );

      if (!allPrerequisitesMet) return true;
  }

    // Check if previous module needs to be completed first (if no specific prerequisites)
    if (!module.prerequisites && index > 0) {
      const prevModule = modules[index - 1];
      if (prevModule && prevModule.isRequired && (!progress || !progress.completedModules.includes(prevModule.id))) {
        return true;
    }
  }

    return false;
};

  // Get lesson type icon
  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'quiz':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default: // text
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
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

  if (modules.length === 0) {
    return (
      <div className="p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="text-lg font-medium text-neutral-900 mb-1">No modules available</h3>
        <p className="text-neutral-500">
          This course doesn't have any available modules yet.
        </p>
      </div>
    );
}

  // Calculate overall progress
  const totalLessons = modules.reduce((count, module) => count + (module.lessons?.length || 0), 0);
  const completedLessons = progress ? progress.completedLessons.length : 0;
  const overallPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="space-y-4">
      {course && (
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">{course.title}</h1>
      )}
      {/* Overall Progress */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200 p-4">
        <h2 className="text-lg font-medium text-neutral-900 mb-2">Course Progress</h2>
        <div className="flex items-center">
          <div className="w-full bg-neutral-200 rounded-full h-4 mr-3">
            <div
              className="bg-primary-600 h-4 rounded-full"
              style={{width: `${overallPercentage}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-neutral-600 whitespace-nowrap">{overallPercentage}% Complete</span>
        </div>
        <div className="mt-2 text-sm text-neutral-500">
          {completedLessons} of {totalLessons} lessons completed
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-neutral-900">Course Content</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAllModules}
        >
          {expandAll ? 'Collapse All' : 'Expand All'}
        </Button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
        {modules.map((module, moduleIndex) => {
          const {completed, total, percentage } = getModuleCompletionStatus(module);
          const isLocked = isModuleLocked(module, moduleIndex);
          const isCompleted = progress && progress.completedModules.includes(module.id);

          return (
            <div key={module.id} className="border-b border-neutral-200 last:border-b-0">
              {/* Module Header */}
              <div
                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 ${
                  expandedModules[module.id] ? 'bg-neutral-50' : ''
              } ${isLocked ? 'opacity-60' : ''}`}
                onClick={() => !isLocked && toggleModule(module.id)}
              >
                <div className="flex items-center">
                  <div className="mr-3 text-neutral-400">
                    {isLocked ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : isCompleted ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 transition-transform ${expandedModules[module.id] ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900">
                      Module {moduleIndex + 1}: {module.title}
                    </h3>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs text-neutral-500">
                        {total} lessons
                      </span>
                      {module.isRequired && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Required
                        </span>
                      )}
                      {isLocked && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="mr-4">
                    <div className="flex items-center">
                      <div className="w-32 bg-neutral-200 rounded-full h-2.5 mr-2">
                        <div
                          className={`h-2.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-primary-600'}`}
                          style={{width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-neutral-600">{percentage}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lessons List */}
              {expandedModules[module.id] && !isLocked && (
                <div className="bg-neutral-50 border-t border-neutral-200">
                  {module.lessons && module.lessons.length > 0 ? (
                    <ul className="divide-y divide-neutral-200">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const lessonCompleted = isLessonCompleted(module.id, lesson.id);

                        return (
                          <li key={lesson.id} className="p-3 pl-12 flex items-center justify-between hover:bg-neutral-100">
                            <div className="flex items-center">
                              <div className="mr-3 text-neutral-500">
                                {lessonCompleted ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  getLessonTypeIcon(lesson.type)
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-neutral-900">
                                  {lessonIndex + 1}. {lesson.title}
                                </h4>
                                <div className="flex items-center mt-1">
                                  <span className="text-xs text-neutral-500">
                                    {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
                                  </span>
                                  {lesson.duration && (
                                    <span className="text-xs text-neutral-500 ml-2">
                                      {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Link href={`/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}`} passHref>
                              <Button variant={lessonCompleted ? "outline" : "primary"} size="sm">
                                {lessonCompleted ? 'Review' : 'Start'}
                              </Button>
                            </Link>
                          </li>
                        );
                    })}
                    </ul>
                  ) : (
                    <div className="p-4 pl-12 text-center">
                      <p className="text-sm text-neutral-500">No lessons in this module yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
      })}
      </div>
    </div>
  );
};

export default CourseProgressVisualizer;
