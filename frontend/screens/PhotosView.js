import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  Share,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function PhotosView({ navigation, route }) {
  const { sku } = route.params;
  const [photos, setPhotos] = useState([]);
  const [originalPhotos, setOriginalPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    // Only run this once per component mount
    console.log("LOAD PHOTOS CALLED - FOR SKU: " + sku);
    loadPhotos();
    loadProductData();
  }, [route.params?.refresh]);

  const loadProductData = async () => {
    try {
      const metadataPath = `${FileSystem.documentDirectory}metadata/${sku}.json`;
      const metadataInfo = await FileSystem.getInfoAsync(metadataPath);
      
      if (metadataInfo.exists) {
        const dataString = await FileSystem.readAsStringAsync(metadataPath);
        const data = JSON.parse(dataString);
        setProductData(data);
      } else {
        console.log("No metadata found for this SKU");
      }
    } catch (error) {
      console.error("Error loading product metadata:", error);
    }
  };

  const loadPhotos = async () => {
    try {
      console.log("Loading photos for SKU:", sku);
      setLoading(true);
      
      const skuDirectory = `${FileSystem.documentDirectory}${sku}/`;
      const processedDirectory = `${skuDirectory}processed/`;
      
      // Debug directory paths
      console.log("DEBUG: SKU directory path:", skuDirectory);
      console.log("DEBUG: Processed directory path:", processedDirectory);
      
      // Standardized approach: Always look for these specific filenames in both directories
      const standardAngles = [
        { name: 'Front', processedFile: 'front.png', originalFile: 'front_original.jpg' },
        { name: 'Back', processedFile: 'back.png', originalFile: 'back_original.jpg' },
        { name: 'Bottom', processedFile: 'bottom.png', originalFile: 'bottom_original.jpg' },
        { name: 'Left Side', processedFile: 'leftside.png', originalFile: 'leftside_original.jpg' },
        { name: 'Right Side', processedFile: 'rightside.png', originalFile: 'rightside_original.jpg' },
        { name: 'Interior', processedFile: 'interior.png', originalFile: 'interior_original.jpg' }
      ];
      
      // Debug: Check for interior specifically
      console.log("DEBUG: Will be looking for interior.png and interior_original.jpg");
      
      // Check if processed directory exists
      const processedDirInfo = await FileSystem.getInfoAsync(processedDirectory);
      const hasProcessedDir = processedDirInfo.exists;
      console.log("Processed directory exists:", hasProcessedDir);
      
      // Debug: If we have a processed directory, list all files in it
      if (hasProcessedDir) {
        try {
          const processedFiles = await FileSystem.readDirectoryAsync(processedDirectory);
          console.log("DEBUG: All files in processed directory:", processedFiles);
        } catch (err) {
          console.log("DEBUG: Error listing processed directory:", err);
        }
      }
      
      // Debug: List all files in main SKU directory too
      try {
        const mainFiles = await FileSystem.readDirectoryAsync(skuDirectory);
        console.log("DEBUG: All files in main SKU directory:", mainFiles);
      } catch (err) {
        console.log("DEBUG: Error listing main SKU directory:", err);
      }
      
      // Collect all photos we find
      let allPhotos = [];
      let originalPhotos = [];
      
      // For each standard angle, check if files exist
      for (const angle of standardAngles) {
        console.log(`Checking for ${angle.name} photos...`);
        
        // Extra debug for interior
        const isInterior = angle.name === 'Interior';
        if (isInterior) {
          console.log("DEBUG: Now checking specifically for interior photos");
        }
        
        // First try the processed file
        if (hasProcessedDir) {
          const processedPath = `${processedDirectory}${angle.processedFile}`;
          const processedInfo = await FileSystem.getInfoAsync(processedPath);
          
          if (isInterior) {
            console.log(`DEBUG: Interior processed path: ${processedPath}`);
            console.log(`DEBUG: Interior processed exists: ${processedInfo.exists}`);
          }
          
          if (processedInfo.exists) {
            console.log(`Found processed ${angle.name} photo: ${processedPath}`);
            allPhotos.push({
              name: angle.processedFile,
              uri: processedPath,
              type: angle.name,
              isProcessed: true
            });
            
            if (isInterior) {
              console.log("DEBUG: Added interior processed photo to display list");
            }
            
            continue; // Skip checking original if processed exists
          }
        }
        
        // If no processed, try original
        const originalPath = `${skuDirectory}${angle.originalFile}`;
        const originalInfo = await FileSystem.getInfoAsync(originalPath);
        
        if (isInterior) {
          console.log(`DEBUG: Interior original path: ${originalPath}`);
          console.log(`DEBUG: Interior original exists: ${originalInfo.exists}`);
        }
        
        if (originalInfo.exists) {
          console.log(`Found original ${angle.name} photo: ${originalPath}`);
          const photo = {
            name: angle.originalFile,
            uri: originalPath,
            type: angle.name,
            isProcessed: false
          };
          allPhotos.push(photo);
          originalPhotos.push(photo);
          
          if (isInterior) {
            console.log("DEBUG: Added interior original photo to display list");
          }
        } else {
          console.log(`No ${angle.name} photo found with standard name`);
          
          if (isInterior) {
            console.log("DEBUG: No interior photo found with standard name");
          }
        }
      }
      
      console.log("Final photos to display:", allPhotos.map(p => ({ name: p.name, type: p.type })));
      
      // Check specifically for interior in the final list
      const hasInterior = allPhotos.some(photo => photo.type === 'Interior');
      console.log("DEBUG: Final photo list includes interior:", hasInterior);
      
      setOriginalPhotos(originalPhotos);
      setPhotos(allPhotos);
    } catch (error) {
      console.error("Error loading photos:", error);
      Alert.alert("Error", "Could not load photos: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to determine photo type from filename
  const getPhotoType = (filename) => {
    const normalizedName = filename.toLowerCase();
    
    // Check for interior photos
    if (normalizedName.includes('interior')) {
      return 'Interior';
    }
    
    // Check for front
    if (normalizedName.includes('front')) {
      return 'Front';
    }
    
    // Check for back
    if (normalizedName.includes('back') && !normalizedName.includes('background')) {
      return 'Back';
    }
    
    // Check for bottom
    if (normalizedName.includes('bottom')) {
      return 'Bottom';
    }
    
    // Check for sides
    if (normalizedName.includes('left_side') || normalizedName.includes('leftside') || 
        normalizedName.includes('left side') || normalizedName === 'left.png' || 
        normalizedName === 'left.jpg') {
      return 'Left Side';
    }
    
    if (normalizedName.includes('right_side') || normalizedName.includes('rightside') || 
        normalizedName.includes('right side') || normalizedName === 'right.png' || 
        normalizedName === 'right.jpg') {
      return 'Right Side';
    }
    
    // Fallback: extract name part and make it pretty
    const namePart = filename.split('.')[0].replace(/_original$/, '').replace(/_/g, ' ');
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const sharePhoto = async (photo) => {
    try {
      const result = await Share.share({
        url: photo.uri,
        message: `Product SKU: ${sku} - ${photo.type} view`
      });
    } catch (error) {
      Alert.alert("Error", "Could not share the photo");
    }
  };

  const generatePdf = async () => {
    try {
      setGeneratingPdf(true);
      
      // Always use the currently displayed photos
      const photosToUse = photos;
      
      if (photosToUse.length === 0) {
        Alert.alert("Error", "No photos available to generate PDF");
        setGeneratingPdf(false);
        return;
      }
      
      // Convert images to base64 for HTML
      const imagePromises = photosToUse.map(async (photo) => {
        try {
          const base64 = await FileSystem.readAsStringAsync(photo.uri, {
            encoding: FileSystem.EncodingType.Base64
          });
          return {
            ...photo,
            base64
          };
        } catch (error) {
          console.error(`Error reading image ${photo.name}:`, error);
          return null;
        }
      });
      
      const imagesWithBase64 = (await Promise.all(imagePromises)).filter(Boolean);
      
      // Generate HTML content for the PDF
      let htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
              h1 { font-size: 24px; color: #2196F3; margin-bottom: 10px; }
              h2 { font-size: 20px; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
              .product-info { margin-bottom: 30px; }
              .info-row { margin-bottom: 5px; display: flex; }
              .info-label { font-weight: bold; width: 120px; }
              .photo-grid { display: flex; flex-wrap: wrap; margin: 0 -10px; }
              .photo-container { width: 100%; margin-bottom: 20px; break-inside: avoid; }
              .photo-title { font-weight: bold; margin-bottom: 5px; }
              .photo { width: 100%; max-height: 300px; object-fit: contain; border: 1px solid #ddd; }
              .notes { font-style: italic; margin-top: 5px; white-space: pre-wrap; }
              .timestamp { color: #999; font-size: 12px; margin-top: 20px; text-align: right; }
            </style>
          </head>
          <body>
            <h1>Product Details: ${sku}</h1>
      `;
      
      // Add product information if available
      if (productData) {
        htmlContent += `
          <div class="product-info">
            <div class="info-row"><span class="info-label">Name:</span> <span>${productData.name || '-'}</span></div>
            <div class="info-row"><span class="info-label">Brand:</span> <span>${productData.brand || '-'}</span></div>
            <div class="info-row"><span class="info-label">Category:</span> <span>${productData.category || '-'}</span></div>
            ${productData.condition ? `<div class="info-row"><span class="info-label">Condition:</span> <span>${productData.condition}</span></div>` : ''}
            ${productData.conditionNotes ? `
              <div class="info-row" style="display: block;">
                <div class="info-label">Condition Notes:</div>
                <div class="notes">${productData.conditionNotes}</div>
              </div>
            ` : ''}
          </div>
        `;
      }
      
      // Add photos
      htmlContent += '<h2>Product Photos</h2><div class="photo-grid">';
      
      imagesWithBase64.forEach(photo => {
        htmlContent += `
          <div class="photo-container">
            <div class="photo-title">${photo.type}</div>
            <img class="photo" src="data:image/jpeg;base64,${photo.base64}" />
          </div>
        `;
      });
      
      htmlContent += '</div>';
      
      // Add footer with timestamp
      htmlContent += `
            <div class="timestamp">Generated on ${new Date().toLocaleString()}</div>
          </body>
        </html>
      `;
      
      // Generate PDF file
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Save to a more persistent location
      const pdfFolder = `${FileSystem.documentDirectory}pdfs/`;
      const pdfInfo = await FileSystem.getInfoAsync(pdfFolder);
      
      if (!pdfInfo.exists) {
        await FileSystem.makeDirectoryAsync(pdfFolder, { intermediates: true });
      }
      
      const timestamp = new Date().getTime();
      const newPdfPath = `${pdfFolder}${sku}_${timestamp}.pdf`;
      await FileSystem.moveAsync({
        from: uri,
        to: newPdfPath
      });
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newPdfPath);
      } else {
        Alert.alert(
          "Success", 
          `PDF saved to: ${newPdfPath}`, 
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF report");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const renderProductDetails = () => {
    if (!productData) return null;
    
    return (
      <View style={styles.productDetails}>
        <View style={styles.productHeader}>
          <Text style={styles.productTitle}>{productData.name}</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('ProductForm', { 
              sku, 
              editing: true,
              productData 
            })}
          >
            <Ionicons name="pencil" size={16} color="#fff" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue}>{productData.category}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Brand:</Text>
          <Text style={styles.detailValue}>{productData.brand}</Text>
        </View>
        {productData.condition && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Condition:</Text>
            <Text style={styles.detailValue}>{productData.condition}</Text>
          </View>
        )}
        {productData.conditionNotes && (
          <View style={styles.notesContainer}>
            <Text style={styles.detailLabel}>Condition Notes:</Text>
            <Text style={styles.notesText}>{productData.conditionNotes}</Text>
          </View>
        )}
        <Text style={styles.timestamp}>
          Added: {new Date(productData.createdAt).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  const renderPhotoItem = ({ item }) => (
    <View style={styles.photoItem}>
      <View style={styles.photoHeader}>
        <Text style={styles.photoTitle}>{item.type}</Text>
        {item.isProcessed && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Processed</Text>
          </View>
        )}
      </View>
      <Image source={{ uri: item.uri }} style={styles.photo} resizeMode="contain" />
      <View style={styles.photoActions}>
        <TouchableOpacity style={styles.shareButton} onPress={() => sharePhoto(item)}>
          <Ionicons name="share-outline" size={22} color="#fff" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Handle adding missing photos
  const handleAddMissingPhoto = (photoType) => {
    navigation.navigate('CameraScreen', { sku, startWithAngle: photoType });
  };

  // Render generic missing photo placeholder
  const renderPhotoPlaceholder = (photoType) => {
    return (
      <View style={styles.photoItem}>
        <View style={styles.photoHeader}>
          <Text style={styles.photoTitle}>{photoType}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Missing</Text>
          </View>
        </View>
        <View style={styles.placeholderContainer}>
          <Ionicons name="image-outline" size={80} color="#ccc" />
          <Text style={styles.placeholderText}>{photoType} photo not available</Text>
          <TouchableOpacity 
            style={styles.captureButton}
            onPress={() => handleAddMissingPhoto(photoType)}
          >
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={styles.actionButtonText}>Capture {photoType} Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </SafeAreaView>
    );
  }

  if (generatingPdf) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Generating PDF report...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Photos for SKU: {sku}</Text>
            <TouchableOpacity 
              style={styles.pdfButton}
              onPress={generatePdf}
            >
              <Ionicons name="document-text" size={18} color="#fff" />
              <Text style={styles.pdfButtonText}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderProductDetails()}

        {/* Check for missing photos and add placeholders */}
        {photos.length > 0 && (
          <View style={styles.photoList}>
            {/* Display existing photos */}
            {photos.map(photo => (
              <View key={photo.name}>
                {renderPhotoItem({item: photo})}
              </View>
            ))}
            
            {/* Check for missing standard photos and add placeholders */}
            {['Front', 'Back', 'Bottom', 'Left Side', 'Right Side', 'Interior'].map(photoType => {
              // Check if this photo type is missing
              const hasPhoto = photos.some(photo => photo.type === photoType);
              if (!hasPhoto) {
                // Render placeholder for this missing photo type
                return (
                  <View key={`missing-${photoType}`}>
                    {renderPhotoPlaceholder(photoType)}
                  </View>
                );
              }
              return null;
            })}
          </View>
        )}

        {photos.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No photos found for this SKU</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('CameraScreen', { sku })}
            >
              <Ionicons name="camera" size={22} color="#fff" />
              <Text style={styles.actionButtonText}>Add Photos</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  photoList: {
    padding: 16,
  },
  photoItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  photoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  badge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  badgeText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
  },
  photo: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  shareText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  pdfButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 14,
  },
  productDetails: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  editButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 14,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  notesContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 16,
    textAlign: 'right',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 14,
  },
  placeholderContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  placeholderText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#666',
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
}); 