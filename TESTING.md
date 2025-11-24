# Paddle Partner Mobile - Test Suite

Comprehensive test suite for the Paddle Partner mobile application to prevent regression errors and ensure code quality.

## Setup

Install test dependencies:

```bash
npm install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (recommended for development)
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Test Structure

```
src/
├── services/
│   └── __tests__/
│       ├── activityService.test.ts     # Activity CRUD operations
│       └── waterBodyService.test.ts    # Water body search & sorting
└── screens/
    └── __tests__/
        └── CreateActivityConfirmScreen.test.tsx  # Activity creation UI
```

## Test Coverage

### Services Tests

#### `activityService.test.ts`
- ✅ Fetching activities with pagination
- ✅ Creating manual activities with all fields (name, notes, photo)
- ✅ Creating activities with minimal required fields
- ✅ Error handling for network failures

#### `waterBodyService.test.ts`
- ✅ Searching water bodies by coordinates
- ✅ Searching water bodies by name
- ✅ Handling sections correctly
- ✅ Sorting community data before OSM data
- ✅ Distance calculations and formatting

### Screen Tests

#### `CreateActivityConfirmScreen.test.tsx`
- ✅ Rendering all form fields (name, water body, level, photo, notes)
- ✅ Pre-populating activity name with water body name
- ✅ Editing activity fields
- ✅ Photo picker functionality (camera & gallery)
- ✅ Photo thumbnail display and removal
- ✅ Creating activities with all fields
- ✅ Error handling for failed activity creation
- ✅ OSM water body handling with section input
- ✅ Navigation (back button)

## Coverage Thresholds

Minimum coverage requirements:
- **Branches:** 50%
- **Functions:** 50%
- **Lines:** 50%
- **Statements:** 50%

## Mocked Modules

The test suite mocks the following native modules:
- `@react-native-async-storage/async-storage` - Local storage
- `expo-location` - GPS location services
- `expo-image-picker` - Camera and photo library access
- `@react-native-google-signin/google-signin` - Google OAuth
- `fetch` and `FileReader` - Photo base64 conversion

## Key Testing Patterns

### Testing Service Functions
```typescript
it('should create activity with all fields', async () => {
  (api.post as jest.Mock).mockResolvedValue(mockResponse);
  
  const result = await activityService.createManualActivity(data);
  
  expect(api.post).toHaveBeenCalledWith('/activities/manual', data);
  expect(result).toEqual(mockResponse.data);
});
```

### Testing React Native Components
```typescript
it('should render form fields', () => {
  const { getByText, getByPlaceholderText } = render(<Screen {...props} />);
  
  expect(getByText('Activity Name')).toBeTruthy();
  expect(getByPlaceholderText('Name your paddle')).toBeTruthy();
});
```

### Testing User Interactions
```typescript
it('should update field on text change', () => {
  const { getByPlaceholderText } = render(<Screen {...props} />);
  
  const input = getByPlaceholderText('Name your paddle');
  fireEvent.changeText(input, 'New name');
  
  expect(input.props.value).toBe('New name');
});
```

## Continuous Integration

Tests run automatically on:
- Pre-commit (via git hooks, if configured)
- Pull requests
- Main branch pushes

## Troubleshooting

### Tests fail with "Cannot find module"
```bash
npm install
```

### Tests timeout
Increase Jest timeout in `jest.config.js`:
```javascript
testTimeout: 10000
```

### Mock issues
Clear Jest cache:
```bash
npx jest --clearCache
```

## Adding New Tests

1. Create test file next to the code being tested:
   - Services: `src/services/__tests__/yourService.test.ts`
   - Screens: `src/screens/__tests__/YourScreen.test.tsx`

2. Follow the existing patterns:
   - Use `describe` blocks to group related tests
   - Use `beforeEach` to reset mocks
   - Use clear, descriptive test names
   - Test both success and error cases

3. Run tests to verify:
```bash
npm test
```

## Future Test Additions

- [ ] Authentication flow tests
- [ ] Navigation tests
- [ ] HomeScreen tests
- [ ] Integration tests with real API calls (optional)
- [ ] E2E tests with Detox (optional)
