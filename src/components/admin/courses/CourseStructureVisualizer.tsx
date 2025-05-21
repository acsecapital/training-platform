import React, {useState, useEffect } from 'react';
import {Course, Module, Lesson } from '@/types/course.types';
import {collection, getDocs, query, orderBy, getDoc, doc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface CourseStructureVisualizerProps {
  courseId: string;
  readOnly?: boolean;
}

// Define a proper type for modulesList items
interface ModuleListItem {
  id: string;
  title: string;
  order: number;
  status: 'draft' | 'published';
  isRequired?: boolean;
  // Add other properties that might exist on module objects
}

const CourseStructureVisualizer: React.FC<CourseStructureVisualizerProps> = ({
  courseId,
  readOnly = false
}) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState(false);

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch course data first
        const courseRef = doc(firestore, `courses/${courseId}`);
        const courseSnapshot = await getDoc(courseRef);
        
        if (!courseSnapshot.exists()) {
          setError('Course not found');
          setLoading(false);
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

        // Use proper typing for modulesList
        const modulesList: (string | ModuleListItem)[] = courseData.modulesList || [];

        // If modulesList is an array of strings (module IDs), we need to fetch the actual module objects
        const modulesData: Module[] = [];

        // Check if modulesList is an array of strings or objects
        if (modulesList.length > 0 && typeof modulesList[0] === 'string') {
          // It's an array of module IDs, fetch the actual modules
          for (const moduleId of modulesList as string[]) {
            try {
              const moduleDoc = await getDoc(doc(firestore, `courses/${courseId}/modules/${moduleId}`));
              if (moduleDoc.exists()) {
                const moduleData = moduleDoc.data() as Omit<Module, 'id'>;
                
                // Fetch lessons for this module
                const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleId}/lessons`);
                const lessonsQuery = query(lessonsRef, orderBy('order', 'asc'));
                const lessonsSnapshot = await getDocs(lessonsQuery);
                
                const lessonsData: Lesson[] = lessonsSnapshot.docs.map(lessonDoc => ({
                  id: lessonDoc.id,
                  ...lessonDoc.data() as Omit<Lesson, 'id'>
              }));
                
                modulesData.push({
                  id: moduleId,
                  ...moduleData,
                  lessons: lessonsData
              });
            }
          } catch (error) {
              console.error(`Error fetching module ${moduleId}:`, error);
          }
        }
      } else {
          // It's already an array of module objects
          for (const moduleObj of modulesList as ModuleListItem[]) {
            if (typeof moduleObj === 'object' && moduleObj !== null) {
              const moduleId = moduleObj.id;
              // Fetch lessons for this module
              const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleId}/lessons`);
              const lessonsQuery = query(lessonsRef, orderBy('order', 'asc'));
              const lessonsSnapshot = await getDocs(lessonsQuery);
              
              const lessonsData: Lesson[] = lessonsSnapshot.docs.map(lessonDoc => ({
                id: lessonDoc.id,
                ...lessonDoc.data() as Omit<Lesson, 'id'>
            }));
              
              modulesData.push({
                ...moduleObj,
                lessons: lessonsData
            });
          }
        }
      }

        // Now use modulesData which has the proper Module type with lessons
        setModules(modulesData);
        
        // Initialize expanded state
        const initialExpandedState: Record<string, boolean> = {};
        modulesData.forEach(module => {
          initialExpandedState[module.id] = expandAll;
      });
        setExpandedModules(initialExpandedState);
        
    } catch (err: any) {
        console.error('Error fetching course structure:', err);
        setError('Failed to load course structure. Please try again.');
    } finally {
        setLoading(false);
    }
  };

    fetchCourseData();
}, [courseId, expandAll]);

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
    const completed = module.lessons.filter(lesson => lesson.status === 'published').length;
    const percentage = Math.round((completed / total) * 100);
    
    return {completed, total, percentage };
};

  // Get status badge color
  const getStatusBadgeColor = (status: 'draft' | 'published') => {
    return status === 'published' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
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
        <h3 className="text-lg font-medium text-neutral-900 mb-1">No modules found</h3>
        <p className="text-neutral-500">
          This course doesn't have any modules yet.
        </p>
        {!readOnly && (
          <Link href={`/admin/courses/${courseId}/modules`} passHref>
            <Button variant="primary" className="mt-4">
              Manage Modules
            </Button>
          </Link>
        )}
      </div>
    );
}

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-neutral-900">Course Structure</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleAllModules}
          >
            {expandAll ? 'Collapse All' : 'Expand All'}
          </Button>
          {!readOnly && (
            <Link href={`/admin/courses/${courseId}/modules`} passHref>
              <Button variant="outline" size="sm">
                Manage Modules
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
        {modules.map((module, moduleIndex) => {
          const {completed, total, percentage } = getModuleCompletionStatus(module);
          
          return (
            <div key={module.id} className="border-b border-neutral-200 last:border-b-0">
              {/* Module Header */}
              <div 
                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 ${
                  expandedModules[module.id] ? 'bg-neutral-50' : ''
              }`}
                onClick={() => toggleModule(module.id)}
              >
                <div className="flex items-center">
                  <div className="mr-3 text-neutral-400">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 transition-transform ${expandedModules[module.id] ? 'rotate-90' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-neutral-900">
                      Module {moduleIndex + 1}: {module.title}
                    </h3>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusBadgeColor(module.status)
                    }`}>
                        {module.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {total} lessons
                      </span>
                      {module.isRequired && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Required
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
                          className="bg-primary-600 h-2.5 rounded-full" 
                          style={{width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-neutral-600">{percentage}%</span>
                    </div>
                  </div>
                  {!readOnly && (
                    <Link href={`/admin/courses/${courseId}/modules/${module.id}/edit`} passHref>
                      <Button variant="outline" size="sm" className="mr-2">
                        Edit
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Lessons List */}
              {expandedModules[module.id] && (
                <div className="bg-neutral-50 border-t border-neutral-200">
                  {module.lessons && module.lessons.length > 0 ? (
                    <ul className="divide-y divide-neutral-200">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <li key={lesson.id} className="p-3 pl-12 flex items-center justify-between hover:bg-neutral-100">
                          <div className="flex items-center">
                            <div className="mr-3 text-neutral-500">
                              {getLessonTypeIcon(lesson.type)}
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-neutral-900">
                                {lessonIndex + 1}. {lesson.title}
                              </h4>
                              <div className="flex items-center mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  getStatusBadgeColor(lesson.status)
                              }`}>
                                  {lesson.status === 'published' ? 'Published' : 'Draft'}
                                </span>
                                <span className="text-xs text-neutral-500 ml-2">
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
                          {!readOnly && (
                            <Link href={`/admin/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}/edit`} passHref>
                              <Button variant="ghost" size="sm">
                                Edit
                              </Button>
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 pl-12 text-center">
                      <p className="text-sm text-neutral-500">No lessons in this module yet.</p>
                      {!readOnly && (
                        <Link href={`/admin/courses/${courseId}/modules/${module.id}/lessons/new`} passHref>
                          <Button variant="outline" size="sm" className="mt-2">
                            Add Lesson
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                  
                  {!readOnly && module.lessons && module.lessons.length > 0 && (
                    <div className="p-3 pl-12 border-t border-neutral-200">
                      <Link href={`/admin/courses/${courseId}/modules/${module.id}/lessons/new`} passHref>
                        <Button variant="ghost" size="sm">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add Lesson
                          </span>
                        </Button>
                      </Link>
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

export default CourseStructureVisualizer;







