/**
 * Share Service for Paddle Partner Mobile
 * Handles activity sharing to social platforms via native share sheet
 */

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import api from './api';

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
      const response = await api.get(`/activities/${options.activityId}/share-image`);
      
      if (!response.data.success) {
        return {
          success: false,
          error: 'Failed to generate share image'
        };
      }

      // TODO: Phase 2 - Download actual generated image
      // For now, use placeholder URL from backend
      const imageUrl = response.data.placeholderUrl;
      
      console.log('⬇️ Downloading share image...');
      const fileUri = FileSystem.cacheDirectory + `share-${options.activityId}.png`;
      
      // Download image to local cache
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
      
      if (downloadResult.status !== 200) {
        return {
          success: false,
          error: 'Failed to download share image'
        };
      }

      console.log('📱 Opening share sheet...');
      
      // Open native share sheet
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
      return {
        success: false,
        error: error.message || 'Failed to share activity'
      };
    }
  }
};

export default shareService;
