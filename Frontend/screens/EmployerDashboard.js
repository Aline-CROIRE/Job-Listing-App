// screens/EmployerDashboard.js

import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { UserContext } from '../context/UserContext';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const backendUrl = 'http://172.31.243.24:5000'; // Your IP

// --- Sub-components (StatCard, JobItem) can remain the same ---
const StatCard = ({ icon, count, label, color, onPress }) => (
  <TouchableOpacity style={[styles.statCard, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.8}>
    <Icon name={icon} size={30} color="#fff" />
    <Text style={styles.statNumber}>{count}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);
const JobItem = ({ item, onPress }) => (
    <TouchableOpacity style={styles.jobItem} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.jobInfo}>
            <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.jobCompany}>{item.company?.name || 'N/A'}</Text>
        </View>
        <Icon name="chevron-forward-outline" size={24} color="#555" />
    </TouchableOpacity>
);

const EmployerDashboard = () => {
  const navigation = useNavigation();
  const { user, token } = useContext(UserContext);

  const [stats, setStats] = useState({ totalJobs: 0, totalProjects: 0, totalApplications: 0 });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);

  // [THE FIX IS HERE] This function now uses your existing routes
  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // We use Promise.all to make all API calls concurrently for better performance
      const [jobsRes, projectsRes] = await Promise.all([
        // 1. Fetch the user's jobs to get counts and recent items
        axios.get(`${backendUrl}/api/jobs/my/jobs`, { headers, params: { limit: 3, page: 1, sortBy: 'createdAt' } }),
        
        // 2. Fetch the user's projects to get the count
        axios.get(`${backendUrl}/api/projects/my/projects`, { headers, params: { limit: 1 } }) // Only need the total count
      ]);

      // Process Jobs Response
      if (jobsRes.data && jobsRes.data.success) {
        setStats(prevStats => ({
          ...prevStats,
          totalJobs: jobsRes.data.pagination.total,
          // You could calculate applications here if jobs data includes it
        }));
        setRecentJobs(jobsRes.data.jobs);
      }

      // Process Projects Response
      if (projectsRes.data && projectsRes.data.success) {
        setStats(prevStats => ({
          ...prevStats,
          totalProjects: projectsRes.data.pagination.total,
        }));
      }

    } catch (error) {
      const errorMessage = error.response?.data?.message || "Could not load your dashboard data.";
      console.error('Error fetching employer dashboard data:', error);
      Alert.alert("Data Error", errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const navigateAndCloseModal = (screenName, params = {}) => { /* ... no changes needed ... */ };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#28a745" />
        <Text style={{color: '#888', marginTop: 10}}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView 
          style={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Welcome, {user?.name?.split(' ')[0] || 'Employer'} 👋</Text>
                <Text style={styles.subtitle}>Here's your activity overview.</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Icon name="add" size={30} color="#28a745" />
            </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="briefcase" count={stats.totalJobs} label="Total Jobs" color="#133a5e" onPress={() => navigation.navigate('MyJobs')} />
          <StatCard icon="rocket" count={stats.totalProjects} label="Projects" color="#4e2a6d" onPress={() => navigation.navigate('MyProjects')} />
          <StatCard icon="people" count={stats.totalApplications} label="Applications" color="#135e4d" onPress={() => navigation.navigate('Applications')} />
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionHeader}>Recent Job Postings</Text>
          {recentJobs.length > 0 ? (
              <FlatList
                  data={recentJobs}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => <JobItem item={item} onPress={() => navigation.navigate('JobDetails', { jobId: item._id })} />}
                  scrollEnabled={false}
              />
          ) : (
              <View style={styles.noDataContainer}>
                  <Icon name="file-tray-stacked-outline" size={40} color="#444" />
                  <Text style={styles.noDataText}>You haven't posted any jobs recently.</Text>
                  <Text style={styles.noDataSubText}>Tap the '+' button above to get started.</Text>
              </View>
          )}
        </View>
      </ScrollView>

      {/* Modal for posting new Job or Project */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
          {/* ... The Modal JSX is correct and does not need to be changed ... */}
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>What would you like to post?</Text>
                <TouchableOpacity style={styles.modalOption} onPress={() => navigateAndCloseModal('PostJob')}>
                    <Icon name="briefcase-sharp" size={40} color="#28a745" />
                    <View style={styles.modalTextContainer}>
                        <Text style={styles.modalOptionTitle}>Post a Job</Text>
                        <Text style={styles.modalOptionSubtitle}>Find talent for full-time, part-time, or contract roles.</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalOption} onPress={() => navigateAndCloseModal('PostProject')}>
                    <Icon name="rocket-sharp" size={40} color="#8a2be2" />
                    <View style={styles.modalTextContainer}>
                        <Text style={styles.modalOptionTitle}>Post a Project</Text>
                        <Text style={styles.modalOptionSubtitle}>Hire freelancers for fixed-scope, short or long-term work.</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
          </View>
      </Modal>
    </>
  );
};

// Styles are already well-designed and do not need changes.
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 30 },
    title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    subtitle: { color: '#aaa', fontSize: 16, marginTop: 4 },
    addButton: { backgroundColor: '#1c1c1e', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 30 },
    statCard: { flex: 1, marginHorizontal: 6, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 10, alignItems: 'center' },
    statNumber: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 8 },
    statLabel: { fontSize: 13, color: '#ccc', marginTop: 4, fontWeight: '500', textTransform: 'uppercase' },
    recentSection: { paddingHorizontal: 20, paddingBottom: 50 },
    sectionHeader: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    jobItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 18, borderRadius: 12, marginBottom: 10 },
    jobInfo: { flex: 1, marginRight: 10 },
    jobTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
    jobCompany: { color: '#999', fontSize: 14, marginTop: 4 },
    noDataContainer: { alignItems: 'center', paddingVertical: 40, backgroundColor: '#111', borderRadius: 12 },
    noDataText: { color: '#777', textAlign: 'center', fontStyle: 'italic', marginTop: 10, fontSize: 15 },
    noDataSubText: { color: '#555', fontSize: 13, marginTop: 5 },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
    modalContent: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
    modalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 25 },
    modalOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2c2c2e', padding: 20, borderRadius: 12, marginBottom: 15 },
    modalTextContainer: { marginLeft: 15, flex: 1 },
    modalOptionTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
    modalOptionSubtitle: { color: '#aaa', fontSize: 14, marginTop: 4 },
    closeButton: { marginTop: 10, padding: 15, borderRadius: 12, alignItems: 'center' },
    closeButtonText: { color: '#28a745', fontSize: 16, fontWeight: '600' },
});

export default EmployerDashboard;