import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define theme colors
export const lightTheme = {
  primary: "#0A356D",
  background: "#f8f9fa",
  card: "#ffffff",
  text: "#333333",
  secondaryText: "#666666",
  accent: "#007bff",
  border: "#e1e4e8",
  danger: "#FF3B30",
  success: "#34C759",
  warning: "#FFD700",
  info: "#4dabf7",
  buttonBackground: "#003366",
  buttonText: "#ffffff",
  switchTrackOn: "#007bff",
  switchTrackOff: "#e2e2e2",
  switchThumbOn: "#ffffff",
  switchThumbOff: "#f4f3f4",
};

export const darkTheme = {
  primary: "#4dabf7",
  background: "#121212",
  card: "#1e1e1e",
  text: "#f1f1f1",
  secondaryText: "#a0a0a0",
  accent: "#4dabf7",
  border: "#2c2c2c",
  danger: "#ff6b6b",
  success: "#40c057",
  warning: "#fcc419",
  info: "#339af0",
  buttonBackground: "#4dabf7",
  buttonText: "#ffffff",
  switchTrackOn: "#4dabf7",
  switchTrackOff: "#3a3a3a",
  switchThumbOn: "#ffffff",
  switchThumbOff: "#b7b7b7",
};

// Create the context with default values
export const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
  setDarkMode: (value: any) => {},
});

export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        if (savedTheme !== null) {
          setIsDark(savedTheme === 'dark');
        } else {
          // Use system preference if no saved preference
          setIsDark(deviceTheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      }
    };
    
    loadThemePreference();
  }, []);

  // Save theme preference when it changes
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem('theme_preference', isDark ? 'dark' : 'light');
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    };
    
    saveThemePreference();
  }, [isDark]);

  const toggleTheme = () => {
    console.log("Toggle theme called, current isDark:", isDark);
    setIsDark(prevIsDark => !prevIsDark);
  };

  const setDarkMode = (value: boolean | ((prevState: boolean) => boolean)) => {
    console.log("Setting dark mode to:", value);
    setIsDark(value);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        setDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);