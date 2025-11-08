/**
 * API Client for Paddle Partner Mobile
 * Handles HTTP requests with JWT token management
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import ENV from '../config/environment'

// Storage keys
const TOKEN_KEY = '@paddlepartner:token'
const USER_KEY = '@paddlepartner:user'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY)
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Error reading token from storage:', error)
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and user data
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY])
    }
    return Promise.reject(error)
  }
)

// Token management functions
export const tokenManager = {
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(TOKEN_KEY, token)
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(TOKEN_KEY)
  },

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem(TOKEN_KEY)
  },
}

// User management functions
export const userManager = {
  async setUser(user: any): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  async getUser(): Promise<any | null> {
    const userData = await AsyncStorage.getItem(USER_KEY)
    return userData ? JSON.parse(userData) : null
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY)
  },
}

export default api
