import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

// Import all necessary screens
import JobScreen from './JobScreen';
import Alerts from './Alerts'; 
import Settings from './Settings';
import TalentProfileScreen from './TalentProfileScreen';
import EditProfileScreen from './EditProfileScreen'; // <-- Import the new screen

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/**
 * This is a new component. It's a StackNavigator that will manage the screens
 * within the "Profile" tab. This allows us to navigate from the main profile
 * view to the edit screen.
 */
function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Hides the header for this stack, so it feels seamless
      }}
    >
      <Stack.Screen 
        name="TalentProfileView" // Give it a unique name within this stack
        component={TalentProfileScreen} 
      />
      <Stack.Screen 
        name="EditProfile" // This name must match what you use in `navigation.navigate()`
        component={EditProfileScreen} 
        // You can add options here to show a header for the edit screen if you want
        options={{ 
          headerShown: true,
          title: 'Edit Profile',
          headerStyle: { backgroundColor: '#111' },
          headerTintColor: '#fff',
          headerTitleStyle: { color: '#fff' }
        }}
      />
    </Stack.Navigator>
  );
}

// This is the main exported component
export default function TalentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#28a745',
        tabBarInactiveTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#222',
          paddingBottom: 5,
          height: 60,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Jobs') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'ProfileStack') { // <-- [FIX] Match the new route name
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          } else if (route.name === 'TalentSettings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Icon name={iconName} size={28} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Jobs" component={JobScreen} />
      <Tab.Screen name="Alerts" component={Alerts} />

      {/* --- THIS IS THE MAIN CHANGE --- */}
      <Tab.Screen 
        name="ProfileStack" // Changed name to reflect it's a stack
        component={ProfileStackNavigator} // The component is now our new Stack Navigator
        options={{
          title: 'Profile' // This sets the text label on the tab bar
        }}
      />
      {/* ----------------------------- */}

      <Tab.Screen name="TalentSettings" component={Settings} />
    </Tab.Navigator>
  );
}