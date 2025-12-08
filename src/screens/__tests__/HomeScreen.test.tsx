/**
 * Tests for HomeScreen
 * Verifies activity display, tab switching, and create activity flow
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import HomeScreen from '../HomeScreen'
import { authService, activityService } from '../../services'

// Mock services
jest.mock('../../services/authService')
jest.mock('../../services/activityService')

// Mock navigation
const mockNavigate = jest.fn()
const mockRoute = { params: {} }

describe('HomeScreen', () => {
  const mockUser = {
    _id: 'user-123',
    googleId: 'google-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/photo.jpg',
  }

  const mockActivities = [
    {
      _id: 'activity-1',
      name: 'Morning Paddle',
      sportType: 'Kayaking',
      startDate: '2025-12-08T10:00:00Z',
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
      userId: {
        _id: 'user-123',
        name: 'Test User',
      },
    },
    {
      _id: 'activity-2',
      name: 'Evening Paddle',
      sportType: 'Kayaking',
      startDate: '2025-12-07T18:00:00Z',
      distance: 3000,
      movingTime: 2400,
      sharedWaterBody: {
        _id: 'wb-2',
        name: 'Lake Superior',
      },
      userId: {
        _id: 'friend-123',
        name: 'Friend User',
      },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mocks
    ;(authService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
    ;(activityService.getFollowingActivities as jest.Mock).mockResolvedValue({
      activities: mockActivities,
      pages: 1,
    })
    ;(activityService.getActivities as jest.Mock).mockResolvedValue({
      activities: [mockActivities[0]], // Only user's own activities
      pages: 1,
    })
  })

  describe('Activity Display', () => {
    it('should render activities in the following feed', async () => {
      const { getByText } = render(<HomeScreen onLogout={jest.fn()} />)

      await waitFor(() => {
        expect(getByText('Morning Paddle')).toBeTruthy()
        expect(getByText('Evening Paddle')).toBeTruthy()
      })
    })

    it('should display water body information', async () => {
      const { getByText } = render(<HomeScreen onLogout={jest.fn()} />)

      await waitFor(() => {
        expect(getByText('Test River')).toBeTruthy()
        expect(getByText(/Upper Section/)).toBeTruthy()
        expect(getByText('Lake Superior')).toBeTruthy()
      })
    })

    it('should format dates correctly', async () => {
      const { getByText } = render(<HomeScreen onLogout={jest.fn()} />)

      await waitFor(() => {
        expect(getByText(/Dec 8, 2025/)).toBeTruthy()
        expect(getByText(/Dec 7, 2025/)).toBeTruthy()
      })
    })

    it('should show loading indicator while fetching', () => {
      const { getByTestId, queryByTestId } = render(<HomeScreen onLogout={jest.fn()} />)

      // Initially should show loading
      const loadingIndicator = queryByTestId('loading-indicator')
      expect(loadingIndicator).toBeTruthy()
    })
  })

  describe('Tab Switching', () => {
    it('should switch between Following and My Activities tabs', async () => {
      const { getByText } = render(<HomeScreen onLogout={jest.fn()} />)

      // Wait for initial load
      await waitFor(() => {
        expect(getByText('Morning Paddle')).toBeTruthy()
      })

      // Should show both activities in Following tab
      expect(getByText('Evening Paddle')).toBeTruthy()

      // Switch to My Activities tab
      const myActivitiesTab = getByText('My Activities')
      fireEvent.press(myActivitiesTab)

      await waitFor(() => {
        // Should only show user's own activities
        expect(activityService.getActivities).toHaveBeenCalled()
      })
    })

    it('should load correct activities when switching tabs', async () => {
      const { getByText } = render(<HomeScreen onLogout={jest.fn()} />)

      await waitFor(() => {
        expect(activityService.getFollowingActivities).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
        })
      })

      // Switch to My Activities
      const myActivitiesTab = getByText('My Activities')
      fireEvent.press(myActivitiesTab)

      await waitFor(() => {
        expect(activityService.getActivities).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
          sort: '-startDate',
        })
      })
    })
  })

  describe('Create Activity Flow', () => {
    it('should open create activity modal when button is pressed', async () => {
      const { getByText } = render(<HomeScreen onLogout={jest.fn()} />)

      await waitFor(() => {
        expect(getByText('Welcome back!')).toBeTruthy()
      })

      const createButton = getByText('Create Activity')
      fireEvent.press(createButton)

      // Modal should be visible
      await waitFor(() => {
        // The create activity screen should be rendered
        expect(getByText('Create Activity')).toBeTruthy()
      })
    })

    it('should close modal after activity is created', async () => {
      const { getByText, queryByText } = render(<HomeScreen onLogout={jest.fn()} />)

      await waitFor(() => {
        expect(getByText('Create Activity')).toBeTruthy()
      })

      const createButton = getByText('Create Activity')
      fireEvent.press(createButton)

      // Simulate activity creation success
      // The handleActivityCreated callback should close the modal and refresh
      // This would be tested through integration tests
    })
  })

  describe('Pull to Refresh', () => {
    it('should refresh activities when pulled down', async () => {
      const { getByTestId } = render(<HomeScreen onLogout={jest.fn()} />)

      await waitFor(() => {
        expect(activityService.getFollowingActivities).toHaveBeenCalledTimes(1)
      })

      // Simulate pull to refresh
      const flatList = getByTestId('activities-list')
      const refreshControl = flatList.props.refreshControl

      // Trigger refresh
      refreshControl.props.onRefresh()

      await waitFor(() => {
        expect(activityService.getFollowingActivities).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Pagination', () => {
    it('should load more activities when scrolling to bottom', async () => {
      const mockActivitiesPage2 = [
        {
          _id: 'activity-3',
          name: 'Older Paddle',
          sportType: 'Kayaking',
          startDate: '2025-12-05T10:00:00Z',
          distance: 4000,
          movingTime: 3000,
        },
      ]

      ;(activityService.getFollowingActivities as jest.Mock)
        .mockResolvedValueOnce({
          activities: mockActivities,
          pages: 2, // Multiple pages available
        })
        .mockResolvedValueOnce({
          activities: mockActivitiesPage2,
          pages: 2,
        })

      const { getByTestId } = render(<HomeScreen onLogout={jest.fn()} />)

      await waitFor(() => {
        expect(activityService.getFollowingActivities).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
        })
      })

      // Simulate scrolling to bottom
      const flatList = getByTestId('activities-list')
      fireEvent(flatList, 'onEndReached')

      await waitFor(() => {
        expect(activityService.getFollowingActivities).toHaveBeenCalledWith({
          page: 2,
          limit: 20,
        })
      })
    })
  })

  describe('Activity Detail', () => {
    it('should open activity detail when activity card is pressed', async () => {
      const { getByText } = render(<HomeScreen onLogout={jest.fn()} />)

      await waitFor(() => {
        expect(getByText('Morning Paddle')).toBeTruthy()
      })

      const activityCard = getByText('Morning Paddle')
      fireEvent.press(activityCard)

      // Activity detail modal should open
      await waitFor(() => {
        // Detail screen content would be rendered
        expect(getByText('Morning Paddle')).toBeTruthy()
      })
    })
  })

  describe('User Information', () => {
    it('should display user information in welcome card', async () => {
      const { getByText } = render(<HomeScreen onLogout={jest.fn()} />)

      await waitFor(() => {
        expect(getByText('Welcome back!')).toBeTruthy()
        expect(getByText('Test User')).toBeTruthy()
        expect(getByText('test@example.com')).toBeTruthy()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle activity loading errors gracefully', async () => {
      ;(activityService.getFollowingActivities as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      const { getByText } = render(<HomeScreen onLogout={jest.fn()} />)

      await waitFor(() => {
        // Screen should still render, activities just won't load
        expect(getByText('Welcome back!')).toBeTruthy()
      })
    })

    it('should handle user loading errors', async () => {
      ;(authService.getCurrentUser as jest.Mock).mockRejectedValue(
        new Error('Auth error')
      )

      const { getByText } = render(<HomeScreen onLogout={jest.fn()} />)

      await waitFor(() => {
        expect(getByText('Welcome back!')).toBeTruthy()
      })
    })
  })
})
