/**
 * TypeScript type definitions for Paddle Partner Mobile
 * Copied from @paddlepartner/shared to avoid external dependency
 */

// ========================================
// User Types
// ========================================

export interface User {
  _id?: string
  googleId: string
  email: string
  name: string
  picture?: string
  stravaId?: string
  stravaAccessToken?: string
  stravaRefreshToken?: string
  stravaTokenExpiry?: Date
  preferences?: UserPreferences
  createdAt?: Date
  updatedAt?: Date
}

export interface UserPreferences {
  defaultPrivacy: 'public' | 'private'
  units: 'metric' | 'imperial'
  timezone?: string
  selectedPaddleTypes?: string[]
}

// ========================================
// Activity Types
// ========================================

export interface Activity {
  _id?: string
  stravaId?: number
  name: string
  type: string
  sportType: string
  startDate: string
  distance: number
  movingTime: number
  waterType?: string | null
  paddleType?: string | null
  
  sharedWaterBody?: {
    _id?: string
    name?: string
    type?: string
    section?: {
      _id?: string
      name?: string
      description?: string
      difficulty?: string
    }
  } | null
  
  waterBody?: {
    level?: string
  } | null
  
  sharedWaterBodySection?: SharedWaterBodySection | string | null
  
  totalElevationGain?: number
  averageSpeed?: number
  maxSpeed?: number
  location?: ActivityLocation
  gear?: ActivityGear
  weather?: ActivityWeather
  notes?: string
  photos?: string[]
  isPublic?: boolean
  userGoogleId?: string
  userId?: string
  createdAt?: string
  updatedAt?: string
  stravaData?: StravaData
  manualEntry?: boolean
}

export interface ActivityLocation {
  startLatLng?: [number, number]
  endLatLng?: [number, number]
  city?: string
  state?: string
  country?: string
}

export interface ActivityGear {
  kayakType?: string
  paddleType?: string
  equipment?: string[]
}

export interface ActivityWeather {
  temperature?: number
  windSpeed?: number
  windDirection?: string
  conditions?: string
}

export interface StravaData {
  polyline?: string
  timezone?: string
  startLatLng?: [number, number]
  endLatLng?: [number, number]
  elevProfile?: string
  photo?: StravaPhoto
}

export interface StravaPhoto {
  source: number
  uniqueId: string
  urls: Record<string, string>
}

// ========================================
// Water Body Types
// ========================================

export interface SharedWaterBody {
  _id: string
  name: string
  type: 'lake' | 'river' | 'creek' | 'bay' | 'ocean' | 'reservoir' | 'pond' | 'canal' | 'other'
  location: GeoPoint
  osmData?: OSMData
  activityCount?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface SharedWaterBodySection {
  _id: string
  sharedWaterBody: string | SharedWaterBody
  name: string
  description?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'class-i' | 'class-ii' | 'class-iii' | 'class-iv' | 'class-v' | 'class-vi'
  coordinates: GeoPoint
  waterLevels?: string[]
  activityCount?: number
  contributedBy?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface OSMWaterBody {
  name?: string
  type?: string
  section?: string
  waterLevel?: string | null
  osmId?: string
  osmType?: string
  source?: string
  confidence?: number
  userRefined?: boolean
  metadata?: Record<string, any>
  lastUpdated?: Date
  coordinates?: [number, number]
}

export interface OSMData {
  id: string
  type: 'node' | 'way' | 'relation'
  tags: Record<string, string>
  geometry?: any
}

export interface GeoPoint {
  type: 'Point'
  coordinates: [number, number]
}

// ========================================
// Paddle Type
// ========================================

export interface PaddleType {
  _id?: string
  name: string
  displayName?: string
  description?: string
  sortOrder?: number
  createdAt?: Date
  updatedAt?: Date
}

// ========================================
// Water Type (Legacy)
// ========================================

export interface WaterType {
  _id?: string
  name: string
  description?: string
  icon?: string
  createdAt?: Date
  updatedAt?: Date
}

// ========================================
// Invited User
// ========================================

export interface InvitedUser {
  _id?: string
  email: string
  invitedBy?: string
  invitedAt: Date
  acceptedAt?: Date
  status: 'pending' | 'accepted' | 'revoked'
  notes?: string
}

// ========================================
// API Response Types
// ========================================

export interface PaginatedResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextPage: number | null
  prevPage: number | null
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface AuthResponse {
  success: boolean
  token?: string
  user?: User
  message?: string
}

export interface StravaAuthResponse {
  success: boolean
  message: string
  athlete?: any
}

export interface StravaSyncResponse {
  success: boolean
  message: string
  totalFound: number
  newActivities: number
  pagesProcessed: number
  hasMore: boolean
}

// ========================================
// Query Parameters
// ========================================

export interface ActivityQueryParams {
  page?: number
  limit?: number
  search?: string
  sportType?: string
  waterType?: string
  paddleType?: string
  startDate?: string
  endDate?: string
  sort?: string
}
