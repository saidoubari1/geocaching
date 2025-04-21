// client/App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import MainStack from './src/navigation/MainStack';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <MainStack />
      </NavigationContainer>
    </AuthProvider>
  );
}