import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import GeocacheList from '../screens/GeocacheList';
// Import additional screens as needed

const Stack = createStackNavigator();

export default function MainStack() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name = "GeocacheList" component={GeocacheList} />
      {/* More screens (e.g., GeocacheDetail, CreateGeocache, etc.) */}
    </Stack.Navigator>
  );
}
