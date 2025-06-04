import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { uploadImageAsync, createUploadFilename } from '../utils/imageUploader';

export default function ExportData({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [skus, setSkus] = useState([]);
  const [selectedSkus, setSelectedSkus] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [includeImages, setIncludeImages] = useState(false);
  const [exportType, setExportType] = useState('csv'); // 'csv', 'images', 'both'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [uploadToFirebase, setUploadToFirebase] = useState(false);
  const [currentUploadProgress, setCurrentUploadProgress] = useState(0);
  const [uploadedImageUrls, setUploadedImageUrls] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [imagesUploaded, setImagesUploaded] = useState(false);

  useEffect(() => {
    loadSkus();
  }, []);

  // Load all available SKUs
  const loadSkus = async () => {
    try {
      setLoading(true);
      
      // Get all SKUs from the document directory
      const fileInfo = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const directories = fileInfo.filter(item => !item.includes('.'));
      
      // Load metadata for each SKU
      const skusWithData = await Promise.all(
        directories.map(async (sku) => {
          try {
            const metadataPath = `${FileSystem.documentDirectory}metadata/${sku}.json`;
            const metadataInfo = await FileSystem.getInfoAsync(metadataPath);
            
            let metadata = null;
            if (metadataInfo.exists) {
              const dataString = await FileSystem.readAsStringAsync(metadataPath);
              metadata = JSON.parse(dataString);
            }
            
            // Check if photos exist
            const skuDirectory = `${FileSystem.documentDirectory}${sku}/`;
            const processingDirectory = `${skuDirectory}processed/`;
            
            const dirInfo = await FileSystem.getInfoAsync(processingDirectory);
            let photoCount = 0;
            let photos = [];
            
            if (dirInfo.exists) {
              const files = await FileSystem.readDirectoryAsync(processingDirectory);
              photos = files.filter(file => 
                file.toLowerCase().endsWith('.png') || 
                file.toLowerCase().endsWith('.jpg') || 
                file.toLowerCase().endsWith('.jpeg')
              );
              photoCount = photos.length;
            }
            
            return {
              sku,
              metadata,
              photoCount,
              photos
            };
          } catch (error) {
            console.error(`Error loading data for SKU ${sku}:`, error);
            return { sku, metadata: null, photoCount: 0, photos: [] };
          }
        })
      );
      
      // Filter out SKUs with no metadata
      const validSkus = skusWithData.filter(item => item.metadata !== null);
      
      setSkus(validSkus);
      // Initialize selection state
      const initialSelection = {};
      validSkus.forEach(item => {
        initialSelection[item.sku] = false;
      });
      setSelectedSkus(initialSelection);
    } catch (error) {
      console.error("Error loading SKUs:", error);
      Alert.alert("Error", "Failed to load product data");
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection for a single SKU
  const toggleSelect = (sku) => {
    // Reset imagesUploaded state when selection changes
    setImagesUploaded(false);
    setUploadedImageUrls({});
    setSelectedSkus(prev => ({
      ...prev,
      [sku]: !prev[sku]
    }));
  };

  // Toggle select all
  const toggleSelectAll = () => {
    // Reset imagesUploaded state when selection changes
    setImagesUploaded(false);
    setUploadedImageUrls({});
    
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    const newSelections = {};
    skus.forEach(item => {
      newSelections[item.sku] = newSelectAll;
    });
    setSelectedSkus(newSelections);
  };

  // Count selected SKUs
  const getSelectedCount = () => {
    return Object.values(selectedSkus).filter(Boolean).length;
  };

  // Generate file name with timestamp
  const generateFileName = (type = 'csv') => {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`;
    const formattedTime = `${padZero(date.getHours())}-${padZero(date.getMinutes())}`;
    return `product_export_${formattedDate}_${formattedTime}.${type}`;
  };

  // Helper to pad zero for date/time formatting
  const padZero = (num) => {
    return num.toString().padStart(2, '0');
  };

  // Convert object to CSV row
  const objectToCsvRow = (obj, headers) => {
    const row = headers.map(header => {
      const value = obj[header] || '';
      // Escape commas and quotes in the value
      const escapedValue = String(value).replace(/"/g, '""');
      return `"${escapedValue}"`;
    });
    return row.join(',');
  };

  // Upload image to Firebase and get URL
  const uploadImageToFirebase = async (imagePath, sku, photoType) => {
    try {
      setExportStatus(`Uploading ${photoType} for ${sku}...`);
      
      // Get file extension
      const extension = imagePath.split('.').pop();
      
      // Create filename for upload
      const remoteFilename = createUploadFilename(sku, photoType, extension);
      
      // Upload and get URL
      const downloadUrl = await uploadImageAsync(
        imagePath, 
        remoteFilename,
        (progress) => {
          setCurrentUploadProgress(progress);
        }
      );
      
      // Store URL for use in CSV
      setUploadedImageUrls(prev => ({
        ...prev,
        [`${sku}_${photoType}`]: downloadUrl
      }));
      
      return downloadUrl;
    } catch (error) {
      console.error(`Error uploading image for ${sku} ${photoType}:`, error);
      // Return null if upload fails
      return null;
    }
  };
  
  // Upload all images to Firebase
  const uploadAllToFirebase = async () => {
    try {
      setIsUploading(true);
      setExportProgress(0);
      setExportStatus('Preparing to upload images...');
      setCurrentUploadProgress(0);
      setUploadedImageUrls({});
      
      // Get selected SKUs
      const selectedSkuIds = Object.keys(selectedSkus).filter(sku => selectedSkus[sku]);
      
      if (selectedSkuIds.length === 0) {
        Alert.alert("Error", "Please select at least one product to upload");
        setIsUploading(false);
        return;
      }
      
      // Get selected SKU data
      const selectedSkuData = skus.filter(item => selectedSkus[item.sku]);
      
      // Collect all images that need to be uploaded
      const imagesToUpload = [];
      
      // First, gather all images that need to be uploaded
      for (const skuData of selectedSkuData) {
        const { sku, photos } = skuData;
        const processedDirectory = `${FileSystem.documentDirectory}${sku}/processed/`;
        const processedDirInfo = await FileSystem.getInfoAsync(processedDirectory);
        
        if (processedDirInfo.exists && photos.length > 0) {
          for (const photo of photos) {
            const sourcePath = `${processedDirectory}${photo}`;
            const photoType = photo.split('.')[0].replace(/_/g, ' ');
            
            imagesToUpload.push({
              sku,
              photoType,
              sourcePath
            });
          }
        }
      }
      
      // Now upload all images
      const totalImages = imagesToUpload.length;
      
      if (totalImages > 0) {
        setExportStatus(`Uploading 0 of ${totalImages} images...`);
        
        for (let i = 0; i < totalImages; i++) {
          const { sku, photoType, sourcePath } = imagesToUpload[i];
          
          setExportStatus(`Uploading image ${i+1} of ${totalImages}: ${sku} - ${photoType}`);
          
          try {
            await uploadImageToFirebase(sourcePath, sku, photoType);
          } catch (uploadError) {
            console.error(`Error uploading image:`, uploadError);
            // Continue with next image
          }
          
          // Update progress
          const progress = ((i + 1) / totalImages) * 100;
          setExportProgress(progress);
        }
        
        // Success!
        setImagesUploaded(true);
        setExportStatus('All images uploaded successfully!');
        
        setTimeout(() => {
          Alert.alert(
            "Upload Complete", 
            `Successfully uploaded ${totalImages} images to Firebase. You can now export with image URLs.`
          );
        }, 500);
      } else {
        Alert.alert("Warning", "No images found to upload for the selected products.");
      }
    } catch (error) {
      console.error("Error during upload:", error);
      Alert.alert("Upload Error", "Failed to upload images: " + error.message);
    } finally {
      setIsUploading(false);
      setExportProgress(0);
      setCurrentUploadProgress(0);
    }
  };

  // Generate CSV content
  const generateCsv = async () => {
    try {
      console.log("Generating CSV with standard file handling...");
      // Get selected SKUs
      const selectedSkuIds = Object.keys(selectedSkus).filter(sku => selectedSkus[sku]);
      
      if (selectedSkuIds.length === 0) {
        Alert.alert("Error", "Please select at least one product to export");
        return null;
      }
      
      // Get selected SKU data
      const selectedSkuData = skus.filter(item => selectedSkus[item.sku]);
      
      // Define CSV headers
      const metadataHeaders = [
        'sku', 'name', 'brand', 'category', 'condition', 'conditionNotes', 
        'createdAt', 'updatedAt'
      ];
      
      // Image headers - we'll include image file names or URLs
      const imageHeaders = includeImages ? [
        'frontImage', 'backImage', 'bottomImage', 'leftSideImage', 
        'rightSideImage', 'interiorImage'
      ] : [];
      
      const headers = [...metadataHeaders, ...imageHeaders];
      
      // Create CSV header row
      let csvContent = headers.join(',') + '\n';
      
      // Process each selected SKU
      for (const skuData of selectedSkuData) {
        const { sku, metadata } = skuData;
        
        // Create a data object with metadata
        const rowData = {
          ...metadata
        };
        
        // Add image paths if includeImages is true
        if (includeImages) {
          // Standardized approach - use same file conventions as in camera and photos view
          const standardPhotos = [
            { angle: 'front', header: 'frontImage', file: 'front.png' },
            { angle: 'back', header: 'backImage', file: 'back.png' },
            { angle: 'bottom', header: 'bottomImage', file: 'bottom.png' },
            { angle: 'leftside', header: 'leftSideImage', file: 'leftside.png' },
            { angle: 'rightside', header: 'rightSideImage', file: 'rightside.png' },
            { angle: 'interior', header: 'interiorImage', file: 'interior.png' }
          ];
          
          // Get file paths
          const skuDirectory = `${FileSystem.documentDirectory}${sku}/`;
          const processedDirectory = `${skuDirectory}processed/`;
          
          console.log(`Processing SKU: ${sku} for CSV export...`);
          
          // Check each standard photo
          for (const photo of standardPhotos) {
            const processedPath = `${processedDirectory}${photo.file}`;
            const processedInfo = await FileSystem.getInfoAsync(processedPath);
            
            console.log(`Checking ${photo.angle} photo: ${processedPath} - exists: ${processedInfo.exists}`);
            
            if (processedInfo.exists) {
              // If images were uploaded to Firebase, use the URL
              if (imagesUploaded) {
                const urlKey = `${sku}_${photo.angle}`;
                rowData[photo.header] = uploadedImageUrls[urlKey] || '';
              } else {
                // Otherwise use local filename with SKU prefix
                rowData[photo.header] = `${sku}_${photo.file}`;
              }
            } else {
              rowData[photo.header] = '';
            }
          }
        }
        
        // Add row to CSV
        csvContent += objectToCsvRow(rowData, headers) + '\n';
      }
      
      return csvContent;
    } catch (error) {
      console.error("Error generating CSV:", error);
      throw error;
    }
  };

  // Main export function that handles export without uploading
  const handleExport = async () => {
    try {
      setExporting(true);
      setExportProgress(0);
      setExportStatus('Preparing export...');
      
      // Get selected SKUs
      const selectedSkuIds = Object.keys(selectedSkus).filter(sku => selectedSkus[sku]);
      
      if (selectedSkuIds.length === 0) {
        Alert.alert("Error", "Please select at least one product to export");
        setExporting(false);
        return;
      }
      
      // Get selected SKU data
      const selectedSkuData = skus.filter(item => selectedSkus[item.sku]);
      
      // Create export directory - use FileSystem.cacheDirectory for better sharing support
      const timestamp = new Date().getTime();
      const exportDir = `${FileSystem.cacheDirectory}exports_${timestamp}/`;
      
      try {
        const dirInfo = await FileSystem.getInfoAsync(exportDir);
        
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
        }
      } catch (dirError) {
        console.error("Error creating directory:", dirError);
        Alert.alert("Error", "Failed to create export directory. Please try again.");
        setExporting(false);
        return;
      }
      
      // Main output file path that we'll share at the end
      let outputFilePath = null;
      
      // Export CSV if needed
      let csvContent = null;
      if (exportType === 'csv' || exportType === 'both') {
        setExportStatus('Generating CSV file...');
        
        try {
          csvContent = await generateCsv();
          
          if (csvContent) {
            const csvPath = `${exportDir}product_data.csv`;
            await FileSystem.writeAsStringAsync(csvPath, csvContent);
            setExportStatus('CSV file created successfully');
            
            // If only exporting CSV, this is what we'll share
            if (exportType === 'csv') {
              outputFilePath = csvPath;
            }
          }
        } catch (csvError) {
          console.error("CSV generation error:", csvError);
          Alert.alert("Warning", "There was an issue generating the CSV file.");
          // Continue with image export if applicable
        }
      }
      
      // Export images for local gallery if needed
      if (exportType === 'images' || exportType === 'both') {
        setExportStatus('Creating image gallery...');
        try {
          const imagesDir = `${exportDir}images/`;
          const imgDirInfo = await FileSystem.getInfoAsync(imagesDir);
          
          if (!imgDirInfo.exists) {
            await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
          }
          
          // Create an HTML index file
          const htmlPath = `${exportDir}index.html`;
          let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Product Images</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; }
                h1 { color: #2196F3; }
                h2 { color: #333; margin-top: 30px; padding-bottom: 10px; border-bottom: 1px solid #ddd; }
                .sku-container { margin-bottom: 40px; }
                .image-grid { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px; }
                .image-card { width: 200px; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
                .image-card img { width: 100%; height: 180px; object-fit: contain; }
                .image-title { padding: 10px; text-align: center; font-weight: bold; }
                .firebase-link { padding: 10px; text-align: center; font-size: 12px; }
                .firebase-link a { color: #2196F3; text-decoration: none; }
                .firebase-link a:hover { text-decoration: underline; }
              </style>
            </head>
            <body>
              <h1>Product Image Export</h1>
          `;
          
          const totalSkus = selectedSkuData.length;
          let processedSkus = 0;
          let imagesCopied = 0;
          
          // Process each selected SKU
          for (const skuData of selectedSkuData) {
            const { sku, metadata, photos } = skuData;
            const processedDirectory = `${FileSystem.documentDirectory}${sku}/processed/`;
            const processedDirInfo = await FileSystem.getInfoAsync(processedDirectory);
            
            setExportStatus(`Adding images for ${sku} to gallery...`);
            
            if (processedDirInfo.exists && photos.length > 0) {
              // Create SKU section in HTML
              htmlContent += `
                <div class="sku-container">
                  <h2>${sku}${metadata && metadata.name ? ` - ${metadata.name}` : ''}</h2>
                  <div class="image-grid">
              `;
              
              // Copy each photo to the export directory and add to HTML
              for (const photo of photos) {
                try {
                  const sourcePath = `${processedDirectory}${photo}`;
                  const destPath = `${imagesDir}${sku}_${photo}`;
                  
                  await FileSystem.copyAsync({
                    from: sourcePath,
                    to: destPath
                  });
                  
                  imagesCopied++;
                  
                  // Add to HTML - if we uploaded to Firebase, include those URLs
                  const photoType = photo.split('.')[0].replace(/_/g, ' ');
                  const urlKey = `${sku}_${photoType}`;
                  
                  htmlContent += `
                    <div class="image-card">
                      <img src="images/${sku}_${photo}" alt="${photoType}">
                      <div class="image-title">${photoType}</div>
                      ${imagesUploaded && uploadedImageUrls[urlKey] ? 
                        `<div class="firebase-link">
                          <a href="${uploadedImageUrls[urlKey]}" target="_blank">View Online</a>
                        </div>` : ''}
                    </div>
                  `;
                } catch (copyError) {
                  console.error(`Error copying image ${photo}:`, copyError);
                  // Continue with other images
                }
              }
              
              htmlContent += `
                  </div>
                </div>
              `;
            }
            
            processedSkus++;
            setExportProgress((processedSkus / totalSkus) * 100);
          }
          
          // Close HTML
          htmlContent += `
              <div style="margin-top: 40px; text-align: center; color: #666; font-size: 14px;">
                Exported ${imagesCopied} images from ${processedSkus} products on ${new Date().toLocaleString()}
                ${imagesUploaded ? '<br><strong>Images also uploaded to Firebase Storage</strong>' : ''}
              </div>
            </body>
            </html>
          `;
          
          // Save HTML index
          await FileSystem.writeAsStringAsync(htmlPath, htmlContent);
          setExportStatus('Image gallery created successfully');
          
          // Set this as our output file for sharing
          outputFilePath = htmlPath;
        } catch (imageError) {
          console.error("Image export error:", imageError);
          Alert.alert("Warning", "There was an issue exporting the images.");
        }
      }
      
      // Create README.txt
      try {
        const readmeContent = `
Product Export
=============
Created: ${new Date().toLocaleString()}
Products: ${selectedSkuData.length}

Contents:
${exportType === 'csv' || exportType === 'both' ? '- product_data.csv: Contains metadata for all products' : ''}
${exportType === 'images' || exportType === 'both' ? '- images/: Directory containing all product images\n- index.html: Visual gallery of all exported products' : ''}

File naming convention for images:
SKU_ANGLE.png (e.g., LV12345_front.png)

${imagesUploaded ? 'Images have been uploaded to Firebase Storage and URLs are included in the CSV file and HTML gallery.' : ''}
        `;
        
        await FileSystem.writeAsStringAsync(`${exportDir}README.txt`, readmeContent);
      } catch (readmeError) {
        console.error("Error creating README:", readmeError);
        // Continue, this is not critical
      }
      
      // Share the export 
      if (outputFilePath) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(outputFilePath);
          
          if (fileInfo.exists) {
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(outputFilePath, {
                UTI: exportType === 'csv' ? 'public.comma-separated-values-text' : 'public.html',
                mimeType: exportType === 'csv' ? 'text/csv' : 'text/html'
              });
            } else {
              Alert.alert(
                "Export Complete", 
                `Files saved to: ${exportDir}`,
                [{ text: "OK" }]
              );
            }
          } else {
            throw new Error("Output file doesn't exist");
          }
        } catch (shareError) {
          console.error("Sharing error:", shareError);
          Alert.alert(
            "Sharing Failed",
            "Could not share the exported files. They have been saved to your device at: " + exportDir,
            [{ text: "OK" }]
          );
        }
      } else {
        Alert.alert(
          "Export Warning", 
          "The export completed but no files were available to share. Please try a different export option.",
          [{ text: "OK" }]
        );
      }
      
      // Final success message
      Alert.alert(
        "Export Complete", 
        `Successfully exported data for ${selectedSkuData.length} products${imagesUploaded ? ' with Firebase image URLs' : ''}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error during export:", error);
      Alert.alert("Export Error", "Failed to export data: " + error.message);
    } finally {
      setExporting(false);
      setExportProgress(0);
      setExportStatus('');
      setCurrentUploadProgress(0);
    }
  };

  // Render a single SKU item
  const renderSkuItem = ({ item }) => {
    const isSelected = selectedSkus[item.sku] || false;
    
    return (
      <TouchableOpacity
        style={[styles.skuItem, isSelected && styles.selectedItem]}
        onPress={() => toggleSelect(item.sku)}
      >
        <View style={styles.skuDetails}>
          <Text style={styles.skuText}>{item.sku}</Text>
          {item.metadata && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataText}>
                {item.metadata.name} 
                {item.metadata.brand ? ` • ${item.metadata.brand}` : ''}
                {item.metadata.category ? ` • ${item.metadata.category}` : ''}
              </Text>
            </View>
          )}
          <Text style={styles.photoCount}>
            {item.photoCount} {item.photoCount === 1 ? 'photo' : 'photos'}
          </Text>
        </View>
        <View style={styles.checkboxContainer}>
          <View style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected
          ]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (exporting || isUploading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>
            {isUploading ? 'Uploading to Web...' : 'Exporting data...'}
          </Text>
          {exportStatus && <Text style={styles.statusText}>{exportStatus}</Text>}
          
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Progress:</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${exportProgress}%`,
                    backgroundColor: isUploading ? '#4CAF50' : '#2196F3'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(exportProgress)}%</Text>
          </View>
          
          {(currentUploadProgress > 0) && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Current File:</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${currentUploadProgress}%`, backgroundColor: '#4CAF50' }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{Math.round(currentUploadProgress)}%</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Export Product Data</Text>
        <Text style={styles.subtitle}>
          Select products to export
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Select All ({skus.length})</Text>
          <Switch
            value={selectAll}
            onValueChange={toggleSelectAll}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={selectAll ? "#2196F3" : "#f4f3f4"}
          />
        </View>
        
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Export Type</Text>
          <View style={styles.segmentControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                exportType === 'csv' && styles.segmentButtonActive,
                { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }
              ]}
              onPress={() => setExportType('csv')}
            >
              <Text 
                style={[
                  styles.segmentButtonText,
                  exportType === 'csv' && styles.segmentButtonTextActive
                ]}
              >
                CSV Only
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                exportType === 'images' && styles.segmentButtonActive,
              ]}
              onPress={() => setExportType('images')}
            >
              <Text 
                style={[
                  styles.segmentButtonText,
                  exportType === 'images' && styles.segmentButtonTextActive
                ]}
              >
                Images Only
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                exportType === 'both' && styles.segmentButtonActive,
                { borderTopRightRadius: 6, borderBottomRightRadius: 6 }
              ]}
              onPress={() => setExportType('both')}
            >
              <Text 
                style={[
                  styles.segmentButtonText,
                  exportType === 'both' && styles.segmentButtonTextActive
                ]}
              >
                Both
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {(exportType === 'csv' || exportType === 'both') && (
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Include Image Paths in CSV</Text>
            <Switch
              value={includeImages}
              onValueChange={setIncludeImages}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={includeImages ? "#2196F3" : "#f4f3f4"}
            />
          </View>
        )}
        
        {imagesUploaded && (
          <View style={styles.successNotice}>
            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" style={styles.successIcon} />
            <Text style={styles.successText}>
              Images uploaded to Firebase - URL links ready!
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={skus}
        keyExtractor={item => item.sku}
        renderItem={renderSkuItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <Text style={styles.selectionCount}>
          {getSelectedCount()} of {skus.length} selected
        </Text>
        
        <View style={styles.buttonRow}>
          {includeImages && !imagesUploaded && getSelectedCount() > 0 && (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={uploadAllToFirebase}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload to Web</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.exportButton,
              getSelectedCount() === 0 && styles.exportButtonDisabled
            ]}
            onPress={handleExport}
            disabled={getSelectedCount() === 0}
          >
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.exportButtonText}>
              Export {exportType === 'csv' ? 'CSV' : exportType === 'images' ? 'Images' : 'Data'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  statusText: {
    marginTop: 15,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  progressContainer: {
    width: '80%',
    marginTop: 20,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  optionsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
  },
  segmentControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 6,
  },
  segmentButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  segmentButtonActive: {
    backgroundColor: '#2196F3',
  },
  segmentButtonText: {
    fontSize: 14,
    color: '#2196F3',
  },
  segmentButtonTextActive: {
    color: 'white',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 15,
  },
  skuItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedItem: {
    backgroundColor: '#e6f2ff',
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  skuDetails: {
    flex: 1,
  },
  skuText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  metadataRow: {
    marginBottom: 5,
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
  },
  photoCount: {
    fontSize: 12,
    color: '#888',
  },
  checkboxContainer: {
    justifyContent: 'center',
    paddingLeft: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  checkboxSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  selectionCount: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  uploadButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  exportButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  exportButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  successNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  successIcon: {
    marginRight: 6,
  },
  successText: {
    fontSize: 14,
    color: '#2E7D32',
    flex: 1,
  },
}); 