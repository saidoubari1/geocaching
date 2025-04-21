import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../services/api';

export default function GeocacheList({ navigation }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGeocaches();
  }, []);

  const fetchGeocaches = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        navigation.navigate('Login');
        return;
      }
      
      console.log('Fetching geocaches with token:', token);
      const response = await fetch(`${API_URL}/api/geocache`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch geocaches');
      }
      
      const data = await response.json();
      console.log('Geocaches data:', data);
      setList(data);
    } catch (err) {
      console.error('Error fetching geocaches:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to safely display coordinates in any format
  const formatCoordinates = (coordinates) => {
    if (Array.isArray(coordinates)) {
      return coordinates.join(', ');
    } else if (typeof coordinates === 'object') {
      // Handle if coordinates is an object with lat/lng properties
      return `${coordinates.lat || coordinates.latitude || 0}, ${coordinates.lng || coordinates.longitude || 0}`;
    } else if (typeof coordinates === 'string') {
      return coordinates;
    } else {
      // Fallback for any other format
      return JSON.stringify(coordinates);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Chargement des géocaches...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>Erreur: {error}</Text>
        <Button title="Réessayer" onPress={fetchGeocaches} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {list.length === 0 ? (
        <View style={styles.centered}>
          <Text>Aucune géocache trouvée</Text>
          <Button 
            title="Ajouter une géocache" 
            onPress={() => navigation.navigate('CreateGeocache')}
            style={styles.button}
          />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={item => item._id}
          renderItem={({ item }) => {
            // Vérifier si les coordonnées existent et afficher de manière appropriée
            const coordsDisplay = item.coordinates ? 
              (Array.isArray(item.coordinates) ? 
                item.coordinates.join(', ') : 
                (typeof item.coordinates === 'object' ? 
                  `${item.coordinates.lat || item.coordinates.latitude || 0}, ${item.coordinates.lng || item.coordinates.longitude || 0}` : 
                  JSON.stringify(item.coordinates)
                )
              ) : 'Non disponible';
              
            return (
              <View style={styles.card}>
                <Text>📍 Coordonnées: {coordsDisplay}</Text>
                <Text>⚙️ Difficulté: {item.difficulty}</Text>
                {item.description && <Text>📝 {item.description}</Text>}
                <Button
                  title="Voir détails"
                  onPress={() =>
                    navigation.navigate('GeocacheDetail', { id: item._id })
                  }
                />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16 
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
  button: {
    marginTop: 15
  }
});