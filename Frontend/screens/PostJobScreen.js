import React, { useState, useContext } from 'react';
import {
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { UserContext } from '../context/UserContext';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const backendUrl = 'http://192.168.1.104:5000';

const initialState = {
    title: '',
    description: '',
    jobType: '',
    workType: '',
    skillsRequired: '',
    salary: { min: '', max: '', currency: '', period: '' },
    location: { city: '', country: '' },
    requirements: '',
    responsibilities: '',
    benefits: '',
    experienceLevel: '',
    applicationDeadline: '',
    company: { name: '', size: '', industry: '' },
};

export default function PostJobScreen() {
    const navigation = useNavigation();
    const { token } = useContext(UserContext);
    const [showJobForm, setShowJobForm] = useState(false);
    const [jobData, setJobData] = useState(initialState);

    const handleChange = (field, value) => {
        setJobData({ ...jobData, [field]: value });
    };

    const handleNestedChange = (section, field, value) => {
        setJobData({ ...jobData, [section]: { ...jobData[section], [field]: value } });
    };

    const handleJobSubmit = async () => {
        try {
            const payload = {
                ...jobData,
                skillsRequired: jobData.skillsRequired.split(',').map(skill => skill.trim()),
                requirements: jobData.requirements.split(',').map(item => item.trim()),
                responsibilities: jobData.responsibilities.split(',').map(item => item.trim()),
                benefits: jobData.benefits.split(',').map(item => item.trim()),
            };

            await axios.post(`${backendUrl}/api/jobs`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            Alert.alert('Success', 'Job posted successfully!');
            setJobData(initialState);
            setShowJobForm(false);
        } catch (err) {
            console.log(err.response?.data || err.message);
            Alert.alert('Error', err.response?.data?.message || 'Failed to post job.');
        }
    };

    const renderInput = (placeholder, value, onChange, multiline = false) => (
        <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#777"
            value={value}
            onChangeText={onChange}
            multiline={multiline}
        />
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {!showJobForm ? (
                <View style={styles.choiceContainer}>
                    <Text style={styles.choiceTitle}>What would you like to post?</Text>
                    <TouchableOpacity style={styles.choiceBtn} onPress={() => setShowJobForm(true)}>
                        <Text style={styles.choiceText}>Post a Job</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.choiceBtn}
                        onPress={() => navigation.navigate('PostProject')}
                    >
                        <Text style={styles.choiceText}>Post a Project</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <Text style={styles.heading}>Post a New Job</Text>

                    {renderInput('Job Title', jobData.title, text => handleChange('title', text))}
                    {renderInput('Description', jobData.description, text => handleChange('description', text), true)}
                    {renderInput('Job Type (full-time, part-time, contract)', jobData.jobType, text => handleChange('jobType', text.trim().toLowerCase()))}
                    {renderInput('Work Type (remote, on-site, hybrid)', jobData.workType, text => handleChange('workType', text.trim().toLowerCase()))}
                    {renderInput('Skills (comma separated)', jobData.skillsRequired, text => handleChange('skillsRequired', text))}
                    {renderInput('Salary Min', jobData.salary.min, text => handleNestedChange('salary', 'min', text))}
                    {renderInput('Salary Max', jobData.salary.max, text => handleNestedChange('salary', 'max', text))}
                    {renderInput('Salary Currency (e.g. USD)', jobData.salary.currency, text => handleNestedChange('salary', 'currency', text))}
                    {renderInput('Salary Period (yearly, monthly)', jobData.salary.period, text => handleNestedChange('salary', 'period', text))}
                    {renderInput('City', jobData.location.city, text => handleNestedChange('location', 'city', text))}
                    {renderInput('Country', jobData.location.country, text => handleNestedChange('location', 'country', text))}
                    {renderInput('Requirements (comma separated)', jobData.requirements, text => handleChange('requirements', text))}
                    {renderInput('Responsibilities (comma separated)', jobData.responsibilities, text => handleChange('responsibilities', text))}
                    {renderInput('Benefits (comma separated)', jobData.benefits, text => handleChange('benefits', text))}
                    {renderInput('Experience Level (entry, mid, senior)', jobData.experienceLevel, text => handleChange('experienceLevel', text.trim().toLowerCase()))}
                    {renderInput('Application Deadline (YYYY-MM-DD)', jobData.applicationDeadline, text => handleChange('applicationDeadline', text))}
                    {renderInput('Company Name', jobData.company.name, text => handleNestedChange('company', 'name', text))}
                    {renderInput('Company Size (small, medium, large)', jobData.company.size, text => handleNestedChange('company', 'size', text))}
                    {renderInput('Company Industry', jobData.company.industry, text => handleNestedChange('company', 'industry', text))}

                    <TouchableOpacity style={styles.submitBtn} onPress={handleJobSubmit}>
                        <Text style={styles.submitText}>Submit Job</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#000',
        padding: 20,
        flexGrow: 1,
    },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#28a745',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#111',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        color: '#fff',
    },
    submitBtn: {
        backgroundColor: '#28a745',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40,
    },
    submitText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    choiceContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    choiceTitle: {
        fontSize: 20,
        color: '#fff',
        marginBottom: 20,
    },
    choiceBtn: {
        backgroundColor: '#111',
        padding: 18,
        borderRadius: 10,
        marginBottom: 15,
        width: '100%',
        alignItems: 'center',
        borderColor: '#28a745',
        borderWidth: 1,
    },
    choiceText: {
        color: '#28a745',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
