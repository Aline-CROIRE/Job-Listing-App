import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { UserContext } from '../context/UserContext';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useContext(UserContext);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/jobnest-logo.png')}
        style={styles.logo}
      />
      <Text style={styles.welcome}>
        Welcome, <Text style={styles.name}>{user?.name || 'Talent'}!</Text>
      </Text>
      <Text style={styles.subText}>Start exploring opportunities tailored for you.</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Jobs')}
      >
        <Text style={styles.buttonText}>Browse Jobs</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={logout}
      >
        <Text style={styles.buttonText}>Logout</Text>
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
    padding: 25,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  welcome: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  name: {
    color: '#28a745',
  },
  subText: {
    color: '#ccc',
    marginBottom: 40,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#28a745',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#cc0000',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
