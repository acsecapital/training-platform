import {
  collection,
  doc,
  // getDoc, // Unused import
  getDocs,
  updateDoc,
  // writeBatch, // Unused import
  serverTimestamp,
  deleteField,
  DocumentData,
  FieldValue,
} from "firebase/firestore";
import {firestore} from "@/services/firebase";

/**
 * Interface for course data from Firestore
 */
interface CourseData extends DocumentData {
  title?: string;
  modules?: number;
  modulesList?: string[];
  [key: string]: unknown;
}

/**
 * Interface for update data to be sent to Firestore
 */
interface CourseUpdateData {
  [key: string]: string[] | FieldValue;
  updatedAt: FieldValue;
}

/**
 * Interface for migration results
 */
export interface MigrationResult {
  processed: number;
  fixed: number;
  errors: string[];
  details: Array<{
    courseId: string;
    title: string;
    oldModuleCount?: number;
    newModuleCount: number;
    oldModulesList?: string[];
    newModulesList: string[];
    error?: string;
}>;
}

/**
 * Migrates course data to use modulesList as the single source of truth
 * for module counts by removing the redundant 'modules' field and ensuring
 * modulesList is accurate.
 *
 * @return {MigrationResult} Object with migration results
 */
export async function migrateCoursesSchema(): Promise<MigrationResult> {
  const result: MigrationResult = {
    processed: 0,
    fixed: 0,
    errors: [],
    details: [],
  };

  try {
    // Get all courses
    const coursesSnapshot = await getDocs(collection(firestore, "courses"));

    // Process each course
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data() as CourseData;
      const courseTitle = courseData.title || "Untitled Course";
      try {
        // Get actual modules from subcollection
        const modulesSnapshot = await getDocs(
          collection(firestore, `courses/${courseId}/modules`)
        );
        const actualModuleIds = modulesSnapshot.docs.map((doc) => doc.id);

        // Get current modulesList from course
        const modulesList = Array.isArray(courseData.modulesList)
          ? courseData.modulesList
          : [];

        // Check if data needs to be fixed
        const hasModulesField = "modules" in courseData;
        const modulesListNeedsUpdate = !arraysEqual(
          modulesList.sort(),
          actualModuleIds.sort()
        );
        if (hasModulesField || modulesListNeedsUpdate) {
          // Prepare update data
          const updateData: CourseUpdateData = {
            updatedAt: serverTimestamp(),
          };

          // Remove modules field if it exists
          if (hasModulesField) {
            updateData.modules = deleteField();
          }

          // Update modulesList if needed
          if (modulesListNeedsUpdate) {
            updateData.modulesList = actualModuleIds;
          }

          // Update the course document
          await updateDoc(doc(firestore, "courses", courseId), updateData);
          // Record the details
          result.details.push({
            courseId,
            title: courseTitle,
            oldModuleCount: hasModulesField ? courseData.modules : undefined,
            newModuleCount: actualModuleIds.length,
            oldModulesList: modulesListNeedsUpdate ? modulesList : undefined,
            newModulesList: actualModuleIds,
          });

          result.fixed++;
        } else {
          // Record that the course was already correct
          result.details.push({
            courseId,
            title: courseTitle,
            oldModuleCount: undefined,
            newModuleCount: actualModuleIds.length,
            oldModulesList: undefined,
            newModulesList: actualModuleIds,
          });
        }

        result.processed++;
      } catch (error) {
        // Record the error
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`Error processing course ${courseId}: ${errorMessage}`);

        result.details.push({
          courseId,
          title: courseTitle,
          newModuleCount: 0,
          newModulesList: [],
          error: errorMessage,
        });
      }
    }

    return result;
  } catch (error) {
    // Record the overall error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(`Overall migration error: ${errorMessage}`);
    return result;
  }
}

/**
 * Verifies all courses to ensure modulesList is accurate
 * without making any changes.
 *
 * @return {MigrationResult} Object with verification results
 */
export async function verifyCoursesSchema(): Promise<MigrationResult> {
  const result: MigrationResult = {
    processed: 0,
    fixed: 0,
    errors: [],
    details: [],
  };

  try {
    // Get all courses
    const coursesSnapshot = await getDocs(collection(firestore, "courses"));

    // Process each course
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data() as CourseData;
      const courseTitle = courseData.title || "Untitled Course";
      try {
        // Get actual modules from subcollection
        const modulesSnapshot = await getDocs(
          collection(firestore, `courses/${courseId}/modules`)
        );
        const actualModuleIds = modulesSnapshot.docs.map((doc) => doc.id);

        // Get current modulesList from course
        const modulesList = Array.isArray(courseData.modulesList)
          ? courseData.modulesList
          : [];

        // Check if data needs to be fixed
        const hasModulesField = "modules" in courseData;
        const modulesListNeedsUpdate = !arraysEqual(
          modulesList.sort(),
          actualModuleIds.sort()
        );
        if (hasModulesField || modulesListNeedsUpdate) {
          // Record the details
          result.details.push({
            courseId,
            title: courseTitle,
            oldModuleCount: hasModulesField ? courseData.modules : undefined,
            newModuleCount: actualModuleIds.length,
            oldModulesList: modulesListNeedsUpdate ? modulesList : undefined,
            newModulesList: actualModuleIds,
          });

          result.fixed++;
        } else {
          // Record that the course was already correct
          result.details.push({
            courseId,
            title: courseTitle,
            oldModuleCount: undefined,
            newModuleCount: actualModuleIds.length,
            oldModulesList: undefined,
            newModulesList: actualModuleIds,
          });
        }

        result.processed++;
      } catch (error) {
        // Record the error
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`Error processing course ${courseId}: ${errorMessage}`);

        result.details.push({
          courseId,
          title: courseTitle,
          newModuleCount: 0,
          newModulesList: [],
          error: errorMessage,
        });
      }
    }

    return result;
  } catch (error) {
    // Record the overall error
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(`Overall verification error: ${errorMessage}`);
    return result;
  }
}

/**
 * Helper function to compare arrays for equality
 * @param {unknown[]} a First array to compare
 * @param {unknown[]} b Second array to compare
 * @return {boolean} True if arrays are equal, false otherwise
 */
function arraysEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}
