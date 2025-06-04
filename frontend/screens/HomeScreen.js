import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
  Image
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { BRAND, APP_STYLES } from '../constants/BrandingConstants';

export default function HomeScreen({ navigation, route }) {
  const [sku, setSku] = useState('');
  const [savedSkus, setSavedSkus] = useState([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [skuDetails, setSkuDetails] = useState({});
  
  // Load saved SKUs on component mount
  useEffect(() => {
    loadSavedSkus();
  }, []);

  // Check for success parameter when returning from camera screen
  useEffect(() => {
    if (route.params?.success) {
      Alert.alert(
        "Success", 
        "All photos have been saved successfully!",
        [{ text: "OK" }]
      );
      loadSavedSkus();
    }
  }, [route.params?.success]);

  const loadSavedSkus = async () => {
    try {
      const fileInfo = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      // Filter out non-directory items and system files
      const directories = fileInfo.filter(item => !item.includes('.'));
      setSavedSkus(directories);
      
      // Load metadata for each SKU
      await loadSkuMetadata(directories);
    } catch (error) {
      console.error("Error loading saved SKUs:", error);
    }
  };
  
  const loadSkuMetadata = async (skuList) => {
    const details = {};
    
    for (const sku of skuList) {
      try {
        const metadataPath = `${FileSystem.documentDirectory}metadata/${sku}.json`;
        const metadataInfo = await FileSystem.getInfoAsync(metadataPath);
        
        if (metadataInfo.exists) {
          const dataString = await FileSystem.readAsStringAsync(metadataPath);
          details[sku] = JSON.parse(dataString);
        }
      } catch (error) {
        console.error(`Error loading metadata for SKU ${sku}:`, error);
      }
    }
    
    setSkuDetails(details);
  };

  const handleStartPress = () => {
    if (sku.trim()) {
      navigation.navigate('ProductForm', { sku: sku.trim() });
    } else {
      Alert.alert("Error", "Please enter a SKU number");
    }
  };

  const handleViewPhotos = (selectedSku) => {
    navigation.navigate('PhotosView', { sku: selectedSku });
  };

  const handleExportData = () => {
    navigation.navigate('ExportData');
  };

  const renderSavedSku = ({ item }) => {
    const details = skuDetails[item] || null;
    
    return (
      <TouchableOpacity
        style={styles.skuItem}
        onPress={() => handleViewPhotos(item)}
      >
        <View style={styles.skuItemContent}>
          <Text style={styles.skuItemText}>{item}</Text>
          {details && (
            <View style={styles.skuDetails}>
              {details.name && <Text style={styles.skuDetailName}>{details.name}</Text>}
              {details.brand && <Text style={styles.skuDetailText}>{details.brand}</Text>}
              {details.category && <Text style={styles.skuDetailText}>{details.category}</Text>}
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={BRAND.TEXT_LIGHT} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          {/* Logo section */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/icon.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.title}>{BRAND.APP_NAME}</Text>
          <Text style={styles.subtitle}>Enter SKU to start capturing</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Product SKU</Text>
            <TextInput
              style={styles.input}
              value={sku}
              onChangeText={setSku}
              placeholder="Enter SKU number"
              placeholderTextColor={BRAND.TEXT_LIGHT}
              autoCapitalize="characters"
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.button, !sku.trim() && styles.buttonDisabled]} 
            onPress={handleStartPress}
            disabled={!sku.trim()}
          >
            <Text style={styles.buttonText}>Start Photography</Text>
          </TouchableOpacity>

          <View style={styles.actionsContainer}>
            {savedSkus.length > 0 && (
              <TouchableOpacity 
                style={styles.savedButton}
                onPress={() => setShowSavedModal(true)}
              >
                <Ionicons name="images-outline" size={18} color={BRAND.PRIMARY_COLOR} />
                <Text style={styles.savedButtonText}>View Saved ({savedSkus.length})</Text>
              </TouchableOpacity>
            )}

            {savedSkus.length > 0 && (
              <TouchableOpacity 
                style={styles.exportButton}
                onPress={handleExportData}
              >
                <Ionicons name="document-text-outline" size={18} color={BRAND.SECONDARY_COLOR} />
                <Text style={styles.exportButtonText}>Export Data</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>{BRAND.COPYRIGHT_TEXT}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal for saved SKUs */}
      <Modal
        visible={showSavedModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSavedModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Saved SKUs</Text>
            <FlatList
              data={savedSkus}
              keyExtractor={item => item}
              renderItem={renderSavedSku}
              style={styles.skuList}
            />
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowSavedModal(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.BACKGROUND_LIGHT,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: BRAND.TEXT_DARK,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: BRAND.TEXT_MEDIUM,
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: BRAND.TEXT_DARK,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: APP_STYLES.BORDER_RADIUS,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: BRAND.PRIMARY_COLOR,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: APP_STYLES.BORDER_RADIUS,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%',
  },
  savedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: APP_STYLES.BORDER_RADIUS,
    borderWidth: 1,
    borderColor: BRAND.PRIMARY_COLOR,
    marginHorizontal: 5,
  },
  savedButtonText: {
    color: BRAND.PRIMARY_COLOR,
    fontWeight: '600',
    marginLeft: 6,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: APP_STYLES.BORDER_RADIUS,
    borderWidth: 1,
    borderColor: BRAND.SECONDARY_COLOR,
    marginHorizontal: 5,
  },
  exportButtonText: {
    color: BRAND.SECONDARY_COLOR,
    fontWeight: '600',
    marginLeft: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: BRAND.BACKGROUND_LIGHT,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    ...APP_STYLES.SHADOW,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: BRAND.TEXT_DARK,
  },
  skuList: {
    marginBottom: 20,
  },
  skuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  skuItemContent: {
    flex: 1,
  },
  skuDetails: {
    marginTop: 4,
  },
  skuDetailName: {
    fontSize: 14,
    color: BRAND.TEXT_DARK,
    fontWeight: '500',
  },
  skuDetailText: {
    fontSize: 12,
    color: BRAND.TEXT_MEDIUM,
  },
  skuItemText: {
    fontSize: 16,
    color: BRAND.TEXT_DARK,
  },
  closeButton: {
    backgroundColor: BRAND.PRIMARY_COLOR,
    paddingVertical: 12,
    borderRadius: APP_STYLES.BORDER_RADIUS,
    alignItems: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 10,
  },
  footerText: {
    fontSize: 12,
    color: BRAND.TEXT_LIGHT,
    textAlign: 'center',
  },
}); 