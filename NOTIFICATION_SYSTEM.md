# Notification System Implementation

## Overview

Complete push notification system for the Paddle Partner mobile app, including in-app notifications, push notifications, and real-time updates.

## Components

### 1. NotificationBell Component
**Location:** `src/components/NotificationBell.tsx`

A bell icon with an unread count badge that can be placed in headers or navigation.

**Props:**
- `unreadCount: number` - Number of unread notifications
- `onPress: () => void` - Handler when bell is pressed
- `size?: number` - Icon size (default: 24)
- `color?: string` - Icon color (default: '#ffffff')

**Features:**
- Red badge showing unread count
- Shows "99+" for counts over 99
- Auto-hides badge when count is 0
- Accessible with testID="notification-bell"

**Usage:**
```tsx
<NotificationBell
  unreadCount={5}
  onPress={() => navigation.navigate('Notifications')}
/>
```

### 2. NotificationsScreen Component
**Location:** `src/screens/NotificationsScreen.tsx`

Full-screen notification list with pull-to-refresh, pagination, and actions.

**Props:**
- `onNavigateToActivity?: (activityId: string) => void` - Navigate to activity
- `onNavigateToProfile?: (googleId: string) => void` - Navigate to user profile

**Features:**
- Pull-to-refresh
- Infinite scroll pagination (20 per page)
- Mark individual as read on tap
- "Mark all as read" button
- Delete individual notifications
- Color-coded notification types
- Relative timestamps (e.g., "5m ago", "2d ago")
- Empty state for no notifications
- Loading states

**Notification Types:**
- 🔵 **Follow** (blue) - Someone followed you
- 🔴 **Like** (red) - Someone liked your activity
- 🟢 **Comment** (green) - Someone commented on your activity
- 🟠 **Mention** (orange) - Someone mentioned you

### 3. NotificationService
**Location:** `src/services/notificationService.ts`

API service for notification operations.

**Methods:**

```typescript
// Get notifications with pagination
getNotifications(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<{
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  page: number;
  pages: number;
}>

// Get unread count
getUnreadCount(): Promise<number>

// Mark as read
markAsRead(notificationId: string): Promise<void>
markAllAsRead(): Promise<void>

// Delete
deleteNotification(notificationId: string): Promise<void>

// Preferences
getPreferences(): Promise<NotificationPreferences>
updatePreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences>

// Push tokens
registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void>
unregisterPushToken(token: string): Promise<void>
```

### 4. usePushNotifications Hook
**Location:** `src/hooks/usePushNotifications.ts`

React hook for managing push notifications with Expo.

**Features:**
- Automatic permission requests
- Expo push token registration
- Foreground notification handling
- Background notification tap handling
- Platform-specific configuration (iOS/Android)
- Token registration with backend

**Usage:**
```tsx
const pushState = usePushNotifications((notification) => {
  console.log('Notification received:', notification);
  // Handle notification
});

// Access push token
console.log('Token:', pushState.expoPushToken);
```

**Returns:**
```typescript
{
  expoPushToken?: string;
  notification?: Notifications.Notification;
  error?: Error;
}
```

## Integration

### HomeScreen Integration

The notification system is fully integrated into HomeScreen:

1. **Header Bell Icon**: Shows unread count badge
2. **Notifications Tab**: Third tab displays NotificationsScreen
3. **Tab Badge**: Notifications tab icon shows unread count
4. **Real-time Updates**: Push notifications refresh unread count
5. **Navigation**: Tapping notifications navigates to related activities

**Key Code:**
```tsx
// Setup push notifications
const pushNotificationState = usePushNotifications((notification) => {
  loadUnreadCount(); // Refresh count on new notification
});

// Load unread count
const loadUnreadCount = async () => {
  const count = await notificationService.getUnreadCount();
  setUnreadCount(count);
};

// Bell in header
<NotificationBell
  unreadCount={unreadCount}
  onPress={handleNotificationPress}
/>

// Notifications tab
{activeTab === 'notifications' ? (
  <NotificationsScreen
    onNavigateToActivity={handleNavigateToActivity}
    onNavigateToProfile={handleNavigateToProfile}
  />
) : (
  // Activity list
)}
```

## Backend Requirements

The backend needs to implement these endpoints:

### Notification Endpoints

```
GET    /api/notifications              - Get notifications (paginated)
GET    /api/notifications/unread-count - Get unread count
PATCH  /api/notifications/:id/read     - Mark as read
PATCH  /api/notifications/read-all     - Mark all as read
DELETE /api/notifications/:id          - Delete notification
GET    /api/notifications/preferences  - Get preferences
PATCH  /api/notifications/preferences  - Update preferences
POST   /api/notifications/push-token   - Register push token
DELETE /api/notifications/push-token   - Unregister push token
```

### Notification Schema

