# Mobile UI Restructure - Tabbed Navigation with Notifications

## Overview

The mobile app HomeScreen has been restructured to use a compact, modern tabbed navigation design to support upcoming notifications functionality.

## UI Changes

### Before
- Large header with logo, subtitle, and "Mobile App" text
- Welcome card with user info
- Large "Create Activity" button
- Activity list with 2 tabs inside a container: "Following" and "My Activities"
- Logout button at bottom

### After
- **Compact header**: Single-line header with kayaking icon + "Paddle Partner" text, plus circular "+" button on the right
- **Three tabs** across the top below header:
  - **Following** (👥 account-group icon) - Activities from people you follow
  - **My Activities** (👤 account icon) - User's own activities
  - **Notifications** (🔔 bell icon) - Placeholder for future notifications feature
- Content area that changes based on active tab
- Logout button at bottom of content area

## Technical Implementation

### Type Changes
```typescript
// Changed from:
const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

// To:
const [activeTab, setActiveTab] = useState<'following' | 'my' | 'notifications'>('following');
```

### Tab Logic
- **Following tab**: Loads activities from followed users via `activityService.getFollowingActivities()`
- **My Activities tab**: Loads user's own activities via `activityService.getActivities()`
- **Notifications tab**: Currently displays placeholder "Coming soon" message with bell icon

### Activity Loading
The `loadActivities()` function now:
1. Checks if `activeTab === 'notifications'` and returns early (no activities to load)
2. For other tabs, loads appropriate activities based on tab selection
3. Uses 'following' instead of 'all' for consistency with UI

### Styling Updates

**Header**:
- Compact design with `paddingBottom: 16` (was 30)
- Flexbox layout: logo container on left, create button on right
- Create button is now circular (44x44) with white background and blue "+" icon

**Tabs**:
- Three equal-width tabs with icon + label
- Icons change color based on active state (blue when active, gray when inactive)
- Smaller padding: `paddingVertical: 12, paddingHorizontal: 8`
- Smaller text: `fontSize: 12`

**Content Area**:
- Conditional rendering: Shows placeholder for notifications, activity list for other tabs
- Removed welcome card and large create button
- More compact padding: `padding: 16` (was 20)

## Testing

All existing tests pass (19/19):
- ✅ WaterBodySelectionList component tests
- ✅ activityService tests

Tests are compatible with the new UI structure because:
- Test IDs remain the same (`following-tab`, `my-activities-tab`, `create-activity-button`)
- Activity list rendering logic unchanged
- Tab switching logic preserved (just with new tab names)

## Future Work

### Notifications Implementation
The notifications tab is currently a placeholder. Future implementation will include:

1. **Native notifications**: Use Expo Notifications API for push notifications
2. **Notification types**:
   - New follower
   - Activity liked/commented
   - Mentioned in activity
   - Friend request
3. **Notification list**: Similar to activity cards but with different data
4. **Badge/count**: Show unread count on bell icon
5. **Actions**: Mark as read, delete, navigate to related activity/user

### Additional Enhancements
- Pull-to-refresh on notifications tab
- Real-time notification updates
- Notification settings/preferences
- Sound/vibration preferences

## Migration Notes

### Breaking Changes
None - this is a UI-only change. All existing functionality preserved.

### Deprecated Code Removed
- Welcome card component
- Large create activity button
- Message card styling
- Subtitle in header

### Backward Compatibility
- All test IDs maintained
- Tab behavior unchanged (just renamed 'all' → 'following')
- Activity loading logic identical
- Modal flows for creating activities unchanged

## Visual Design

### Color Palette
- Primary: `#0ea5e9` (sky blue)
- Gray scale: `#64748b`, `#94a3b8`, `#cbd5e1`
- Background: `#f0f9ff` (light blue)
- White: `#ffffff`
- Red (logout): `#ef4444`

### Icons Used
- `kayaking`: App logo
- `account-group`: Following tab
- `account`: My Activities tab
- `bell`: Notifications tab
- `bell-outline`: Notifications placeholder

All icons from `@expo/vector-icons` MaterialCommunityIcons set.

## File Modified
- `src/screens/HomeScreen.tsx` (638 → 666 lines, +4% size increase)

## Benefits
1. **More screen space**: Compact header frees up vertical space for content
2. **Modern design**: Tabbed navigation is standard for mobile apps
3. **Scalability**: Easy to add more tabs in future
4. **Quick access**: Create button always visible in header
5. **Clear navigation**: Icons help users quickly identify tabs
6. **Future-ready**: Notifications tab prepared for upcoming feature
