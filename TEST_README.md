# Paddle Partner Mobile - Test Suite

This directory contains tests for the Paddle Partner mobile application.

## Test Structure

```
__tests__/
├── createActivityFlow.test.tsx    # Integration test for activity creation
src/
├── services/__tests__/
│   └── activityService.test.ts    # Unit tests for activity service
└── screens/__tests__/
    └── HomeScreen.test.tsx         # Component tests for HomeScreen
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- HomeScreen.test.tsx
```

## Test Coverage

The test suite covers:

### 1. **Activity Service Tests** (`src/services/__tests__/activityService.test.ts`)
- ✅ Fetching activities with pagination
- ✅ Fetching activities from followed users
- ✅ Creating manual activities
- ✅ Getting single activity details
- ✅ Updating activities
- ✅ Deleting activities
- ✅ Selecting water bodies for activities
- ✅ Error handling for all operations

### 2. **HomeScreen Component Tests** (`src/screens/__tests__/HomeScreen.test.tsx`)
- ✅ Rendering activities in the feed
- ✅ Displaying water body information
- ✅ Formatting dates and distances
- ✅ Loading states
- ✅ Tab switching (Following vs My Activities)
- ✅ Opening create activity modal
- ✅ Pull to refresh functionality
- ✅ Pagination (load more on scroll)
- ✅ Activity detail navigation
- ✅ User information display
- ✅ Error handling

### 3. **Create Activity Flow Integration Test** (`__tests__/createActivityFlow.test.tsx`)
- ✅ Complete activity creation flow
- ✅ Location fetching
- ✅ Water body search
- ✅ Water body selection
- ✅ Activity confirmation and creation
- ✅ Feed refresh after creation
- ✅ Error handling during creation
- ✅ Canceling the create flow

## Setup

The tests use:
- **Jest** - Test framework
- **React Native Testing Library** - Component testing utilities
- **jest-expo** - Expo preset for Jest

### Mocked Dependencies

The following are mocked in `jest.setup.js`:
- `@react-native-async-storage/async-storage`
- `expo-location`
- `react-native-maps`
- `@react-native-google-signin/google-signin`

## Writing New Tests

### Example: Testing a Service

```typescript
import activityService from '../activityService'
import api from '../api'

jest.mock('../api')

describe('myNewService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should do something', async () => {
    ;(api.get as jest.Mock).mockResolvedValue({ data: { success: true } })
    
    const result = await activityService.someMethod()
    
    expect(result.success).toBe(true)
  })
})
```

### Example: Testing a Component

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />)
    
    expect(getByText('Expected Text')).toBeTruthy()
  })

  it('should handle button press', async () => {
    const onPress = jest.fn()
    const { getByTestId } = render(<MyComponent onPress={onPress} />)
    
    fireEvent.press(getByTestId('my-button'))
    
    await waitFor(() => {
      expect(onPress).toHaveBeenCalled()
    })
  })
})
```

## Best Practices

1. **Use testID for elements** - Add `testID` props to important elements for easier selection
2. **Mock external dependencies** - Always mock API calls, location services, etc.
3. **Test user interactions** - Focus on how users interact with the app
4. **Test error states** - Verify error handling and edge cases
5. **Keep tests isolated** - Each test should be independent
6. **Use descriptive names** - Test names should clearly describe what is being tested

## Continuous Integration

Tests run automatically on:
- Pull requests
- Merges to main branch
- Pre-deployment checks

## Troubleshooting

### Tests fail with module not found errors
```bash
npm install
```

### Tests timeout
Increase Jest timeout in `package.json`:
```json
"jest": {
  "testTimeout": 10000
}
```

### Mock not working
Make sure mocks are defined before imports:
```typescript
jest.mock('../module')
import { something } from '../module'
```
