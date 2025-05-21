/**
 * Centralized utilities for course progress calculation
 * This ensures consistent progress calculation across the application
 */
import {calculateCourseProgress } from '@/services/courseProgressService';

/**
 * Calculate progress percentage for display
 * This should be used by all UI components that need to display progress
 */
export const getDisplayProgressPercentage = (
  completedLessons: string[],
  totalLessons: number | undefined
): number => {
  // Use a default value of 0 if totalLessons is undefined
  const safeTotalLessons = totalLessons ?? 0;

  // Use the centralized calculation function
  const {overallProgress } = calculateCourseProgress(completedLessons, safeTotalLessons);

  // Return the calculated progress - never override based on isCompleted
  return overallProgress;
};

/**
 * Determine if a course should be displayed as completed
 * This should be used for styling and badges, not for progress percentage
 */
export const shouldDisplayAsCompleted = (
  completedLessons: string[],
  totalLessons: number,
  isCompleted?: boolean
): boolean => {
  // If isCompleted flag is explicitly set, use it
  if (typeof isCompleted === 'boolean') {
    return isCompleted;
}

  // Otherwise, calculate based on lesson completion
  const {completed } = calculateCourseProgress(completedLessons, totalLessons);
  return completed;
};
