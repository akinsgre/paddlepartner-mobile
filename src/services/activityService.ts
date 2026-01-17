/**
 * Activity Service for Paddle Partner Mobile
 * Handles activity-related API calls
 */

import api from './api'
import {
  Activity,
  PaginatedResponse,
  ActivityQueryParams,
  ApiResponse,
} from '../types'

export const activityService = {
  /**
   * Get paginated activities with optional filters
   */
  async getActivities(params: ActivityQueryParams = {}): Promise<PaginatedResponse<Activity>> {
    const response = await api.get('/activities', { params })
    return response.data
  },

  /**
   * Get a single activity by ID
   */
  async getActivity(id: string): Promise<Activity> {
    const response = await api.get(`/activities/${id}`)
    return response.data
  },

  /**
   * Create a new activity
   */
  async createActivity(activity: Partial<Activity>): Promise<ApiResponse<Activity>> {
    const response = await api.post('/activities', activity)
    return response.data
  },

  /**
   * Create a manual activity with current location and selected water body
   */
  async createManualActivity(data: {
    latitude: number
    longitude: number
    sharedWaterBodyId?: string
    sectionId?: string
    sectionName?: string
    waterLevel?: string
    notes?: string
    photoUri?: string
    paddleType?: string
    distance?: number
    movingTime?: number
    startDate?: string
  }): Promise<ApiResponse<Activity>> {
    const response = await api.post('/activities/manual', data)
    return response.data
  },

  /**
   * Update an existing activity
   */
  async updateActivity(id: string, updates: Partial<Activity>): Promise<ApiResponse<Activity>> {
    const response = await api.put(`/activities/${id}`, updates)
    return response.data
  },

  /**
   * Delete an activity
   */
  async deleteActivity(id: string): Promise<ApiResponse> {
    const response = await api.delete(`/activities/${id}`)
    return response.data
  },

  /**
   * Select water body for activity
   */
  async selectWaterBody(
    activityId: string,
    data: {
      sectionId?: string
      sharedWaterBodyId?: string
      waterBody?: any
    }
  ): Promise<ApiResponse<Activity>> {
    const response = await api.post(`/activities/${activityId}/select-water-body`, data)
    return response.data
  },

  /**
   * Get public activities feed
   */
  async getPublicActivities(params: { page?: number; limit?: number } = {}): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    
    const response = await api.get(`/activities/public/feed?${queryParams.toString()}`)
    return response.data
  },

  /**
   * Get activities from followed users and current user
   */
  async getFollowingActivities(params: { page?: number; limit?: number } = {}): Promise<any> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    
    const response = await api.get(`/activities/following/feed?${queryParams.toString()}`)
    return response.data
  },
}

export default activityService
