import React, {useState, useEffect } from 'react';
import {collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {Lesson, LessonType } from '@/types/course.types';
import Button from '@/components/ui/Button';
import LessonForm from './LessonForm';
import {DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {toast } from 'sonner';
import {useRouter } from 'next/router';
import {updateModuleLessonCount, updateCourseLessonCount, createLesson, deleteLesson, verifyAllModuleLessonCounts } from '@/services/moduleService';

interface LessonManagerProps {
  courseId: string;
  moduleId: string;
  onClose?: () => void;
}

const LessonManager: React.FC<LessonManagerProps> = ({courseId, moduleId, onClose }) => {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch lessons for the module
  const fetchLessons = async () => {
    if (!courseId || !moduleId) return;

    try {
      setLoading(true);
      setError(null);

      const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleId}/lessons`);
      const q = query(lessonsRef, orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);

      const lessonsList: Lesson[] = [];
      querySnapshot.forEach((doc) => {
        lessonsList.push({
          id: doc.id,
          ...doc.data() as Omit<Lesson, 'id'>
      });
    });

      setLessons(lessonsList);
  } catch (err: any) {
      console.error('Error fetching lessons:', err);
      setError('Failed to load lessons. Please try again.');
  } finally {
      setLoading(false);
  }
};

  // Initial fetch
  useEffect(() => {
    if (courseId && moduleId) {
      fetchLessons();
  }
}, [courseId, moduleId]);

  // Handle lesson creation/update
  const handleSubmitLesson = async (lessonData: Partial<Lesson>) => {
    if (!courseId || !moduleId) return;

    try {
      setIsSubmitting(true);

      const now = new Date().toISOString();

      if (editingLesson) {
        // Update existing lesson
        const lessonRef = doc(firestore, `courses/${courseId}/modules/${moduleId}/lessons/${editingLesson.id}`);
        await updateDoc(lessonRef, {
          ...lessonData,
          updatedAt: now
      });

        // Update the module's lesson count
        await updateModuleLessonCount(courseId, moduleId);

        // Update the course's total lesson count
        await updateCourseLessonCount(courseId);

        // Verify all module lesson counts after update
        await verifyAllModuleLessonCounts(courseId);

        toast.success('Lesson updated successfully');
    } else {
        // Create new lesson using the service function
        await createLesson(courseId, moduleId, lessonData);

        toast.success('Lesson created successfully');
    }

      // Reset form
      resetForm();

      // Refresh lessons
      fetchLessons();

      // Verify all module lesson counts after deletion
      await verifyAllModuleLessonCounts(courseId);

  } catch (err: any) {
      console.error('Error saving lesson:', err);
      toast.error(`Failed to save lesson: ${err.message || 'Unknown error'}`);
  } finally {
      setIsSubmitting(false);
  }
};

  // Handle lesson deletion
  const handleDeleteLesson = async (lessonId: string) => {
    if (!courseId || !moduleId || !lessonId) return;

    if (!confirm('Are you sure you want to delete this lesson?')) {
      return;
  }

    try {
      setLoading(true);

      // Delete the lesson using the service function
      await deleteLesson(courseId, moduleId, lessonId);

      toast.success('Lesson deleted successfully');

      // Refresh lessons
      fetchLessons();

      // Verify all module lesson counts after deletion
      await verifyAllModuleLessonCounts(courseId);

  } catch (err: any) {
      console.error('Error deleting lesson:', err);
      toast.error(`Failed to delete lesson: ${err.message || 'Unknown error'}`);
  } finally {
      setLoading(false);
  }
};

  // Handle lesson reordering
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const {source, destination } = result;

    if (source.index === destination.index) return;

    try {
      setLoading(true);

      // Reorder lessons in state
      const reorderedLessons = Array.from(lessons);
      const [removed] = reorderedLessons.splice(source.index, 1);
      reorderedLessons.splice(destination.index, 0, removed);

      // Update order property for each lesson
      const updatedLessons = reorderedLessons.map((lesson, index) => ({
        ...lesson,
        order: index
    }));

      setLessons(updatedLessons);

      // Update order in Firestore
      const updatePromises = updatedLessons.map(lesson =>
        updateDoc(doc(firestore, `courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`), {
          order: lesson.order,
          updatedAt: Timestamp.now()
      })
      );

      await Promise.all(updatePromises);

      // Update the module's lesson count to ensure consistency
      await updateModuleLessonCount(courseId, moduleId);

      // Update the course's total lesson count
      await updateCourseLessonCount(courseId);

      // Verify all module lesson counts after reordering
      await verifyAllModuleLessonCounts(courseId);

      toast.success('Lesson order saved successfully');
  } catch (err: any) {
      console.error('Error reordering lessons:', err);
      toast.error('Failed to save lesson order');
      // Revert to original order
      fetchLessons();
  } finally {
      setLoading(false);
  }
};

  // Handle edit button click
  const handleEdit = (lesson: Lesson) => {
    // Navigate to the lesson edit page instead of showing the inline form
    router.push(`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}/edit`);
    // Close the lesson manager if onClose is provided
    if (onClose) {
      onClose();
  }
};

  // Reset form
  const resetForm = () => {
    setEditingLesson(null);
    setShowForm(false);
};

  // Get lesson type display name
  const getLessonTypeDisplay = (type: LessonType): string => {
    switch (type) {
      case 'video':
        return 'Video';
      case 'text':
        return 'Text';
      case 'quiz':
        return 'Quiz';
      default:
        return 'Unknown';
  }
};

  // Format duration
  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button
          variant="primary"
          className="shadow-sm hover:shadow-md transition-shadow"
          onClick={() => {
            resetForm();
            setShowForm(true);
        }}
        >
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Lesson
          </span>
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Lesson Form */}
      {showForm && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <LessonForm
            initialData={editingLesson || {
              title: '',
              description: '',
              type: 'text',
              content: '',
              duration: 0,
              status: 'draft',
          }}
            onSubmit={handleSubmitLesson}
            onCancel={resetForm}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Lessons List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {loading && lessons.length === 0 ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : lessons.length === 0 ? (
          <div className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-1">No lessons found</h3>
            <p className="text-neutral-500">
              Get started by creating your first lesson.
            </p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => {
                resetForm();
                setShowForm(true);
            }}
            >
              Add Lesson
            </Button>
          </div>
        ) : (
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
                          className="p-4 hover:bg-neutral-50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div
                                {...provided.dragHandleProps}
                                className="mr-3 cursor-move text-neutral-400 hover:text-neutral-600"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg font-medium text-neutral-900">{lesson.title}</h3>
                                <p className="text-sm text-neutral-500 mt-1">{lesson.description}</p>
                                <div className="flex items-center mt-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    lesson.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {lesson.status === 'published' ? 'Published' : 'Draft'}
                                  </span>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                                    lesson.type === 'video' ? 'bg-blue-100 text-blue-800' :
                                    lesson.type === 'quiz' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {getLessonTypeDisplay(lesson.type)}
                                  </span>
                                  {lesson.duration > 0 && (
                                    <span className="text-xs text-neutral-500 ml-2">
                                      {formatDuration(lesson.duration)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(lesson)}
                                className="hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200"
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                onClick={() => handleDeleteLesson(lesson.id)}
                              >
                                Delete
                              </Button>
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
        )}
        {loading && lessons.length > 0 && (
          <div className="p-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonManager;
