import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Switch,
  ScrollView
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { removeBackground, copyImageFallback } from '../utils/backgroundRemover';
import { REMOVE_BG_API_KEY } from '../config';

// Define the required photo angles
const REQUIRED_ANGLES = [
  'Front',
  'Back',
  'Bottom',
  'Left Side',
  'Right Side',
  'Interior'
];

export default function CameraScreen({ navigation, route }) {
  const { sku, startWithAngle } = route.params;
  const [hasPermission, setHasPermission] = useState(null);
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0); 
  const [capturedPhotos, setCapturedPhotos] = useState({});
  const [lastCapturedUri, setLastCapturedUri] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingAngle, setProcessingAngle] = useState('');
  const [enableBackgroundRemoval, setEnableBackgroundRemoval] = useState(true);
  const [processingStatus, setProcessingStatus] = useState('');
  const [apiKeyValid, setApiKeyValid] = useState(true);
  
  // Create a ref to store the interior photo separately
  const interiorPhotoRef = useRef(null);
  
  // Check if API key is valid
  useEffect(() => {
    if (REMOVE_BG_API_KEY === 'YOUR_REMOVE_BG_API_KEY_HERE') {
      setApiKeyValid(false);
      setEnableBackgroundRemoval(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      // Create directory for the SKU
      const skuDirectory = `${FileSystem.documentDirectory}${sku}/`;
      const dirInfo = await FileSystem.getInfoAsync(skuDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(skuDirectory, { intermediates: true });
      }
      
      // If we're asked to start with a specific angle, find it
      if (startWithAngle) {
        // Normalize the startWithAngle string to match the case in REQUIRED_ANGLES
        const targetAngle = startWithAngle.charAt(0).toUpperCase() + startWithAngle.slice(1).toLowerCase();
        console.log(`Looking for angle: ${targetAngle} in required angles`);
        
        const angleIndex = REQUIRED_ANGLES.findIndex(
          angle => angle === targetAngle || 
                  angle.toLowerCase() === startWithAngle.toLowerCase()
        );
        
        if (angleIndex !== -1) {
          console.log(`Found angle at index ${angleIndex}, setting as current angle`);
          setCurrentAngleIndex(angleIndex);
        }
      }
    })();
  }, [sku, startWithAngle]);

  const currentAngle = REQUIRED_ANGLES[currentAngleIndex];

  const takePicture = async () => {
    try {
      // Use image picker instead of camera component
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        exif: true,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLastCapturedUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
      console.error(error);
    }
  };

  const acceptPhoto = async () => {
    if (lastCapturedUri) {
      console.log(`Accepting photo for ${currentAngle}, index ${currentAngleIndex}`);
      
      // Special handling for Interior photo
      if (currentAngle === 'Interior') {
        console.log("Saving Interior photo to ref:", lastCapturedUri);
        interiorPhotoRef.current = {
          uri: lastCapturedUri,
          removeBackground: enableBackgroundRemoval
        };
      }
      
      // Save the photo in our collection with current background removal setting
      setCapturedPhotos(prev => {
        console.log(`Current captured photos:`, prev);
        return {
          ...prev,
          [currentAngle]: {
            uri: lastCapturedUri,
            removeBackground: enableBackgroundRemoval
          }
        };
      });
      
      // Clear the preview
      setLastCapturedUri(null);
      
      // Move to next angle or finish
      if (currentAngleIndex < REQUIRED_ANGLES.length - 1) {
        setCurrentAngleIndex(prev => prev + 1);
      } else {
        // All photos have been taken
        
        // Add a delay to ensure state update has completed
        // This is critical for the last photo (Interior)
        console.log("All photos captured, waiting for state update to complete...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log("Now saving all photos with updated state");
        // Log the complete photo collection again
        console.log("Final photo collection:", capturedPhotos);
        
        await saveAllPhotos();
        navigation.navigate('Home', { success: true });
      }
    }
  };

  const retakePhoto = () => {
    setLastCapturedUri(null);
  };

  const saveAllPhotos = async () => {
    try {
      setIsProcessing(true);
      setProcessingStatus('Preparing to process photos...');
      const skuDirectory = `${FileSystem.documentDirectory}${sku}/`;
      
      // Get the latest capturedPhotos directly from state
      // This ensures we have all photos including Interior
      const latestPhotos = { ...capturedPhotos };
      
      // CRITICAL FIX: Add interior photo from ref if it exists
      if (interiorPhotoRef.current) {
        console.log("Adding Interior photo from ref to collection");
        latestPhotos['Interior'] = interiorPhotoRef.current;
      }
      
      console.log("Latest photos before processing:", latestPhotos);
      
      const entries = Object.entries(latestPhotos);
      
      // Create processed folder for final images
      const processedDirectory = `${skuDirectory}processed/`;
      const processedDirInfo = await FileSystem.getInfoAsync(processedDirectory);
      if (!processedDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(processedDirectory, { intermediates: true });
      }
      
      console.log("Saving all photos, entries:", entries);
      
      // DEBUG: Check if we have an interior photo
      const hasInteriorPhoto = entries.some(([angle]) => angle === 'Interior');
      console.log("DEBUG: Has interior photo in data?", hasInteriorPhoto);
      
      for (let i = 0; i < entries.length; i++) {
        const [angle, photoData] = entries[i];
        
        // Special debug for interior photos
        if (angle === 'Interior') {
          console.log("DEBUG: Processing Interior photo specifically:");
          console.log("DEBUG: Interior photo data:", photoData);
        }
        
        // Handle both formats - new format (object with properties) and old format (string URI)
        let uri;
        let shouldRemoveBackground = enableBackgroundRemoval; // Default to global setting
        
        if (typeof photoData === 'object' && photoData !== null) {
          uri = photoData.uri;
          // Safely check if removeBackground property exists and is a boolean
          if (typeof photoData.removeBackground === 'boolean') {
            shouldRemoveBackground = photoData.removeBackground;
          }
        } else if (typeof photoData === 'string') {
          // Handle legacy format (string URI only)
          uri = photoData;
        } else {
          console.error(`Invalid photo data format for ${angle}:`, photoData);
          continue; // Skip this photo
        }
        
        if (!uri) {
          console.error(`No URI found for ${angle}`);
          continue; // Skip this photo
        }
        
        // STANDARDIZE ALL FILE NAMES FOR CONSISTENCY
        
        // 1. Convert angle to consistent lowercase format for filenames
        let standardAngle = angle.toLowerCase();
        
        // 2. Remove spaces from angle names and standardize
        if (standardAngle === "left side") {
          standardAngle = "leftside";
        } else if (standardAngle === "right side") {
          standardAngle = "rightside";
        }
        // Remove all spaces for consistency
        standardAngle = standardAngle.replace(/ /g, '');
        
        // Debug for interior
        if (angle === 'Interior') {
          console.log("DEBUG: Standardized interior angle name:", standardAngle);
        }
        
        // 3. Use standard file naming patterns for all photos
        const fileName = `${standardAngle}.png`;
        const newFileUri = `${processedDirectory}${fileName}`;
        
        const originalFileName = `${standardAngle}_original.jpg`;
        const originalFileUri = `${skuDirectory}${originalFileName}`;
        
        console.log(`Saving angle: ${angle}, standardized to: ${standardAngle}`);
        console.log(`Original file: ${originalFileUri}`);
        console.log(`Processed file: ${newFileUri}`);
        
        // First save the original file
        try {
          await FileSystem.copyAsync({
            from: uri,
            to: originalFileUri
          });
          console.log(`Successfully saved original ${angle} to ${originalFileUri}`);
          
          const check = await FileSystem.getInfoAsync(originalFileUri);
          console.log(`Original file existence check: ${check.exists}, size: ${check.size || 'unknown'}`);
          
          // Extra debug for interior
          if (angle === 'Interior') {
            console.log("DEBUG: Interior original file exists:", check.exists);
            console.log("DEBUG: Interior original file size:", check.size || 'unknown');
            console.log("DEBUG: Interior original file path:", originalFileUri);
          }
        } catch (copyError) {
          console.error(`Error saving original ${angle}:`, copyError);
        }
        
        // Update progress
        setProcessingProgress(((i + 1) / entries.length) * 100);
        setProcessingAngle(angle);
        
        try {
          if (shouldRemoveBackground) {
            // Show status that we're removing the background
            setProcessingStatus(`Removing background from ${angle} photo...`);
            
            // Remove background for each photo
            await removeBackground(uri, newFileUri);
            setProcessingStatus(`${angle} processed successfully!`);
            
            const check = await FileSystem.getInfoAsync(newFileUri);
            console.log(`Processed file existence check: ${check.exists}, size: ${check.size || 'unknown'}`);
            
            // Extra debug for interior
            if (angle === 'Interior') {
              console.log("DEBUG: Interior processed file exists:", check.exists);
              console.log("DEBUG: Interior processed file size:", check.size || 'unknown');
              console.log("DEBUG: Interior processed file path:", newFileUri);
            }
          } else {
            // If background removal is disabled, just copy the original
            setProcessingStatus(`Saving ${angle} photo (background removal disabled)...`);
            await copyImageFallback(uri, newFileUri);
            
            const check = await FileSystem.getInfoAsync(newFileUri);
            console.log(`Copied file existence check: ${check.exists}, size: ${check.size || 'unknown'}`);
            
            // Extra debug for interior
            if (angle === 'Interior') {
              console.log("DEBUG: Interior copied file exists:", check.exists);
              console.log("DEBUG: Interior copied file size:", check.size || 'unknown');
              console.log("DEBUG: Interior copied file path:", newFileUri);
            }
          }
        } catch (error) {
          console.error('Background removal failed:', error.message);
          setProcessingStatus(`Error processing ${angle}: ${error.message}`);
          
          // Show error alert but don't block the process
          setTimeout(() => {
            Alert.alert(
              'Background Removal Error', 
              `Error processing ${angle}: ${error.message}\n\nSaving original image instead.`,
              [{ text: 'Continue' }]
            );
          }, 500);
          
          // Fallback to copying the original image
          await copyImageFallback(uri, newFileUri);
          
          const check = await FileSystem.getInfoAsync(newFileUri);
          console.log(`Fallback file existence check: ${check.exists}, size: ${check.size || 'unknown'}`);
        }
      }
      
      // Final check to verify all required files exist
      console.log("FINAL VERIFICATION: Checking all photos exist on disk");
      
      const checkAngles = [
        { angle: "front", file: "front.png", original: "front_original.jpg" },
        { angle: "back", file: "back.png", original: "back_original.jpg" },
        { angle: "bottom", file: "bottom.png", original: "bottom_original.jpg" },
        { angle: "leftside", file: "leftside.png", original: "leftside_original.jpg" },
        { angle: "rightside", file: "rightside.png", original: "rightside_original.jpg" },
        { angle: "interior", file: "interior.png", original: "interior_original.jpg" }
      ];
      
      for (const check of checkAngles) {
        const processedPath = `${processedDirectory}${check.file}`;
        const originalPath = `${skuDirectory}${check.original}`;
        
        const processedExists = await FileSystem.getInfoAsync(processedPath);
        const originalExists = await FileSystem.getInfoAsync(originalPath);
        
        console.log(`${check.angle}: processed=${processedExists.exists}, original=${originalExists.exists}`);
      }
      
      setProcessingStatus('All photos processed successfully!');
      Alert.alert(
        'Success', 
        `All photos have been processed for SKU: ${sku}`
      );
    } catch (error) {
      Alert.alert('Error', `Failed to save photos: ${error.message}`);
      console.error(error);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
        setProcessingAngle('');
        setProcessingStatus('');
      }, 1000);
    }
  };

  // Check and request camera permissions
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>Checking camera permissions...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>We need your permission to use the camera</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={async () => {
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            setHasPermission(cameraStatus === 'granted' && mediaStatus === 'granted');
          }}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Processing overlay for background removal
  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.processingText}>Processing photos...</Text>
          <Text style={styles.processingDetails}>
            {processingAngle ? `Processing: ${processingAngle}` : 'Preparing...'}
          </Text>
          
          <ScrollView style={styles.statusScrollView}>
            <Text style={styles.statusText}>{processingStatus}</Text>
          </ScrollView>
          
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${processingProgress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(processingProgress)}% Complete
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Photo review screen
  if (lastCapturedUri) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.prompt}>{currentAngle} - Review Photo</Text>
        <Image source={{ uri: lastCapturedUri }} style={styles.preview} />
        <View style={styles.optionsContainer}>
          <Text style={styles.optionLabel}>Remove Background:</Text>
          <Switch
            value={enableBackgroundRemoval}
            onValueChange={setEnableBackgroundRemoval}
            disabled={!apiKeyValid}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={enableBackgroundRemoval ? "#2196F3" : "#f4f3f4"}
          />
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.rejectButton} onPress={retakePhoto}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={acceptPhoto}>
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Camera instructions screen
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.prompt}>Take photo: {currentAngle}</Text>
      <Text style={styles.progress}>
        {currentAngleIndex + 1} of {REQUIRED_ANGLES.length}
      </Text>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Position the product to show the {currentAngle.toLowerCase()} clearly.
        </Text>
        <Text style={styles.instructionsSubText}>
          Make sure the product is well-lit and centered in the frame.
        </Text>
        
        <View style={styles.optionsContainer}>
          <Text style={styles.optionLabel}>Default Background Removal:</Text>
          <Switch
            value={enableBackgroundRemoval}
            onValueChange={setEnableBackgroundRemoval}
            disabled={!apiKeyValid}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={enableBackgroundRemoval ? "#2196F3" : "#f4f3f4"}
          />
        </View>
        
        {!apiKeyValid && (
          <Text style={styles.apiKeyWarning}>
            API key not set. Background removal is disabled.
          </Text>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.captureButtonLarge} 
        onPress={takePicture}
      >
        <View style={styles.captureInner} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionsText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  instructionsSubText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  optionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 15,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  apiKeyWarning: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  prompt: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  progress: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  permissionText: {
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
    fontSize: 18,
  },
  captureButtonLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 40,
    borderWidth: 4,
    borderColor: '#2196F3',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  preview: {
    width: '90%',
    height: 400,
    alignSelf: 'center',
    marginVertical: 20,
    borderRadius: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    alignSelf: 'center',
    marginBottom: 40,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  processingDetails: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2196F3',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusScrollView: {
    maxHeight: 100,
    width: '90%',
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#555',
  },
  progressBarContainer: {
    width: '80%',
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginVertical: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
}); 