```typescript
{
  _id: string;
  recipientGoogleId: string;
  type: 'follow' | 'activity_like' | 'activity_comment' | 'mention';
  message: string;
  read: boolean;
  actionUrl?: string;
  actorGoogleId?: string;
  actorName?: string;
  actorImage?: string;
  relatedActivityId?: string;
  relatedCommentId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Push Notification Format

```typescript
{
  to: 'ExponentPushToken[...]',
  sound: 'default',
  title: 'New Follower',
  body: 'John Doe started following you',
  data: {
    type: 'follow',
    notificationId: '...',
    actorGoogleId: '...',
  },
}
```

## Push Notification Flow

### 1. Token Registration
```
App Start → Request Permissions → Get Expo Token → Register with Backend
```

### 2. Sending Notifications
```
User Action → Backend Creates Notification → Backend Sends Push via Expo API
```

### 3. Receiving Notifications

**Foreground (app open):**
```
Push Received → addNotificationReceivedListener → Update UI → Show Banner
```

**Background/Quit (app closed):**
```
Push Received → System Notification → User Taps → App Opens → addNotificationResponseReceivedListener → Navigate
```

## Configuration

### app.json Updates Needed

Add to `app.json`:
```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#0ea5e9",
      "androidMode": "default",
      "androidCollapsedTitle": "{{unread_count}} new notifications"
    },
    "android": {
      "useNextNotificationsApi": true
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "sounds": ["./assets/notification.wav"]
        }
      ]
    ]
  }
}
```

### Update Project ID

In `src/hooks/usePushNotifications.ts`, replace:
```typescript
projectId: 'your-project-id'
```
With your actual Expo project ID from `app.json` or Expo dashboard.

## Testing

### Local Testing (Without Backend)

Use the test helper:
```typescript
import { scheduleTestNotification } from '../hooks/usePushNotifications';

// Schedule notification in 2 seconds
await scheduleTestNotification();
```

### Check Permissions
```typescript
import { getNotificationPermissionsStatus } from '../hooks/usePushNotifications';

const status = await getNotificationPermissionsStatus();
console.log('Permission status:', status); // 'granted', 'denied', 'undetermined'
```

### Test with Expo Push Tool

1. Get your Expo push token from the app
2. Visit: https://expo.dev/notifications
3. Enter token and send test notification

## Security Considerations

1. **Token Storage**: Push tokens stored server-side, associated with user account
2. **Authentication**: All notification endpoints require auth middleware
3. **Rate Limiting**: Prevent notification spam
4. **Data Isolation**: Users can only see their own notifications
5. **Validation**: Backend validates notification data before sending

## Performance

- **Pagination**: 20 notifications per page
- **Lazy Loading**: Infinite scroll loads more as needed
- **Optimistic Updates**: Mark as read immediately in UI
- **Badge Updates**: Lightweight unread count API
- **Caching**: Could add React Query for better caching

## Future Enhancements

1. **In-App Notification Sounds**: Custom sound per notification type
2. **Notification Grouping**: Group similar notifications
3. **Rich Notifications**: Images, action buttons
4. **Notification History**: Archive old notifications
5. **Do Not Disturb**: Scheduled quiet hours
6. **Custom Channels**: Android notification channels
7. **Actionable Notifications**: Reply, like directly from notification
8. **Web Push**: Extend to desktop web app

## Troubleshooting

### Push Notifications Not Working

1. **Check device**: Must use physical device, not simulator
2. **Check permissions**: `await getNotificationPermissionsStatus()`
3. **Check token registration**: Verify token in backend database
4. **Check Expo credentials**: Ensure proper iOS/Android push credentials
5. **Check logs**: Look for errors in `usePushNotifications` hook

### Badge Not Updating

1. **Check API**: Verify `/api/notifications/unread-count` works
2. **Check auth**: Ensure JWT token is valid
3. **Check timing**: Count updates on tab switch and new notifications

### Navigation Not Working

1. **Check handlers**: Verify `onNavigateToActivity` is passed
2. **Check activity ID**: Ensure `relatedActivityId` exists in notification
3. **Check activity list**: Activity may not be loaded yet

## Dependencies

- `expo-notifications` (v0.32.16) - Push notifications
- `expo-device` (v8.0.10) - Device detection
- React Native core modules

## Files Created

- ✅ `src/services/notificationService.ts` (142 lines)
- ✅ `src/components/NotificationBell.tsx` (54 lines)
- ✅ `src/screens/NotificationsScreen.tsx` (318 lines)
- ✅ `src/hooks/usePushNotifications.ts` (163 lines)

## Files Modified

- ✅ `src/screens/HomeScreen.tsx` - Integrated notifications
- ✅ `src/services/index.ts` - Export notificationService
- ✅ `src/screens/index.ts` - Export NotificationsScreen

## Total Lines Added

~677 lines of production code (excluding documentation)

---

**Status:** ✅ Implementation Complete  
**Tests:** 19/19 passing  
**Ready for:** Backend API integration and push notification testing
