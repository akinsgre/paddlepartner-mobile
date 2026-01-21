import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService, activityService, notificationService } from '../services';
import CreateActivityScreen from './CreateActivityScreen';
import MapLocationPickerScreen from './MapLocationPickerScreen';
import CreateActivityConfirmScreen from './CreateActivityConfirmScreen';
import ActivityDetailScreen from './ActivityDetailScreen';
import NotificationsScreen from './NotificationsScreen';
import { usePushNotifications } from '../hooks/usePushNotifications';
import type { User, Activity } from '../types';
import type { WaterBodySearchResult } from '../services/waterBodyService';

type CreateActivityStep = 'select' | 'map' | 'confirm';

interface HomeScreenProps {
  onLogout: () => void;
}

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activeTab, setActiveTab] = useState<'following' | 'my' | 'notifications'>('following');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [createActivityStep, setCreateActivityStep] = useState<CreateActivityStep>('select');
  const [selectedWaterBody, setSelectedWaterBody] = useState<WaterBodySearchResult | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapOverrideLocation, setMapOverrideLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const createActivityScreenRef = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Setup push notifications
  const pushNotificationState = usePushNotifications((notification) => {
    console.log('📬 New notification received:', notification);
    // Refresh unread count when notification is received
    loadUnreadCount();
  });

  useEffect(() => {
    loadUser();
    loadActivities();
    loadUnreadCount();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
      // Don't set to 0 on error, keep existing count
    }
  };

  const loadActivities = async (page = 1, append = false) => {
    try {
      console.log(`📋 Loading ${activeTab} activities... page ${page}`);
      
      // Don't load activities for notifications tab yet
      if (activeTab === 'notifications') {
        setActivities([]);
        setHasMore(false);
        return;
      }
      
      let response: any;
      if (activeTab === 'following') {
        // Load activities from followed users and current user
        response = await activityService.getFollowingActivities({ 
          page, 
          limit: 20
        });
      } else {
        // Load only user's own activities
        response = await activityService.getActivities({ 
          page, 
          limit: 20,
          sort: '-startDate'
        });
      }
      
      console.log('📋 Activities response:', response);
      const newActivities = response.activities || [];
      
      // Debug: Check the structure of the first activity
      if (newActivities.length > 0) {
        console.log('🔍 First activity structure:', JSON.stringify(newActivities[0], null, 2));
        console.log('🔍 sharedWaterBody:', newActivities[0].sharedWaterBody);
        console.log('🔍 sharedWaterBody.name:', newActivities[0].sharedWaterBody?.name);
      }
      
      if (append) {
        setActivities(prev => [...prev, ...newActivities]);
      } else {
        setActivities(newActivities);
      }
      
      // Check if there are more pages
      setHasMore(page < (response.pages || 1));
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    await loadActivities(1, false);
    setRefreshing(false);
  };

  const loadMoreActivities = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    await loadActivities(currentPage + 1, true);
    setLoadingMore(false);
  };

  const handleTabChange = (tab: 'following' | 'my' | 'notifications') => {
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    setActivities([]);
    setCurrentPage(1);
    setHasMore(true);
  };

  useEffect(() => {
    loadActivities(1, false);
    // Refresh unread count when switching to/from notifications tab
    if (activeTab === 'notifications') {
      loadUnreadCount();
    }
  }, [activeTab]);

  const handleNotificationPress = () => {
    setActiveTab('notifications');
  };

  const handleNavigateToActivity = (activityId: string) => {
    // Find the activity and show detail
    const activity = activities.find(a => a._id === activityId);
    if (activity) {
      setSelectedActivity(activity);
      setShowActivityDetail(true);
    } else {
      // If not in current list, could fetch it
      Alert.alert('Activity not found', 'This activity may have been deleted.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            onLogout();
          },
        },
      ]
    );
  };

  const handleContinueToMap = (
    waterBody: WaterBodySearchResult,
    location: { latitude: number; longitude: number }
  ) => {
    setSelectedWaterBody(waterBody);
    setSelectedLocation(location);
    setCreateActivityStep('confirm'); // Go straight to confirm now
  };

  const handleOpenMapPicker = (currentLocation: { latitude: number; longitude: number }) => {
    // If current location equals GPS location (no override), we're opening fresh
    // Otherwise we're opening with an override already set
    setSelectedLocation(currentLocation);
    setCreateActivityStep('map');
  };

  const handleLocationConfirmed = (location: { latitude: number; longitude: number }) => {
    setMapOverrideLocation(location);
    setSelectedWaterBody(null); // Clear selection when location changes
    setCreateActivityStep('select'); // Return to select screen with new location
  };

  const handleBackToSelect = () => {
    setCreateActivityStep('select');
  };

  const handleActivityCreated = () => {
    setShowCreateActivity(false);
    setCreateActivityStep('select');
    setSelectedWaterBody(null);
    setSelectedLocation(null);
    setMapOverrideLocation(null);
    loadActivities(); // Refresh the activity list
    Alert.alert('Success', 'Activity created successfully!');
  };

  const handleCancel = () => {
    setShowCreateActivity(false);
    setCreateActivityStep('select');
    setSelectedWaterBody(null);
    setSelectedLocation(null);
    setMapOverrideLocation(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer} testID="loading-indicator">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Compact Header with Logo and Create Button */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="kayaking" size={32} color="#ffffff" style={styles.logo} />
            <Text style={styles.title}>Paddle Partner</Text>
          </View>
          <TouchableOpacity
            style={styles.headerCreateButton}
            onPress={() => setShowCreateActivity(true)}
            testID="create-activity-button"
          >
            <Text style={styles.headerCreateIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'following' && styles.tabActive]}
          onPress={() => handleTabChange('following')}
          testID="following-tab"
        >
          <MaterialCommunityIcons 
            name="account-group" 
            size={24} 
            color={activeTab === 'following' ? '#0ea5e9' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'following' && styles.tabTextActive]}>
            Following
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => handleTabChange('my')}
          testID="my-activities-tab"
        >
          <MaterialCommunityIcons 
            name="account" 
            size={24} 
            color={activeTab === 'my' ? '#0ea5e9' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            My Activities
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
          onPress={() => handleTabChange('notifications')}
          testID="notifications-tab"
        >
          <View style={styles.tabIconContainer}>
            <MaterialCommunityIcons 
              name="bell" 
              size={24} 
              color={activeTab === 'notifications' ? '#0ea5e9' : '#64748b'} 
            />
            {unreadCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            Notifications
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'notifications' ? (
          <NotificationsScreen
            onNavigateToActivity={handleNavigateToActivity}
            onNavigateToProfile={(googleId) => {
              // Could navigate to user profile in future
              console.log('Navigate to profile:', googleId);
            }}
          />
        ) : (
          <FlatList
            testID="activities-list"
            data={activities}
            keyExtractor={(item, index) => item._id || `activity-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.activityCard}
                onPress={() => {
                  setSelectedActivity(item);
                  setShowActivityDetail(true);
                }}
              >
                <View style={styles.activityHeader}>
                  <View style={styles.activityMainInfo}>
                    {item.name && (
                      <Text style={styles.activityName}>{item.name}</Text>
                    )}
                    <Text style={styles.activityWaterBody}>
                      {item.sharedWaterBody?.name || 'Unknown Location'}
                      {item.sharedWaterBody?.section?.name && ` (${item.sharedWaterBody.section.name})`}
                    </Text>
                  </View>
                  <Text style={styles.activityDate}>
                    {item.startDate ? new Date(item.startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'No date'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#0ea5e9"
              />
            }
            onEndReached={loadMoreActivities}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#0ea5e9" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="kayaking" size={64} color="#64748b" style={styles.emptyStateIcon} />
                <Text style={styles.emptyStateText}>
                  {activeTab === 'my' ? 'No activities yet' : 'No activities from people you follow'}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {activeTab === 'my' 
                    ? 'Tap the + button above to create your first activity'
                    : 'Start following paddlers to see their activities here'}
                </Text>
              </View>
            }
            contentContainerStyle={styles.activityList}
          />
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCreateActivity}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        {createActivityStep === 'select' ? (
          <CreateActivityScreen
            onContinue={handleContinueToMap}
            onOpenMapPicker={handleOpenMapPicker}
            onCancel={handleCancel}
            mapOverrideLocation={mapOverrideLocation}
          />
        ) : createActivityStep === 'map' ? (
          <MapLocationPickerScreen
            initialLocation={selectedLocation!}
            onConfirm={handleLocationConfirmed}
            onCancel={handleBackToSelect}
          />
        ) : (
          <CreateActivityConfirmScreen
            selectedWaterBody={selectedWaterBody!}
            location={selectedLocation!}
            onBack={handleBackToSelect}
            onActivityCreated={handleActivityCreated}
          />
        )}
      </Modal>

      <Modal
        visible={showActivityDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowActivityDetail(false)}
      >
        {selectedActivity && (
          <ActivityDetailScreen
            activity={selectedActivity}
            onBack={() => setShowActivityDetail(false)}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
  },
  header: {
    backgroundColor: '#0ea5e9',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerCreateButton: {
    backgroundColor: '#ffffff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerCreateIcon: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  tabIconContainer: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 3,
  },
  tabActive: {
    borderBottomColor: '#0ea5e9',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 4,
  },
  tabTextActive: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  activityList: {
    flexGrow: 1,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 4,
  },
  activityWaterBody: {
    fontSize: 14,
    color: '#475569',
  },
  activityDate: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
