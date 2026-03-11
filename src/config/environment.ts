/**
 * Environment configuration for Paddle Partner Mobile
 */

import { Platform } from 'react-native'

// Get environment from EXPO_PUBLIC_API_ENV or default to 'production'
const API_ENV = process.env.EXPO_PUBLIC_API_ENV || 'production'

// API URLs for different environments
const API_URLS = {
  local: Platform.select({
    android: 'http://10.0.2.2:3001/api', // Android emulator
    ios: 'http://localhost:3001/api',     // iOS simulator
    default: 'http://localhost:3001/api', // Fallback
  }),
  production: 'https://ww3mmdu9gs.us-east-2.awsapprunner.com/api',
}

export const ENV = {
  // API Configuration
  API_BASE_URL: API_URLS[API_ENV as keyof typeof API_URLS] || API_URLS.production,
  API_ENV, // Expose current environment

  // OAuth Configuration
  GOOGLE_CLIENT_ID: '79587302091-o7k04lglgsmbmscugvbnmbg7laeoqhqo.apps.googleusercontent.com',
  
  // Strava Configuration
  STRAVA_CLIENT_ID: '58115',

  // App Configuration
  APP_NAME: 'Paddle Partner',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  ENABLE_STRAVA_SYNC: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_ANALYTICS: false,
}

export default ENV
