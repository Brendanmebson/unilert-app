import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// Define theme colors
export const lightTheme = {
  backgroundColor: "#f8f9fa",
  cardBackground: "#ffffff",
  textColor: "#333333",
  secondaryTextColor: "#666666",
  accentColor: "#0A356D",
  secondaryAccentColor: "#FFD700",
  dangerColor: "#FF3B30",
  successColor: "#34C759",
  warningColor: "#FFCC00",
  infoColor: "#00AEEF",
  borderColor: "#e1e4e8",
  inputBackground: "#F7F7F7",
  placeholderColor: "#999999",
  buttonColor: "#0A356D",
  switchTrackOn: "#81b0ff",
  switchTrackOff: "#e2e2e2",
  switchThumbOn: "#0A356D",
  switchThumbOff: "#f4f3f4",
  statusBarStyle: "dark-content",
};

export const darkTheme = {
  backgroundColor: "#121212",
  cardBackground: "#1e1e1e",
  textColor: "#f1f1f1",
  secondaryTextColor: "#a0a0a0",
  accentColor: "#4dabf7",
  secondaryAccentColor: "#FFD700",
  dangerColor: "#FF453A",
  successColor: "#32D74B",
  warningColor: "#FFD60A",
  infoColor: "#64D2FF",
  borderColor: "#2c2c2c",
  inputBackground: "#2c2c2c",
  placeholderColor: "#777777",
  buttonColor: "#4dabf7",
  switchTrackOn: "#4dabf7",
  switchTrackOff: "#3a3a3a",
  switchThumbOn: "#ffffff",
  switchThumbOff: "#b7b7b7",
  statusBarStyle: "light-content",
};

// Create the context
const ThemeContext = createContext({
  theme: lightTheme,
  isDarkMode: false,
  toggleTheme: () => {},
});

// Custom hook for using the theme
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const systemColorScheme = useColorScheme();
  
  // Initialize theme from AsyncStorage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeSetting');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // Default to light mode
          setIsDarkMode(false);
        }
      } catch (error) {
        console.log('Error loading theme preference', error);
      }
    };
    
    loadThemePreference();
  }, []);
  
  // Toggle theme function
  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('themeSetting', newMode ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme preference', error);
    }
  };
  
  return (
    <ThemeContext.Provider 
      value={{ 
        theme: isDarkMode ? darkTheme : lightTheme, 
        isDarkMode, 
        toggleTheme 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};