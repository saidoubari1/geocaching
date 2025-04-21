// client/src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      console.log(`Attempting to login at: ${API_URL}/api/auth/login`);
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('Response status:', response.status);
      console.log('👉 API_URL =', API_URL);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful, token received');
        // Save JWT token in AsyncStorage
        await AsyncStorage.setItem('token', data.token);
        navigation.navigate('Home');
      } else {
        try {
          const error = await response.json();
          Alert.alert('Erreur', error.message || 'Identifiants invalides');
        } catch (e) {
          // If the response is not JSON
          Alert.alert('Erreur', `Erreur de serveur (${response.status})`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Erreur de connexion', 
        `Impossible de se connecter au serveur. Vérifiez que le serveur est en cours d'exécution à l'adresse ${API_URL} et que votre appareil peut s'y connecter.`
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      <Button title="Se connecter" onPress={handleLogin} />
      <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
        Pas de compte ? Inscrivez-vous
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5
  },
  link: {
    marginTop: 20,
    color: 'blue',
    textAlign: 'center'
  }
});