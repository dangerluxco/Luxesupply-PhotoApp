import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Image, Text, View, StyleSheet } from 'react-native';
import { BRAND, APP_STYLES } from './constants/BrandingConstants';

// Import screens
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import PhotosView from './screens/PhotosView';
import ProductForm from './screens/ProductForm';
import ExportData from './screens/ExportData';

const Stack = createNativeStackNavigator();

// Custom header component with logo
const LogoHeader = () => (
  <View style={styles.headerContainer}>
    <Image 
      source={require('./assets/images/icon.png')} 
      style={styles.headerLogo} 
      resizeMode="contain"
    />
    <Text style={styles.headerTitle}>{BRAND.APP_NAME}</Text>
  </View>
);

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: BRAND.PRIMARY_COLOR,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ 
            headerShown: false 
          }}
        />
        <Stack.Screen 
          name="ProductForm" 
          component={ProductForm} 
          options={{ 
            title: 'Product Details',
            // Optional: Use a custom header with logo
            // headerTitle: () => <LogoHeader />,
          }}
        />
        <Stack.Screen 
          name="Camera" 
          component={CameraScreen} 
          options={{ 
            title: 'Take Photos',
            // Optional: Use a custom header with logo
            // headerTitle: () => <LogoHeader />,
          }}
        />
        <Stack.Screen 
          name="PhotosView" 
          component={PhotosView} 
          options={{ 
            title: 'View Photos',
            // Optional: Use a custom header with logo
            // headerTitle: () => <LogoHeader />,
          }}
        />
        <Stack.Screen 
          name="ExportData" 
          component={ExportData} 
          options={{ 
            title: 'Export to CSV',
            // Optional: Use a custom header with logo
            // headerTitle: () => <LogoHeader />,
          }}
        />
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 