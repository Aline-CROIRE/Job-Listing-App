import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput, Alert, Vibration
} from 'react-native';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';

const backendUrl = 'http://172.31.243.24:5000'; // Your Backend IP

const JobDetailsScreen = () => {
  const route = useRoute();
  const { id, type } = route.params;
  const { token } = useContext(UserContext);

  const [opportunity, setOpportunity] = useState(null);
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
    const fetchOpportunity = async () => {
      const endpoint = type === 'Job' ? `/api/jobs/${id}` : `/api/projects/${id}`;
      try {
        const res = await axios.get(`${backendUrl}${endpoint}`);
        setOpportunity(res.data.job || res.data.project);
      } catch (err) {
        setError(`Failed to load ${type} details.`);
      } finally {
        setLoading(false);
      }
    };
    if (id && type) fetchOpportunity();
  }, [id, type]);

  const handleApply = () => {
    // 1. Give instant physical feedback
    Vibration.vibrate(10); 

    // 2. Run quick validations first
    if (!coverLetter.trim()) {
      return Alert.alert('Validation Error', 'A cover letter is required.');
    }
    if (!token) {
      return Alert.alert('Unauthorized', 'You must be logged in to apply.');
    }
    if (type !== 'Job') {
      return Alert.alert('Not Supported', 'Application for this opportunity type is not yet implemented.');
    }

    // 3. Set loading state to TRUE. The UI will now update to show the spinner.
    setApplying(true);

    // 4. Defer the heavy network task to allow the UI to re-render first.
    setTimeout(async () => {
      const applicationData = {
        jobId: id,
        coverLetter,
        ...(expectedSalary && { expectedSalary: Number(expectedSalary) }),
        ...(availableStartDate && { availableStartDate }),
        ...(portfolioUrl && { portfolioUrl }),
        ...(linkedinUrl && { linkedinUrl }),
        ...(githubUrl && { githubUrl }),
      };

      try {
        const endpoint = `${backendUrl}/api/job-applications`;
        const response = await axios.post(endpoint, applicationData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert('Success!', response.data.message || 'Your application has been submitted.');
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'An unexpected error occurred.';
        let detailedErrors = '';
        if (err.response?.data?.errors) {
          detailedErrors = err.response.data.errors.map(e => e.msg).join('\n');
        }
        Alert.alert('Application Failed', `${errorMessage}${detailedErrors ? `\n\n- ${detailedErrors}` : ''}`);
      } finally {
        // Ensure the loading state is turned off, regardless of success or failure.
        setApplying(false);
      }
    }, 0); 
  };

  if (loading) { return <View style={styles.center}><ActivityIndicator size="large" color="#28a745" /></View>; }
  if (error) { return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>; }
  if (!opportunity) { return <View style={styles.center}><Text style={styles.errorText}>Opportunity not found.</Text></View>; }

  const isButtonDisabled = applying || type !== 'Job';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>{opportunity.title}</Text>
      <Text style={styles.label}>Company:</Text>
      <Text style={styles.value}>{opportunity.company?.name || 'N/A'}</Text>
      <Text style={styles.label}>Type:</Text>
      <Text style={styles.value}>{opportunity.jobType ? `${opportunity.jobType} | ${opportunity.workType}` : opportunity.type}</Text>
      <Text style={styles.label}>Skills Required:</Text>
      <Text style={styles.value}>{opportunity.skillsRequired?.join(', ')}</Text>
      <Text style={styles.label}>{opportunity.salary ? 'Salary:' : 'Budget:'}</Text>
      <Text style={styles.value}>
        {(opportunity.salary?.currency || opportunity.budget?.currency || '')} {(opportunity.salary?.min || opportunity.budget?.min)} - {(opportunity.salary?.max || opportunity.budget?.max)}
      </Text>
      <Text style={styles.label}>{opportunity.applicationDeadline ? 'Application Deadline:' : 'Project Deadline:'}</Text>
      <Text style={styles.value}>{(opportunity.applicationDeadline || opportunity.deadline)?.split('T')[0]}</Text>
      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{opportunity.description}</Text>
      
      <View style={styles.formSeparator} />
      
      <Text style={styles.formTitle}>Application Form</Text>
      <Text style={styles.formLabel}>Cover Letter *</Text>
      <TextInput style={[styles.input, { height: 120, textAlignVertical: 'top' }]} placeholder="Explain why you are the best fit..." placeholderTextColor="#666" multiline value={coverLetter} onChangeText={setCoverLetter} />
      <Text style={styles.formLabel}>Expected Salary</Text>
      <TextInput style={styles.input} placeholder="e.g. 95000" placeholderTextColor="#666" keyboardType="numeric" value={expectedSalary} onChangeText={setExpectedSalary} />
      <Text style={styles.formLabel}>Available Start Date</Text>
      <TextInput style={styles.input} placeholder="YYYY-MM-DDTHH:MM:SS.sssZ" placeholderTextColor="#666" value={availableStartDate} onChangeText={setAvailableStartDate} />
      <Text style={styles.formLabel}>Portfolio URL</Text>
      <TextInput style={styles.input} placeholder="https://yourportfolio.com" placeholderTextColor="#666" autoCapitalize="none" value={portfolioUrl} onChangeText={setPortfolioUrl} />
      <Text style={styles.formLabel}>LinkedIn URL</Text>
      <TextInput style={styles.input} placeholder="https://linkedin.com/in/yourname" placeholderTextColor="#666" autoCapitalize="none" value={linkedinUrl} onChangeText={setLinkedinUrl} />
      <Text style={styles.formLabel}>GitHub URL</Text>
      <TextInput style={styles.input} placeholder="https://github.com/yourname" placeholderTextColor="#666" autoCapitalize="none" value={githubUrl} onChangeText={setGithubUrl} />

      <TouchableOpacity
        style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
        onPress={handleApply}
        disabled={isButtonDisabled}
        activeOpacity={0.7}
      >
        {applying ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Apply Now</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  contentContainer: { padding: 20, paddingBottom: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  errorText: { color: '#ff4d4d', fontSize: 16, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  label: { color: '#aaa', fontSize: 14, marginTop: 16, fontWeight: '600', textTransform: 'uppercase' },
  value: { color: '#ddd', fontSize: 16, marginTop: 6, lineHeight: 24 },
  formSeparator: { height: 1, backgroundColor: '#333', marginVertical: 30 },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: '#28a745', marginBottom: 20, textAlign: 'center' },
  formLabel: { color: '#bbb', marginTop: 16, marginBottom: 6, fontSize: 15 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#333' },
  button: { 
    backgroundColor: '#28a745', 
    padding: 16, 
    borderRadius: 10, 
    marginTop: 30, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { 
    color: '#000', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
});

export default JobDetailsScreen;