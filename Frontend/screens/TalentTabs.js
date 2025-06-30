import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

// Import all necessary screens
import TalentDashboardScreen from './TalentDashboard';
import JobDetailsScreen from './JobDetailsScreen';
import JobScreen from './JobScreen';
import Alerts from './Alerts'; // This is the TALENT's alert screen
import ChatScreen from './ChatScreen'; // <-- Import shared chat screen
import Settings from './Settings';
import TalentProfileScreen from './TalentProfileScreen';
import EditProfileScreen from './EditProfileScreen';
import AppliedJobsScreen from './AppliedJobsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const defaultStackOptions = {
    headerShown: false,
};

// Stacks for Dashboard, Jobs, and Profile (unchanged, they are correct)
function DashboardStackNavigator() { /* ... unchanged ... */ }
function JobStackNavigator() { /* ... unchanged ... */ }
const ProfileStackNavigator = () => { /* ... unchanged ... */ };

// --- NEW DEDICATED STACK FOR TALENT ALERTS ---
function TalentAlertsStackNavigator() {
    return (
        <Stack.Navigator screenOptions={defaultStackOptions}>
            <Stack.Screen name="TalentAlertsList" component={Alerts} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
        </Stack.Navigator>
    );
}

// --- Main Talent Bottom Tab Navigator ---
const TalentTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // ... your existing screenOptions (styles, etc.) are fine ...
      })}
    >
      <Tab.Screen name="DashboardStack" component={DashboardStackNavigator} options={{ title: 'For You' }} />
      <Tab.Screen name="JobStack" component={JobStackNavigator} options={{ title: 'Browse' }} />
      {/* The "Alerts" tab now renders its own stack */}
      <Tab.Screen name="Alerts" component={TalentAlertsStackNavigator} />
      <Tab.Screen name="ProfileStack" component={ProfileStackNavigator} options={{ title: 'Profile' }} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
};

export default TalentTabs;