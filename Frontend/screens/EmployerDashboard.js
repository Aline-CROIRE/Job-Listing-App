import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { UserContext } from '../context/UserContext';
import Icon from 'react-native-vector-icons/Ionicons';

const EmployerDashboard = ({ navigation }) => {
  const { user, logout } = useContext(UserContext);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.name || 'Employer'} 👋</Text>
      <Text style={styles.subtitle}>Manage your job listings and find talent</Text>

      <View style={styles.card}>
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('PostJob')}>
          <Icon name="add-circle-outline" size={28} color="#28a745" />
          <Text style={styles.optionText}>Post a New Job</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('PostedJobs')}>
          <Icon name="briefcase-outline" size={28} color="#28a745" />
          <Text style={styles.optionText}>My Posted Jobs</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate('Applicants')}>
          <Icon name="people-outline" size={28} color="#28a745" />
          <Text style={styles.optionText}>View Applicants</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.option, { marginTop: 30 }]} onPress={logout}>
          <Icon name="log-out-outline" size={28} color="#e74c3c" />
          <Text style={[styles.optionText, { color: '#e74c3c' }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { color: '#aaa', fontSize: 16, marginBottom: 20 },
  card: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#28a745',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionText: {
    marginLeft: 12,
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
});

export default EmployerDashboard;
