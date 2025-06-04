# Product Photography App

A mobile application built with React Native (Expo) for capturing, organizing, and processing product photos for luxury goods resale. The app streamlines the product photography workflow from data entry to photography to background removal to export.

## Features

- **Product Metadata Collection**: Enter product details including brand, category, name, condition, and SKU
- **Guided Photography**: Step-by-step guidance for capturing each required product angle
- **Background Removal**: Integration with remove.bg API to remove backgrounds and generate clean product images
- **Photo Organization**: All photos are organized by SKU and accessible through an easy-to-use interface
- **Export Options**: Generate CSVs with product data and image links for inventory management
- **Firebase Integration**: Upload images to Firebase Storage to get web-accessible URLs for products
- **PDF & HTML Reports**: Generate PDF reports and HTML galleries with product images and details

## Installation

### Prerequisites

- Node.js (LTS version recommended)
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device for testing

### Setup

1. Clone this repository or download the source code
2. Navigate to the app directory:
   ```
   cd PhotographyApp/photographyapp
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npx expo start
   ```
5. Scan the QR code with your mobile device using the Expo Go app

## Firebase Configuration

To enable web uploads and URL generation:

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
2. In the Firebase console, add a web app to your project
3. Enable Firebase Storage in your project
4. Update the `firebaseConfig.js` file with your Firebase configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
5. Set your Firebase Storage rules to allow reads and writes (for development purposes):
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write;
       }
     }
   }
   ```

## Background Removal Configuration

To use the background removal feature:

1. Sign up for a [remove.bg](https://www.remove.bg/api) API key
2. Update the `config.js` file with your API key:
   ```javascript
   export const REMOVE_BG_API_KEY = 'your-api-key-here';
   ```

## Usage

### App Workflow

1. **Home Screen**: Enter a new SKU or select from previously saved SKUs
2. **Product Details**: Enter product metadata (brand, category, name, condition, etc.)
3. **Camera Screen**: Take photos of each required angle following the on-screen prompts
4. **Review Photos**: Accept or retake each photo
5. **Processing**: Background removal is applied (if enabled)
6. **View Photos**: Browse and share processed or original photos
7. **Export Data**: Generate CSVs with product data and image URLs

### Export Options

1. **Upload to Web**: First, upload images to Firebase to generate web URLs
2. **Export CSV**: Generate a CSV file with product metadata and image URLs
3. **Export Images**: Generate an HTML gallery with all product images
4. **Combined Export**: Generate both CSV and HTML gallery

## Folder Structure

- `/screens`: Main app screens
- `/components`: Reusable UI components
- `/utils`: Utility functions including background removal and image manipulation
- `/assets`: Static assets and images

## Permissions

The app requires the following permissions:
- Camera access
- Photo library access
- Internet access (for API calls and uploads)

## Troubleshooting

### Images Not Uploading to Firebase

- Verify your Firebase configuration in `firebaseConfig.js`
- Check that your Firebase Storage rules allow writes
- Ensure you have an active internet connection
- Look for errors in the console logs

### Background Removal Issues

- Verify your remove.bg API key is valid and has sufficient credits
- Ensure the image is clear and the product is visible
- Check your internet connection

### Export Problems

1. For CSV exports with image URLs:
   - Make sure to press "Upload to Web" first before exporting
   - Verify that the images were successfully uploaded to Firebase

2. If the app crashes during export:
   - Reduce the number of products being exported at once
   - Ensure the device has sufficient storage space

## Development Notes

- The app uses Expo's FileSystem API for local storage
- Firebase Storage is used for web-accessible image hosting
- Images are automatically processed to square format for consistent presentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Remove.bg API for background removal
- Firebase for image hosting
- Expo and React Native for the development framework
