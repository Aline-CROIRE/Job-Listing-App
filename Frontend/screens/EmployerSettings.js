import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { UserContext } from '../context/UserContext';
import Icon from 'react-native-vector-icons/Ionicons';

export default function EmployerSettings() {
  const { user } = useContext(UserContext);

  const SettingItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.itemLeft}>
        <Icon name={icon} size={20} color="#28a745" />
        <Text style={styles.itemText}>{label}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color="#888" />
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <SettingItem icon="globe-outline" label="Language" onPress={() => {}} />
        <SettingItem icon="lock-closed-outline" label="Privacy Policy" onPress={() => {}} />
        <SettingItem icon="document-text-outline" label="Terms of Services" onPress={() => {}} />
        <SettingItem icon="information-circle-outline" label="About App" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <SettingItem icon="star-outline" label="Rate Us" onPress={() => {}} />
        <SettingItem icon="share-social-outline" label="Share with Friends" onPress={() => {}} />
        <SettingItem icon="apps-outline" label="More Apps" onPress={() => {}} />
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
    marginTop:200,
    textAlign:'center',
  },
  subheader: {
    color: '#aaa',
    marginBottom: 25,
  },
  section: {
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: 20,
    paddingVertical: 8,
    marginTop:10,
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
