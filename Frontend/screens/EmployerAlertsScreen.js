import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';
import Icon from 'react-native-vector-icons/Ionicons';

const NotificationCard = ({ notification }) => {
    const navigation = useNavigation();
    const { sender, message, type, relatedConversation } = notification;
    const isAccepted = message.includes('accepted');
    const iconName = isAccepted ? "checkmark-circle" : "close-circle";
    const iconColor = isAccepted ? "#28a745" : "#ff4d4f";

    const handlePress = () => {
        if (type === 'INVITATION_RESPONSE' && isAccepted && relatedConversation) {
            navigation.navigate('ChatScreen', { conversationId: relatedConversation });
        } else {
            Alert.alert("Notification", message);
        }
    };

    return (
        <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
            <Icon name={iconName} size={30} color={iconColor} style={styles.icon} />
            <View style={styles.textContainer}>
                <Image 
                    source={sender?.profile?.avatar ? { uri: sender.profile.avatar } : require('../assets/jobnest-logo.png')}
                    style={styles.avatar}
                />
                <Text style={styles.message} numberOfLines={3}>{message}</Text>
            </View>
        </TouchableOpacity>
    );
};

export default function EmployerAlertsScreen() {
    const { getMyNotifications } = useContext(UserContext);
    const isFocused = useIsFocused();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getMyNotifications();
            setNotifications(res.data.notifications || []);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        } finally {
            setLoading(false);
        }
    }, [getMyNotifications]);

    useEffect(() => {
        if (isFocused) {
            fetchNotifications();
        }
    }, [isFocused, fetchNotifications]);

    if (loading) {
        return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#28a745" /></View>;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <NotificationCard notification={item} />}
                ListEmptyComponent={
                    <View style={styles.centerContainer}>
                        <Icon name="notifications-off-outline" size={60} color="#555" />
                        <Text style={styles.text}>You have no new notifications.</Text>
                    </View>
                }
                contentContainerStyle={{ padding: 16 }}
                onRefresh={fetchNotifications}
                refreshing={loading}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: { color: '#ccc', fontSize: 18, marginTop: 16 },
    card: {
        backgroundColor: '#121212',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
        backgroundColor: '#222',
    },
    message: {
        color: '#eee',
        fontSize: 15,
        lineHeight: 21,
        flex: 1,
    },
});