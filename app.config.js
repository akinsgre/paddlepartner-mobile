export default {
  expo: {
    name: 'paddlepartner-mobile',
    slug: 'paddlepartner-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'paddlepartner',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0ea5e9',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.paddlepartner.mobile',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      package: 'com.paddlepartner.mobile',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0ea5e9',
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: 'b9f5ea50-2e12-4269-9a00-b9b577a8a536',
      },
    },
    plugins: ['expo-web-browser'],
  },
};
