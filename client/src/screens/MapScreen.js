// client/src/screens/MapScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../services/api';

// Import conditionnel de WebView
let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

export default function MapScreen({ navigation }) {
  const [geocaches, setGeocaches] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    fetchGeocaches();
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserInfo(payload);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchGeocaches = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${API_URL}/api/geocache`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGeocaches(data);
      }
    } catch (error) {
      console.error('Error fetching geocaches:', error);
    }
  };

  // Rendu pour la plateforme web
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Carte des Géocaches</Text>
        <Text style={styles.message}>
          La carte n'est pas disponible en mode web.
          Veuillez utiliser l'application sur un appareil mobile pour voir la carte.
        </Text>
        <Text style={styles.message}>
          Vous pouvez consulter la liste des géocaches en utilisant la navigation.
        </Text>
      </View>
    );
  }

  // Préparer les données des géocaches pour la carte
  const prepareGeocachesForMap = () => {
    return geocaches.map(cache => {
      // Normaliser les coordonnées
      let coords = [0, 0];
      
      if (Array.isArray(cache.coordinates)) {
        coords = cache.coordinates;
      } else if (typeof cache.coordinates === 'object') {
        coords = [
          cache.coordinates.lat || cache.coordinates.latitude || 0,
          cache.coordinates.lng || cache.coordinates.longitude || 0
        ];
      }
      
      // Vérifier si cette géocache appartient à l'utilisateur
      const isOwner = userInfo && cache.creator === userInfo.id;
      
      return {
        id: cache._id,
        coordinates: coords,
        difficulty: cache.difficulty,
        description: cache.description || 'Pas de description',
        isOwner
      };
    });
  };

  // Créer le HTML pour la carte Leaflet
  const createMapHTML = () => {
    const geocachesData = prepareGeocachesForMap();
    const initialLocation = geocachesData.length > 0 ? 
      geocachesData[0].coordinates : [51.505, -0.09];

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Carte des Géocaches</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
          body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            width: 100%;
          }
          #map {
            height: 100vh;
            width: 100%;
          }
          .custom-popup .leaflet-popup-content-wrapper {
            background: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          }
          .custom-popup .leaflet-popup-content {
            margin: 10px;
            font-family: Arial, sans-serif;
          }
          .popup-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .popup-button {
            background-color: #4CAF50;
            border: none;
            color: white;
            padding: 5px 10px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
            margin: 4px 2px;
            cursor: pointer;
            border-radius: 4px;
          }
          .popup-button-delete {
            background-color: #f44336;
          }
          .popup-button-edit {
            background-color: #2196F3;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          // Initialiser la carte
          const map = L.map('map').setView(${JSON.stringify(initialLocation)}, 13);
          
          // Ajouter les tuiles OpenStreetMap
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          }).addTo(map);
          
          // Ajouter les marqueurs pour chaque géocache
          const geocaches = ${JSON.stringify(geocachesData)};
          
          geocaches.forEach(cache => {
            // Créer le contenu du popup
            let popupContent = \`
              <div class="popup-title">Difficulté: \${cache.difficulty}</div>
              <div>\${cache.description}</div>
              <button class="popup-button" onclick="window.ReactNativeWebView.postMessage('view_' + '\${cache.id}')">
                Voir détails
              </button>
            \`;
            
            // Ajouter des boutons d'édition et de suppression si l'utilisateur est le propriétaire
            if (cache.isOwner) {
              popupContent += \`
                <button class="popup-button popup-button-edit" onclick="window.ReactNativeWebView.postMessage('edit_' + '\${cache.id}')">
                  Modifier
                </button>
                <button class="popup-button popup-button-delete" onclick="window.ReactNativeWebView.postMessage('delete_' + '\${cache.id}')">
                  Supprimer
                </button>
              \`;
            }
            
            // Créer le marqueur avec le popup
            const marker = L.marker(cache.coordinates)
              .addTo(map)
              .bindPopup(popupContent);
            
            // Ajouter une classe pour le style du popup
            marker.on('popupopen', function(e) {
              e.popup._container.className += ' custom-popup';
            });
          });
          
          // Ajuster la vue de la carte pour montrer tous les marqueurs
          if (geocaches.length > 0) {
            const bounds = [];
            geocaches.forEach(cache => {
              bounds.push(cache.coordinates);
            });
            map.fitBounds(bounds);
          }
        </script>
      </body>
      </html>
    `;
  };

  // Gérer les messages de la WebView
  const handleMessage = (event) => {
    const message = event.nativeEvent.data;
    
    if (message.startsWith('view_')) {
      const geocacheId = message.replace('view_', '');
      navigation.navigate('GeocacheDetail', { id: geocacheId });
    } 
    else if (message.startsWith('edit_')) {
      const geocacheId = message.replace('edit_', '');
      const geocache = geocaches.find(g => g._id === geocacheId);
      if (geocache) {
        navigation.navigate('EditGeocache', { geocache });
      }
    } 
    else if (message.startsWith('delete_')) {
      const geocacheId = message.replace('delete_', '');
      navigation.navigate('GeocacheDetail', { id: geocacheId, action: 'delete' });
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: createMapHTML() }}
        style={styles.webview}
        javaScriptEnabled={true}
        onMessage={handleMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});