# Two-Step Create Activity Flow - Implementation Guide

## Overview

The mobile app now uses a 2-step wizard flow for creating activities:

**Step 1: Select Water Body** (`CreateActivityScreen`)
- Search water bodies by location (nearby) or name
- Select from SharedWaterBody sections or OpenStreetMap (OSM) results
- Continue to confirmation screen

**Step 2: Confirm & Save** (`CreateActivityConfirmScreen`)
- Review selected water body
- Add section name (for OSM water bodies only)
- Add optional water level
- Save activity

## Architecture

### Navigation Structure

```
HomeScreen (Modal)
  └── NavigationContainer (independent)
      └── Stack Navigator
          ├── CreateActivitySelect (Step 1)
          └── CreateActivityConfirm (Step 2)
```

The flow uses React Navigation's stack navigator inside a modal, allowing proper back navigation and parameter passing between screens.

### Data Flow

#### Step 1 → Step 2 Navigation

```typescript
navigation.navigate('CreateActivityConfirm', {
  selectedWaterBody: WaterBodySearchResult,
  location: { latitude: number, longitude: number },
  onActivityCreated: () => void
});
```

#### Step 2 → Save Activity

For **SharedWaterBody** (existing in database):
```
1. Extract sharedWaterBodyId from selection
2. Extract sectionName if section is selected
3. Call POST /api/activities/manual with:
   - sharedWaterBodyId
   - sectionName (optional)
   - waterLevel (optional)
   - latitude, longitude
```

For **OSM Water Body** (from OpenStreetMap):
```
1. Check if OSM water body exists:
   POST /api/activities/check-osm-match
   {
     osmId: string,
     name: string,
     type: string,
     coordinates: [longitude, latitude]
   }

2. If matched: Use returned sharedWaterBodyId
   
3. If not matched: Create new SharedWaterBody:
   POST /api/shared-water-bodies
   {
     name: string,
     type: string,
     coordinates: [longitude, latitude],
     section: string (optional),
     osmData: { osmId, osmType }
   }

4. Create activity with sharedWaterBodyId
```

## Components

### CreateActivityScreen (Step 1)

**Purpose:** Water body selection

**Features:**
- Location-based search (shows nearby water bodies)
- Name-based search (searches all SharedWaterBodies)
- Results include:
  - SharedWaterBody sections (from database)
  - OSM water bodies (from OpenStreetMap)
- Visual selection with checkmark
- Continue button (disabled until selection made)

**Props:**
```typescript
{
  navigation: NativeStackNavigationProp,
  route: {
    params: {
      onActivityCreated: () => void
    }
  },
  onCancel: () => void
}
```

### CreateActivityConfirmScreen (Step 2)

**Purpose:** Confirm selection and add details

**Features:**
- Read-only water body name display
- Read-only section name (for SharedWaterBody sections)
- Editable section name input (for OSM water bodies)
- Optional water level input
- Location coordinates display
- Back button (returns to selection)
- Save Activity button

**Props:**
```typescript
{
  navigation: NativeStackNavigationProp,
  route: {
    params: {
      selectedWaterBody: WaterBodySearchResult,
      location: { latitude: number, longitude: number },
      onActivityCreated: () => void
    }
  }
}
```

## Water Body Types

### SharedWaterBody Section

```typescript
{
  id: string,                    // sectionId (MongoDB ObjectId)
  type: 'section',
  name: string,                  // e.g., "Russian River - Upper Section"
  sharedWaterBody: {
    _id: string,                 // waterBodyId
    name: string,                // e.g., "Russian River"
    type: string                 // e.g., "river"
  },
  section: {
    _id: string,                 // sectionId
    sectionName: string          // e.g., "Upper Section"
  }
}
```

### OSM Water Body

```typescript
{
  id: string,                    // "osm-way-123456"
  type: 'osm',
  name: string,                  // e.g., "Lake Tahoe"
  osmType: string,               // "way" or "relation"
  osmId: string                  // "123456"
}
```

