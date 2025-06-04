import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Creates a square image by cropping or padding
 * @param {string} imageUri - The local file path to the image
 * @param {number} size - The desired width and height of the square image
 * @returns {Promise<string>} - A promise that resolves to the path of the new square image
 */
export const createSquareImage = async (imageUri, size = 1200) => {
  try {
    // Get the original image dimensions
    const imageInfo = await ImageManipulator.manipulateAsync(
      imageUri,
      [],
      { base64: false }
    );
    
    const { width, height } = imageInfo;
    
    // Determine if the image is portrait, landscape, or already square
    if (width === height) {
      // Already square, just resize if needed
      if (width !== size) {
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: size, height: size } }],
          { format: ImageManipulator.SaveFormat.PNG }
        );
        return result.uri;
      }
      return imageUri;
    }
    
    let actions = [];
    
    if (width > height) {
      // Landscape image - crop from center to make it square
      const cropWidth = height;
      const cropX = Math.floor((width - height) / 2);
      actions.push({ 
        crop: { 
          originX: cropX, 
          originY: 0, 
          width: cropWidth, 
          height 
        } 
      });
    } else {
      // Portrait image - crop from center to make it square
      const cropHeight = width;
      const cropY = Math.floor((height - width) / 2);
      actions.push({ 
        crop: { 
          originX: 0, 
          originY: cropY, 
          width, 
          height: cropHeight 
        } 
      });
    }
    
    // Resize to desired size
    actions.push({ resize: { width: size, height: size } });
    
    // Apply manipulations
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      actions,
      { format: ImageManipulator.SaveFormat.PNG }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error creating square image:', error);
    return imageUri; // Return original as fallback
  }
};

/**
 * Uploads an image from a local file path to Firebase Storage
 * @param {string} localUri - The local file path to the image
 * @param {string} remoteFilename - The filename to use in Firebase Storage
 * @param {function} progressCallback - Optional callback for upload progress
 * @returns {Promise<string>} - A promise that resolves to the download URL
 */
export const uploadImageAsync = async (localUri, remoteFilename, progressCallback = null) => {
  try {
    // Get file extension
    const extension = localUri.split('.').pop();
    
    // Convert to square image first
    const squareImageUri = await createSquareImage(localUri);
    
    // Convert the file to a blob
    const fileInfo = await FileSystem.getInfoAsync(squareImageUri);
    
    if (!fileInfo.exists) {
      throw new Error(`File does not exist at path: ${squareImageUri}`);
    }
    
    // Read the file
    const fileContent = await FileSystem.readAsStringAsync(squareImageUri, {
      encoding: FileSystem.EncodingType.Base64
    });
    
    // Create a blob from the file content
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => {
        resolve(xhr.response);
      };
      xhr.onerror = (e) => {
        reject(new Error('Failed to convert file to blob'));
      };
      if (progressCallback) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            progressCallback(Math.round((event.loaded / event.total) * 100));
          }
        };
      }
      xhr.responseType = 'blob';
      xhr.open('GET', squareImageUri, true);
      xhr.send(null);
    });
    
    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, `product_images/${remoteFilename}`);
    
    // Upload the blob to Firebase Storage
    const snapshot = await uploadBytes(storageRef, blob);
    
    // Close the blob
    blob.close();
    
    // Clean up temporary square image if it's different from the original
    if (squareImageUri !== localUri) {
      try {
        await FileSystem.deleteAsync(squareImageUri, { idempotent: true });
      } catch (cleanupError) {
        console.log('Non-critical error cleaning up temp file:', cleanupError);
      }
    }
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

/**
 * Create a web-friendly filename for upload
 * @param {string} sku - The product SKU
 * @param {string} angle - The angle or photo type
 * @param {string} extension - The file extension (jpg, png, etc)
 * @returns {string} - A sanitized filename
 */
export const createUploadFilename = (sku, angle, extension) => {
  // Replace spaces and special characters
  const sanitizedSKU = sku.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedAngle = angle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  
  return `${sanitizedSKU}_${sanitizedAngle}.png`; // Always use PNG for consistency
}; 