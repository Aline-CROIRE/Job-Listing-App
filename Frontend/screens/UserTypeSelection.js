import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function UserTypeSelection({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Who are you?</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login', { role: 'talent' })}
      >
        <Text style={styles.buttonText}>I'm a Talent</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login', { role: 'employer' })}
      >
        <Text style={styles.buttonText}>I'm an Employer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.adminButton]}
        onPress={() => navigation.navigate('Login', { role: 'admin' })}
      >
        <Text style={styles.buttonText}>Super Admin</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#28a745',
    padding: 15,
    marginVertical: 10,
    width: '80%',
    borderRadius: 25,
    alignItems: 'center',
  },
  adminButton: {
    backgroundColor: '#1e7e34',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
