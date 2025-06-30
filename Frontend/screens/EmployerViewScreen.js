import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react'; // <-- THE FIX IS HERE
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';

// Helper function to format salary details.
const formatSalaryPlain = (salary) => {
    if (!salary) return 'Salary not specified';
    if (typeof salary === 'object') {
        const { min = '', max = '', currency = '', period = 'month' } = salary;
        return `${currency} ${min} - ${max} / ${period}`;
    }
    return String(salary);
};

// --- Sub-component for rendering a single recommended talent ---
const TalentListItem = ({ talent, posting }) => {
    const { sendInvitation, user } = useContext(UserContext);
    const [isInvited, setIsInvited] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    const handleInvite = async () => {
        setIsInviting(true);
        try {
            await sendInvitation({
                talentId: talent._id,
                postingId: posting._id,
                postingTitle: posting.title,
                employerName: user?.name || 'An Employer',
            });
            Alert.alert('Invitation Sent!', `Your invitation has been sent to ${talent.name}.`);
            setIsInvited(true);
        } catch (error) {
            console.error('Failed to send invitation:', error.response?.data || error.message);
            Alert.alert('Error', error.response?.data?.message || 'Could not send invitation.');
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <View style={styles.talentItem}>
            <Text style={styles.talentName}>{talent.name}</Text>
            <TouchableOpacity
                style={[styles.inviteButton, (isInvited || isInviting) && styles.inviteButtonDisabled]}
                onPress={handleInvite}
                disabled={isInvited || isInviting}
            >
                {isInviting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.inviteButtonText}>{isInvited ? 'Invited' : 'Invite'}</Text>}
            </TouchableOpacity>
        </View>
    );
};

