import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ApplyScreen({ route }) {
  const { id, type, title } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Apply for {type}</Text>
      <Text style={styles.subtitle}>{title}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#ccc', fontSize: 18, marginTop: 10 },
});