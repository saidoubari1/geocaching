// client/src/screens/ProfileScreen.js
import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { getUserRanking, uploadUserAvatar } from '../services/api';
import { API_URL } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { userData, logout, updateUserAvatar } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [userRank, setUserRank] = useState(null);
  
  useEffect(() => {
    fetchUserStats();
  }, []);
  
  const fetchUserStats = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer le classement pour trouver la position de l'utilisateur
      const response = await getUserRanking();
      
      if (response.success) {
        const rankings = response.data;
        // Trouver la position de l'utilisateur courant
        const userPosition = rankings.findIndex(user => user.id === userData?.id || user._id === userData?.id);
        if (userPosition !== -1) {
          setUserRank({
            position: userPosition + 1,
            total: rankings.length,
            data: rankings[userPosition]
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePickAvatar = async () => {
    try {
      // Demander la permission d'accéder à la galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la galerie');
        return;
      }
      
      // Lancer la sélection d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setIsLoading(true);
        
        // Préparer le fichier à envoyer
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        const imageFile = {
          uri: uri,
          name: filename,
          type: type
        };
        
        try {
          // Envoyer l'avatar
          const response = await uploadUserAvatar(imageFile);
          
          if (response.success) {
            // Mettre à jour l'avatar dans le contexte d'authentification
            updateUserAvatar(response.data.avatarUrl);
            
            Alert.alert('Succès', 'Avatar mis à jour avec succès');
          } else {
            Alert.alert('Erreur', response.message || 'Impossible de mettre à jour l\'avatar');
          }
        } catch (error) {
          console.error('Error uploading avatar:', error);
          Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour de l\'avatar');
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
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
      Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion');
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Profil</Text>
      </View>
      
      <View style={styles.profileSection}>
        <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar}>
          {userData?.avatar ? (
            <Image 
              source={{ uri: `${API_URL}/api/users/avatar/${userData.id}?t=${new Date().getTime()}` }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {userData?.email?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <View style={styles.editAvatarButton}>
            <Text style={styles.editAvatarButtonText}>📷</Text>
          </View>
        </TouchableOpacity>
        
        <Text style={styles.userName}>{userData?.email}</Text>
        
        {userRank && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>
              Rang {userRank.position} / {userRank.total}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Mes Statistiques</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userRank?.data?.cachesTrouvees || 0}</Text>
            <Text style={styles.statLabel}>Caches trouvées</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userRank?.position || '-'}</Text>
            <Text style={styles.statLabel}>Classement</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('GeocacheList')}
        >
          <Text style={styles.actionButtonText}>Mes Geocaches</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Ranking')}
        >
          <Text style={styles.actionButtonText}>Voir le Classement</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Text style={styles.actionButtonText}>Carte des Geocaches</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileSection: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#666',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  editAvatarButtonText: {
    fontSize: 16,
    color: 'white',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  rankBadge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  rankText: {
    fontWeight: 'bold',
    color: '#333',
  },
  statsSection: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  actionsSection: {
    margin: 20,
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
  }
});