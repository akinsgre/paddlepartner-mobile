import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import WaterBodySelectionList from '../components/WaterBodySelectionList';

interface WaterBodySelection {
  source: string;
  sharedWaterBodyId?: string;
  sectionId?: string;
  sectionIndex?: number;
  sectionName?: string;
  name?: string;
  type?: string;
  osmId?: string;
  osmData?: any;
}

interface CreateActivityScreenProps {
  onContinue: (
    waterBodySelection: WaterBodySelection,
    location: { latitude: number; longitude: number }
  ) => void;
  onOpenMapPicker: (currentLocation: { latitude: number; longitude: number }) => void;
  onCancel: () => void;
  mapOverrideLocation?: { latitude: number; longitude: number } | null;
}

export default function CreateActivityScreen({ onContinue, onOpenMapPicker, onCancel, mapOverrideLocation: externalMapOverride }: CreateActivityScreenProps) {
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedWaterBody, setSelectedWaterBody] = useState<WaterBodySelection | null>(null);

  // Use external map override from parent if provided, otherwise GPS
  const location = externalMapOverride || gpsLocation;
  const mapOverrideLocation = externalMapOverride;

  useEffect(() => {
    getCurrentLocation();
  }, []);

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

  const handleWaterBodySelect = (selection: WaterBodySelection) => {
    console.log('🎯 CreateActivityScreen.handleWaterBodySelect:', {
      sectionId: selection.sectionId,
      sectionName: selection.sectionName,
      waterBodyId: selection.sharedWaterBodyId,
      fullSelection: selection
    });
    setSelectedWaterBody(selection);
    
    // Auto-advance to confirm screen when a selection is made
    if (location) {
      onContinue(selection, location);
    } else {
      Alert.alert('Error', 'Location is required');
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

  const handleOpenMapPicker = () => {
    if (!location) return;
    onOpenMapPicker(location);
  };

  const handleClearMapOverride = () => {
    if (gpsLocation) {
      onOpenMapPicker(gpsLocation); // This will trigger parent to clear and reset
      setSelectedWaterBody(null); // Clear selection when changing location
    }
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

        {/* Water Body Selection List */}
        <View style={styles.selectionContainer}>
          <WaterBodySelectionList
            coordinates={location}
            onSelect={handleWaterBodySelect}
            onError={(error) => console.error('Water body selection error:', error)}
          />
        </View>

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
  selectionContainer: {
    flex: 1,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
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
});
