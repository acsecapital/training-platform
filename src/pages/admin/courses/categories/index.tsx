import React, {useState, useEffect } from 'react';
import {collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import {fixAllCategoryCounts, fixCategoryCount } from '@/utilities/fixCategoryCounts';
import {fixAllDataIssues } from '@/utilities/fixDataTypes';
import {fixCourseCategoryIds } from '@/utilities/fixCourseCategoryIds';
import CategoryCount from '@/components/admin/courses/CategoryCount';
import {toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  description: string;
  courseCount: number;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isFixingCounts, setIsFixingCounts] = useState(false);
  const [isFixingAllData, setIsFixingAllData] = useState(false);
  const [isFixingCategoryIds, setIsFixingCategoryIds] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching categories...');

      const categoriesCollection = collection(firestore, 'categories');
      const categorySnapshot = await getDocs(categoriesCollection);

      const categoryList: Category[] = [];

      categorySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Category ${doc.id}:`, data);

        // Handle courseCount properly regardless of its stored type
        let courseCount = 0;
        if (typeof data.courseCount === 'number') {
          courseCount = data.courseCount;
      } else if (typeof data.courseCount === 'string') {
          courseCount = parseInt(data.courseCount, 10) || 0;
      }

        categoryList.push({
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          courseCount: courseCount,
      });
    });

      // Sort alphabetically by name
      categoryList.sort((a, b) => a.name.localeCompare(b.name));

      console.log('Fetched categories:', categoryList);

      setCategories(categoryList);
  } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
  } finally {
      setLoading(false);
  }
};

  // Initial fetch
  useEffect(() => {
    fetchCategories();

    // Set up a refresh interval to keep the category counts up-to-date
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing categories...');
      fetchCategories();
  }, 5000); // Refresh every 5 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval);
}, []);

  // Handle adding a new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCategoryName.trim()) {
      return;
  }

    try {
      const newCategory = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
        courseCount: 0,
        createdAt: new Date().toISOString(),
    };

      await addDoc(collection(firestore, 'categories'), newCategory);

      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsAddingCategory(false);

      fetchCategories();
  } catch (err: any) {
      console.error('Error adding category:', err);
      setError('Failed to add category. Please try again.');
  }
};

  // Handle updating a category
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCategoryName.trim() || !isEditingCategory) {
      return;
  }

    try {
      await updateDoc(doc(firestore, 'categories', isEditingCategory), {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
        updatedAt: new Date().toISOString(),
    });

      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsEditingCategory(null);

      fetchCategories();
  } catch (err: any) {
      console.error('Error updating category:', err);
      setError('Failed to update category. Please try again.');
  }
};

  // Handle deleting a category
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will not delete associated courses, but they will no longer be categorized.')) {
      return;
  }

    try {
      await deleteDoc(doc(firestore, 'categories', categoryId));
      fetchCategories();
  } catch (err: any) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again.');
  }
};

  // Start editing a category
  const startEditingCategory = (category: Category) => {
    setIsEditingCategory(category.id);
    setNewCategoryName(category.name);
    setNewCategoryDescription(category.description);
    setIsAddingCategory(false);
};

  // Cancel editing or adding
  const cancelAction = () => {
    setIsAddingCategory(false);
    setIsEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryDescription('');
};

  // Handle fixing all category counts
  const handleFixAllCounts = async () => {
    try {
      setIsFixingCounts(true);
      await fixAllCategoryCounts();
      // Refresh categories after fixing counts
      fetchCategories();
  } catch (err) {
      console.error('Error fixing category counts:', err);
  } finally {
      setIsFixingCounts(false);
  }
};

  // Handle fixing all data issues
  const handleFixAllData = async () => {
    try {
      setIsFixingAllData(true);
      await fixAllDataIssues();
      // Refresh categories after fixing all data
      fetchCategories();
  } catch (err) {
      console.error('Error fixing all data issues:', err);
  } finally {
      setIsFixingAllData(false);
  }
};

  // Handle fixing course categoryIds
  const handleFixCategoryIds = async () => {
    try {
      setIsFixingCategoryIds(true);
      await fixCourseCategoryIds();
      // Fix category counts after fixing categoryIds
      await fixAllCategoryCounts();
      // Refresh categories after fixing
      fetchCategories();
  } catch (err) {
      console.error('Error fixing course categoryIds:', err);
  } finally {
      setIsFixingCategoryIds(false);
  }
};

  // Handle fixing a single category count
  const handleFixCategoryCount = async (category: Category) => {
    try {
      await fixCategoryCount(category.id, category.name);
      // Refresh categories after fixing count
      fetchCategories();
  } catch (err) {
      console.error(`Error fixing count for category ${category.name}:`, err);
  }
};

  return (
    <AdminLayout title="Course Categories">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Course Categories</h1>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            {!isAddingCategory && !isEditingCategory && (
              <>
                <Button
                  variant="outline"
                  onClick={handleFixAllData}
                  disabled={isFixingAllData || isFixingCounts || isFixingCategoryIds}
                  className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    {isFixingAllData ? 'Fixing All Data...' : 'Fix All Data Issues'}
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleFixCategoryIds}
                  disabled={isFixingCategoryIds || isFixingCounts || isFixingAllData}
                  className="bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    {isFixingCategoryIds ? 'Fixing Course Categories...' : 'Fix Course Categories'}
                  </span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleFixAllCounts}
                  disabled={isFixingCounts || isFixingAllData || isFixingCategoryIds}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    {isFixingCounts ? 'Fixing Counts...' : 'Fix Category Counts'}
                  </span>
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setIsAddingCategory(true)}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Category
                  </span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Add/Edit Category Form */}
        {(isAddingCategory || isEditingCategory) && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <form onSubmit={isEditingCategory ? handleUpdateCategory : handleAddCategory}>
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-medium text-neutral-900">
                  {isEditingCategory ? 'Edit Category' : 'Add Category'}
                </h2>

                <div>
                  <label htmlFor="categoryName" className="block text-sm font-medium text-neutral-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter category name"
                  />
                </div>

                <div>
                  <label htmlFor="categoryDescription" className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="categoryDescription"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter category description"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelAction}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  {isEditingCategory ? 'Update Category' : 'Add Category'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Categories List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-neutral-900 mb-1">No categories found</h3>
              <p className="text-neutral-500">
                Get started by creating your first category.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Courses
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          {category.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-500 max-w-md truncate">
                          {category.description || 'No description'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <CategoryCount
                          categoryId={category.id}
                          initialCount={category.courseCount}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleFixCategoryCount(category)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Fix count"
                          >
                            <span className="sr-only">Fix Count</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                          <button
                            onClick={() => startEditingCategory(category)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit category"
                          >
                            <span className="sr-only">Edit</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete category"
                          >
                            <span className="sr-only">Delete</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default function AdminCategoriesPage() {
  return (
    <ProtectedRoute adminOnly>
      <CategoriesPage />
    </ProtectedRoute>
  );
}
