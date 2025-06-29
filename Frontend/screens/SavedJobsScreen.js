// screens/SavedItemsScreen.js

import React, { useState, useContext, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import Icon from 'react-native-vector-icons/Ionicons';

const backendUrl = 'http://172.31.243.24:5000';

const SavedItemCard = ({ savedItem }) => {
    const navigation = useNavigation();
    const item = savedItem.item; // The actual populated job or project document
    if (!item) return null;

    return (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('JobDetailsScreen', { id: item._id, type: savedItem.onModel })}
        >
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.companyName}>{item.company?.name || 'Individual Client'}</Text>
            <View style={[styles.typePill, savedItem.onModel === 'Job' ? styles.jobPill : styles.projectPill]}>
                <Text style={styles.typePillText}>{savedItem.onModel}</Text>
            </View>
        </TouchableOpacity>
    );
};

const SavedItemsScreen = () => {
    const { token } = useContext(UserContext);
    const [savedItems, setSavedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const fetchSavedItems = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(`${backendUrl}/api/users/my-saved-items`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSavedItems(res.data.savedItems);
        } catch (error) {
            Alert.alert("Error", "Could not load saved items.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useFocusEffect(useCallback(() => { fetchSavedItems(); }, [fetchSavedItems]));

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#28a745" /></View>;

    return (
        <FlatList
            style={styles.container}
            data={savedItems}
            renderItem={({ item }) => <SavedItemCard savedItem={item} />}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={() => (
                <View style={styles.center}>
                    <Icon name="bookmark-outline" size={60} color="#444" />
                    <Text style={styles.emptyText}>You haven't saved any items yet.</Text>
                </View>
            )}
            contentContainerStyle={{ flexGrow: 1 }}
        />
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: '#888', marginTop: 15, fontSize: 16 },
    card: { backgroundColor: '#1C1C1E', padding: 15, marginHorizontal: 15, marginVertical: 8, borderRadius: 12 },
    itemTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    companyName: { color: '#aaa', fontSize: 14, marginBottom: 12 },
    typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    typePillText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    jobPill: { backgroundColor: '#2563EB' },
    projectPill: { backgroundColor: '#9333EA' },
});

export default SavedItemsScreen;