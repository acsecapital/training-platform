import {
  collection,
  getDocs
} from 'firebase/firestore';
import {firestore } from './firebase';
import {sendNotificationByType } from './notificationSchedulerService';
import {getTeamById, getTeamMembers } from './companyService';
import {getCourseById } from './courseService';

/**
 * Send team enrollment notification to team manager
 */
export const sendTeamEnrollmentNotification = async (
  companyId: string,
  teamId: string,
  courseIds: string[],
  enrolledUsers: number,
  enrolledCourses: number
): Promise<boolean> => {
  try {
    // Get team details
    const team = await getTeamById(companyId, teamId);
    if (!team || !team.managerId) {
      console.error('Team or manager not found');
      return false;
  }

    // Get course names
    const courseNames: string[] = [];
    for (const courseId of courseIds) {
      const course = await getCourseById(courseId);
      if (course) {
        courseNames.push(course.title);
    }
  }

    // Send notification to manager
    const success = await sendNotificationByType(
      team.managerId,
      'team_enrollment',
      {
        teamId,
        teamName: team.name,
        courseNames: courseNames.join(', '),
        enrolledUsers,
        enrolledCourses,
        timestamp: new Date().toISOString(),
        link: `/admin/teams/${teamId}/progress`,
        title: `Team Enrollment: ${team.name}`,
        message: `${enrolledUsers} members of team "${team.name}" have been enrolled in ${enrolledCourses} courses: ${courseNames.join(', ')}`
    }
    );

    return success;
} catch (error) {
    console.error('Error sending team enrollment notification:', error);
    return false;
}
};

/**
 * Send team progress notification to team manager
 */
export const sendTeamProgressNotification = async (
  companyId: string,
  teamId: string,
  averageProgress: number,
  progressThreshold: number = 50
): Promise<boolean> => {
  try {
    // Get team details
    const team = await getTeamById(companyId, teamId);
    if (!team || !team.managerId) {
      console.error('Team or manager not found');
      return false;
  }

    // Send notification to manager
    const success = await sendNotificationByType(
      team.managerId,
      'team_progress',
      {
        teamId,
        teamName: team.name,
        averageProgress,
        progressThreshold,
        timestamp: new Date().toISOString(),
        link: `/admin/teams/${teamId}/progress`,
        title: `Team Progress Update: ${team.name}`,
        message: `Team "${team.name}" has reached ${averageProgress}% average progress across all courses.`
    }
    );

    return success;
} catch (error) {
    console.error('Error sending team progress notification:', error);
    return false;
}
};

/**
 * Send team completion notification to team manager
 */
export const sendTeamCompletionNotification = async (
  companyId: string,
  teamId: string,
  courseId: string,
  completedUsers: number
): Promise<boolean> => {
  try {
    // Get team details
    const team = await getTeamById(companyId, teamId);
    if (!team || !team.managerId) {
      console.error('Team or manager not found');
      return false;
  }

    // Get course details
    const course = await getCourseById(courseId);
    if (!course) {
      console.error('Course not found');
      return false;
  }

    // Send notification to manager
    const success = await sendNotificationByType(
      team.managerId,
      'team_completion',
      {
        teamId,
        teamName: team.name,
        courseId,
        courseName: course.title,
        completedUsers,
        timestamp: new Date().toISOString(),
        link: `/admin/teams/${teamId}/progress`,
        title: `Team Course Completion: ${team.name}`,
        message: `${completedUsers} members of team "${team.name}" have completed the course "${course.title}".`
    }
    );

    return success;
} catch (error) {
    console.error('Error sending team completion notification:', error);
    return false;
}
};

/**
 * Check team progress and send notifications if thresholds are met
 */
export const checkTeamProgress = async (
  companyId: string,
  teamId: string,
  progressThresholds: number[] = [25, 50, 75, 100]
): Promise<boolean> => {
  try {
    // Get team details
    const team = await getTeamById(companyId, teamId);
    if (!team || !team.managerId) {
      console.error('Team or manager not found');
      return false;
  }

    // Get team members
    const members = await getTeamMembers(companyId, teamId);
    if (!members || members.length === 0) {
      return false;
  }

    // Track course progress
    const courseProgress: Record<string, {
      totalProgress: number;
      userCount: number;
      completedUsers: number;
      courseName: string;
  }> = {};

    // Process each team member
    for (const member of members) {
      // Get user enrollments
      const enrollmentsRef = collection(firestore, `users/${member.id}/enrollments`);
      const enrollmentsSnapshot = await getDocs(enrollmentsRef);

      if (enrollmentsSnapshot.empty) {
        continue;
    }

      // Process each enrollment
      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        // Explicitly type the enrollment data to avoid 'any'
        // We only need courseId, progress, courseName, and status for this logic
        const enrollment = enrollmentDoc.data() as {
          courseId?: string;
          progress?: number;
          courseName?: string;
          status?: string;
        };
        const courseId = enrollment.courseId;

        // Ensure courseId is defined before using it as an index
        if (courseId) {
          if (!courseProgress[courseId]) {
            courseProgress[courseId] = {
              totalProgress: 0,
              userCount: 0,
              completedUsers: 0,
              courseName: enrollment.courseName || 'Unknown Course'
            };
          }

          courseProgress[courseId].totalProgress += enrollment.progress || 0;
          courseProgress[courseId].userCount++;

          if (enrollment.status === 'completed') {
            courseProgress[courseId].completedUsers++;
          }
        } else {
          // Optionally log or handle enrollments without a courseId
          console.warn(`Enrollment document ${enrollmentDoc.id} is missing a courseId.`);
        }
      }
    }

    // Check progress thresholds and send notifications
    let notificationsSent = 0;

    for (const courseId in courseProgress) {
      const progress = courseProgress[courseId];

      if (progress.userCount === 0) continue;

      const averageProgress = Math.round(progress.totalProgress / progress.userCount);

      // Check if any threshold is met
      for (const threshold of progressThresholds) {
        // Only notify if average progress is within 5% of the threshold
        if (averageProgress >= threshold - 2 && averageProgress <= threshold + 2) {
          // Send progress notification
          const success = await sendTeamProgressNotification(
            companyId,
            teamId,
            averageProgress,
            threshold
          );

          if (success) {
            notificationsSent++;
          }
        }
      }

      // Check if all users completed the course
      if (progress.completedUsers > 0 && progress.completedUsers === progress.userCount) {
        // Send completion notification
        const success = await sendTeamCompletionNotification(
          companyId,
          teamId,
          courseId,
          progress.completedUsers
        );

        if (success) {
          notificationsSent++;
        }
      }
    }

    return notificationsSent > 0;
} catch (error) {
    console.error('Error checking team progress:', error);
    return false;
}
};
