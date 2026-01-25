/**
 * Share Service for Paddle Partner Mobile
 * Handles activity sharing to social platforms via native share sheet
 */

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../config/environment';

const TOKEN_KEY = '@paddlepartner:token';

export interface ShareActivityOptions {
  activityId: string;
  activityName?: string;
}

export const shareService = {
  /**
   * Share an activity to social platforms
   * Generates a share card image and opens native share sheet
   */
  async shareActivity(options: ShareActivityOptions): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📤 Starting share for activity:', options.activityId);

      // Check if sharing is available on this device
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Sharing is not available on this device'
        };
      }

      // Get share image from backend
      console.log('🖼️ Fetching share image from backend...');
      
      // Get auth token
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }
      
      // Download image directly to file using FileSystem
      const fileUri = FileSystem.cacheDirectory + `share-${options.activityId}.png`;
      const downloadUrl = `${ENV.API_BASE_URL}/activities/${options.activityId}/share-image`;
      
      console.log('📍 Download URL:', downloadUrl);
      console.log('⬇️ Saving to:', fileUri);
      
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('📦 Download status:', downloadResult.status);
      console.log('📦 Download URI:', downloadResult.uri);
      
      // Check file info
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log('📄 File exists:', fileInfo.exists);
      console.log('📄 File size:', fileInfo.size);
      console.log('📄 File URI:', fileInfo.uri);
      
      if (downloadResult.status !== 200) {
        console.error('❌ Download failed with status:', downloadResult.status);
        
        // Try to read the response as text to see error message
        try {
          const errorText = await FileSystem.readAsStringAsync(fileUri);
          console.error('Error response:', errorText.substring(0, 500));
        } catch (e) {
          console.error('Could not read error response');
        }
        
        return {
          success: false,
          error: 'Failed to download share image'
        };
      }

      console.log('📱 Opening share sheet with image...');
      
      // Open native share sheet with image (Instagram will show "Add to Story" option)
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'image/png',
        dialogTitle: options.activityName || 'Share Activity'
      });

      // Clean up cached file after sharing
      try {
        await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up share file:', cleanupError);
      }

      console.log('✅ Share completed successfully');
      return { success: true };

    } catch (error: any) {
      console.error('💥 Share error:', error);
      console.error('💥 Error response:', error.response?.data);
      console.error('💥 Error status:', error.response?.status);
      
      let errorMessage = 'Failed to share activity';
      
      if (error.response?.status === 404) {
        errorMessage = 'Activity not found. Please try refreshing.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
};

export default shareService;
