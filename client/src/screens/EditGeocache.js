// client/src/screens/EditGeocache.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../services/api';

export default function EditGeocache({ route, navigation }) {
  const { geocache } = route.params;
  
  // États pour les champs du formulaire
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [description, setDescription] = useState('');
  
  // Initialiser les champs avec les valeurs existantes
  useEffect(() => {
    if (geocache) {
      // Initialiser les coordonnées en fonction du format
      if (Array.isArray(geocache.coordinates)) {
        setLatitude(String(geocache.coordinates[0] || ''));
        setLongitude(String(geocache.coordinates[1] || ''));
      } else if (typeof geocache.coordinates === 'object') {
        setLatitude(String(geocache.coordinates.lat || geocache.coordinates.latitude || ''));
        setLongitude(String(geocache.coordinates.lng || geocache.coordinates.longitude || ''));
      }
      
      // Initialiser les autres champs
      setDifficulty(geocache.difficulty || '');
      setDescription(geocache.description || '');
    }
  }, [geocache]);
  
  const handleUpdateGeocache = async () => {
    // Validation de base
    if (!latitude.trim() || !longitude.trim()) {
      Alert.alert('Erreur', 'Les coordonnées sont requises');
      return;
    }
    if (!difficulty.trim()) {
      Alert.alert('Erreur', 'La difficulté est requise');
      return;
    }
    
    // Convertir les coordonnées en nombres
    let lat, lng;
    try {
      lat = parseFloat(latitude.trim());
      lng = parseFloat(longitude.trim());
      
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Format invalide');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Format de coordonnées invalide. Veuillez entrer des nombres valides.');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/geocache/${geocache._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          coordinates: [lat, lng],
          difficulty,
          description: description.trim()
        })
      });
      
      if (response.ok) {
        Alert.alert('Succès', 'Géocache mise à jour avec succès', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.message || 'Erreur lors de la mise à jour de la géocache');
      }
    } catch (error) {
      console.error('Error updating geocache:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour de la géocache');
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Modifier la Géocache</Text>
        
        <Text style={styles.label}>Latitude</Text>
        <TextInput
          style={styles.input}
          value={latitude}
          onChangeText={setLatitude}
          placeholder="Ex: 44.837789"
          keyboardType="numeric"
        />
        
        <Text style={styles.label}>Longitude</Text>
        <TextInput
          style={styles.input}
          value={longitude}
          onChangeText={setLongitude}
          placeholder="Ex: -0.57918"
          keyboardType="numeric"
        />
        
        <Text style={styles.label}>Difficulté</Text>
        <TextInput
          style={styles.input}
          value={difficulty}
          onChangeText={setDifficulty}
          placeholder="Ex: facile, moyenne, difficile"
        />
        
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="Décrivez votre géocache..."
          multiline
        />
        
        <View style={styles.buttonContainer}>
          <Button title="Mettre à jour" onPress={handleUpdateGeocache} color="#4CAF50" />
          <Button title="Annuler" onPress={() => navigation.goBack()} color="#f44336" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginVertical: 8,
  },
  multilineInput: {
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  }
});