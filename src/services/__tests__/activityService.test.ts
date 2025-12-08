/**
 * Tests for activityService
 * Verifies API calls for creating, fetching, and managing activities
 */

import activityService from '../activityService'
import api from '../api'

// Mock the api module
jest.mock('../api')

describe('activityService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getActivities', () => {
    it('should fetch activities with pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          activities: [
            {
              _id: '1',
              name: 'Morning Paddle',
              sportType: 'Kayaking',
              distance: 5000,
              movingTime: 3600,
              startDate: '2025-12-08T10:00:00Z',
            },
            {
              _id: '2',
              name: 'Evening Paddle',
              sportType: 'Kayaking',
              distance: 3000,
              movingTime: 2400,
              startDate: '2025-12-08T18:00:00Z',
            },
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalActivities: 2,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 20,
          },
        },
      }

      ;(api.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await activityService.getActivities({ page: 1, limit: 20 })

      expect(api.get).toHaveBeenCalledWith('/activities', {
        params: { page: 1, limit: 20 },
      })
      expect(result.activities).toHaveLength(2)
      expect(result.activities[0].name).toBe('Morning Paddle')
    })

    it('should handle errors when fetching activities', async () => {
      const error = new Error('Network error')
      ;(api.get as jest.Mock).mockRejectedValue(error)

      await expect(activityService.getActivities()).rejects.toThrow('Network error')
    })
  })

  describe('getFollowingActivities', () => {
    it('should fetch activities from followed users', async () => {
      const mockResponse = {
        data: {
          success: true,
          count: 3,
          total: 3,
          page: 1,
          pages: 1,
          activities: [
            {
              _id: '1',
              name: 'Friend Activity 1',
              userId: { _id: 'user1', name: 'Friend 1' },
              sportType: 'Kayaking',
            },
            {
              _id: '2',
              name: 'My Activity',
              userId: { _id: 'current-user', name: 'Me' },
              sportType: 'Kayaking',
            },
          ],
        },
      }

      ;(api.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await activityService.getFollowingActivities({ page: 1, limit: 20 })

      expect(api.get).toHaveBeenCalledWith('/activities/following/feed?page=1&limit=20')
      expect(result.activities).toHaveLength(2)
    })
  })

  describe('createManualActivity', () => {
    it('should create a manual activity successfully', async () => {
      const mockActivity = {
        _id: 'new-activity-id',
        name: 'Test Paddle',
        sportType: 'Kayaking',
        startDate: '2025-12-08T10:00:00Z',
        distance: 0,
        movingTime: 0,
        location: {
          startLatLng: [37.7749, -122.4194],
        },
      }

      const mockResponse = {
        data: {
          success: true,
          message: 'Manual activity created successfully',
          activity: mockActivity,
        },
      }

      ;(api.post as jest.Mock).mockResolvedValue(mockResponse)

      const activityData = {
        latitude: 37.7749,
        longitude: -122.4194,
        sharedWaterBodyId: 'water-body-id',
      }

      const result = await activityService.createManualActivity(activityData)

      expect(api.post).toHaveBeenCalledWith('/activities/manual', activityData)
      expect(result.success).toBe(true)
      expect(result.activity._id).toBe('new-activity-id')
    })

    it('should handle creation errors', async () => {
      const error = new Error('Invalid location')
      ;(api.post as jest.Mock).mockRejectedValue(error)

      const activityData = {
        latitude: 37.7749,
        longitude: -122.4194,
      }

      await expect(activityService.createManualActivity(activityData)).rejects.toThrow('Invalid location')
    })
  })

  describe('getActivity', () => {
    it('should fetch a single activity by ID', async () => {
      const mockActivity = {
        _id: 'activity-123',
        name: 'Test Activity',
        sportType: 'Kayaking',
        distance: 5000,
        movingTime: 3600,
        sharedWaterBody: {
          _id: 'wb-1',
          name: 'Test River',
          section: {
            _id: 'section-1',
            name: 'Upper Section',
          },
        },
      }

      ;(api.get as jest.Mock).mockResolvedValue({
        data: mockActivity,
      })

      const result = await activityService.getActivity('activity-123')

      expect(api.get).toHaveBeenCalledWith('/activities/activity-123')
      expect(result.name).toBe('Test Activity')
      expect(result.sharedWaterBody?.name).toBe('Test River')
    })
  })

  describe('updateActivity', () => {
    it('should update an activity', async () => {
      const mockResponse = {
        data: {
          success: true,
          activity: {
            _id: 'activity-123',
            name: 'Updated Activity',
            notes: 'Great paddle today!',
          },
        },
      }

      ;(api.put as jest.Mock).mockResolvedValue(mockResponse)

      const updates = {
        name: 'Updated Activity',
        notes: 'Great paddle today!',
      }

      const result = await activityService.updateActivity('activity-123', updates)

      expect(api.put).toHaveBeenCalledWith('/activities/activity-123', updates)
      expect(result.success).toBe(true)
      expect(result.activity.name).toBe('Updated Activity')
    })
  })

  describe('deleteActivity', () => {
    it('should delete an activity', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Activity deleted successfully',
        },
      }

      ;(api.delete as jest.Mock).mockResolvedValue(mockResponse)

      const result = await activityService.deleteActivity('activity-123')

      expect(api.delete).toHaveBeenCalledWith('/activities/activity-123')
      expect(result.success).toBe(true)
    })
  })

  describe('selectWaterBody', () => {
    it('should select a water body for an activity', async () => {
      const mockResponse = {
        data: {
          success: true,
          activity: {
            _id: 'activity-123',
            sharedWaterBody: {
              _id: 'wb-1',
              name: 'Test River',
            },
          },
        },
      }

      ;(api.post as jest.Mock).mockResolvedValue(mockResponse)

      const waterBodyData = {
        sharedWaterBodyId: 'wb-1',
        sharedWaterBodySectionId: 'section-1',
      }

      const result = await activityService.selectWaterBody('activity-123', waterBodyData)

      expect(api.post).toHaveBeenCalledWith(
        '/activities/activity-123/select-water-body',
        waterBodyData
      )
      expect(result.success).toBe(true)
    })
  })
})
