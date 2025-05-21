/**
 * Video Types
 * 
 * This file contains TypeScript type definitions for video components.
 */

export interface VideoPlayerControls {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
}
