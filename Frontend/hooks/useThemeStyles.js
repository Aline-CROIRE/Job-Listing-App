// hooks/useThemeStyles.js

import { useMemo, useContext } from 'react';
import { StyleSheet } from 'react-native';
import { ThemeContext } from '../context/ThemeContext'; // Your existing ThemeContext

// Define your color palettes for both themes
const lightColors = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  subtleText: '#6D6D72',
  icon: '#8E8E93',
  separator: '#C6C6C8',
  primary: '#28a745',
  danger: '#FF3B30',
  logoutButtonBackground: '#FF3B3015',
  // Add any other colors you need
};

const darkColors = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  subtleText: '#888888',
  icon: '#aaaaaa',
  separator: '#38383A',
  primary: '#28a745',
  danger: '#FF3B30',
  logoutButtonBackground: '#FF3B3025',
  // Add any other colors you need
};

/**
 * This custom hook replaces StyleSheet.create.
 * It provides the correct color palette to your style definitions
 * and memoizes the result for performance.
 *
 * @param {function} getStyles - A function that receives the colors object and returns a style object.
 */
export const useThemeStyles = (getStyles) => {
  const { theme } = useContext(ThemeContext);

  const colors = theme === 'light' ? lightColors : darkColors;

  // useMemo ensures that the styles are only re-calculated when the theme or the getStyles function changes.
  const styles = useMemo(() => getStyles(colors), [theme, getStyles]);

  return styles;
};