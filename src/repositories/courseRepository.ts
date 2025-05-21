import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  addDoc,
  updateDoc, // deleteDoc was unused
  writeBatch,
  serverTimestamp,
  QueryConstraint, // DocumentReference was unused
  DocumentData,
  QueryDocumentSnapshot, // Timestamp was unused
  DocumentReference,
  WithFieldValue
} from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {
  Course,
  AdminCourse,
  EnhancedCourse,
  EnhancedAdminCourse,
  Module
  // Lesson was unused
} from '@/types/course.types'; // Lesson was unused

/**
 * Helper function to compare arrays for equality
 * Improved with better type safety and more detailed logging
 */
function arraysEqual(a: unknown, b: unknown): boolean {
  // Normalize inputs to handle undefined/null cases
  const arrayA = Array.isArray(a) ? a : [];
  const arrayB = Array.isArray(b) ? b : [];

  console.log('Comparing arrays:', {
    arrayA,
    arrayB,
    aType: typeof a,
    bType: typeof b,
    aIsArray: Array.isArray(a),
    bIsArray: Array.isArray(b),
});

  // Check length
  if (arrayA.length !== arrayB.length) {
    console.log('Arrays have different lengths', {aLength: arrayA.length, bLength: arrayB.length });
    return false;
}

  // If both are empty, they're equal
  if (arrayA.length === 0 && arrayB.length === 0) {
    console.log('Both arrays are empty, considering them equal');
    return true;
}

  // Sort both arrays to compare values regardless of order
  // Convert all elements to strings to ensure consistent comparison
  const sortedA = [...(arrayA as unknown[])].map(String).sort();
  const sortedB = [...(arrayB as unknown[])].map(String).sort();

  // Compare each element
  const result = sortedA.every((val, idx) => val === sortedB[idx]);
  console.log('Arrays equal:', result, {sortedA, sortedB });

  return result;
}

// Base storable course data (fields from Course or AdminCourse, all optional)
type BaseCourseInput = Partial<Course | AdminCourse>;

// Define a type for input data that might include computed/enhanced fields from EnhancedCourse/EnhancedAdminCourse,
// which need to be stripped during create/update operations.
type CourseInputData = BaseCourseInput & {
  modules?: Module[];
  computedModuleCount?: number;
  computedLessonCount?: number;
  // Explicitly include other fields that might be in `restOfCourseData`
  // and could differ between Course and AdminCourse or need to be certainly (optionally) available.
  instructorId?: string;
  instructorName?: string;
  instructorAvatar?: string;
  categoryIds?: string[];
};

// Represents the data structure of a Module document as stored in Firestore
// Excludes the 'id' (document ID) and 'lessons' (subcollection)
type ModuleDocumentData = Omit<Module, 'id' | 'lessons'>;
/**
 * CourseRepository provides a data access layer for course-related operations
 * that enforces the new data model where modulesList is the single source of truth
 * for module counts.
 */
