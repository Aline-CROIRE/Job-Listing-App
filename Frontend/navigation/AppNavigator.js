import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { UserContext } from '../context/UserContext';

// Navigators
import AuthNavigator from './AuthNavigator';
import TalentTabs from '../screens/TalentTabs'; // Corrected path if in same folder
import EmployerTabs from '../screens/EmployerTabs'; // Corrected path if in same folder

// Screens (only those NOT part of a stack below)
import AdminDashboard from '../screens/AdminDashboard';
// Note: Other screens like EditProfile are now handled within their respective stacks

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const { user, loading } = useContext(UserContext); // Assuming context provides `loading`

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#28a745" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {/* 
                  This is a more robust way to handle auth flow.
                  We render one group of screens if there's a user, 
                  and a different group if not.
                */}
                {user ? (
                    <>
                        {user.role === 'employer' && (
                            <Stack.Screen name="EmployerApp" component={EmployerTabs} />
                        )}
                        {user.role === 'talent' && (
                            <Stack.Screen name="TalentApp" component={TalentTabs} />
                        )}
                        {user.role === 'admin' && (
                            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
                        )}
                    </>
                ) : (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}