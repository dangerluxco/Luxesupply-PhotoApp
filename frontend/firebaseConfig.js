import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// Replace these with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCmWlxz_Ke1caAao7EOpUQSPWWaAeZvHNg",
    authDomain: "photography-964f5.firebaseapp.com",
    projectId: "photography-964f5",
    storageBucket: "photography-964f5.firebasestorage.app",
    messagingSenderId: "766495540526",
    appId: "1:766495540526:web:720114ec550eac6e0c26bf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };

// Instructions for setting up Firebase:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project
// 3. In Project settings, add a web app
// 4. Copy the Firebase config object and replace the values above
// 5. Enable Firebase Storage in the Firebase console
// 6. Set Storage Rules to:
//    allow read, write: if request.auth != null || true;
//    (Note: In production, you should implement proper authentication instead of 'true') 