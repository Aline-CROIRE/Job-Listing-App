import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const backendUrl = 'http://192.168.1.151:5000';

const ProjectDetailsScreen = () => {
  const route = useRoute();
  const { id } = route.params;

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/projects/${id}`);
        setProject(res.data.project || res.data.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleApply = async () => {
    try {
      setApplying(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return Alert.alert('Unauthorized', 'You must be logged in');

      await axios.post(
        `${backendUrl}/api/projects/${id}/apply`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Success', 'Project application submitted!');
    } catch (err) {
      console.error(err);
      Alert.alert(
        'Application Failed',
        err.response?.data?.message || 'Something went wrong'
      );
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#28a745" />
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

  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#fff' }}>No project found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{project.title}</Text>

      <Text style={styles.label}>Client:</Text>
      <Text style={styles.value}>{project.client?.name || 'N/A'}</Text>

      <Text style={styles.label}>Type:</Text>
      <Text style={styles.value}>{project.type} | {project.workType}</Text>

      <Text style={styles.label}>Skills Required:</Text>
      <Text style={styles.value}>{project.skillsRequired?.join(', ')}</Text>

      <Text style={styles.label}>Budget:</Text>
      <Text style={styles.value}>
        {project.budget?.currency || ''} {project.budget?.min} - {project.budget?.max}
      </Text>

      <Text style={styles.label}>Deadline:</Text>
      <Text style={styles.value}>{project.deadline?.split('T')[0]}</Text>

      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{project.description}</Text>

      {project.requirements?.length > 0 && (
        <>
          <Text style={styles.label}>Requirements:</Text>
          {project.requirements.map((req, idx) => (
            <Text key={idx} style={styles.bullet}>• {req}</Text>
          ))}
        </>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleApply}
        disabled={applying}
      >
        <Text style={styles.buttonText}>
          {applying ? 'Applying...' : 'Apply Now'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProjectDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 12,
  },
  label: {
    color: '#bbb',
    fontSize: 16,
    marginTop: 12,
    fontWeight: 'bold',
  },
  value: {
    color: '#fff',
    fontSize: 16,
    marginTop: 4,
  },
  bullet: {
    color: '#fff',
    fontSize: 15,
    marginLeft: 10,
    marginTop: 2,
  },
  button: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 10,
    marginTop: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
