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
import { waterBodyService } from '../services';
import type { WaterBodySearchResult, OSMStatus } from '../services/waterBodyService';

interface CreateActivityScreenProps {
  onContinue: (
    waterBody: WaterBodySearchResult,
    location: { latitude: number; longitude: number }
  ) => void;
  onOpenMapPicker: (currentLocation: { latitude: number; longitude: number }) => void;
  onCancel: () => void;
  mapOverrideLocation?: { latitude: number; longitude: number } | null;
}

export default function CreateActivityScreen({ onContinue, onOpenMapPicker, onCancel, mapOverrideLocation: externalMapOverride }: CreateActivityScreenProps) {
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [waterBodies, setWaterBodies] = useState<WaterBodySearchResult[]>([]);
  const [selectedWaterBody, setSelectedWaterBody] = useState<WaterBodySearchResult | null>(null);
  const [osmStatus, setOsmStatus] = useState<OSMStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showOSM, setShowOSM] = useState(true); // Toggle for OSM results

  // Use external map override from parent if provided, otherwise GPS
  const location = externalMapOverride || gpsLocation;
  const mapOverrideLocation = externalMapOverride;

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
        accuracy: Location.Accuracy.BestForNavigation,
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
      console.log('📍 Current location:', currentLocation.coords.latitude, currentLocation.coords.longitude) ;
      setGpsLocation({
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
      // FOR TESTING: Use fake coordinates in development mode
    //   if (__DEV__) {
    //     console.log('🧪 Using test coordinates for development');
    //     setLocation({
    //       latitude: 35.886272,
    //       longitude: -82.82698
    //     });
    //     setLoadingLocation(false);
    //     return;
    //   }
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
      const response = await waterBodyService.searchCombined(
        location.latitude,
        location.longitude,
        searchQuery || undefined,
        !!mapOverrideLocation // true if map-selected, false if GPS
      );
      console.log('✅ Water body search results:', response.results.length, 'found');
      if (response.results.length > 0) {
        console.log('First result:', response.results[0]);
      }
      setWaterBodies(response.results);
      setOsmStatus(response.osmStatus || null);
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

  const handleContinue = () => {
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

    // Call the onContinue callback to navigate to confirmation
    onContinue(selectedWaterBody, location);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setSelectedWaterBody(null); // Clear selection on refresh
    await searchWaterBodies();
    setRefreshing(false);
  };

  const handleOpenMapPicker = () => {
    if (!location) return;
    onOpenMapPicker(location);
  };

  const handleClearMapOverride = () => {
    onOpenMapPicker(gpsLocation!); // This will trigger parent to clear and reset
    setSelectedWaterBody(null); // Clear selection when changing location
  };

  // This will be called from HomeScreen after map picker returns
  useEffect(() => {
    // External update handler would go here if needed
  }, []);

  const renderWaterBodyItem = ({ item }: { item: WaterBodySearchResult }) => {
    const isOSM = item.id.startsWith('osm-');
    const isCommunity = !isOSM;
    
    return (
      <TouchableOpacity
        style={[ 
          styles.waterBodyItem,
          selectedWaterBody?.id === item.id && styles.selectedWaterBodyItem,
        ]}
        onPress={() => setSelectedWaterBody(item)}
      >
        <View style={styles.waterBodyInfo}>
          <View style={styles.waterBodyNameRow}>
            {isCommunity && <Text style={styles.communityIcon}>👥</Text>}
            {isOSM && <Text style={styles.osmIcon}>🗺️</Text>}
            <Text style={styles.waterBodyName}>
              {item.name}
            </Text>
          </View>
          <Text style={styles.waterBodyType}>
            {item.distance !== undefined && `${waterBodyService.formatDistance(item.distance)}`}
            {isCommunity && <Text style={styles.communityLabel}> • Community</Text>}
            {isOSM && <Text style={styles.osmLabel}> • OSM</Text>}
          </Text>
        </View>
        {selectedWaterBody?.id === item.id && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
        <TouchableOpacity 
          onPress={onCancel} 
          style={styles.cancelButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.6}
        >
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
        
        {/* OSM Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>
            {searchQuery ? 'Searching shared water bodies only' : 'Showing nearby water bodies'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={() => setShowOSM(!showOSM)}
            >
              <Text style={styles.toggleButtonText}>
                {showOSM ? 'Hide OSM' : 'Show OSM'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Map Override Location Banner */}
        {mapOverrideLocation && (
          <View style={styles.locationOverrideBanner}>
            <View style={styles.locationOverrideContent}>
              <Text style={styles.locationOverrideIcon}>📍</Text>
              <View style={styles.locationOverrideTextContainer}>
                <Text style={styles.locationOverrideTitle}>Searching near selected location</Text>
                <Text style={styles.locationOverrideCoords}>
                  {mapOverrideLocation.latitude.toFixed(4)}, {mapOverrideLocation.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.clearOverrideButton}
              onPress={handleClearMapOverride}
            >
              <Text style={styles.clearOverrideButtonText}>Reset to GPS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* OSM Status Banner */}
        {osmStatus && !osmStatus.success && (
          <View style={styles.osmErrorBanner}>
            <View style={styles.osmErrorContent}>
              <Text style={styles.osmErrorIcon}>⚠️</Text>
              <View style={styles.osmErrorTextContainer}>
                <Text style={styles.osmErrorTitle}>OpenStreetMap Unavailable</Text>
                <Text style={styles.osmErrorMessage}>
                  {osmStatus.error || 'Some water bodies may not be shown'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#0ea5e9" />
              ) : (
                <Text style={styles.refreshButtonText}>Retry</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={waterBodies.filter(wb => showOSM || !wb.id.startsWith('osm-'))}
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
            styles.continueButton,
            !selectedWaterBody && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedWaterBody}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Map Button */}
      <TouchableOpacity
        style={styles.floatingMapButton}
        onPress={handleOpenMapPicker}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingMapButtonIcon}>📍</Text>
      </TouchableOpacity>
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
    minWidth: 60,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#0ea5e9',
    fontWeight: '600',
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
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
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
  continueButton: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  continueButtonText: {
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
  osmErrorBanner: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  osmErrorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  osmErrorIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  osmErrorTextContainer: {
    flex: 1,
  },
  osmErrorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 2,
  },
  osmErrorMessage: {
    fontSize: 12,
    color: '#92400e',
  },
  refreshButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  locationOverrideBanner: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationOverrideContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationOverrideIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  locationOverrideTextContainer: {
    flex: 1,
  },
  locationOverrideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 2,
  },
  locationOverrideCoords: {
    fontSize: 11,
    color: '#1e40af',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  clearOverrideButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  clearOverrideButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  floatingMapButton: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  floatingMapButtonIcon: {
    fontSize: 28,
  },
  waterBodyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  communityIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  osmIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  communityLabel: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  osmLabel: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  toggleLabel: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
});
