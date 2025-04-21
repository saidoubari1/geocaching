// client/src/screens/LoginScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    const result = await login(email, password);
    
    if (result.success) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } else {
      Alert.alert('Erreur de connexion', result.message || 'Identifiants incorrects');
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
    <View style={styles.container}>
      <Text style={styles.title}>Application Geocaching</Text>
      <Text style={styles.subtitle}>Connectez-vous pour commencer</Text>
      
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
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Se connecter" 
          onPress={handleLogin}
          color="#4CAF50" 
        />
      </View>
      
      <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
        Pas de compte ? Inscrivez-vous
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#4CAF50',
    marginTop: 80,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: 'white',
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  link: {
    marginTop: 20,
    color: '#4CAF50',
    textAlign: 'center',
    fontSize: 16,
  }
});