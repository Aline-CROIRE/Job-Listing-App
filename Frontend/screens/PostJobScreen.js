import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const backendUrl = 'http://192.168.1.151:5000';

export default function PostJobScreen({ navigation }) {
  const { token } = useContext(UserContext);
  const [step, setStep] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    jobType: '',
    workType: '',
    skillsRequired: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    salaryPeriod: 'yearly',
    locationCity: '',
    locationState: '',
    locationCountry: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    experienceLevel: '',
    applicationDeadline: '',
    companyName: '',
    companySize: '',
    companyIndustry: '',
  });

  const handleSubmit = async () => {
    try {
      const payload = {
        title: form.title,
        description: form.description,
        jobType: form.jobType,
        workType: form.workType,
        skillsRequired: form.skillsRequired.split(',').map(s => s.trim()),
        salary: {
          min: parseFloat(form.salaryMin),
          max: parseFloat(form.salaryMax),
          currency: form.salaryCurrency,
          period: form.salaryPeriod,
        },
        location: {
          city: form.locationCity,
          state: form.locationState,
          country: form.locationCountry,
        },
        requirements: form.requirements.split(',').map(s => s.trim()),
        responsibilities: form.responsibilities.split(',').map(s => s.trim()),
        benefits: form.benefits.split(',').map(s => s.trim()),
        experienceLevel: form.experienceLevel,
        applicationDeadline: form.applicationDeadline,
        company: {
          name: form.companyName,
          size: form.companySize,
          industry: form.companyIndustry,
        },
      };

      await axios.post(`${backendUrl}/api/jobs`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Success', 'Job posted successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to post job');
    }
  };

  if (!step) {
    return (
      <View style={styles.choiceContainer}>
        <Text style={styles.title}>What would you like to post?</Text>
        <TouchableOpacity
          style={styles.choiceButton}
          onPress={() => setStep('job')}
        >
          <Text style={styles.choiceText}>Post a Job</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.choiceButton, { backgroundColor: '#666' }]}
          disabled
        >
          <Text style={styles.choiceText}>Post a Project (coming soon)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Post a Job</Text>
      {Object.entries({
        title: 'Job Title',
        description: 'Description',
        jobType: 'Job Type (e.g., full-time)',
        workType: 'Work Type (e.g., remote)',
        skillsRequired: 'Skills (comma-separated)',
        salaryMin: 'Min Salary',
        salaryMax: 'Max Salary',
        locationCity: 'City',
        locationState: 'State',
        locationCountry: 'Country',
        requirements: 'Requirements (comma-separated)',
        responsibilities: 'Responsibilities (comma-separated)',
        benefits: 'Benefits (comma-separated)',
        experienceLevel: 'Experience Level',
        applicationDeadline: 'Deadline (YYYY-MM-DD)',
        companyName: 'Company Name',
        companySize: 'Company Size',
        companyIndustry: 'Company Industry',
      }).map(([key, placeholder]) => (
        <TextInput
          key={key}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          style={styles.input}
          value={form[key]}
          onChangeText={text => setForm(prev => ({ ...prev, [key]: text }))}
        />
      ))}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Job</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    padding: 20,
    flex: 1,
  },
  heading: {
    fontSize: 22,
    color: '#28a745',
    marginBottom: 30,
    fontWeight: 'bold',
    textAlign:'center',
    marginTop: 50,
},
  input: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 12,
    marginBottom: 20,
    borderRadius: 6,
    borderColor: '#333',
    borderWidth: 1,
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom:100,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  choiceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  choiceButton: {
    backgroundColor: '#28a745',
    padding: 20,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  choiceText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 20,
  },
});
