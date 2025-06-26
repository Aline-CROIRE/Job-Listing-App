import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import EmployerDashboard from './EmployerDashboard';
import EmployerProfile from './EmployerProfileScreen';
import PostJobScreen from './PostJobScreen';
import PostedJobScreen from './PostedJobScreen';
import EmployerSettings from './EmployerSettings';
import EmployerViewScreen from './EmployerViewScreen';

// import Applicants from './Applicants';

const Tab = createBottomTabNavigator();

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
                        case 'Applicants':
                            iconName = focused ? 'people' : 'people-outline';
                            break;
                        case 'Profile':
                            iconName = focused ? 'person' : 'person-outline';
                            break;
                        case 'Settings':
                            iconName = focused ? 'settings' : 'settings-outline';
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
            <Tab.Screen name="View" component={EmployerViewScreen} />
            <Tab.Screen name="Profile" component={EmployerProfile} />
            {/* <Tab.Screen name="Applicants" component={Applicants} /> */}
        </Tab.Navigator>
    );
};

export default EmployerTabs;
