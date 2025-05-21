import { CourseDuration, Module, Lesson } from '@/types/course.types';

/**
 * Parses a duration string into a structured object
 * Handles formats like "2h 30m", "1 hour 20 minutes", etc.
 * @param {string} durationStr The duration string to parse
 * @return {CourseDuration|null} Parsed duration object or null if invalid
 */
export const parseDurationString = (durationStr: string): CourseDuration | null => {
  if (!durationStr) return null;

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  // Match patterns like "2h", "2 hours", "2 hr", etc.
  const hourMatch = durationStr.match(/(\d+)\s*h(?:our)?s?/i);
  if (hourMatch) {
    hours = parseInt(hourMatch[1], 10);
}

  // Match patterns like "30m", "30 minutes", "30 min", etc.
  const minuteMatch = durationStr.match(/(\d+)\s*m(?:inute)?s?/i);
  if (minuteMatch) {
    minutes = parseInt(minuteMatch[1], 10);
}

  // Match patterns like "45s", "45 seconds", "45 sec", etc.
  const secondMatch = durationStr.match(/(\d+)\s*s(?:econd)?s?/i);
  if (secondMatch) {
    seconds = parseInt(secondMatch[1], 10);
}

  // Calculate total seconds
  const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;

  return {hours, minutes, seconds, totalSeconds};
};

/**
 * Formats a duration string or object into a human-readable format
 * @param {string|CourseDuration} duration The duration to format
 * @return {string} Formatted duration string
 */
export const formatDuration = (duration: string | CourseDuration): string => {
  if (!duration) return "Unknown duration";

  // If duration is already a string, try to parse it
  if (typeof duration === "string") {
    const parsed = parseDurationString(duration);
    if (parsed) {
      duration = parsed;
  } else {
      // If we can't parse it, return the original string
      return duration;
  }
}

  // Format the duration object
  const parts = [];

  if (duration.hours > 0) {
    parts.push(`${duration.hours}h`);
}

  if (duration.minutes > 0) {
    parts.push(`${duration.minutes}m`);
}

  if (duration.seconds > 0 && parts.length === 0) {
    parts.push(`${duration.seconds}s`);
}

  return parts.length > 0 ? parts.join(" ") : "Less than 1 minute";
};

/**
 * Calculates the total duration of a course based on its modules and lessons
 * @param {Array<Record<string, unknown>>} modules Array of course modules
 * @return {CourseDuration} Total course duration
 */
export function calculateCourseDuration(
  modules: Module[]
): CourseDuration {
  let totalSeconds = 0;

  modules.forEach((module) => {
    if (module.lessons && Array.isArray(module.lessons)) {
      module.lessons.forEach((lesson: Lesson) => { // Change type to Lesson
        if (lesson.duration && typeof lesson.duration === "number") {
          totalSeconds += lesson.duration;
        }
      });
    }
  });

  return secondsToCourseDuration(totalSeconds);
}

/**
 * Converts seconds to a CourseDuration object
 * @param {number} totalSeconds Total duration in seconds
 * @return {CourseDuration} Structured duration object
 */
export function secondsToCourseDuration(totalSeconds: number): CourseDuration {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return {hours, minutes, seconds, totalSeconds};
}

/**
 * Formats a CourseDuration object to a human-readable string
 * @param {CourseDuration} duration The duration object to format
 * @return {string} Formatted duration string
 */
export function formatCourseDuration(duration: CourseDuration): string {
  return formatDuration(duration);
}
