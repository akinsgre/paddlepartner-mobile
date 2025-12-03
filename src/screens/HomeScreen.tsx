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
import { authService, activityService } from '../services';
import CreateActivityScreen from './CreateActivityScreen';
import MapLocationPickerScreen from './MapLocationPickerScreen';
import CreateActivityConfirmScreen from './CreateActivityConfirmScreen';
import ActivityDetailScreen from './ActivityDetailScreen';
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
  const [showActivityDetail, setShowActivityDetail] = useState(false);
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [createActivityStep, setCreateActivityStep] = useState<CreateActivityStep>('select');
  const [selectedWaterBody, setSelectedWaterBody] = useState<WaterBodySearchResult | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapOverrideLocation, setMapOverrideLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const createActivityScreenRef = useState<any>(null);

  useEffect(() => {
    loadUser();
    loadActivities();
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

  const loadActivities = async () => {
    try {
      console.log('📋 Loading activities...');
      const response = await activityService.getActivities({ 
        page: 1, 
        limit: 20,
        sort: '-startDate'
      }) as any; // API returns different structure than type definition
      console.log('📋 Activities response:', response);
      console.log('📋 Activities array:', response.activities);
      console.log('📋 Number of activities:', response.activities?.length || 0);
      setActivities(response.activities || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActivities();
    setRefreshing(false);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🏄‍♂️</Text>
        <Text style={styles.title}>Paddle Partner</Text>
        <Text style={styles.subtitle}>Mobile App</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          {user && (
            <>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.createActivityButton}
          onPress={() => setShowCreateActivity(true)}
        >
          <Text style={styles.createActivityIcon}>+</Text>
          <Text style={styles.createActivityText}>Create Activity</Text>
        </TouchableOpacity>

        {/* Activity List */}
        <View style={styles.activityListContainer}>
          <Text style={styles.activityListTitle}>Recent Activities</Text>
          <FlatList
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
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🏄‍♂️</Text>
                <Text style={styles.emptyStateText}>No activities yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap the + button above to create your first activity
                </Text>
              </View>
            }
            contentContainerStyle={styles.activityList}
          />
        </View>

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
    paddingBottom: 30,
    alignItems: 'center',
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0f2fe',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  messageCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 12,
  },
  messageText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 24,
  },
  featureText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    marginBottom: 6,
  },
  createActivityButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createActivityIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginRight: 8,
  },
  createActivityText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
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
  activityListContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  activityListTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 12,
  },
  activityList: {
    flexGrow: 1,
  },
  activityCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  activitySection: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  activityDetail: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
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
});
