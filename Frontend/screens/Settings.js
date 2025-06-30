// screens/Settings.js

import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Linking,
  Share,
  Switch,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { UserContext } from '../context/UserContext';
import { ThemeContext } from '../context/ThemeContext';
import { useThemeStyles } from '../hooks/useThemeStyles';
import Icon from 'react-native-vector-icons/Ionicons';

// --- Reusable Components (Fully implemented) ---

const Divider = ({ styles }) => <View style={styles.divider} />;

const SettingItem = ({ icon, iconColor, label, onPress, styles }) => (
  <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.itemLeft}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
        <Icon name={icon} size={18} color="#fff" />
      </View>
      <Text style={styles.itemText}>{label}</Text>
    </View>
    <Icon name="chevron-forward" size={22} color={styles.itemChevron.color} />
  </TouchableOpacity>
);

const ThemeToggleItem = ({ icon, iconColor, label, styles, theme, toggleTheme }) => (
  <View style={styles.item}>
    <View style={styles.itemLeft}>
      <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
        <Icon name={icon} size={18} color="#fff" />
      </View>
      <Text style={styles.itemText}>{label}</Text>
    </View>
    <Switch
      trackColor={{ false: '#767577', true: styles.switchTrack.color }}
      thumbColor={'#f4f3f4'}
      ios_backgroundColor="#3e3e3e"
      onValueChange={toggleTheme}
      value={theme === 'dark'}
    />
  </View>
);

// --- Helper function to get initials ---
const getInitials = (name) => {
  if (!name) return '';
  const names = name.split(' ').filter(Boolean);
  if (names.length === 0) return '';
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

// --- Main Screen Component ---
export default function SettingsScreen() {
  const { user, token, logout, setUser } = useContext(UserContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigation = useNavigation();
  const [isUploading, setIsUploading] = useState(false);

  // Use the hook to get themed styles
  const styles = useThemeStyles(colors => ({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingVertical: 20, paddingBottom: 50 },
    headerTitle: { fontSize: 34, fontWeight: 'bold', color: colors.text, paddingHorizontal: 16, marginBottom: 20 },
    
    // --- New Profile Header Styles ---
    profileHeader: {
      alignItems: 'center',
      marginVertical: 20,
      paddingHorizontal: 16,
    },
    avatarContainer: { marginBottom: 15 },
    avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.border },
    initialsAvatar: { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    initialsText: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },
    avatarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
    editIconContainer: { position: 'absolute', bottom: 2, right: 2, backgroundColor: colors.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background },
    profileName: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginTop: 8 },
    profileEmail: { fontSize: 16, color: colors.subtleText, marginTop: 4 },

    // --- Settings Section Styles ---
    section: {
      marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12, marginBottom: 24,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
        android: { elevation: 3 },
      }),
    },
    item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    itemLeft: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    itemText: { marginLeft: 16, fontSize: 17, color: colors.text },
    itemChevron: { color: colors.subtleText },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 64 },
    switchTrack: { color: colors.primary },
    logoutButton: { marginHorizontal: 16, marginTop: 10, padding: 16, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center' },
    logoutText: { color: colors.danger, fontSize: 17, fontWeight: '600' },
  }));

  // Simplified logout handler using the central function from context
  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout(); // Calls the robust logout from UserContext
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
          } catch (error) {
            Alert.alert('Error', 'Could not log out. Please try again.');
          }
        },
      },
    ]);
  };

  const handleSelectAndUploadAvatar = () => {
    if (isUploading) return;
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) return Alert.alert('Error', response.errorMessage);
      const imageUri = response.assets?.[0]?.uri;
      if (imageUri) uploadImage(imageUri);
    });
  };

  const uploadImage = async (imageUri) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('profileImage', {
      uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
      type: 'image/jpeg', name: `profile-${user.id}.jpg`,
    });

    try {
      // NOTE: This fetch is a placeholder. You should use your configured axios instance from context if you have one.
      const res = await fetch('http://192.168.1.231:5000/api/users/upload-avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed.');
      const data = await res.json();
      // Optimistically update the user state in context for instant UI change
      setUser(prevUser => ({...prevUser, profile: {...prevUser.profile, profile: data.imageUrl}}));
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Settings</Text>

        {/* --- New, Separated Profile Header --- */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleSelectAndUploadAvatar} style={styles.avatarContainer} activeOpacity={0.8}>
            {user?.profile?.profile ? (
              <Image source={{ uri: user.profile.profile }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.initialsAvatar]}>
                <Text style={styles.initialsText}>{getInitials(user?.name)}</Text>
              </View>
            )}
            {isUploading ? (
              <View style={styles.avatarOverlay}><ActivityIndicator color="#FFF" /></View>
            ) : (
              <View style={styles.editIconContainer}><Icon name="pencil" size={16} color="#FFF" /></View>
            )}
          </TouchableOpacity>
          <Text style={styles.profileName}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        {/* --- Settings Sections --- */}
        <View style={styles.section}>
          <SettingItem icon="person-circle" iconColor="#0A84FF" label="View Profile" onPress={() => navigation.navigate('ProfileStack')} styles={styles} />
          <Divider styles={styles} />
          <ThemeToggleItem icon="moon" iconColor="#5856D6" label="Dark Mode" styles={styles} theme={theme} toggleTheme={toggleTheme} />
          <Divider styles={styles} />
          <SettingItem icon="notifications" iconColor="#FF9500" label="Notifications" onPress={() => {}} styles={styles} />
        </View>

        <View style={styles.section}>
          <SettingItem icon="lock-closed" iconColor="#34C759" label="Privacy & Security" onPress={() => {}} styles={styles} />
          <Divider styles={styles} />
          <SettingItem icon="help-circle" iconColor="#007AFF" label="Help & Support" onPress={() => Linking.openURL('https://your-support-page.com')} styles={styles} />
          <Divider styles={styles} />
          <SettingItem icon="share-social" iconColor="#FF2D55" label="Share App" onPress={() => Share.share({ message: 'Check out this awesome app!' })} styles={styles} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}