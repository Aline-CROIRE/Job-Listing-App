// screens/AppliedJobsScreen.js

import React, { useState, useContext, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import Icon from 'react-native-vector-icons/Ionicons';

const backendUrl = 'http://192.168.1.231:5000';

const ApplicationStatusBadge = ({ status }) => {
    const statusInfo = {
        applied: { color: '#3B82F6', label: 'Applied' },
        screening: { color: '#F97316', label: 'Screening' },
        interview: { color: '#A855F7', label: 'Interview' },
        offer: { color: '#22C55E', label: 'Offer' },
        hired: { color: '#14B8A6', label: 'Hired' },
        rejected: { color: '#EF4444', label: 'Rejected' },
    };
    const current = statusInfo[status?.toLowerCase()] || { color: '#6B7280', label: 'Unknown' };
    return (
        <View style={[styles.statusBadge, { backgroundColor: current.color }]}>
            <Text style={styles.statusText}>{current.label}</Text>
        </View>
    );
};

const ApplicationCard = ({ item }) => {
    const navigation = useNavigation();
    if (!item.jobId) return null;

    return (
        <TouchableOpacity 
            style={styles.card} 
            onPress={() => navigation.navigate('JobDetailsScreen', { id: item.jobId._id, type: 'Job' })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.jobTitle} numberOfLines={2}>{item.jobId.title}</Text>
                <ApplicationStatusBadge status={item.status} />
            </View>
            <Text style={styles.companyName}>{item.jobId.company?.name || 'N/A'}</Text>
            <Text style={styles.appliedDate}>Applied on: {new Date(item.createdAt).toLocaleDateString()}</Text>
        </TouchableOpacity>
    );
};

const AppliedJobsScreen = () => {
    const { token } = useContext(UserContext);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchApplications = useCallback(async () => {
        if (!token) return;
        !refreshing && setLoading(true);
        try {
            const res = await axios.get(`${backendUrl}/api/job-applications/my`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplications(res.data.applications);
        } catch (error) {
            console.error("Failed to fetch applications:", error);
            Alert.alert("Error", "Could not load your applications.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, refreshing]);

    useFocusEffect(useCallback(() => { fetchApplications(); }, [fetchApplications]));
    const onRefresh = useCallback(() => { setRefreshing(true); fetchApplications(); }, [fetchApplications]);

    if (loading && !refreshing) return <View style={styles.center}><ActivityIndicator size="large" color="#28a745" /></View>;

    return (
        <FlatList
            style={styles.container}
            data={applications}
            renderItem={({ item }) => <ApplicationCard item={item} />}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
            ListEmptyComponent={() => (
                <View style={styles.center}>
                    <Icon name="file-tray-outline" size={60} color="#444" />
                    <Text style={styles.emptyText}>You haven't applied to any jobs yet.</Text>
                </View>
            )}
            contentContainerStyle={{ flexGrow: 1, paddingTop: 10 }}
        />
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyText: { color: '#888', marginTop: 15, fontSize: 16 },
    card: { backgroundColor: '#1C1C1E', padding: 15, marginHorizontal: 15, marginVertical: 8, borderRadius: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    jobTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 10 },
    companyName: { color: '#aaa', fontSize: 14, marginBottom: 12 },
    appliedDate: { color: '#777', fontSize: 12 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});

export default AppliedJobsScreen;