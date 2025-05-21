import {collection, getDocs, doc, writeBatch} from "firebase/firestore";
import {firestore} from "@/services/firebase";
import {toast} from "sonner";
import {CourseRepository} from "@/repositories/courseRepository";

/**
 * Utility to fix price data types in courses
 * This converts string prices to numbers
 *
 * @return {Promise<{success: boolean, message: string, fixed: number}>} Result of the operation
 */
export async function fixCoursePriceDataTypes(): Promise<{
  success: boolean;
  message: string;
  fixed: number;
}> {
  try {
    // Show loading toast
    toast.loading("Fixing course price data types...", {id: "fix-prices"});

    const coursesRef = collection(firestore, "courses");
    const coursesSnapshot = await getDocs(coursesRef);

    const batch = writeBatch(firestore);
    let fixedCount = 0;
    let updatesMade = false;

    // Process each course
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();

      // Check if price is a string
      if (typeof courseData.price === "string" && courseData.price.trim() !== "") {
        const numericPrice = parseFloat(courseData.price);

        if (!isNaN(numericPrice)) {
          console.log(`Converting price for course ${courseId} from string "${courseData.price}" to number ${numericPrice}`);

          batch.update(doc(firestore, "courses", courseId), {
            price: numericPrice,
          });

          fixedCount++;
          updatesMade = true;
        }
      }
    }

    // Commit updates if any were made
    if (updatesMade) {
      await batch.commit();
      const message = `Fixed price data types for ${fixedCount} courses`;
      console.log(message);
      toast.success(message, {id: "fix-prices"});

      return {
        success: true,
        message,
        fixed: fixedCount,
      };
    } else {
      const message = "No price data types needed fixing";
      console.log(message);
      toast.success(message, {id: "fix-prices"});

      return {
        success: true,
        message,
        fixed: 0,
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const message = `Error fixing price data types: ${errorMessage}`;
    console.error(message, error);
    toast.error(message, {id: "fix-prices"});

    return {
      success: false,
      message,
      fixed: 0,
    };
  }
}

/**
 * Comprehensive utility to fix course data consistency issues
 * This runs all course-related data fixing utilities in sequence
 *
 * @return {Promise<{success: boolean, message: string, details: {pricesFixed: number, categoriesFixed: number}}>}
 *   Result of the operation
 */
export async function fixAllDataIssues(): Promise<{
  success: boolean;
  message: string;
  details: {
    pricesFixed: number;
    categoriesFixed: number;
  };
}> {
  try {
    // Show loading toast
    toast.loading("Fixing course data consistency issues...", {id: "fix-all"});

    // Fix price data types
    const priceResult = await fixCoursePriceDataTypes();

    // Fix category counts
    const categoryResult = await CourseRepository.verifyAllCategoryCounts();

    // Prepare result message
    const message = `Fixed ${priceResult.fixed} course price data types and ${categoryResult.fixed} category counts`;
    console.log(message);
    toast.success(message, {id: "fix-all"});

    return {
      success: true,
      message,
      details: {
        pricesFixed: priceResult.fixed,
        categoriesFixed: categoryResult.fixed,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const message = `Error fixing data issues: ${errorMessage}`;
    console.error(message, error);
    toast.error(message, {id: "fix-all"});

    return {
      success: false,
      message,
      details: {
        pricesFixed: 0,
        categoriesFixed: 0,
      },
    };
  }
}
