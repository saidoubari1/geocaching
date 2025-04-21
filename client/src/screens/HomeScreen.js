// client/src/screens/HomeScreen.js
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getAllGeocaches, getUserRanking } from '../services/api';
import * as Location from 'expo-location';

export default function HomeScreen({ navigation }) {
  const { userData, logout, isLoading: authLoading } = useContext(AuthContext);
  const [geocacheCount, setGeocacheCount] = useState(0);
  const [topUsers, setTopUsers] = useState([]);
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
    requestLocationPermission();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Charger les geocaches
      const geocachesResponse = await getAllGeocaches();
      if (geocachesResponse.success) {
        setGeocacheCount(geocachesResponse.data.length);
      }
      
      // Charger le classement des utilisateurs
      const rankingResponse = await getUserRanking();
      if (rankingResponse.success) {
        setTopUsers(rankingResponse.data.slice(0, 3)); // Top 3 utilisateurs
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } else {
        // Simuler une position (ENSEIRB-MATMECA à Talence)
        setLocation({
          latitude: 44.807380,
          longitude: -0.605882,
        });
        Alert.alert(
          'Permission refusée',
          'Utilisation d\'une position par défaut. Pour une meilleure expérience, veuillez accorder la permission de localisation.'
        );
      }
    } catch (error) {
      console.error('Error getting location:', error);
      // Utiliser une position par défaut
      setLocation({
        latitude: 44.807380,
        longitude: -0.605882,
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (isLoading || authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            {userData?.avatar ? (
              <Image 
                source={{ uri: `${API_URL}/api/users/avatar/${userData.id}` }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {userData?.email?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Bienvenue,</Text>
            <Text style={styles.emailText}>{userData?.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{geocacheCount}</Text>
            <Text style={styles.statLabel}>Geocaches disponibles</Text>
          </View>
          {location && (
            <View style={styles.statCard}>
              <Text style={styles.statValue}>Activé</Text>
              <Text style={styles.statLabel}>Géolocalisation</Text>
            </View>
          )}
        </View>
      </View>

      {topUsers.length > 0 && (
        <View style={styles.rankingContainer}>
          <Text style={styles.sectionTitle}>Top Utilisateurs</Text>
          {topUsers.map((user, index) => (
            <View key={index} style={styles.rankingRow}>
              <Text style={styles.rankingPosition}>{index + 1}</Text>
              <View style={styles.rankingAvatarContainer}>
                {user.avatar ? (
                  <Image 
                    source={{ uri: `${API_URL}/api/users/avatar/${user.id}` }} 
                    style={styles.rankingAvatar} 
                  />
                ) : (
                  <View style={styles.rankingAvatarPlaceholder}>
                    <Text style={styles.rankingAvatarText}>
                      {user.email.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.rankingEmail}>{user.email}</Text>
              <Text style={styles.rankingScore}>{user.cachesTrouvees || 0}</Text>
            </View>
          ))}
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Ranking')}
          >
            <Text style={styles.viewAllButtonText}>Voir tout le classement</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Menu</Text>
        <View style={styles.menuGrid}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Map')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.menuIconText}>🗺️</Text>
            </View>
            <Text style={styles.menuText}>Carte</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('GeocacheList')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#2196F3' }]}>
              <Text style={styles.menuIconText}>📋</Text>
            </View>
            <Text style={styles.menuText}>Liste</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('CreateGeocache')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#FFC107' }]}>
              <Text style={styles.menuIconText}>➕</Text>
            </View>
            <Text style={styles.menuText}>Créer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#9C27B0' }]}>
              <Text style={styles.menuIconText}>👤</Text>
            </View>
            <Text style={styles.menuText}>Profil</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
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
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    color: 'white',
    opacity: 0.8,
    fontSize: 14,
  },
  emailText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  rankingContainer: {
    margin: 20,
    marginTop: 0,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  rankingPosition: {
    width: 25,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  rankingAvatarContainer: {
    marginRight: 10,
  },
  rankingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rankingAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankingAvatarText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  rankingEmail: {
    flex: 1,
    fontSize: 16,
  },
  rankingScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  viewAllButton: {
    alignItems: 'center',
    marginTop: 10,
  },
  viewAllButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  menuContainer: {
    margin: 20,
    marginTop: 0,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuIconText: {
    fontSize: 24,
  },
  menuText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    margin: 20,
    backgroundColor: '#f44336',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
})