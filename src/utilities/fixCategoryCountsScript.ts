import {CourseRepository } from '@/repositories/courseRepository';

/**
 * Script to fix all category counts
 * This can be run to ensure all category counts are accurate
 */
async function fixAllCategoryCounts() {
  try {
    console.log('Starting to fix all category counts...');

    const result = await CourseRepository.verifyAllCategoryCounts();

    if (result.fixed === 0) {
      console.log('All category counts are already correct.');
  } else {
      console.log(`Fixed counts for ${result.fixed} categories:`);
      result.categories.forEach(cat => {
        console.log(`- ${cat.name}: ${cat.oldCount} → ${cat.newCount}`);
    });
  }

    console.log('Category count verification complete.');
} catch (error) {
    console.error('Error fixing category counts:', error);
}
}

// Run the function using an immediately invoked async function expression (IIFE)
(async () => {
  try {
    await fixAllCategoryCounts();
  } catch (error) {
    console.error('Error in script execution:', error);
  }
})().catch(error => {
  console.error('Unhandled error in IIFE:', error);
});
