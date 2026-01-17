import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { waterBodyService } from '../services';
import type { WaterBodySearchResult, OSMStatus } from '../services/waterBodyService';
import { getGroupedCandidates, type GroupedWaterBody } from '../utils/waterBodyGrouping';

interface Coordinates {
  latitude: number;
  longitude: number;
}

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

interface Props {
  coordinates: Coordinates;
  onSelect: (selection: WaterBodySelection) => void;
  onError?: (error: string) => void;
}

export default function WaterBodySelectionList({ coordinates, onSelect, onError }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState<WaterBodySearchResult[]>([]);
  const [osmStatus, setOsmStatus] = useState<OSMStatus | null>(null);
  const [showOSM, setShowOSM] = useState(true);

  useEffect(() => {
    fetchWaterBodies();
  }, [coordinates]);

  const fetchWaterBodies = async () => {
    setIsLoading(true);
    setError('');
    setCandidates([]);
    setOsmStatus(null);

    try {
      const response = await waterBodyService.searchCombined(
        coordinates.latitude,
        coordinates.longitude,
        undefined, // no search query
        false // GPS location
      );

      setCandidates(response.results);
      setOsmStatus(response.osmStatus || null);

      if (!response.osmStatus?.success) {
        console.warn('⚠️ OSM API error:', response.osmStatus?.error);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch water bodies';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const selectSection = (waterBody: GroupedWaterBody, section: { sectionIndex: number; sectionId: string; sectionName: string }) => {
    const selection: WaterBodySelection = {
      source: 'shared_database',
      sharedWaterBodyId: waterBody.waterBodyId,
      sectionId: section.sectionId,
      sectionIndex: section.sectionIndex,
      sectionName: section.sectionName,
      name: waterBody.name,
      type: waterBody.type,
    };

    console.log('🎯 WaterBodySelectionList.selectSection called:', {
      waterBodyId: waterBody.waterBodyId,
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      fullSelection: selection
    });

    onSelect(selection);
  };

  const selectWaterBodyWithoutSection = (waterBody: GroupedWaterBody) => {
    const selection: WaterBodySelection = {
      source: 'shared_database',
      sharedWaterBodyId: waterBody.waterBodyId,
      name: waterBody.name,
      type: waterBody.type,
    };

    onSelect(selection);
  };

  const selectOSMWaterBody = (candidate: WaterBodySearchResult) => {
    const selection: WaterBodySelection = {
      source: 'osm',
      osmId: candidate.osmId,
      osmData: candidate.osmData,
      name: candidate.name,
      type: candidate.type,
    };

    onSelect(selection);
  };

  const { groups, osmCandidates } = getGroupedCandidates(candidates, showOSM);
  const totalResults = groups.length + osmCandidates.length;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading water bodies...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchWaterBodies}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Controls Bar */}
      <View style={styles.controlsBar}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowOSM(!showOSM)}
        >
          <Text style={styles.toggleButtonText}>
            {showOSM ? '✓' : ' '} Show Non-Community Water Bodies
          </Text>
        </TouchableOpacity>

        {osmStatus && !osmStatus.success && (
          <TouchableOpacity
            style={styles.retryButtonSmall}
            onPress={fetchWaterBodies}
            disabled={isLoading}
          >
            <Text style={styles.retryButtonTextSmall}>
              {isLoading ? 'Retrying...' : 'Retry'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* OSM Warning Banner */}
      {osmStatus && !osmStatus.success && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            OpenStreetMap Unavailable - Showing community water bodies only
          </Text>
        </View>
      )}

      {/* Results */}
      <ScrollView style={styles.resultsContainer}>
        {totalResults === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsTitle}>No water bodies found at this location.</Text>
            <Text style={styles.helpText}>
              Try selecting a more specific location near a boat launch or shoreline access point.
            </Text>
          </View>
        ) : (
          <>
            {/* Grouped Community Water Bodies */}
            {groups.map((waterBody) => (
              <View key={waterBody.waterBodyId} style={styles.waterBodyGroup}>
                {/* Water Body Header */}
                <View style={styles.waterBodyHeader}>
                  <View style={styles.waterBodyTitleRow}>
                    <Text style={styles.communityBadge}>👥 Community</Text>
                    <Text style={styles.waterBodyName}>{waterBody.name}</Text>
                    {waterBody.distance && (
                      <Text style={styles.waterBodyDistance}>
                        {formatDistance(waterBody.distance)}
                      </Text>
                    )}
                  </View>
                  {waterBody.type && (
                    <Text style={styles.waterBodyType}>{waterBody.type}</Text>
                  )}
                </View>

                {/* Sections List */}
                {waterBody.sections.length > 0 && (
                  <View style={styles.sectionsList}>
                    {waterBody.sections.map((section) => (
                      <TouchableOpacity
                        key={section.sectionIndex}
                        style={styles.sectionButton}
                        onPress={() => selectSection(waterBody, section)}
                      >
                        <Text style={styles.sectionButtonText}>{section.sectionName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Select Water Body Without Section */}
                <TouchableOpacity
                  style={styles.selectWaterBodyButton}
                  onPress={() => selectWaterBodyWithoutSection(waterBody)}
                >
                  <Text style={styles.selectWaterBodyButtonText}>
                    Select {waterBody.name} (No Section)
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* OSM Water Bodies (flat list) */}
            {osmCandidates.map((candidate, index) => (
              <View key={`osm-${candidate.osmId}-${index}`} style={styles.osmCard}>
                <View style={styles.waterBodyHeader}>
                  <View style={styles.waterBodyTitleRow}>
                    <Text style={styles.osmBadge}>🗺️ OpenStreetMap</Text>
                    <Text style={styles.waterBodyName}>{candidate.name}</Text>
                  </View>
                  {candidate.distance && (
                    <Text style={styles.waterBodyDistance}>
                      {formatDistance(candidate.distance)}
                    </Text>
                  )}
                </View>

                {candidate.type && (
                  <Text style={styles.waterBodyType}>{candidate.type}</Text>
                )}

                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => selectOSMWaterBody(candidate)}
                >
                  <Text style={styles.selectButtonText}>Select This Water Body</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  retryButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0ea5e9',
    borderRadius: 6,
  },
  retryButtonTextSmall: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fcd34d',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  noResults: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  waterBodyGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  waterBodyHeader: {
    marginBottom: 12,
  },
  waterBodyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  communityBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0ea5e9',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  osmBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  waterBodyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  waterBodyDistance: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
  },
  waterBodyType: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  sectionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    marginHorizontal: -4, // Compensate for section margins
  },
  sectionButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    margin: 4,
  },
  sectionButtonText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  selectWaterBodyButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectWaterBodyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  osmCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#fcd34d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
