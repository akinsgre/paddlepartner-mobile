import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { activityService, waterBodyService } from '../services';
import type { WaterBodySearchResult } from '../services/waterBodyService';

interface CreateActivityScreenProps {
  onActivityCreated: () => void;
  onCancel: () => void;
}

export default function CreateActivityScreen({ onActivityCreated, onCancel }: CreateActivityScreenProps) {
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [waterBodies, setWaterBodies] = useState<WaterBodySearchResult[]>([]);
  const [selectedWaterBody, setSelectedWaterBody] = useState<WaterBodySearchResult | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location) {
      searchWaterBodies();
    }
  }, [location, searchQuery]);

  const getCurrentLocation = async () => {
    try {
      // FOR TESTING: Use fake coordinates in development mode
      if (__DEV__) {
        console.log('🧪 Using test coordinates for development');
        setLocation({
          latitude: 35.886272,
          longitude: -82.82698
        });
        setLoadingLocation(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to create activities. Please enable location access in your device settings.',
          [
            { text: 'Cancel', onPress: onCancel },
            { text: 'OK' }
          ]
        );
        setLoadingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!currentLocation?.coords?.latitude || !currentLocation?.coords?.longitude) {
        Alert.alert(
          'Location Error',
          'Unable to determine your location. Please ensure GPS is enabled and try again.',
          [
            { text: 'Cancel', onPress: onCancel },
            { text: 'Retry', onPress: getCurrentLocation }
          ]
        );
        setLoadingLocation(false);
        return;
      }

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setLoadingLocation(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get your current location. Please check that location services are enabled and try again.',
        [
          { text: 'Cancel', onPress: onCancel },
          { text: 'Retry', onPress: getCurrentLocation }
        ]
      );
      setLoadingLocation(false);
    }
  };

  const searchWaterBodies = async () => {
    if (!location) {
      console.warn('Cannot search water bodies: location not available');
      return;
    }

    if (!location.latitude || !location.longitude) {
      console.warn('Cannot search water bodies: invalid coordinates', location);
      Alert.alert(
        'Location Error',
        'Your location coordinates are invalid. Please close and reopen this screen.',
        [{ text: 'OK', onPress: onCancel }]
      );
      return;
    }

    console.log('🔍 Searching water bodies at:', location.latitude, location.longitude);
    
    try {
      const results = await waterBodyService.searchCombined(
        location.latitude,
        location.longitude,
        searchQuery || undefined
      );
      console.log('✅ Water body search results:', results.length, 'found');
      if (results.length > 0) {
        console.log('First result:', results[0]);
      }
      setWaterBodies(results);
    } catch (error: any) {
      console.error('❌ Error searching water bodies:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      Alert.alert(
        'Search Error',
        error.response?.data?.error || error.message || 'Failed to search for water bodies. Please try again.',
        [
          { text: 'Cancel', onPress: onCancel },
          { text: 'Retry', onPress: searchWaterBodies }
        ]
      );
    }
  };

  const handleCreateActivity = async () => {
    if (!location) {
      Alert.alert('Error', 'Location is required');
      return;
    }

    if (!selectedWaterBody) {
      Alert.alert(
        'No Water Body Selected',
        'Please select a water body for this activity',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);

      const data: any = {
        latitude: location.latitude,
        longitude: location.longitude,
      };

      // Add water body or section based on type
      if (selectedWaterBody.type === 'section' && selectedWaterBody.section) {
        data.sharedWaterBodySectionId = selectedWaterBody.section._id;
        if (selectedWaterBody.sharedWaterBody) {
          data.sharedWaterBodyId = selectedWaterBody.sharedWaterBody._id;
        }
      } else if (selectedWaterBody.type === 'shared' && selectedWaterBody.sharedWaterBody) {
        data.sharedWaterBodyId = selectedWaterBody.sharedWaterBody._id;
      }

      await activityService.createManualActivity(data);

      Alert.alert(
        'Success',
        'Activity created successfully!',
        [{ text: 'OK', onPress: onActivityCreated }]
      );
    } catch (error: any) {
      console.error('Error creating activity:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to create activity'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderWaterBodyItem = ({ item }: { item: WaterBodySearchResult }) => (
    <TouchableOpacity
      style={[
        styles.waterBodyItem,
        selectedWaterBody?.id === item.id && styles.selectedWaterBodyItem,
      ]}
      onPress={() => setSelectedWaterBody(item)}
    >
      <View style={styles.waterBodyInfo}>
        <Text style={styles.waterBodyName}>{item.name}</Text>
        <Text style={styles.waterBodyType}>
          {item.type === 'section' ? 'Section' : 'Water Body'}
          {item.distance !== undefined && ` • ${waterBodyService.formatDistance(item.distance)}`}
        </Text>
      </View>
      {selectedWaterBody?.id === item.id && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loadingLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to get location</Text>
          <TouchableOpacity style={styles.retryButton} onPress={getCurrentLocation}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Activity</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Select Water Body</Text>
        <Text style={styles.sectionSubtitle}>
          Choose the body of water where you paddled
        </Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search water bodies..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <FlatList
          data={waterBodies}
          renderItem={renderWaterBodyItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No water bodies found' : 'Loading water bodies...'}
              </Text>
            </View>
          }
        />

        <TouchableOpacity
          style={[
            styles.createButton,
            (!selectedWaterBody || loading) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateActivity}
          disabled={!selectedWaterBody || loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.createButtonText}>Add Activity</Text>
          )}
        </TouchableOpacity>
      </View>
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
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#0ea5e9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  waterBodyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedWaterBodyItem: {
    borderColor: '#0ea5e9',
    backgroundColor: '#eff6ff',
  },
  waterBodyInfo: {
    flex: 1,
  },
  waterBodyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  waterBodyType: {
    fontSize: 14,
    color: '#6b7280',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0ea5e9',
    padding: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
