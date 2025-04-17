// /client/src/screens/HomeScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue sur Geocaching!</Text>
      {/* Example button to navigate to a geocache list screen. */}
      <Button
        title="Voir les géocaches"
        onPress={() => navigation.navigate('GeocacheList')}
      />
      {/* You can add more UI components or buttons as needed */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    marginBottom: 20
  }
});
