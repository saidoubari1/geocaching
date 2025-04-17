import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../services/api';

export default function GeocacheList({ navigation }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/geocache`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setList(data);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={list}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>📍 {item.coordinates.join(', ')}</Text>
            <Text>⚙️ {item.difficulty}</Text>
            <Button
              title="Voir détails"
              onPress={() =>
                navigation.navigate('GeocacheDetail', { id: item._id })
              }
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
  },
});
