import React, {useState, useEffect, useRef } from 'react';
import {Stream } from '@cloudflare/stream-react';
import {useAuth } from '@/context/AuthContext';
import {
  updateLessonTracking,
  markLessonCompleted,
  addLessonBookmark,
  getLessonProgress
} from '@/services/courseProgressService';
import Button from '@/components/ui/Button';
import {formatDuration } from '@/utils/formatters';
import {useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface VideoProgressTrackerProps {
  videoId: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  onComplete?: () => void;
}

const VideoProgressTracker: React.FC<VideoProgressTrackerProps> = ({
  videoId,
  courseId,
  moduleId,
  lessonId,
  onComplete
}) => {
  const {user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const playerRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(0);
  const timeSpentRef = useRef<number>(0);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const queryClient = useQueryClient();

  // For fetching initial progress data
  const {data: progressData } = useQuery({
    queryKey: ['lessonProgress', user?.uid, courseId, moduleId, lessonId],
    queryFn: async () => {
      if (!user?.uid) return null;

      try {
        // Get lesson progress data
        const result = await getLessonProgress(user.uid, courseId, moduleId, lessonId);
        return result;
    } catch (error) {
        console.error('Error fetching lesson progress:', error);
        throw error;
    }
  },
    enabled: !!user?.uid,
    staleTime: 5000, // 5 seconds - balance between fresh data and reducing reads
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache even when inactive
    initialData: {
      completed: false,
      progress: 0,
      timeSpent: 0,
      currentPosition: 0,
      bookmarks: [], // Assuming Bookmark is an array, e.g., Bookmark[]
      // lessonId and moduleId are not strictly part of this specific alternative type in the error,
      // but will be populated once the actual data is fetched by getLessonProgress.
    },
    retry: 1, // Only retry once for video progress
});

  // For updating progress
  const updateProgressMutation = useMutation({
    mutationFn: (data: {
      userId: string;
      courseId: string;
      moduleId: string;
      lessonId: string;
      timeSpent: number;
      currentTime: number;
      progress: number;
  }) => updateLessonTracking(
      data.userId,
      data.courseId,
      data.moduleId,
      data.lessonId,
      data.timeSpent,
      data.currentTime, // This is the position parameter
      data.progress    // This is the progressPercentage parameter
    ),
    onSuccess: () => {
      // Use selective invalidation with refetchType: 'none' to avoid unnecessary refetches
      // This lets us control when the data is actually refetched
      queryClient.invalidateQueries({
        queryKey: ['lessonProgress', user?.uid, courseId, moduleId, lessonId],
        refetchType: 'none'
    });

      // Also invalidate the course progress but don't trigger an immediate refetch
      queryClient.invalidateQueries({
        queryKey: ['courseProgress', user?.uid, courseId],
        refetchType: 'none'
    });
  }
});

  // Track time spent watching the video
  useEffect(() => {
    if (isPlaying) {
      // Start tracking time spent
      trackingIntervalRef.current = setInterval(() => {
        timeSpentRef.current += 1;
        setTimeSpent(prev => prev + 1);
    }, 1000);
  } else if (trackingIntervalRef.current) {
      // Stop tracking time spent
      clearInterval(trackingIntervalRef.current);
  }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
    }
  };
}, [isPlaying]);

  // Update progress periodically
  useEffect(() => {
    const updateProgressPeriodically = async () => {
      if (!user || !isPlaying) return;

      const now = Date.now();
      // Only update every 10 seconds to avoid too many writes
      if (now - lastUpdateRef.current >= 10000) {
        lastUpdateRef.current = now;

        try {
          updateProgressMutation.mutate({
            userId: user.uid,
            courseId,
            moduleId,
            lessonId,
            timeSpent: timeSpentRef.current,
            currentTime,
            progress
        });

          // Reset the time spent counter after updating
          timeSpentRef.current = 0;
      } catch (err) {
          console.error('Error updating progress:', err);
      }
    }
  };

    updateProgressPeriodically();
}, [user, courseId, moduleId, lessonId, isPlaying, currentTime, progress]);

  // Mark as completed when reaching the end
  useEffect(() => {
    const markAsCompleted = async () => {
      if (!user || isCompleted) return;

      // Consider the video completed if the user has watched at least 90% of it
      if (progress >= 90) {
        try {
          await markLessonCompleted(
            user.uid,
            courseId,
            moduleId,
            lessonId,
            timeSpentRef.current,
            currentTime
          );

          setIsCompleted(true);
          if (onComplete) {
            onComplete();
        }
      } catch (err) {
          console.error('Error marking lesson as completed:', err);
      }
    }
  };

    markAsCompleted();
}, [user, courseId, moduleId, lessonId, progress, isCompleted, onComplete]);

  // Handle video events
  const handleTimeUpdate = (e: any) => {
    if (!e.target) return;

    const newCurrentTime = Math.floor(e.target.currentTime);
    setCurrentTime(newCurrentTime);

    if (duration > 0) {
      const newProgress = Math.round((newCurrentTime / duration) * 100);
      setProgress(newProgress);
  }
};

  const handleDurationChange = (e: any) => {
    if (!e.target) return;

    const newDuration = Math.floor(e.target.duration);
    setDuration(newDuration);
};

  const handlePlay = () => {
    setIsPlaying(true);
};

  const handlePause = () => {
    setIsPlaying(false);
};

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(100);
};

  const handleError = (e: any) => {
    console.error('Video player error:', e);
    setError('Failed to load video. Please try again later.');
};

  // Add bookmark
  const handleAddBookmark = async () => {
    if (!user || !bookmarkNote.trim()) return;

    try {
      await addLessonBookmark(
        user.uid,
        courseId,
        moduleId,
        lessonId,
        currentTime,
        bookmarkNote
      );

      setBookmarkNote('');
      setShowBookmarkForm(false);
  } catch (err) {
      console.error('Error adding bookmark:', err);
      setError('Failed to add bookmark. Please try again.');
  }
};

  // Seek to specific time
  const seekToTime = (time: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = time;
  }
};

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="relative">
        {/* Video Player */}
        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
          <Stream
            src={videoId}
            controls
            responsive={true}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onDurationChange={handleDurationChange}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handleError}
            onLoadedMetaData={(e: any) => {
              playerRef.current = e.target;
          }}
          />
        </div>

        {/* Progress Indicator */}
        <div className="mt-2 flex items-center justify-between text-sm text-neutral-600">
          <div className="flex items-center">
            <span className="mr-2">{formatDuration(currentTime)}</span>
            <div className="w-32 md:w-64 bg-neutral-200 rounded-full h-1.5">
              <div
                className="bg-primary-600 h-1.5 rounded-full"
                style={{width: `${progress}%` }}
              ></div>
            </div>
            <span className="ml-2">{formatDuration(duration)}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs bg-neutral-100 px-2 py-1 rounded-md">
              {progress}% complete
            </span>

            <button
              type="button"
              onClick={() => setShowBookmarkForm(!showBookmarkForm)}
              className="text-primary-600 hover:text-primary-800"
              title="Add Bookmark"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bookmark Form */}
      {showBookmarkForm && (
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">
            Add Bookmark at {formatDuration(currentTime)}
          </h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={bookmarkNote}
              onChange={(e) => setBookmarkNote(e.target.value)}
              placeholder="Add a note for this bookmark"
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddBookmark}
              disabled={!bookmarkNote.trim()}
            >
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBookmarkForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Time Spent */}
      <div className="text-xs text-neutral-500">
        Time spent watching: {formatDuration(timeSpent)}
      </div>
    </div>
  );
};

export default VideoProgressTracker;







