// Setup file for Jest tests
// Note: @testing-library/react-native v12.4+ includes built-in matchers

// Define global __DEV__ for React Native
global.__DEV__ = true;

// Mock React Native bridge
global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: [],
  localModulesConfig: [],
};

// Configure react-native-testing-library before anything else
jest.mock('@testing-library/react-native', () => {
  const actual = jest.requireActual('@testing-library/react-native');
  return {
    ...actual,
    // Use simple render that doesn't try to auto-detect host components
    render: (component, options) => {
      return actual.render(component, {
        ...options,
        // Skip host component detection
        wrapper: ({ children }) => children,
      });
    },
  };
});

// Mock expo-modules-core Platform before anything else
jest.mock('expo-modules-core', () => {
  const actualExpo = jest.requireActual('expo-modules-core');
  return {
    ...actualExpo,
    Platform: {
      OS: 'ios',
      select: (obj) => obj.ios || obj.default,
    },
  };
});

// Mock React Native core modules
jest.mock('react-native/Libraries/StyleSheet/StyleSheet', () => ({
  create: (styles) => styles,
  flatten: (styles) => styles,
  compose: (style1, style2) => [style1, style2],
  hairlineWidth: 1,
  absoluteFill: 0,
  absoluteFillObject: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
}));

// Mock expo-web-browser
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: 'success', url: 'http://example.com' })),
  maybeCompleteAuthSession: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 35.886272,
        longitude: -82.82698,
        altitude: 0,
        accuracy: 5,
        altitudeAccuracy: 5,
        heading: 0,
        speed: 0,
      },
      timestamp: Date.now(),
    })
  ),
  Accuracy: {
    BestForNavigation: 4,
  },
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [
        {
          uri: 'file:///mock-image.jpg',
          width: 1000,
          height: 1000,
        },
      ],
    })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [
        {
          uri: 'file:///mock-camera-image.jpg',
          width: 1000,
          height: 1000,
        },
      ],
    })
  ),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Mock Google Sign-In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(() =>
      Promise.resolve({
        user: {
          id: 'mock-user-id',
          name: 'Test User',
          email: 'test@example.com',
          photo: 'https://example.com/photo.jpg',
        },
        idToken: 'mock-id-token',
      })
    ),
    signOut: jest.fn(() => Promise.resolve()),
    isSignedIn: jest.fn(() => Promise.resolve(false)),
  },
}));

// Mock fetch for base64 conversion
global.fetch = jest.fn(() =>
  Promise.resolve({
    blob: () =>
      Promise.resolve(
        new Blob(['mock-image-data'], { type: 'image/jpeg' })
      ),
  })
);

global.FileReader = class {
  readAsDataURL() {
    this.onloadend({ target: { result: 'data:image/jpeg;base64,mockBase64Data' } });
  }
};
