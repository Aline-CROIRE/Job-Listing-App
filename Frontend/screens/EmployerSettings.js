import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { UserContext } from '../context/UserContext';
import Icon from 'react-native-vector-icons/Ionicons';

export default function EmployerSettings() {
  const { logout, user } = useContext(UserContext);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>
      <Text style={styles.subheading}>Logged in as: {user?.email}</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Icon name="log-out-outline" size={22} color="#e74c3c" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 25,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 10,
  },
  subheading: {
    color: '#aaa',
    marginBottom: 30,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 8,
    borderColor: '#e74c3c',
    borderWidth: 1,
    marginTop: 20,
  },
  logoutText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
});
