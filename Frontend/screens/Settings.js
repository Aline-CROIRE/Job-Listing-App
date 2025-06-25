import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { UserContext } from '../context/UserContext';
import Icon from 'react-native-vector-icons/Ionicons';

export default function Settings() {
  const { logout } = useContext(UserContext);

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.option} onPress={handleLogout}>
        <Icon name="log-out-outline" size={28} color="#e74c3c" />
        <Text style={[styles.optionText, { color: '#e74c3c' }]}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  optionText: {
    marginLeft: 12,
    fontSize: 18,
  },
});
