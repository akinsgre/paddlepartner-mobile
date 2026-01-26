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
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { activityService, paddleTypeService } from '../services';
import api from '../services/api';
import ENV from '../config/environment';
import type { PaddleType } from '../types';

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

interface CreateActivityConfirmScreenProps {
  selectedWaterBody: WaterBodySelection;
  location: { latitude: number; longitude: number };
  onBack: () => void;
  onActivityCreated: () => void;
}

export default function CreateActivityConfirmScreen({
  selectedWaterBody,
  location,
  onBack,
  onActivityCreated,
}: CreateActivityConfirmScreenProps) {
  const [loading, setLoading] = useState(false);
  const [activityName, setActivityName] = useState('');
  const [notes, setNotes] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [waterLevel, setWaterLevel] = useState('');
  const [activityDate, setActivityDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [waterBodyExpanded, setWaterBodyExpanded] = useState(false);
  const [paddleTypes, setPaddleTypes] = useState<PaddleType[]>([]);
  const [selectedPaddleType, setSelectedPaddleType] = useState<string>('');
  const [loadingPaddleTypes, setLoadingPaddleTypes] = useState(true);
  const [showPaddleTypePicker, setShowPaddleTypePicker] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);

  const isOSMWaterBody = selectedWaterBody.source === 'osm';
  const isSection = !!selectedWaterBody.sectionId;

  // Load paddle types on mount
  useEffect(() => {
    loadPaddleTypes();
  }, []);

  const loadPaddleTypes = async () => {
    try {
      setLoadingPaddleTypes(true);
      const types = await paddleTypeService.getUserPaddleTypes();
      setPaddleTypes(types || []);
    } catch (error) {
      console.error('Failed to load paddle types:', error);
      setPaddleTypes([]); // Ensure paddleTypes is always an array
    } finally {
      setLoadingPaddleTypes(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to attach photos');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await compressAndSetPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await compressAndSetPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const compressAndSetPhoto = async (uri: string) => {
    try {
      // Get image info first
      const response = await fetch(uri);
      const blob = await response.blob();
      const originalSize = blob.size;
      
      console.log(`📸 Original image size: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);
      
      // Target size: 2MB (more lenient than 1MB)
      const targetSizeBytes = 2 * 1024 * 1024;
      
      // Determine initial resize dimensions based on original size
      let maxWidth = 2048;
      if (originalSize > 10 * 1024 * 1024) {
        maxWidth = 1920; // Larger files need more aggressive resize
      } else if (originalSize > 5 * 1024 * 1024) {
        maxWidth = 2048;
      }
      
      // Try different quality levels until we get under target size
      const qualityLevels = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4];
      let bestResult: { uri: string; base64: string; size: number } | null = null;
      
      for (const quality of qualityLevels) {
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: maxWidth } }],
          { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
        );

        const testResponse = await fetch(manipResult.uri);
        const testBlob = await testResponse.blob();
        const reader = new FileReader();
        
        await new Promise<void>((resolve) => {
          reader.onloadend = () => {
            const base64data = reader.result as string;
            const base64Image = base64data.split(',')[1];
            const sizeInBytes = (base64Image.length * 3) / 4;
            
            console.log(`📊 Quality ${quality}: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB`);
            
            if (sizeInBytes <= targetSizeBytes) {
              bestResult = {
                uri: manipResult.uri,
                base64: base64Image,
                size: sizeInBytes
              };
            }
            resolve();
          };
          reader.readAsDataURL(testBlob);
        });
        
        // If we found a good result, stop trying
        if (bestResult) break;
      }
      
      if (!bestResult) {
        Alert.alert(
          'Photo too large',
          'Could not compress photo to acceptable size. Please choose a smaller photo or edit it first.'
        );
        return;
      }
      
      console.log(`✅ Final size: ${(bestResult.size / 1024 / 1024).toFixed(2)}MB`);
      setPhotoUri(bestResult.uri);
      setPhotoData(bestResult.base64);
      
    } catch (error) {
      console.error('Error compressing image:', error);
      Alert.alert('Error', 'Failed to process image');
    }
  };

  const removePhoto = () => {
    setPhotoUri(null);
    setPhotoData(null);
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Add Photo',
      'Choose a photo source',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      let sharedWaterBodyId: string | undefined;
      let sectionIdToSend: string | undefined;
      let finalSectionName: string | undefined;
      let activityLocation: { latitude: number; longitude: number };

      if (isOSMWaterBody) {
        // For OSM water bodies, first check if it already exists, then create if needed
        console.log('📋 Processing OSM water body...');
        
        // Extract OSM ID from osmData
        const osmId = selectedWaterBody.osmId;
        const osmType = selectedWaterBody.osmData?.osmType || selectedWaterBody.type;
        
        // For OSM water bodies, use the GPS/map override location from prop
        activityLocation = location;
        
        // Check if this OSM water body already exists
        const checkResponse = await api.post('/activities/check-osm-match', {
          osmId,
          name: selectedWaterBody.name,
          type: osmType,
          coordinates: [activityLocation.longitude, activityLocation.latitude],
        });

        const checkData = checkResponse.data;

        if (checkData.matched && checkData.sharedWaterBody) {
          // Water body already exists
          console.log(`✅ OSM water body already exists: ${checkData.sharedWaterBody._id}`);
          sharedWaterBodyId = checkData.sharedWaterBody._id;
          finalSectionName = sectionName.trim() || undefined;
        } else {
          // Create new SharedWaterBody from OSM data
          console.log('🆕 Creating new SharedWaterBody from OSM data...');
          
          const createResponse = await api.post('/shared-water-bodies', {
            name: selectedWaterBody.name,
            type: osmType,
            coordinates: [activityLocation.longitude, activityLocation.latitude],
            section: sectionName.trim() || undefined,
            osmData: {
              osmId,
              osmType,
            },
          });

          const createData = createResponse.data;
          
          // Backend returns { success: true, data: {...} }
          if (!createData.data || !createData.data._id) {
            throw new Error('Failed to create water body - invalid response');
          }
          
          sharedWaterBodyId = createData.data._id;
          finalSectionName = sectionName.trim() || undefined;
          console.log(`✅ Created SharedWaterBody: ${sharedWaterBodyId}`);
        }
      } else {
        // For SharedWaterBody (with or without section) - use the new structure
        if (!selectedWaterBody.sharedWaterBodyId) {
          throw new Error('Invalid water body selection - missing ID');
        }
        sharedWaterBodyId = selectedWaterBody.sharedWaterBodyId;
        
        // Use GPS location from prop
        activityLocation = location;
        
        // If a section was selected, use its ID
        if (isSection && selectedWaterBody.sectionId) {
          sectionIdToSend = selectedWaterBody.sectionId;
          finalSectionName = selectedWaterBody.sectionName;
        }
      }

      // Now create the activity
      const activityData: any = {
        latitude: activityLocation.latitude,
        longitude: activityLocation.longitude,
        sharedWaterBodyId,
        startDate: activityDate.toISOString(),
      };

      if (activityName.trim()) {
        activityData.name = activityName.trim();
      }

      if (notes.trim()) {
        activityData.notes = notes.trim();
      }

      // Send sectionId for direct reference (normalized approach)
      if (sectionIdToSend) {
        activityData.sectionId = sectionIdToSend;
      }

      // Also send sectionName for backward compatibility / fallback
      if (finalSectionName) {
        activityData.sectionName = finalSectionName;
      }

      if (waterLevel.trim()) {
        activityData.waterLevel = waterLevel.trim();
      }

      if (selectedPaddleType) {
        activityData.paddleType = selectedPaddleType;
      }

      if (photoData) {
        activityData.photo = {
          data: photoData,
          contentType: 'image/jpeg',
          uploadedAt: new Date().toISOString(),
        };
      }

      console.log('📤 Creating manual activity with data:', activityData);
      console.log('🔍 Debug - isSection:', isSection);
      console.log('🔍 Debug - selectedWaterBody.sectionId:', selectedWaterBody.sectionId);
      console.log('🔍 Debug - sectionIdToSend:', sectionIdToSend);
      console.log('🔍 Debug - activityData.sectionId:', activityData.sectionId);

      await activityService.createManualActivity(activityData);

      Alert.alert(
        'Success',
        'Activity created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Call the callback to close the modal and show success
              onActivityCreated();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creating activity:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || error.message || 'Failed to create activity'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Activity</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Activity Details</Text>
        
        {/* Activity Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Activity Name (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Morning paddle, Weekend trip"
            value={activityName}
            onChangeText={setActivityName}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <Text style={styles.helpText}>Give your activity a memorable name</Text>
        </View>

        {/* Notes */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Add notes about your paddle..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect={true}
          />
          <Text style={styles.helpText}>Record memories, conditions, or other details</Text>
        </View>

        {/* Photo Attachment */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Photo (Optional)</Text>
          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.removePhotoButton}
                onPress={removePhoto}
              >
                <Text style={styles.removePhotoText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={showPhotoOptions}
            >
              <Text style={styles.addPhotoIcon}>📷</Text>
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.helpText}>Attach a photo from your paddle (max 20MB, will be automatically compressed)</Text>
        </View>

        {/* Paddle Type */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Paddle Type (Optional)</Text>
          {loadingPaddleTypes ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0ea5e9" />
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowPaddleTypePicker(true)}
              >
                <Text style={[styles.pickerButtonText, !selectedPaddleType && styles.placeholderText]}>
                  {selectedPaddleType 
                    ? paddleTypes.find(t => t.name === selectedPaddleType)?.displayName || selectedPaddleType
                    : 'Select paddle type...'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              
              {/* Paddle Type Picker Modal */}
              <Modal
                visible={showPaddleTypePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPaddleTypePicker(false)}
              >
                <TouchableOpacity 
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowPaddleTypePicker(false)}
                >
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Select Paddle Type</Text>
                      <TouchableOpacity onPress={() => setShowPaddleTypePicker(false)}>
                        <Text style={styles.modalClose}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.pickerScrollView}>
                      <TouchableOpacity
                        style={styles.pickerOption}
                        onPress={() => {
                          setSelectedPaddleType('');
                          setShowPaddleTypePicker(false);
                        }}
                      >
                        <Text style={[styles.pickerOptionText, !selectedPaddleType && styles.selectedOption]}>
                          Select paddle type...
                        </Text>
                      </TouchableOpacity>
                      {(paddleTypes || []).map((type) => (
                        <TouchableOpacity
                          key={type._id}
                          style={styles.pickerOption}
                          onPress={() => {
                            setSelectedPaddleType(type.name);
                            setShowPaddleTypePicker(false);
                          }}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            selectedPaddleType === type.name && styles.selectedOption
                          ]}>
                            {type.displayName || type.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </TouchableOpacity>
              </Modal>
            </>
          )}
          <Text style={styles.helpText}>What type of paddling was this?</Text>
        </View>

        {/* Water Body Collapsible Section */}
        <View style={styles.fieldContainer}>
          <TouchableOpacity 
            style={styles.collapsibleHeader}
            onPress={() => setWaterBodyExpanded(!waterBodyExpanded)}
          >
            <View style={styles.collapsibleHeaderContent}>
              <Text style={styles.collapsibleHeaderTitle}>Water Body Details</Text>
              <Text style={styles.collapsibleHeaderSummary}>
                {selectedWaterBody.name}
                {(isSection && !isOSMWaterBody && selectedWaterBody.sectionName) && ` • ${selectedWaterBody.sectionName}`}
                {waterLevel && ` • ${waterLevel}`}
              </Text>
            </View>
            <Text style={styles.collapsibleIcon}>{waterBodyExpanded ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {waterBodyExpanded && (
            <View style={styles.collapsibleContent}>
              {/* Water Body Name */}
              <View style={styles.collapsibleFieldContainer}>
                <Text style={styles.label}>Water Body</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>{selectedWaterBody.name}</Text>
                </View>
                {isOSMWaterBody && (
                  <Text style={styles.helpText}>From OpenStreetMap - will be added to shared database</Text>
                )}
              </View>

              {/* Section */}
              {isSection && !isOSMWaterBody && (
                <View style={styles.collapsibleFieldContainer}>
                  <Text style={styles.label}>Section</Text>
                  <View style={styles.readOnlyField}>
                    <Text style={styles.readOnlyText}>{selectedWaterBody.sectionName}</Text>
                  </View>
                </View>
              )}

              {/* Section Input for OSM */}
              {isOSMWaterBody && (
                <View style={styles.collapsibleFieldContainer}>
                  <Text style={styles.label}>Section (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Upper Section, Lower Run"
                    value={sectionName}
                    onChangeText={setSectionName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  <Text style={styles.helpText}>Add a section name if applicable</Text>
                </View>
              )}

              {/* Water Level */}
              <View style={styles.collapsibleFieldContainer}>
                <Text style={styles.label}>Water Level (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2.5 feet, Medium, High"
                  value={waterLevel}
                  onChangeText={setWaterLevel}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.helpText}>Record the water conditions</Text>
              </View>
            </View>
          )}
        </View>

        {/* Activity Date */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Activity Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {activityDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Text>
            <Text style={styles.dateButtonIcon}>📅</Text>
          </TouchableOpacity>
          <Text style={styles.helpText}>When did this activity take place?</Text>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={activityDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setActivityDate(selectedDate);
              }
            }}
            maximumDate={new Date()}
          />
        )}

        {/* iOS Done button for date picker */}
        {showDatePicker && Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.datePickerDoneButton}
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={styles.datePickerDoneText}>Done</Text>
          </TouchableOpacity>
        )}


      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Activity</Text>
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
  backButton: {
    padding: 8,
  },
  backButtonText: {
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
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  notesInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 50,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  collapsibleHeaderContent: {
    flex: 1,
  },
  collapsibleHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  collapsibleHeaderSummary: {
    fontSize: 14,
    color: '#6b7280',
  },
  collapsibleIcon: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 8,
  },
  collapsibleContent: {
    marginTop: 12,
    paddingLeft: 8,
  },
  collapsibleFieldContainer: {
    marginBottom: 16,
  },
  readOnlyField: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#6b7280',
    padding: 4,
  },
  pickerScrollView: {
    maxHeight: 400,
  },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  selectedOption: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
  },
  dateButtonIcon: {
    fontSize: 20,
    color: '#6b7280',
  },
  datePickerDoneButton: {
    backgroundColor: '#0ea5e9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  datePickerDoneText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  addPhotoText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});
