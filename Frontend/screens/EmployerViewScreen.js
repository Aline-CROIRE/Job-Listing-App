import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import RNPickerSelect from 'react-native-picker-select';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const backendUrl = 'http://192.168.1.151:5000';

const EmployerViewScreen = () => {
  const navigation = useNavigation();
  const isEmployer = true;

  const [searchQuery, setSearchQuery] = useState('');
  const [workType, setWorkType] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const [jobs, setJobs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsRes, projectsRes] = await Promise.all([
          axios.get(`${backendUrl}/api/jobs`),
          axios.get(`${backendUrl}/api/projects`),
        ]);
        setJobs(jobsRes.data);
        setProjects(projectsRes.data);
      } catch (err) {
        setError('Failed to fetch jobs or projects.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterItems = (items, isJob = true) => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesWorkType = !workType || item.jobType === workType;
      const matchesWorkMode = !workMode || item.workType === workMode;
      return matchesSearch && matchesWorkType && matchesWorkMode;
    });
  };

  const filteredJobs = typeFilter !== 'Projects' ? filterItems(jobs) : [];
  const filteredProjects = typeFilter !== 'Jobs' ? filterItems(projects, false) : [];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <TextInput
        placeholder="Search jobs or projects..."
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Filters */}
      <View style={styles.filterRow}>
        <View style={styles.filter}>
          <RNPickerSelect
            onValueChange={setWorkType}
            placeholder={{ label: 'Work Type', value: '' }}
            items={[
              { label: 'Full-time', value: 'Full-time' },
              { label: 'Part-time', value: 'Part-time' },
            ]}
          />
        </View>
        <View style={styles.filter}>
          <RNPickerSelect
            onValueChange={setWorkMode}
            placeholder={{ label: 'Mode', value: '' }}
            items={[
              { label: 'Remote', value: 'Remote' },
              { label: 'Onsite', value: 'Onsite' },
            ]}
          />
        </View>
        <View style={styles.filter}>
          <RNPickerSelect
            onValueChange={setTypeFilter}
            placeholder={{ label: 'All', value: 'All' }}
            items={[
              { label: 'Jobs', value: 'Jobs' },
              { label: 'Projects', value: 'Projects' },
            ]}
          />
        </View>
      </View>

      {/* Jobs */}
      {filteredJobs.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Jobs</Text>
          <FlatList
            data={filteredJobs}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('JobDetails', { id: item._id })}
              >
                <View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.jobType} | {item.workType}</Text>
                  <Text style={styles.cardSalary}>${item.salary}</Text>
                </View>
                {isEmployer && (
                  <View style={styles.actions}>
                    <Icon name="pencil" size={20} color="#007BFF" style={styles.icon} />
                    <Icon name="trash" size={20} color="#dc3545" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </>
      )}

      {/* Projects */}
      {filteredProjects.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Projects</Text>
          <FlatList
            data={filteredProjects}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ProjectDetails', { id: item._id })}
              >
                <View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.workType}</Text>
                  <Text style={styles.cardSalary}>Budget: ${item.budget}</Text>
                </View>
                {isEmployer && (
                  <View style={styles.actions}>
                    <Icon name="pencil" size={20} color="#007BFF" style={styles.icon} />
                    <Icon name="trash" size={20} color="#dc3545" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </View>
  );
};

export default EmployerViewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filter: {
    width: '32%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#555',
  },
  cardSalary: {
    fontSize: 14,
    color: '#28a745',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  icon: {
    marginRight: 10,
  },
});