export class CourseRepository {
  /**
   * Helper function to ensure dates are in ISO string format
   * @param dateValue - The date value to format (Timestamp, ISO string, Date object, or number)
   * @returns ISO string representation of the date, or current date if input is invalid
   */
  private static _formatFirestoreDate(dateValue: unknown): string {
    if (!dateValue) return new Date().toISOString(); // Default to now if no dateValue

    // Handle Firestore Timestamp
    if (
      typeof dateValue === 'object' &&
      dateValue !== null &&
      'seconds' in dateValue &&
      typeof (dateValue as { seconds: unknown }).seconds === 'number'
      // Optionally, also check for nanoseconds if strict Firestore Timestamp is needed
      // && 'nanoseconds' in dateValue &&
      // typeof (dateValue as { nanoseconds: unknown }).nanoseconds === 'number'
    ) {
      return new Date((dateValue as { seconds: number }).seconds * 1000).toISOString();
    }
    // Handle ISO string
    else if (typeof dateValue === 'string' && !isNaN(new Date(dateValue).getTime())) {
      return dateValue;
    }
    // Handle Date object
    else if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
    // Handle number (timestamp in milliseconds)
    else if (typeof dateValue === 'number') {
        return new Date(dateValue).toISOString();
    }
    console.warn('CourseRepository._formatFirestoreDate: Unrecognized date format, defaulting to current date.', { dateValue, type: typeof dateValue });
    return new Date().toISOString();
  }
  /**
   * Get a course by ID with computed properties
   * @param courseId - The ID of the course to retrieve
   * @returns An enhanced course object with computed properties
   */
  static async getCourse(courseId: string): Promise<EnhancedCourse> {
    try {
      // Get the course document
      const courseDoc = await getDoc(doc(firestore, 'courses', courseId));

      if (!courseDoc.exists()) {
        throw new Error(`Course with ID ${courseId} not found`);
    }

      const courseData = courseDoc.data();

      // Ensure modulesList exists and is an array
      const modulesList = Array.isArray(courseData.modulesList) ? courseData.modulesList : [];

      // Get modules from subcollection
      const modulesSnapshot = await getDocs(
        query(
          collection(firestore, `courses/${courseId}/modules`),
          orderBy('order', 'asc')
        )
      );

      // Create array of module objects
      const modules: Module[] = [];
      let totalLessons = 0;

      // Process each module
      for (const moduleDoc of modulesSnapshot.docs) {
        // Get lessons for this module
        const lessonsSnapshot = await getDocs(
          query(
            collection(firestore, `courses/${courseId}/modules/${moduleDoc.id}/lessons`),
            orderBy('order', 'asc')
          )
        );

        // Create module object with lesson count
        const moduleData = moduleDoc.data() as Module;
        const lessonCount = lessonsSnapshot.size;
        totalLessons += lessonCount;

        modules.push({
          ...moduleData,
          id: moduleDoc.id, // Need to include id from moduleDoc
          lessonCount
      });
    }

      // Create enhanced course object
      const enhancedCourse: EnhancedCourse = {
        ...courseData,
        id: courseDoc.id, // Need to include id from courseDoc
        modulesList: modulesList.map(String), // Ensure all items are strings
        computedModuleCount: modulesSnapshot.size,
        computedLessonCount: totalLessons,
        modules
    } as EnhancedCourse;

      return enhancedCourse;
  } catch (error) {
      console.error('Error getting course:', error);
      throw error;
  }
}

  /**
   * Get admin course by ID with computed properties
   * @param courseId - The ID of the course to retrieve
   * @returns An enhanced admin course object with computed properties
   */
  static async getAdminCourse(courseId: string): Promise<EnhancedAdminCourse> {
    try {
      // Get the course document
      const courseDoc = await getDoc(doc(firestore, 'courses', courseId));

      if (!courseDoc.exists()) {
        throw new Error(`Course with ID ${courseId} not found`);
    }

      const courseData = courseDoc.data();

      // Ensure modulesList exists and is an array
      const modulesList = Array.isArray(courseData.modulesList) ? courseData.modulesList : [];

      // Get modules from subcollection
      const modulesSnapshot = await getDocs(
        query(
          collection(firestore, `courses/${courseId}/modules`),
          orderBy('order', 'asc')
        )
      );

      // Create array of module objects
      const modules: Module[] = [];
      let totalLessons = 0;

      // Process each module
      for (const moduleDoc of modulesSnapshot.docs) {
        // Get lessons for this module
        const lessonsSnapshot = await getDocs(
          query(
            collection(firestore, `courses/${courseId}/modules/${moduleDoc.id}/lessons`),
            orderBy('order', 'asc')
          )
        );

        // Create module object with lesson count
        const moduleData = moduleDoc.data() as Module;
        const lessonCount = lessonsSnapshot.size;
        totalLessons += lessonCount;

        modules.push({
          ...moduleData,
          id: moduleDoc.id, // Need to include id from moduleDoc
          lessonCount
      });
    }

      // Create enhanced admin course object with properly formatted dates
      const enhancedAdminCourse: EnhancedAdminCourse = {
        ...courseData,
        id: courseDoc.id, // Need to include id from courseDoc
        modulesList: modulesList.map(String), // Ensure all items are strings
        computedModuleCount: modulesSnapshot.size,
        computedLessonCount: totalLessons,
        modules,
        // Ensure dates are properly formatted
        createdAt: CourseRepository._formatFirestoreDate(courseData.createdAt),
        updatedAt: CourseRepository._formatFirestoreDate(courseData.updatedAt)
    } as EnhancedAdminCourse;

      return enhancedAdminCourse;
  } catch (error) {
      console.error('Error getting admin course:', error);
      throw error;
  }
}

