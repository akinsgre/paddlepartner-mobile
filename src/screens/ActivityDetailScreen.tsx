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
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { formatDistance } from '../utils/unitConversion';
import { authService, shareService } from '../services';
import api from '../services/api';
import type { Activity } from '../types';

interface Badge {
  _id: string;
  badgeId: string;
  name: string;
  description: string;
  tier: string;
  svgIcon: string;
}

interface ActivityDetailScreenProps {
  activity: Activity;
  onBack: () => void;
}

export default function ActivityDetailScreen({ activity, onBack }: ActivityDetailScreenProps) {
  const [userUnits, setUserUnits] = useState<'metric' | 'imperial'>('imperial');
  const [isSharing, setIsSharing] = useState(false);
  const [currentUserGoogleId, setCurrentUserGoogleId] = useState<string | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  useEffect(() => {
    loadUserPreferences();
    loadBadges();
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

  const loadBadges = async () => {
    if (!activity._id) return;
    
    try {
      console.log('🏆 Loading badges for activity:', activity._id);
      const response = await api.get(`/badges/activity/${activity._id}`);
      
      // Transform UserAchievement objects to Badge objects
      const achievements = response.data || [];
      const transformedBadges = achievements
        .filter((achievement: any) => achievement.badge) // Only include if badge is populated
        .map((achievement: any) => ({
          _id: achievement.badge._id,
          badgeId: achievement.badge.badgeId || achievement.badgeId,
          name: achievement.badge.name,
          description: achievement.badge.description,
          tier: achievement.badge.tier,
          svgIcon: achievement.badge.svgIcon
        }));
      
      setBadges(transformedBadges);
      console.log('✅ Loaded badges:', transformedBadges.length);
    } catch (error) {
      console.error('Failed to load badges:', error);
      setBadges([]);
    }
  };

  // Check if current user owns this activity
  const isOwnActivity = currentUserGoogleId && activity.userGoogleId === currentUserGoogleId;
  
  // Check if activity has a photo
  const hasPhoto = !!(activity.photo?.data);

  const handleShare = async () => {
    console.log('🔵 Share button pressed! Activity ID:', activity._id);
    
    if (!activity._id) {
      console.log('❌ No activity ID');
      Alert.alert('Error', 'Cannot share this activity');
      return;
    }
    
    // Smart default selection: if no photo but has badges, default to first badge
    if (!hasPhoto && badges.length > 0) {
      setSelectedBadgeId(badges[0].badgeId);
    } else {
      setSelectedBadgeId(null); // Default to activity card
    }
    
    // If there are badges, show selection modal
    if (badges.length > 0) {
      setShowShareOptions(true);
    } else {
      // No badges, share activity image directly
      await shareActivity(null);
    }
  };

  const shareActivity = async (badgeId: string | null) => {
    console.log('🟢 Starting share process...', badgeId ? `with badge: ${badgeId}` : 'with activity image');
    try {
      setIsSharing(true);
      console.log('📤 Calling shareService...');
      
      const result = await shareService.shareActivity({
        activityId: activity._id!,
        activityName: activity.name,
        badgeId: badgeId || undefined
      });

      console.log('✅ Share result:', result);

      if (!result.success) {
        console.log('⚠️ Share failed:', result.error);
        Alert.alert('Share Failed', result.error || 'Unable to share activity');
      }
      
      // Close modal on success
      setShowShareOptions(false);
      setSelectedBadgeId(null);
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
        {/* Photo */}
        {activity.photo?.data && (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: `data:${activity.photo.contentType || 'image/jpeg'};base64,${activity.photo.data}` }}
              style={styles.photo}
              resizeMode="cover"
            />
          </View>
        )}

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

      {/* Share Options Modal */}
      <Modal
        visible={showShareOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowShareOptions(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowShareOptions(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Activity</Text>
              <TouchableOpacity onPress={() => setShowShareOptions(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalSubtitle}>What would you like to share?</Text>

              {/* Activity Image Option */}
              <TouchableOpacity
                style={[
                  styles.shareOption,
                  selectedBadgeId === null && styles.shareOptionSelected
                ]}
                onPress={() => setSelectedBadgeId(null)}
              >
                <View style={styles.shareOptionIcon}>
                  <Text style={styles.shareOptionEmoji}>📸</Text>
                </View>
                <View style={styles.shareOptionText}>
                  <Text style={styles.shareOptionTitle}>Activity Card</Text>
                  <Text style={styles.shareOptionDescription}>
                    Share with activity details{hasPhoto ? ' and photo' : ''}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Badge Options */}
              {badges.map((badge) => (
                <TouchableOpacity
                  key={badge.badgeId}
                  style={[
                    styles.shareOption,
                    selectedBadgeId === badge.badgeId && styles.shareOptionSelected
                  ]}
                  onPress={() => setSelectedBadgeId(badge.badgeId)}
                >
                  <View style={styles.shareOptionIcon}>
                    <Image
                      source={{ uri: `${api.defaults.baseURL}/badges/${badge.badgeId}/icon` }}
                      style={styles.badgeIconImage}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.shareOptionText}>
                    <Text style={styles.shareOptionTitle}>{badge.name}</Text>
                    <Text style={styles.shareOptionDescription}>{badge.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.shareActionButton}
                onPress={() => shareActivity(selectedBadgeId)}
                disabled={isSharing}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.shareActionButtonText}>Share</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  photoContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: '100%',
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
  // Share Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#9ca3af',
    fontWeight: '600',
  },
  modalScroll: {
    maxHeight: '70%',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    padding: 20,
    paddingBottom: 12,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  shareOptionSelected: {
    borderColor: '#0ea5e9',
    backgroundColor: '#eff6ff',
  },
  shareOptionIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shareOptionEmoji: {
    fontSize: 32,
  },
  badgeIconImage: {
    width: 48,
    height: 48,
  },
  shareOptionText: {
    flex: 1,
  },
  shareOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  shareOptionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalActions: {
    padding: 20,
    paddingTop: 12,
  },
  shareActionButton: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareActionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
