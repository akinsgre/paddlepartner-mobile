# Google OAuth Setup for Mobile App

## Current Status - Google OAuth Limitations with Expo Go

**IMPORTANT:** Google OAuth does not work reliably with Expo Go due to Google's security policies around redirect URIs. This is a known limitation documented in [this GitHub issue](https://github.com/better-auth/better-auth/issues/3781).

### Why It Doesn't Work
- Google requires redirect URIs to end with a public top-level domain (.com, .org, etc.)
- Expo Go uses `auth.expo.io` as a proxy, which Google now blocks in many cases
- Custom URI schemes (like `paddlepartner://`) are not accepted by Google

### Solutions

**For Development (Now):**
- Use the web app at https://main.d14w75hfq3itx3.amplifyapp.com/
- The mobile app UI is ready but authentication requires the web app

**For Production (Later):**
1. Build a standalone Expo app with `npx eas build`
2. Configure native Google Sign-In with proper iOS/Android credentials
3. Register your app's bundle identifier/package name in Google Console

## Setup Instructions

### 1. Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing "Paddle Partner" project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your existing OAuth 2.0 Client ID (`79587302091-o7k04lglgsmbmscugvbnmbg7laeoqhqo`)

### 2. Add Mobile Redirect URIs

**CRITICAL:** Google requires you to add the Expo redirect URI to your OAuth client:

1. In Google Cloud Console, click on your OAuth 2.0 Client ID
2. Scroll to **Authorized redirect URIs**
3. Click **+ ADD URI**
4. Add this URI:
   ```
   https://auth.expo.io/@anonymous/paddlepartner-mobile
   ```
5. Click **SAVE**

**Important:** The URI must be exactly as shown above (no typos or extra characters).

**Alternative (if logged into Expo):**
- If you have an Expo account, use:
  ```
  https://auth.expo.io/@YOUR_EXPO_USERNAME/paddlepartner-mobile
  ```
  Replace `YOUR_EXPO_USERNAME` with your username from `npx expo whoami`

**Why this is required:**
- Google's OAuth policy requires all redirect URIs to be pre-registered
- Expo uses `auth.expo.io` as a proxy to handle OAuth redirects back to your app
- Without this URI, Google will block the sign-in attempt with the error: "Authorization Error - doesn't comply with Google's OAuth 2.0 policy"

### 3. For Production Apps (Later)

When you build standalone iOS/Android apps, you'll need to:

**iOS:**
1. Create a new OAuth Client ID (type: iOS)
2. Add bundle identifier: `com.paddlepartner.mobile`
3. Copy the iOS Client ID to `.env` → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

**Android:**
1. Create a new OAuth Client ID (type: Android)
2. Add package name: `com.paddlepartner.mobile`
3. Add SHA-1 certificate fingerprint (from Expo build)
4. Copy the Android Client ID to `.env` → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

## Current Configuration

The app is using:
- **Client ID**: `79587302091-o7k04lglgsmbmscugvbnmbg7laeoqhqo` (shared with web app)
- **Auth Redirect Scheme**: `paddlepartner://`
- **Bundle ID (iOS)**: `com.paddlepartner.mobile`
- **Package Name (Android)**: `com.paddlepartner.mobile`

## Testing

Once you've added the redirect URI to Google Console:

1. Restart the Expo app: Press `r` in the terminal or shake your device
2. Tap "Continue with Google"
3. Complete the Google sign-in flow
4. You should be redirected back to the app

## Troubleshooting

**"redirect_uri_mismatch" error:**
- The redirect URI in Google Console doesn't match the one used by the app
- Make sure you've added the exact URI shown above
- It can take a few minutes for Google Console changes to propagate

**"invalid_client" error:**
- The Client ID in `.env` doesn't match your Google Console configuration
- Verify the Client ID is correct in both places

**App doesn't redirect back after sign-in:**
- Check that `app.json` has the correct `scheme: "paddlepartner"`
- Restart the Expo app completely
