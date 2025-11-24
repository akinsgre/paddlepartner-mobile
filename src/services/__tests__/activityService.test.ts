/**
 * Activity Service Tests
 * Tests for creating, fetching, and managing activities
 */

import { activityService } from '../activityService';
import api from '../api';

jest.mock('../api');

describe('activityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActivities', () => {
    it('should fetch activities with default parameters', async () => {
      const mockResponse = {
        data: {
          activities: [
            {
              _id: '1',
              name: 'Test Activity',
              startDate: '2025-11-20T00:00:00.000Z',
            },
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalActivities: 1,
          },
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await activityService.getActivities();

      expect(api.get).toHaveBeenCalledWith('/activities', {
        params: {},
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch activities with custom parameters', async () => {
      const mockResponse = {
        data: {
          activities: [],
          pagination: {
            currentPage: 2,
            totalPages: 5,
            totalActivities: 50,
          },
        },
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      await activityService.getActivities({
        page: 2,
        limit: 10,
        sort: 'startDate',
      });

      expect(api.get).toHaveBeenCalledWith('/activities', {
        params: {
          page: 2,
          limit: 10,
          sort: 'startDate',
        },
      });
    });

    it('should handle errors when fetching activities', async () => {
      const error = new Error('Network error');
      (api.get as jest.Mock).mockRejectedValue(error);

      await expect(activityService.getActivities()).rejects.toThrow('Network error');
    });
  });

  describe('createManualActivity', () => {
    it('should create a manual activity with all fields', async () => {
      const activityData = {
        name: 'Paddled French Broad River',
        latitude: 35.886272,
        longitude: -82.82698,
        sharedWaterBodyId: 'water-body-123',
        sectionName: 'Upper Section',
        waterLevel: 'Medium',
        notes: 'Great paddle today!',
        photoUri: 'data:image/jpeg;base64,mockBase64Data',
      };

      const mockResponse = {
        data: {
          success: true,
          activity: {
            _id: 'activity-123',
            ...activityData,
          },
        },
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await activityService.createManualActivity(activityData);

      expect(api.post).toHaveBeenCalledWith('/activities/manual', activityData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should create a manual activity with minimal required fields', async () => {
      const activityData = {
        latitude: 35.886272,
        longitude: -82.82698,
        sharedWaterBodyId: 'water-body-123',
      };

      const mockResponse = {
        data: {
          success: true,
          activity: {
            _id: 'activity-123',
            name: 'Paddle Session - 11/20/2025',
            ...activityData,
          },
        },
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      await activityService.createManualActivity(activityData);

      expect(api.post).toHaveBeenCalledWith('/activities/manual', activityData);
    });

    it('should handle errors when creating activity', async () => {
      const activityData = {
        latitude: 35.886272,
        longitude: -82.82698,
        sharedWaterBodyId: 'water-body-123',
      };

      const error = new Error('Failed to create activity');
      (api.post as jest.Mock).mockRejectedValue(error);

      await expect(
        activityService.createManualActivity(activityData)
      ).rejects.toThrow('Failed to create activity');
    });
  });
});
