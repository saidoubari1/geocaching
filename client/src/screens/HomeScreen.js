// /client/src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [userInfo, setUserInfo] = useState(null);
  const [geocacheCount, setGeocacheCount] = useState(0);

  useEffect(() => {
    getUserInfo();
    fetchGeocacheCount();
  }, []);

  const getUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }
      
      // Décoder le JWT pour obtenir les infos utilisateur
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserInfo(payload);
    } catch (error) {
      console.error('Error getting user info:', error);
    }
  };

  const fetchGeocacheCount = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/geocache`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeocacheCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching geocache count:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue sur Geocaching!</Text>
      
      {userInfo && (
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>Connecté en tant que: {userInfo.email}</Text>
          <Text style={styles.infoText}>Géocaches disponibles: {geocacheCount}</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <Button
          title="Liste des géocaches"
          onPress={() => navigation.navigate('GeocacheList')}
          color="#5cb85c"
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="Carte des géocaches"
          onPress={() => navigation.navigate('MapScreen')}
          color="#0275d8"
        />
        <View style={styles.buttonSpacer} />
        <Button
          title="Créer une géocache"
          onPress={() => navigation.navigate('CreateGeocache')}
          color="#f0ad4e"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8
  },
  buttonContainer: {
    width: '100%',
  },
  buttonSpacer: {
    height: 16
  }
});