/**
 * Water Body Service Tests
 * Tests for searching and managing water bodies
 */

import { waterBodyService } from '../waterBodyService';
import api from '../api';

jest.mock('../api');

describe('waterBodyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchCombined', () => {
    it('should search water bodies by coordinates without query', async () => {
      const mockResponse = {
        data: {
          waterBodies: [
            {
              waterBodyId: 'wb-123',
              name: 'French Broad River',
              coordinates: [-82.82698, 35.886272],
              distance: 100,
              source: 'shared_database',
            },
            {
              osmId: '456',
              osmType: 'way',
              name: 'Nolichucky River',
              coordinates: [-82.5, 35.9],
              distance: 5000,
              source: 'openstreetmap',
            },
          ],
          osmStatus: {
            success: true,
            candidateCount: 1,
          },
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await waterBodyService.searchCombined(35.886272, -82.82698);

      expect(api.get).toHaveBeenCalledWith('/shared-water-bodies/by-coordinates', {
        params: {
          latitude: 35.886272,
          longitude: -82.82698,
          maxDistance: 50000,
        },
      });

      expect(result.results).toHaveLength(2);
      // Community data should come first
      expect(result.results[0].source).toBe('shared_database');
      expect(result.results[1].source).toBe('openstreetmap');
      expect(result.osmStatus).toEqual({
        success: true,
        candidateCount: 1,
      });
    });

    it('should search water bodies by name with query', async () => {
      const mockResponse = {
        data: {
          waterBodies: [
            {
              waterBodyId: 'wb-123',
              name: 'French Broad River',
              coordinates: [-82.82698, 35.886272],
              source: 'shared_database',
            },
          ],
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await waterBodyService.searchCombined(
        35.886272,
        -82.82698,
        'French Broad'
      );

      expect(api.get).toHaveBeenCalledWith('/shared-water-bodies/search', {
        params: { q: 'French Broad' },
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('French Broad River');
    });

    it('should handle sections correctly', async () => {
      const mockResponse = {
        data: {
          waterBodies: [
            {
              waterBodyId: 'wb-123',
              sectionId: 'section-456',
              sectionName: 'Upper Section',
              name: 'French Broad River',
              coordinates: [-82.82698, 35.886272],
              source: 'shared_database',
            },
          ],
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await waterBodyService.searchCombined(35.886272, -82.82698);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].type).toBe('section');
      expect(result.results[0].name).toBe('French Broad River - Upper Section');
      expect(result.results[0].section?.name).toBe('Upper Section');
    });

    it('should sort community data before OSM data', async () => {
      const mockResponse = {
        data: {
          waterBodies: [
            {
              osmId: '789',
              osmType: 'way',
              name: 'OSM River',
              coordinates: [-82.5, 35.9],
              distance: 100, // Closer
              source: 'openstreetmap',
            },
            {
              waterBodyId: 'wb-123',
              name: 'Community River',
              coordinates: [-82.82698, 35.886272],
              distance: 1000, // Farther
              source: 'shared_database',
            },
          ],
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await waterBodyService.searchCombined(35.886272, -82.82698);

      // Community data should be first despite being farther
      expect(result.results[0].source).toBe('shared_database');
      expect(result.results[0].name).toBe('Community River');
      expect(result.results[1].source).toBe('openstreetmap');
      expect(result.results[1].name).toBe('OSM River');
    });
  });

  describe('formatDistance', () => {
    it('should format distances less than 1km in meters', () => {
      expect(waterBodyService.formatDistance(100)).toBe('100m');
      expect(waterBodyService.formatDistance(999)).toBe('999m');
    });

    it('should format distances 1km or more in kilometers', () => {
      expect(waterBodyService.formatDistance(1000)).toBe('1.0km');
      expect(waterBodyService.formatDistance(1500)).toBe('1.5km');
      expect(waterBodyService.formatDistance(10250)).toBe('10.3km');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      // Distance between two known points (approximately 5km apart)
      const distance = waterBodyService.calculateDistance(
        35.886272,
        -82.82698,
        35.9,
        -82.8
      );

      expect(distance).toBeGreaterThan(2000);
      expect(distance).toBeLessThan(5000);
    });

    it('should return 0 for same coordinates', () => {
      const distance = waterBodyService.calculateDistance(
        35.886272,
        -82.82698,
        35.886272,
        -82.82698
      );

      expect(distance).toBeLessThan(1); // Should be effectively 0
    });
  });
});
