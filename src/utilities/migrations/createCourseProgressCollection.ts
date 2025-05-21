import {firestore} from "@/services/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  // query, // Unused import
  setDoc,
  // where, // Unused import
} from "firebase/firestore";
import {CourseProgress, LessonProgress, ModuleProgress} from "@/types/course.types";

interface MigrationResult {
  processed: number;
  created: number;
  errors: string[];
  details: {
    userId: string;
    courseId: string;
    success: boolean;
    error?: string;
}[];
}

/**
 * Creates a test document in the courseProgress collection to verify permissions
 * and collection creation.
 *
 * @return {boolean} True if test document was created successfully, false otherwise
 */
export async function createTestCourseProgressDocument(): Promise<boolean> {
  try {
    // Create a test document with a predictable ID
    const testDocRef = doc(firestore, "courseProgress", "test_document");

    // Simple test data
    const testData = {
      courseId: "test_course",
      userId: "test_user",
      startDate: new Date().toISOString(),
      lastAccessDate: new Date().toISOString(),
      completedLessons: [],
      completedModules: [],
      quizScores: {},
      quizAttempts: {},
      lessonProgress: {},
      moduleProgress: {},
      overallProgress: 0,
      completed: false,
      timeSpent: 0,
      isTestDocument: true,
    };

    console.log("Attempting to create test document in courseProgress collection...");
    await setDoc(testDocRef, testData);
    console.log("Successfully created test document!");

    // Verify the document was created
    const verifyDoc = await getDoc(testDocRef);
    if (verifyDoc.exists()) {
      console.log("Verified test document exists!");
      return true;
    } else {
      console.warn("Test document was not found after creation!");
      return false;
    }
  } catch (error: unknown) {
    console.error("Failed to create test document:", error);
    throw error;
  }
}

/**
 * Creates the courseProgress collection in Firestore and migrates existing progress data
 * from user enrollment documents.
 *
 * @return {MigrationResult} Object with migration results
 */
export async function createCourseProgressCollection(): Promise<MigrationResult> {
  const result: MigrationResult = {
    processed: 0,
    created: 0,
    errors: [],
    details: [],
  };

  try {
    // Get all users with enrollments
    const usersRef = collection(firestore, "users");
    const usersSnapshot = await getDocs(usersRef);

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Get user's enrollments
      const enrollmentsRef = collection(
        firestore,
        `users/${userId}/enrollments`
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsRef);

      // Process each enrollment
      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const courseId = enrollmentDoc.id;
        const enrollmentData = enrollmentDoc.data();

        result.processed++;

        try {
          // Check if courseProgress document already exists
          const progressRef = doc(
            firestore,
            "courseProgress",
            `${userId}_${courseId}`
          );
          const progressDoc = await getDoc(progressRef);

          if (!progressDoc.exists()) {
            // Try to get course details
            const courseRef = doc(firestore, "courses", courseId);
            const courseDoc = await getDoc(courseRef);

            // Initialize module and lesson progress objects
            const moduleProgress: Record<string, ModuleProgress> = {};
            const lessonProgress: Record<string, LessonProgress> = {};

            // Get completed lessons from enrollment with type safety
            const completedLessons: string[] = Array.isArray(enrollmentData.completedLessons)
              ? enrollmentData.completedLessons.map(lesson => String(lesson))
              : [];

            // Create new courseProgress document
            const newProgress: CourseProgress = {
              courseId,
              userId,
              startDate: typeof enrollmentData.enrolledAt === 'string'
                ? enrollmentData.enrolledAt
                : new Date().toISOString(),
              lastAccessDate: typeof enrollmentData.lastAccessedAt === 'string'
                ? enrollmentData.lastAccessedAt
                : new Date().toISOString(),
              completedLessons,
              completedModules: [],
              quizScores: {},
              quizAttempts: {},
              lessonProgress,
              moduleProgress,
              overallProgress: typeof enrollmentData.progress === 'number'
                ? enrollmentData.progress
                : 0,
              completed: enrollmentData.status === "completed",
              timeSpent: 0,
            };

            // If course exists, add additional data from it
            if (courseDoc.exists()) {
              // We have the course data but don't need to use it currently
              // If needed in the future, uncomment: const courseData = courseDoc.data();
              // Add any course-specific data if needed
            } else {
              // Course doesn't exist anymore, but we'll still create a progress record
              console.warn(
                `Course ${courseId} not found, but creating progress record anyway`
              );
            }

            // Add completedDate if course is completed
            if (enrollmentData.status === "completed") {
              newProgress.completedDate = typeof enrollmentData.lastAccessedAt === 'string'
                ? enrollmentData.lastAccessedAt
                : new Date().toISOString();
            }

            // Save the new courseProgress document - with explicit logging
            console.log(
              `Attempting to create courseProgress document with ID: ${userId}_${courseId}`
            );
            try {
              await setDoc(progressRef, newProgress);
              console.log(
                `Successfully created courseProgress document with ID: ${userId}_${courseId}`
              );

              // Verify the document was created by trying to read it back
              const verifyDoc = await getDoc(progressRef);
              if (verifyDoc.exists()) {
                console.log(`Verified document exists: ${userId}_${courseId}`);
              } else {
                console.warn(
                  `Document was not found after creation: ${userId}_${courseId}`
                );
              }

              result.created++;
              result.details.push({
                userId,
                courseId,
                success: true,
              });
            } catch (error: unknown) {
              const errorMessage = error instanceof Error
                ? error.message
                : 'Unknown error';
              console.error(`Failed to create document: ${errorMessage}`);
              throw new Error(
                `Failed to create courseProgress document: ${errorMessage}`
              );
            }
          } else {
            // Document already exists, skip
            result.details.push({
              userId,
              courseId,
              success: true,
            });
          }
        } catch (error: unknown) {
          console.error(
            `Error processing enrollment for user ${userId}, course ${courseId}:`,
            error
          );

          const errorMessage = error instanceof Error
            ? error.message
            : 'Unknown error';

          result.errors.push(errorMessage);
          result.details.push({
            userId,
            courseId,
            success: false,
            error: errorMessage,
          });
        }
      }
    }

    return result;
  } catch (error: unknown) {
    console.error("Error creating courseProgress collection:", error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error';
    result.errors.push(errorMessage);
    return result;
  }
}
