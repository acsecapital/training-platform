/**
 * Utility for uploading PDF files through our server-side proxy
 * This helps bypass Firebase Storage permission issues
 */

/**
 * Uploads a PDF file to Firebase Storage through our server-side proxy
 * @param {File} file The PDF file to upload
 * @param {string} storagePath Optional custom storage path
 * @return {Promise<{url: string, path: string}>} Promise with the download URL and storage path
 */
export const uploadPdfViaProxy = async (
  file: File,
  storagePath?: string
): Promise<{url: string; path: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
          throw new Error("Failed to read file");
        }

        // Convert file to base64
        const base64Data = (event.target.result as string).split(",")[1];

        // Send to our proxy API
        const response = await fetch("/api/proxy/pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name,
            contentType: file.type,
            storagePath,
          }),
        });

        if (!response.ok) {
          let errorMessage = "Failed to upload PDF";
          try {
            // Properly type the error response
            const errorData = await response.json() as { message?: string; error?: string };
            errorMessage = errorData.message || errorMessage;
            if (errorData.error) {
              console.error("Server error details:", errorData.error);
            }
          } catch (e) {
            console.error("Could not parse error response:", e);
          }
          throw new Error(errorMessage);
        }

        // Properly type the success response
        interface UploadResponse {
          url: string;
          path: string;
        }

        const data = await response.json() as UploadResponse;
        resolve({
          url: data.url,
          path: data.path,
        });
      } catch (error) {
        console.error("Error in PDF upload:", error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    // Read the file as a data URL (base64)
    reader.readAsDataURL(file);
  });
};

