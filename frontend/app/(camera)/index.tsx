import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, Image } from 'react-native';
import { CameraView, Camera, type CameraType } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Define the required photo angles
const REQUIRED_ANGLES = [
  'Front',
  'Back',
  'Bottom',
  'Left Side',
  'Right Side',
  'Interior'
];

export default function CameraScreen() {
  const params = useLocalSearchParams();
  const { sku, productData } = params;
  const router = useRouter();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, string>>({});
  const [lastCapturedUri, setLastCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  // Ensure we have the required parameters
  useEffect(() => {
    if (!sku) {
      Alert.alert('Error', 'No SKU provided', [
        {
          text: 'Return Home',
          onPress: () => router.replace('/')
        }
      ]);
    }
  }, [sku, router]);

  useEffect(() => {
    // Request camera permission on component mount
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    // Create directory for the SKU if it doesn't exist
    (async () => {
      if (sku) {
        const skuDirectory = `${FileSystem.documentDirectory}${sku}/`;
        const dirInfo = await FileSystem.getInfoAsync(skuDirectory);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(skuDirectory, { intermediates: true });
        }
      }
    })();
  }, [sku]);

  if (hasPermission === null) {
    // Camera permissions are still loading
    return <View />;
  }

  if (hasPermission === false) {
    // Camera permissions not granted
    return (
      <ThemedView style={styles.container}>
        <ThemedText>We need your permission to use the camera</ThemedText>
        <TouchableOpacity 
          style={styles.button} 
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        >
          <ThemedText style={styles.buttonText}>Grant Permission</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const currentAngle = REQUIRED_ANGLES[currentAngleIndex];

  const takePicture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.8 });
      if (photo) {
        setLastCapturedUri(photo.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
      console.error(error);
    }
  };

  const acceptPhoto = async () => {
    if (lastCapturedUri) {
      // Save the photo to our collection
      const newCapturedPhotos = { 
        ...capturedPhotos, 
        [currentAngle]: lastCapturedUri 
      };
      setCapturedPhotos(newCapturedPhotos);
      
      // Move to next angle or finish if all angles captured
      if (currentAngleIndex < REQUIRED_ANGLES.length - 1) {
        setCurrentAngleIndex(currentAngleIndex + 1);
      } else {
        // All photos have been taken, proceed to saving them
        await saveAllPhotos();
        
        // Navigate to photos view
        router.push({
          pathname: '/photos-view',
          params: { sku }
        });
      }
      
      // Clear the preview
      setLastCapturedUri(null);
    }
  };

  const retakePhoto = () => {
    setLastCapturedUri(null);
  };

  const saveAllPhotos = async () => {
    try {
      if (!sku) {
        Alert.alert('Error', 'No SKU provided');
        return;
      }
      
      const skuDirectory = `${FileSystem.documentDirectory}${sku}/`;
      
      for (const [angle, uri] of Object.entries(capturedPhotos)) {
        const fileName = `${angle.toLowerCase().replace(' ', '_')}.jpg`;
        const newFileUri = `${skuDirectory}${fileName}`;
        
        // Copy file to SKU directory
        await FileSystem.copyAsync({
          from: uri,
          to: newFileUri
        });
        
        // Here you would integrate with remove.bg API
        // For the MVP, we're just copying the files
      }
      
      Alert.alert('Success', `Saved all photos for SKU: ${sku}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save photos');
      console.error(error);
    }
  };

  if (lastCapturedUri) {
    // Show photo review screen
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">{currentAngle} - Review Photo</ThemedText>
        <Image source={{ uri: lastCapturedUri }} style={styles.preview} />
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.rejectButton} onPress={retakePhoto}>
            <ThemedText style={styles.buttonText}>Retake</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={acceptPhoto}>
            <ThemedText style={styles.buttonText}>Accept</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.prompt}>
        Take photo: {currentAngle}
      </ThemedText>
      <ThemedText style={styles.progress}>
        {currentAngleIndex + 1} of {REQUIRED_ANGLES.length}
      </ThemedText>
      
      <CameraView 
        style={styles.camera} 
        facing={facing} 
        ref={cameraRef}
        onCameraReady={() => console.log('Camera ready')}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
      
      <TouchableOpacity
        style={styles.flipButton}
        onPress={() => {
          setFacing(facing === 'back' ? 'front' : 'back');
        }}>
        <ThemedText style={styles.flipText}>Flip Camera</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
    marginVertical: 20,
  },
  prompt: {
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 10,
    fontSize: 20,
  },
  progress: {
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  flipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 10,
    borderRadius: 5,
  },
  flipText: {
    color: 'white',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
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
    marginVertical: 20,
    borderRadius: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
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
}); 