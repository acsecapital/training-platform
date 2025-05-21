import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import {firestore } from '@/services/firebase';
import {Module, Lesson } from '@/types/course.types';

/**
 * Fetch all modules for a course
 */
export const fetchModules = async (courseId: string): Promise<Module[]> => {
  try {
    const modulesRef = collection(firestore, `courses/${courseId}/modules`);
    const q = query(modulesRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    const modulesList: Module[] = [];
    querySnapshot.forEach((doc) => {
      modulesList.push({
        id: doc.id,
        ...doc.data() as Omit<Module, 'id'>
    });
  });

    return modulesList;
} catch (error) {
    console.error('Error fetching modules:', error);
    throw error;
}
};

/**
 * Fetch a single module by ID
 */
export const fetchModule = async (courseId: string, moduleId: string): Promise<Module> => {
  try {
    const moduleRef = doc(firestore, `courses/${courseId}/modules/${moduleId}`);
    const moduleDoc = await getDoc(moduleRef);

    if (!moduleDoc.exists()) {
      throw new Error('Module not found');
  }

    return {
      id: moduleDoc.id,
      ...moduleDoc.data() as Omit<Module, 'id'>
  };
} catch (error) {
    console.error('Error fetching module:', error);
    throw error;
}
};

/**
 * Create a new module
 */
export const createModule = async (courseId: string, moduleData: Partial<Module>): Promise<string> => {
  try {
    // Get the highest order value
    const modules = await fetchModules(courseId);
    const highestOrder = modules.length > 0
      ? Math.max(...modules.map(m => m.order))
      : -1;

    const now = new Date().toISOString();

    const newModule = {
      ...moduleData,
      order: highestOrder + 1,
      createdAt: now,
      updatedAt: now
  };

    const docRef = await addDoc(collection(firestore, `courses/${courseId}/modules`), newModule);

    // Update the course's module count
    await updateCourseModuleCount(courseId);

    return docRef.id;
} catch (error) {
    console.error('Error creating module:', error);
    throw error;
}
};

/**
 * Update an existing module
 */
export const updateModule = async (courseId: string, moduleId: string, moduleData: Partial<Module>): Promise<void> => {
  try {
    const moduleRef = doc(firestore, `courses/${courseId}/modules/${moduleId}`);

    await updateDoc(moduleRef, {
      ...moduleData,
      updatedAt: new Date().toISOString()
  });
} catch (error) {
    console.error('Error updating module:', error);
    throw error;
}
};

/**
 * Delete a module and all its lessons
 */
export const deleteModule = async (courseId: string, moduleId: string): Promise<void> => {
  try {
    // First, get all lessons for this module
    const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleId}/lessons`);
    const lessonsSnapshot = await getDocs(lessonsRef);

    // Use a batch to delete all lessons and the module
    const batch = writeBatch(firestore);

    // Add lesson deletions to batch
    lessonsSnapshot.forEach((lessonDoc) => {
      batch.delete(doc(firestore, `courses/${courseId}/modules/${moduleId}/lessons/${lessonDoc.id}`));
  });

    // Add module deletion to batch
    batch.delete(doc(firestore, `courses/${courseId}/modules/${moduleId}`));

    // Commit the batch
    await batch.commit();

    // Update the course's module count
    await updateCourseModuleCount(courseId);

    // Update the course's total lesson count
    await updateCourseLessonCount(courseId);
} catch (error) {
    console.error('Error deleting module:', error);
    throw error;
}
};

/**
 * Update the order of modules
 */
export const updateModuleOrder = async (courseId: string, moduleOrders: {id: string, order: number }[]): Promise<void> => {
  try {
    const batch = writeBatch(firestore);

    moduleOrders.forEach(({id, order }) => {
      const moduleRef = doc(firestore, `courses/${courseId}/modules/${id}`);
      batch.update(moduleRef, {order });
  });

    await batch.commit();
} catch (error) {
    console.error('Error updating module order:', error);
    throw error;
}
};

/**
 * Fetch all lessons for a module
 */
export const fetchLessons = async (courseId: string, moduleId: string): Promise<Lesson[]> => {
  try {
    const lessonsRef = collection(firestore, `courses/${courseId}/modules/${moduleId}/lessons`);
    const q = query(lessonsRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    const lessonsList: Lesson[] = [];
    querySnapshot.forEach((doc) => {
      lessonsList.push({
        id: doc.id,
        ...doc.data() as Omit<Lesson, 'id'>
    });
  });

    return lessonsList;
} catch (error) {
    console.error('Error fetching lessons:', error);
    throw error;
}
};

/**
 * Fetch a single lesson by ID
 */
export const fetchLesson = async (courseId: string, moduleId: string, lessonId: string): Promise<Lesson> => {
  try {
    const lessonRef = doc(firestore, `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
    const lessonDoc = await getDoc(lessonRef);

    if (!lessonDoc.exists()) {
      throw new Error('Lesson not found');
  }

    return {
      id: lessonDoc.id,
      ...lessonDoc.data() as Omit<Lesson, 'id'>
  };
} catch (error) {
    console.error('Error fetching lesson:', error);
    throw error;
}
};

