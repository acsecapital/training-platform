import React, {useState, useEffect } from 'react';
import {collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {AdminCourse, CourseDuration, Module, Lesson } from '@/types/course.types';
import {UserProfile } from '@/types/user.types';
import CourseImageSelector from './CourseImageSelector';
import Button from '@/components/ui/Button';
import {parseDurationString, formatCourseDuration, calculateCourseDuration } from '@/utils/durationUtils';

interface CourseFormProps {
  initialData: Partial<AdminCourse>;
  onSubmit: (courseData: Partial<AdminCourse>, publish: boolean) => Promise<void>;
  isCreating: boolean;
  isSubmitting?: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Instructor {
  id: string;
  displayName: string;
  photoURL?: string;
  jobTitle?: string;
}

const CourseForm: React.FC<CourseFormProps> = ({initialData, onSubmit, isCreating, isSubmitting = false }) => {
  const [formData, setFormData] = useState<Partial<AdminCourse>>(initialData);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [instructorBio, setInstructorBio] = useState<string>(initialData.instructorBio || '');
  const [modules, setModules] = useState<Module[]>([]); // State to hold full module objects

  // Duration state
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);

  // Initialize duration fields from initial data
  useEffect(() => {
    if (initialData.duration) {
      const parsedDuration = parseDurationString(initialData.duration);
      if (parsedDuration) {
        setHours(parsedDuration.hours);
        setMinutes(parsedDuration.minutes);
        setSeconds(parsedDuration.seconds);
      }
    } else if (initialData.durationDetails) {
      setHours(initialData.durationDetails.hours);
      setMinutes(initialData.durationDetails.minutes);
      setSeconds(initialData.durationDetails.seconds);
    }
  }, [initialData]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesCollection = collection(firestore, 'categories');
        const categorySnapshot = await getDocs(categoriesCollection);
        const categoryList: Category[] = [];

        categorySnapshot.forEach((doc) => {
          const data = doc.data();
          categoryList.push({
            id: doc.id,
            name: data.name || '',
          });
        });

        setCategories(categoryList);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

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

  // Fetch modules and lessons
  useEffect(() => {
    const fetchModulesAndLessons = async () => {
      // Only fetch if course ID exists and modulesList is not empty
      if (!initialData.id || !formData.modulesList || formData.modulesList.length === 0) {
        setModules([]);
        return;
      }

      setLoading(true);
      try {
        const modulesData: Module[] = [];
        // Fetch full module data for each selected module ID
        for (const moduleId of formData.modulesList) {
          const moduleDocRef = doc(firestore, `courses/${initialData.id}/modules`, moduleId);
          const moduleDocSnap = await getDoc(moduleDocRef);

          if (moduleDocSnap.exists()) {
            const moduleData = moduleDocSnap.data() as Module;
            // Fetch lessons for the module
            const lessonsRef = collection(firestore, `courses/${initialData.id}/modules/${moduleId}/lessons`);
            const lessonsSnapshot = await getDocs(lessonsRef);
            const lessonsData: Lesson[] = lessonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));

            modulesData.push({ ...moduleData, id: moduleDocSnap.id, lessons: lessonsData });
          }
        }
        setModules(modulesData); // Update state with full module objects
      } catch (err) {
        console.error('Error fetching modules and lessons:', err);
        setError('Failed to load course structure.');
      } finally {
        setLoading(false);
      }
    };

    fetchModulesAndLessons();
  }, [initialData.id, formData.modulesList]); // Re-run when course ID or modulesList changes

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const {name, value } = e.target;

    // Log instructor field changes
    if (name === 'instructor' || name === 'instructorTitle' || name === 'instructorBio' || name === 'instructorAvatar') {
      console.log(`Updating ${name}:`, value);
    }

    // Special handling for numeric fields
    if (name === 'price') {
      // Convert price to a number
      const numericValue = parseFloat(value) || 0;
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      console.log(`Setting ${name} as number:`, numericValue);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle duration changes
  const handleDurationChange = (field: 'hours' | 'minutes' | 'seconds', value: number) => {
    // Update the specific duration field
    if (field === 'hours') setHours(value);
    if (field === 'minutes') setMinutes(value);
    if (field === 'seconds') setSeconds(value);

    // Calculate total seconds
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

    // Create duration object
    const durationDetails: CourseDuration = {
      hours: field === 'hours' ? value : hours,
      minutes: field === 'minutes' ? value : minutes,
      seconds: field === 'seconds' ? value : seconds,
      totalSeconds: (field === 'hours' ? value : hours) * 3600 +
                   (field === 'minutes' ? value : minutes) * 60 +
                   (field === 'seconds' ? value : seconds)
    };

    // Format for display
    const formattedDuration = formatCourseDuration(durationDetails);

    // Update form data
    setFormData(prev => ({
      ...prev,
      duration: formattedDuration,
      durationDetails
    }));
  };

  // Handle category selection
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setFormData((prev) => ({
      ...prev,
      categoryIds: selectedOptions,
    }));
  };

  // Handle thumbnail selection
  const handleThumbnailChange = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      thumbnail: url,
    }));
  };

  // Calculate duration from modules and lessons
  const calculateDurationFromLessons = () => {
    // Use the fetched modules state which now contains full module objects
    if (!modules || modules.length === 0) {
      return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
    }

    const calculatedDuration = calculateCourseDuration(modules); // Pass the full module objects

    // Update state
    setHours(calculatedDuration.hours);
    setMinutes(calculatedDuration.minutes);
    setSeconds(calculatedDuration.seconds);

    // Update form data
    setFormData(prev => ({
      ...prev,
      duration: formatCourseDuration(calculatedDuration),
      durationDetails: calculatedDuration
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.SyntheticEvent | undefined, publish: boolean) => {
    e?.preventDefault();

    if (isSubmitting) return; // Prevent multiple submissions

    try {
      setLoading(true);
      setError(null);

      // Update status based on publish parameter
      const dataToSubmit = {
        ...formData,
        status: publish ? 'published' as const : 'draft' as const,
      };

      // Log instructor fields before submission
      console.log('Submitting course with instructor data:', {
        instructor: dataToSubmit.instructor,
        instructorTitle: dataToSubmit.instructorTitle,
        instructorBio: dataToSubmit.instructorBio,
        instructorAvatar: dataToSubmit.instructorAvatar
      });

      await onSubmit(dataToSubmit, publish);
    } catch (err: any) {
      console.error('Error submitting course:', err);
      setError(err.message || 'Failed to save course. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  // Handle generate course
  const handleGenerateCourse = () => {
    // Placeholder implementation - to be expanded later
    console.log('Generate course clicked');
  };

  if (previewMode) {
    return (
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">Course Preview</h2>
            <Button variant="outline" onClick={togglePreview}>
              Exit Preview
            </Button>
          </div>

          {/* Course Preview */}
          <div className="space-y-6">
            {/* Thumbnail */}
            {formData.thumbnail && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <img
                  src={formData.thumbnail}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title and Level */}
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">{formData.title || 'Untitled Course'}</h1>
              <div className="mt-2 flex items-center">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${formData.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                    formData.level === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'}`}>
                  {formData.level}
                </span>
                <span className="ml-4 text-sm text-neutral-500">{formData.duration || (formData.durationDetails ? formatCourseDuration(formData.durationDetails) : 'No duration set')}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">Description</h2>
              <p className="text-neutral-700 whitespace-pre-wrap">{formData.description || 'No description provided.'}</p>
            </div>

            {/* Categories */}
            {formData.categoryIds && formData.categoryIds.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {formData.categoryIds.map((categoryId) => {
                    const category = categories.find((c) => c.id === categoryId);
                    return (
                      <span key={categoryId} className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded-md text-sm">
                        {category?.name || categoryId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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

          {/* Course Metadata */}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Course Information</h2>
            <div className="grid grid-cols-1 gap-6">
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
                  placeholder="Enter course title"
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
                  placeholder="Enter course description"
                />
              </div>

              {/* Level and Duration */}
              <div className="flex flex-col md:flex-row md:gap-6">
                <div className="w-full md:w-1/2 mb-6 md:mb-0">
                  <label htmlFor="level" className="block text-sm font-medium text-neutral-700 mb-1">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="level"
                    name="level"
                    value={formData.level || 'Beginner'}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Price, Free, Trial Period */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-neutral-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price !== undefined && formData.price !== null ? formData.price : ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., 49.99"
                    disabled={formData.isFree}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label htmlFor="isFree" className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="isFree"
                      name="isFree"
                      checked={formData.isFree === true}
                      onChange={(e) => setFormData(prev => ({...prev, isFree: e.target.checked, price: e.target.checked ? 0 : prev.price }))}
                      className="h-4 w-4 text-primary focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <span className="text-sm font-medium text-neutral-700">Is Free?</span>
                  </label>
                </div>
                <div>
                  <label htmlFor="trialPeriod" className="block text-sm font-medium text-neutral-700 mb-1">
                    Trial Period
                  </label>
                  <input
                    type="text"
                    id="trialPeriod"
                    name="trialPeriod"
                    value={formData.trialPeriod !== undefined && formData.trialPeriod !== null ? formData.trialPeriod : ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., 7 days, 1 month"
                    disabled={formData.isFree}
                  />
                  <p className="mt-1 text-xs text-neutral-500">Leave blank if no trial.</p>
                </div>
              </div>

              {/* Duration */}
              <div className="w-full">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Duration <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor="hours" className="block text-xs text-neutral-500 mb-1">
                        Hours
                      </label>
                      <input
                        type="number"
                        id="hours"
                        min="0"
                        value={hours}
                        onChange={(e) => handleDurationChange('hours', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="minutes" className="block text-xs text-neutral-500 mb-1">
                        Minutes
                      </label>
                      <input
                        type="number"
                        id="minutes"
                        min="0"
                        max="59"
                        value={minutes}
                        onChange={(e) => handleDurationChange('minutes', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="seconds" className="block text-xs text-neutral-500 mb-1">
                        Seconds
                      </label>
                      <input
                        type="number"
                        id="seconds"
                        min="0"
                        max="59"
                        value={seconds}
                        onChange={(e) => handleDurationChange('seconds', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={calculateDurationFromLessons}
                    className="mt-2 text-sm text-primary-600 hover:underline self-start"
                  >
                    Calculate from Modules/Lessons
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div>
                <label htmlFor="categoryIds" className="block text-sm font-medium text-neutral-700 mb-1">
                  Categories
                </label>
                <select
                  id="categoryIds"
                  name="categoryIds"
                  multiple
                  value={formData.categoryIds || []}
                  onChange={handleCategoryChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-neutral-500">Hold Ctrl or Cmd to select multiple.</p>
              </div>

              {/* Thumbnail */}
              <div>
                <label htmlFor="thumbnail" className="block text-sm font-medium text-neutral-700 mb-1">
                  Thumbnail Image URL
                </label>
                <CourseImageSelector
                  value={formData.thumbnail || ''}
                  onChange={handleThumbnailChange}
                />
                <p className="mt-1 text-xs text-neutral-500">Select or paste a URL for the course thumbnail.</p>
              </div>

              {/* Intro Video */}
              <div>
                <label htmlFor="introVideoId" className="block text-sm font-medium text-neutral-700 mb-1">
                  Intro Video ID (Cloudflare Stream)
                </label>
                <input
                  type="text"
                  id="introVideoId"
                  name="introVideoId"
                  value={formData.introVideoId || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter Cloudflare Stream Video ID"
                />
                <p className="mt-1 text-xs text-neutral-500">Optional: Add a video ID for a course introduction.</p>
              </div>
            </div>
          </div>

          {/* Instructor Information */}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Instructor Information</h2>
            <div className="grid grid-cols-1 gap-6">
              {/* Instructor Selection */}
              <div>
                <label htmlFor="instructor" className="block text-sm font-medium text-neutral-700 mb-1">
                  Instructor
                </label>
                <select
                  id="instructor"
                  name="instructor"
                  value={formData.instructor || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select an instructor</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.displayName}>
                      {instructor.displayName}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-neutral-500">Select an existing user with the 'instructor' role.</p>
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
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Lead Developer, Marketing Expert"
                />
                <p className="mt-1 text-xs text-neutral-500">Optional: The instructor's job title or role.</p>
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
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter a brief bio for the instructor"
                />
                <p className="mt-1 text-xs text-neutral-500">Optional: A short biography for the instructor.</p>
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
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter URL for instructor's avatar image"
                />
                <p className="mt-1 text-xs text-neutral-500">Optional: URL for the instructor's profile picture.</p>
              </div>
            </div>
          </div>

          {/* Modules Section */}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">Course Structure (Modules & Lessons)</h2>
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            ) : modules.length === 0 ? (
              <div className="bg-neutral-50 border border-neutral-200 text-neutral-700 px-4 py-3 rounded-md">
                No modules added yet. Add modules from the Modules page.
              </div>
            ) : (
              <div className="space-y-4">
                {modules.map((module) => (
                  <div key={module.id} className="border border-neutral-200 rounded-md p-4">
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">{module.title}</h3>
                    {module.lessons && module.lessons.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 text-neutral-700">
                        {module.lessons.map((lesson) => (
                          <li key={lesson.id}>{lesson.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-neutral-500 text-sm">No lessons in this module.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-sm text-neutral-600">
              Modules and lessons are managed separately. Select modules for this course on the Modules page.
            </p>
          </div>

          {/* Call to Action / Generate Course */}
          {isCreating && (
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Generate Course Content</h2>
              <p className="text-neutral-700 mb-4">
                Use AI to generate module and lesson content based on the course title and description.
              </p>
              <Button type="button" onClick={handleGenerateCourse} disabled={isSubmitting}>
                Generate Course Content (AI)
              </Button>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={togglePreview} disabled={isSubmitting}>
            Preview
          </Button>
          <Button type="submit" variant="secondary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button type="button" variant="primary" onClick={(e) => handleSubmit(e, true)} disabled={isSubmitting}>
            {isSubmitting ? 'Publishing...' : 'Save and Publish'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
