import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Make sure these values are correct!
const supabaseUrl = 'https://ncmcihzphfnyjznktwru.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jbWNpaHpwaGZueWp6bmt0d3J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MzkxNjMsImV4cCI6MjA1ODAxNTE2M30.wo0QzZ1DHPQUWsSqRfpxjXlIusV0rVE-99im3l8AtK8'; 

// Custom storage implementation
const customStorage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
      return;
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      return;
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
});

// Add debugging
console.log("Supabase client initialized with URL:", supabaseUrl);