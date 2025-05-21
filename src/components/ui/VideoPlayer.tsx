import React, {useState, useEffect, useRef } from 'react';
import {Stream } from '@cloudflare/stream-react';

interface VideoPlayerProps {
  videoId: string;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  startTime?: number;
  primaryColor?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  onTimeUpdate,
  onDurationChange,
  onEnded,
  autoplay = false,
  muted = false,
  controls = true,
  className = '',
  startTime = 0,
  primaryColor = '#3b82f6'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    // Handle Stream player events
    const handleStreamEvents = () => {
      if (!playerRef.current) return;

      const player = playerRef.current;

      // Set up event listeners
      player.addEventListener('timeupdate', handleTimeUpdate);
      player.addEventListener('durationchange', handleDurationChange);
      player.addEventListener('ended', handleEnded);
      player.addEventListener('error', handleError);

      // Clean up event listeners
      return () => {
        player.removeEventListener('timeupdate', handleTimeUpdate);
        player.removeEventListener('durationchange', handleDurationChange);
        player.removeEventListener('ended', handleEnded);
        player.removeEventListener('error', handleError);
    };
  };

    if (isLoaded && playerRef.current) {
      const cleanup = handleStreamEvents();

      // Set start time if provided
      if (startTime > 0) {
        try {
          playerRef.current.currentTime = startTime;
      } catch (err) {
          console.error('Error setting start time:', err);
      }
    }

      return cleanup;
  }
}, [isLoaded, videoId, startTime]);

  const handleTimeUpdate = (e: any) => {
    if (onTimeUpdate && e.target) {
      onTimeUpdate(e.target.currentTime);
  }
};

  const handleDurationChange = (e: any) => {
    if (onDurationChange && e.target) {
      onDurationChange(e.target.duration);
  }
};

  const handleEnded = () => {
    if (onEnded) {
      onEnded();
  }
};

  const handleError = (e: any) => {
    console.error('Video player error:', e);
    setError('Failed to load video. Please try again later.');
};

  const handleStreamLoaded = (e: any) => {
    setIsLoaded(true);
    playerRef.current = e.target;
};

  if (!videoId) {
    return (
      <div className={`flex items-center justify-center bg-neutral-100 rounded-md ${className}`} style={{minHeight: '240px'}}>
        <p className="text-neutral-500">No video ID provided</p>
      </div>
    );
}

  return (
    <div className={`relative rounded-md overflow-hidden ${className}`}>
      {error ? (
        <div className="flex items-center justify-center bg-neutral-100 rounded-md w-full h-full" style={{minHeight: '240px'}}>
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <Stream
          src={videoId}
          controls={controls}
          autoplay={autoplay}
          muted={muted}
          responsive={true}
          onLoadedMetaData={handleStreamLoaded}
          primaryColor={primaryColor}
          className="w-full h-full"
        />
      )}
    </div>
  );
};

export default VideoPlayer;