/**
 * Create a new lesson
 */
export const createLesson = async (courseId: string, moduleId: string, lessonData: Partial<Lesson>): Promise<string> => {
  try {
    // Get the highest order value
    const lessons = await fetchLessons(courseId, moduleId);
    const highestOrder = lessons.length > 0
      ? Math.max(...lessons.map(l => l.order))
      : -1;

    const now = new Date().toISOString();

    const newLesson = {
      ...lessonData,
      order: highestOrder + 1,
      createdAt: now,
      updatedAt: now
  };

    const docRef = await addDoc(collection(firestore, `courses/${courseId}/modules/${moduleId}/lessons`), newLesson);

    // Update the module's lesson count
    await updateModuleLessonCount(courseId, moduleId);

    // Update the course's total lesson count
    await updateCourseLessonCount(courseId);

    return docRef.id;
} catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
}
};

/**
 * Update an existing lesson
 */
export const updateLesson = async (courseId: string, moduleId: string, lessonId: string, lessonData: Partial<Lesson>): Promise<void> => {
  try {
    const lessonRef = doc(firestore, `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);

    await updateDoc(lessonRef, {
      ...lessonData,
      updatedAt: new Date().toISOString()
  });
} catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
}
};

/**
 * Delete a lesson
 */
export const deleteLesson = async (courseId: string, moduleId: string, lessonId: string): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`));

    // Update the module's lesson count
    await updateModuleLessonCount(courseId, moduleId);

    // Update the course's total lesson count
    await updateCourseLessonCount(courseId);
} catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
}
};

/**
 * Update the order of lessons
 */
export const updateLessonOrder = async (courseId: string, moduleId: string, lessonOrders: {id: string, order: number }[]): Promise<void> => {
  try {
    const batch = writeBatch(firestore);

    lessonOrders.forEach(({id, order }) => {
      const lessonRef = doc(firestore, `courses/${courseId}/modules/${moduleId}/lessons/${id}`);
      batch.update(lessonRef, {order });
  });

    await batch.commit();
} catch (error) {
    console.error('Error updating lesson order:', error);
    throw error;
}
};

/**
 * Update the lesson count for a module
 */
export const updateModuleLessonCount = async (courseId: string, moduleId: string): Promise<void> => {
  try {
    const lessons = await fetchLessons(courseId, moduleId);
    const moduleRef = doc(firestore, `courses/${courseId}/modules/${moduleId}`);

    await updateDoc(moduleRef, {
      lessonCount: lessons.length,
      updatedAt: new Date().toISOString()
  });
} catch (error) {
    console.error('Error updating module lesson count:', error);
    throw error;
}
};

/**
 * Update the module count for a course
 */
// ModuleService.ts
export const updateCourseModuleCount = async (courseId: string): Promise<void> => {
  try {
    // Directly query the modules subcollection to get an accurate count
    const modulesRef = collection(firestore, `courses/${courseId}/modules`);
    const modulesSnapshot = await getDocs(modulesRef); // <--- This gets the actual count
    const moduleCount = modulesSnapshot.size;

    // Get module IDs for the modulesList field
    const moduleIds = modulesSnapshot.docs.map(doc => doc.id);

    const courseRef = doc(firestore, `courses/${courseId}`);
    const courseDoc = await getDoc(courseRef);
    if (!courseDoc.exists()) {
      console.error(`Course document with ID ${courseId} does not exist.`);
      // Consider throwing an error or handling this case more explicitly
      // if a course document MUST exist when modules are being managed.
      return;
  }

    // Update the course document
    await updateDoc(courseRef, {
      modules: moduleCount,    // <--- This is the critical update
      modulesList: moduleIds,  // Store module IDs as array
      updatedAt: new Date().toISOString() // Or serverTimestamp()
  });

    console.log(`Updated module count for course ${courseId} to ${moduleCount}`);
} catch (error) {
    console.error('Error updating course module count:', error);
    throw error; // Re-throw to allow calling function to handle it
}
};

/**
 * Verify and update all module lesson counts for a course
 */
