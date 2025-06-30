// App.js

/**
 * [THE FIX] Import the URL polyfill at the very top.
 * This must be the first import to run.
 */
import 'react-native-url-polyfill/auto';

import React from 'react';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import AppNavigator from './navigation/AppNavigator'; // Your root navigator

/**
 * This is the main component that starts your app.
 * It sets up the global state providers (Theme and User) and then
 * renders the main AppNavigator which handles all screen logic.
 */
export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <AppNavigator />
      </UserProvider>
    </ThemeProvider>
  );
}