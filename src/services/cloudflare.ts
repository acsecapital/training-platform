/**
 * Cloudflare Stream API service
 *
 * This service provides methods for interacting with the Cloudflare Stream API
 * for video hosting and playback.
 */

// Cloudflare Stream API base URL
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const CLOUDFLARE_ACCOUNT_ID = process.env.NEXT_PUBLIC_CLOUDFLARE_STREAM_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

interface CloudflareResponse<T> {
  result: T;
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
}

interface DirectUploadResult {
  uploadURL: string;
  uid: string;
}

interface VideoDetailsResult {
  // Define properties based on Cloudflare's video details API response
  // Example:
  uid: string;
  status: { state: string };
  duration: number;
  // ... other properties
}

/**
 * Get a signed URL for direct upload to Cloudflare Stream
 * @returns Promise with the signed URL and upload parameters
 */
export const getDirectUploadUrl = async (): Promise<DirectUploadResult> => {
  try {
    const response = await fetch(
      `${CLOUDFLARE_API_BASE}/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          maxDurationSeconds: 3600,
          expiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }),
    }
    );

    if (!response.ok) {
      throw new Error(`Failed to get direct upload URL: ${response.statusText}`);
  }

    const data = await response.json() as CloudflareResponse<DirectUploadResult>;
    return data.result;
} catch (error) {
    console.error('Error getting direct upload URL:', error);
    throw error;
}
};

/**
 * Get video details from Cloudflare Stream
 * @param videoId The Cloudflare Stream video ID
 * @returns Promise with the video details
 */
export const getVideoDetails = async (videoId: string): Promise<VideoDetailsResult> => {
  try {
    const response = await fetch(
      `${CLOUDFLARE_API_BASE}/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    }
    );

    if (!response.ok) {
      throw new Error(`Failed to get video details: ${response.statusText}`);
  }

    const data = await response.json() as CloudflareResponse<VideoDetailsResult>;
    return data.result;
} catch (error) {
    console.error('Error getting video details:', error);
    throw error;
}
};

interface DeleteVideoResult {
  // Define properties based on Cloudflare's delete video API response
  // Using Record<string, unknown> to represent an object with unknown properties
  // instead of an empty interface
  [key: string]: unknown;
}
/**
 * Delete a video from Cloudflare Stream
 * @param videoId The Cloudflare Stream video ID
 * @returns Promise with the deletion result
 */
export const deleteVideo = async (videoId: string): Promise<DeleteVideoResult> => {
  try {
    const response = await fetch(
      `${CLOUDFLARE_API_BASE}/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete video: ${response.statusText}`);
  }

    const data = await response.json() as CloudflareResponse<DeleteVideoResult>;
    return data.result;
} catch (error) {
    console.error('Error deleting video:', error);
    throw error;
}
};

interface SignedPlaybackUrlResult {
  token: string;
  // ... other properties if any
}
/**
 * Get a signed playback URL for a video
 * @param videoId The Cloudflare Stream video ID
 * @param expiryMinutes Number of minutes until the URL expires (default: 60)
 * @returns Promise with the signed playback URL
 */
export const getSignedPlaybackUrl = async (videoId: string, expiryMinutes = 60): Promise<string> => {
  try {
    const response = await fetch(
      `${CLOUDFLARE_API_BASE}/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}/token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          exp: Math.floor(Date.now() / 1000) + (expiryMinutes * 60),
      }),
    }
    );

    if (!response.ok) {
      throw new Error(`Failed to get signed playback URL: ${response.statusText}`);
  }

    const data = await response.json() as CloudflareResponse<SignedPlaybackUrlResult>;
    return `https://videodelivery.net/${data.result.token}/manifest/video.m3u8`;
} catch (error) {
    console.error('Error getting signed playback URL:', error);
    throw error;
}
};

/**
 * Get a thumbnail URL for a video
 * @param videoId The Cloudflare Stream video ID
 * @param time Time in seconds to capture the thumbnail (default: 0)
 * @returns The thumbnail URL
 */
export const getVideoThumbnailUrl = (videoId: string, time = 0) => {
  return `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg?time=${time}s`;
};

/**
 * Format video duration in seconds to a human-readable string
 * @param durationSeconds Duration in seconds
 * @returns Formatted duration string (e.g., "1h 30m")
 */
export const formatVideoDuration = (durationSeconds: number): string => {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
} else {
    return `${minutes} min`;
}
};
