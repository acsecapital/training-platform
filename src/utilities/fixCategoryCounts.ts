import {CourseRepository } from '@/repositories/courseRepository';
import {toast } from 'sonner';

/**
 * Utility function to fix all category counts
 * This can be called from the admin interface to ensure all category counts are accurate
 */
export async function fixAllCategoryCounts(): Promise<{
  success: boolean;
  message: string;
  details?: {
    fixed: number;
    categories: {id: string; name: string; oldCount: number; newCount: number }[];
};
}> {
  try {
    // Show loading toast
    toast.loading('Fixing category counts...', {id: 'fix-categories'});

    // Call the repository method to verify and fix all category counts
    const result = await CourseRepository.verifyAllCategoryCounts();

    // Prepare result message
    let message = '';
    if (result.fixed === 0) {
      message = 'All category counts are already correct.';
      toast.success(message, {id: 'fix-categories'});
  } else {
      message = `Fixed counts for ${result.fixed} categories.`;
      toast.success(message, {id: 'fix-categories'});
  }

    return {
      success: true,
      message,
      details: result
  };
} catch (error: unknown) {
    const errorMessage = `Error fixing category counts: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMessage, error);
    toast.error(errorMessage, {id: 'fix-categories'});

    return {
      success: false,
      message: errorMessage
  };
}
}

/**
 * Utility function to fix a specific category count
 * @param categoryId - The ID of the category to fix
 * @param categoryName - The name of the category (for display purposes)
 */
export async function fixCategoryCount(categoryId: string, categoryName: string): Promise<{
  success: boolean;
  message: string;
  newCount?: number;
}> {
  try {
    // Show loading toast
    toast.loading(`Fixing count for category "${categoryName}"...`, {id: `fix-category-${categoryId}` });

    // Call the repository method to update the category count
    const newCount = await CourseRepository.updateCategoryCount(categoryId);

    // Success message
    const message = `Updated count for "${categoryName}" to ${newCount}.`;
    toast.success(message, {id: `fix-category-${categoryId}` });

    return {
      success: true,
      message,
      newCount
  };
} catch (error: unknown) {
    const errorMessage = `Error fixing count for category "${categoryName}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMessage, error);
    toast.error(errorMessage, {id: `fix-category-${categoryId}` });

    return {
      success: false,
      message: errorMessage
  };
}
}
