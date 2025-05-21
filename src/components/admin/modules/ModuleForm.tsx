import React, {useState, useEffect } from 'react';
import {Module } from '@/types/course.types';
import Button from '@/components/ui/Button';
import {collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import {firestore } from '@/services/firebase';

interface ModuleFormProps {
  initialData: Partial<Module>;
  onSubmit: (moduleData: Partial<Module>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  courseId: string;
}

interface Instructor {
  id: string;
  displayName: string;
  photoURL?: string;
  jobTitle?: string;
}

const ModuleForm: React.FC<ModuleFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  courseId,
}) => {
  const [formData, setFormData] = useState<Partial<Module>>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showInstructorFields, setShowInstructorFields] = useState(!!initialData.instructor);

  // Fetch available modules for prerequisites
  useEffect(() => {
    const fetchAvailableModules = async () => {
      if (!courseId) return;

      try {
        const modulesRef = collection(firestore, `courses/${courseId}/modules`);
        const q = query(modulesRef, orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);

        const modulesList: Module[] = [];
        querySnapshot.forEach((doc) => {
          // Don't include the current module in the list of available prerequisites
          if (initialData.id !== doc.id) {
            modulesList.push({
              id: doc.id,
              ...doc.data() as Omit<Module, 'id'>
          });
        }
      });

        setAvailableModules(modulesList);
    } catch (err) {
        console.error('Error fetching available modules:', err);
    }
  };

    fetchAvailableModules();
}, [courseId, initialData.id]);

  // Fetch instructors
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const usersRef = collection(firestore, 'users');
        const instructorsQuery = query(usersRef, where('roles.instructor', '==', true));
        const instructorsSnapshot = await getDocs(instructorsQuery);

        const instructorsList: Instructor[] = [];
        instructorsSnapshot.forEach((doc) => {
          const userData = doc.data();
          instructorsList.push({
            id: doc.id,
            displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email,
            photoURL: userData.photoURL,
            jobTitle: userData.jobTitle,
        });
      });

        setInstructors(instructorsList);
    } catch (err) {
        console.error('Error fetching instructors:', err);
    }
  };

    fetchInstructors();
}, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
  }));
};

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked,
  }));
};

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value ? value : undefined,
  }));
};

  // Handle number change
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value ? parseInt(value) : undefined,
  }));
};

  // Handle prerequisites change
  const handlePrerequisiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {value, checked } = e.target;

    setFormData(prev => {
      const currentPrerequisites = prev.prerequisites || [];

      if (checked) {
        // Add to prerequisites
        return {
          ...prev,
          prerequisites: [...currentPrerequisites, value],
      };
    } else {
        // Remove from prerequisites
        return {
          ...prev,
          prerequisites: currentPrerequisites.filter(id => id !== value),
      };
    }
  });
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent multiple submissions

    // Validate form
    if (!formData.title?.trim()) {
      setError('Module title is required');
      return;
  }

    try {
      setError(null);

      // Ensure status is properly typed
      const dataToSubmit: Partial<Module> = {
        ...formData,
        status: (formData.status as 'draft' | 'published') || 'draft'
    };

      await onSubmit(dataToSubmit);
  } catch (err: any) {
      console.error('Error submitting module:', err);
      setError(err.message || 'Failed to save module. Please try again.');
  }
};

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-medium text-neutral-900">
          {initialData.id ? 'Edit Module' : 'Add New Module'}
        </h2>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter module title"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter module description"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status || 'draft'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <p className="mt-1 text-sm text-neutral-500">
            Draft modules are only visible to admins. Published modules are visible to students.
          </p>
        </div>

        {/* Advanced Settings Toggle */}
        <div>
          <button
            type="button"
            className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 mr-1 transition-transform ${showAdvancedSettings ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showAdvancedSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
          </button>
        </div>

        {/* Instructor Settings */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-neutral-900">Module Instructor</h3>
            <button
              type="button"
              onClick={() => setShowInstructorFields(!showInstructorFields)}
              className="text-sm text-primary hover:text-primary-700"
            >
              {showInstructorFields ? 'Hide Instructor Fields' : 'Assign Specific Instructor'}
            </button>
          </div>

          {showInstructorFields && (
            <div className="mt-4 space-y-4 border border-neutral-200 rounded-md p-4 bg-neutral-50">
              {/* Instructor Selection */}
              <div>
                <label htmlFor="instructor" className="block text-sm font-medium text-neutral-700 mb-1">
                  Select Instructor
                </label>
                <select
                  id="instructor"
                  name="instructor"
                  value={formData.instructor || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Use course default instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.displayName}>
                      {instructor.displayName} {instructor.jobTitle ? `(${instructor.jobTitle})` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-neutral-500">
                  If left empty, the course's default instructor will be used
                </p>
              </div>

              {/* Instructor Title */}
              <div>
                <label htmlFor="instructorTitle" className="block text-sm font-medium text-neutral-700 mb-1">
                  Instructor Title
                </label>
                <input
                  type="text"
                  id="instructorTitle"
                  name="instructorTitle"
                  value={formData.instructorTitle || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Guest Lecturer"
                />
              </div>

              {/* Instructor Bio */}
              <div>
                <label htmlFor="instructorBio" className="block text-sm font-medium text-neutral-700 mb-1">
                  Instructor Bio
                </label>
                <textarea
                  id="instructorBio"
                  name="instructorBio"
                  value={formData.instructorBio || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Brief bio for this module's instructor"
                />
              </div>

              {/* Instructor Avatar */}
              <div>
                <label htmlFor="instructorAvatar" className="block text-sm font-medium text-neutral-700 mb-1">
                  Instructor Avatar URL
                </label>
                <input
                  type="text"
                  id="instructorAvatar"
                  name="instructorAvatar"
                  value={formData.instructorAvatar || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Advanced Settings */}
        {showAdvancedSettings && (
          <div className="space-y-4 border border-neutral-200 rounded-md p-4 bg-neutral-50">
            <h3 className="font-medium text-neutral-900">Advanced Settings</h3>

            {/* Required Module */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRequired"
                name="isRequired"
                checked={formData.isRequired || false}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <label htmlFor="isRequired" className="ml-2 block text-sm text-neutral-700">
                Required Module (students must complete this module)
              </label>
            </div>

            {/* Availability Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="availableFrom" className="block text-sm font-medium text-neutral-700 mb-1">
                  Available From (Optional)
                </label>
                <input
                  type="datetime-local"
                  id="availableFrom"
                  name="availableFrom"
                  value={formData.availableFrom || ''}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="availableTo" className="block text-sm font-medium text-neutral-700 mb-1">
                  Available Until (Optional)
                </label>
                <input
                  type="datetime-local"
                  id="availableTo"
                  name="availableTo"
                  value={formData.availableTo || ''}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Completion Percentage */}
            <div>
              <label htmlFor="completionPercentageRequired" className="block text-sm font-medium text-neutral-700 mb-1">
                Required Completion Percentage
              </label>
              <input
                type="number"
                id="completionPercentageRequired"
                name="completionPercentageRequired"
                value={formData.completionPercentageRequired || 100}
                onChange={handleNumberChange}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-neutral-500">
                Percentage of lessons that must be completed to consider this module complete.
              </p>
            </div>

            {/* Prerequisites */}
            {availableModules.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Prerequisites (Optional)
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-neutral-300 rounded-md p-2 bg-white">
                  {availableModules.map(module => (
                    <div key={module.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`prerequisite-${module.id}`}
                        value={module.id}
                        checked={(formData.prerequisites || []).includes(module.id)}
                        onChange={handlePrerequisiteChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                      />
                      <label htmlFor={`prerequisite-${module.id}`} className="ml-2 block text-sm text-neutral-700">
                        {module.title}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  Students must complete these modules before accessing this one.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row-reverse sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : initialData.id ? 'Update Module' : 'Create Module'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
};

export default ModuleForm;
