// client/src/screens/MapScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Modal,
  TextInput
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { AuthContext } from '../context/AuthContext';
import { 
  getAllGeocaches,
  getNearbyGeocaches,
  markGeocacheAsFound,
  deleteGeocache
} from '../services/api';

export default function MapScreen({ navigation }) {
  const { userData, userToken } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [geocaches, setGeocaches] = useState([]);
  
  // États pour le modal de commentaire
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedCacheId, setSelectedCacheId] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    requestLocationAndLoadGeocaches();
  }, []);

  const requestLocationAndLoadGeocaches = async () => {
    try {
      setIsLoading(true);
      
      // Demander la permission de localisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        const userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(userLocation);
        
        // Charger les geocaches à proximité
        await loadNearbyGeocaches(userLocation);
      } else {
        // Utiliser une position par défaut (ENSEIRB-MATMECA à Talence)
        const defaultLocation = {
          latitude: 44.807380,
          longitude: -0.605882,
        };
        setLocation(defaultLocation);
        
        // Charger les geocaches à proximité avec la position par défaut
        await loadNearbyGeocaches(defaultLocation);
        
        Alert.alert(
          'Permission refusée',
          'Utilisation d\'une position par défaut. Pour une meilleure expérience, veuillez accorder la permission de localisation.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
      
      // Utiliser une position par défaut en cas d'erreur
      const defaultLocation = {
        latitude: 44.807380,
        longitude: -0.605882,
      };
      setLocation(defaultLocation);
      
      // Charger les geocaches avec la position par défaut
      await loadNearbyGeocaches(defaultLocation);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNearbyGeocaches = async (location) => {
    try {
      // Essayer d'abord de récupérer les geocaches à proximité
      const response = await getNearbyGeocaches(location.latitude, location.longitude, 5);
      
      if (response.success) {
        setGeocaches(response.data);
      } else {
        // Si l'API de proximité n'est pas disponible, charger toutes les geocaches
        const allGeocachesResponse = await getAllGeocaches();
        if (allGeocachesResponse.success) {
          setGeocaches(allGeocachesResponse.data);
        } else {
          Alert.alert('Erreur', 'Impossible de charger les geocaches');
        }
      }
    } catch (error) {
      console.error('Error loading geocaches:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du chargement des geocaches');
    }
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'VIEW_GEOCACHE':
          navigation.navigate('GeocacheDetail', { id: data.geocacheId });
          break;
          
        case 'EDIT_GEOCACHE':
          // Trouver la geocache à modifier
          const geocache = geocaches.find(g => g._id === data.geocacheId);
          if (geocache) {
            navigation.navigate('EditGeocache', { geocache });
          }
          break;
          
        case 'DELETE_GEOCACHE':
          Alert.alert(
            'Confirmation',
            'Êtes-vous sûr de vouloir supprimer cette geocache ?',
            [
              { text: 'Annuler', style: 'cancel' },
              { 
                text: 'Supprimer', 
                style: 'destructive',
                onPress: async () => {
                  try {
                    setIsLoading(true);
                    const response = await deleteGeocache(data.geocacheId);
                    if (response.success) {
                      // Recharger les geocaches après la suppression
                      await loadNearbyGeocaches(location);
                      Alert.alert('Succès', 'Geocache supprimée avec succès');
                    } else {
                      Alert.alert('Erreur', response.message || 'Impossible de supprimer la geocache');
                    }
                  } catch (error) {
                    console.error('Error deleting geocache:', error);
                    Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
                  } finally {
                    setIsLoading(false);
                  }
                }
              }
            ]
          );
          break;
          
        case 'MARK_FOUND':
          // Ouvrir le modal pour ajouter un commentaire
          setSelectedCacheId(data.geocacheId);
          setComment('');
          setCommentModalVisible(true);
          break;
          
        case 'MAP_CLICK':
          // Pour permettre la création d'une nouvelle geocache à cet emplacement
          navigation.navigate('CreateGeocache', {
            coordinates: [data.latitude, data.longitude]
          });
          break;
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const handleMarkAsFound = async () => {
    if (!selectedCacheId) return;
    
    try {
      setIsLoading(true);
      const response = await markGeocacheAsFound(selectedCacheId, comment);
      
      if (response.success) {
        Alert.alert('Succès', 'Geocache marquée comme trouvée !');
        setCommentModalVisible(false);
        // Recharger les geocaches pour mettre à jour l'interface
        await loadNearbyGeocaches(location);
      } else {
        Alert.alert('Erreur', response.message || 'Impossible de marquer la geocache comme trouvée');
      }
    } catch (error) {
      console.error('Error marking geocache as found:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // Générer le HTML pour la carte Leaflet
  const generateLeafletMapHtml = () => {
    const userId = userData?.id || userData?._id || '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
        <style>
          body { padding: 0; margin: 0; }
          html, body, #map { height: 100%; width: 100%; }
          .custom-popup { text-align: center; }
          .find-button, .edit-button, .delete-button {
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            font-weight: bold;
            display: block;
            width: 100%;
            margin-bottom: 5px;
          }
          .find-button {
            background-color: #4CAF50;
            color: white;
          }
          .edit-button {
            background-color: #2196F3;
            color: white;
          }
          .delete-button {
            background-color: #f44336;
            color: white;
          }
          .cache-info {
            margin-bottom: 10px;
          }
          .cache-comments {
            margin-top: 10px;
            border-top: 1px solid #eee;
            padding-top: 10px;
            text-align: left;
          }
          .comment {
            margin-bottom: 5px;
            font-size: 14px;
          }
          .comment-author {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          // Définir l'ID utilisateur en JS
          const currentUserId = "${userId}";
          console.log("ID utilisateur dans JS:", currentUserId);
  
          // Initialiser la carte
          const map = L.map('map').setView([${location?.latitude || 44.807380}, ${location?.longitude || -0.605882}], 15);
          
          // Ajouter la couche de tuiles OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          
          // Ajouter un marqueur pour la position de l'utilisateur
          const userIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
          });
          
          L.marker([${location?.latitude || 44.807380}, ${location?.longitude || -0.605882}], {icon: userIcon})
            .addTo(map)
            .bindPopup('Votre position')
            .openPopup();
          
          // Icône pour les geocaches
          const geocacheIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
          });
          
          // Icône pour les geocaches trouvées
          const foundGeocacheIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
          });
          
          // Ajouter les geocaches à la carte
          ${geocaches.map(geocache => {
            // Vérifier si les coordonnées existent et normaliser le format
            const coordinates = Array.isArray(geocache.coordinates) 
              ? geocache.coordinates 
              : [geocache.coordinates?.latitude || geocache.coordinates?.lat || 0, 
                 geocache.coordinates?.longitude || geocache.coordinates?.lng || 0];
            
            // Vérifier si l'utilisateur a trouvé cette geocache
            let isFound = false;
            if (geocache.findings) {
              isFound = geocache.findings.some(finding => {
                if (typeof finding === 'string') return finding === userId;
                return finding.user === userId;
              });
            } else if (geocache.foundBy) {
              isFound = Array.isArray(geocache.foundBy) && geocache.foundBy.includes(userId);
            }
            
            // Vérifier si l'utilisateur est le créateur
            const isOwner = geocache.creator === userId;
            
            return `
              L.marker([${coordinates[0]}, ${coordinates[1]}], {
                icon: ${isFound ? 'foundGeocacheIcon' : 'geocacheIcon'}
              })
                .addTo(map)
                .bindPopup(\`
                  <div class="custom-popup">
                    <div class="cache-info">
                      <h3>Geocache #${geocache._id.substring(0, 6)}</h3>
                      <p>Difficulté: ${geocache.difficulty}/5</p>
                      ${geocache.description ? `<p>${geocache.description}</p>` : ''}
                      ${!isFound && !isOwner ? 
                        `<button class="find-button" onclick="markGeocacheAsFound('${geocache._id}')">J'ai trouvé cette geocache!</button>` : 
                        isOwner ? '<p><em>Vous avez créé cette geocache</em></p>' : 
                        '<p><strong>Geocache trouvée ✓</strong></p>'
                      }
                    </div>
                    
                    ${isOwner ? `
                    <button class="edit-button" onclick="editGeocache('${geocache._id}')">Modifier</button>
                    <button class="delete-button" onclick="deleteGeocache('${geocache._id}')">Supprimer</button>
                    ` : `<p><em>Créée par ${geocache.creatorEmail || 'un autre utilisateur'}</em></p>`}
                    
                    ${geocache.comments && geocache.comments.length > 0 ? `
                    <div class="cache-comments">
                      <h4>Commentaires:</h4>
                      ${geocache.comments.map(comment => `
                        <div class="comment">
                          <span class="comment-author">${comment.commenter || 'Anonyme'}:</span>
                          ${comment.comment || comment.text || ''}
                        </div>
                      `).join('')}
                    </div>
                    ` : ''}
                  </div>
                \`);
            `;
          }).join('')}
          
          // Fonction pour marquer une geocache comme trouvée
          function markGeocacheAsFound(geocacheId) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MARK_FOUND',
              geocacheId: geocacheId
            }));
          }
          
          // Fonction pour modifier une geocache
          function editGeocache(geocacheId) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'EDIT_GEOCACHE',
              geocacheId: geocacheId
            }));
          }
          
          // Fonction pour supprimer une geocache
          function deleteGeocache(geocacheId) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette geocache?')) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'DELETE_GEOCACHE',
                geocacheId: geocacheId
              }));
            }
          }
          
          // Fonction pour voir les détails d'une geocache
          function viewGeocacheDetails(geocacheId) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'VIEW_GEOCACHE',
              geocacheId: geocacheId
            }));
          }
          
          // Ajouter un listener de clic sur la carte pour créer une nouvelle geocache
          map.on('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'MAP_CLICK',
              latitude: e.latlng.lat,
              longitude: e.latlng.lng
            }));
          });
        </script>
      </body>
      </html>
    `;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: generateLeafletMapHtml() }}
        style={styles.map}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        onMessage={handleWebViewMessage}
      />
      
      {/* Actions flottantes */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('CreateGeocache')}
        >
          <Text style={styles.actionButtonText}>+</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.refreshButton]}
          onPress={() => requestLocationAndLoadGeocaches()}
        >
          <Text style={styles.actionButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>
      
      {/* Modal pour ajouter un commentaire lors du marquage comme trouvé */}
      <Modal
        visible={commentModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>J'ai trouvé cette geocache!</Text>
            
            <TextInput
              style={styles.commentInput}
              placeholder="Ajouter un commentaire (facultatif)"
              value={comment}
              onChangeText={setComment}
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCommentModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleMarkAsFound}
              >
                <Text style={styles.confirmButtonText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#333',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});