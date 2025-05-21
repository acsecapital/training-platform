import React, {useState } from 'react';
import Link from 'next/link';
import {motion, AnimatePresence } from 'framer-motion';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  isCompleted?: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  modules: Module[];
}

interface LessonNavigationSidebarProps {
  course: Course;
  currentModuleId: string;
  currentLessonId: string;
  completedLessons: string[];
  onLessonSelect: (moduleId: string, lessonId: string) => void;
  progress: number;
}

const LessonNavigationSidebar: React.FC<LessonNavigationSidebarProps> = ({
  course,
  currentModuleId,
  currentLessonId,
  completedLessons,
  onLessonSelect,
  progress,
}) => {
  const [expandedModules, setExpandedModules] = useState<string[]>([currentModuleId]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
};

  // Get icon for lesson type
  const getLessonTypeIcon = (type: 'video' | 'text' | 'quiz') => {
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
  }
};

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed bottom-4 right-4 z-20">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-primary text-white p-3 rounded-full shadow-lg"
          aria-label="Toggle course navigation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{opacity: 0 }}
            animate={{opacity: 1 }}
            exit={{opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.div
        className={`fixed md:sticky top-0 left-0 h-screen md:h-screen w-3/4 md:w-80 bg-white border-r border-neutral-200 z-40 md:z-10 overflow-y-auto ${
          sidebarOpen ? 'block' : 'hidden md:block'
      }`}
        initial={{x: '-100%'}}
        animate={{x: sidebarOpen ? 0 : '-100%'}}
        exit={{x: '-100%'}}
        transition={{type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="p-4 border-b border-neutral-200">
          <Link href={`/courses/${course.id}`} className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium text-sm truncate">{course.title}</span>
          </Link>
        </div>
        
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Your Progress</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="p-4">
          <h2 className="text-sm font-semibold uppercase text-neutral-500 mb-4">Course Content</h2>
          
          <div className="space-y-2">
            {course.modules.map((module) => (
              <div key={module.id} className="border border-neutral-200 rounded-md overflow-hidden">
                {/* Module Header */}
                <div 
                  className={`p-3 flex justify-between items-center cursor-pointer ${
                    module.id === currentModuleId ? 'bg-primary-50' : 'bg-white hover:bg-neutral-50'
                }`}
                  onClick={() => toggleModule(module.id)}
                >
                  <h3 className="font-medium text-sm">{module.title}</h3>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 text-neutral-500 transition-transform ${
                      expandedModules.includes(module.id) ? 'transform rotate-180' : ''
                  }`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {/* Module Lessons */}
                <AnimatePresence>
                  {expandedModules.includes(module.id) && (
                    <motion.div
                      initial={{height: 0, opacity: 0 }}
                      animate={{height: 'auto', opacity: 1 }}
                      exit={{height: 0, opacity: 0 }}
                      transition={{duration: 0.2 }}
                    >
                      <div className="divide-y divide-neutral-100">
                        {module.lessons.map((lesson) => {
                          const isCompleted = completedLessons.includes(lesson.id);
                          const isCurrent = lesson.id === currentLessonId;
                          
                          return (
                            <button
                              key={lesson.id}
                              className={`w-full text-left p-3 flex items-center text-sm ${
                                isCurrent
                                  ? 'bg-primary-100 text-primary-800'
                                  : isCompleted
                                  ? 'bg-green-50 text-green-800'
                                  : 'hover:bg-neutral-50'
                            }`}
                              onClick={() => {
                                onLessonSelect(module.id, lesson.id);
                                setSidebarOpen(false);
                            }}
                            >
                              <span className="mr-3 flex-shrink-0">
                                {isCompleted ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <span className={isCurrent ? 'text-primary-600' : 'text-neutral-500'}>
                                    {getLessonTypeIcon(lesson.type)}
                                  </span>
                                )}
                              </span>
                              
                              <span className="truncate">{lesson.title}</span>
                              
                              {isCurrent && (
                                <span className="ml-auto text-xs bg-primary-200 text-primary-800 px-1.5 py-0.5 rounded">
                                  Current
                                </span>
                              )}
                            </button>
                          );
                      })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default LessonNavigationSidebar;
