import React from 'react';
import Link from 'next/link';
import {DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Button from '@/components/ui/Button';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  content: string;
  videoId?: string;
  duration: number;
  order: number;
  status: 'draft' | 'published';
}

interface LessonListProps {
  lessons: Lesson[];
  courseId: string;
  moduleId: string;
  onDelete: (lessonId: string) => void;
}

const LessonList: React.FC<LessonListProps> = ({lessons, courseId, moduleId, onDelete }) => {
  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    // Implement drag and drop reordering logic
    // This will be implemented to update the order of lessons
};

  // Format duration in minutes and seconds
  const formatDuration = (seconds: number) => {
    if (!seconds) return 'No duration';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds} sec`;
  }
    
    return `${minutes} min ${remainingSeconds > 0 ? `${remainingSeconds} sec` : ''}`;
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

  if (lessons.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No lessons found</h3>
          <p className="text-neutral-500 mb-4">
            Get started by creating your first lesson.
          </p>
          <Link href={`/admin/courses/${courseId}/modules/${moduleId}/lessons/create`}>
            <Button variant="primary">
              Create Lesson
            </Button>
          </Link>
        </div>
      </div>
    );
}

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="lessons">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="divide-y divide-neutral-200"
            >
              {lessons.map((lesson, index) => (
                <Draggable key={lesson.id} draggableId={lesson.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="p-6"
                    >
                      <div className="flex items-start">
                        {/* Drag handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="mr-4 flex-shrink-0 text-neutral-400 cursor-move"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </div>
                        
                        {/* Lesson type icon */}
                        <div className="mr-4 flex-shrink-0">
                          {getLessonTypeIcon(lesson.type)}
                        </div>
                        
                        {/* Lesson content */}
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-neutral-900">
                              {lesson.title}
                            </h3>
                            <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              lesson.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                              {lesson.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                            <span className="ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-neutral-100 text-neutral-800">
                              {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}
                            </span>
                          </div>
                          
                          {lesson.type === 'video' && lesson.videoId && (
                            <div className="mt-1 text-sm text-neutral-500">
                              Video ID: {lesson.videoId}
                            </div>
                          )}
                          
                          {lesson.duration > 0 && (
                            <div className="mt-1 text-sm text-neutral-500">
                              Duration: {formatDuration(lesson.duration)}
                            </div>
                          )}
                          
                          {/* Actions */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link href={`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/edit`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                            <Link href={`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/preview`}>
                              <Button variant="outline" size="sm">
                                Preview
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
                                  onDelete(lesson.id);
                              }
                            }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default LessonList;
