import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Alerts() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>No new alerts yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#ccc', fontSize: 18 },
});
