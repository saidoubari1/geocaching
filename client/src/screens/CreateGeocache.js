// client/src/screens/CreateGeocache.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../services/api';

export default function CreateGeocache({ navigation }) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateGeocache = async () => {
    // Basic validation
    if (!latitude.trim() || !longitude.trim()) {
      Alert.alert('Erreur', 'Les coordonnées sont requises');
      return;
    }
    if (!difficulty.trim()) {
      Alert.alert('Erreur', 'La difficulté est requise');
      return;
    }

    // Parse coordinates
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
      
      const response = await fetch(`${API_URL}/api/geocache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          coordinates: [lat, lng],  // Envoi sous forme de tableau
          difficulty,
          description: description.trim() || undefined
        })
      });

      if (response.ok) {
        Alert.alert('Succès', 'Géocache créée avec succès', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.message || 'Erreur lors de la création de la géocache');
      }
    } catch (error) {
      console.error('Error creating geocache:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création de la géocache');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Créer une Nouvelle Géocache</Text>
        
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
        
        <Text style={styles.label}>Description (optionnelle)</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="Décrivez votre géocache..."
          multiline
        />
        
        <View style={styles.buttonContainer}>
          <Button title="Créer" onPress={handleCreateGeocache} />
          <Button title="Annuler" color="gray" onPress={() => navigation.goBack()} />
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