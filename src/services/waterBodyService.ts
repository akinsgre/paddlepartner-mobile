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
    coordinates: [number, number]
  }
  sections?: SharedWaterBodySection[]
}

export interface SharedWaterBodySection {
  _id: string
  sharedWaterBody: string | SharedWaterBody
  sectionName: string
  location: {
    type: string
    coordinates: [number, number]
  }
}

export interface WaterBodySearchResult {
  type: 'shared' | 'section'
  id: string
  name: string
  distance?: number
  sharedWaterBody?: SharedWaterBody
  section?: SharedWaterBodySection
}

export interface OSMStatus {
  success: boolean
  error?: string
  candidateCount: number
}

export interface WaterBodySearchResponse {
  results: WaterBodySearchResult[]
  osmStatus?: OSMStatus
}

export const waterBodyService = {
  async searchNearby(latitude: number, longitude: number, radiusKm: number = 50): Promise<any[]> {
    const response = await api.get('/shared-water-bodies/by-coordinates', {
      params: {
        latitude,
        longitude,
        maxDistance: radiusKm * 1000
      }
    })
    return response.data.waterBodies || []
  },

  async getAllWaterBodies(): Promise<SharedWaterBody[]> {
    const response = await api.get('/shared-water-bodies')
    return response.data.waterBodies || []
  },

  async searchByName(query: string): Promise<any[]> {
    console.log('🔍 searchByName called with query:', query);
    const response = await api.get('/shared-water-bodies/search', {
      params: { q: query }
    })
    return response.data.waterBodies || []
  },

  async searchCombined(
    latitude: number,
    longitude: number,
    query?: string,
    isMapSelected: boolean = false
  ): Promise<WaterBodySearchResponse> {
    const results: WaterBodySearchResult[] = [];
    console.log('🌊 searchCombined called:', { latitude, longitude, query, isMapSelected });

    let candidates: any[] = [];
    let osmStatus: OSMStatus | undefined;
    
    if (query) {
      console.log('🔍 Searching by name due to query:', query);
      const response = await api.get('/shared-water-bodies/search', {
        params: { q: query }
      });
      candidates = response.data.waterBodies || [];
      osmStatus = response.data.osmStatus;
      console.log('🔍 searchByName returned:', candidates.length, 'results');
    } else {
      const response = await api.get('/shared-water-bodies/by-coordinates', {
        params: {
          latitude,
          longitude,
          isMapSelected: isMapSelected.toString()
        }
      });
      candidates = response.data.waterBodies || [];
      osmStatus = response.data.osmStatus;
      console.log('📍 searchNearby returned:', candidates.length, 'results');
    }

    candidates.forEach((candidate: any) => {
      console.log('Processing candidate:', candidate);
      
      // Handle both response formats:
      // - Location search: waterBodyId, sectionId, sectionName
      // - Name search: sharedWaterBodyId, sectionId, section
      const waterBodyId = candidate.waterBodyId || candidate.sharedWaterBodyId;
      const sectionId = candidate.sectionId;
      const sectionName = candidate.sectionName || candidate.section;
      
      if (sectionName && sectionId) {
        // SharedWaterBody section
        results.push({
          type: 'section',
          id: sectionId, // MongoDB ObjectId - unique
          name: `${candidate.name} - ${sectionName}`,
          sharedWaterBody: {
            _id: waterBodyId,
            name: candidate.name,
            location: { type: 'Point', coordinates: candidate.coordinates || candidate.sectionCoordinates || [0, 0] }
          },
          section: {
            _id: sectionId,
            sharedWaterBody: waterBodyId,
            sectionName: sectionName,
            location: { type: 'Point', coordinates: candidate.coordinates || candidate.sectionCoordinates || [0, 0] }
          },
          distance: candidate.distance
        });
      } else if (candidate.osmId) {
        // OSM candidate - use osmId + osmType for uniqueness
        results.push({
          type: 'shared',
          id: `osm-${candidate.osmType}-${candidate.osmId}`, // Unique OSM identifier
          name: candidate.name,
          sharedWaterBody: {
            _id: candidate.osmId?.toString() || '',
            name: candidate.name,
            location: { type: 'Point', coordinates: candidate.coordinates || [0, 0] }
          },
          distance: candidate.distance
        });
      } else if (waterBodyId) {
        // SharedWaterBody without section
        results.push({
          type: 'shared',
          id: waterBodyId, // MongoDB ObjectId - unique
          name: candidate.name,
          sharedWaterBody: {
            _id: waterBodyId,
            name: candidate.name,
            location: { type: 'Point', coordinates: candidate.coordinates || [0, 0] }
          },
          distance: candidate.distance
        });
      }
    });

    results.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return 0;
    });

    console.log('✨ searchCombined returning:', results.length, 'results', osmStatus ? `(OSM: ${osmStatus.success ? 'success' : 'failed'})` : '');
    return { results, osmStatus };
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  },

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`
    } else {
      return `${(meters / 1000).toFixed(1)}km`
    }
  },
}

export default waterBodyService
