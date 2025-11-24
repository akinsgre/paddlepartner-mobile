import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { authService, activityService } from '../services';
import CreateActivityScreen from './CreateActivityScreen';
import CreateActivityConfirmScreen from './CreateActivityConfirmScreen';
import type { User, Activity } from '@paddlepartner/shared';
import type { WaterBodySearchResult } from '../services/waterBodyService';

type CreateActivityStep = 'select' | 'confirm';

interface HomeScreenProps {
  onLogout: () => void;
}

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [createActivityStep, setCreateActivityStep] = useState<CreateActivityStep>('select');
  const [selectedWaterBody, setSelectedWaterBody] = useState<WaterBodySearchResult | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
      const response = await activityService.getActivities({
        page: 1,
        limit: 5,
        sort: '-startDate'
      });
      // API returns activities, not docs
      setActivities((response as any).activities || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
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

  const handleContinueToConfirm = (
    waterBody: WaterBodySearchResult,
    location: { latitude: number; longitude: number }
  ) => {
    setSelectedWaterBody(waterBody);
    setSelectedLocation(location);
    setCreateActivityStep('confirm');
  };

  const handleBackToSelect = () => {
    setCreateActivityStep('select');
  };

  const handleActivityCreated = () => {
    setShowCreateActivity(false);
    setCreateActivityStep('select');
    setSelectedWaterBody(null);
    setSelectedLocation(null);
    loadActivities(); // Refresh activities list
    Alert.alert('Success', 'Activity created! You can view it in the web app.');
  };

  const handleCancel = () => {
    setShowCreateActivity(false);
    setCreateActivityStep('select');
    setSelectedWaterBody(null);
    setSelectedLocation(null);
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
        
        {/* Profile Button */}
        {user && user.picture && (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfileMenu(!showProfileMenu)}
          >
            <Image
              source={{ uri: user.picture }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        )}
        
        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <View style={styles.profileMenu}>
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={handleLogout}
            >
              <Text style={styles.profileMenuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
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

        <View style={styles.activitiesCard}>
          <Text style={styles.activitiesTitle}>Recent Activities</Text>
          {activities.length === 0 ? (
            <Text style={styles.noActivitiesText}>
              No activities yet. Create your first one!
            </Text>
          ) : (
            activities.map((activity) => {
              const date = new Date(activity.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              const waterBodyName = activity.sharedWaterBody?.name || 'Unknown Location';
              const sectionName = activity.sharedWaterBody?.section?.name;
              const location = sectionName ? `${waterBodyName} - ${sectionName}` : waterBodyName;
              
              return (
                <View key={activity._id} style={styles.activityItem}>
                  <Text style={styles.activityDate}>{date}</Text>
                  <View style={styles.activityDetails}>
                    <Text style={styles.activityName} numberOfLines={1}>
                      {activity.name}
                    </Text>
                    <Text style={styles.activityLocation} numberOfLines={1}>
                      {location}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>

      <Modal
        visible={showCreateActivity}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        {createActivityStep === 'select' ? (
          <CreateActivityScreen
            onContinue={handleContinueToConfirm}
            onCancel={handleCancel}
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
    position: 'relative',
  },
  profileButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileMenu: {
    position: 'absolute',
    top: 110,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  profileMenuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    textAlign: 'center',
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
  activitiesCard: {
    backgroundColor: '#ffffff',
    padding: 20,
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
  activitiesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 16,
  },
  noActivitiesText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  activityDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    width: 50,
    paddingTop: 2,
  },
  activityDetails: {
    flex: 1,
    marginLeft: 12,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 2,
  },
  activityLocation: {
    fontSize: 13,
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
});
