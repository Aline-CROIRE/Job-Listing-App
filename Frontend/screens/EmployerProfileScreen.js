import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserContext } from '../context/UserContext';

export default function EmployerProfile() {
  const { user } = useContext(UserContext);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Employer Profile</Text>
      <Text style={styles.info}>Name: {user?.name}</Text>
      <Text style={styles.info}>Email: {user?.email}</Text>
      <Text style={styles.info}>Role: {user?.role}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 25,
  },
  title: {
    color: '#28a745',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  info: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 10,
  },
});
