import React from 'react';
import Link from 'next/link';
import {DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Button from '@/components/ui/Button';
import {doc, updateDoc, Timestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {verifyAllModuleLessonCounts } from '@/services/moduleService';
import {toast } from 'sonner';

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  status: 'draft' | 'published';
  lessonCount: number;
}

interface ModuleListProps {
  modules: Module[];
  courseId: string;
  onDelete: (moduleId: string) => void;
}

const ModuleList: React.FC<ModuleListProps> = ({modules, courseId, onDelete }) => {
  // Handle drag and drop reordering
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const {source, destination } = result;

    if (source.index === destination.index) return;

    try {
      // Reorder modules in state (optimistic update)
      const reorderedModules = Array.from(modules);
      const [removed] = reorderedModules.splice(source.index, 1);
      reorderedModules.splice(destination.index, 0, removed);

      // Update order property for each module
      const updatedModules = reorderedModules.map((module, index) => ({
        ...module,
        order: index
    }));

      // Note: We are not updating the state here directly to avoid prop immutability issues.
      // The parent component (CourseModulesPage) will refetch and update the state.

      // Update order in Firestore
      const updatePromises = updatedModules.map(module =>
        updateDoc(doc(firestore, `courses/${courseId}/modules/${module.id}`), {
          order: module.order,
          updatedAt: Timestamp.now()
      })
      );

      await Promise.all(updatePromises);

      // Verify all module lesson counts after reordering
      await verifyAllModuleLessonCounts(courseId);

      toast.success('Module order saved successfully');
  } catch (err: any) {
      console.error('Error reordering modules:', err);
      toast.error('Failed to save module order');
      // TODO: Implement a way to revert the UI if the Firestore update fails
  }
};

  if (modules.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-neutral-900 mb-1">No modules found</h3>
          <p className="text-neutral-500 mb-4">
            Get started by creating your first module.
          </p>
          <Link href={`/admin/courses/${courseId}/modules/create`}>
            <Button variant="primary">
              Create Module
            </Button>
          </Link>
        </div>
      </div>
    );
}

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="modules">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="divide-y divide-neutral-200"
            >
              {modules.map((module, index) => (
                <Draggable key={module.id} draggableId={module.id} index={index}>
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
                        
                        {/* Module content */}
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-neutral-900">
                              {module.title}
                            </h3>
                            <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              module.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                              {module.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                          </div>
                          
                          <p className="mt-1 text-sm text-neutral-500">
                            {module.description.length > 100
                              ? `${module.description.substring(0, 100)}...`
                              : module.description}
                          </p>
                          
                          <div className="mt-2 text-sm text-neutral-500">
                            {module.lessonCount} {module.lessonCount === 1 ? 'lesson' : 'lessons'}
                          </div>
                          
                          {/* Actions */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link href={`/admin/courses/${courseId}/modules/${module.id}/edit`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                            <Link href={`/admin/courses/${courseId}/modules/${module.id}/lessons`}>
                              <Button variant="outline" size="sm">
                                Manage Lessons
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
                                  onDelete(module.id);
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

export default ModuleList;
