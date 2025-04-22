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
  const [showHint, setShowHint] = useState(false);
  
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
        
        // Charger toutes les geocaches
        await loadAllGeocaches();
      } else {
        // Utiliser une position par défaut (ENSEIRB-MATMECA à Talence)
        const defaultLocation = {
          latitude: 44.807380,
          longitude: -0.605882,
        };
        setLocation(defaultLocation);
        
        // Charger toutes les geocaches
        await loadAllGeocaches();
        
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
      await loadAllGeocaches();
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllGeocaches = async () => {
    try {
      console.log("Chargement de toutes les geocaches");
      
      const response = await getAllGeocaches();
      
      if (response.success) {
        console.log("Nombre de geocaches trouvées:", response.data.length);
        setGeocaches(response.data);
      } else {
        Alert.alert('Erreur', 'Impossible de charger les geocaches');
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
                      await loadAllGeocaches();
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
        await loadAllGeocaches();
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

  // Fonction pour calculer la distance entre deux points (formule de Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance en km
    return distance;
  };

  // Niveaux de zoom nécessaires pour voir les géocaches en fonction de leur difficulté
  const getMinimumZoomForDifficulty = (difficulty) => {
    // Plus le niveau est élevé, plus le zoom requis est important
    switch (parseInt(difficulty) || 3) {
      case 1: return 8; // Difficulté 1: visible à partir d'un zoom faible
      case 2: return 10; // Difficulté 2: nécessite un peu plus de zoom
      case 3: return 12; // Difficulté 3: zoom moyen
      case 4: return 14; // Difficulté 4: zoom assez précis
      case 5: return 16; // Difficulté 5: zoom très précis
      default: return 13; // Par défaut: zoom moyen
    }
  };

  // Générer le HTML pour la carte Leaflet
  const generateLeafletMapHtml = () => {
    const userId = userData?.id || userData?._id || '';
    const userLat = location?.latitude || 44.807380;
    const userLng = location?.longitude || -0.605882;
    
    // Préparer les données des geocaches avec les informations nécessaires
    const processedGeocaches = geocaches.map(geocache => {
      // Extraire les coordonnées de la geocache
      let cacheLat, cacheLng;
      if (Array.isArray(geocache.coordinates)) {
        [cacheLat, cacheLng] = geocache.coordinates;
      } else {
        cacheLat = geocache.coordinates?.latitude || geocache.coordinates?.lat || 0;
        cacheLng = geocache.coordinates?.longitude || geocache.coordinates?.lng || 0;
      }
      
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
      
      // Calculer la distance entre l'utilisateur et la geocache
      const distance = calculateDistance(userLat, userLng, cacheLat, cacheLng);
      
      // Déterminer la difficulté
      const difficultyLevel = parseInt(geocache.difficulty) || 3;
      
      // Déterminer le niveau de zoom minimum requis pour voir cette géocache
      const minZoom = getMinimumZoomForDifficulty(difficultyLevel);
      
      // Générer les étoiles pour la difficulté
      const difficultyStars = '★'.repeat(difficultyLevel) + '☆'.repeat(5 - difficultyLevel);
      
      return {
        id: geocache._id,
        lat: cacheLat,
        lng: cacheLng,
        difficulty: difficultyLevel,
        description: geocache.description || '',
        isOwner,
        isFound,
        minZoom,
        difficultyStars,
        distance, // Distance par rapport à l'utilisateur
        creatorEmail: geocache.creatorEmail || 'un autre utilisateur',
        comments: geocache.comments || []
      };
    });
    
    // Créer le HTML
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
          .difficulty-info {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 5px;
          }
          .difficulty-star {
            color: #FFC107;
            font-size: 16px;
            margin-left: 2px;
          }
          .distance-info {
            font-size: 12px;
            color: #2196F3;
            margin-top: 5px;
            font-style: italic;
          }
          .visibility-info {
            font-size: 12px;
            color: #F44336;
            margin-top: 5px;
            font-style: italic;
          }
          .legend {
            padding: 10px;
            background: white;
            border-radius: 5px;
            border: 1px solid #ccc;
            box-shadow: 0 1px 5px rgba(0,0,0,0.4);
            position: absolute;
            bottom: 20px;
            left: 10px;
            z-index: 1000;
          }
          .legend-item {
            margin-bottom: 5px;
            display: flex;
            align-items: center;
          }
          .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 10px;
            margin-right: 8px;
          }
          .legend-text {
            font-size: 12px;
          }
          .zoom-info {
            padding: 10px;
            background: white;
            border-radius: 5px;
            border: 1px solid #ccc;
            box-shadow: 0 1px 5px rgba(0,0,0,0.4);
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        
        <!-- Légende -->
        <div class="legend">
          <div class="legend-item">
            <div class="legend-color" style="background-color: #4CAF50;"></div>
            <div class="legend-text">Vos geocaches</div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #FFC107;"></div>
            <div class="legend-text">Geocaches trouvées</div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #2196F3;"></div>
            <div class="legend-text">Geocaches à trouver</div>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: #f44336;"></div>
            <div class="legend-text">Votre position</div>
          </div>
        </div>
        
        <!-- Info niveau de zoom -->
        <div id="zoom-info" class="zoom-info">
          Niveau de zoom actuel: <span id="current-zoom">-</span>
        </div>
        
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          // Initialiser la carte
          const map = L.map('map').setView([${userLat}, ${userLng}], 13);
          
          // Ajouter la couche de tuiles OpenStreetMap
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          
          // Stocker les marqueurs des geocaches
          const geocacheMarkers = [];
          
          // Ajouter un marqueur pour la position de l'utilisateur
          const userIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
          });
          
          L.marker([${userLat}, ${userLng}], {icon: userIcon})
            .addTo(map)
            .bindPopup('<b>Votre position</b>')
            .openPopup();
          
          // Icône pour les geocaches de l'utilisateur
          const userGeocacheIcon = L.icon({
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
          
          // Icône pour les geocaches à trouver
          const toFindGeocacheIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
          });
          
          // Préparer les données des geocaches
          const geocaches = ${JSON.stringify(processedGeocaches)};
          
          // Fonction pour ajouter ou supprimer des marqueurs en fonction du niveau de zoom
          function updateVisibleGeocaches(zoomLevel) {
            document.getElementById('current-zoom').textContent = zoomLevel;
            
            geocaches.forEach((cache, index) => {
              // Vérifier si le marqueur existe déjà
              if (!geocacheMarkers[index]) {
                // Créer un nouveau marqueur pour cette geocache
                const marker = L.marker([cache.lat, cache.lng], {
                  icon: cache.isOwner 
                    ? userGeocacheIcon 
                    : (cache.isFound ? foundGeocacheIcon : toFindGeocacheIcon)
                });
                
                marker.bindPopup(\`
                  <div class="custom-popup">
                    <div class="cache-info">
                      <h3>Geocache #\${cache.id.substring(0, 6)}</h3>
                      <div class="difficulty-info">
                        <span>Difficulté: </span>
                        <span class="difficulty-star">\${cache.difficultyStars}</span>
                      </div>
                      \${cache.description ? \`<p>\${cache.description}</p>\` : ''}
                      \${
                        cache.isOwner 
                          ? '<p><em>Vous avez créé cette geocache</em></p>' 
                          : cache.isFound 
                            ? '<p><strong>Geocache trouvée ✓</strong></p>' 
                            : \`<button class="find-button" onclick="markGeocacheAsFound('\${cache.id}')">J'ai trouvé cette geocache!</button>\`
                      }
                      <p class="distance-info">Distance: \${cache.distance.toFixed(2)} km</p>
                      <p class="visibility-info">Zoom minimum: \${cache.minZoom}</p>
                    </div>
                    
                    \${cache.isOwner ? \`
                    <button class="edit-button" onclick="editGeocache('\${cache.id}')">Modifier</button>
                    <button class="delete-button" onclick="deleteGeocache('\${cache.id}')">Supprimer</button>
                    \` : \`<p><em>Créée par \${cache.creatorEmail}</em></p>\`}
                    
                    \${cache.comments && cache.comments.length > 0 ? \`
                    <div class="cache-comments">
                      <h4>Commentaires:</h4>
                      \${cache.comments.map(comment => \`
                        <div class="comment">
                          <span class="comment-author">\${comment.commenter || 'Anonyme'}:</span>
                          \${comment.comment || comment.text || ''}
                        </div>
                      \`).join('')}
                    </div>
                    \` : ''}
                  </div>
                \`);
                
                // Stocker le marqueur
                geocacheMarkers[index] = marker;
              }
              
              // Déterminer si la geocache doit être visible
              const shouldBeVisible = (
                cache.isOwner ||            // Toujours visible si c'est la vôtre
                cache.isFound ||            // Toujours visible si déjà trouvée
                zoomLevel >= cache.minZoom  // Visible si le zoom est suffisant
              );
              
              // Ajouter ou supprimer le marqueur selon sa visibilité
              if (shouldBeVisible && !map.hasLayer(geocacheMarkers[index])) {
                geocacheMarkers[index].addTo(map);
              } else if (!shouldBeVisible && map.hasLayer(geocacheMarkers[index])) {
                map.removeLayer(geocacheMarkers[index]);
              }
            });
          }
          
          // Mettre à jour les marqueurs au chargement initial
          updateVisibleGeocaches(map.getZoom());
          
          // Mettre à jour les marqueurs quand le niveau de zoom change
          map.on('zoomend', function() {
            updateVisibleGeocaches(map.getZoom());
          });
          
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

        <TouchableOpacity 
          style={[styles.actionButton, styles.hintButton]}
          onPress={() => setShowHint(!showHint)}
        >
          <Text style={styles.actionButtonText}>?</Text>
        </TouchableOpacity>
      </View>
      
      {/* Infos sur les géocaches */}
      {showHint && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Bienvenue dans l'application Geocaching !
          </Text>
          <Text style={styles.infoDetail}>• Les geocaches apparaissent en fonction du niveau de zoom :</Text>
          <Text style={styles.infoDetail}>   - Difficulté 1: visible à partir du zoom 8</Text>
          <Text style={styles.infoDetail}>   - Difficulté 2: visible à partir du zoom 10</Text>
          <Text style={styles.infoDetail}>   - Difficulté 3: visible à partir du zoom 12</Text>
          <Text style={styles.infoDetail}>   - Difficulté 4: visible à partir du zoom 14</Text>
          <Text style={styles.infoDetail}>   - Difficulté 5: visible à partir du zoom 16</Text>
          <Text style={styles.infoDetail}>• Vos geocaches et celles que vous avez trouvées sont toujours visibles</Text>
          <Text style={styles.infoDetail}>• Zoomez pour découvrir plus de geocaches !</Text>
          <TouchableOpacity onPress={() => setShowHint(false)}>
            <Text style={styles.closeHint}>Fermer</Text>
          </TouchableOpacity>
        </View>
      )}
      
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
  hintButton: {
    backgroundColor: '#FFC107',
  },
  actionButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  infoContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoText: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
  },
  infoDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  closeHint: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
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