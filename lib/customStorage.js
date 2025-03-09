// lib/customStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom storage adapter that safely checks for environment
export const customStorage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.log('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      return await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.log('Error setting item in storage:', error);
    }
  },
  removeItem: async (key) => {
    try {
      return await AsyncStorage.removeItem(key);
    } catch (error) {
      console.log('Error removing item from storage:', error);
    }
  }
};