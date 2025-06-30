// screens/TalentDashboard.js

import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Dimensions } from 'react-native';
import { UserContext } from '../context/UserContext'; 
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const backendUrl = 'http://192.168.1.231:5000';

const { width } = Dimensions.get('window');
const cardPadding = 20;
const cardMargin = 10;
const cardWidth = (width - (cardPadding * 2) - cardMargin) / 2;

const calculateMatchScore = (postSkillsRequired = [], talentSkills = []) => {
    if (postSkillsRequired.length === 0 || talentSkills.length === 0) return 0;
    const postSkills = new Set(postSkillsRequired.map(s => s.toLowerCase().trim()));
    const talentSkillsSet = new Set(talentSkills.map(s => s.toLowerCase().trim()));
    let matchedCount = 0;
    for (const skill of talentSkillsSet) { if (postSkills.has(skill)) { matchedCount++; } }
    const score = (matchedCount / postSkills.size) * 100;
    return Math.min(100, Math.round(score));
};

const StatCard = ({ icon, count, label, onPress }) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress} disabled={!onPress}>
        <Icon name={icon} size={28} color="#28a745" />
        <Text style={styles.statNumber}>{count}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
);

const RecommendationItem = ({ item, onNavigate, onApply, onSave, isSaved, style }) => {
    const getMatchBadgeColor = (score) => {
        if (score >= 75) return '#28a745';
        if (score >= 40) return '#D4AF37';
        return '#555';
    };
    const isExpired = item.isExpired;

    return (
        <View style={[styles.recItem, style]}>
            <TouchableOpacity onPress={onNavigate} activeOpacity={0.8} style={styles.mainContent}>
                {/* The save button is now always visible and works for both types */}
                <TouchableOpacity style={styles.saveButton} onPress={onSave}>
                    <Icon name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={isSaved ? "#28a745" : "#888"} />
                </TouchableOpacity>
                
                <View style={styles.recHeader}>
                    <Text style={styles.recTitle} numberOfLines={2}>{item.title}</Text>
                </View>

                <View style={styles.infoRow}>
                     <View style={[styles.typePill, item.type === 'Job' ? styles.jobPill : styles.projectPill]}>
                        <Text style={styles.typePillText}>{item.type}</Text>
                    </View>
                    <View style={[styles.matchBadge, { backgroundColor: getMatchBadgeColor(item.matchScore) }]}>
                        <Icon name="star" size={12} color="#fff" />
                        <Text style={styles.matchText}>{item.matchScore}%</Text>
                    </View>
                </View>

                <Text style={styles.recCompany} numberOfLines={1}>{item.company?.name || 'Individual Client'}</Text>
            </TouchableOpacity>
            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.detailsButton} onPress={onNavigate}>
                    <Text style={styles.detailsButtonText}>Details</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.applyButton, isExpired && styles.applyButtonDisabled]} 
                    onPress={onApply}
                    disabled={isExpired}
                >
                    <Text style={[styles.applyButtonText, isExpired && styles.applyButtonTextDisabled]}>
                        {isExpired ? 'Closed' : 'Apply'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const TalentDashboard = () => {
    const navigation = useNavigation();
    const { user, token, refreshUser } = useContext(UserContext); 
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        if (!token || !user?.talentProfile) { setLoading(false); setRefreshing(false); return; }
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [jobsRes, projectsRes, applicationsRes] = await Promise.all([
                axios.get(`${backendUrl}/api/jobs`, { headers, params: { status: 'open', limit: 100 } }),
                axios.get(`${backendUrl}/api/projects`, { headers, params: { status: 'open', limit: 100 } }),
                axios.get(`${backendUrl}/api/job-applications/my`, { headers }),
            ]);
            const openJobs = jobsRes.data?.jobs || [];
            const openProjects = projectsRes.data?.projects || [];
            const allOpenings = [...openJobs.map(j => ({...j, type: 'Job'})), ...openProjects.map(p => ({...p, type: 'Project'}))];

            const recommendations = allOpenings.map(post => ({
                ...post, 
                matchScore: calculateMatchScore(post.skillsRequired, user.talentProfile.skills),
                isExpired: (post.applicationDeadline || post.deadline) ? new Date() > new Date(post.applicationDeadline || post.deadline) : false,
            })).sort((a, b) => b.matchScore - a.matchScore);

            setDashboardData({
                stats: { 
                    savedItems: user.savedItems?.length ?? 0, 
                    applicationsSent: applicationsRes.data.pagination.total ?? 0,
                },
                recommendations: { 
                    topMatches: recommendations.filter(r => r.matchScore >= 75).slice(0, 6), 
                    goodMatches: recommendations.filter(r => r.matchScore >= 40 && r.matchScore < 75).slice(0, 6),
                }
            });
        } catch (error) {
            console.error('Error building talent dashboard:', error.response?.data || error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, user]);

    useFocusEffect(useCallback(() => { fetchDashboardData(); }, [fetchDashboardData]));
    const onRefresh = useCallback(() => { setRefreshing(true); fetchDashboardData(); }, [fetchDashboardData]);

    const handleSaveItem = async (item) => {
        if (!item?._id || !item?.type) return;
        try {
            await axios.post(`${backendUrl}/api/users/save-item`, 
                { itemId: item._id, itemType: item.type },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (refreshUser) await refreshUser();
        } catch (error) {
            Alert.alert("Error", "Could not update your saved items.");
        }
    };

    const renderRecommendationSection = (title, data, color) => (
        data && data.length > 0 && (
            <View style={styles.section}>
                <Text style={[styles.sectionHeader, { borderLeftColor: color }]}>{title}</Text>
                <View style={styles.recommendationGrid}>
                    {data.map(item => (
                        <RecommendationItem
                            key={item._id}
                            item={item}
                            style={{ width: cardWidth }}
                            onNavigate={() => navigation.navigate('JobDetailsScreen', { id: item._id, type: item.type })}
                            onApply={() => navigation.navigate('JobDetailsScreen', { id: item._id, type: item.type })}
                            onSave={() => handleSaveItem(item)}
                            isSaved={user?.savedItems?.some(saved => saved.item === item._id)}
                        />
                    ))}
                </View>
            </View>
        )
    );
  
    if (loading && !dashboardData) return <View style={styles.centeredContainer}><ActivityIndicator size="large" color="#28a745" /></View>;

    return (
        <ScrollView 
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Welcome, {user?.name?.split(' ')[0]} 👋</Text>
            </View>
            <View style={styles.statsRow}>
                <StatCard icon="bookmark-outline" count={dashboardData?.stats?.savedItems ?? 0} label="Saved" onPress={() => navigation.navigate('SavedJobsS')} />
                <StatCard icon="paper-plane-outline" count={dashboardData?.stats?.applicationsSent ?? 0} label="Applied" onPress={() => navigation.navigate('AppliedJobsScreen')} />
                <StatCard icon="person-circle-outline" count={'View'} label="My Profile" onPress={() => navigation.navigate('ProfileStack')} />
            </View>
      
            {renderRecommendationSection('Top Matches For You', dashboardData?.recommendations?.topMatches, '#28a745')}
            {renderRecommendationSection('Good Matches', dashboardData?.recommendations?.goodMatches, '#D4AF37')}
      
            {(!dashboardData?.recommendations?.topMatches?.length && !dashboardData?.recommendations?.goodMatches?.length) && (
                <View style={styles.noDataContainer}>
                    <Icon name="search-circle-outline" size={60} color="#444" />
                    <Text style={styles.noDataText}>No recommendations yet.</Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
    title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 20, marginBottom: 30, backgroundColor: '#111', paddingVertical: 15, borderRadius: 16 },
    statCard: { flex: 1, alignItems: 'center' },
    statNumber: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 5 },
    statLabel: { fontSize: 13, color: '#888', marginTop: 3 },
    section: { marginBottom: 15 },
    sectionHeader: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 15, marginLeft: 20, borderLeftWidth: 4, paddingLeft: 10 },
    recommendationGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
    recItem: { backgroundColor: '#1C1C1E', borderRadius: 12, marginBottom: 20, overflow: 'hidden' },
    mainContent: { padding: 15, paddingBottom: 10, height: 160 },
    saveButton: { position: 'absolute', top: 10, right: 10, zIndex: 1, padding: 5 },
    recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginRight: 30 },
    recTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600', lineHeight: 22 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    typePillText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    jobPill: { backgroundColor: '#2563EB' }, // Blue for Job
    projectPill: { backgroundColor: '#9333EA' }, // Purple for Project
    matchBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
    matchText: { color: '#fff', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },
    recCompany: { color: '#999', fontSize: 14, marginTop: 10 },
    actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#333' },
    detailsButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#333' },
    detailsButtonText: { color: '#ccc', fontWeight: '600' },
    applyButton: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#28a74522' },
    applyButtonText: { color: '#28a745', fontWeight: 'bold' },
    applyButtonDisabled: { backgroundColor: '#2a2a2a' },
    applyButtonTextDisabled: { color: '#666', fontWeight: '600' },
    noDataContainer: { alignItems: 'center', padding: 50 },
});

export default TalentDashboard;