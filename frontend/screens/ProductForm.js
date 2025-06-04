import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import * as FileSystem from 'expo-file-system';

// Product categories
const CATEGORIES = [
  'Shoulder Bag',
  'Tote Bag',
  'Handbag',
  'Duffel Bag',
  'Wallet',
  'Jewelry',
  'Bracelets',
  'Watches',
  'Accessories',
  'Other'
];

// Luxury brands
const BRANDS = [
  'Louis Vuitton',
  'Gucci',
  'Chanel',
  'Prada',
  'YSL',
  'Fendi',
  'Dior',
  'Hermes',
  'Balenciaga',
  'Burberry',
  'Celine',
  'Valentino',
  'Bottega Veneta',
  'Other'
];

// Condition options
const CONDITIONS = [
  'New',
  'Like New',
  'Very Good',
  'Good',
  'Fair',
  'Poor'
];

// Simple custom picker component since @react-native-picker/picker was causing issues
function CustomPicker({ value, onValueChange, items, placeholder }) {
  const [showOptions, setShowOptions] = useState(false);
  
  return (
    <View style={styles.customPickerContainer}>
      <TouchableOpacity 
        style={styles.pickerButton}
        onPress={() => setShowOptions(!showOptions)}
      >
        <Text style={value ? styles.pickerValue : styles.pickerPlaceholder}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>
      
      {showOptions && (
        <View style={styles.optionsContainer}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionItem,
                value === item && styles.selectedOption
              ]}
              onPress={() => {
                onValueChange(item);
                setShowOptions(false);
              }}
            >
              <Text style={[
                styles.optionText,
                value === item && styles.selectedOptionText
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ProductForm({ navigation, route }) {
  const [formData, setFormData] = useState({
    category: '',
    brand: '',
    name: '',
    condition: '',
    conditionNotes: '',
    sku: '',
  });
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form with route params
  useEffect(() => {
    if (route.params) {
      if (route.params.sku) {
        setFormData(prev => ({ ...prev, sku: route.params.sku }));
      }

      // If editing existing product data
      if (route.params.editing && route.params.productData) {
        setFormData(route.params.productData);
        setIsEditing(true);
      }
    }
  }, [route.params]);

  // Update field and clear its error
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Validation function
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    // Required fields
    if (!formData.category) {
      newErrors.category = 'Category is required';
      isValid = false;
    }
    
    if (!formData.brand) {
      newErrors.brand = 'Brand is required';
      isValid = false;
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }
    
    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
      isValid = false;
    } else {
      // Check for SKU format - alphanumeric only
      if (!/^[a-zA-Z0-9-_]+$/.test(formData.sku)) {
        newErrors.sku = 'SKU must contain only letters, numbers, hyphens, and underscores';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Check if SKU exists already
  const checkSkuExists = async (sku) => {
    try {
      const skuDirectory = `${FileSystem.documentDirectory}${sku}/`;
      const dirInfo = await FileSystem.getInfoAsync(skuDirectory);
      return dirInfo.exists;
    } catch (error) {
      console.error('Error checking SKU:', error);
      return false;
    }
  };

  // Save product data
  const saveProductData = async () => {
    try {
      const metadataDir = `${FileSystem.documentDirectory}metadata/`;
      const dirInfo = await FileSystem.getInfoAsync(metadataDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(metadataDir, { intermediates: true });
      }
      
      // Save product metadata as JSON
      const filePath = `${metadataDir}${formData.sku}.json`;
      const timestamp = new Date().toISOString();
      const dataToSave = {
        ...formData,
        updatedAt: timestamp
      };
      
      // Add createdAt timestamp if it's a new entry
      if (!isEditing || !formData.createdAt) {
        dataToSave.createdAt = timestamp;
      }
      
      await FileSystem.writeAsStringAsync(
        filePath, 
        JSON.stringify(dataToSave, null, 2)
      );
      
      return true;
    } catch (error) {
      console.error('Error saving product metadata:', error);
      Alert.alert('Error', 'Failed to save product data');
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    if (isEditing) {
      // Just update the data and return
      if (await saveProductData()) {
        Alert.alert('Success', 'Product details updated successfully');
        navigation.goBack();
      }
    } else {
      // Check if SKU already exists
      const exists = await checkSkuExists(formData.sku);
      if (exists) {
        Alert.alert(
          'SKU Already Exists',
          'This SKU already has photos. Do you want to continue and overwrite?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Continue',
              onPress: async () => {
                if (await saveProductData()) {
                  navigation.navigate('Camera', { sku: formData.sku });
                }
              }
            }
          ]
        );
      } else {
        if (await saveProductData()) {
          navigation.navigate('Camera', { sku: formData.sku });
        }
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {isEditing ? 'Edit Product Details' : 'Product Details'}
          </Text>
          
          {/* SKU - Required but disabled when editing */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>SKU <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[
                styles.input, 
                errors.sku && styles.inputError,
                isEditing && styles.disabledInput
              ]}
              value={formData.sku}
              onChangeText={(value) => updateField('sku', value)}
              placeholder="Enter product SKU"
              autoCapitalize="characters"
              editable={!isEditing}
            />
            {errors.sku && <Text style={styles.errorText}>{errors.sku}</Text>}
          </View>

          {/* Category - Required */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
            <CustomPicker
              value={formData.category}
              onValueChange={(value) => updateField('category', value)}
              items={CATEGORIES}
              placeholder="Select a category..."
            />
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* Brand - Required */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Brand <Text style={styles.required}>*</Text></Text>
            <CustomPicker
              value={formData.brand}
              onValueChange={(value) => updateField('brand', value)}
              items={BRANDS}
              placeholder="Select a brand..."
            />
            {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
          </View>

          {/* Product Name - Required */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder="Enter product name"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Condition - Optional */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Condition</Text>
            <CustomPicker
              value={formData.condition}
              onValueChange={(value) => updateField('condition', value)}
              items={CONDITIONS}
              placeholder="Select condition (optional)..."
            />
          </View>

          {/* Condition Notes - Optional */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Condition Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.conditionNotes}
              onChangeText={(value) => updateField('conditionNotes', value)}
              placeholder="Enter condition details (optional)"
              multiline={true}
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>
              {isEditing ? 'Save Changes' : 'Next: Take Photos'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  required: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  customPickerContainer: {
    position: 'relative',
    zIndex: 1,
    marginBottom: 10,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  pickerValue: {
    fontSize: 16,
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  optionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#e6f2ff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    fontWeight: '600',
    color: '#2196F3',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#888',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 