export type ContentType = 'video' | 'text' | 'quiz' | 'interactive';

export interface ContentViewerOptions {
  scale: number;
  adaptiveLayout: boolean;
  touchEnabled: boolean;
}

export interface VideoPlayerControls {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
}