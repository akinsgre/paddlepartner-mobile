import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import notificationService from '../services/notificationService';

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
    registerForPushNotificationsAsync()
      .then(token => {
        if (token) {
          setState(prev => ({ ...prev, expoPushToken: token }));
        }
      })
      .catch(error => {
        console.error('Failed to register for push notifications:', error);
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
  }, [onNotificationReceived]);

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
        projectId: 'your-project-id', // Replace with your Expo project ID
      });
      token = tokenData.data;
      
      console.log('📱 Expo Push Token:', token);

      // Register token with backend
      try {
        await notificationService.registerPushToken(
          token,
          Platform.OS === 'ios' ? 'ios' : 'android'
        );
      } catch (error) {
        console.error('Failed to register push token with backend:', error);
      }
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
