import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { formatDistance } from '../utils/unitConversion';
import { authService, shareService } from '../services';
import type { Activity } from '../types';

interface ActivityDetailScreenProps {
  activity: Activity;
  onBack: () => void;
}

export default function ActivityDetailScreen({ activity, onBack }: ActivityDetailScreenProps) {
  const [userUnits, setUserUnits] = useState<'metric' | 'imperial'>('imperial');
  const [isSharing, setIsSharing] = useState(false);
  const [currentUserGoogleId, setCurrentUserGoogleId] = useState<string | null>(null);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  const loadUserPreferences = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user?.preferences?.units) {
        setUserUnits(user.preferences.units);
      }
      if (user?.googleId) {
        setCurrentUserGoogleId(user.googleId);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  };

  // Check if current user owns this activity
  const isOwnActivity = currentUserGoogleId && activity.userGoogleId === currentUserGoogleId;

  const handleShare = async () => {
    console.log('🔵 Share button pressed! Activity ID:', activity._id);
    
    if (!activity._id) {
      console.log('❌ No activity ID');
      Alert.alert('Error', 'Cannot share this activity');
      return;
    }

    console.log('🟢 Starting share process...');
    try {
      setIsSharing(true);
      console.log('📤 Calling shareService...');
      
      const result = await shareService.shareActivity({
        activityId: activity._id,
        activityName: activity.name
      });

      console.log('✅ Share result:', result);

      if (!result.success) {
        console.log('⚠️ Share failed:', result.error);
        Alert.alert('Share Failed', result.error || 'Unable to share activity');
      }
    } catch (error: any) {
      console.error('💥 Share error:', error);
      Alert.alert('Share Failed', error.message || 'Unable to share activity');
    } finally {
      setIsSharing(false);
      console.log('🏁 Share process completed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Details</Text>
        {isOwnActivity && (
          <TouchableOpacity 
            onPress={handleShare} 
            style={styles.shareButton}
            disabled={isSharing}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#0ea5e9" />
            ) : (
              <Text style={styles.shareButtonText}>📤 Share</Text>
            )}
          </TouchableOpacity>
        )}
        {!isOwnActivity && <View style={styles.shareButton} />}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Activity Name */}
        {activity.name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{activity.name}</Text>
          </View>
        )}

        {/* Water Body */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Water Body</Text>
            <Text style={styles.value}>
              {activity.sharedWaterBody?.name || 'Unknown'}
            </Text>
          </View>

          {activity.sharedWaterBody?.section?.name && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Section</Text>
              <Text style={styles.value}>{activity.sharedWaterBody.section.name}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {activity.startDate ? new Date(activity.startDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'No date'}
            </Text>
          </View>

          {activity.waterBody?.level && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Water Level</Text>
              <Text style={styles.value}>{activity.waterBody.level}</Text>
            </View>
          )}
        </View>

        {/* Activity Stats */}
        {(activity.distance > 0 || activity.movingTime > 0) && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Statistics</Text>
            
            {activity.distance > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Distance</Text>
                <Text style={styles.value}>
                  {formatDistance(activity.distance, userUnits)}
                </Text>
              </View>
            )}

            {activity.movingTime > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Moving Time</Text>
                <Text style={styles.value}>
                  {Math.floor(activity.movingTime / 3600)}h {Math.floor((activity.movingTime % 3600) / 60)}m
                </Text>
              </View>
            )}

            {(activity.averageSpeed ?? 0) > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Average Speed</Text>
                <Text style={styles.value}>
                  {activity.averageSpeed?.toFixed(2)} m/s
                </Text>
              </View>
            )}

            {(activity.maxSpeed ?? 0) > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Max Speed</Text>
                <Text style={styles.value}>
                  {activity.maxSpeed?.toFixed(2)} m/s
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Additional Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sport Type</Text>
            <Text style={styles.value}>{activity.sportType || 'Unknown'}</Text>
          </View>

          {activity.paddleType && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Paddle Type</Text>
              <Text style={styles.value}>{activity.paddleType}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.label}>Entry Type</Text>
            <Text style={styles.value}>
              {activity.manualEntry ? 'Manual' : 'Strava Sync'}
            </Text>
          </View>

          {activity.stravaId && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Strava ID</Text>
              <Text style={styles.value}>{activity.stravaId}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {activity.notes && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{activity.notes}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  shareButton: {
    padding: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0c4a6e',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});
