import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import GeocacheList from '../screens/GeocacheList';
import GeocacheDetail from '../screens/GeocacheDetail';
import CreateGeocache from '../screens/CreateGeocache';
import EditGeocache from '../screens/EditGeocache';
import MapScreen from '../screens/MapScreen';

const Stack = createStackNavigator();

export default function MainStack() {
  const handleLogout = async (navigation) => {
    await AsyncStorage.removeItem('token');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'Accueil',
          headerRight: () => (
            <Button
              onPress={() => handleLogout(navigation)}
              title="Déconnexion"
              color="#d9534f"
            />
          ),
        })}
      />
      <Stack.Screen 
        name="GeocacheList" 
        component={GeocacheList} 
        options={({ navigation }) => ({
          title: 'Liste des Géocaches',
          headerRight: () => (
            <Button
              onPress={() => navigation.navigate('CreateGeocache')}
              title="+"
              color="#5cb85c"
            />
          ),
        })}
      />
      <Stack.Screen 
        name="GeocacheDetail" 
        component={GeocacheDetail}
        options={{ title: 'Détails de la Géocache' }}
      />
      <Stack.Screen 
        name="CreateGeocache" 
        component={CreateGeocache}
        options={{ title: 'Créer une Géocache' }}
      />
      <Stack.Screen 
        name="EditGeocache" 
        component={EditGeocache}
        options={{ title: 'Modifier la Géocache' }}
      />
      <Stack.Screen 
        name="MapScreen" 
        component={MapScreen}
        options={{ title: 'Carte des Géocaches' }}
      />
    </Stack.Navigator>
  );
}