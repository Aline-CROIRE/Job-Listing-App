import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const backendUrl = 'http://192.168.1.104:5000';

export default function EditEmployerProfileScreen({ navigation }) {
  const { user, token } = useContext(UserContext);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');

  const handleSave = async () => {
    try {
      await axios.put(
        `${backendUrl}/api/users/profile`,
        { name, email, ...(password && { password }) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Profile updated');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#888"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="New Password (optional)"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    padding: 20,
    flexGrow: 1,
  },
  title: {
    color: '#28a745',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop:200,
    marginBottom: 100,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 14,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
