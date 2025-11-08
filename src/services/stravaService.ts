/**
 * Strava Service for Paddle Partner Mobile
 * Handles Strava integration and activity syncing
 */

import api from './api'
import { StravaAuthResponse, StravaSyncResponse } from '@paddlepartner/shared'

export const stravaService = {
  /**
   * Exchange Strava authorization code for tokens
   */
  async exchangeToken(code: string, redirectUri: string): Promise<StravaAuthResponse> {
    const response = await api.post('/strava/exchange-token', {
      code,
      redirectUri,
    })
    return response.data
  },

  /**
   * Get Strava connection status
   */
  async getConnectionStatus(): Promise<{
    success: boolean
    isConnected: boolean
    isTokenValid: boolean
    athleteId?: string
    tokenExpiry?: string
  }> {
    const response = await api.get('/strava/status')
    return response.data
  },

  /**
   * Sync activities from Strava
   */
  async syncActivities(options: {
    page?: number
    per_page?: number
    sync_all?: boolean
  } = {}): Promise<StravaSyncResponse> {
    const response = await api.post('/strava/sync-activities', options)
    return response.data
  },

  /**
   * Disconnect Strava account
   */
  async disconnect(): Promise<{ success: boolean; message: string }> {
    const response = await api.delete('/strava/disconnect')
    return response.data
  },

  /**
   * Generate Strava authorization URL for mobile
   */
  generateAuthUrl(redirectUri: string): string {
    const clientId = '58115' // From your environment
    const scope = 'read,activity:read_all'
    
    return `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=force&scope=${scope}`
  },
}

export default stravaService
