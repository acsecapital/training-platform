import {MutableRefObject } from 'react';

declare module '@cloudflare/stream-react' {
  export interface StreamPlayerApi {
    currentTime: number;
    duration: number;
    play: () => void;
    pause: () => void;
    muted: boolean;
    volume: number;
    [key: string]: unknown;
}

  export interface StreamProps {
    src: string;
    streamRef?: MutableRefObject<StreamPlayerApi | undefined>;
    adUrl?: string;
    height?: string;
    width?: string;
    poster?: string;
    autoplay?: boolean;
    controls?: boolean;
    customerCode?: string;
    currentTime?: number;
    muted?: boolean;
    letterboxColor?: string;
    loop?: boolean;
    playbackRate?: number;
    preload?: 'auto' | 'metadata' | 'none' | boolean;
    primaryColor?: string;
    startTime?: string | number;
    responsive?: boolean;
    volume?: number;
    onAbort?: (event: Event) => void;
    onCanPlay?: (event: Event) => void;
    onCanPlayThrough?: (event: Event) => void;
    onDurationChange?: (event: Event) => void;
    onEmptied?: (event: Event) => void;
    onEnded?: (event: Event) => void;
    onError?: (event: Event) => void;
    onLoadedData?: (event: Event) => void;
    onLoadedMetaData?: (event: Event) => void;
    onLoadStart?: (event: Event) => void;
    onPause?: (event: Event) => void;
    onPlay?: (event: Event) => void;
    onPlaying?: (event: Event) => void;
    onProgress?: (event: Event) => void;
    onRateChange?: (event: Event) => void;
    onSeeked?: (event: Event) => void;
    onSeeking?: (event: Event) => void;
    onStalled?: (event: Event) => void;
    onSuspend?: (event: Event) => void;
    onTimeUpdate?: (event: Event) => void;
    onVolumeChange?: (event: Event) => void;
    onWaiting?: (event: Event) => void;
    className?: string;
}

  export const Stream: React.FC<StreamProps>;
}
