// client/src/screens/RankingScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getUserRanking } from '../services/api';
import { API_URL } from '../services/api';

export default function RankingScreen({ navigation }) {
  const { userData } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [rankings, setRankings] = useState([]);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      setIsLoading(true);
      const response = await getUserRanking();
      
      if (response.success) {
        setRankings(response.data);
        
        // Trouver la position de l'utilisateur courant
        const userPosition = response.data.findIndex(
          user => user.id === userData?.id || user._id === userData?.id
        );
        
        if (userPosition !== -1) {
          setUserRank({
            position: userPosition + 1,
            data: response.data[userPosition]
          });
        }
      } else {
        console.error('Error fetching rankings:', response.message);
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserItem = ({ item, index }) => {
    const isCurrentUser = item.id === userData?.id || item._id === userData?.id;
    
    return (
      <View style={[
        styles.userItem, 
        isCurrentUser && styles.currentUserItem
      ]}>
        <Text style={styles.rank}>{index + 1}</Text>
        
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image 
              source={{ uri: `${API_URL}/api/users/avatar/${item.id || item._id}` }} 
              style={styles.avatar} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {item.email.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.userEmail}>{item.email}</Text>
          {isCurrentUser && <Text style={styles.currentUserLabel}>Vous</Text>}
        </View>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreValue}>{item.cachesTrouvees || 0}</Text>
          <Text style={styles.scoreLabel}>geocaches</Text>
        </View>
      </View>
    );
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
      <View style={styles.header}>
        <Text style={styles.title}>Classement des joueurs</Text>
      </View>
      
      {userRank && (
        <View style={styles.userRankContainer}>
          <Text style={styles.userRankText}>
            Vous êtes classé(e) {userRank.position} sur {rankings.length}
          </Text>
        </View>
      )}
      
      <FlatList
        data={rankings}
        renderItem={renderUserItem}
        keyExtractor={(item, index) => `user-${item.id || item._id || index}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun classement disponible</Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={fetchRankings}
      >
        <Text style={styles.refreshButtonText}>Actualiser</Text>
      </TouchableOpacity>
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
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userRankContainer: {
    backgroundColor: '#FFC107',
    padding: 10,
    alignItems: 'center',
  },
  userRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 15,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  rank: {
    width: 30,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentUserLabel: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  refreshButton: {
    margin: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
})