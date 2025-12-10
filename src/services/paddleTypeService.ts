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
    try {
      const response = await api.get('/users/paddle-types')
      const types = response.data.paddleTypes || []
      console.log(`✅ Loaded ${types.length} paddle types from server`)
      return types
    } catch (error) {
      console.error('❌ Failed to fetch all paddle types:', error)
      return []
    }
  },

  /**
   * Get user's selected paddle type preferences
   * Returns array of paddle type names (e.g., ['whitewater', 'flat water'])
   */
  async getUserPaddleTypePreferences(): Promise<string[]> {
    try {
      const response = await api.get('/users/paddle-type-preferences')
      return response.data.selectedPaddleTypes || []
    } catch (error) {
      console.error('Failed to fetch paddle type preferences:', error)
      return [] // Return empty array on error, which will trigger showing all types
    }
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

      console.log(`📊 All types: ${allTypes.length}, Selected preferences: ${selectedNames.length}`)
      
      // If API failed and returned empty, log warning but continue
      if (allTypes.length === 0) {
        console.warn('⚠️ No paddle types returned from server - this may indicate an API issue')
        return []
      }
      
      // If user has no preferences set, return ALL types (default behavior)
      if (!selectedNames || selectedNames.length === 0) {
        console.log('ℹ️ No user preferences set - showing all paddle types')
        return allTypes
      }

      // Filter to only selected types
      const filteredTypes = allTypes.filter(type => selectedNames.includes(type.name))
      console.log(`✅ Filtered to ${filteredTypes.length} paddle types based on user preferences`)
      return filteredTypes
    } catch (error) {
      console.error('❌ Failed to fetch user paddle types:', error)
      // Fallback to all types on error
      try {
        const fallbackTypes = await this.getAllPaddleTypes()
        console.log(`🔄 Fallback: returning ${fallbackTypes.length} paddle types`)
        return fallbackTypes || []
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        return []
      }
    }
  }
}

export default paddleTypeService
