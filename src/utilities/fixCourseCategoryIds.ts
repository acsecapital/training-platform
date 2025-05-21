import {collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {toast } from 'sonner';

/**
 * Utility function to ensure all courses have categoryIds as arrays
 * This can be called from the admin interface to fix any courses with malformed categoryIds
 */
export async function fixCourseCategoryIds(): Promise<{
  success: boolean;
  message: string;
  details?: {
    fixed: number;
    courses: {id: string; title: string; oldValue: unknown; newValue: string[] }[];
};
}> {
  try {
    // Show loading toast
    toast.loading('Fixing course categoryIds...', {id: 'fix-course-categories'});

    const results: {id: string; title: string; oldValue: unknown; newValue: string[] }[] = [];
    let fixedCount = 0;

    // Get all courses
    const coursesSnapshot = await getDocs(collection(firestore, 'courses'));

    // Process each course
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      const courseTitle = courseData.title as string || 'Unnamed Course';

      // Check if categoryIds is not an array or is undefined
      if (!Array.isArray(courseData.categoryIds)) {
        console.log(`Course ${courseTitle} (${courseId}) has invalid categoryIds:`, {
          value: courseData.categoryIds,
          type: typeof courseData.categoryIds
      });

        // Determine the new value
        let newCategoryIds: string[] = [];

        // If it's a string, try to parse it as JSON
        if (typeof courseData.categoryIds === 'string') {
          try {
            const parsed = JSON.parse(courseData.categoryIds);
            if (Array.isArray(parsed)) {
              newCategoryIds = parsed.map(item => String(item));
          }
        } catch (_) {
            // If parsing fails, treat it as a single category ID
            if (courseData.categoryIds) {
              newCategoryIds = [String(courseData.categoryIds)];
          }
        }
      }
        // If it's an object but not an array, convert to array
        else if (courseData.categoryIds && typeof courseData.categoryIds === 'object') {
          const values = Object.values(courseData.categoryIds as Record<string, string>);
          newCategoryIds = values.map(item => String(item));
      }

        // Update the course
        await updateDoc(doc(firestore, 'courses', courseId), {
          categoryIds: newCategoryIds,
          updatedAt: serverTimestamp()
      });

        results.push({
          id: courseId,
          title: courseTitle,
          oldValue: courseData.categoryIds as unknown,
          newValue: newCategoryIds
      });

        fixedCount++;
    }
  }

    // Prepare result message
    let message = '';
    if (fixedCount === 0) {
      message = 'All courses already have properly formatted categoryIds.';
      toast.success(message, {id: 'fix-course-categories'});
  } else {
      message = `Fixed categoryIds for ${fixedCount} courses.`;
      toast.success(message, {id: 'fix-course-categories'});
  }

    return {
      success: true,
      message,
      details: {
        fixed: fixedCount,
        courses: results
    }
  };
} catch (error: unknown) {
    const errorMessage = `Error fixing course categoryIds: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMessage, error);
    toast.error(errorMessage, {id: 'fix-course-categories'});

    return {
      success: false,
      message: errorMessage
  };
}
}
