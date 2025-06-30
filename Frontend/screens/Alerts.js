import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import Icon from 'react-native-vector-icons/Ionicons';

// --- Sub-component for a single invitation card ---
const InvitationCard = ({ invitation, onRespond }) => {
    const { fromEmployer, posting, message, status } = invitation;
    const [responseStatus, setResponseStatus] = useState(status);
    const [isResponding, setIsResponding] = useState(false);

    const handleResponse = async (newStatus) => {
        setIsResponding(true);
        const success = await onRespond(invitation._id, newStatus);
        if (success) {
            setResponseStatus(newStatus);
        }
        setIsResponding(false);
    };

    // Fallback image if the employer's avatar is missing
    const defaultAvatar = require('../assets/jobnest-logo.png');

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Image 
                    source={fromEmployer?.profile?.avatar ? { uri: fromEmployer.profile.avatar } : defaultAvatar}
                    style={styles.avatar}
                />
                <Text style={styles.employerName}>{fromEmployer?.name || 'An Employer'}</Text>
            </View>
            <Text style={styles.message}>"{message}"</Text>
            <View style={styles.postingInfo}>
                <Text style={styles.postingTitle}>Regarding: {posting?.title || 'a deleted posting'}</Text>
            </View>
            
            {responseStatus === 'pending' ? (
                isResponding ? (
                    <ActivityIndicator style={{ marginTop: 10 }} color="#fff" />
                ) : (
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={() => handleResponse('declined')}>
                            <Icon name="close-circle-outline" size={20} color="#ff4d4f" />
                            <Text style={[styles.buttonText, { color: '#ff4d4f' }]}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={() => handleResponse('accepted')}>
                            <Icon name="checkmark-circle-outline" size={20} color="#28a745" />
                            <Text style={[styles.buttonText, { color: '#28a745' }]}>Accept</Text>
                        </TouchableOpacity>
                    </View>
                )
            ) : (
                <View style={styles.statusContainer}>
                    <Text style={[styles.statusText, responseStatus === 'accepted' ? styles.statusAccepted : styles.statusDeclined]}>
                        You have {responseStatus} this invitation.
                    </Text>
                </View>
            )}
        </View>
    );
};


// --- Main Alerts Screen ---
export default function Alerts() {
    const { getMyInvitations, respondToInvitation } = useContext(UserContext);
    const isFocused = useIsFocused();
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchInvitations = useCallback(async () => {
        try {
            setError('');
            setLoading(true);
            const res = await getMyInvitations();
            setInvitations(res.data.invitations || []);
        } catch (err) {
            console.error("Failed to fetch invitations:", err);
            setError("Could not load your invitations. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [getMyInvitations]); // Dependency on the context function

    useEffect(() => {
        // Fetch data when the screen comes into focus
        if (isFocused) {
            fetchInvitations();
        }
    }, [isFocused, fetchInvitations]);

    const handleRespond = async (invitationId, status) => {
        try {
            await respondToInvitation(invitationId, status);
            return true; // Indicate success to the card component
        } catch (err) {
            Alert.alert("Error", "Could not process your response. Please try again.");
            return false; // Indicate failure
        }
    };
    
    if (loading) {
        return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#28a745" /></View>;
    }

    if (error) {
        return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={invitations}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <InvitationCard invitation={item} onRespond={handleRespond} />}
                ListEmptyComponent={
                    <View style={styles.centerContainer}>
                        <Icon name="notifications-off-outline" size={60} color="#555" />
                        <Text style={styles.text}>You have no new invitations.</Text>
                    </View>
                }
                contentContainerStyle={styles.listContentContainer}
                onRefresh={fetchInvitations}
                refreshing={loading}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    listContentContainer: { flexGrow: 1, padding: 16 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: { color: '#ccc', fontSize: 18, marginTop: 16 },
    errorText: { color: 'red', fontSize: 16 },
    card: {
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#222', // Placeholder color
    },
    employerName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    message: {
        color: '#ddd',
        fontSize: 15,
        fontStyle: 'italic',
        lineHeight: 22,
        marginBottom: 16,
    },
    postingInfo: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    postingTitle: {
        color: '#aaa',
        fontSize: 14,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
        gap: 12,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 6,
    },
    declineButton: { borderColor: '#ff4d4f' },
    acceptButton: { borderColor: '#28a745', backgroundColor: '#28a74520' },
    statusContainer: {
        marginTop: 16,
        padding: 10,
        borderRadius: 8,
    },
    statusText: {
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 15,
    },
    statusAccepted: { color: '#28a745' },
    statusDeclined: { color: '#ff4d4f' },
});