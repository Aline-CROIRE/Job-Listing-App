import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { UserContext } from '../context/UserContext';
import axios from 'axios';

const backendUrl = 'http://192.168.1.151:5000';

const EmployerDashboard = ({ navigation }) => {
  const { user, logout, token } = useContext(UserContext);

  const [totalJobs, setTotalJobs] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalTalents, setTotalTalents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [jobsRes, projectsRes, usersRes] = await Promise.all([
          axios.get(`${backendUrl}/api/jobs/count`, { headers }),
          axios.get(`${backendUrl}/api/projects/count`, { headers }),
          axios.get(`${backendUrl}/api/users`, { headers }),
        ]);

        // Count jobs
        const jobsArray = Array.isArray(jobsRes.data)
          ? jobsRes.data
          : jobsRes.data.jobs || jobsRes.data.data || [];
        setTotalJobs(jobsArray.length);

        // Count projects
        const projectsArray = Array.isArray(projectsRes.data)
          ? projectsRes.data
          : projectsRes.data.projects || projectsRes.data.data || [];
        setTotalProjects(projectsArray.length);

        // Filter talents from users
        const usersArray = Array.isArray(usersRes.data)
          ? usersRes.data
          : usersRes.data.users || usersRes.data.data || [];
        const talents = usersArray.filter(u => u.role === 'talent');
        setTotalTalents(talents.length);
      } catch (error) {
        console.error('Error fetching dashboard counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [token]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.name || 'Employer'} 👋</Text>
      <Text style={styles.subtitle}>Manage your job listings and find talent</Text>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#1b3a1b' }]}>
          <Text style={styles.statNumber}>{totalJobs}</Text>
          <Text style={styles.statLabel}>Total Jobs</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#1b1b3a' }]}>
          <Text style={styles.statNumber}>{totalProjects}</Text>
          <Text style={styles.statLabel}>Total Projects</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#3a1b1b' }]}>
          <Text style={styles.statNumber}>{totalTalents}</Text>
          <Text style={styles.statLabel}>Total Talents</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  center: { justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10, marginTop: 50 },
  subtitle: { color: '#aaa', fontSize: 16, marginBottom: 70 },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#28a745',
  },
  statLabel: {
    fontSize: 14,
    color: '#ddd',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default EmployerDashboard;
