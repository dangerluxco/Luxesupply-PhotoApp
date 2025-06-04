import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { REMOVE_BG_API_KEY, REMOVE_BG_API_URL, REMOVE_BG_OPTIONS } from '../config';

/**
 * Removes the background from an image using the remove.bg API
 * @param {string} imageUri - Local URI of the image
 * @param {string} outputUri - Where to save the resulting image
 * @param {Object} options - Additional options for the API
 * @returns {Promise<string>} - Promise that resolves to the output URI
 */
export const removeBackground = async (imageUri, outputUri, options = {}) => {
  try {
    // Check if API key is set
    if (REMOVE_BG_API_KEY === 'YOUR_REMOVE_BG_API_KEY_HERE') {
      throw new Error('Please set your remove.bg API key in config.js');
    }

    // Get the original image dimensions for later use
    const originalImageInfo = await ImageManipulator.manipulateAsync(
      imageUri,
      [],
      { base64: false }
    );
    
    const originalWidth = originalImageInfo.width;
    const originalHeight = originalImageInfo.height;

    // Read the image file as base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Prepare the request using fetch instead of axios
    const response = await fetch(REMOVE_BG_API_URL, {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_file_b64: base64Image,
        ...REMOVE_BG_OPTIONS,
        ...options,
      }),
    });

    // Check if the response is successful
    if (!response.ok) {
      const statusCode = response.status;
      switch (statusCode) {
        case 400:
          throw new Error('Bad request - check your image and parameters');
        case 401:
          throw new Error('Unauthorized - check your API key');
        case 402:
          throw new Error('Payment required - exceeded API credits');
        case 429:
          throw new Error('Too many requests - slow down your requests');
        default:
          throw new Error(`API returned error code ${statusCode}`);
      }
    }

    // Get response as a blob
    const blob = await response.blob();
    
    // Convert blob to a readable format and write to file
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          // Extract base64 data from the result (remove the data URL prefix)
          const base64Data = reader.result.split(',')[1];
          
          // First write to a temporary file
          const tempUri = `${FileSystem.cacheDirectory}temp_${Date.now()}.png`;
          await FileSystem.writeAsStringAsync(tempUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Check if the processed image maintains the correct dimensions, if not, resize and center
          const processedImageInfo = await ImageManipulator.manipulateAsync(
            tempUri,
            [],
            { base64: false }
          );
          
          // If dimensions changed significantly, create a new image with correct dimensions
          if (Math.abs(processedImageInfo.width - originalWidth) > 10 || 
              Math.abs(processedImageInfo.height - originalHeight) > 10) {
            
            console.log("Dimensions changed, adjusting image...");
            
            // Create a properly sized image with white background
            const finalImage = await ImageManipulator.manipulateAsync(
              tempUri,
              [
                // Resize to fit within original dimensions while maintaining aspect ratio
                { resize: { width: originalWidth, height: originalHeight } }
              ],
              {
                format: ImageManipulator.SaveFormat.PNG,
                compress: 1
              }
            );
            
            // Save the final image
            await FileSystem.copyAsync({
              from: finalImage.uri,
              to: outputUri
            });
            
            // Clean up temporary files
            await FileSystem.deleteAsync(tempUri, { idempotent: true });
            
          } else {
            // If dimensions are correct, just use the processed image directly
            await FileSystem.copyAsync({
              from: tempUri,
              to: outputUri
            });
            
            // Clean up temporary files
            await FileSystem.deleteAsync(tempUri, { idempotent: true });
          }
          
          resolve(outputUri);
        } catch (error) {
          console.error("Error in image post-processing:", error);
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Background removal error details:", error);
    throw error;
  }
};

/**
 * Fallback function that simply copies the image when API is not available
 * @param {string} imageUri - Local URI of the image
 * @param {string} outputUri - Where to save the resulting image
 * @returns {Promise<string>} - Promise that resolves to the output URI
 */
export const copyImageFallback = async (imageUri, outputUri) => {
  await FileSystem.copyAsync({
    from: imageUri,
    to: outputUri
  });
  return outputUri;
}; 