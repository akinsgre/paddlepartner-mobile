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
      console.log('🔐 Step 1: Initializing OAuth session...')
      // Step 1: Initialize OAuth session on backend
      const initResponse = await api.get('/auth/mobile/google/init')
      
      if (!initResponse.data.success) {
        console.error('❌ Failed to initialize auth session')
        return { success: false, error: 'Failed to initialize authentication' }
      }
      
      const { sessionId, authUrl } = initResponse.data
      console.log('✅ Session initialized:', sessionId)
      console.log('🌐 Opening browser for OAuth...')
      
      // Step 2: Open browser for user to authenticate
      // Don't pass redirectUrl - let user see success page and manually close browser
      // The backend will update the session, and we'll poll for the result
      const result = await WebBrowser.openAuthSessionAsync(authUrl)
      
      console.log('📱 Browser result:', result.type)
      
      if (result.type === 'cancel') {
        console.log('⚠️ User closed browser - checking if auth completed...')
        // Don't return immediately - user might have completed auth before closing
        // We'll check the session status below
      }
      
      // Step 3: Poll backend for authentication result
      console.log('⏳ Polling for auth result...')
      const maxAttempts = 30 // 30 seconds max
      const pollInterval = 1000 // 1 second
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        
        console.log(`🔄 Poll attempt ${attempt + 1}/${maxAttempts}`)
        const statusResponse = await api.get(`/auth/mobile/google/status/${sessionId}`)
        console.log('📊 Status response:', statusResponse.data.status)
        
        if (statusResponse.data.status === 'success') {
          // Authentication successful!
          console.log('✅ Authentication successful!')
          const { token, user } = statusResponse.data
          
          // Store JWT token and user data
          await tokenManager.setToken(token)
          await userManager.setUser(user)
          
          return { success: true, user }
        }
        
        if (statusResponse.data.status === 'error') {
          console.error('❌ Auth error:', statusResponse.data.error, statusResponse.data.message)
          return {
            success: false,
            error: statusResponse.data.message || statusResponse.data.error || 'Authentication failed'
          }
        }
        
        // Status is still 'pending', continue polling
      }
      
      // Timeout
      console.error('⏱️ Authentication timeout')
      return { success: false, error: 'Authentication timeout - please try again' }
      
    } catch (error) {
      console.error('💥 Login error:', error)
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
