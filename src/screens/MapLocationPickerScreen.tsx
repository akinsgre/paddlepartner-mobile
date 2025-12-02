import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01; // About 1km
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface MapLocationPickerScreenProps {
  initialLocation: { latitude: number; longitude: number };
  onConfirm: (location: { latitude: number; longitude: number }) => void;
  onCancel: () => void;
}

export default function MapLocationPickerScreen({
  initialLocation,
  onConfirm,
  onCancel,
}: MapLocationPickerScreenProps) {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [region, setRegion] = useState({
    latitude: initialLocation.latitude,
    longitude: initialLocation.longitude,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const mapRef = useRef<MapView>(null);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const distance = calculateDistance(
    initialLocation.latitude,
    initialLocation.longitude,
    selectedLocation.latitude,
    selectedLocation.longitude
  );

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
  };

  const handleMarkerDragEnd = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
  };

  const handleConfirm = () => {
    onConfirm(selectedLocation);
  };

  const handleResetToGPS = () => {
    setSelectedLocation(initialLocation);
    mapRef.current?.animateToRegion({
      latitude: initialLocation.latitude,
      longitude: initialLocation.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Original GPS location marker (gray) */}
        <Marker
          coordinate={initialLocation}
          pinColor="gray"
          title="GPS Location"
          description="Your device's GPS location"
        />

        {/* Selected/adjusted location marker (blue, draggable) */}
        <Marker
          coordinate={selectedLocation}
          draggable
          onDragEnd={handleMarkerDragEnd}
          pinColor="blue"
          title="Selected Location"
          description="Drag to adjust paddle location"
        />
      </MapView>

      {/* Info panel */}
      <View style={styles.infoPanel}>
        <Text style={styles.infoTitle}>Adjust Paddle Location</Text>
        <Text style={styles.infoText}>
          Drag the blue marker or tap the map to set the exact location
        </Text>
        <View style={styles.coordsContainer}>
          <Text style={styles.coordsLabel}>Coordinates:</Text>
          <Text style={styles.coordsValue}>
            {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
          </Text>
        </View>
        {distance > 10 && (
          <View style={styles.distanceContainer}>
            <Text style={styles.distanceText}>
              {distance < 1000
                ? `${Math.round(distance)}m from GPS`
                : `${(distance / 1000).toFixed(2)}km from GPS`}
            </Text>
          </View>
        )}
      </View>

      {/* Button container */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleResetToGPS}
        >
          <Text style={styles.secondaryButtonText}>Reset to GPS</Text>
        </TouchableOpacity>

        <View style={styles.buttonSpacer} />

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.buttonSpacer} />

        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={handleConfirm}
        >
          <Text style={styles.buttonText}>Confirm Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    position: 'absolute',
    top: Platform.select({ ios: 60, android: 40 }),
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  coordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  coordsLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginRight: 8,
  },
  coordsValue: {
    fontSize: 13,
    color: '#333',
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
  },
  distanceContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  distanceText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.select({ ios: 32, android: 16 }),
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSpacer: {
    width: 12,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
