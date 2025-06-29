// screens/BrowseScreen.js

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const backendUrl = 'http://172.31.243.24:5000';

// A helper to format salary/budget objects nicely
const formatSalary = (item) => {
  const data = item.salary || item.budget;
  if (!data || typeof data !== 'object') return 'Not specified';
  const { min, max, currency = '', period = 'yearly' } = data;
  if (!min && !max) return 'Not specified';
  if (min && max) return `${currency} ${min} - ${max} / ${period}`;
  return `${currency} ${min || max} / ${period}`;
};

// Reusable card component for a clean and consistent look
const OpportunityCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <View style={[styles.typePill, item.type === 'Job' ? styles.jobPill : styles.projectPill]}>
        <Text style={styles.typePillText}>{item.type}</Text>
      </View>
    </View>
    <Text style={styles.cardCompany}>{item.company?.name || 'Individual Client'}</Text>
    <View style={styles.infoRow}>
        <Icon name="location-outline" size={14} color="#aaa" />
        <Text style={styles.infoText}>{item.location?.city || item.workType}</Text>
    </View>
    <View style={styles.infoRow}>
        <Icon name="cash-outline" size={14} color="#aaa" />
        <Text style={styles.infoText}>{formatSalary(item)}</Text>
    </View>
  </TouchableOpacity>
);

const BrowseScreen = () => {
  const navigation = useNavigation();

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [jobType, setJobType] = useState(null);
  const [workType, setWorkType] = useState(null);
  
  // State for data and loading
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Debounce search input to prevent excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500); // 500ms delay
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Main data fetching function
  const fetchData = useCallback(async (isRefresh = false) => {
    const currentPage = isRefresh ? 1 : page;
    if (loading || (!hasNextPage && !isRefresh)) return;

    if (isRefresh) setRefreshing(true);
    else if (currentPage > 1) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: debouncedQuery,
        jobType: jobType || undefined,
        workType: workType || undefined,
        status: 'open',
      };
      
      // Fetch both jobs and projects with the same filters
      const [jobsRes, projectsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/jobs`, { params }),
        axios.get(`${backendUrl}/api/projects`, { params: { ...params, jobType: undefined } }), // Projects don't have jobType
      ]);
      
      const fetchedJobs = (jobsRes.data.jobs || []).map(j => ({ ...j, type: 'Job' }));
      const fetchedProjects = (projectsRes.data.projects || []).map(p => ({ ...p, type: 'Project' }));
      
      const combinedData = [...fetchedJobs, ...fetchedProjects].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

      setData(isRefresh ? combinedData : [...data, ...combinedData]);
      setHasNextPage(jobsRes.data.pagination.hasNext || projectsRes.data.pagination.hasNext);
      setPage(currentPage + 1);

    } catch (err) {
      console.error('Failed to fetch opportunities:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [debouncedQuery, jobType, workType, page, loading, hasNextPage]);

  // Trigger a refresh when filters change
  useEffect(() => {
    setData([]);
    setPage(1);
    setHasNextPage(true);
    fetchData(true);
  }, [debouncedQuery, jobType, workType]);

  const onRefresh = () => fetchData(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchInputContainer}>
          <Icon name="search-outline" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            placeholder="Search by title, skill..."
            placeholderTextColor="#888"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <RNPickerSelect
          onValueChange={(value) => setJobType(value)}
          placeholder={{ label: 'Job Type', value: null }}
          items={[
            { label: 'Full-time', value: 'full-time' },
            { label: 'Part-time', value: 'part-time' },
            { label: 'Contract', value: 'contract' },
            { label: 'Internship', value: 'internship' },
          ]}
          style={pickerStyle}
          useNativeAndroidPickerStyle={false}
          Icon={() => <Icon name="chevron-down" size={20} color="#888" />}
        />
        <RNPickerSelect
          onValueChange={(value) => setWorkType(value)}
          placeholder={{ label: 'Work Location', value: null }}
          items={[
            { label: 'Remote', value: 'remote' },
            { label: 'On-site', value: 'on-site' },
            { label: 'Hybrid', value: 'hybrid' },
          ]}
          style={pickerStyle}
          useNativeAndroidPickerStyle={false}
          Icon={() => <Icon name="chevron-down" size={20} color="#888" />}
        />
      </View>

      {loading && page === 1 ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <OpportunityCard
              item={item}
              onPress={() => navigation.navigate('JobDetailsScreen', { id: item._id, type: item.type })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
          onEndReached={() => fetchData()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} color="#fff" /> : null}
          ListEmptyComponent={() => (
            !loading && <View style={styles.center}>
              <Icon name="sad-outline" size={60} color="#444" />
              <Text style={styles.emptyText}>No Opportunities Found</Text>
              <Text style={styles.emptySubText}>Try adjusting your search or filters.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const pickerStyle = {
  inputIOS: {
    height: 48, fontSize: 16, paddingHorizontal: 10,
    backgroundColor: '#1a1a1a', borderRadius: 12, color: 'white',
  },
  inputAndroid: {
    height: 48, fontSize: 16, paddingHorizontal: 10,
    backgroundColor: '#1a1a1a', borderRadius: 12, color: 'white',
  },
  placeholder: { color: '#888' },
  iconContainer: { top: 14, right: 15 },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 5 },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1a1a1a', borderRadius: 12,
  },
  searchIcon: { paddingLeft: 12 },
  searchInput: {
    flex: 1, height: 48, color: '#fff', fontSize: 16, paddingHorizontal: 10,
  },
  filterRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: 16, paddingVertical: 10, gap: 10,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    backgroundColor: '#1C1C1E', padding: 16,
    borderRadius: 12, marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#fff',
    flex: 1, marginRight: 8,
  },
  typePill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  jobPill: { backgroundColor: '#2563EB' },
  projectPill: { backgroundColor: '#9333EA' },
  typePillText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  cardCompany: {
    fontSize: 15, color: '#ccc', marginBottom: 12,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoText: { fontSize: 14, color: '#aaa', marginLeft: 8 },
  emptyText: {
    color: '#888', marginTop: 15, fontSize: 18, fontWeight: '600',
  },
  emptySubText: { color: '#666', marginTop: 8, fontSize: 14 },
});

export default BrowseScreen;