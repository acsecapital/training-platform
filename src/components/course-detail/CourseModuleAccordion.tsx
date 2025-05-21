import React, {useState } from 'react';
import Link from 'next/link';
import {motion, AnimatePresence } from 'framer-motion';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  duration: number | string;
  isCompleted?: boolean;
  isLocked?: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: Lesson[];
  isCompleted?: boolean;
}

interface CourseModuleAccordionProps {
  modules: Module[];
  courseId: string;
  userProgress?: {
    completedLessons: string[];
    currentLessonId?: string;
};
  showEnrollButton?: boolean;
}

const CourseModuleAccordion: React.FC<CourseModuleAccordionProps> = ({
  modules,
  courseId,
  userProgress,
  showEnrollButton = false,
}) => {
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
};

  // Check if a lesson is completed
  const isLessonCompleted = (lessonId: string): boolean => {
    if (!userProgress) return false;
    return userProgress.completedLessons.includes(lessonId);
};

  // Check if a lesson is the current one
  const isCurrentLesson = (lessonId: string): boolean => {
    if (!userProgress) return false;
    return userProgress.currentLessonId === lessonId;
};

  // Format duration (handle both string and number types)
  const formatDuration = (duration: string | number): string => {
    if (typeof duration === 'string') return duration;
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    if (minutes === 0) {
      return `${seconds} sec`;
  }
    
    return `${minutes} min${seconds > 0 ? ` ${seconds} sec` : ''}`;
};

  // Get icon for lesson type
  const getLessonTypeIcon = (type: 'video' | 'text' | 'quiz') => {
    switch (type) {
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'quiz':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
  }
};

  // Calculate module progress
  const calculateModuleProgress = (module: Module): number => {
    if (!userProgress) return 0;
    
    const completedLessonsInModule = module.lessons.filter(lesson => 
      userProgress.completedLessons.includes(lesson.id)
    ).length;
    
    return Math.round((completedLessonsInModule / module.lessons.length) * 100);
};

  return (
    <div className="space-y-4">
      {modules.map((module) => {
        const moduleProgress = calculateModuleProgress(module);
        
        return (
          <div key={module.id} className="border border-neutral-200 rounded-lg overflow-hidden">
            {/* Module Header */}
            <div 
              className="bg-neutral-50 p-4 flex justify-between items-center cursor-pointer hover:bg-neutral-100 transition-colors"
              onClick={() => toggleModule(module.id)}
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-semibold">{module.title}</h3>
                  {module.isCompleted && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-600">{module.description}</p>
                
                {/* Progress bar (only show if user is enrolled) */}
                {userProgress && (
                  <div className="mt-2">
                    <div className="w-full bg-neutral-200 rounded-full h-1.5 mb-1">
                      <div 
                        className="bg-primary h-1.5 rounded-full" 
                        style={{width: `${moduleProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-500">
                      <span>{moduleProgress}% complete</span>
                      <span>{module.lessons.filter(lesson => isLessonCompleted(lesson.id)).length}/{module.lessons.length} lessons</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center ml-4">
                <span className="text-sm text-neutral-500 mr-3">{module.duration}</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 text-neutral-500 transition-transform ${
                    expandedModules.includes(module.id) ? 'transform rotate-180' : ''
                }`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Module Lessons */}
            <AnimatePresence>
              {expandedModules.includes(module.id) && (
                <motion.div
                  initial={{height: 0, opacity: 0 }}
                  animate={{height: 'auto', opacity: 1 }}
                  exit={{height: 0, opacity: 0 }}
                  transition={{duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="divide-y divide-neutral-100">
                    {module.lessons.map((lesson) => {
                      const isCompleted = isLessonCompleted(lesson.id);
                      const isCurrent = isCurrentLesson(lesson.id);
                      
                      return (
                        <div 
                          key={lesson.id} 
                          className={`p-4 flex justify-between items-center ${
                            isCurrent ? 'bg-primary-50' : ''
                        } ${lesson.isLocked ? 'opacity-60' : 'hover:bg-neutral-50'}`}
                        >
                          <div className="flex items-center">
                            {/* Status icon */}
                            {isCompleted ? (
                              <span className="w-5 h-5 mr-3 flex-shrink-0 text-green-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </span>
                            ) : lesson.isLocked ? (
                              <span className="w-5 h-5 mr-3 flex-shrink-0 text-neutral-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            ) : (
                              <span className="w-5 h-5 mr-3 flex-shrink-0">
                                {getLessonTypeIcon(lesson.type)}
                              </span>
                            )}
                            
                            {/* Lesson title */}
                            <div>
                              <span className={isCurrent ? 'font-medium text-primary' : ''}>{lesson.title}</span>
                              {isCurrent && (
                                <span className="ml-2 text-xs text-primary-700 font-medium">Current</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-sm text-neutral-500 mr-2">{formatDuration(lesson.duration)}</span>
                            
                            {/* Action button */}
                            {userProgress ? (
                              <Link 
                                href={lesson.isLocked ? '#' : `/courses/${courseId}/learn?lessonId=${lesson.id}`}
                                className={`text-sm font-medium px-2 py-1 rounded ${
                                  lesson.isLocked 
                                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
                                    : isCompleted
                                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                      : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                              }`}
                                onClick={(e) => {
                                  if (lesson.isLocked) {
                                    e.preventDefault();
                                }
                              }}
                              >
                                {isCompleted ? 'Review' : isCurrent ? 'Continue' : 'Start'}
                              </Link>
                            ) : (
                              <span className="text-sm text-neutral-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                  })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
    })}
      
      {/* Enroll button for non-enrolled users */}
      {showEnrollButton && !userProgress && (
        <div className="mt-6 text-center">
          <p className="text-neutral-600 mb-4">Enroll to access all course content</p>
          <Link 
            href={`/courses/${courseId}/enroll`}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Enroll Now
          </Link>
        </div>
      )}
    </div>
  );
};

export default CourseModuleAccordion;
