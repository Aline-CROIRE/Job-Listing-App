// AppNavigator.js

import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { UserContext } from '../context/UserContext';

// Navigators
import AuthNavigator from './AuthNavigator';
import TalentTabs from '../screens/TalentTabs';
import EmployerTabs from '../screens/EmployerTabs';

// Admin Screen
import AdminDashboard from '../screens/AdminDashboard';
import EmployerProfile from '../screens/EmployerProfileScreen';
import EmployerSettings from '../screens/EmployerSettings';
import PostProjectScreen from '../screens/PostProjectScreen';
import LoginScreen from '../screens/LoginScreen';
import EditEmployerProfileScreen from '../screens/EditEmployerProfileScreen';
import JobDetailsScreen from '../screens/JobDetailsScreen';
import ProjectDetailsScreen from '../screens/ProjectDetailsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loadingUser } = useContext(UserContext);

  if (loadingUser) { /* ... loading view is fine ... */ }

  // [FIX] This logic now works perfectly with the new structure
  const getInitialScreen = () => {
    if (!user) {
      return 'Auth'; // <-- This name now matches the screen below
    }
    switch (user.role) {
      case 'talent': return 'TalentApp';
      case 'employer': return 'EmployerApp';
      case 'admin': return 'AdminDashboard';
      default: return 'Auth';
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialScreen()}
        screenOptions={{ headerShown: false }}
      >
        {/* --- Navigator Groups --- */}

        {/* The entire authentication flow is now one "screen" */}
        <Stack.Screen name="Auth" component={AuthNavigator} />

        <Stack.Screen name="TalentApp" component={TalentTabs} />
        <Stack.Screen name="EmployerApp" component={EmployerTabs} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />

        <Stack.Screen name="EditEmployerProfile" component={EditEmployerProfileScreen} />
        <Stack.Screen name="Settings" component={EmployerSettings} />
        <Stack.Screen name="PostProject" component={PostProjectScreen} />
        <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
        <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />


      </Stack.Navigator>
    </NavigationContainer>
  );
}