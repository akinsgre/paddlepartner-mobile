/**
 * Authentication Service for Paddle Partner Mobile
 * Handles Google OAuth and JWT authentication
 */

import * as WebBrowser from 'expo-web-browser'
import api, { tokenManager, userManager } from './api'
import { AuthResponse, User } from '../types'

// Warm up the browser for better UX
WebBrowser.maybeCompleteAuthSession()

export const authService = {
  /**
   * Authenticate with Google using browser-based OAuth flow
   * This works with Expo Go by using a backend OAuth proxy
   */
  async loginWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Step 1: Initialize OAuth session on backend
      const initResponse = await api.get('/auth/mobile/google/init')
      
      if (!initResponse.data.success) {
        return { success: false, error: 'Failed to initialize authentication' }
      }
      
      const { sessionId, authUrl } = initResponse.data
      
      // Step 2: Open browser for user to authenticate
      const result = await WebBrowser.openAuthSessionAsync(authUrl, undefined)
      
      if (result.type === 'cancel') {
        return { success: false, error: 'Authentication cancelled' }
      }
      
      // Step 3: Poll backend for authentication result
      const maxAttempts = 30 // 30 seconds max
      const pollInterval = 1000 // 1 second
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        
        const statusResponse = await api.get(`/auth/mobile/google/status/${sessionId}`)
        
        if (statusResponse.data.status === 'success') {
          // Authentication successful!
          const { token, user } = statusResponse.data
          
          // Store JWT token and user data
          await tokenManager.setToken(token)
          await userManager.setUser(user)
          
          return { success: true, user }
        }
        
        if (statusResponse.data.status === 'error') {
          return {
            success: false,
            error: statusResponse.data.message || statusResponse.data.error || 'Authentication failed'
          }
        }
        
        // Status is still 'pending', continue polling
      }
      
      // Timeout
      return { success: false, error: 'Authentication timeout - please try again' }
      
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  },

  /**
   * Authenticate with Google JWT token (legacy method for web)
   */
  async googleAuth(googleToken: string): Promise<AuthResponse> {
    const response = await api.post('/auth/google', { token: googleToken })
    
    if (response.data.success && response.data.token) {
      // Store JWT token and user data
      await tokenManager.setToken(response.data.token)
      if (response.data.user) {
        await userManager.setUser(response.data.user)
      }
    }
    
    return response.data
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me')
    if (response.data && response.data.user) {
      await userManager.setUser(response.data.user)
      return response.data.user
    }
    return response.data
  },

  /**
   * Logout - clear local storage
   */
  async logout(): Promise<void> {
    await tokenManager.removeToken()
    await userManager.removeUser()
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await tokenManager.getToken()
    return token !== null
  },

  /**
   * Get stored user data
   */
  async getStoredUser(): Promise<User | null> {
    return await userManager.getUser()
  },
}

export default authService
