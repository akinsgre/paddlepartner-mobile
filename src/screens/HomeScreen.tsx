import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { authService } from '../services';
import CreateActivityScreen from './CreateActivityScreen';
import CreateActivityConfirmScreen from './CreateActivityConfirmScreen';
import type { User } from '@paddlepartner/shared';
import type { WaterBodySearchResult } from '../services/waterBodyService';

type CreateActivityStep = 'select' | 'confirm';

interface HomeScreenProps {
  onLogout: () => void;
}

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [createActivityStep, setCreateActivityStep] = useState<CreateActivityStep>('select');
  const [selectedWaterBody, setSelectedWaterBody] = useState<WaterBodySearchResult | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    loadUser();
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

        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>Coming Soon!</Text>
          <Text style={styles.messageText}>
            More features in development:
          </Text>
          <Text style={styles.featureText}>• View activity list</Text>
          <Text style={styles.featureText}>• Activity details and editing</Text>
          <Text style={styles.featureText}>• Strava integration</Text>
          <Text style={styles.featureText}>• Activity statistics</Text>
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
});
