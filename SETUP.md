# Photography App Setup Guide

## Windows Setup

1. Install Required Software:
   ```bash
   # Install Node.js from https://nodejs.org/ (LTS version)
   # Install Git from https://git-scm.com/download/win
   
   # Install Expo CLI
   npm install -g expo-cli
   ```

2. Clone and Run:
   ```bash
   # Clone the repository
   git clone https://github.com/dangerluxco/LuxeSupply-Photo-Capture-App.git
   cd LuxeSupply-Photo-Capture-App

   # Install dependencies
   npm install

   # Start the app
   npx expo start
   ```

## Mac Setup

1. Install Required Software:
   ```bash
   # Install Homebrew
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

   # Install Node.js and Watchman
   brew install node
   brew install watchman

   # Install Xcode from Mac App Store (required for iOS development)
   # After Xcode installation, install command line tools:
   xcode-select --install

   # Install Expo CLI
   npm install -g expo-cli
   ```

2. Clone and Run:
   ```bash
   # Clone the repository
   git clone YOUR_REPOSITORY_URL
   cd photographyapp

   # Install dependencies
   npm install

   # Start the app
   npx expo start
   ```

## Development Workflow

1. Always pull latest changes before starting work:
   ```bash
   git pull origin main
   ```

2. Install dependencies if package.json has changed:
   ```bash
   npm install
   ```

3. Create a new branch for features:
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. Commit and push changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```

## Troubleshooting

### Common Issues

1. Metro Bundler Cache Issues:
   ```bash
   # Clear Metro cache
   npx expo start --clear
   ```

2. Node Modules Issues:
   ```bash
   # Remove node_modules and reinstall
   rm -rf node_modules
   npm install
   ```

3. Expo Cache Issues:
   ```bash
   # Clear Expo cache
   expo r -c
   ```

### Platform-Specific Issues

#### Windows
- If you encounter EACCES errors, run PowerShell as Administrator
- Use PowerShell instead of CMD for better compatibility

#### Mac
- Ensure Xcode is properly installed for iOS development
- If you encounter permission issues:
  ```bash
  sudo chown -R $USER ~/.npm
  sudo chown -R $USER ~/.expo
  ```

## Environment Setup

1. Create a `.env` file in the root directory:
   ```
   API_URL=your_api_url
   ENVIRONMENT=development
   ```

2. Never commit `.env` files (they're already in .gitignore)

## Testing

1. Run tests:
   ```bash
   npm test
   ```

2. Test on both platforms before committing changes

## Deployment

1. Build for iOS:
   ```bash
   expo build:ios
   ```

2. Build for Android:
   ```bash
   expo build:android
   ```

## Need Help?

- Check the [Expo documentation](https://docs.expo.dev/)
- Review the [React Native documentation](https://reactnative.dev/docs/getting-started)
- Contact the development team 