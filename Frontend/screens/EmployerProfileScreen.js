import React, { useContext, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { UserContext } from '../context/UserContext';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';


const backendUrl = 'http://192.168.1.104:5000';

export default function EmployerProfile() {
    const { user, token, logout } = useContext(UserContext);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(user?.profile?.profile || null);
    const navigation = useNavigation();

    const handlePickImage = () => {
        ImagePicker.launchImageLibrary({ mediaType: 'photo' }, async response => {
            if (response.didCancel || response.errorCode) return;

            const asset = response.assets?.[0];
            if (!asset?.uri) return;

            try {
                setUploading(true);
                setPreview(asset.uri);

                const formData = new FormData();
                formData.append('profileImage', {
                    uri: asset.uri,
                    name: asset.fileName || 'profile.jpg',
                    type: asset.type || 'image/jpeg',
                });

                await axios.post(`${backendUrl}/api/users/upload-profile-image`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                });

                Alert.alert('Success', 'Profile image updated!');
            } catch (error) {
                Alert.alert('Upload Failed', 'Something went wrong while uploading the image.');
                console.error(error);
            } finally {
                setUploading(false);
            }
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.avatarContainer}>
                <Image
                    source={
                        preview
                            ? { uri: preview }
                            : require('../assets/icon.png')
                    }
                    style={styles.avatar}
                />
                <TouchableOpacity style={styles.editIcon} onPress={handlePickImage}>
                    {uploading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Icon name="camera" size={16} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>

            <Text style={styles.name}>{user?.name || 'Employer'}</Text>
            <View style={styles.emailBox}>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            <View style={styles.menu}>
                <MenuItem
                    icon="create-outline"
                    label="Edit Profile"
                    onPress={() => navigation.navigate('EditEmployerProfile')}
                />

                <MenuItem
                    icon="settings-outline"
                    label="Settings"
                    onPress={() => navigation.navigate('Settings')}
                />
            </View>

            <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                    logout();             
                    navigation.navigate('Login'); // or navigation.navigate('Login') if not replacing
                }}
            >
                <Icon name="log-out-outline" size={20} color="#e74c3c" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
}

function MenuItem({ icon, label, onPress = () => { } }) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <Icon name={icon} size={20} color="#28a745" />
            <Text style={styles.menuText}>{label}</Text>
            <Icon name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        alignItems: 'center',
        padding: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginTop: 200,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 2,
        borderColor: '#28a745',
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#28a745',
        padding: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#000',
    },
    name: {
        fontSize: 22,
        color: '#28a745',
        fontWeight: 'bold',
        marginTop: 15,
    },
    emailBox: {
        backgroundColor: '#111',
        paddingVertical: 6,
        paddingHorizontal: 18,
        borderRadius: 12,
        marginTop: 6,
    },
    email: {
        color: '#aaa',
        fontSize: 14,
    },
    menu: {
        width: '100%',
        marginTop: 30,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomColor: '#222',
        borderBottomWidth: 1,
        paddingHorizontal: 10,
    },
    menuText: {
        flex: 1,
        marginLeft: 15,
        color: '#fff',
        fontSize: 16,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 40,
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderColor: '#e74c3c',
        borderWidth: 1.5,
        borderRadius: 30,
    },
    logoutText: {
        color: '#e74c3c',
        fontSize: 16,
        marginLeft: 10,
        fontWeight: '600',
    },
});
