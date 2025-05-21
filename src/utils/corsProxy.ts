/**
 * A utility to proxy PDF URLs through a CORS-enabled endpoint
 * This helps with loading PDFs from Firebase Storage which might have CORS
 * restrictions
 */

/**
 * Converts a Firebase Storage URL to a CORS-friendly URL
 * @param {string} url The original Firebase Storage URL
 * @return {string} A URL that can be used with react-pdf
 */
export const getCorsProxyUrl = (url: string): string => {
  // If the URL is already a data URL, return it as is
  if (url.startsWith("data:")) {
    return url;
}

  // For Firebase Storage URLs, we can use our proxy API
  if (url.includes("firebasestorage.googleapis.com")) {
    // Extract the path from the URL
    const path = url.split("/o/")[1]?.split("?")[0];

    if (path) {
      // Decode the path
      const decodedPath = decodeURIComponent(path);

      // Create a URL for the API endpoint
      return `/api/proxy/pdf?path=${encodeURIComponent(decodedPath)}`;
  }
}

  // For Google Cloud Storage URLs, extract the path and use our proxy
  if (url.includes("storage.googleapis.com")) {
    // Extract the bucket and path
    const parts = url.replace("https://storage.googleapis.com/", "").split("/");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucket = parts[0];
    const path = parts.slice(1).join("/");

    if (path) {
      // Create a URL for the API endpoint
      return `/api/proxy/pdf?path=${encodeURIComponent(path)}`;
  }
}

  // For non-Firebase URLs, return the original URL
  return url;
};
