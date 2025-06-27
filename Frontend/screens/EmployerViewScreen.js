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

const backendUrl = 'http://192.168.1.104:5000';

const formatSalaryPlain = (salary) => {
    if (!salary) return 'Salary not specified';

    if (typeof salary === 'object') {
        const min = salary.min ?? '';
        const max = salary.max ?? '';
        const currency = salary.currency ?? '';
        const period = salary.period ?? 'month';
        return `${currency} ${min} - ${max} / ${period}`;
    }

    return typeof salary === 'number' ? `${salary}` : String(salary);
};

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

                const jobsArray = Array.isArray(jobsRes.data)
                    ? jobsRes.data
                    : jobsRes.data.jobs || jobsRes.data.data || [];

                const projectsArray = Array.isArray(projectsRes.data)
                    ? projectsRes.data
                    : projectsRes.data.projects || projectsRes.data.data || [];

                setJobs(jobsArray);
                setProjects(projectsArray);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch jobs or projects.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filterItems = (items, type) => {
        return items.filter(item => {
            const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesWorkType = true;
            let matchesWorkMode = true;

            if (type === 'jobs') {
                matchesWorkType = !workType || item.jobType === workType;
                matchesWorkMode = !workMode || item.workType === workMode;
            } else if (type === 'projects') {
                matchesWorkType = !workType || item.type === workType; // adjust if needed for your data
                matchesWorkMode = !workMode || item.workType === workMode;
            }

            return matchesSearch && matchesWorkType && matchesWorkMode;
        });
    };

    const filteredJobs = filterItems(jobs, 'jobs');
    const filteredProjects = filterItems(projects, 'projects');

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

    return (
        <View style={styles.container}>
            <TextInput
                placeholder="Search jobs or projects..."
                placeholderTextColor="#FFFFFF"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <View style={styles.filterRow}>
                <View style={styles.filter}>
                    <RNPickerSelect
                        onValueChange={setWorkType}
                        placeholder={{ label: 'Work Type', value: '' }}
                        items={[
                            { label: 'Full-time', value: 'full-time' },
                            { label: 'Part-time', value: 'part-time' },
                            { label: 'Hourly', value: 'hourly' },
                             { label: 'Contract', value: 'contract' },
                        ]}
                        style={{ inputAndroid: { color: 'white' }, inputIOS: { color: 'white' } }}
                    />
                </View>
                <View style={styles.filter}>
                    <RNPickerSelect
                        onValueChange={setWorkMode}
                        placeholder={{ label: 'Mode', value: '' }}
                        items={[
                            { label: 'Remote', value: 'remote' },
                            { label: 'Onsite', value: 'on-site' },
                        ]}
                        style={{ inputAndroid: { color: 'white' }, inputIOS: { color: 'white' } }}
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
                        style={{ inputAndroid: { color: 'white' }, inputIOS: { color: 'white' } }}
                    />
                </View>
            </View>

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
                                    <Text style={styles.cardSalary}>{formatSalaryPlain(item.salary)}</Text>
                                </View>
                                {isEmployer && (
                                    <View style={styles.actions}>
                                        <Icon name="pencil" size={20} color="#28a745" style={styles.icon} />
                                        <Icon name="trash" size={20} color="#dc3545" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </>
            )}

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
                                    <Text style={styles.cardSalary}>{formatSalaryPlain(item.salary)}</Text>
                                </View>
                                {isEmployer && (
                                    <View style={styles.actions}>
                                        <Icon name="pencil" size={20} color="#28a745" style={styles.icon} />
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
        backgroundColor: '#000000',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#28a745',
        borderRadius: 10,
        padding: 10,
        marginTop: 30,
        marginBottom: 15,
        color: 'white',
        backgroundColor: '#121212',
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    filter: {
        width: '32%',
        borderWidth: 1,
        borderColor: '#28a745',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#121212',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 6,
        color: '#28a745',
    },
    card: {
        backgroundColor: '#121212',
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
        color: '#ffffff',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#bbbbbb',
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
        color: '#28a745',
    },
});
