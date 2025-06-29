// screens/TalentTabs.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

// Import all necessary screens for the Talent flow
import TalentDashboardScreen from './TalentDashboard';
import JobDetailsScreen from './JobDetailsScreen';
import JobScreen from './JobScreen';
import Alerts from './Alerts';
import Settings from './Settings';
import TalentProfileScreen from './TalentProfileScreen';
import EditProfileScreen from './EditProfileScreen';

// --- [NEW] Import the screens for saved and applied jobs ---
import AppliedJobsScreen from './AppliedJobsScreen';
import SavedJobsScreen from './SavedJobsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/**
 * [MODIFIED] The Dashboard Stack Navigator now includes all related screens.
 * This is the central hub for navigation starting from the "For You" tab.
 */
function DashboardStackNavigator() {
  return (
    <Stack.Navigator
      // Set default header styles for all screens in this stack
      screenOptions={{
        headerStyle: { backgroundColor: '#111' },
        headerTintColor: '#fff',
        headerBackTitleVisible: false, // Hides the previous screen's title on iOS back button
      }}
    >
      <Stack.Screen
        name="TalentDashboardView"
        component={TalentDashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="JobDetailsScreen" // This name must match what's used in navigation.navigate()
        component={JobDetailsScreen}
        options={{ title: 'Opportunity Details' }}
      />
      {/* --- [NEW] Add the new screens to the stack --- */}
      <Stack.Screen
        name="AppliedJobsScreen" // This name must match the navigation.navigate() call
        component={AppliedJobsScreen}
        options={{ title: 'My Applications' }}
      />
      <Stack.Screen
        name="SavedJobsScreen" // This name must match the navigation.navigate() call
        component={SavedJobsScreen}
        options={{ title: 'Saved Jobs' }}
      />
      {/* 
        NOTE: ApplyScreen has been removed from this stack as the application form
        is now integrated directly into JobDetailsScreen. This simplifies the flow.
      */}
    </Stack.Navigator>
  );
}

// This Profile stack remains unchanged and is correct
const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#111' },
        headerTintColor: '#fff',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="TalentProfileView"
        component={TalentProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
    </Stack.Navigator>
  );
};

// --- Main bottom tab navigator (no changes needed here) ---
const TalentTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#28a745',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#222',
          paddingBottom: 5,
          height: 60,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName;

          switch (route.name) {
            case 'DashboardStack':
              iconName = focused ? 'sparkles' : 'sparkles-outline';
              break;
            case 'Jobs':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'Alerts':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'ProfileStack':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'apps-outline';
          }
          return <Icon name={iconName} size={28} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DashboardStack"
        component={DashboardStackNavigator}
        options={{ title: 'For You' }}
      />
      <Tab.Screen name="Jobs" component={JobScreen} options={{ title: 'Browse' }}/>
      <Tab.Screen name="Alerts" component={Alerts} />
      <Tab.Screen
        name="ProfileStack"
        component={ProfileStackNavigator}
        options={{ title: 'Profile' }}
      />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
};

export default TalentTabs;