  /**
   * Create a new course
   * @param courseData - The course data to create
   * @returns The ID of the newly created course
   */
  static async createCourse(courseData: CourseInputData): Promise<string> {
    try {
      // Destructure to exclude 'id' and other fields that are handled separately or not stored.
      // Firestore generates the 'id' for new documents.
      // createdAt and updatedAt are set using serverTimestamp.
      // modulesList is initialized as an empty array.
      const {
        // These variables are intentionally destructured but not used
        // as they are excluded from the data we send to Firestore
        id: _id, // Exclude document ID, Firestore will generate it
        createdAt: _createdAt, // Will be set by serverTimestamp()
        updatedAt: _updatedAt, // Will be set by serverTimestamp()
        modulesList: _modulesList, // Will be initialized to []
        // Exclude computed/derived fields that might be on AdminCourse/EnhancedCourse if passed in courseData
        modules: _modules,
        computedModuleCount: _computedModuleCount,
        computedLessonCount: _computedLessonCount,
        ...restOfCourseData // Use the rest of the properties from courseData
      } = courseData;

      // Ensure categoryIds is properly formatted
      const categoryIds = Array.isArray(restOfCourseData.categoryIds) ? restOfCourseData.categoryIds : [];

      // Prepare course data
      const courseToCreate = {
        ...restOfCourseData, // Spread the actual data fields
        modulesList: [],
        categoryIds: categoryIds, // Ensure this is always an array
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

      console.log('Creating course with categories:', {
        categoryIds,
        categoryIdsType: typeof courseData.categoryIds,
        categoryIdsIsArray: Array.isArray(courseData.categoryIds)
    });

      // Log relevant instructor fields from the data being saved
      console.log('Creating course with instructor data:', {
        instructorId: restOfCourseData.instructorId,
        instructorName: restOfCourseData.instructorName,
        instructorAvatar: restOfCourseData.instructorAvatar
        // Add other relevant instructor fields from AdminCourse if they exist in restOfCourseData and are meant to be saved
    });

      // Create the course document
      const courseRef = await addDoc(collection(firestore, 'courses'), courseToCreate);

      // Always update category counts to ensure consistency
      if (categoryIds.length > 0) {
        console.log(`Updating category counts for new course with ${categoryIds.length} categories`);
        await this.updateCategoryCounts([], categoryIds);
    }

      return courseRef.id;
  } catch (error) {
      console.error('Error creating course:', error);
      throw error;
  }
}

  /**
   * Get courses with computed properties
   * @param options - Query options for filtering courses
   * @returns Array of enhanced course objects with computed properties
   */
  static async getCourses(options?: {
    status?: 'draft' | 'published';
    featured?: boolean;
    limit?: number;
    startAfter?: QueryDocumentSnapshot<DocumentData>;
}): Promise<EnhancedCourse[]> {
    try {
      // Build query constraints
      const constraints: QueryConstraint[] = [];

      if (options?.status) {
        constraints.push(where('status', '==', options.status));
    }

      if (options?.featured !== undefined) {
        constraints.push(where('featured', '==', options.featured));
    }

      constraints.push(orderBy('title', 'asc'));

      if (options?.limit) {
        constraints.push(limit(options.limit));
    }

      if (options?.startAfter) {
        constraints.push(startAfter(options.startAfter));
    }

      // Execute query
      const coursesSnapshot = await getDocs(
        query(collection(firestore, 'courses'), ...constraints)
      );

      // Process results
      const enhancedCourses: EnhancedCourse[] = [];

      for (const courseDoc of coursesSnapshot.docs) {
        const courseData = courseDoc.data();

        // Ensure modulesList exists and is an array
        const modulesList = Array.isArray(courseData.modulesList) ? courseData.modulesList : [];

        // Get module count from subcollection
        const modulesSnapshot = await getDocs(
          collection(firestore, `courses/${courseDoc.id}/modules`)
        );

        // Create enhanced course object with properly formatted dates
        const enhancedCourse: EnhancedCourse = {
          ...courseData,
          id: courseDoc.id, // Need to include id from courseDoc
          modulesList: modulesList.map(String), // Ensure all items are strings
          computedModuleCount: modulesSnapshot.size,
          computedLessonCount: typeof courseData.lessons === 'number' ? courseData.lessons : 0, // Use existing lesson count as fallback with type check
          // Ensure dates are properly formatted
          createdAt: CourseRepository._formatFirestoreDate(courseData.createdAt),
          updatedAt: CourseRepository._formatFirestoreDate(courseData.updatedAt)
      } as EnhancedCourse;

        enhancedCourses.push(enhancedCourse);
    }

      return enhancedCourses;
  } catch (error) {
      console.error('Error getting courses:', error);
      throw error;
  }
}

  /**
   * Add a module to a course while maintaining data integrity
   * @param courseId - The ID of the course to add the module to
   * @param moduleData - The module data to add
   * @returns The ID of the newly created module
   */
  static async addModule(courseId: string, moduleData: Partial<Module>): Promise<string> {
    try {
      // Get the course document to verify it exists
      const courseDoc = await getDoc(doc(firestore, 'courses', courseId));

      if (!courseDoc.exists()) {
        throw new Error(`Course with ID ${courseId} not found`);
    }

      // Get existing modules to determine the highest order
      const modulesSnapshot = await getDocs(
        query(
          collection(firestore, `courses/${courseId}/modules`),
          orderBy('order', 'desc'),
          limit(1)
        )
      );

      // Determine the new module's order
      let highestOrder = -1;
      if (!modulesSnapshot.empty) {
        const moduleData = modulesSnapshot.docs[0].data();
        highestOrder = typeof moduleData.order === 'number' ? moduleData.order : 0;
    }

      // Destructure moduleData to exclude fields not stored in the module document itself
      // or handled/overridden below.
      const {
        id: _id, // Exclude document ID, Firestore will generate it via moduleRef
        lessons: _lessons, // Exclude lessons array, it's a subcollection
        createdAt: _createdAt, // Will be set with `now`
        updatedAt: _updatedAt, // Will be set with `now`
        order: _order,         // Will be calculated
        lessonCount: _lessonCount, // Will be initialized to 0
        status: inputStatus,   // Capture status separately to provide a default
        ...storableModuleFields // These are the fields from moduleData we want to keep
      } = moduleData;

      const now = new Date().toISOString();
      // Prepare the data object that will be stored in Firestore.
      // It must conform to ModuleDocumentData.
      const modulePayload: WithFieldValue<ModuleDocumentData> = {
        ...storableModuleFields, // Spread the applicable fields from input
        title: storableModuleFields.title ?? moduleData.title ?? 'Untitled Module', // Ensure title is a string
        order: highestOrder + 1,
        status: inputStatus || 'draft', // Use destructured status or default
        createdAt: now,
        updatedAt: now,
        lessonCount: 0 // Initialize lessonCount
    };

      // Start a batch write
      const batch = writeBatch(firestore);

      // Add the module to the subcollection
      // The DocumentReference should be typed with the data structure being stored.
      const moduleRef = doc(collection(firestore, `courses/${courseId}/modules`)) as DocumentReference<ModuleDocumentData>;
      batch.set(moduleRef, modulePayload);

      // Get current modulesList from course
      const courseData = courseDoc.data();
      const modulesList: string[] = Array.isArray(courseData.modulesList)
        ? courseData.modulesList.map(id => String(id))
        : [];
      // Add the new module ID to modulesList
      modulesList.push(moduleRef.id);

      // Update the course document with the new modulesList
      const courseRef = doc(firestore, 'courses', courseId);
      batch.update(courseRef, {
        modulesList: modulesList,
        updatedAt: serverTimestamp()
    });

      // Commit the batch
      await batch.commit();

      return moduleRef.id;
  } catch (error) {
      console.error('Error adding module:', error);
      throw error;
  }
}

  /**
   * Remove a module from a course while maintaining data integrity
   * @param courseId - The ID of the course to remove the module from
   * @param moduleId - The ID of the module to remove
   */
  static async removeModule(courseId: string, moduleId: string): Promise<void> {
    try {
      // Get the course document to verify it exists
      const courseDoc = await getDoc(doc(firestore, 'courses', courseId));

      if (!courseDoc.exists()) {
        throw new Error(`Course with ID ${courseId} not found`);
    }

      // Get the module document to verify it exists
      const moduleDoc = await getDoc(doc(firestore, `courses/${courseId}/modules/${moduleId}`));

      if (!moduleDoc.exists()) {
        throw new Error(`Module with ID ${moduleId} not found in course ${courseId}`);
    }

      // Start a batch write
      const batch = writeBatch(firestore);

      // Delete the module
      const moduleRef = doc(firestore, `courses/${courseId}/modules/${moduleId}`) as DocumentReference<Module>;
      batch.delete(moduleRef);

      // Get current modulesList from course
      const courseData = courseDoc.data();
      const modulesList: string[] = Array.isArray(courseData.modulesList)
        ? courseData.modulesList.map(id => String(id))
        : [];

      // Remove the module ID from modulesList
      const updatedModulesList = modulesList.filter(id => id !== moduleId);

      // Update the course document with the updated modulesList
      const courseRef = doc(firestore, 'courses', courseId);
      batch.update(courseRef, {
        modulesList: updatedModulesList,
        updatedAt: serverTimestamp()
    });

      // Commit the batch
      await batch.commit();
  } catch (error) {
      console.error('Error removing module:', error);
      throw error;
  }
}

  /**
   * Update a course while maintaining data integrity
   * @param courseId - The ID of the course to update
   * @param courseData - The course data to update
   */
  static async updateCourse(courseId: string, courseData: CourseInputData): Promise<void> {
    try {
      // Get the course document to verify it exists
      const courseDoc = await getDoc(doc(firestore, 'courses', courseId));

      if (!courseDoc.exists()) {
        throw new Error(`Course with ID ${courseId} not found`);
    }

      const existingData = courseDoc.data();
      // Destructure to exclude fields that should not be part of the update payload
      // or are handled specially.
      const {
        id: _id, // Document ID should not be in the update payload
        createdAt: _createdAt, // Typically, createdAt is not updated
        updatedAt: _updatedAt, // Will be set by serverTimestamp
        modules: _modules, // 'modules' array of objects is not stored at top level (it's computed)
        computedModuleCount: _computedModuleCount, // Computed field
        computedLessonCount: _computedLessonCount, // Computed field
        // modulesList is managed by addModule/removeModule.
        // If it can be updated here, ensure courseData.modulesList is handled correctly.
        ...dataToUpdate // These are the fields intended for update
      } = courseData;

      // Ensure we have properly formatted category arrays
      const oldCategoryIds = Array.isArray(existingData.categoryIds) ? existingData.categoryIds : [];
      const newCategoryIds = Array.isArray(dataToUpdate.categoryIds) ? dataToUpdate.categoryIds : [];

      console.log('updateCourse comparing categories:', {
        courseId,
        oldCategoryIds: oldCategoryIds,
        newCategoryIds: newCategoryIds
    });

      // Prepare update data
      const updatePayload: DocumentData = {
        ...dataToUpdate,
        updatedAt: serverTimestamp()
    };

      // Ensure categoryIds is properly formatted in the update data
      if (dataToUpdate.categoryIds !== undefined) {
        updatePayload.categoryIds = Array.isArray(dataToUpdate.categoryIds) ? dataToUpdate.categoryIds : [];
      }
      // Update the course document
      await updateDoc(doc(firestore, 'courses', courseId), updatePayload);

      // Always update category counts to ensure consistency
      // This is a more aggressive approach that ensures counts are updated even if the comparison fails
      await this.updateCategoryCounts(oldCategoryIds, newCategoryIds);

      console.log('Course updated successfully with ID:', courseId);
  } catch (error) {
      console.error('Error updating course:', error);
      throw error;
  }
}

  /**
   * Update category counts when a course's categories change
   * @param oldCategoryIds - Previous category IDs
   * @param newCategoryIds - New category IDs
   */
  private static async updateCategoryCounts(oldCategoryIds: string[] | undefined | null, newCategoryIds: string[] | undefined | null): Promise<void> {
    try {
      // Normalize inputs to handle undefined/null cases
      const oldIds = Array.isArray(oldCategoryIds) ? oldCategoryIds : [];
      const newIds = Array.isArray(newCategoryIds) ? newCategoryIds : [];

      console.log('updateCategoryCounts called with:', {
        oldCategoryIds,
        newCategoryIds,
        normalizedOldIds: oldIds,
        normalizedNewIds: newIds
    });

      // Find categories to decrement (categories that were removed)
      const categoriesToDecrement = oldIds.filter(id => !newIds.includes(id));

      // Find categories to increment (categories that were added)
      const categoriesToIncrement = newIds.filter(id => !oldIds.includes(id));

      console.log('Categories to update:', {
        decrement: categoriesToDecrement,
        increment: categoriesToIncrement
    });

      // If no changes, return early
      if (categoriesToDecrement.length === 0 && categoriesToIncrement.length === 0) {
        console.log('No category changes detected, returning early');
        return;
    }

      // Create a batch for all updates
      const batch = writeBatch(firestore);
      let updatesMade = false;

      // Process decrements
      for (const categoryId of categoriesToDecrement) {
        if (!categoryId) {
          console.warn('Skipping empty category ID in decrement list');
          continue;
      }

        try {
          const categoryRef = doc(firestore, 'categories', categoryId);
          const categoryDoc = await getDoc(categoryRef);

          if (categoryDoc.exists()) {
            const categoryData = categoryDoc.data();

            // Handle courseCount properly regardless of its stored type
            let currentCount = 0;
            if (typeof categoryData.courseCount === 'number') {
              currentCount = categoryData.courseCount;
          } else if (typeof categoryData.courseCount === 'string') {
              currentCount = parseInt(categoryData.courseCount, 10) || 0;
          }

            console.log(`Category ${categoryId} current count:`, {
              rawValue: categoryData.courseCount,
              type: typeof categoryData.courseCount,
              parsedValue: currentCount
          });

            // Ensure we don't go below zero
            const newCount = Math.max(0, currentCount - 1);

            console.log(`Decrementing category ${categoryId} from ${currentCount} to ${newCount}`);

            batch.update(categoryRef, {
              courseCount: newCount,
              updatedAt: serverTimestamp()
          });
            updatesMade = true;
        } else {
            console.log(`Category ${categoryId} not found for decrement`);
        }
      } catch (err) {
          console.error(`Error processing decrement for category ${categoryId}:`, err);
          // Continue with other categories
      }
    }

      // Process increments
      for (const categoryId of categoriesToIncrement) {
        if (!categoryId) {
          console.warn('Skipping empty category ID in increment list');
          continue;
      }

        try {
          const categoryRef = doc(firestore, 'categories', categoryId);
          const categoryDoc = await getDoc(categoryRef);

          if (categoryDoc.exists()) {
            const categoryData = categoryDoc.data();

            // Handle courseCount properly regardless of its stored type
            let currentCount = 0;
            if (typeof categoryData.courseCount === 'number') {
              currentCount = categoryData.courseCount;
          } else if (typeof categoryData.courseCount === 'string') {
              currentCount = parseInt(categoryData.courseCount, 10) || 0;
          }

            console.log(`Category ${categoryId} current count:`, {
              rawValue: categoryData.courseCount,
              type: typeof categoryData.courseCount,
              parsedValue: currentCount
          });

            const newCount = currentCount + 1;

            console.log(`Incrementing category ${categoryId} from ${currentCount} to ${newCount}`);

            batch.update(categoryRef, {
              courseCount: newCount,
              updatedAt: serverTimestamp()
          });
            updatesMade = true;
        } else {
            console.log(`Category ${categoryId} not found for increment`);
        }
      } catch (err) {
          console.error(`Error processing increment for category ${categoryId}:`, err);
          // Continue with other categories
      }
    }

      // Only commit if we have updates to make
      if (updatesMade) {
        // Commit all updates
        await batch.commit();
        console.log(`Updated counts for ${categoriesToDecrement.length} removed categories and ${categoriesToIncrement.length} added categories`);
    } else {
        console.log('No updates to commit for category counts');
    }
  } catch (error) {
      console.error('Error updating category counts:', error);
      // Don't throw the error to prevent blocking the course update
  }
}

  /**
   * Verify and fix the modulesList for a course
   * @param courseId - The ID of the course to verify
   * @returns Object with verification results
   */
  static async verifyModulesList(courseId: string): Promise<{
    fixed: boolean;
    oldCount: number;
    newCount: number;
}> {
    try {
      // Get the course document
      const courseDoc = await getDoc(doc(firestore, 'courses', courseId));

      if (!courseDoc.exists()) {
        throw new Error(`Course with ID ${courseId} not found`);
    }

      // Get current modulesList from course
      const courseData = courseDoc.data();
      const modulesList = Array.isArray(courseData.modulesList) ? courseData.modulesList : [];
      const oldCount = modulesList.length;

      // Get actual modules from subcollection
      const modulesSnapshot = await getDocs(collection(firestore, `courses/${courseId}/modules`));
      const actualModuleIds = modulesSnapshot.docs.map(doc => doc.id);
      const newCount = actualModuleIds.length;

      // Check if modulesList needs to be updated
      const needsUpdate = !arraysEqual(modulesList.sort(), actualModuleIds.sort());

      if (needsUpdate) {
        // Update the course document with the correct modulesList
        await updateDoc(doc(firestore, 'courses', courseId), {
          modulesList: actualModuleIds,
          updatedAt: serverTimestamp()
      });

        return {fixed: true, oldCount, newCount };
    }

      return {fixed: false, oldCount, newCount };
  } catch (error) {
      console.error('Error verifying modulesList:', error);
      throw error;
  }
}

  /**
   * Verify and fix category counts for all categories
   * This utility function ensures that category counts match the actual number of courses
   * @returns Object with verification results
   */
  static async verifyAllCategoryCounts(): Promise<{
    fixed: number;
    categories: {id: string; name: string; oldCount: number; newCount: number }[];
}> {
    try {
      console.log('Starting verification of all category counts');
      const results: {id: string; name: string; oldCount: number; newCount: number }[] = [];
      let fixedCount = 0;

      // Get all categories
      const categoriesSnapshot = await getDocs(collection(firestore, 'categories'));

      // Create a batch for updates
      const batch = writeBatch(firestore);
      let updatesMade = false;

      // Process each category
      for (const categoryDoc of categoriesSnapshot.docs) {
        const categoryId = categoryDoc.id;
        const categoryData = categoryDoc.data();
        const categoryName = typeof categoryData.name === 'string' ? categoryData.name : 'Unnamed Category';

        // Handle courseCount properly regardless of its stored type
        let oldCount = 0;
        if (typeof categoryData.courseCount === 'number') {
          oldCount = categoryData.courseCount;
      } else if (typeof categoryData.courseCount === 'string') {
          oldCount = parseInt(categoryData.courseCount, 10) || 0;
      }

        console.log(`Category ${categoryName} (${categoryId}) current count:`, {
          rawValue: categoryData.courseCount,
          type: typeof categoryData.courseCount,
          parsedValue: oldCount
      } as const);

        // Count courses that have this category
        const coursesSnapshot = await getDocs(
          query(
            collection(firestore, 'courses'),
            where('categoryIds', 'array-contains', categoryId)
          )
        );
        const actualCount = coursesSnapshot.size;

        // If counts don't match, update the category
        if (oldCount !== actualCount) {
          console.log(`Fixing count for category ${categoryName} (${categoryId}): ${oldCount} -> ${actualCount}`);

          batch.update(doc(firestore, 'categories', categoryId), {
            courseCount: actualCount,
            updatedAt: serverTimestamp()
        });

          results.push({
            id: categoryId,
            name: categoryName,
            oldCount,
            newCount: actualCount
        } as const);

          fixedCount++;
          updatesMade = true;
      }
    }

      // Commit updates if any were made
      if (updatesMade) {
        await batch.commit();
        console.log(`Fixed counts for ${fixedCount} categories`);
    } else {
        console.log('All category counts are already correct');
    }

      return {
        fixed: fixedCount,
        categories: results
    };
  } catch (error) {
      console.error('Error verifying category counts:', error);
      throw error;
  }
}

  /**
   * Update the course count for a specific category
   * @param categoryId - The ID of the category to update
   * @returns The updated count
   */
  static async updateCategoryCount(categoryId: string): Promise<number> {
    try {
      console.log(`Updating count for category ${categoryId}`);

      // Count courses that have this category
      const coursesSnapshot = await getDocs(
        query(
          collection(firestore, 'courses'),
          where('categoryIds', 'array-contains', categoryId)
        )
      );
      const actualCount = coursesSnapshot.size;

      // Update the category document with type assertion for updateDoc
      await updateDoc(doc(firestore, 'categories', categoryId), {
        courseCount: actualCount,
        updatedAt: serverTimestamp()
    });

      console.log(`Updated count for category ${categoryId} to ${actualCount}`);
      return actualCount;
  } catch (error) {
      console.error(`Error updating count for category ${categoryId}:`, error);
      throw error;
  }
}
}
