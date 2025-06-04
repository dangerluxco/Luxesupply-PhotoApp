# Customizing Branding for the Photography App

This guide will help you customize the Photography App with your own branding, including logos, colors, and other brand assets.

## 1. Update Brand Colors and Information

Open the file `constants/BrandingConstants.js` and modify the following:

```javascript
export const BRAND = {
  // Main colors
  PRIMARY_COLOR: '#2196F3',    // Replace with your brand primary color
  SECONDARY_COLOR: '#4CAF50',  // Replace with your brand secondary color
  ACCENT_COLOR: '#FF9800',     // Replace with your brand accent color
  
  // Company info
  COMPANY_NAME: 'Your Company Name',
  COPYRIGHT_TEXT: '© 2023 Your Company Name',
  
  // App info
  APP_NAME: 'Photography App',
  APP_VERSION: '1.0.0',
};
```

Change these values to match your brand colors and information.

## 2. Replace Logo and Icon Assets

You need to replace several image files in the `assets/images` directory:

1. **App Icon**: Replace `icon.png` (1024x1024px)
2. **Adaptive Icon**: Replace `adaptive-icon.png` (1024x1024px)
3. **Splash Screen Icon**: Replace `splash-icon.png` (200x200px)
4. **Favicon**: Replace `favicon.png` (48x48px)

### Image Size Requirements

| Image | Recommended Size | Purpose |
|-------|------------------|---------|
| icon.png | 1024x1024px | Main app icon |
| adaptive-icon.png | 1024x1024px | Android adaptive icon |
| splash-icon.png | 200x200px or larger | Splash screen icon |
| favicon.png | 48x48px | Web favicon |

## 3. Update App Configuration (Optional)

If you want to change the app name, bundle identifier, or other app configuration, edit the `app.json` file:

```json
{
  "expo": {
    "name": "Your Brand Name",
    "slug": "yourbrandapp",
    "version": "1.0.0",
    // ...other settings
    "ios": {
      "bundleIdentifier": "com.yourbrand.photographyapp",
      // ...
    },
    "android": {
      "package": "com.yourbrand.photographyapp",
      // ...
    }
  }
}
```

## 4. Customize the Header (Optional)

To use the custom header with your logo, open `App.js` and uncomment the headerTitle lines:

```javascript
options={{ 
  title: 'Product Details',
  headerTitle: () => <LogoHeader />,
}}
```

This will show your logo in the app header instead of just text.

## 5. Additional Customization

### Splash Screen

To customize the splash screen further, edit the `app.json` file:

```json
"plugins": [
  [
    "expo-splash-screen",
    {
      "image": "./assets/images/splash-icon.png",
      "imageWidth": 200,
      "resizeMode": "contain",
      "backgroundColor": "#your-brand-color-here"
    }
  ],
  // other plugins
]
```

### Custom Fonts

To add custom fonts to match your brand:

1. Add font files to `assets/fonts/`
2. Update `app.json` to include your fonts
3. Use them in your styles

## 6. Testing Your Branding

After making all changes, restart the development server to see your branding applied:

```bash
npm start
# or
expo start
```

## 7. Building Your Branded App

When you're ready to build your branded app:

```bash
expo build:android
expo build:ios
```

This will create installable app files with your custom branding. 