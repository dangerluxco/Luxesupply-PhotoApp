import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Product categories
const CATEGORIES = [
  'Shoulder Bag',
  'Tote',
  'Crossbody',
  'Backpack',
  'Clutch',
  'Wallet',
  'Accessories',
  'Other'
];

// Brands
const BRANDS = [
  'Louis Vuitton',
  'Gucci',
  'Chanel',
  'Prada',
  'Hermès',
  'Dior',
  'Burberry',
  'Fendi',
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

export default function ProductForm() {
  const { sku } = useLocalSearchParams();
  const router = useRouter();

  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [productName, setProductName] = useState('');
  const [condition, setCondition] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');

  const handleNext = () => {
    if (!category || !brand || !productName || !condition) {
      alert('Please fill out all required fields');
      return;
    }

    // Store the product metadata
    const productData = {
      sku,
      category,
      brand,
      productName,
      condition,
      conditionNotes,
    };

    // Navigate to the camera screen with product data
    router.push({
      pathname: '/(camera)',
      params: {
        sku,
        productData: JSON.stringify(productData)
      }
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ThemedText type="subtitle" style={styles.title}>Product Details</ThemedText>
        <ThemedText style={styles.skuText}>SKU: {sku}</ThemedText>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Category *</ThemedText>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={(itemValue: string) => setCategory(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select a category" value="" />
              {CATEGORIES.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Brand *</ThemedText>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={brand}
              onValueChange={(itemValue: string) => setBrand(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select a brand" value="" />
              {BRANDS.map((b) => (
                <Picker.Item key={b} label={b} value={b} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Product Name *</ThemedText>
          <TextInput
            style={styles.input}
            value={productName}
            onChangeText={setProductName}
            placeholder="Enter product name"
          />
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Condition *</ThemedText>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={condition}
              onValueChange={(itemValue: string) => setCondition(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select condition" value="" />
              {CONDITIONS.map((cond) => (
                <Picker.Item key={cond} label={cond} value={cond} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <ThemedText style={styles.label}>Condition Notes</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={conditionNotes}
            onChangeText={setConditionNotes}
            placeholder="Enter any notes about the product's condition"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <ThemedText style={styles.buttonText}>Proceed to Photography</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  skuText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 