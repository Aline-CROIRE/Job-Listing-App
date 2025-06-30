// screens/EditProfileScreen.js

import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const backendUrl = 'http://192.168.1.231:5000'; // Make sure this is your correct local IP

export default function EditProfileScreen({ route, navigation }) {
  // route.params will exist because we pass it from TalentProfileScreen
  const { profile: initialProfile } = route.params;
  const { token } = useContext(UserContext);

  // Initialize state from the profile object passed via navigation
  const [name, setName] = useState(initialProfile.name || '');
  const [bio, setBio] = useState(initialProfile.profile?.bio || '');
  const [location, setLocation] = useState(initialProfile.profile?.location || '');
  const [phone, setPhone] = useState(initialProfile.profile?.phone || '');
  const [website, setWebsite] = useState(initialProfile.profile?.website || '');
  const [skills, setSkills] = useState(initialProfile.talentProfile?.skills?.join(', ') || '');
  const [availability, setAvailability] = useState(initialProfile.talentProfile?.availability || 'available');
  
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Prepare the payload. The backend is designed to handle partial updates,
      // so we can send all fields.
      const payload = {
        name,
        profile: {
          bio,
          location,
          phone,
          website,
        },
        talentProfile: {
          // Convert comma-separated string back to an array of strings.
          // The .filter(Boolean) removes any empty strings that might result from trailing commas.
          skills: skills.split(',').map(skill => skill.trim()).filter(Boolean),
          availability,
        }
      };
      
      // [FIX] Update the URL to point to the correct, unified backend endpoint.
      await axios.put(`${backendUrl}/api/users/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Success', 'Profile updated successfully!');
      
      // Navigate back to the previous screen. The 'focus' listener we added
      // to TalentProfileScreen will automatically refetch the data.
      navigation.goBack();

    } catch (error) {
      // Log the detailed error from the backend if it exists
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
      console.error("Update Error:", error.response?.data || error.message);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // The JSX for the form is already excellent and doesn't need changes.
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor="#666" />

      <Text style={styles.label}>Bio</Text>
      <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} multiline placeholder="A short bio about yourself..." placeholderTextColor="#666" />
      
      <Text style={styles.label}>Location</Text>
      <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City, Country" placeholderTextColor="#666" />
      
      <Text style={styles.label}>Phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Your phone number" keyboardType="phone-pad" placeholderTextColor="#666" />
      
      <Text style={styles.label}>Website</Text>
      <TextInput style={styles.input} value={website} onChangeText={setWebsite} placeholder="https://your-portfolio.com" autoCapitalize="none" keyboardType="url" placeholderTextColor="#666" />

      <Text style={styles.label}>Skills (comma-separated)</Text>
      <TextInput style={styles.input} value={skills} onChangeText={setSkills} placeholder="React, Node.js, Python" autoCapitalize="none" placeholderTextColor="#666" />
      
      <Text style={styles.label}>Availability</Text>
      <TextInput style={styles.input} value={availability} onChangeText={setAvailability} placeholder="available, busy, or unavailable" autoCapitalize="none" placeholderTextColor="#666" />
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// The styles are perfect.
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000', padding: 20 },
    label: { color: '#28a745', fontSize: 14, fontWeight: '600', marginTop: 20, marginBottom: 5 },
    input: { backgroundColor: '#222', color: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, fontSize: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
    saveButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 30, marginBottom: 50 },
    saveButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
});