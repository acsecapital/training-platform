import React, {useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
  DocumentData,
  CollectionReference,
  DocumentReference,
  Timestamp
} from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {Module } from '@/types/course.types';
import Button from '@/components/ui/Button';
import ModuleForm from './ModuleForm';
import {DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {toast } from 'sonner';
import {updateCourseLessonCount } from '@/services/moduleService'
import {CourseRepository } from '@/repositories/courseRepository';
import LessonManager from '../lessons/LessonManager';

interface ModuleManagerProps {
  courseId: string;
}

const ModuleManager: React.FC<ModuleManagerProps> = ({courseId }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'modules' | 'lessons'>('modules');

  // Create a typed collection reference with converter
  const modulesCollection = collection(firestore, `courses/${courseId}/modules`);

  const fetchModules = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);

      const q = query(modulesCollection, orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const modulesList: Module[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();

        const module: Module = {
          id: docSnap.id,
          title: data.title || '',
          description: data.description,
          order: data.order ?? 0,
          lessons: data.lessons,
          status: data.status || 'draft',
          isRequired: data.isRequired ?? false,
          availableFrom: data.availableFrom instanceof Timestamp
            ? data.availableFrom.toDate().toISOString()
            : data.availableFrom,
          availableTo: data.availableTo instanceof Timestamp
            ? data.availableTo.toDate().toISOString()
            : data.availableTo,
          prerequisites: data.prerequisites || [],
          completionPercentageRequired: data.completionPercentageRequired ?? 100,
          sectionId: data.sectionId,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate().toISOString()
            : data.updatedAt,
          lessonCount: data.lessonCount ?? 0,
      };

        modulesList.push(module);
    });

      setModules(modulesList);
  } catch (err: any) {
      console.error('Error fetching modules:', err);
      setError('Failed to load modules. Please try again.');
  } finally {
      setLoading(false);
  }
};

  useEffect(() => {
    if (courseId) {
      fetchModules();
  }
}, [courseId]);

  const handleSubmitModule = async (moduleData: Partial<Module>) => {
    if (!courseId) return;

    setIsSubmitting(true);
    setError(null);

    const filteredModuleData = Object.entries(moduleData).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = value;
      return acc;
  }, {} as Record<string, any>);

    try {
      if (editingModule) {
        const moduleRef = doc(firestore, `courses/${courseId}/modules/${editingModule.id}`);
        await updateDoc(moduleRef, {...filteredModuleData, updatedAt: serverTimestamp() });

        // Update the course's lesson count (module count is handled by CourseRepository)
        await updateCourseLessonCount(courseId);

        // Verify the modulesList is correct
        await CourseRepository.verifyModulesList(courseId);

        toast.success('Module updated successfully!');
    } else {
        // Use the repository to add a module
        await CourseRepository.addModule(courseId, {
          ...filteredModuleData,
          order: modules.length,
      });

        toast.success('Module added successfully!');
    }

      resetForm();
      fetchModules();
  } catch (err: any) {
      console.error('Error submitting module:', err);
      setError('Failed to save module. Please try again.');
  } finally {
      setIsSubmitting(false);
  }
};

  const handleDeleteModule = async (moduleId: string) => {
    if (!courseId || !moduleId) {
      console.error('Course ID or Module ID is missing.');
      toast.error('Could not delete module.');
      return;
  }

    try {
      setIsSubmitting(true);
      setError(null);

      // Use the repository to remove the module
      await CourseRepository.removeModule(courseId, moduleId);

      toast.success('Module deleted successfully!');
      fetchModules();
  } catch (err: any) {
      console.error('Error deleting module:', err);
      setError('Failed to delete module. Please try again.');
  } finally {
      setIsSubmitting(false);
  }
};

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setShowForm(true);
};

  const resetForm = () => {
    setEditingModule(null);
    setShowForm(false);
    setIsSortOpen(false);
};

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedModules = Array.from(modules);
    const [moved] = reorderedModules.splice(result.source.index, 1);
    reorderedModules.splice(result.destination.index, 0, moved);

    const updatedModulesWithOrder = reorderedModules.map((module, index) => ({
      ...module,
      order: index,
  }));

    setModules(updatedModulesWithOrder);

    const batch = writeBatch(firestore);
    updatedModulesWithOrder.forEach((module) => {
      const moduleRef = doc(firestore, `courses/${courseId}/modules/${module.id}`);
      batch.update(moduleRef, {order: module.order, updatedAt: serverTimestamp() });
  });

    batch.commit()
      .then(async () => {
        // Update the course's lesson count (module count is handled by CourseRepository)
        await updateCourseLessonCount(courseId);

        // Verify the modulesList is correct
        await CourseRepository.verifyModulesList(courseId);
        toast.success('Module order updated successfully!');
    })
      .catch((error) => {
        console.error('Error updating module order:', error);
        toast.error('Failed to update module order.');
        fetchModules();
    });
};

  // Handle tab change
  const handleTabChange = (tab: 'modules' | 'lessons') => {
    setActiveTab(tab);
    if (tab === 'modules') {
      setSelectedModule(null);
  }
};

  // Handle module selection for lessons tab
  const handleModuleSelect = (moduleId: string) => {
    setSelectedModule(moduleId);
    setActiveTab('lessons');
};

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`${activeTab === 'modules' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => handleTabChange('modules')}
          >
            Modules
          </button>
          <button
            className={`${activeTab === 'lessons' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => handleTabChange('lessons')}
          >
            Lessons
          </button>
        </nav>
      </div>

      {/* Modules Tab Content */}
      {activeTab === 'modules' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-800">Modules</h2>
            <div className="flex items-center space-x-2 justify-end">
              {modules.length > 1 && (
                <div className="relative mr-2">
                  <Button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    variant="outline"
                    size="sm"
                    aria-expanded={isSortOpen}
                    aria-controls="sort-menu"
                  >
                    Sort By
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                  {isSortOpen && (
                    <div
                      id="sort-menu"
                      className="absolute right-0 mt-2 w-40 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="sort-button"
                    >
                      <div className="py-1" role="none">
                        <button
                          onClick={fetchModules}
                          className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                          role="menuitem"
                        >
                          Default Order
                        </button>
                        <button
                          onClick={() => {
                            const sorted = [...modules].sort(
                              (a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
                            );
                            setModules(sorted);
                            setIsSortOpen(false);
                        }}
                          className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                          role="menuitem"
                        >
                          Newest
                        </button>
                        <button
                          onClick={() => {
                            const sorted = [...modules].sort((a, b) => a.title.localeCompare(b.title));
                            setModules(sorted);
                            setIsSortOpen(false);
                        }}
                          className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                          role="menuitem"
                        >
                          Alphabetical
                        </button>
                        <button
                          onClick={() => {
                            const sorted = [...modules].sort(
                              (a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
                            );
                            setModules(sorted);
                            setIsSortOpen(false);
                        }}
                          className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                          role="menuitem"
                        >
                          Date
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Button
                onClick={() => {
                  setEditingModule(null);
                  setShowForm(true);
              }}
                variant="primary"
                size="sm"
              >
                Add Module
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
          )}

          {showForm && (
            <div className="bg-white shadow-sm rounded-lg overflow-visible">
              <ModuleForm
                initialData={
                  editingModule || {
                    title: '',
                    description: '',
                    status: 'draft',
                    isRequired: false,
                    completionPercentageRequired: 100,
                    prerequisites: [],
                    order: modules.length,
                }
              }
                onSubmit={handleSubmitModule}
                onCancel={resetForm}
                isSubmitting={isSubmitting}
                courseId={courseId}
              />
            </div>
          )}

          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {loading && modules.length === 0 ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : modules.length === 0 ? (
              <div className="p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-neutral-900 mb-1">No modules found</h3>
                <p className="text-neutral-500">Get started by creating your first module.</p>
                <Button variant="primary" className="mt-4" onClick={() => setShowForm(true)}>
                  Add Module
                </Button>
              </div>
            ) : (
              <DragDropContext onDragEnd={onDragEnd}>
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
                              {...provided.dragHandleProps}
                              className="p-4 hover:bg-neutral-50 flex items-center justify-between cursor-grab"
                            >
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                                <div>
                                  <h3 className="text-lg font-medium text-neutral-900">{module.title}</h3>
                                  <p className="text-sm text-neutral-500 mt-1">{module.description}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        module.status === 'published'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                    >
                                      {module.status === 'published' ? 'Published' : 'Draft'}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                                      {module.lessonCount || 0} lessons
                                    </span>
                                    {module.isRequired && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Required
                                      </span>
                                    )}
                                    {module.prerequisites && module.prerequisites.length > 0 && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        Has Prerequisites
                                      </span>
                                    )}
                                    {module.availableFrom && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        Scheduled
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(module)}>
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                  onClick={() => handleDeleteModule(module.id)}
                                >
                                  Delete
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleModuleSelect(module.id)}
                                >
                                  View Lessons
                                </Button>
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
            {loading && modules.length > 0 && (
              <div className="p-4 flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Lessons Tab Content */}
      {activeTab === 'lessons' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-800">Lessons</h2>
            {modules.length > 0 && (
              <div className="relative">
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-neutral-300 hover:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary rounded-md bg-white shadow-sm"
                  value={selectedModule || ''}
                  onChange={(e) => setSelectedModule(e.target.value)}
                >
                  <option value="" disabled>Select a module</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.title} ({module.lessonCount || 0} lessons)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {modules.length === 0 ? (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-900 mb-1">No modules found</h3>
              <p className="text-neutral-500">Create modules first to manage lessons.</p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => handleTabChange('modules')}
              >
                Go to Modules
              </Button>
            </div>
          ) : !selectedModule ? (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-900 mb-1">Select a module</h3>
              <p className="text-neutral-500">Please select a module from the dropdown above to manage its lessons.</p>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden p-6">
              <LessonManager
                courseId={courseId}
                moduleId={selectedModule}
                onClose={() => setSelectedModule(null)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleManager;

