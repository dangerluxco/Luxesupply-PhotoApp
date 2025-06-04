// Configuration file for the Photography App

// Enter your remove.bg API key here
export const REMOVE_BG_API_KEY = 'mdP2UvW65P8qUmR3uJtDp1yb';

// API URL for remove.bg
export const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

// Default options for photo background removal
export const REMOVE_BG_OPTIONS = {
  size: 'auto',        // Output image size (use 'auto' to maintain original dimensions)
  type: 'product',     // Type of image to process ('product' is best for product photos)
  format: 'png',       // Output image format
  bg_color: 'white',   // Background color for the removed image
  crop: false,         // Don't crop the image - maintain original size and position
  scale: 'original',   // Don't scale the image
  position: 'original', // Keep original positioning
  roi: '0% 0% 100% 100%', // Keep entire original image (Region of Interest)
  add_shadow: false,    // No drop shadow
}; 