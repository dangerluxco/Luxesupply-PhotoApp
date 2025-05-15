# Photography App

## Project Overview
This mobile application helps standardize product photography for a luxury goods resale company by guiding users through capturing different angles and removing backgrounds.

## Key Features
- SKU-based organization of product photos
- Product metadata collection (category, brand, name, condition)
- Guided camera interface for consistent photo angles
- Background removal processing
- CSV data export

## Important: Project Structure
This project has a nested directory structure that **MUST** be respected to ensure proper operation:

```
Photography App/ (Root folder)
├── App.js               # Root entry point - DO NOT MODIFY
├── start.sh             # Launch script - ALWAYS use this to start the app
└── PhotographyApp/      # First-level project directory
    ├── App.js           # Router entry point - DO NOT MODIFY
    ├── app/             # Contains Expo Router screens
    └── photographyapp/  # MAIN CODE DIRECTORY - Make changes here
        ├── App.js       # Main App component
        ├── screens/     # Screen components
        ├── components/  # Reusable UI components
        └── ...
```

## ⚠️ CRITICAL: How to Run the App

1. **ALWAYS** use the start script from the project root:
   ```
   ./start.sh
   ```

2. **NEVER** try to run from any other directory or with any other command.

3. If the script is not executable, run:
   ```
   chmod +x start.sh
   ```

## ⚠️ IMPORTANT: Things to NEVER Do

1. **DO NOT** delete or modify:
   - Root `App.js`
   - `PhotographyApp/App.js`
   - `start.sh`

2. **DO NOT** try to start the app with:
   - `npm start`
   - `expo start`
   - `npx expo start`
   - Any other command except `./start.sh`

3. **DO NOT** change the directory structure or move files between:
   - Root directory
   - PhotographyApp directory
   - photographyapp directory

## Development Guidelines

1. **ALWAYS** make code changes in the `PhotographyApp/photographyapp` directory
2. New screens should go in `PhotographyApp/photographyapp/screens`
3. New components should go in `PhotographyApp/photographyapp/components`
4. The navigation was built with Expo Router

## Workflow

1. **Home Screen**: Enter product SKU
2. **Product Form**: Enter metadata (category, brand, name, condition)
3. **Camera Screen**: Guided photo capture for multiple angles
4. **Photos View**: Review photos, process backgrounds
5. **Export**: Generate CSV with product data

## Troubleshooting

### App Shows Blank Screen
- Run `./start.sh` from project root
- DO NOT run any other command

### Navigation Errors
- DO NOT modify route paths in the code
- Ensure you're using the correct file paths

### "Cannot find module" Errors
- Make sure you're launching with `./start.sh`
- Do not add imports to files outside the photographyapp directory

### Confused About Directory Structure
- All development should happen in PhotographyApp/photographyapp
- The root App.js and PhotographyApp/App.js are entry points only - DO NOT MODIFY

## Project Dependencies
- Expo
- React Navigation
- Expo Camera
- Expo FileSystem
- React Native Picker

## Background Removal
The app is designed to integrate with remove.bg API for white background processing.

## Data Export
Product data is exported to CSV format for easy import into inventory systems.

## Remember
Always use `./start.sh` to run the app. No exceptions! 