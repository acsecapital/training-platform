import React, {useState, useEffect } from 'react';
import {collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import {CourseCategory } from '@/types/course.types';
import {toast } from 'sonner';

const CourseCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  
  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const categoriesCollection = collection(firestore, 'categories');
      const categorySnapshot = await getDocs(categoriesCollection);
      const categoryList: CourseCategory[] = [];
      
      categorySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<CourseCategory, 'id'>;
        categoryList.push({
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          slug: data.slug || '',
          courseCount: data.courseCount || 0,
          parentCategoryId: data.parentCategoryId,
          order: data.order || 0,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
      });
    });
      
      // Sort by name
      categoryList.sort((a, b) => a.name.localeCompare(b.name));
      
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
}, []);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      toast.error('Category name is required');
      return;
  }
    
    // Generate slug if not provided
    const slug = categorySlug.trim() || categoryName.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    try {
      setIsSubmitting(true);
      
      const now = new Date().toISOString();
      
      if (editingCategory) {
        // Update existing category
        const categoryRef = doc(firestore, 'categories', editingCategory.id);
        await updateDoc(categoryRef, {
          name: categoryName.trim(),
          description: categoryDescription.trim(),
          slug,
          updatedAt: now,
      });
        
        toast.success('Category updated successfully');
    } else {
        // Create new category
        await addDoc(collection(firestore, 'categories'), {
          name: categoryName.trim(),
          description: categoryDescription.trim(),
          slug,
          courseCount: 0,
          createdAt: now,
          updatedAt: now,
      });
        
        toast.success('Category created successfully');
    }
      
      // Reset form
      resetForm();
      
      // Refresh categories
      fetchCategories();
  } catch (err: any) {
      console.error('Error saving category:', err);
      toast.error(`Failed to save category: ${err.message || 'Unknown error'}`);
  } finally {
      setIsSubmitting(false);
  }
};
  
  // Handle category deletion
  const handleDelete = async (category: CourseCategory) => {
    if (!confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
      return;
  }
    
    try {
      setLoading(true);
      
      // Check if category has courses
      if (category.courseCount > 0) {
        toast.error(`Cannot delete category with ${category.courseCount} courses. Please reassign courses first.`);
        return;
    }
      
      // Delete the category
      await deleteDoc(doc(firestore, 'categories', category.id));
      
      toast.success('Category deleted successfully');
      
      // Refresh categories
      fetchCategories();
  } catch (err: any) {
      console.error('Error deleting category:', err);
      toast.error(`Failed to delete category: ${err.message || 'Unknown error'}`);
  } finally {
      setLoading(false);
  }
};
  
  // Handle edit button click
  const handleEdit = (category: CourseCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setCategorySlug(category.slug);
    setShowForm(true);
};
  
  // Reset form
  const resetForm = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setCategorySlug('');
    setShowForm(false);
};
  
  return (
    <AdminLayout title="Course Categories">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-neutral-900">Organize</h1>
          <Button
            variant="primary"
            className="mt-4 sm:mt-0"
            onClick={() => {
              resetForm();
              setShowForm(true);
          }}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Category
            </span>
          </Button>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        {/* Category Form */}
        {showForm && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-medium text-neutral-900">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter category name"
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter category description"
                  />
                </div>
                
                {/* Slug */}
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-neutral-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    id="slug"
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter category slug (optional)"
                  />
                  <p className="mt-1 text-sm text-neutral-500">
                    Leave blank to auto-generate from name. Used in URLs.
                  </p>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row-reverse sm:justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
        
        {/* Categories Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {loading && categories.length === 0 ? (
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
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
              }}
              >
                Add Category
              </Button>
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
                      Slug
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
                        <div className="text-sm text-neutral-500 truncate max-w-xs">
                          {category.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-500">
                          {category.slug}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-500">
                          {category.courseCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <span className="sr-only">Edit</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="text-red-600 hover:text-red-900"
                            disabled={category.courseCount > 0}
                            title={category.courseCount > 0 ? 'Cannot delete category with courses' : 'Delete category'}
                          >
                            <span className="sr-only">Delete</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${category.courseCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          {loading && categories.length > 0 && (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default function AdminCourseCategoriesPage() {
  return (
    <ProtectedRoute adminOnly>
      <CourseCategoriesPage />
    </ProtectedRoute>
  );
}
