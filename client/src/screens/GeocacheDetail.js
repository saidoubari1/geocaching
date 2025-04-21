// client/src/screens/GeocacheDetail.js
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../services/api';

export default function GeocacheDetail({ route, navigation }) {
  const { id } = route.params;
  const [geocache, setGeocache] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    fetchGeocacheDetails();
    fetchUserInfo();
  }, []);

  const fetchGeocacheDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/geocache/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Geocache details:", data);
        setGeocache(data);
      } else {
        Alert.alert('Erreur', 'Impossible de récupérer les détails de la géocache');
      }
    } catch (error) {
      console.error('Error fetching geocache details:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la récupération des détails');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      const payload = JSON.parse(atob(token.split('.')[1])); // Decode JWT payload
      setUserInfo(payload);
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un commentaire');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/geocache/${id}/comment`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });
      
      if (response.ok) {
        Alert.alert('Succès', 'Commentaire ajouté avec succès');
        setComment('');
        fetchGeocacheDetails(); // Refresh to show the new comment
      } else {
        Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ajout du commentaire');
    }
  };

  // Function to safely display coordinates in any format
  const formatCoordinates = (coordinates) => {
    if (!coordinates) return "Non disponible";
    
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
        <Text>Chargement des détails...</Text>
      </View>
    );
  }

  if (!geocache) {
    return (
      <View style={styles.centered}>
        <Text>Géocache non trouvée</Text>
        <Button title="Retour" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const isOwner = userInfo && geocache.creator === userInfo.id;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Détails de la Géocache</Text>
        
        <Text style={styles.label}>Coordonnées:</Text>
        <Text style={styles.value}>{formatCoordinates(geocache.coordinates)}</Text>
        
        <Text style={styles.label}>Difficulté:</Text>
        <Text style={styles.value}>{geocache.difficulty}</Text>
        
        {geocache.description && (
          <>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{geocache.description}</Text>
          </>
        )}

        {isOwner && (
          <View style={styles.buttonContainer}>
            <Button 
              title="Modifier" 
              onPress={() => navigation.navigate('EditGeocache', { geocache })} 
            />
            <Button 
              title="Supprimer" 
              color="red"
              onPress={() => {
                Alert.alert(
                  'Confirmation',
                  'Êtes-vous sûr de vouloir supprimer cette géocache ?',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { 
                      text: 'Supprimer', 
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const token = await AsyncStorage.getItem('token');
                          const response = await fetch(`${API_URL}/api/geocache/${id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          
                          if (response.ok) {
                            Alert.alert('Succès', 'Géocache supprimée avec succès');
                            navigation.goBack();
                          } else {
                            Alert.alert('Erreur', 'Impossible de supprimer la géocache');
                          }
                        } catch (error) {
                          console.error('Error deleting geocache:', error);
                          Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
                        }
                      }
                    }
                  ]
                );
              }} 
            />
          </View>
        )}
      </View>

      {/* Comments section */}
      <View style={styles.card}>
        <Text style={styles.title}>Commentaires</Text>
        
        {geocache.comments && geocache.comments.length > 0 ? (
          geocache.comments.map((comment, index) => (
            <View key={index} style={styles.comment}>
              <Text style={styles.commentText}>{comment.comment}</Text>
              <Text style={styles.commentMeta}>
                Par: {comment.commenter} • {new Date(comment.commentedAt).toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <Text>Aucun commentaire pour le moment</Text>
        )}

        <View style={styles.addComment}>
          <Text style={styles.label}>Ajouter un commentaire:</Text>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Votre commentaire..."
            multiline
          />
          <Button title="Ajouter" onPress={handleAddComment} />
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
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
  value: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  comment: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  commentText: {
    marginBottom: 4,
  },
  commentMeta: {
    fontSize: 12,
    color: '#666',
  },
  addComment: {
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginVertical: 8,
    minHeight: 80,
  },
});