import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'react-native-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { UserContext } from '../context/UserContext';

const backendUrl = 'http://192.168.1.104:5000';

export default function TalentProfileScreen() {
  const { token } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    profile: {
      bio: '',
      location: '',
      phone: '',
      website: '',
      profile: '',
    },
    talentProfile: {
      skills: [],
      availability: '',
      experience: [],
      education: [],
    },
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data.user);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async (imageUri) => {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      name: 'profile.jpg',
      type: 'image/jpeg',
    });

    try {
      const res = await axios.put(
        `${backendUrl}/api/users/upload-profile-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (res.data?.user) {
        setProfile(res.data.user);
      }

      Alert.alert('Success', 'Profile image uploaded');
    } catch (error) {
      Alert.alert('Upload Error', 'Failed to upload profile image');
    }
  };

  const handlePickImage = () => {
    ImagePicker.launchImageLibrary({ mediaType: 'photo' }, async (response) => {
      if (response.didCancel || response.errorCode) return;

      const uri = response.assets?.[0]?.uri;
      if (uri) {
        setProfile((prev) => ({
          ...prev,
          profile: { ...prev.profile, profile: uri },
        }));

        await uploadProfileImage(uri);
      }
    });
  };

  const handlePickCV = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.type === 'success') {
        const { uri, name, mimeType = 'application/pdf' } = res;

        setLoading(true);

        const formData = new FormData();
        formData.append('file', {
          uri,
          name,
          type: mimeType,
        });

        await axios.put(`${backendUrl}/api/users/upload-cv`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        Alert.alert('Success', 'CV uploaded & parsed successfully');

        await fetchUserProfile();
      }
    } catch (err) {
      Alert.alert('Upload Error', 'Failed to upload CV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#28a745" style={{ marginTop: 50 }} />
      ) : (
        <>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
            {profile.profile?.profile ? (
              <Image source={{ uri: profile.profile.profile }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>Tap to select image</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.name}>{profile.name || 'No Name'}</Text>
          <Text style={styles.email}>{profile.email || 'No Email'}</Text>

          <View style={styles.detailsContainer}>
            <Text style={styles.label}>Bio:</Text>
            <Text style={styles.info}>{profile.profile?.bio || 'No bio available'}</Text>

            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.info}>{profile.profile?.phone || 'Not provided'}</Text>

            <Text style={styles.label}>Website:</Text>
            <Text style={styles.info}>{profile.profile?.website || 'Not provided'}</Text>

            <Text style={styles.label}>Availability:</Text>
            <Text style={styles.info}>{profile.talentProfile?.availability || 'Not set'}</Text>

            <Text style={styles.label}>Skills:</Text>
            {profile.talentProfile.skills?.length > 0 ? (
              <View style={styles.tagWrap}>
                {profile.talentProfile.skills.map((skill, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{skill}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.info}>No skills found</Text>
            )}

            <Text style={styles.label}>Education:</Text>
            {profile.talentProfile.education?.length > 0 ? (
              profile.talentProfile.education.map((edu, index) => (
                <Text key={index} style={styles.info}>• {edu}</Text>
              ))
            ) : (
              <Text style={styles.info}>No education info</Text>
            )}

            <Text style={styles.label}>Experience:</Text>
            {profile.talentProfile.experience?.length > 0 ? (
              profile.talentProfile.experience.map((exp, index) => (
                <Text key={index} style={styles.info}>• {exp}</Text>
              ))
            ) : (
              <Text style={styles.info}>No experience info</Text>
            )}
          </View>

          <TouchableOpacity style={styles.cvButton} onPress={handlePickCV}>
            <Text style={styles.cvButtonText}>Add CV</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    padding: 20,
    alignItems: 'center',
    flexGrow: 1,
  },
  avatarContainer: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 80,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#28a745',
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  name: {
    color: '#28a745',
    fontSize: 28,
    fontWeight: 'bold',
  },
  email: {
    color: '#aaa',
    fontSize: 18,
    marginBottom: 25,
  },
  detailsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  label: {
    color: '#28a745',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 15,
  },
  info: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 5,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  tag: {
    backgroundColor: '#28a74533',
    borderColor: '#28a745',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: '#28a745',
    fontWeight: '500',
    fontSize: 13,
  },
  cvButton: {
    borderColor: '#28a745',
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
    backgroundColor: '#000',
    marginBottom: 30,
  },
  cvButtonText: {
    color: '#28a745',
    fontWeight: '600',
    fontSize: 18,
  },
});
