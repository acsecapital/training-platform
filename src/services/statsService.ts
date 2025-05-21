import {UserStats } from '@/types/user.types';

/**
 * Get user statistics
 * @param userId - The ID of the user to get stats for
 */
export const getUserStats = (userId: string): UserStats => {
  try {
    // This would typically fetch real data from Firestore
    // For now, we'll return mock data
    console.log(`Fetching stats for user: ${userId}`); // Use userId to avoid unused parameter warning

    return {
      coursesEnrolled: 5,
      coursesCompleted: 3,
      certificatesEarned: 2,
      totalLearningTime: 420, // in minutes
      averageQuizScore: 85,
      achievements: [
        {
          id: '1',
          name: 'Fast Learner',
          description: 'Completed a course in record time',
          icon: '/images/achievements/fast-learner.svg',
          earnedDate: new Date().toISOString(),
      },
        {
          id: '2',
          name: 'Perfect Score',
          description: 'Achieved 100% on a quiz',
          icon: '/images/achievements/perfect-score.svg',
          earnedDate: new Date().toISOString(),
      },
      ],
  };
} catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
}
};
