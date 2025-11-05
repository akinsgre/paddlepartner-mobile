/**
 * Water Body Service for Paddle Partner Mobile
 * Handles water body-related API calls
 */

import api from './api'

export interface SharedWaterBody {
  _id: string
  name: string
  alternateNames?: string[]
  location: {
    type: string
    coordinates: [number, number] // [lng, lat]
  }
  sections?: SharedWaterBodySection[]
}

export interface SharedWaterBodySection {
  _id: string
  sharedWaterBody: string | SharedWaterBody
  sectionName: string
  location: {
    type: string
    coordinates: [number, number] // [lng, lat]
  }
}

export interface WaterBodySearchResult {
  type: 'shared' | 'section'
  id: string
  name: string
  distance?: number // Distance in meters from user location
  sharedWaterBody?: SharedWaterBody
  section?: SharedWaterBodySection
}

export const waterBodyService = {
  /**
   * Search for shared water bodies near a location
   */
  async searchNearby(latitude: number, longitude: number, radiusKm: number = 50): Promise<SharedWaterBody[]> {
    const response = await api.get('/shared-water-bodies/by-coordinates', {
      params: {
        latitude,
        longitude,
        maxDistance: radiusKm * 1000 // Convert km to meters
      }
    })
    return response.data.waterBodies || []
  },

  /**
   * Get all shared water bodies
   */
  async getAllWaterBodies(): Promise<SharedWaterBody[]> {
    const response = await api.get('/shared-water-bodies')
    return response.data.waterBodies || []
  },

  /**
   * Search water bodies by name
   */
  async searchByName(query: string): Promise<SharedWaterBody[]> {
    const response = await api.get('/shared-water-bodies/search', {
      params: { q: query }
    })
    return response.data.waterBodies || []
  },

  /**
   * Get combined search results prioritizing shared water bodies
   * near the user's location
   */
  async searchCombined(
    latitude: number,
    longitude: number,
    query?: string
  ): Promise<WaterBodySearchResult[]> {
    const results: WaterBodySearchResult[] = []

    // Get nearby water bodies
    const nearby = await this.searchNearby(latitude, longitude, 50)
    
    // Filter by search query if provided
    let waterBodies = nearby
    if (query) {
      const queryLower = query.toLowerCase()
      waterBodies = nearby.filter(wb => 
        wb.name.toLowerCase().includes(queryLower) ||
        wb.alternateNames?.some(alt => alt.toLowerCase().includes(queryLower))
      )
    }

    // Add shared water bodies
    waterBodies.forEach(wb => {
      results.push({
        type: 'shared',
        id: wb._id,
        name: wb.name,
        sharedWaterBody: wb,
        distance: this.calculateDistance(latitude, longitude, wb.location.coordinates[1], wb.location.coordinates[0])
      })

      // Add sections if they exist
      if (wb.sections && wb.sections.length > 0) {
        wb.sections.forEach(section => {
          results.push({
            type: 'section',
            id: section._id,
            name: `${wb.name} - ${section.sectionName}`,
            sharedWaterBody: wb,
            section: section,
            distance: this.calculateDistance(latitude, longitude, section.location.coordinates[1], section.location.coordinates[0])
          })
        })
      }
    })

    // Sort by distance (closest first)
    results.sort((a, b) => (a.distance || 0) - (b.distance || 0))

    return results
  },

  /**
   * Calculate distance between two coordinates in meters using Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  },

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    } else {
      return `${(meters / 1000).toFixed(1)}km`
    }
  },
}

export default waterBodyService
