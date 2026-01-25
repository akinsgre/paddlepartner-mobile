/**
 * Environment configuration for Paddle Partner Mobile
 */

export const ENV = {
  // API Configuration
  // Always use production backend for OAuth (Google requires public domain)
  API_BASE_URL: 'https://ww3mmdu9gs.us-east-2.awsapprunner.com/api',

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
