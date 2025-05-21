import {useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {getCourseProgress, updateLessonProgress, markLessonCompleted } from '@/services/courseProgressService';
import {useAuth } from '@/context/AuthContext';
import {STALE_TIMES } from '@/utils/queryClient';

export function useCourseProgress(courseId: string) {
  const {user } = useAuth();
  const queryClient = useQueryClient();

  // Get course progress with optimized staleTime for frequently changing data
  const {data: progress, isLoading, error } = useQuery({
    queryKey: ['courseProgress', user?.uid, courseId],
    queryFn: async () => {
      if (!user?.uid || !courseId) {
        return null;
    }

      try {
        const result = await getCourseProgress(user.uid, courseId);
        return result;
    } catch (error) {
        console.error('Error fetching course progress:', error);
        throw error;
    }
  },
    enabled: !!user?.uid && !!courseId,
    staleTime: STALE_TIMES.REAL_TIME, // Use the real-time stale time for progress data
    refetchOnWindowFocus: true,
    retry: 2,
    // Add a reasonable cache time to keep data in memory even when inactive
    gcTime: 30 * 60 * 1000, // 30 minutes
});

  // Mark lesson as completed
  const markCompleted = useMutation({
    mutationFn: (data: {moduleId: string, lessonId: string, timeSpent?: number, position?: number}) =>
      markLessonCompleted(
        user!.uid,
        courseId,
        data.moduleId,
        data.lessonId,
        data.timeSpent || 0,
        data.position || 0
      ),
    onSuccess: () => {
      // Invalidate only the specific course progress query
      queryClient.invalidateQueries({
        queryKey: ['courseProgress', user?.uid, courseId],
        // Don't refetch automatically - let the component decide when to refetch
        refetchType: 'none'
    });

      // Also invalidate any lesson progress queries for this course
      queryClient.invalidateQueries({
        queryKey: ['lessonProgress', user?.uid, courseId],
        refetchType: 'none'
    });
  }
});

  return {
    progress,
    isLoading,
    error,
    markCompleted: markCompleted.mutate,
    isMarkingCompleted: markCompleted.isPending
};
}



