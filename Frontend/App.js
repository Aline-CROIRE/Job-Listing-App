import 'react-native-url-polyfill/auto';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { UserProvider } from './context/UserContext';
export default function App() {
  return (
    <UserProvider>
    {/* <NavigationContainer> */}
      <AppNavigator />
    {/* </NavigationContainer> */}
    </UserProvider>
  );
}