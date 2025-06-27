import React, { useContext, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const backendUrl = 'http://192.168.1.104:5000';

const initialProject = {
    title: '',
    description: '',
    type: '',
    skillsRequired: '',
    budget: {
        min: '',
        max: '',
        currency: '',
    },
    deliverables: '',
    deadline: '',
    priority: '',
    tags: '',
};

export default function PostProjectScreen({ navigation }) {
    const { token } = useContext(UserContext);
    const [projectData, setProjectData] = useState(initialProject);

    const handleChange = (field, value) => {
        setProjectData({ ...projectData, [field]: value });
    };

    const handleNestedChange = (section, field, value) => {
        setProjectData({
            ...projectData,
            [section]: {
                ...projectData[section],
                [field]: value,
            },
        });
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                ...projectData,
                skillsRequired: projectData.skillsRequired
                    ? projectData.skillsRequired.split(',').map(s => s.trim())
                    : [],
                deliverables: projectData.deliverables
                    ? projectData.deliverables.split(',').map(d => d.trim())
                    : [],
                tags: projectData.tags
                    ? projectData.tags.split(',').map(t => t.trim())
                    : [],
                budget: {
                    min: Number(projectData.budget.min) || 0,
                    max: Number(projectData.budget.max) || 0,
                    currency: projectData.budget.currency,
                },
            };

            await axios.post(`${backendUrl}/api/projects`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            Alert.alert('Success', 'Project posted successfully');
            setProjectData(initialProject);
            navigation.goBack();
        } catch (err) {
            console.error(err.response?.data || err.message);
            Alert.alert(
                'Error',
                err.response?.data?.message || 'Failed to post project'
            );
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
            <Text style={styles.heading}>Post a Project</Text>

            {renderInput('Project Title', projectData.title, text => handleChange('title', text))}
            {renderInput('Description', projectData.description, text => handleChange('description', text), true)}
            {renderInput('Project Type (short-term / long-term)', projectData.type, text => handleChange('type', text))}
            {renderInput('Skills (comma separated)', projectData.skillsRequired, text => handleChange('skillsRequired', text))}
            {renderInput('Deliverables (comma separated)', projectData.deliverables, text => handleChange('deliverables', text))}
            {renderInput('Tags (comma separated)', projectData.tags, text => handleChange('tags', text))}
            {renderInput('Budget Min', projectData.budget.min, text => handleNestedChange('budget', 'min', text))}
            {renderInput('Budget Max', projectData.budget.max, text => handleNestedChange('budget', 'max', text))}
            {renderInput('Currency', projectData.budget.currency, text => handleNestedChange('budget', 'currency', text))}
            {renderInput('Deadline (YYYY-MM-DD)', projectData.deadline, text => handleChange('deadline', text))}
            {renderInput('Priority (low, medium, high)', projectData.priority, text => handleChange('priority', text))}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitText}>Submit Project</Text>
            </TouchableOpacity>
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
        marginTop: 30,
    },
    input: {
        backgroundColor: '#111',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
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
});
