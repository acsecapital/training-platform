import React, {useState } from 'react';
import Button from '@/components/ui/Button';
import {Module } from '@/types/course.types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {verifyAllModuleLessonCounts } from '@/services/moduleService';

interface ModuleFormProps {
  initialData?: Partial<Module>;
  onSubmit: (data: Partial<Module>) => Promise<void>;
  courseId: string;
  isEditing?: boolean;
}

const ModuleForm: React.FC<ModuleFormProps> = ({
  initialData = {
    title: '',
    description: '',
    status: 'draft',
    isRequired: false,
    completionPercentageRequired: 100,
    availableFrom: '',
    availableTo: '',
    prerequisites: []
},
  onSubmit,
  courseId,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<Partial<Module>>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle input changes
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const {name, value } = e.target;
  
  // Type guard to check if the target is an HTMLInputElement
  if ('type' in e.target) {
    // Now TypeScript knows e.target has a 'type' property
    const inputElement = e.target as HTMLInputElement;
    
    // Handle checkbox inputs
    if (inputElement.type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: inputElement.checked,
    }));
      return; // Exit early
  }
    
    // Handle number inputs
    if (inputElement.type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value),
    }));
      return; // Exit early
  }
}
  
  // Handle all other inputs
  setFormData((prev) => ({
    ...prev,
    [name]: value,
}));
};

  // Handle date changes
  const handleDateChange = (date: Date | null, fieldName: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: date ? date.toISOString() : '',
  }));
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      // Update status based on publish parameter and include courseId
      const dataToSubmit = {
        ...formData,
        courseId, // Include the courseId in the submitted data
        status: publish ? 'published' as const : 'draft' as const,
    };

      await onSubmit(dataToSubmit);

      // Verify all module lesson counts after module save
      await verifyAllModuleLessonCounts(courseId);

  } catch (err: any) {
      console.error('Error submitting module:', err);
      setError(err.message || 'Failed to save module. Please try again.');
  } finally {
      setLoading(false);
  }
};

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="p-6 space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Module Information */}
          <div className="space-y-4">
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
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter module title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                required
                rows={5}
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
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <p className="mt-1 text-xs text-neutral-500">
                Draft modules are only visible to admins. Published modules are visible to enrolled students.
              </p>
            </div>

            {/* Required Module */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRequired"
                name="isRequired"
                checked={formData.isRequired || false}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary-500 border-neutral-300 rounded"
              />
              <label htmlFor="isRequired" className="ml-2 block text-sm text-neutral-700">
                Required Module
              </label>
            </div>
            <p className="text-xs text-neutral-500 -mt-2">
              If checked, students must complete this module to progress.
            </p>

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
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Percentage of lessons that must be completed to mark this module as complete.
              </p>
            </div>

            {/* Availability Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="availableFrom" className="block text-sm font-medium text-neutral-700 mb-1">
                  Available From
                </label>
                <DatePicker
                  selected={formData.availableFrom ? new Date(formData.availableFrom) : null}
                  onChange={(date) => handleDateChange(date, 'availableFrom')}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholderText="Select start date"
                  dateFormat="MMMM d, yyyy"
                />
              </div>
              <div>
                <label htmlFor="availableTo" className="block text-sm font-medium text-neutral-700 mb-1">
                  Available To
                </label>
                <DatePicker
                  selected={formData.availableTo ? new Date(formData.availableTo) : null}
                  onChange={(date) => handleDateChange(date, 'availableTo')}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholderText="Select end date"
                  dateFormat="MMMM d, yyyy"
                  minDate={formData.availableFrom ? new Date(formData.availableFrom) : undefined}
                />
              </div>
            </div>
            <p className="text-xs text-neutral-500 -mt-2">
              Leave blank to make the module available indefinitely.
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row-reverse sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => handleSubmit(new Event('click') as unknown as React.FormEvent, true)}
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditing ? 'Save & Publish' : 'Create & Publish'}
            </Button>

            <Button
              type="submit"
              variant="outline"
              disabled={loading}
            >
              {isEditing ? 'Save as Draft' : 'Create as Draft'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ModuleForm;