export const verifyAllModuleLessonCounts = async (courseId: string): Promise<void> => {
  try {
    const modules = await fetchModules(courseId);
    const batch = writeBatch(firestore);

    // Update each module's lesson count
    for (const moduleItem of modules) {
      const lessons = await fetchLessons(courseId, moduleItem.id);
      const moduleRef = doc(firestore, `courses/${courseId}/modules/${moduleItem.id}`);

      batch.update(moduleRef, {
        lessonCount: lessons.length,
        updatedAt: new Date().toISOString()
    });
  }

    // Commit all updates in a single batch
    await batch.commit();

    // Now update the course's total lesson count
    await updateCourseLessonCount(courseId);
} catch (error) {
    console.error('Error verifying module lesson counts:', error);
    throw error;
}
};

/**
 * Update the total lesson count for a course
 */
export const updateCourseLessonCount = async (courseId: string): Promise<void> => {
  try {
    const modules = await fetchModules(courseId);
    let totalLessons = 0;

    // Sum up lesson counts from all modules using their lessonCount property
    // This is more efficient than fetching all lessons for each module
    for (const moduleData of modules) {
      // Use the module's lessonCount if available, otherwise fetch lessons
      if (typeof moduleData.lessonCount === 'number') {
        totalLessons += moduleData.lessonCount;
    } else {
        const lessons = await fetchLessons(courseId, moduleData.id);
        totalLessons += lessons.length;
    }
  }

    const courseRef = doc(firestore, `courses/${courseId}`);

    await updateDoc(courseRef, {
      lessons: totalLessons,
      updatedAt: new Date().toISOString()
  });
} catch (error) {
    console.error('Error updating course lesson count:', error);
    throw error;
}
};

/**
 * Verify and fix module counts for all courses
 * This utility function can be used to ensure all courses have correct module counts
 */
// ModuleService.ts - verifyAllCourseModuleCounts
// This function is good. No changes needed here for its logic.
export const verifyAllCourseModuleCounts = async (): Promise<{fixed: number, total: number, errors: string[] }> => {
  try {
    const coursesRef = collection(firestore, 'courses');
    const coursesSnapshot = await getDocs(coursesRef);
    let fixedCount = 0;
    const totalCourses = coursesSnapshot.size;
    const errorCourses: string[] = [];

    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      let needsUpdate = false;

      try {
        const modulesSubcollectionRef = collection(firestore, `courses/${courseId}/modules`);
        const modulesSubcollectionSnapshot = await getDocs(modulesSubcollectionRef);
        const actualModuleCount = modulesSubcollectionSnapshot.size; // Number
        const actualModuleIds = modulesSubcollectionSnapshot.docs.map(doc => doc.id); // string[]

        const dataToUpdate: DocumentData = {updatedAt: Timestamp.now() };

        // Check if 'modules' field needs fixing (either wrong type or wrong value)
        if (typeof courseData.modules !== 'number' || courseData.modules !== actualModuleCount) {
          dataToUpdate.modules = actualModuleCount;
          needsUpdate = true;
          console.log(`Course ${courseId}: Fixing 'modules' field. Stored: ${courseData.modules} (type: ${typeof courseData.modules}), Actual count: ${actualModuleCount}`);
      }

        // Check if 'modulesList' field needs fixing or adding
        // Simple check: if it doesn't exist or its length doesn't match actual count
        // More robust: deep comparison of arrays if order matters and is guaranteed
        if (!courseData.modulesList || !Array.isArray(courseData.modulesList) || courseData.modulesList.length !== actualModuleIds.length ||
            !actualModuleIds.every((id: string) => Array.isArray(courseData.modulesList) && courseData.modulesList.includes(id)) || // Ensure all actual IDs are present
            !(Array.isArray(courseData.modulesList) && courseData.modulesList.every((id: unknown) => typeof id === 'string' && actualModuleIds.includes(id))) // Ensure all stored IDs are actual and strings
        ) {
          dataToUpdate.modulesList = actualModuleIds;
          needsUpdate = true;
          console.log(`Course ${courseId}: Fixing 'modulesList' field.`);
      }

        // If 'modulesCount' field exists and is different, you might want to remove it or ensure it's also correct
        // For now, focusing on 'modules' and 'modulesList'
        // Example: if (courseData.hasOwnProperty('modulesCount')) {dataToUpdate.modulesCount = deleteField(); needsUpdate = true; }


        if (needsUpdate) {
          await updateDoc(doc(firestore, `courses/${courseId}`), dataToUpdate);
          fixedCount++;
      }
    } catch (err: unknown) {
        console.error(`Error processing course ${courseId} during verification:`, err);
        errorCourses.push(courseId);
    }
  }
    console.log(`Verification complete. Processed ${totalCourses} courses. Fixed/Updated ${fixedCount} courses. Errors on: ${errorCourses.join(', ')}`);
    return {fixed: fixedCount, total: totalCourses, errors: errorCourses };
} catch (error) {
    console.error('Error verifying course module counts:', error);
    throw error;
}
};
