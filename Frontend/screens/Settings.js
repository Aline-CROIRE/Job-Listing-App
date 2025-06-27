import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TalentSettings() {
  const { setUser, setToken } = useContext(UserContext);
  const navigation = useNavigation();

  const SettingItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <Icon name={icon} size={20} color="#28a745" />
        <Text style={styles.itemText}>{label}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color="#888" />
    </TouchableOpacity>
  );

  const logout = async () => {
    try {
      await AsyncStorage.clear(); // Clear all async storage data
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <SettingItem icon="person-outline" label="Profile" onPress={() => { }} />
        <SettingItem icon="lock-closed-outline" label="Privacy Policy" onPress={() => { }} />
        <SettingItem icon="document-text-outline" label="Terms of Service" onPress={() => { }} />
        <SettingItem icon="information-circle-outline" label="About App" onPress={() => { }} />
      </View>

      <View style={styles.section}>
        <SettingItem icon="star-outline" label="Rate Us" onPress={() => { }} />
        <SettingItem icon="share-social-outline" label="Share App" onPress={() => { }} />
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            logout();
            navigation.navigate('Login');
          }}
        >
          <Icon name="log-out-outline" size={20} color="#e74c3c" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#000',
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 50,
    marginTop: 200,
    textAlign: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    padding: 12,
    borderRadius: 8,
    borderColor: '#e74c3c',
    borderWidth: 1,
    justifyContent: 'center',
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 16,
    marginLeft: 10,
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: 20,
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#fff',
  },
});
