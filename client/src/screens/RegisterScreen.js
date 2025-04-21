// client/src/screens/RegisterScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    const result = await register(email, password);
    
    if (result.success) {
      Alert.alert(
        'Succès', 
        'Compte créé avec succès ! Veuillez vous connecter.',
        [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]
      );
    } else {
      Alert.alert('Erreur d\'inscription', result.message || 'Une erreur est survenue');
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
      <Text style={styles.subtitle}>Créez un compte pour commencer</Text>
      
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
      
      <TextInput
        style={styles.input}
        placeholder="Confirmer le mot de passe"
        value={confirmPassword}
        secureTextEntry
        onChangeText={setConfirmPassword}
      />
      
      <View style={styles.buttonContainer}>
        <Button 
          title="S'inscrire" 
          onPress={handleRegister}
          color="#4CAF50" 
        />
      </View>
      
      <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
        Déjà un compte ? Connectez-vous
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