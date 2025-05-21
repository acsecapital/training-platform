import createCache from "@emotion/cache";

/**
 * Creates an Emotion cache for styling
 * @return {Object} Emotion cache instance
 */
export default function createEmotionCache() {
  return createCache({key: "css", prepend: true});
}
