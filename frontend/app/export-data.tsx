import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ExportData() {
  const { sku } = useLocalSearchParams();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  const exportToCSV = async () => {
    if (!sku) {
      Alert.alert('Error', 'No SKU provided');
      return;
    }

    try {
      setExporting(true);

      // In a real app, you would fetch product data from storage
      // and generate a proper CSV file with all products
      
      // For this example, we'll just create a simple CSV with the SKU data
      const csvContent = `SKU,Category,Brand,Product Name,Condition\n${sku},Example Category,Example Brand,Example Product,New`;
      
      // Save CSV file
      const fileName = `product_data_${Date.now()}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      
      // Share the CSV file
      await Share.share({
        title: 'Product Data CSV',
        message: 'Here is the exported product data',
        url: filePath
      });
      
      setExporting(false);
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Export Failed', 'There was an error exporting the data');
      setExporting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>Export Product Data</ThemedText>
      
      <ThemedText style={styles.description}>
        Export product data for SKU: {sku}
      </ThemedText>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, exporting && styles.buttonDisabled]}
          disabled={exporting}
          onPress={exportToCSV}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <ThemedText style={styles.buttonText}>Export to CSV</ThemedText>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.secondaryButtonText}>Back to Photos</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 40,
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#90CAF9',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2196F3',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
}); 