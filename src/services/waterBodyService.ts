/**
 * Water Body Service for Paddle Partner Mobile
 * Handles water body-related API calls
 */

import api from './api'
import {
  parseWaterBodyCandidates,
  sortWaterBodyResults,
  calculateDistance,
  formatDistance,
  groupBySource,
  type WaterBodySearchResult,
  type WaterBodySearchResponse,
  type OSMStatus,
  type SharedWaterBody,
  type SharedWaterBodySection
} from '@paddlepartner/shared'

export type { WaterBodySearchResult, WaterBodySearchResponse, OSMStatus, SharedWaterBody, SharedWaterBodySection }

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
    query?: string
  ): Promise<WaterBodySearchResponse> {
    console.log('🌊 searchCombined called:', { latitude, longitude, query });

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
          maxDistance: 50 * 1000
        }
      });
      candidates = response.data.waterBodies || [];
      osmStatus = response.data.osmStatus;
      console.log('📍 searchNearby returned:', candidates.length, 'results');
    }

    // Use shared utility to parse and format results
    const results = parseWaterBodyCandidates(candidates);
    
    // Use shared utility to sort results
    const sortedResults = sortWaterBodyResults(results);

    console.log('✨ searchCombined returning:', sortedResults.length, 'results', osmStatus ? `(OSM: ${osmStatus.success ? 'success' : 'failed'})` : '');
    return { results: sortedResults, osmStatus };
  },

  // Re-export shared utilities for backward compatibility
  calculateDistance,
  formatDistance,
  groupBySource
}

export default waterBodyService
