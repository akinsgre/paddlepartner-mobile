import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../services/notificationService';

const PUSH_TOKEN_KEY = '@PaddlePartner:pushToken';
const TOKEN_REGISTERED_KEY = '@PaddlePartner:tokenRegistered';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

interface PushNotificationState {
  expoPushToken?: string;
  notification?: Notifications.Notification;
  error?: Error;
}

export interface NotificationResponse {
  notification: Notifications.Notification;
  actionIdentifier: string;
}

export function usePushNotifications(onNotificationReceived?: (notification: Notifications.Notification) => void) {
  const [state, setState] = useState<PushNotificationState>({});
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Only register for push notifications on physical devices
    if (!Device.isDevice) {
      console.log('⚠️ Push notifications only work on physical devices');
      return;
    }

    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          setState(prev => ({ ...prev, expoPushToken: token }));
        }
      })
      .catch(error => {
        console.error('Error getting push token:', error.message);
        // Don't crash the app if push notifications fail
        setState(prev => ({ ...prev, error }));
      });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
      setState(prev => ({ ...prev, notification }));
      onNotificationReceived?.(notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification tapped:', response);
      // Handle notification tap - can navigate to relevant screen
      const data = response.notification.request.content.data;
      console.log('Notification data:', data);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return state;
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }

    try {
      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'b9f5ea50-2e12-4269-9a00-b9b577a8a536',
      });
      token = tokenData.data;

      // Check if this token is already registered
      const lastRegisteredToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
      const isRegistered = await AsyncStorage.getItem(TOKEN_REGISTERED_KEY);
      
      // Only register with backend if:
      // 1. Token is new/different OR
      // 2. Previous registration failed
      if (lastRegisteredToken !== token || isRegistered !== 'true') {
        console.log('📱 Registering new push token:', token);
        try {
          await notificationService.registerPushToken(
            token,
            Platform.OS === 'ios' ? 'ios' : 'android'
          );
          
          // Mark as successfully registered
          await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
          await AsyncStorage.setItem(TOKEN_REGISTERED_KEY, 'true');
          console.log('✅ Push token registered with backend');
        } catch (error: any) {
          console.error('Failed to register push token with backend:', error);
          
          // If rate limited, mark as registered anyway to prevent spam
          if (error.response?.status === 429) {
            console.log('⚠️ Rate limited - will retry on next app launch');
            await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
            await AsyncStorage.setItem(TOKEN_REGISTERED_KEY, 'true');
          }
        }
      }
      // Token already registered - no log needed
    } catch (tokenError) {
      console.error('Error getting push token:', tokenError);
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0ea5e9',
    });
  }

  return token;
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification 📬",
      body: 'null, // Show immediatelynotification from Paddle Partner!',
      data: { testData: 'test' },
    },
    trigger: { seconds: 2 },
  });
}

/**
 * Get notification permissions status
 */
export async function getNotificationPermissionsStatus() {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status;
}
