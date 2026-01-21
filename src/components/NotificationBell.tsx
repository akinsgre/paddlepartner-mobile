import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface NotificationBellProps {
  unreadCount: number;
  onPress: () => void;
  size?: number;
  color?: string;
}

export default function NotificationBell({
  unreadCount,
  onPress,
  size = 24,
  color = '#ffffff',
}: NotificationBellProps) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={styles.container}
      testID="notification-bell"
    >
      <MaterialCommunityIcons name="bell" size={size} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
});
