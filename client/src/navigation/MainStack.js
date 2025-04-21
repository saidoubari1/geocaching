// client/src/navigation/MainStack.js
import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import GeocacheList from '../screens/GeocacheList';
import GeocacheDetail from '../screens/GeocacheDetail';
import CreateGeocache from '../screens/CreateGeocache';
import EditGeocache from '../screens/EditGeocache';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RankingScreen from '../screens/RankingScreen';

const Stack = createStackNavigator();

export default function MainStack() {
  const { userToken, isLoading } = useContext(AuthContext);
  
  // Afficher un écran de chargement pendant la vérification du token
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }
  
  // Stack de navigation pour les utilisateurs non authentifiés
  const AuthStack = () => (
    <Stack.Navigator 
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
  
  // Stack de navigation pour les utilisateurs authentifiés
  const AppStack = () => (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4CAF50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="GeocacheList" 
        component={GeocacheList} 
        options={{ title: 'Liste des Geocaches' }}
      />
      <Stack.Screen 
        name="GeocacheDetail" 
        component={GeocacheDetail}
        options={{ title: 'Détails' }}
      />
      <Stack.Screen 
        name="CreateGeocache" 
        component={CreateGeocache}
        options={{ title: 'Créer une Geocache' }}
      />
      <Stack.Screen 
        name="EditGeocache" 
        component={EditGeocache}
        options={{ title: 'Modifier la Geocache' }}
      />
      <Stack.Screen 
        name="Map" 
        component={MapScreen}
        options={{ title: 'Carte des Geocaches' }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
      <Stack.Screen 
        name="Ranking" 
        component={RankingScreen}
        options={{ title: 'Classement' }}
      />
    </Stack.Navigator>
  );
  
  // Retourne le stack approprié selon l'état d'authentification
  return userToken ? <AppStack /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});