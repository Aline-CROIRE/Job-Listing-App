import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const backendUrl = 'http://192.168.1.151:5000';

const JobDetailsScreen = () => {
  const route = useRoute();
  const { id } = route.params;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  const [coverLetter, setCoverLetter] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [availableStartDate, setAvailableStartDate] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/jobs/${id}`);
        setJob(res.data.job || res.data.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const handleApply = async () => {
    if (!coverLetter) {
      return Alert.alert('Validation Error', 'Cover letter is required.');
    }

    try {
      setApplying(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return Alert.alert('Unauthorized', 'You must be logged in');

      const applicationData = {
        coverLetter,
        expectedSalary: Number(expectedSalary),
        availableStartDate,
        portfolioUrl,
        linkedinUrl,
        githubUrl,
      };

      await axios.post(
        `${backendUrl}/api/job-applications`,
        applicationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Success', 'Job application submitted!');
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

  if (!job) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#fff' }}>No job found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{job.title}</Text>

      <Text style={styles.label}>Company:</Text>
      <Text style={styles.value}>{job.company?.name || 'N/A'}</Text>

      <Text style={styles.label}>Job Type:</Text>
      <Text style={styles.value}>{job.jobType} | {job.workType}</Text>

      <Text style={styles.label}>Skills Required:</Text>
      <Text style={styles.value}>{job.skillsRequired?.join(', ')}</Text>

      <Text style={styles.label}>Salary:</Text>
      <Text style={styles.value}>
        {job.salary?.currency || ''} {job.salary?.min} - {job.salary?.max}
      </Text>

      <Text style={styles.label}>Application Deadline:</Text>
      <Text style={styles.value}>{job.applicationDeadline?.split('T')[0]}</Text>

      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{job.description}</Text>

      <Text style={styles.formLabel}>Cover Letter *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your cover letter"
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={5}
        value={coverLetter}
        onChangeText={setCoverLetter}
      />

      {/* <Text style={styles.formLabel}>Expected Salary</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 2000"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={expectedSalary}
        onChangeText={setExpectedSalary}
      /> */}

      <Text style={styles.formLabel}>Available Start Date</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#aaa"
        value={availableStartDate}
        onChangeText={setAvailableStartDate}
      />

      <Text style={styles.formLabel}>Portfolio URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://yourportfolio.com"
        placeholderTextColor="#aaa"
        value={portfolioUrl}
        onChangeText={setPortfolioUrl}
      />

      <Text style={styles.formLabel}>LinkedIn URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://linkedin.com/in/yourname"
        placeholderTextColor="#aaa"
        value={linkedinUrl}
        onChangeText={setLinkedinUrl}
      />

      <Text style={styles.formLabel}>GitHub URL</Text>
      <TextInput
        style={styles.input}
        placeholder="https://github.com/yourname"
        placeholderTextColor="#aaa"
        value={githubUrl}
        onChangeText={setGithubUrl}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleApply}
        disabled={applying}
      >
        <Text style={styles.buttonText}>
          {applying ? 'Submitting...' : 'Apply Now'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default JobDetailsScreen;

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
  formLabel: {
    color: '#bbb',
    marginTop: 16,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#121212',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
    borderColor: '#28a745',
    borderWidth: 1,
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
