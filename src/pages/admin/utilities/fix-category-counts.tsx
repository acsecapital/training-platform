import React, {useState } from 'react';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import Button from '@/components/ui/Button';
import {fixAllCategoryCounts } from '@/utilities/fixCategoryCounts';
import {fixCourseCategoryIds } from '@/utilities/fixCourseCategoryIds';
import {toast } from 'sonner';

interface CategoryFixResult {
  id: string;
  name: string;
  oldCount: number;
  newCount: number;
}

interface CourseFixResult {
  id: string;
  title: string;
  oldValue: unknown;
  newValue: string[];
}

const FixCategoryCountsPage: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [categoryResults, setCategoryResults] = useState<CategoryFixResult[] | null>(null);
  const [courseResults, setCourseResults] = useState<CourseFixResult[] | null>(null);
  const [activeTab, setActiveTab] = useState<'categories' | 'courses'>('categories');
  const [fixedCategories, setFixedCategories] = useState<number>(0);
  const [fixedCourses, setFixedCourses] = useState<number>(0);

  // Fix category counts
  const handleFixCategoryCounts = async () => {
    try {
      setIsProcessing(true);
      setCategoryResults(null);

      toast.loading('Fixing category counts for all categories...', {id: 'fix-categories'});

      // Run the utility function to fix category counts
      const result = await fixAllCategoryCounts();

      if (result.success && result.details) {
        setCategoryResults(result.details.categories);
        setFixedCategories(result.details.fixed);

        if (result.details.fixed > 0) {
          toast.success(`Fixed counts for ${result.details.fixed} categories.`, {id: 'fix-categories'});
      } else {
          toast.success('All category counts are already correct.', {id: 'fix-categories'});
      }
    } else {
        toast.error(result.message, {id: 'fix-categories'});
    }
  } catch (error) {
      console.error('Error fixing category counts:', error);
      toast.error('An error occurred while fixing category counts.', {id: 'fix-categories'});
  } finally {
      setIsProcessing(false);
  }
};

  // Fix course category IDs
  const handleFixCourseCategoryIds = async () => {
    try {
      setIsProcessing(true);
      setCourseResults(null);

      toast.loading('Fixing course category IDs...', {id: 'fix-course-categories'});

      // Run the utility function to fix course category IDs
      const result = await fixCourseCategoryIds();

      if (result.success && result.details) {
        setCourseResults(result.details.courses);
        setFixedCourses(result.details.fixed);

        if (result.details.fixed > 0) {
          toast.success(`Fixed category IDs for ${result.details.fixed} courses.`, {id: 'fix-course-categories'});
      } else {
          toast.success('All courses already have properly formatted category IDs.', {id: 'fix-course-categories'});
      }
    } else {
        toast.error(result.message, {id: 'fix-course-categories'});
    }
  } catch (error) {
      console.error('Error fixing course category IDs:', error);
      toast.error('An error occurred while fixing course category IDs.', {id: 'fix-course-categories'});
  } finally {
      setIsProcessing(false);
  }
};

  // Fix both course category IDs and category counts
  const handleFixAll = async () => {
    try {
      setIsProcessing(true);
      setCourseResults(null);
      setCategoryResults(null);

      toast.loading('Fixing course category IDs and category counts...', {id: 'fix-all'});

      // First fix course category IDs
      const courseResult = await fixCourseCategoryIds();

      if (courseResult.success && courseResult.details) {
        setCourseResults(courseResult.details.courses);
        setFixedCourses(courseResult.details.fixed);
    }

      // Then fix category counts
      const categoryResult = await fixAllCategoryCounts();

      if (categoryResult.success && categoryResult.details) {
        setCategoryResults(categoryResult.details.categories);
        setFixedCategories(categoryResult.details.fixed);
    }

      toast.success('Completed fixing course category IDs and category counts.', {id: 'fix-all'});
  } catch (error) {
      console.error('Error fixing all:', error);
      toast.error('An error occurred during the fix operation.', {id: 'fix-all'});
  } finally {
      setIsProcessing(false);
  }
};

  return (
    <AdminLayout title="Fix Category Counts">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="mb-4 text-sm text-neutral-600">
          This utility helps fix issues with course categories and category counts.
        </p>

        {/* Tabs */}
        <div className="border-b border-neutral-200 mb-6">
          <div className="flex space-x-4">
            <button
              className={`py-2 px-4 border-b-2 ${
                activeTab === 'categories'
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
              onClick={() => setActiveTab('categories')}
            >
              Fix Category Counts
            </button>
            <button
              className={`py-2 px-4 border-b-2 ${
                activeTab === 'courses'
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
              onClick={() => setActiveTab('courses')}
            >
              Fix Course Categories
            </button>
          </div>
        </div>

        {/* Fix All Button */}
        <div className="mb-6">
          <Button
            onClick={() => void handleFixAll()}
            disabled={isProcessing}
            className="bg-primary text-white hover:bg-primary-dark"
          >
            {isProcessing ? 'Processing...' : 'Fix All Issues'}
          </Button>
          <p className="mt-2 text-xs text-neutral-500">
            This will fix both course category IDs and category counts in one operation.
          </p>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <p className="mb-4">
              This utility will check all categories and ensure that the course count in each category document
              matches the actual number of courses that have that category selected.
            </p>

            <div className="mb-6">
              <Button
                onClick={() => void handleFixCategoryCounts()}
                disabled={isProcessing}
                className="bg-primary text-white hover:bg-primary-dark"
              >
                {isProcessing ? 'Processing...' : 'Fix Category Counts'}
              </Button>
            </div>

            {categoryResults && (
              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <h3 className="font-semibold mb-2">Results:</h3>
                <p>Categories fixed: {fixedCategories}</p>

                {categoryResults.length > 0 ? (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Details:</h4>
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-neutral-200 text-sm">
                        <thead className="bg-neutral-100">
                          <tr>
                            <th className="px-3 py-2 text-left">Category</th>
                            <th className="px-3 py-2 text-left">Old Count</th>
                            <th className="px-3 py-2 text-left">New Count</th>
                            <th className="px-3 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {categoryResults.map((category, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                              <td className="px-3 py-2">{category.name} ({category.id})</td>
                              <td className="px-3 py-2">{category.oldCount}</td>
                              <td className="px-3 py-2">{category.newCount}</td>
                              <td className="px-3 py-2">
                                {category.oldCount !== category.newCount ? (
                                  <span className="text-green-600">Fixed</span>
                                ) : (
                                  <span className="text-neutral-500">No Change</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-green-600 mt-2">All categories already have correct course counts!</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div>
            <p className="mb-4">
              This utility will check all courses and ensure that the categoryIds field is properly formatted as an array.
              This is important for the category count functionality to work correctly.
            </p>

            <div className="mb-6">
              <Button
                onClick={() => void handleFixCourseCategoryIds()}
                disabled={isProcessing}
                className="bg-primary text-white hover:bg-primary-dark"
              >
                {isProcessing ? 'Processing...' : 'Fix Course Category IDs'}
              </Button>
            </div>

            {courseResults && (
              <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
                <h3 className="font-semibold mb-2">Results:</h3>
                <p>Courses fixed: {fixedCourses}</p>

                {courseResults.length > 0 ? (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Details:</h4>
                    <div className="max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-neutral-200 text-sm">
                        <thead className="bg-neutral-100">
                          <tr>
                            <th className="px-3 py-2 text-left">Course</th>
                            <th className="px-3 py-2 text-left">Old Value</th>
                            <th className="px-3 py-2 text-left">New Value</th>
                            <th className="px-3 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                          {courseResults.map((course, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                              <td className="px-3 py-2">{course.title} ({course.id})</td>
                              <td className="px-3 py-2">{JSON.stringify(course.oldValue)}</td>
                              <td className="px-3 py-2">{JSON.stringify(course.newValue)}</td>
                              <td className="px-3 py-2">
                                <span className="text-green-600">Fixed</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-green-600 mt-2">All courses already have properly formatted category IDs!</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FixCategoryCountsPage;
