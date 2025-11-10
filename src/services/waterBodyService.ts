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
    console.log('🔍 searchByName called with query:', query);
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
    const results: WaterBodySearchResult[] = [];
    console.log('🌊 searchCombined called:', { latitude, longitude, query });

    let waterBodies: any[] = [];
    if (query) {
      // If query is provided, search by name only and ignore location
      console.log('🔍 Searching by name due to query:', query);
      waterBodies = await this.searchByName(query);
      console.log('🔍 searchByName returned:', waterBodies.length, 'results');
    } else {
      // Otherwise, search by location
      waterBodies = await this.searchNearby(latitude, longitude, 50);
      console.log('� searchNearby returned:', waterBodies.length, 'results');
    }

    // Convert backend response to WaterBodySearchResult format
    waterBodies.forEach((wb: any) => {
      console.log('wb', wb);
      results.push({
        type: wb.section ? 'section' : 'shared',
        id: wb.sharedWaterBodySectionId || wb.sharedWaterBodyId || wb._id,
        name: wb.section ? `${wb.name} - ${wb.section}` : wb.name,
        sharedWaterBody: {
          _id: wb.sharedWaterBodyId || wb._id,
          name: wb.name,
          location: { type: 'Point', coordinates: [0, 0] }
        },
        section: wb.section ? {
          _id: wb.sharedWaterBodySectionId,
          sharedWaterBody: wb.sharedWaterBodyId || wb._id,
          sectionName: wb.section,
          location: { type: 'Point', coordinates: [0, 0] }
        } : undefined,
        distance: wb.distance // Backend may provide distance
      });
    });

    // Sort by distance if available (closest first)
    results.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });

    console.log('✨ searchCombined returning:', results.length, 'results');
    return results;
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
