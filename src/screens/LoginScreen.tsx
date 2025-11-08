import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { authService } from '../services';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      const result = await authService.loginWithGoogle();
      
      if (result.success) {
        onLoginSuccess();
      } else {
        Alert.alert(
          'Authentication Failed',
          result.error || 'Unable to sign in with Google'
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Authentication Error',
        error.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🏄‍♂️</Text>
        <Text style={styles.title}>Paddle Partner</Text>
        <Text style={styles.subtitle}>Track Your Paddle Adventures</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome!</Text>
          <Text style={styles.cardText}>
            Sign in with Google to start tracking your paddle sports activities.
          </Text>
          
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.infoText}>
            This will open a browser to securely authenticate with your Google account
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0ea5e9',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#e0f2fe',
    marginBottom: 60,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 16,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
    lineHeight: 24,
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285f4',
    marginRight: 12,
    backgroundColor: '#ffffff',
    width: 28,
    height: 28,
    lineHeight: 28,
    textAlign: 'center',
    borderRadius: 4,
  },
  googleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