// --- Sub-component for rendering a single Job or Project card ---
const PostingCard = ({ item, navigation }) => {
    const { getRecommendations } = useContext(UserContext);
    const [showTalents, setShowTalents] = useState(false);
    const [recommendedTalents, setRecommendedTalents] = useState([]);
    const [isLoadingTalents, setIsLoadingTalents] = useState(false);

    const fetchRecommendations = async () => {
        if (recommendedTalents.length > 0) {
             setShowTalents(!showTalents);
             return;
        }
        setIsLoadingTalents(true);
        setShowTalents(true);
        try {
            const res = await getRecommendations(item.type, item._id);
            setRecommendedTalents(res.data || []);
        } catch (error) {
            console.error(`Failed to fetch recommendations:`, error);
            const errorMessage = error.response?.status === 401
                ? 'Your session may have expired. Please log in again.'
                : 'Could not fetch recommendations.';
            Alert.alert('Error', errorMessage);
            setShowTalents(false);
        } finally {
            setIsLoadingTalents(false);
        }
    };

    const navigateToDetails = () => {
        const routeName = item.type === 'job' ? 'JobDetails' : 'ProjectDetails';
        navigation.navigate(routeName, { id: item._id });
    };

    return (
        <View style={styles.card}>
            <TouchableOpacity onPress={navigateToDetails}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.type === 'job' ? `${item.jobType} | ${item.workType}` : item.workType}</Text>
                <Text style={styles.cardSalary}>{formatSalaryPlain(item.salary)}</Text>
            </TouchableOpacity>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => { /* Edit logic here */ }}>
                    <Icon name="pencil" size={20} color="#28a745" style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { /* Delete logic here */ }}>
                    <Icon name="trash" size={20} color="#dc3545" />
                </TouchableOpacity>
            </View>
            <View style={styles.recommendationSection}>
                <TouchableOpacity style={styles.viewTalentsButton} onPress={fetchRecommendations}>
                    <Text style={styles.viewTalentsButtonText}>{showTalents ? 'Hide Recommendations' : 'View Recommended Talents'}</Text>
                    <Icon name={showTalents ? "chevron-up" : "chevron-down"} size={18} color="#28a745" />
                </TouchableOpacity>
                {showTalents && (
                    <View style={styles.talentListContainer}>
                        {isLoadingTalents ? (
                            <ActivityIndicator size="small" color="#FFF" style={{marginVertical: 10}}/>
                        ) : recommendedTalents.length > 0 ? (
                            recommendedTalents.map(talent => (<TalentListItem key={talent._id} talent={talent} posting={item} />))
                        ) : (
                            <Text style={styles.noTalentsText}>No recommendations found for this posting.</Text>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

// --- Main Screen Component ---
const EmployerViewScreen = () => {
    const { getJobs, getProjects } = useContext(UserContext);
    const navigation = useNavigation();
    const isFocused = useIsFocused();

    const [searchQuery, setSearchQuery] = useState('');
    const [workType, setWorkType] = useState('');
    const [workMode, setWorkMode] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [postings, setPostings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Use useCallback to memoize the fetchData function itself
    const fetchData = useCallback(async () => {
        try {
            setError(''); 
            const [jobsData, projectsData] = await Promise.all([
                getJobs(),
                getProjects(),
            ]);
            const jobs = (jobsData.jobs || []).map(j => ({ ...j, type: 'job' }));
            const projects = (projectsData.projects || []).map(p => ({ ...p, type: 'project' }));
            setPostings([...jobs, ...projects]);
        } catch (err) {
            console.error('Failed to fetch postings:', err);
            setError('Failed to fetch postings. Please ensure you are logged in.');
        }
    }, [getJobs, getProjects]); // This dependency is now stable if your context is memoized

    // This effect handles the initial data load and re-fetching when the screen is focused
    useEffect(() => {
        if (isFocused) {
            setLoading(true);
            fetchData().finally(() => setLoading(false));
        }
    }, [isFocused, fetchData]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        setIsRefreshing(false);
    };

    // Use useMemo to prevent re-calculating the filtered list on every render
    const filteredPostings = useMemo(() => {
        if (!postings) return [];
        return postings.filter(item => {
            const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesTypeFilter = typeFilter === 'All' || (item.type === 'job' && typeFilter === 'Jobs') || (item.type === 'project' && typeFilter === 'Projects');
            const matchesWorkMode = !workMode || item.workType === workMode;
            let matchesWorkType = true;
            if (workType) {
                matchesWorkType = (item.type === 'job' ? item.jobType === workType : item.type === workType);
            }
            return matchesSearch && matchesTypeFilter && matchesWorkMode && matchesWorkType;
        });
    }, [postings, searchQuery, workType, workMode, typeFilter]);

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#28a745" /></View>;
    }
    if (error && postings.length === 0) {
        return <View style={styles.center}><Text style={{ color: 'red' }}>{error}</Text></View>;
    }

    return (
        <View style={styles.container}>
            <TextInput
                placeholder="Search your postings..."
                placeholderTextColor="#FFFFFF"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            <View style={styles.filterRow}>
                 <View style={styles.filterContainer}>
                    <RNPickerSelect onValueChange={setWorkType} placeholder={{ label: 'Work Type', value: '' }} items={[{ label: 'Full-time', value: 'full-time' }, { label: 'Part-time', value: 'part-time' }, { label: 'Hourly', value: 'hourly' }, { label: 'Contract', value: 'contract' }]} style={pickerSelectStyles} useNativeAndroidPickerStyle={false} Icon={() => <Icon name="chevron-down" size={20} color="#fff" />} />
                 </View>
                 <View style={styles.filterContainer}>
                    <RNPickerSelect onValueChange={setWorkMode} placeholder={{ label: 'Mode', value: '' }} items={[{ label: 'Remote', value: 'remote' }, { label: 'On-site', value: 'on-site' }]} style={pickerSelectStyles} useNativeAndroidPickerStyle={false} Icon={() => <Icon name="chevron-down" size={20} color="#fff" />} />
                </View>
                <View style={styles.filterContainer}>
                    <RNPickerSelect onValueChange={setTypeFilter} placeholder={{ label: 'All', value: 'All' }} items={[{ label: 'Jobs', value: 'Jobs' }, { label: 'Projects', value: 'Projects' }]} style={pickerSelectStyles} useNativeAndroidPickerStyle={false} Icon={() => <Icon name="chevron-down" size={20} color="#fff" />} />
                </View>
            </View>
            <FlatList
                data={filteredPostings}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <PostingCard item={item} navigation={navigation} />}
                ListEmptyComponent={<Text style={styles.noResultsText}>No postings found.</Text>}
                contentContainerStyle={{ paddingBottom: 20 }}
                onRefresh={handleRefresh}
                refreshing={isRefreshing}
            />
        </View>
    );
};

export default EmployerViewScreen;

const pickerSelectStyles = {
    inputIOS: { fontSize: 14, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#fff', borderRadius: 8, color: 'white', paddingRight: 30, backgroundColor: '#121212' },
    inputAndroid: { fontSize: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#fff', borderRadius: 8, color: 'white', paddingRight: 30, backgroundColor: '#121212' },
    placeholder: { color: '#aaa' },
    iconContainer: { top: 12, right: 12 },
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 10, backgroundColor: '#000000' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
    searchInput: { borderWidth: 1, borderColor: '#fff', borderRadius: 10, padding: 10, marginTop: 30, marginBottom: 15, color: 'white', backgroundColor: '#121212' },
    filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 },
    filterContainer: { flex: 1 },
    card: { backgroundColor: '#121212', padding: 16, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
    cardSubtitle: { fontSize: 14, color: '#bbbbbb', marginBottom: 8 },
    cardSalary: { fontSize: 14, color: '#28a745', fontWeight: '500' },
    actions: { position: 'absolute', right: 16, top: 16, flexDirection: 'row', gap: 15 },
    icon: { color: '#28a745' },
    noResultsText: { color: '#fff', textAlign: 'center', marginTop: 30, fontSize: 16 },
    recommendationSection: { borderTopWidth: 1, borderTopColor: '#333', marginTop: 16, paddingTop: 12 },
    viewTalentsButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    viewTalentsButtonText: { color: '#28a745', fontSize: 15, fontWeight: '600' },
    talentListContainer: { marginTop: 10 },
    talentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#222' },
    talentName: { color: '#eee', fontSize: 15 },
    noTalentsText: { color: '#999', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },
    inviteButton: { backgroundColor: '#28a745', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
    inviteButtonDisabled: { backgroundColor: '#555' },
    inviteButtonText: { color: '#fff', fontWeight: 'bold' },
});