import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import { useRoute } from '@react-navigation/native';
import { UserContext } from '../context/UserContext';

// Helper function to format messages from our backend to the GiftedChat format
const formatMessages = (backendMessages) => {
    return backendMessages.map(msg => ({
        _id: msg._id,
        text: msg.text,
        createdAt: new Date(msg.createdAt),
        user: {
            _id: msg.sender._id,
            name: msg.sender.name,
            avatar: msg.sender.profile?.avatar,
        },
    }));
};

export default function ChatScreen() {
    const route = useRoute();
    const { conversationId } = route.params;

    const { user, getMessages, sendMessage } = useContext(UserContext);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch messages when the component mounts
    useEffect(() => {
        const fetchMessages = async () => {
            if (!conversationId) {
                setError("Conversation not found.");
                setLoading(false);
                return;
            }
            try {
                const res = await getMessages(conversationId);
                setMessages(formatMessages(res.messages || []));
            } catch (err) {
                console.error("Failed to fetch messages:", err);
                setError("Could not load messages.");
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [conversationId, getMessages]);

    // Handle sending new messages
    const onSend = useCallback(async (newMessages = []) => {
        const text = newMessages[0].text;
        
        // Optimistic UI update: show the message immediately
        setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));

        try {
            await sendMessage(conversationId, text);
            // No need to do anything on success, the message is already in the UI.
            // A real-time app with sockets would receive the message here instead.
        } catch (err) {
            console.error("Failed to send message:", err);
            // Optionally, you could add logic to show a "failed to send" indicator
            // on the message that was optimistically added.
            setError("Message failed to send.");
        }
    }, [conversationId, sendMessage]);

    if (loading) {
        return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#28a745" /></View>;
    }

    if (error) {
        return <View style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></View>;
    }

    return (
        <View style={styles.container}>
            <GiftedChat
                messages={messages}
                onSend={messages => onSend(messages)}
                user={{
                    _id: user?._id, // This is crucial for determining sent vs. received messages
                }}
                placeholder="Type a message..."
                alwaysShowSend
                renderLoading={() => <ActivityIndicator size="large" color="#28a745" />}
                messagesContainerStyle={styles.messagesContainer}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    messagesContainer: {
        backgroundColor: '#000',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
});