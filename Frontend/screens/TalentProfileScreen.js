// screens/TalentProfileScreen.js

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
  RefreshControl,
  PermissionsAndroid,
  Platform,           
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'react-native-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { UserContext } from '../context/UserContext';
import ProfileSkeleton from './ProfileSkeleton'; 

const backendUrl = 'http://192.168.1.231:5000';

export default function TalentProfileScreen({ navigation }) {
  const { token } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadProfile = () => {
      if (token) fetchUserProfile();
      else { setLoading(false); setProfile(null); }
    };
    loadProfile();
    const unsubscribe = navigation.addListener('focus', () => loadProfile());
    return unsubscribe;
  }, [token, navigation]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchUserProfile().finally(() => setRefreshing(false));
  }, []);

  const logApiError = (error, context) => {
    const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred.';
    console.error(`Error in ${context}:`, errorMessage, error.response?.data);
    return errorMessage;
  };

  const fetchUserProfile = async () => {
    if (!refreshing) setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      const userData = res.data?.user || res.data;
      if (userData) setProfile(userData);
      else throw new Error("User data not found in server response");
    } catch (err) {
      const errorMessage = logApiError(err, 'fetchUserProfile');
      Alert.alert('Error Fetching Profile', errorMessage);
      setProfile(null);
    } finally {
      if (!refreshing) setLoading(false);
    }
  };

  const handlePickImage = async () => {
    console.log('[DEBUG] handlePickImage: Function called.');

    if (Platform.OS === 'android') {
      try {
        const permission = Platform.Version >= 33 
            ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES 
            : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        const granted = await PermissionsAndroid.request(permission);
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('[DEBUG] handlePickImage: Photo library permission denied.');
          Alert.alert('Permission Denied', 'You need to grant photo library access to upload an image.');
          return;
        }
      } catch (err) {
        console.warn('[ERROR] Permissions request failed:', err);
      }
    }

    ImagePicker.launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (response) => {
      console.log('[DEBUG] handlePickImage: ImagePicker callback received.');
      if (response.didCancel) {
        console.log('[DEBUG] User cancelled image picker.');
        return;
      }
      if (response.errorCode) {
        console.error('[ERROR] ImagePicker Error:', { code: response.errorCode, message: response.errorMessage });
        Alert.alert('Image Picker Error', response.errorMessage || 'Please ensure permissions are granted.');
        return;
      }

      const imageAsset = response.assets?.[0];
      if (imageAsset?.uri) {
        console.log('[DEBUG] Image asset found. Starting upload...');
        setIsUploading(true);
        const formData = new FormData();
        formData.append('avatar', {
          uri: imageAsset.uri, name: imageAsset.fileName || `profile_${Date.now()}.jpg`, type: imageAsset.type || 'image/jpeg',
        });
        try {
          const res = await axios.post(`${backendUrl}/api/upload/avatar`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
          if (res.data?.user) {
            setProfile(res.data.user);
            Alert.alert('Success', 'Profile image updated successfully.');
          } else { throw new Error("Server did not return updated user data."); }
        } catch (error) {
          const errorMessage = logApiError(error, 'uploadProfileImage');
          Alert.alert('Upload Error', errorMessage);
        } finally {
          setIsUploading(false);
        }
      } else {
        console.warn('[WARN] Response received but no image URI found.');
      }
    });
  };

  const handlePickCV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!result.canceled) {
        setIsUploading(true);
        const cvAsset = result.assets[0];
        const formData = new FormData();
        formData.append('cv', { uri: cvAsset.uri, name: cvAsset.name, type: cvAsset.mimeType || 'application/pdf' });
        formData.append('autoFill', 'true');
        const res = await axios.post(`${backendUrl}/api/upload/cv`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
        if (res.data?.user) {
          setProfile(res.data.user);
          Alert.alert(res.data.profileUpdated ? 'Success' : 'Info', res.data.message);
        } else { throw new Error("Server did not return updated user data after CV upload."); }
      }
    } catch (err) {
      const errorMessage = logApiError(err, 'handlePickCV');
      Alert.alert('Upload Error', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading && !profile) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <View style={styles.centeredContainer}>
        <Icon name="cloud-offline-outline" size={60} color="#444" />
        <Text style={styles.errorText}>Could Not Load Profile</Text>
        <Text style={styles.infoText}>Please check your connection and try again.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
            <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={{backgroundColor: '#000'}}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#28a745" />}
    >
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.uploadingText}>Processing...</Text>
        </View>
      )}

      <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage} disabled={isUploading}>
        {profile.profile?.profile ? (
          <Image source={{ uri: profile.profile.profile }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Icon name="camera" size={40} color="#666" />
            <Text style={styles.avatarPlaceholderText}>Tap to upload</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <Text style={styles.name}>{profile.name || 'No Name'}</Text>
      <Text style={styles.email}>{profile.email || 'No Email'}</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EditProfile', { profile })} disabled={isUploading}>
            <Icon name="pencil-sharp" size={16} color="#28a745" />
            <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handlePickCV} disabled={isUploading}>
            <Icon name="cloud-upload-outline" size={16} color="#28a745" />
            <Text style={styles.buttonText}>Upload CV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
            <Icon name="information-circle-outline" size={24} color="#444" />
            <View style={styles.detailTextContainer}>
                <Text style={styles.label}>Bio</Text>
                <Text style={styles.infoText}>{profile.profile?.bio || 'Not provided. Tap "Edit Profile" to add a bio.'}</Text>
            </View>
        </View>

        <View style={styles.detailItem}>
            <Icon name="location-outline" size={24} color="#444" />
            <View style={styles.detailTextContainer}>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.infoText}>{profile.profile?.location || 'Not provided'}</Text>
            </View>
        </View>
        
        <View style={styles.detailItem}>
            <Icon name="time-outline" size={24} color="#444" />
            <View style={styles.detailTextContainer}>
                <Text style={styles.label}>Availability</Text>
                <Text style={styles.infoText}>{profile.talentProfile?.availability || 'Not set'}</Text>
            </View>
        </View>

        <Text style={styles.sectionHeader}>Skills</Text>
        {profile.talentProfile?.skills?.length > 0 ? (
          <View style={styles.tagWrap}>
            {profile.talentProfile.skills.map((skill, index) => (
              <View key={`${skill}-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>{skill}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.infoText}>No skills listed. Upload your CV to auto-fill.</Text>
        )}
        
        <Text style={styles.sectionHeader}>Experience</Text>
        {profile.talentProfile?.experience?.length > 0 ? (
          profile.talentProfile.experience.map((exp, index) => (
            <View key={`exp-${index}`} style={styles.card}>
              <Text style={styles.cardTitle}>{exp.position}</Text>
              <Text style={styles.cardSubtitle}>{exp.company}</Text>
              {exp.duration && <Text style={styles.cardInfo}>{exp.duration}</Text>}
              {exp.description?.map((desc, i) => (
                 <Text key={`desc-${i}`} style={styles.descriptionText}>• {desc}</Text>
              ))}
            </View>
          ))
        ) : (
          <Text style={styles.infoText}>No experience information available.</Text>
        )}

        <Text style={styles.sectionHeader}>Education</Text>
        {profile.talentProfile?.education?.length > 0 ? (
          profile.talentProfile.education.map((edu, index) => (
            <View key={`edu-${index}`} style={styles.card}>
              <Text style={styles.cardTitle}>{edu.degree}</Text>
              <Text style={styles.cardSubtitle}>{edu.institution}</Text>
              {edu.duration && <Text style={styles.cardInfo}>{edu.duration}</Text>}
            </View>
          ))
        ) : (
          <Text style={styles.infoText}>No education information available.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#ff4d4d', fontSize: 18, fontWeight: '600', marginTop: 15 },
  container: { backgroundColor: '#000', paddingHorizontal: 15, paddingTop: 20, alignItems: 'center', flexGrow: 1 },
  uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  uploadingText: { color: '#fff', marginTop: 10, fontSize: 18, fontWeight: '600' },
  avatarContainer: { width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: '#28a745', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholderText: { color: '#666', fontSize: 14, marginTop: 5 },
  name: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 15 },
  email: { color: '#aaa', fontSize: 16, marginBottom: 20 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 30, borderBottomWidth: 1, borderTopWidth: 1, borderColor: '#222', paddingVertical: 15 },
  button: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#28a74522', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  buttonText: { color: '#28a745', fontWeight: '600', fontSize: 16, marginLeft: 8 },
  retryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#28a745', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginTop: 20 },
  detailsContainer: { width: '100%', paddingBottom: 40 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 25, },
  detailTextContainer: { marginLeft: 15, flex: 1 },
  label: { color: '#aaa', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  infoText: { color: '#ddd', fontSize: 16, lineHeight: 22 },
  sectionHeader: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 15, borderLeftWidth: 3, borderLeftColor: '#28a745', paddingLeft: 10 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: '#28a74533', borderColor: '#28a745', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  tagText: { color: '#28a745', fontWeight: '500', fontSize: 14 },
  card: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 15, marginBottom: 15, width: '100%' },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardSubtitle: { color: '#28a745', fontSize: 16, fontWeight: '600', marginTop: 2 },
  cardInfo: { color: '#999', fontSize: 14, marginTop: 4, fontStyle: 'italic' },
  descriptionText: { color: '#ccc', fontSize: 15, marginTop: 8, lineHeight: 22 },
});