/**
 * Integration test for Create Activity Flow
 * Tests the complete flow from opening the create dialog to activity creation
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import HomeScreen from '../src/screens/HomeScreen'
import { authService, activityService, waterBodyService } from '../src/services'

// Mock all services
jest.mock('../src/services/authService')
jest.mock('../src/services/activityService')
jest.mock('../src/services/waterBodyService')

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        altitude: null,
        accuracy: 5,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
    })
  ),
}))

describe('Create Activity Integration Flow', () => {
  const mockUser = {
    _id: 'user-123',
    googleId: 'google-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/photo.jpg',
  }

  const mockWaterBodies = [
    {
      id: 'wb-1',
      name: 'Test River',
      type: 'river',
      source: 'shared_database',
      sharedWaterBodyId: 'wb-1',
      confidence: 'high',
    },
    {
      id: 'wb-2',
      name: 'Lake Superior',
      type: 'lake',
      source: 'shared_database',
      sharedWaterBodyId: 'wb-2',
      confidence: 'high',
    },
  ]

  const mockCreatedActivity = {
    _id: 'new-activity-123',
    name: 'Test Paddle',
    sportType: 'Kayaking',
    startDate: new Date().toISOString(),
    distance: 0,
    movingTime: 0,
    sharedWaterBody: {
      _id: 'wb-1',
      name: 'Test River',
    },
    location: {
      startLatLng: [37.7749, -122.4194],
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup service mocks
    ;(authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
    ;(activityService.getFollowingActivities as jest.Mock).mockResolvedValue({
      activities: [],
      pages: 1,
    })
    ;(activityService.getActivities as jest.Mock).mockResolvedValue({
      activities: [],
      pages: 1,
    })
    ;(waterBodyService.searchWaterBodies as jest.Mock).mockResolvedValue({
      success: true,
      candidates: mockWaterBodies,
    })
    ;(activityService.createManualActivity as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Manual activity created successfully',
      activity: mockCreatedActivity,
    })
  })

  it('should complete the full create activity flow', async () => {
    const { getByText, getByTestId, queryByText } = render(
      <HomeScreen onLogout={jest.fn()} />
    )

    // Wait for home screen to load
    await waitFor(() => {
      expect(getByText('Welcome back!')).toBeTruthy()
    })

    // Step 1: Open create activity modal
    const createButton = getByTestId('create-activity-button')
    fireEvent.press(createButton)

    await waitFor(() => {
      // Modal should be visible (check for typical content)
      expect(queryByText('Create Activity')).toBeTruthy()
    })

    // Step 2: Location should be fetched automatically
    // This happens in the background via useEffect

    // Step 3: Search for water bodies
    await waitFor(() => {
      expect(waterBodyService.searchWaterBodies).toHaveBeenCalled()
    })

    // Step 4: Select a water body
    const waterBodyButton = getByText('Test River')
    fireEvent.press(waterBodyButton)

    // Step 5: Confirm and create activity
    // This would trigger the activity creation
    await waitFor(() => {
      expect(activityService.createManualActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: expect.any(Number),
          longitude: expect.any(Number),
          sharedWaterBodyId: 'wb-1',
        })
      )
    })

    // Step 6: Verify activity was created and feed was refreshed
    await waitFor(() => {
      // Activities should be reloaded
      expect(activityService.getFollowingActivities).toHaveBeenCalledTimes(2)
    })

    // Modal should be closed
    expect(queryByText('Create Activity')).toBeNull()
  })

  it('should handle errors during activity creation', async () => {
    // Mock creation to fail
    ;(activityService.createManualActivity as jest.Mock).mockRejectedValue(
      new Error('Failed to create activity')
    )

    const { getByText, getByTestId } = render(<HomeScreen onLogout={jest.fn()} />)

    await waitFor(() => {
      expect(getByText('Welcome back!')).toBeTruthy()
    })

    // Open create modal
    const createButton = getByTestId('create-activity-button')
    fireEvent.press(createButton)

    await waitFor(() => {
      expect(waterBodyService.searchWaterBodies).toHaveBeenCalled()
    })

    // Select water body and try to create
    const waterBodyButton = getByText('Test River')
    fireEvent.press(waterBodyButton)

    // Should handle error gracefully
    await waitFor(() => {
      // Error handling would display an error message or alert
      // The modal might stay open for retry
      expect(activityService.createManualActivity).toHaveBeenCalled()
    })
  })

  it('should allow canceling the create flow', async () => {
    const { getByText, getByTestId, queryByText } = render(
      <HomeScreen onLogout={jest.fn()} />
    )

    await waitFor(() => {
      expect(getByText('Welcome back!')).toBeTruthy()
    })

    // Open create modal
    const createButton = getByTestId('create-activity-button')
    fireEvent.press(createButton)

    // Wait for modal to open
    await waitFor(() => {
      expect(queryByText('Create Activity')).toBeTruthy()
    })

    // Find and press cancel button (if available)
    const cancelButton = queryByText('Cancel')
    if (cancelButton) {
      fireEvent.press(cancelButton)

      // Modal should close
      await waitFor(() => {
        expect(queryByText('Create Activity')).toBeNull()
      })
    }

    // Activity should not be created
    expect(activityService.createManualActivity).not.toHaveBeenCalled()
  })

  it('should refresh activity list after successful creation', async () => {
    const updatedActivities = [mockCreatedActivity]

    ;(activityService.getFollowingActivities as jest.Mock)
      .mockResolvedValueOnce({ activities: [], pages: 1 })
      .mockResolvedValueOnce({ activities: updatedActivities, pages: 1 })

    const { getByText, getByTestId } = render(<HomeScreen onLogout={jest.fn()} />)

    await waitFor(() => {
      expect(getByText('Welcome back!')).toBeTruthy()
    })

    // Create activity flow
    const createButton = getByTestId('create-activity-button')
    fireEvent.press(createButton)

    await waitFor(() => {
      expect(waterBodyService.searchWaterBodies).toHaveBeenCalled()
    })

    const waterBodyButton = getByText('Test River')
    fireEvent.press(waterBodyButton)

    // After successful creation, list should refresh
    await waitFor(() => {
      expect(activityService.getFollowingActivities).toHaveBeenCalledTimes(2)
    })

    // New activity should appear in the list
    await waitFor(() => {
      expect(getByText('Test Paddle')).toBeTruthy()
    })
  })
})
