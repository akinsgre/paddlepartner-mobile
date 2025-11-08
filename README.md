# Paddle Partner Mobile

React Native mobile application for iOS and Android, built with Expo and TypeScript.

## Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- For iOS: Mac with Xcode
- For Android: Android Studio
- Expo Go app on your phone (for testing)

## Setup

### 1. Install Dependencies

```bash
cd paddlepartner-mobile
npm install
```

### 2. Link Shared Types Package

The mobile app uses the `@paddlepartner/shared` package for TypeScript types:

```bash
# In paddlepartner-shared directory
cd ../paddlepartner-shared
npm install
npm run build
npm link

# Back in mobile directory
cd ../paddlepartner-mobile
npm link @paddlepartner/shared
```

### 3. Environment Configuration

The app is pre-configured to connect to:
- **Development**: `http://localhost:3001/api` (local backend)
- **Production**: `https://eev4eqzmps.us-east-2.awsapprunner.com/api`

Configuration is in `src/config/environment.ts`.

## Development

### Start Development Server

```bash
npm start
```

This opens Expo Dev Tools in your browser.

### Run on Devices

```bash
# iOS Simulator (Mac only)
npm run ios

# Android Emulator
npm run android

# Web browser (for testing)
npm run web
```

### Test on Physical Device

1. Install "Expo Go" app from App Store or Play Store
2. Scan QR code from Expo Dev Tools
3. App loads directly on your device

## Project Structure

```
paddlepartner-mobile/
├── src/
│   ├── config/
│   │   └── environment.ts        # Environment configuration
│   ├── services/
│   │   ├── api.ts                # Axios client with JWT
│   │   ├── authService.ts        # Google OAuth
│   │   ├── activityService.ts    # Activity CRUD
│   │   ├── stravaService.ts      # Strava integration
│   │   └── index.ts              # Service exports
│   ├── screens/                  # App screens (TODO)
│   ├── components/               # Reusable components (TODO)
│   ├── navigation/               # React Navigation (TODO)
│   └── hooks/                    # Custom hooks (TODO)
├── App.tsx                       # Root component
├── app.json                      # Expo configuration
├── package.json
└── tsconfig.json
```

## API Integration

The mobile app connects to the same backend as the web app:

### Authentication

```typescript
import { authService } from './src/services'

// Login with Google
const result = await authService.googleAuth(googleJWT)
// Tokens automatically stored in AsyncStorage

// Check auth status
const isAuth = await authService.isAuthenticated()

// Get current user
const user = await authService.getCurrentUser()

// Logout
await authService.logout()
```

### Activities

```typescript
import { activityService } from './src/services'

// Get activities
const activities = await activityService.getActivities({
  page: 1,
  limit: 20,
  sportType: 'kayaking'
})

// Create activity
const newActivity = await activityService.createActivity({
  name: 'Morning Paddle',
  type: 'Kayaking',
  distance: 5000,
  movingTime: 3600
})
```

### Strava Sync

```typescript
import { stravaService } from './src/services'

// Get connection status
const status = await stravaService.getConnectionStatus()

// Sync activities
const result = await stravaService.syncActivities({
  sync_all: false
})
```

## Shared Types

All TypeScript interfaces are shared with the web app:

```typescript
import { Activity, User, SharedWaterBodySection } from '@paddlepartner/shared'

const activity: Activity = {
  name: 'River Run',
  type: 'Kayaking',
  sportType: 'kayaking',
  startDate: new Date().toISOString(),
  distance: 8000,
  movingTime: 5400
}
```

## Next Steps

### Immediate Priorities

1. **Authentication Flow**
   - Implement Google Sign-In for mobile
   - Add JWT token persistence
   - Create auth screens

2. **Navigation**
   - Install React Navigation
   - Set up stack and tab navigation
   - Create main app structure

3. **Activity Screens**
   - Activity list with pull-to-refresh
   - Activity detail view
   - Create/edit activity forms

4. **Maps Integration**
   - Install react-native-maps
   - Show activity routes on map
   - GPS tracking for new activities

5. **Offline Support**
   - Cache activities locally
   - Queue API calls when offline
   - Sync when connection restored

### Recommended Packages

```bash
# Navigation
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs

# Maps
npm install react-native-maps

# Google Sign-In
npm install @react-native-google-signin/google-signin

# Icons
npm install @expo/vector-icons

# UI Components
npm install react-native-elements
```

## Deployment

### Development Build

```bash
expo build:ios
expo build:android
```

### Production (EAS Build)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for stores
eas build --platform ios
eas build --platform android

# Submit to stores
eas submit
```

## Testing

```bash
# Run tests (when implemented)
npm test

# Type checking
npx tsc --noEmit
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Paddle Partner Backend API](https://eev4eqzmps.us-east-2.awsapprunner.com/api)
