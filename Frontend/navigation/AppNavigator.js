import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { UserContext } from '../context/UserContext';

import SplashScreen from '../screens/SplashScreen';
import UserTypeSelection from '../screens/UserTypeSelection';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

import TalentDashboard from '../screens/TalentDashboard';
import EmployerDashboard from '../screens/EmployerDashboard';
import AdminDashboard from '../screens/AdminDashboard';
import TalentTabs from '../screens/TalentTabs';
import EmployerTabs from '../screens/EmployerTabs';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loadingUser } = useContext(UserContext);

  if (loadingUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  const getInitialScreen = () => {
    if (!user) return 'Splash'; 
    switch (user.role) {
      case 'talent':
        return 'TalentDashboard';
      case 'employer':
        return 'EmployerDashboard';
      case 'admin':
        return 'AdminDashboard';
      default:
        return 'Login';
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={getInitialScreen()} screenOptions={{ headerShown: false }}>

        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="UserTypeSelection" component={UserTypeSelection} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        <Stack.Screen name="TalentDashboard" component={TalentTabs} />
        <Stack.Screen name="EmployerDashboard" component={EmployerTabs} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
