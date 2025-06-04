import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, Image, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Photo {
  id: string;
  uri: string;
  name: string;
}

export default function PhotosView() {
  const { sku } = useLocalSearchParams();
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingBackground, setProcessingBackground] = useState(false);

  useEffect(() => {
    if (!sku) {
      Alert.alert('Error', 'No SKU provided', [
        { text: 'Return Home', onPress: () => router.replace('/') }
      ]);
      return;
    }

    loadPhotos();
  }, [sku]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const skuDirectory = `${FileSystem.documentDirectory}${sku}/`;
      const dirInfo = await FileSystem.getInfoAsync(skuDirectory);
      
      if (!dirInfo.exists) {
        setPhotos([]);
        setLoading(false);
        return;
      }

      const files = await FileSystem.readDirectoryAsync(skuDirectory);
      const photoFiles = files.filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
      
      const photoData = photoFiles.map(file => ({
        id: file,
        uri: `${skuDirectory}${file}`,
        name: file.replace('_', ' ').replace('.jpg', '').replace('.png', '')
      }));
      
      setPhotos(photoData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos');
      setLoading(false);
    }
  };

  const removeBackground = async () => {
    try {
      setProcessingBackground(true);
      
      // This is where you would integrate with a background removal API like remove.bg
      // For this example, we're just simulating it with a delay
      
      Alert.alert('Background Processing', 'In a real app, this would call remove.bg API to process all images with a white background.');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProcessingBackground(false);
    } catch (error) {
      console.error('Error removing background:', error);
      Alert.alert('Error', 'Background removal failed');
      setProcessingBackground(false);
    }
  };

  const exportData = () => {
    // Navigate to export screen
    router.push({
      pathname: '/export-data',
      params: { sku }
    });
  };

  const renderPhotoItem = ({ item }: { item: Photo }) => (
    <View style={styles.photoItem}>
      <Image source={{ uri: item.uri }} style={styles.photo} />
      <ThemedText style={styles.photoName}>{item.name}</ThemedText>
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <ThemedText>Loading photos...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Photos for SKU: {sku}
      </ThemedText>
      
      {photos.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText>No photos available for this SKU</ThemedText>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => router.push('/(camera)')}
          >
            <ThemedText style={styles.buttonText}>Take Photos</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : (
        <>
          <FlatList
            data={photos}
            renderItem={renderPhotoItem}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.photoList}
          />
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, processingBackground && styles.buttonDisabled]}
              disabled={processingBackground}
              onPress={removeBackground}
            >
              {processingBackground ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <ThemedText style={styles.buttonText}>Remove Backgrounds</ThemedText>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={exportData}>
              <ThemedText style={styles.buttonText}>Export Data</ThemedText>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoList: {
    paddingBottom: 16,
  },
  photoItem: {
    flex: 1,
    margin: 8,
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  photoName: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  actionButtons: {
    marginTop: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 