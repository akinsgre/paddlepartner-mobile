/**
 * Paddle Type Service for Paddle Partner Mobile
 * Handles paddle type-related API calls
 */

import api from './api'
import { PaddleType } from '../types'

export const paddleTypeService = {
  /**
   * Get all available paddle types
   */
  async getAllPaddleTypes(): Promise<PaddleType[]> {
    const response = await api.get('/users/paddle-types')
    return response.data.data
  },

  /**
   * Get user's selected paddle type preferences
   * Returns array of paddle type names (e.g., ['whitewater', 'flat water'])
   */
  async getUserPaddleTypePreferences(): Promise<string[]> {
    const response = await api.get('/users/paddle-type-preferences')
    return response.data.data || []
  },

  /**
   * Get paddle types filtered by user's preferences
   * If user has no preferences, returns all types
   */
  async getUserPaddleTypes(): Promise<PaddleType[]> {
    try {
      const [allTypes, selectedNames] = await Promise.all([
        this.getAllPaddleTypes(),
        this.getUserPaddleTypePreferences()
      ])

      // If no preferences set, return all types
      if (!selectedNames || selectedNames.length === 0) {
        return allTypes
      }

      // Filter to only selected types
      return allTypes.filter(type => selectedNames.includes(type.name))
    } catch (error) {
      console.error('Failed to fetch user paddle types:', error)
      // Fallback to all types on error
      return this.getAllPaddleTypes()
    }
  }
}

export default paddleTypeService
