import React, {useState, useRef, useEffect } from 'react';
import {PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import {ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface VideoPlayerProps {
  videoId?: string; // Make it optional
  autoPlay?: boolean;
  onComplete?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId = '', // Provide a default empty string
  autoPlay = false, 
  onComplete 
}) => {
  // Add a check before using videoId
  if (!videoId) {
    return (
      <div className="aspect-video bg-neutral-100 flex items-center justify-center rounded-lg">
        <p className="text-neutral-500">No video available</p>
      </div>
    );
}

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format time in MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

  // Handle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
    } else {
        videoRef.current.play();
    }
      setIsPlaying(!isPlaying);
  }
};

  // Handle mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
  }
};

  // Handle seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
  }
};

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        videoRef.current.requestFullscreen();
    }
  }
};

  // Show controls on mouse move
  const handleMouseMove = () => {
    setShowControls(true);
    
    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
  }
    
    // Set new timeout to hide controls
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
    }
  }, 3000);
};

  // Update time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Check if video is complete (within 1 second of the end)
      if (video.duration - video.currentTime < 1 && onComplete) {
        onComplete();
    }
  };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
  };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onComplete) {
        onComplete();
    }
  };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
    }
  };
}, [onComplete]);

  return (
    <div 
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="w-full h-full"
        src={`https://customer-stream.cloudflarestream.com/${videoId}/manifest/video.m3u8`}
        poster={`https://customer-stream.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`}
        playsInline
        autoPlay={autoPlay}
        onClick={togglePlay}
      />
      
      {/* Play/Pause Overlay Button (center) */}
      {!isPlaying && (
        <button
          className="absolute inset-0 w-full h-full flex items-center justify-center bg-black bg-opacity-30 transition-opacity"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
            <PlayIcon className="h-10 w-10 text-primary" />
          </div>
        </button>
      )}
      
      {/* Video Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      >
        {/* Progress Bar */}
        <div className="mb-2 flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 rounded-full appearance-none bg-white/30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={togglePlay}
              className="text-white hover:text-primary-300 transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6" />
              )}
            </button>
            
            <button 
              onClick={toggleMute}
              className="text-white hover:text-primary-300 transition-colors"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="h-6 w-6" />
              ) : (
                <SpeakerWaveIcon className="h-6 w-6" />
              )}
            </button>
            
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div>
            <button 
              onClick={toggleFullscreen}
              className="text-white hover:text-primary-300 transition-colors"
            >
              <ArrowsPointingOutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