## API Endpoints Used

### Search Water Bodies

```
GET /api/shared-water-bodies/by-coordinates?latitude=X&longitude=Y&radius=2000
GET /api/shared-water-bodies/search?query=NAME
```

### Check OSM Match

```
POST /api/activities/check-osm-match
{
  osmId: string,
  name: string,
  type: string,
  coordinates: [longitude, latitude]
}

Response:
{
  matched: boolean,
  sharedWaterBody?: {
    _id: string,
    name: string,
    type: string,
    sections: []
  }
}
```

### Create SharedWaterBody

```
POST /api/shared-water-bodies
{
  name: string,
  type: string,
  coordinates: [longitude, latitude],
  section?: string,
  osmData?: { osmId, osmType }
}

Response:
{
  sharedWaterBody: {
    _id: string,
    name: string,
    type: string
  }
}
```

### Create Manual Activity

```
POST /api/activities/manual
{
  latitude: number,
  longitude: number,
  sharedWaterBodyId: string,
  sectionName?: string,
  waterLevel?: string
}

Response:
{
  activity: Activity
}
```

## Environment Configuration

Add to `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

## Testing Checklist

### Step 1 - Selection Screen

- [ ] Location permission requested on mount
- [ ] Nearby water bodies load automatically
- [ ] Search input filters to name-based search
- [ ] Results show mix of SharedWaterBody sections and OSM bodies
- [ ] Selection highlights with checkmark
- [ ] Continue button disabled until selection made
- [ ] Cancel button closes modal

### Step 2 - Confirmation Screen

- [ ] Water body name displays correctly
- [ ] Section name displays (SharedWaterBody sections)
- [ ] Section input shows (OSM water bodies)
- [ ] Water level input is optional
- [ ] Location coordinates display
- [ ] Back button returns to selection
- [ ] Save button creates activity

### OSM Water Body Flow

- [ ] Select OSM water body from results
- [ ] Continue to confirmation
- [ ] Add optional section name
- [ ] Add optional water level
- [ ] Save activity
- [ ] Verify: SharedWaterBody created in database
- [ ] Verify: Activity created with correct sharedWaterBodyId

### SharedWaterBody Flow

- [ ] Select SharedWaterBody section
- [ ] Continue to confirmation
- [ ] Section name is read-only
- [ ] Add optional water level
- [ ] Save activity
- [ ] Verify: Activity created with existing sharedWaterBodyId and sectionName

## Troubleshooting

### "No water bodies found"

- Check location permissions
- Verify backend is running on port 3001
- Check network connectivity (mobile device can reach localhost)
- Verify search radius (default 2000m)

### "Failed to create activity"

- Check authentication token in AsyncStorage
- Verify user is logged in
- Check backend logs for errors
- Verify sharedWaterBodyId is valid

### Navigation errors

- Ensure React Navigation dependencies installed:
  - `@react-navigation/native`
  - `@react-navigation/native-stack`
  - `react-native-screens`
  - `react-native-safe-area-context`
- Verify NavigationContainer has `independent={true}` prop

## Future Enhancements

- [ ] Add activity date/time selection
- [ ] Add paddle type selection (kayak, SUP, canoe)
- [ ] Add photos/notes to activity
- [ ] Show activity history for selected water body
- [ ] Add map view for water body location
- [ ] Cache water body search results
- [ ] Offline support for creating activities

## Related Files

- `src/screens/CreateActivityScreen.tsx` - Step 1 component
- `src/screens/CreateActivityConfirmScreen.tsx` - Step 2 component
- `src/screens/HomeScreen.tsx` - Navigation setup
- `src/services/waterBodyService.ts` - Water body search
- `src/services/activityService.ts` - Activity creation
- `server/routes/activities.js` - Backend endpoints
- `server/routes/sharedWaterBodies.js` - Water body endpoints
