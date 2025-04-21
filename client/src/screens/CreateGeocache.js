// client/src/screens/CreateGeocache.js
import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { AuthContext } from '../context/AuthContext';
import { createGeocache } from '../services/api';

export default function CreateGeocache({ route, navigation }) {
  // Vérifier si des coordonnées ont été passées via les paramètres de route
  const initialCoordinates = route.params?.coordinates || null;
  
  const { userToken } = useContext(AuthContext);
  const [latitude, setLatitude] = useState(initialCoordinates ? initialCoordinates[0].toString() : '');
  const [longitude, setLongitude] = useState(initialCoordinates ? initialCoordinates[1].toString() : '');
  const [difficulty, setDifficulty] = useState('3');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Si nous n'avons pas de coordonnées initiales, essayer d'obtenir la position actuelle
    if (!initialCoordinates) {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
      } else {
        // Position par défaut (ENSEIRB-MATMECA à Talence)
        setLatitude('44.807380');
        setLongitude('-0.605882');
        Alert.alert(
          'Permission refusée',
          'Utilisation d\'une position par défaut. Vous pouvez modifier manuellement les coordonnées.'
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
      // Position par défaut en cas d'erreur
      setLatitude('44.807380');
      setLongitude('-0.605882');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée', 
          'Nous avons besoin de votre permission pour accéder à la galerie'
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const handleCreateGeocache = async () => {
    // Validation des champs
    if (!latitude.trim() || !longitude.trim()) {
      Alert.alert('Erreur', 'Les coordonnées sont requises');
      return;
    }
    
    if (!difficulty || isNaN(Number(difficulty)) || Number(difficulty) < 1 || Number(difficulty) > 5) {
      Alert.alert('Erreur', 'La difficulté doit être un nombre entre 1 et 5');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Créer un FormData pour envoyer les données, y compris la photo
      const formData = new FormData();
      
      // Ajouter les coordonnées sous forme d'objet
      formData.append('coordinates[0]', parseFloat(latitude));
      formData.append('coordinates[1]', parseFloat(longitude));
      formData.append('difficulty', difficulty);
      formData.append('description', description);
      
      // Ajouter la photo si elle existe
      if (selectedImage) {
        const uri = selectedImage;
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('photo', {
          uri: uri,
          name: filename,
          type: type
        });
      }
      
      const response = await createGeocache(formData);
      
      if (response.success) {
        Alert.alert(
          'Succès', 
          'Geocache créée avec succès', 
          [{ text: 'OK', onPress: () => navigation.navigate('Map') }]
        );
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de créer la geocache');
      }
    } catch (error) {
      console.error('Error creating geocache:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création de la geocache');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Créer une nouvelle Geocache</Text>
      
      <Text style={styles.label}>Latitude</Text>
      <TextInput
        style={styles.input}
        value={latitude}
        onChangeText={setLatitude}
        placeholder="Ex: 44.807380"
        keyboardType="numeric"
      />
      
      <Text style={styles.label}>Longitude</Text>
      <TextInput
        style={styles.input}
        value={longitude}
        onChangeText={setLongitude}
        placeholder="Ex: -0.605882"
        keyboardType="numeric"
      />
      
      <Text style={styles.label}>Difficulté (1-5)</Text>
      <View style={styles.difficultyContainer}>
        {[1, 2, 3, 4, 5].map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.difficultyButton,
              parseInt(difficulty) === value && styles.difficultyButtonSelected
            ]}
            onPress={() => setDifficulty(value.toString())}
          >
            <Text 
              style={[
                styles.difficultyButtonText,
                parseInt(difficulty) === value && styles.difficultyButtonTextSelected
              ]}
            >
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={description}
        onChangeText={setDescription}
        placeholder="Décrivez votre geocache, donnez des indices..."
        multiline
      />
      
      <Text style={styles.label}>Photo (optionnelle)</Text>
      <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
        <Text style={styles.photoButtonText}>Choisir une photo</Text>
      </TouchableOpacity>
      
      {selectedImage && (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.photoPreview} />
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleCreateGeocache}
      >
        <Text style={styles.createButtonText}>Créer la Geocache</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>Annuler</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  difficultyButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  difficultyButtonSelected: {
    backgroundColor: '#4CAF50',
  },
  difficultyButtonText: {
    fontSize: 18,
    color: '#4CAF50',
  },
  difficultyButtonTextSelected: {
    color: 'white',
  },
  photoButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  photoButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  photoPreviewContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  photoPreview: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  }
});