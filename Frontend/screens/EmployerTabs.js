import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

// Import all necessary screens
import EmployerDashboard from './EmployerDashboard';
import PostJobScreen from './PostJobScreen';
import EmployerViewScreen from './EmployerViewScreen';
import JobDetailsScreen from './JobDetailsScreen';
import ProjectDetailsScreen from './ProjectDetailsScreen';
import EmployerProfile from './EmployerProfileScreen';
import EmployerAlertsScreen from './EmployerAlertsScreen'; // <-- Import new screen
import ChatScreen from './ChatScreen'; // <-- Import new screen

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const defaultStackOptions = {
    headerShown: false,
};

// A dedicated stack for the "View" tab to handle navigation to details
function ViewStackNavigator() {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="ViewPostings" component={EmployerViewScreen} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
      <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />
    </Stack.Navigator>
  );
}

// A dedicated stack for the new "Alerts" tab to handle navigation to chat
function AlertsStackNavigator() {
    return (
        <Stack.Navigator screenOptions={defaultStackOptions}>
            <Stack.Screen name="AlertsList" component={EmployerAlertsScreen} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
        </Stack.Navigator>
    );
}

// Main Employer Bottom Tab Navigator
const EmployerTabs = () => {
  return (
    <Tab.Navigator
        screenOptions={({ route }) => ({
            headerShown: false,
            tabBarStyle: {
                backgroundColor: '#000',
                borderTopWidth: 0,
                height: 70,
                paddingBottom: 10,
            },
            tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                switch (route.name) {
                    case 'Dashboard':
                        iconName = focused ? 'grid' : 'grid-outline';
                        break;
                    case 'Add':
                        iconName = focused ? 'add-circle' : 'add-circle-outline';
                        break;
                    case 'View':
                        iconName = focused ? 'briefcase' : 'briefcase-outline';
                        break;
                    case 'Alerts': // <-- New icon for alerts
                        iconName = focused ? 'notifications' : 'notifications-outline';
                        break;
                    case 'Profile':
                        iconName = focused ? 'person' : 'person-outline';
                        break;
                }
                return <Icon name={iconName} size={26} color={focused ? '#28a745' : '#fff'} />;
            },
            tabBarActiveTintColor: '#28a745',
            tabBarInactiveTintColor: '#fff',
            tabBarLabelStyle: { fontSize: 12 },
        })}
    >
        <Tab.Screen name="Dashboard" component={EmployerDashboard} />
        <Tab.Screen name="Add" component={PostJobScreen} />
        {/* The "View" tab now renders the stack, not the direct screen */}
        <Tab.Screen name="View" component={ViewStackNavigator} />
        {/* The new "Alerts" tab renders its own stack */}
        <Tab.Screen name="Alerts" component={AlertsStackNavigator} />
        <Tab.Screen name="Profile" component={EmployerProfile} />
    </Tab.Navigator>
  );
};

export default EmployerTabs;